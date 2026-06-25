'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RotateCcw, Loader2, Lightbulb, Heart, Play, Zap, Brain, Trophy } from 'lucide-react';
import { SCENARIOS } from '@/lib/scenarios';
import type { Lesson } from '@/lib/curriculum';
import { calculateRoleplayXP, getWarmthLabel } from '@/lib/xp';
import { logLessonCompletion } from '@/lib/completions';

// ─── Constants ────────────────────────────────────────────────

const MAX_TURNS = 7;
// Pass/fail model. Warmth from the API is 1-10; the performance model works on
// a 0-100 warmth score (warmth × 10). To pass, the guest's warmth score must
// stay at PASS_WARMTH_SCORE+ for CONSECUTIVE_PASSES_REQUIRED turns in a row,
// and the session must run at least MIN_TURNS turns.
const MIN_TURNS = 3;
const PASS_WARMTH_SCORE = 55;
const CONSECUTIVE_PASSES_REQUIRED = 2;

// ─── Sub-components ──────────────────────────────────────────

function ScoreBar({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
        <span style={{ color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>{val}/{max}</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MiniStat({ label, val, max, color }: { label: string; val: number; max: number; color: string }) {
  return (
    <div style={{ padding: 14, background: 'var(--sand-warm)', borderRadius: 12 }}>
      <div className="label-mono" style={{ fontSize: 9 }}>{label}</div>
      <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, color, marginTop: 4, lineHeight: 1 }}>
        {val}<span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>/{max}</span>
      </div>
    </div>
  );
}

// ─── Timer bar ───────────────────────────────────────────────

interface TimerBarProps {
  totalSeconds: number;
  running: boolean;
  onExpire: () => void;
  resetKey: number;
  thinkPaused: boolean;
}

function TimerBar({ totalSeconds, running, onExpire, resetKey, thinkPaused }: TimerBarProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    expiredRef.current = false;
  }, [resetKey, totalSeconds]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!running || thinkPaused) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 0.05) {
          clearInterval(intervalRef.current!);
          if (!expiredRef.current) {
            expiredRef.current = true;
            // Defer parent setState out of this updater to avoid
            // "update while rendering a different component" error.
            setTimeout(() => onExpire(), 0);
          }
          return 0;
        }
        return prev - 0.05; // 50 ms tick
      });
    }, 50);

    return () => clearInterval(intervalRef.current!);
  }, [running, thinkPaused, onExpire]);

  const pct = (remaining / totalSeconds) * 100;
  const color = pct > 50 ? '#81B29A' : pct > 25 ? '#D4A574' : '#E07A5F';

  return (
    <div className="timer-bar-track">
      <div className="timer-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────

interface Message {
  role: 'system' | 'guest' | 'staff';
  text: string;
}

interface Totals {
  [key: string]: number;
}

interface ApplyPhaseProps {
  lesson: Lesson;
  moduleId: string;
  onComplete: () => void;
}

export default function ApplyPhase({ lesson, moduleId, onComplete }: ApplyPhaseProps) {
  const scenario = lesson.scenarioId ? SCENARIOS[lesson.scenarioId] : null;
  const startingWarmth = scenario?.startingWarmth ?? 5;

  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [warmth, setWarmth] = useState(startingWarmth);
  const [totals, setTotals] = useState<Totals>({});
  const [turnCount, setTurnCount] = useState(0);
  const [tip, setTip] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const [consecutiveGood, setConsecutiveGood] = useState(0);
  const [speedChip, setSpeedChip] = useState<'fast' | 'late' | null>(null);
  const [apiError, setApiError] = useState(false);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [thinkUsed, setThinkUsed] = useState(false);
  const [thinkActive, setThinkActive] = useState(false);
  const [thinkCountdown, setThinkCountdown] = useState(10);
  const thinkRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const turnStartRef = useRef<number>(Date.now());
  const timerSeconds = scenario?.timerSeconds ?? 45;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Log the Apply completion only on a passed roleplay (failed/capped sessions
  // don't count as completions). This is SEPARATE from the roleplay_sessions
  // row (warmth score + transcript) — both fire on a pass. Fire-and-forget.
  useEffect(() => {
    if (done && passed) {
      logLessonCompletion({ module_id: moduleId, lesson_id: lesson.id, phase: 'apply' });
    }
  }, [done, passed, moduleId, lesson.id]);

  const handleTimerExpire = useCallback(() => {
    if (done || isLoading) return;
    setWarmth((w) => Math.max(1, w - 1));
    setMessages((prev) => [
      ...prev,
      { role: 'system', text: '⏱ Timer expired — in a real scenario, the guest would already be waiting. Respond faster next time.' },
    ]);
  }, [done, isLoading]);

  const resetScenario = () => {
    setStarted(false);
    setMessages([]);
    setWarmth(startingWarmth);
    const init: Totals = {};
    scenario?.scoreKeys.forEach((k) => { init[k] = 0; });
    setTotals(init);
    setTurnCount(0);
    setDone(false);
    setPassed(false);
    setConsecutiveGood(0);
    setTip(null);
    setTimerRunning(false);
    setThinkUsed(false);
    setThinkActive(false);
    setSpeedChip(null);
    setApiError(false);
  };

  const startScenario = () => {
    setStarted(true);
    setWarmth(startingWarmth);
    setMessages([{ role: 'system', text: scenario!.opening }]);
    const init: Totals = {};
    scenario!.scoreKeys.forEach((k) => { init[k] = 0; });
    setTotals(init);
    setTimerRunning(true);
    turnStartRef.current = Date.now();
    setTimerKey((k) => k + 1);
  };

  const handleThink = () => {
    if (thinkUsed || !timerRunning) return;
    setThinkUsed(true);
    setThinkActive(true);
    setThinkCountdown(10);
    let count = 10;
    thinkRef.current = setInterval(() => {
      count -= 1;
      setThinkCountdown(count);
      if (count <= 0) {
        clearInterval(thinkRef.current!);
        setThinkActive(false);
      }
    }, 1000);
  };

  useEffect(() => () => { if (thinkRef.current) clearInterval(thinkRef.current); }, []);

  // ── API helper: one attempt with a 15 s hard timeout ────────
  const callRoleplayAPI = async (
    systemPrompt: string,
    history: Message[],
    staffMessage: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch('/api/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, conversationHistory: history, staffMessage }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || done || !scenario) return;

    const elapsed = (Date.now() - turnStartRef.current) / 1000;
    const wasQuick = elapsed < timerSeconds * 0.5;
    setSpeedChip(wasQuick ? 'fast' : null);

    // Snapshot the input now — we only clear it on success so the user
    // always has their text back if every retry fails.
    const savedInput = input;
    const newMsg: Message = { role: 'staff', text: savedInput };
    const updated = [...messages, newMsg];
    setMessages(updated);
    setIsLoading(true);
    setApiError(false);
    setTimerRunning(false);

    const history = updated.filter((m) => m.role !== 'system');

    // ── Retry loop: up to 3 attempts, 1 s between each ───────
    const MAX_RETRIES = 3;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;
    let lastErr: unknown = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1000));
      }
      try {
        data = await callRoleplayAPI(scenario.systemPrompt, history, savedInput);
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        console.warn(`[roleplay] attempt ${attempt + 1}/${MAX_RETRIES} failed:`, err);
      }
    }

    // ── All retries failed ────────────────────────────────────
    if (lastErr !== null || data === null) {
      setApiError(true);
      // Revert messages so the staff bubble disappears — it never got a reply.
      // The user still has their text in the input field.
      setMessages(messages);
      setTimerRunning(true);
      setTimerKey((k) => k + 1);
      turnStartRef.current = Date.now();
      setIsLoading(false);
      return;
    }

    // ── Success ───────────────────────────────────────────────
    setInput('');      // clear only now
    setApiError(false);

    const newWarmth: number = data.warmth ?? warmth;
    setWarmth(newWarmth);
    setTip(data.coach_tip ?? null);

    const newTotals = { ...totals };
    if (data.scores) {
      scenario.scoreKeys.forEach((k) => {
        if (data.scores[k] != null) {
          newTotals[k] = (newTotals[k] ?? 0) + data.scores[k];
        }
      });
    }
    setTotals(newTotals);

    const newTurn = turnCount + 1;
    setTurnCount(newTurn);

    setMessages([...updated, { role: 'guest', text: data.guest_reply ?? '…' }]);

    // ── Pass / fail evaluation ────────────────────────────────
    // A turn = one staff message + one guest reply. Warmth (1-10) maps to a
    // 0-100 warmth score (×10).
    const newWarmthScore = newWarmth * 10;
    const newConsecutiveGood =
      newWarmthScore >= PASS_WARMTH_SCORE ? consecutiveGood + 1 : 0;
    setConsecutiveGood(newConsecutiveGood);

    // PASS: warmth score ≥ 55 for 2 consecutive turns AND at least 3 turns.
    const didPass =
      newTurn >= MIN_TURNS && newConsecutiveGood >= CONSECUTIVE_PASSES_REQUIRED;
    // FAIL: reached the final turn without passing.
    const hitMaxTurns = newTurn >= MAX_TURNS;

    if (didPass) {
      setPassed(true);
      setTimeout(() => setDone(true), 1200);
    } else if (hitMaxTurns) {
      setPassed(false);
      setTimeout(() => setDone(true), 1200);
    } else {
      setTimerRunning(true);
      setTimerKey((k) => k + 1);
      turnStartRef.current = Date.now();
      setThinkActive(false);
    }

    setIsLoading(false);
  };

  // ── No scenario ──────────────────────────────────────────────
  if (!scenario) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--sand-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={28} color="var(--ink-soft)" />
        </div>
        <div className="label-mono">Apply</div>
        <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)', margin: '12px 0' }}>
          Live scenario coming soon
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 28 }}>
          The AI roleplay for this lesson is being finalized.
        </p>
        <button className="btn-brand" onClick={onComplete}>Finish lesson</button>
      </div>
    );
  }

  // ── Pre-start screen ─────────────────────────────────────────
  if (!started) {
    return (
      <div className="card" style={{ padding: 40, animation: 'fadeUp 0.4s ease' }}>
        <div className="label-mono" style={{ color: 'var(--brand)' }}>
          Scenario · {scenario.subtitle}
        </div>
        <h2 className="display" style={{ fontSize: 30, color: 'var(--brand-deep)', margin: '8px 0 16px', lineHeight: 1.15 }}>
          {scenario.title}
        </h2>
        <p className="scenario-brief" style={{ fontSize: 15.5, lineHeight: 1.65, color: 'var(--ink-soft)', marginBottom: 20, maxWidth: 600 }}>
          {scenario.description}
        </p>

        {/* Goal block */}
        <div style={{
          padding: '14px 18px',
          background: 'rgba(245,166,35,0.08)',
          border: '1px solid rgba(245,166,35,0.28)',
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <div className="label-mono" style={{ color: 'var(--brand)', marginBottom: 6, fontSize: 9 }}>Your goal</div>
          <div style={{ fontSize: 14.5, color: 'var(--brand-deep)', fontWeight: 600, lineHeight: 1.5 }}>
            {scenario.goal}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {scenario.tags.map((t) => <span key={t} className="chip">{t}</span>)}
          <span className="chip" style={{ background: 'rgba(245,166,35,0.15)', color: '#8a6000' }}>
            <Zap size={11} color="var(--brand)" /> {timerSeconds}s per turn
          </span>
          <span className="chip" style={{ background: 'rgba(129,178,154,0.15)', color: '#3d6b57' }}>
            {MAX_TURNS} turns max
          </span>
        </div>

        <div className="how-it-works" style={{ padding: '14px 18px', background: 'var(--sand-warm)', borderRadius: 12, marginBottom: 28, fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          <b style={{ color: 'var(--brand-deep)' }}>How it works:</b> Type your response as the server. You have <b>{timerSeconds} seconds</b> per turn and <b>{MAX_TURNS} turns total</b>. Respond quickly for a ⚡ speed bonus. Use the <b>Think</b> button (once) to pause and collect your thoughts. To pass, keep guest warmth at <b>55+</b> for <b>2 turns in a row</b> (minimum 3 turns).
        </div>

        <button className="btn-brand scenario-start-btn" onClick={startScenario}>
          <Play size={14} /> Begin scenario
        </button>
      </div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────
  if (done) {
    const maxPerKey = MAX_TURNS * 10;
    const totalScore = scenario.scoreKeys.reduce((a, k) => a + (totals[k] ?? 0), 0);
    const maxTotal = maxPerKey * scenario.scoreKeys.length;
    const avgPct = Math.round((totalScore / maxTotal) * 100);

    // Performance signal is 0-100 (API warmth 1-10 × 10). XP is the progress
    // signal — earned only on a pass, scaled by the final warmth score. No XP
    // is awarded on a fail; staff must retry and pass to earn it.
    const finalWarmthScore = warmth * 10;
    const xpEarned = calculateRoleplayXP(finalWarmthScore, passed);
    const warmthLabel = getWarmthLabel(finalWarmthScore);

    const warmthPct = ((warmth - 1) / 9) * 100;
    const warmthColor = warmthLabel.color;
    const warmthDelta = warmth - startingWarmth;

    return (
      <div className="card" style={{ padding: 40, animation: 'fadeUp 0.5s ease' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, margin: '0 auto 16px', borderRadius: '50%',
            background: passed ? 'var(--brand)' : 'var(--sand-deeper)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {passed
              ? <Trophy size={32} color="var(--brand-deep)" />
              : <Heart size={32} color="var(--ink-soft)" />
            }
          </div>
          <div className="label-mono">Scenario complete</div>
          <h2 className="display" style={{ fontSize: 34, color: 'var(--brand-deep)', margin: '6px 0 4px' }}>
            {passed ? 'You passed!' : 'Not yet — try again'}
          </h2>
          <div style={{ fontSize: 13, color: passed ? 'var(--brand)' : 'var(--ink-soft)', fontWeight: 700 }}>
            {passed
              ? `Warmth held at ${PASS_WARMTH_SCORE}+ for ${CONSECUTIVE_PASSES_REQUIRED} turns in a row`
              : `Keep warmth at ${PASS_WARMTH_SCORE}+ for ${CONSECUTIVE_PASSES_REQUIRED} turns in a row to pass`}
          </div>
        </div>

        {/* Final warmth score bar */}
        <div style={{ padding: '16px 20px', background: 'var(--sand-warm)', borderRadius: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
            <span style={{ color: 'var(--ink-soft)' }}>Final warmth score</span>
            <span style={{ fontWeight: 700, color: warmthColor }}>{finalWarmthScore} / 100 · {warmthLabel.label}</span>
          </div>
          <div style={{ height: 10, background: 'rgba(0,0,0,0.06)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${warmthPct}%`, background: warmthColor, transition: 'width 0.6s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)', marginTop: 7 }}>
            <span>Started at {startingWarmth * 10}/100</span>
            <span style={{ color: warmthDelta > 0 ? '#3d6b57' : warmthDelta < 0 ? '#8b4a3a' : 'var(--ink-soft)', fontWeight: warmthDelta !== 0 ? 600 : 400 }}>
              {warmthDelta > 0 ? `+${warmthDelta * 10} gained` : warmthDelta < 0 ? `${warmthDelta * 10} lost` : 'no change'}
            </span>
          </div>
        </div>

        {/* Pass / fail status + feedback */}
        <div style={{
          padding: '12px 16px',
          borderRadius: 12,
          marginBottom: 24,
          background: passed ? 'rgba(129,178,154,0.15)' : 'rgba(224,122,95,0.1)',
          border: `1px solid ${passed ? 'rgba(129,178,154,0.4)' : 'rgba(224,122,95,0.3)'}`,
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{passed ? '✅' : '⚠️'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: passed ? '#3d6b57' : '#8b4a3a', marginBottom: 3 }}>
              {passed ? 'Passed' : 'Not passed — give it another go'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              {passed
                ? scenario.goal
                : `Your warmth landed at ${warmthLabel.label.toLowerCase()} (${finalWarmthScore}/100). ${tip ?? 'Focus on genuine, specific warmth from the very first reply.'}`}
            </div>
          </div>
        </div>

        {/* Score grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${scenario.scoreKeys.length}, 1fr)`,
          gap: 12,
          marginBottom: 20,
        }}>
          {scenario.scoreKeys.map((k) => (
            <MiniStat
              key={k}
              label={scenario.scoreLabels[k]}
              val={totals[k] ?? 0}
              max={maxPerKey}
              color={scenario.scoreColors[k]}
            />
          ))}
        </div>

        {/* Summary row */}
        <div style={{
          display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
          fontSize: 13.5, color: 'var(--ink-soft)', marginBottom: 28,
          padding: '12px 0', borderTop: '1px solid var(--sand-deeper)',
        }}>
          <span>Average score <b style={{ color: 'var(--brand-deep)' }}>{avgPct}%</b></span>
          <span style={{ color: 'var(--sand-deeper)' }}>|</span>
          <span>XP earned <b style={{ color: passed ? 'var(--brand)' : 'var(--ink-soft)' }}>+{xpEarned}</b></span>
          <span style={{ color: 'var(--sand-deeper)' }}>|</span>
          <span>Turns played <b style={{ color: 'var(--brand-deep)' }}>{turnCount} / {MAX_TURNS}</b></span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-brand" onClick={resetScenario}>
            <RotateCcw size={14} /> Try again
          </button>
          <button className="btn-ghost" onClick={onComplete}>{passed ? 'Finish lesson' : 'Exit'}</button>
        </div>
      </div>
    );
  }

  // ── Live chat ────────────────────────────────────────────────
  const moodPct = ((warmth - 1) / 9) * 100;
  const moodColor = warmth <= 3 ? '#C25B43' : warmth <= 5 ? '#D4A574' : warmth <= 7 ? '#A8B89C' : '#81B29A';
  const maxPerKey = Math.max(turnCount * 10, 10);

  return (
    <div className="apply-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, animation: 'fadeUp 0.4s ease' }}>
      {/* Chat panel */}
      <div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Timer bar */}
          <TimerBar
            totalSeconds={timerSeconds}
            running={timerRunning}
            onExpire={handleTimerExpire}
            resetKey={timerKey}
            thinkPaused={thinkActive}
          />

          {/* Guest header */}
          <div style={{ padding: '14px 20px', background: 'var(--sand-warm)', borderBottom: '1px solid var(--sand-deeper)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--brand-mid), var(--brand-deep))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--brand)', fontFamily: 'Fraunces', fontSize: 15, fontWeight: 600,
              }}>
                G
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{scenario.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>{scenario.subtitle}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {speedChip && (
                  <span className={`speed-chip ${speedChip}`}>
                    {speedChip === 'fast' ? '⚡ Quick' : '🐢 Slow'}
                  </span>
                )}
                {/* Turn counter in header */}
                <div style={{
                  fontSize: 11.5, color: 'var(--ink-soft)',
                  background: 'rgba(0,0,0,0.05)', borderRadius: 6, padding: '2px 8px',
                }}>
                  Turn <b style={{ color: 'var(--brand-deep)' }}>{turnCount}</b> / {MAX_TURNS}
                </div>
                <div style={{ width: 1, height: 14, background: 'var(--sand-deeper)' }} />
                <div style={{ fontSize: 12, color: moodColor, fontWeight: 700 }}>
                  Warmth {warmth}/10
                </div>
              </div>
            </div>
            {/* Warmth bar */}
            <div style={{ marginTop: 10, height: 4, background: 'rgba(0,0,0,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${moodPct}%`, background: moodColor, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="chat-messages"
            style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, minHeight: 280, overflowY: 'auto' }}
          >
            {messages.map((m, i) =>
              m.role === 'system'
                ? <div key={i} className="msg-system">{m.text}</div>
                : <div key={i} className={m.role === 'guest' ? 'msg-guest' : 'msg-staff'}>{m.text}</div>
            )}
            {isLoading && (
              <div className="msg-guest" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{ padding: 16, borderTop: '1px solid var(--sand-deeper)' }}>
            {/* Think button row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
              <button
                className={`think-btn${thinkUsed ? ' used' : ''}`}
                onClick={handleThink}
                disabled={thinkUsed || !timerRunning}
                title="Pause timer for 10 seconds — like saying 'One moment' in real life. One use per scenario."
              >
                <Brain size={12} />
                {thinkActive ? `Thinking… ${thinkCountdown}s` : thinkUsed ? 'Think (used)' : 'Think  —  10s pause'}
              </button>
              {thinkActive && (
                <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                  Timer paused · collect your thoughts
                </span>
              )}
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                className="input-field"
                placeholder="Respond as the server at [Property]…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                disabled={isLoading}
              />
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                aria-label="Send"
              >
                {isLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />
                }
              </button>
            </div>
          </div>
        </div>

        {/* Inline network error — shown below the card, never as a guest bubble */}
        {apiError && (
          <div style={{
            marginTop: 8,
            fontSize: 12.5,
            color: 'var(--ink-soft)',
            textAlign: 'center',
            letterSpacing: '0.01em',
          }}>
            Network issue — please try again
          </div>
        )}
      </div>

      {/* Scoring panel */}
      <div>
        <div className="label-mono" style={{ marginBottom: 12 }}>Live scoring</div>
        {scenario.scoreKeys.map((k) => (
          <ScoreBar
            key={k}
            label={scenario.scoreLabels[k]}
            val={totals[k] ?? 0}
            max={maxPerKey}
            color={scenario.scoreColors[k]}
          />
        ))}

        {/* Coach tip */}
        {tip && (
          <div className="tip-card" key={turnCount} style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Lightbulb size={12} color="var(--brand)" />
              <span className="label-mono" style={{ color: '#8a6000' }}>Coach</span>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>{tip}</div>
          </div>
        )}

        {/* Turn counter */}
        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--sand-warm)', borderRadius: 10 }}>
          <div className="label-mono" style={{ fontSize: 9, marginBottom: 6 }}>Progress</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 500, color: 'var(--brand-deep)', lineHeight: 1, marginBottom: 8 }}>
            Turn {turnCount} <span style={{ fontSize: 14, color: 'var(--ink-soft)', fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}>of {MAX_TURNS}</span>
          </div>
          {/* Turn pip dots */}
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: MAX_TURNS }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: i < turnCount ? 'var(--brand)' : 'rgba(0,0,0,0.1)',
                  transition: 'background 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
