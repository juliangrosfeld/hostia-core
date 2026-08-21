import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SCENARIOS } from '@/lib/scenarios';
import { substituteProperty } from '@/lib/substitute-property';
import { signTurnProof } from '@/lib/roleplay-proof';
import { LIMITS, enforceRateLimit, enforceRateLimits, ipSubject, userSubject } from '@/lib/rate-limit';

interface PropertyPromptConfig {
  scenarioContext: string | null;
  propertyName: string | null;
}

// Look up what the caller's property contributes to the prompt: the
// `scenario_context` override (admin-authored venue context) and the property
// name used to replace the "[Property]" placeholder in scenario copy. The
// `property_name` override wins over the canonical properties.name — that key
// exists precisely to control prompt wording. Read with the service-role
// client because property_overrides is RLS-closed.
async function getPropertyPromptConfig(propertyId: string | null): Promise<PropertyPromptConfig> {
  if (!propertyId) return { scenarioContext: null, propertyName: null };
  try {
    const admin = createAdminClient();
    const [propRes, overrideRes] = await Promise.all([
      admin.from('properties').select('name').eq('id', propertyId).single(),
      admin
        .from('property_overrides')
        .select('key, value')
        .eq('property_id', propertyId)
        .in('key', ['scenario_context', 'property_name']),
    ]);

    const overrides = new Map(
      (overrideRes.data ?? []).map((o) => [o.key as string, (o.value as string | null)?.trim()])
    );
    return {
      scenarioContext: overrides.get('scenario_context') || null,
      propertyName: overrides.get('property_name') || propRes.data?.name?.trim() || null,
    };
  } catch {
    // Config is an enhancement — never block the roleplay on a lookup failure.
    return { scenarioContext: null, propertyName: null };
  }
}

// ── Input sanitization ───────────────────────────────────────────────────────
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

// ── Route handler ────────────────────────────────────────────────────────────
// SECURITY MODEL: this route spends Anthropic API credit, so it requires a
// signed-in user, and the system prompt is resolved SERVER-SIDE from the
// scenario catalog (the client sends only a scenarioId). Never accept a
// client-supplied prompt here — that turns the endpoint into a general-purpose
// LLM proxy on our API key.
export async function POST(request: NextRequest) {
  // Rate limit, layer 1 — per IP, charged BEFORE the session lookup so an
  // unauthenticated flood cannot make us do auth work at this route's rate.
  const ipLimited = await enforceRateLimit(LIMITS.roleplayTurnPerIp, ipSubject(request));
  if (ipLimited) return ipLimited;

  // Auth — must be a signed-in user (any role; staff run roleplays, managers
  // and admins preview them).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit, layer 2 — per USER, the identity that actually spends Anthropic
  // credit. Per-minute stops a runaway client loop; per-day caps what a single
  // compromised account can cost overnight while pacing itself under that.
  const userLimited = await enforceRateLimits(
    [LIMITS.roleplayTurnPerUser, LIMITS.roleplayTurnPerUserDaily],
    userSubject(user.id),
  );
  if (userLimited) return userLimited;

  // Key guard
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.error('[roleplay] ANTHROPIC_API_KEY is not set in .env.local');
    return NextResponse.json(
      { error: 'Server misconfiguration: API key is missing.' },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  // Parse body
  let body: { scenarioId?: unknown; conversationHistory?: unknown; staffMessage?: unknown; prevProof?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { scenarioId, conversationHistory, staffMessage, prevProof } = body;

  if (typeof scenarioId !== 'string' || !SCENARIOS[scenarioId]) {
    return NextResponse.json({ error: 'Missing or unknown field: scenarioId' }, { status: 400 });
  }
  if (typeof staffMessage !== 'string' || !staffMessage.trim()) {
    return NextResponse.json({ error: 'Missing or invalid field: staffMessage' }, { status: 400 });
  }
  // prevProof chains this turn to the run so far (absent on the first turn).
  if (prevProof !== undefined && prevProof !== null && typeof prevProof !== 'string') {
    return NextResponse.json({ error: 'Invalid field: prevProof' }, { status: 400 });
  }

  // Length check
  if (staffMessage.length > 500) {
    return NextResponse.json(
      { error: 'staffMessage exceeds maximum length of 500 characters' },
      { status: 400 }
    );
  }

  // Sanitize the user-supplied message
  const cleanStaffMessage = stripHtml(staffMessage);

  // Server-side system prompt: the scenario catalog is the source of truth.
  let systemPrompt = SCENARIOS[scenarioId].systemPrompt;

  // Inject the client's venue context (configured in the GLAD AI admin panel)
  // so the AI guest behaves as if it's at their property.
  const { data: profile } = await supabase
    .from('users')
    .select('property_id')
    .eq('auth_id', user.id)
    .single();
  const { scenarioContext, propertyName } = await getPropertyPromptConfig(
    profile?.property_id ?? null
  );
  if (scenarioContext) {
    systemPrompt = `${systemPrompt}\n\nVENUE CONTEXT (use this for all property-specific details):\n${stripHtml(scenarioContext)}`;
  }

  // Replace the "[Property]" placeholder AFTER assembly so occurrences in the
  // admin-authored context are covered too. Without this, the model is told
  // it's at "[Property]" and can echo the literal placeholder back to staff.
  systemPrompt = substituteProperty(systemPrompt, propertyName);

  // Shared warmth calibration, appended to every scenario prompt. Scenario
  // prompts anchor warmth at a starting level, and the model tends to ramp it
  // up gradually from there — which made a flawless session average out well
  // below 100 (the stored score is the per-turn average). Grading must sit on
  // the current reply's merits alone, so a perfect run can actually reach 100.
  systemPrompt += `

WARMTH CALIBRATION:
- "warmth" grades how the guest feels about the SERVICE right now, after the staff's latest reply — not how long the relationship has lasted. The scenario's "starts at N" is only the guest's mood before the staff first speaks; it never limits how high one reply can take them.
- There is NO ramp-up: a genuinely flawless reply earns warmth 10 immediately, even on the very first turn. Never hold a 10 back just because the conversation only began.
- The same applies to the per-turn "scores": a flawless response on a dimension earns a 10 on that dimension.
- Scenario goals or completion rules that mention reaching warmth 9 (or any number) define PASSING, not perfection — they are not the top of the scale. 10 remains available above them.
- Stay strict at the top: 10 means flawless — warm, specific, natural, and exactly right for this guest and moment. Merely good responses earn 7-9, not 10.`;

  const conversationText =
    Array.isArray(conversationHistory) && conversationHistory.length > 0
      ? (conversationHistory as { role: string; text: string }[])
          .map((m) => `${m.role === 'guest' ? 'GUEST' : 'STAFF'}: ${stripHtml(String(m.text ?? ''))}`)
          .join('\n\n')
      : '(conversation just starting)';

  // Call the API
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `CONVERSATION SO FAR:\n\n${conversationText}\n\nSTAFF JUST SAID: ${cleanStaffMessage}\n\nReturn ONLY the JSON object — no markdown, no explanation.`,
        },
      ],
    });

    const rawText = message.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim();

    // Strip markdown fences if the model wraps the JSON anyway
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    const match = stripped.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('[roleplay] No JSON found in response:', rawText.substring(0, 200));
      return NextResponse.json(
        { error: 'Model returned no parseable JSON' },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(match[0]);

    // Normalize warmth SERVER-SIDE (integer, clamped 1-10) and overwrite it in
    // the response, so the value the client displays and the value signed into
    // the proof are guaranteed identical. A response without usable warmth is
    // an error — the client's retry loop handles it like any other failure.
    const rawWarmth = Number(parsed.warmth);
    if (!Number.isFinite(rawWarmth)) {
      console.error('[roleplay] Model returned no usable warmth:', String(parsed.warmth));
      return NextResponse.json({ error: 'Model returned no usable warmth' }, { status: 500 });
    }
    const warmth = Math.min(10, Math.max(1, Math.round(rawWarmth)));
    parsed.warmth = warmth;

    // Sign this turn's warmth into the proof chain. A missing secret returns
    // null → respond without a proof (session will be stored unverified); an
    // invalid prevProof is client tampering → reject.
    const signed = signTurnProof({
      authId: user.id,
      scenarioId,
      warmth,
      prevProof: typeof prevProof === 'string' ? prevProof : null,
    });
    if (signed && 'error' in signed) {
      return NextResponse.json({ error: signed.error }, { status: 400 });
    }
    if (signed) parsed.proof = signed.proof;

    return NextResponse.json(parsed);

  } catch (error: unknown) {
    console.error('Anthropic SDK error:', error);

    if (
      error !== null &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
    ) {
      const ae = error as { status: number; message: string; error?: unknown };
      return NextResponse.json(
        { error: `Anthropic API error (${ae.status}): ${ae.message}` },
        { status: ae.status ?? 500 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
