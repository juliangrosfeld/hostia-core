// ─── RATE LIMITING — shared limits + enforcement ─────────────────────────────
//
// Counters live in Postgres (supabase/migrations/add_rate_limits.sql) because
// they must be shared across serverless instances. The limiter this replaced
// was an in-memory Map, which on Vercel counted per instance and reset on every
// cold start — it loosened precisely as load rose.
//
// Every limit in the app is declared in LIMITS below, so what is protected (and
// how hard) is answerable by reading one object rather than grepping routes.
//
// FAIL-OPEN: if the RPC errors — most likely the migration has not been run —
// the request is ALLOWED and the failure is logged with a distinctive prefix. A
// limiter outage must not become an app outage. The consequence is that these
// limits do nothing until the migration is applied; watch for
// "[rate-limit] RPC failed" in the Vercel logs.
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface RateLimitRule {
  /** Namespace for the counter — keep unique per protected operation. */
  bucket: string;
  /** Max requests a single subject may make per window. */
  limit: number;
  windowSeconds: number;
  /** Shown to the caller in the 429 body. */
  message?: string;
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86_400;

// ── The limits ───────────────────────────────────────────────────────────────
// Sized to sit well above real use and well below what makes abuse worthwhile.
// A staff member works through a roleplay in ~7 turns, so 20/min is roughly
// three back-to-back scenarios a minute — unreachable by hand, cheap to cap.
export const LIMITS = {
  // Anthropic spend. The one route that costs real money per call.
  roleplayTurnPerUser: {
    bucket: 'roleplay:user',
    limit: 20,
    windowSeconds: MINUTE,
    message: 'You are sending messages too quickly. Please wait a moment.',
  },
  // Daily ceiling so a single compromised account cannot run up a month of
  // spend overnight while staying under the per-minute limit. Windows snap to
  // UTC, so this one resets at 20:00 Curaçao time rather than local midnight —
  // irrelevant for a ceiling nobody legitimately reaches, unlike streak days
  // (lib/streak.ts) where the local boundary is the whole point.
  roleplayTurnPerUserDaily: {
    bucket: 'roleplay:user:daily',
    limit: 500,
    windowSeconds: DAY,
    message: 'Daily practice limit reached. It resets tomorrow.',
  },
  // Pre-auth shield: charged before we even resolve the session, so an
  // unauthenticated flood cannot make us do auth work at Anthropic-route rates.
  roleplayTurnPerIp: {
    bucket: 'roleplay:ip',
    limit: 60,
    windowSeconds: MINUTE,
  },

  // Exam grading. Answers are graded server-side, so unlimited submissions let
  // a staffer converge on the answer key by trial and error. Generous enough
  // that an honest retry after failing is never blocked.
  examSubmitPerUser: {
    bucket: 'exam:submit',
    limit: 5,
    windowSeconds: 10 * MINUTE,
    message: 'Too many exam attempts. Please wait a few minutes before trying again.',
  },

  // Session logging — bounded by how fast roleplays can legitimately finish.
  roleplaySessionPerUser: {
    bucket: 'roleplay-session:write',
    limit: 60,
    windowSeconds: HOUR,
  },

  // Lesson phase writes. These are what XP and streaks are computed from, so
  // an unbounded flood is data pollution as much as DB load. A staff member
  // working hard writes a few dozen an hour.
  lessonCompletionPerUser: {
    bucket: 'lesson-completion:write',
    limit: 120,
    windowSeconds: HOUR,
  },

  // Public invite routes, keyed by IP (there is no session yet). GET validates
  // a token; POST creates a Supabase auth user, so it is held much tighter.
  inviteLookupPerIp: {
    bucket: 'invite:lookup',
    limit: 20,
    windowSeconds: MINUTE,
    message: 'Too many attempts. Please wait a minute and try again.',
  },
  inviteAcceptPerIp: {
    bucket: 'invite:accept',
    limit: 10,
    windowSeconds: HOUR,
    message: 'Too many attempts. Please wait before trying again.',
  },

  // Account creation by a manager/admin — caps mass-creation from one
  // compromised staff-side account.
  staffCreatePerUser: {
    bucket: 'staff:create',
    limit: 30,
    windowSeconds: HOUR,
    message: 'Too many accounts created. Please wait before adding more.',
  },

  // Uploads: admin-gated, but each one writes to storage and costs space.
  adminUploadPerUser: {
    bucket: 'admin:upload',
    limit: 40,
    windowSeconds: HOUR,
    message: 'Too many uploads. Please wait before uploading again.',
  },

  // Expensive reads. The manager dashboard pulls up to 10k sessions + 20k
  // completions per call; the admin dashboard scans every property. Well above
  // what the UI issues (one call per load, plus live refreshes).
  dashboardReadPerUser: {
    bucket: 'dashboard:read',
    limit: 60,
    windowSeconds: MINUTE,
  },
} as const satisfies Record<string, RateLimitRule>;

// ── Subjects ─────────────────────────────────────────────────────────────────
// Prefer the user id: it is the identity that actually spends money and takes
// exams. IP is the fallback for routes with no session, and is deliberately NOT
// used for authenticated routes — staff in one restaurant share a NAT address,
// so an IP limit would throttle a whole team together.
export const userSubject = (userId: string): string => `user:${userId}`;
export const ipSubject = (request: Request): string => `ip:${clientIp(request)}`;

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  // Vercel appends the real client IP as the LAST entry, and prepends any
  // client-supplied value — so the first entry is spoofable and the last is not.
  const fromForwarded = forwarded?.split(',').pop()?.trim();
  return fromForwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

// Record one hit against `rule` for `subject`. Returns null when the check
// could not be made (fail-open — see the header note).
export async function checkRateLimit(
  rule: RateLimitRule,
  subject: string,
): Promise<RateLimitResult | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('consume_rate_limit', {
      p_bucket: rule.bucket,
      p_subject: subject,
      p_limit: rule.limit,
      p_window_seconds: rule.windowSeconds,
    });

    if (error) {
      console.error(
        `[rate-limit] RPC failed for ${rule.bucket} (has add_rate_limits.sql been run?):`,
        error.message,
      );
      return null;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return null;

    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      resetAt: new Date(row.reset_at),
    };
  } catch (err) {
    console.error(`[rate-limit] RPC threw for ${rule.bucket}:`, err);
    return null;
  }
}

// The route-level guard. Returns a ready-to-return 429 when the caller is over
// the limit, or null to continue. Usage mirrors requireAdmin():
//
//   const limited = await enforceRateLimit(LIMITS.examSubmitPerUser, userSubject(profile.id));
//   if (limited) return limited;
export async function enforceRateLimit(
  rule: RateLimitRule,
  subject: string,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(rule, subject);
  if (!result || result.allowed) return null;

  const retryAfter = Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: rule.message ?? 'Too many requests. Please slow down and try again.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(rule.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt.getTime() / 1000)),
      },
    },
  );
}

// Enforce several rules against the same subject (e.g. a per-minute and a
// per-day ceiling). Returns the first 429, so the tightest breach is reported.
export async function enforceRateLimits(
  rules: readonly RateLimitRule[],
  subject: string,
): Promise<NextResponse | null> {
  for (const rule of rules) {
    const limited = await enforceRateLimit(rule, subject);
    if (limited) return limited;
  }
  return null;
}
