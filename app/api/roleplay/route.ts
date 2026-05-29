import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  // ── Debug: confirm the key is present before touching the SDK ──────────────
  console.log('API Key exists:', !!process.env.ANTHROPIC_API_KEY);
  console.log('API Key prefix:', process.env.ANTHROPIC_API_KEY?.substring(0, 10));

  // ── Key guard ───────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_key_here') {
    console.error('[roleplay] ANTHROPIC_API_KEY is not set in .env.local');
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is missing or is still the placeholder. Set it in .env.local and restart the dev server.' },
      { status: 500 }
    );
  }

  // Instantiate with the key passed explicitly — no ambiguity about which env
  // var the SDK picks up in different runtime environments.
  const client = new Anthropic({ apiKey });

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { systemPrompt?: string; conversationHistory?: unknown; staffMessage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const { systemPrompt, conversationHistory, staffMessage } = body;

  if (!systemPrompt || !staffMessage) {
    return NextResponse.json(
      { error: 'Missing required fields: systemPrompt and staffMessage' },
      { status: 400 }
    );
  }

  const conversationText =
    Array.isArray(conversationHistory) && conversationHistory.length > 0
      ? (conversationHistory as { role: string; text: string }[])
          .map((m) => `${m.role === 'guest' ? 'GUEST' : 'STAFF'}: ${m.text}`)
          .join('\n\n')
      : '(conversation just starting)';

  // ── Call the API ────────────────────────────────────────────────────────────
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `CONVERSATION SO FAR:\n\n${conversationText}\n\nSTAFF JUST SAID: ${staffMessage}\n\nReturn ONLY the JSON object — no markdown, no explanation.`,
        },
      ],
    });

    const rawText = message.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim();

    console.log('[roleplay] Raw model response:', rawText.substring(0, 200));

    // Strip markdown fences if the model wraps the JSON anyway
    const stripped = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    const match = stripped.match(/\{[\s\S]*\}/);

    if (!match) {
      console.error('[roleplay] No JSON found in response:', rawText);
      return NextResponse.json(
        { error: 'Model returned no parseable JSON', raw: rawText },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(match[0]);
    return NextResponse.json(parsed);

  } catch (error: unknown) {
    // Log the full error object so every field is visible in the terminal
    console.error('Anthropic SDK error:', error);

    // Surface Anthropic API errors (auth failures, rate limits, invalid model, etc.)
    if (
      error !== null &&
      typeof error === 'object' &&
      'status' in error &&
      'message' in error
    ) {
      const ae = error as { status: number; message: string; error?: unknown };
      console.error(`[roleplay] Anthropic error ${ae.status}:`, ae.message, ae.error ?? '');
      return NextResponse.json(
        { error: `Anthropic API error (${ae.status}): ${ae.message}`, detail: ae.error },
        { status: ae.status ?? 500 }
      );
    }

    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
