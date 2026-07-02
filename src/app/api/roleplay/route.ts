import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SCENARIOS } from '@/lib/scenarios';

// Look up the caller's property `scenario_context` override, if one is
// configured. This lets the admin panel give every roleplay scenario the
// client's specific venue context without touching scenario code. Read with
// the service-role client because property_overrides is RLS-closed.
async function getScenarioContext(propertyId: string | null): Promise<string | null> {
  if (!propertyId) return null;
  try {
    const admin = createAdminClient();
    const { data: override } = await admin
      .from('property_overrides')
      .select('value')
      .eq('property_id', propertyId)
      .eq('key', 'scenario_context')
      .maybeSingle();

    const value = override?.value?.trim();
    return value ? value : null;
  } catch {
    // Context is an enhancement — never block the roleplay on a lookup failure.
    return null;
  }
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
// Per-instance, in-memory — a cheap first shield, not the security boundary.
// The security boundary is the auth check below.
const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;

const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

function getIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;

  entry.count++;
  return false;
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
  // Rate limit check — cheap shield before any DB work.
  const ip = getIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  // Auth — must be a signed-in user (any role; staff run roleplays, managers
  // and admins preview them).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  let body: { scenarioId?: unknown; conversationHistory?: unknown; staffMessage?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { scenarioId, conversationHistory, staffMessage } = body;

  if (typeof scenarioId !== 'string' || !SCENARIOS[scenarioId]) {
    return NextResponse.json({ error: 'Missing or unknown field: scenarioId' }, { status: 400 });
  }
  if (typeof staffMessage !== 'string' || !staffMessage.trim()) {
    return NextResponse.json({ error: 'Missing or invalid field: staffMessage' }, { status: 400 });
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
  const scenarioContext = await getScenarioContext(profile?.property_id ?? null);
  if (scenarioContext) {
    systemPrompt = `${systemPrompt}\n\nVENUE CONTEXT (use this for all property-specific details):\n${stripHtml(scenarioContext)}`;
  }

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
