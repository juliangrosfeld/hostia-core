import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// ── Rate limiter ─────────────────────────────────────────────────────────────
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
export async function POST(request: NextRequest) {
  // Rate limit check
  const ip = getIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
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
  let body: { systemPrompt?: unknown; conversationHistory?: unknown; staffMessage?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  // Validate required fields exist and are strings
  const { systemPrompt, conversationHistory, staffMessage } = body;

  if (typeof systemPrompt !== 'string' || !systemPrompt.trim()) {
    return NextResponse.json({ error: 'Missing or invalid field: systemPrompt' }, { status: 400 });
  }
  if (typeof staffMessage !== 'string' || !staffMessage.trim()) {
    return NextResponse.json({ error: 'Missing or invalid field: staffMessage' }, { status: 400 });
  }

  // Length checks
  if (staffMessage.length > 500) {
    return NextResponse.json(
      { error: 'staffMessage exceeds maximum length of 500 characters' },
      { status: 400 }
    );
  }
  if (systemPrompt.length > 5000) {
    return NextResponse.json(
      { error: 'systemPrompt exceeds maximum length of 5000 characters' },
      { status: 400 }
    );
  }

  // Sanitize inputs
  const cleanSystemPrompt = stripHtml(systemPrompt);
  const cleanStaffMessage = stripHtml(staffMessage);

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
      system: cleanSystemPrompt,
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
