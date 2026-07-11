'use client';

import { useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Trophy, Layers, ListOrdered, Timer, Flag,
  CheckCircle2, RotateCcw, Lock,
} from 'lucide-react';
import type { Phase } from '@/lib/curriculum';
import {
  type ExamConfig, type ExamAnswers, EXAM_PASS_SCORE,
} from '@/lib/exam';
import { substitutePropertyDeep } from '@/lib/substitute-property';
import { bumpProgressVersion } from '@/lib/progress-refresh';
import SortMatchRound from './SortMatchRound';
import SequenceRound from './SequenceRound';
import SprintRound from './SprintRound';
import FinalChallengeRound from './FinalChallengeRound';

// The Phase certification exam — orchestrates the four rounds every track
// shares: Sort & Match → Sequence Builder → Scenario Sprint → Final Challenge.
// Answers are collected locally and graded SERVER-SIDE by POST /api/exam,
// which writes the phase_completions row on a pass (badge + next phase
// unlock). No XP is involved anywhere in this flow.

interface ExamViewProps {
  config: ExamConfig;
  phase: Phase; // the phase being certified (title, number, certification_title)
  propertyName: string | null;
  onExit: () => void;
}

type Stage = 'intro' | 'round-intro' | 'round-play' | 'submitting' | 'error' | 'results';

interface ServerResult {
  passed: boolean;
  overall: number;
  roundScores: [number, number, number, number];
  certificationTitle: string;
}

const ROUND_ICONS = [Layers, ListOrdered, Timer, Flag] as const;

export default function ExamView({ config: rawConfig, phase, propertyName, onExit }: ExamViewProps) {
  // Authored content uses the "[Property]" placeholder; substitute once here,
  // same as the staff page does for the curriculum.
  const config = useMemo(
    () => substitutePropertyDeep(rawConfig, propertyName),
    [rawConfig, propertyName],
  );

  const [stage, setStage] = useState<Stage>('intro');
  const [roundIdx, setRoundIdx] = useState(0);
  const [result, setResult] = useState<ServerResult | null>(null);
  const answersRef = useRef<Partial<ExamAnswers>>({});

  const round = config.rounds[roundIdx];
  const RoundIcon = ROUND_ICONS[roundIdx];

  const submit = async () => {
    setStage('submitting');
    try {
      const res = await fetch('/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      if (!res.ok) throw new Error(`Exam submission failed (${res.status})`);
      const data = (await res.json()) as ServerResult;
      setResult(data);
      setStage('results');
      // A pass creates the phase completion → home view re-derives phases on
      // the next fetch; bump so it happens without a reload.
      if (data.passed) bumpProgressVersion();
    } catch {
      setStage('error');
    }
  };

  const handleRoundComplete = (roundAnswers: unknown) => {
    const key = (['sortMatch', 'sequence', 'sprint', 'finalChallenge'] as const)[roundIdx];
    answersRef.current = { ...answersRef.current, [key]: roundAnswers };
    if (roundIdx + 1 >= config.rounds.length) {
      submit();
    } else {
      setRoundIdx(roundIdx + 1);
      setStage('round-intro');
    }
  };

  const restart = () => {
    answersRef.current = {};
    setResult(null);
    setRoundIdx(0);
    setStage('intro');
  };

  const confirmExit = () => {
    if (stage === 'intro' || stage === 'results') return onExit();
    if (window.confirm('Leave the exam? Your progress in this attempt will be lost.')) onExit();
  };

  return (
    <div className="page animate-fade-up">
      <div className="container" style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button className="btn-ghost-sm" onClick={confirmExit} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronLeft size={15} /> Exit
          </button>
          <div className="label-mono" style={{ color: '#B8860B' }}>
            🏆 Phase {phase.phase_number} Certification Exam
          </div>
        </div>

        {/* ── Exam intro ── */}
        {stage === 'intro' && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%', background: 'rgba(184,134,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trophy size={32} color="#B8860B" />
            </div>
            <div className="label-mono">{phase.title}</div>
            <h1 className="display" style={{ fontSize: 34, color: 'var(--brand-deep)', margin: '8px 0 12px' }}>
              Prove what you know.
            </h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 28px' }}>
              Four rounds covering everything from Phase {phase.phase_number}. Score{' '}
              <b style={{ color: 'var(--brand-deep)' }}>{EXAM_PASS_SCORE}% or higher</b> overall to earn your{' '}
              <b style={{ color: 'var(--brand-deep)' }}>{phase.certification_title}</b>{' '}badge and unlock the next phase.
              You can retake the exam if you don&apos;t pass.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 440, margin: '0 auto 32px', textAlign: 'left' }}>
              {config.rounds.map((r, i) => {
                const Icon = ROUND_ICONS[i];
                return (
                  <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 12, background: 'var(--sand-warm)' }}>
                    <Icon size={18} color="var(--brand-deep)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Round {i + 1} · {r.title}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button className="btn-brand" onClick={() => setStage('round-intro')}>
              Start the exam <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Round intro ── */}
        {stage === 'round-intro' && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--sand-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RoundIcon size={26} color="var(--brand-deep)" />
            </div>
            <div className="label-mono">Round {roundIdx + 1} of {config.rounds.length}</div>
            <h2 className="display" style={{ fontSize: 30, color: 'var(--brand-deep)', margin: '8px 0 14px' }}>
              {round.title}
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 12px' }}>
              {round.instructions}
            </p>
            {round.type === 'final-challenge' && (
              <p style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 15, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 12px' }}>
                {round.intro}
              </p>
            )}
            <div style={{ marginTop: 20 }}>
              <button className="btn-brand" onClick={() => setStage('round-play')}>
                {round.type === 'sprint' ? 'Start the clock' : `Start round ${roundIdx + 1}`} <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Round play ── */}
        {stage === 'round-play' && round.type === 'sort-match' && (
          <SortMatchRound round={round} onComplete={handleRoundComplete} />
        )}
        {stage === 'round-play' && round.type === 'sequence' && (
          <SequenceRound round={round} onComplete={handleRoundComplete} />
        )}
        {stage === 'round-play' && round.type === 'sprint' && (
          <SprintRound round={round} onComplete={handleRoundComplete} />
        )}
        {stage === 'round-play' && round.type === 'final-challenge' && (
          <FinalChallengeRound round={round} onComplete={handleRoundComplete} />
        )}

        {/* ── Submitting ── */}
        {stage === 'submitting' && (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div className="label-mono">Grading</div>
            <h2 className="display" style={{ fontSize: 28, color: 'var(--brand-deep)', margin: '8px 0' }}>
              Scoring your exam…
            </h2>
          </div>
        )}

        {/* ── Submit error ── */}
        {stage === 'error' && (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <h2 className="display" style={{ fontSize: 26, color: 'var(--brand-deep)', margin: '0 0 12px' }}>
              We couldn&apos;t submit your exam
            </h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14, marginBottom: 24 }}>
              Your answers are safe on this screen — check your connection and try again.
            </p>
            <button className="btn-brand" onClick={submit}>
              <RotateCcw size={15} /> Retry submission
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {stage === 'results' && result && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            {result.passed ? (
              <>
                <div style={{ width: 88, height: 88, margin: '0 auto 20px', borderRadius: '50%', background: 'linear-gradient(135deg, #B8860B, #F5A623)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 32px rgba(184,134,11,0.35)' }}>
                  <Trophy size={40} color="white" />
                </div>
                <div className="label-mono" style={{ color: '#B8860B' }}>Certification earned</div>
                <h2 className="display" style={{ fontSize: 36, color: 'var(--brand-deep)', margin: '8px 0 6px' }}>
                  {result.certificationTitle}
                </h2>
                <p style={{ fontSize: 15, color: 'var(--ink-soft)', margin: '0 0 8px' }}>
                  Final score: <b style={{ color: 'var(--brand-deep)' }}>{result.overall}%</b>
                </p>
                <p style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--sage-deep)', fontWeight: 600, margin: '0 0 28px' }}>
                  <CheckCircle2 size={16} /> Phase {phase.phase_number + 1} is now unlocked
                </p>
              </>
            ) : (
              <>
                <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--sand-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={30} color="var(--ink-soft)" />
                </div>
                <div className="label-mono">Not this time</div>
                <h2 className="display" style={{ fontSize: 34, color: 'var(--brand-deep)', margin: '8px 0 6px' }}>
                  {result.overall}%
                </h2>
                <p style={{ fontSize: 14, color: 'var(--ink-soft)', maxWidth: 440, margin: '0 auto 28px', lineHeight: 1.6 }}>
                  You need {EXAM_PASS_SCORE}% to earn the certification. Review your weakest rounds below, brush up on those modules, and take it again — the exam will be waiting.
                </p>
              </>
            )}

            {/* Round breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 440, margin: '0 auto 28px', textAlign: 'left' }}>
              {config.rounds.map((r, i) => {
                const score = result.roundScores[i];
                const Icon = ROUND_ICONS[i];
                return (
                  <div key={r.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--sand-warm)' }}>
                    <Icon size={16} color="var(--brand-deep)" />
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{r.title}</span>
                    <div style={{ width: 90, height: 6, borderRadius: 999, background: 'var(--sand-deeper)', overflow: 'hidden' }}>
                      <div style={{ width: `${score}%`, height: '100%', background: score >= EXAM_PASS_SCORE ? 'var(--sage)' : 'var(--brand)', borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums', width: 42, textAlign: 'right' }}>{score}%</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {!result.passed && (
                <button className="btn-brand" onClick={restart}>
                  <RotateCcw size={15} /> Retake exam
                </button>
              )}
              <button className={result.passed ? 'btn-brand' : 'btn-ghost'} onClick={onExit}>
                {result.passed ? 'Back to your journey' : 'Back to training'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
