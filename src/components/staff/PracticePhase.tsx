'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, Check, Trophy, Star, RotateCcw } from 'lucide-react';
import type { Lesson } from '@/lib/curriculum';
import { logLessonCompletion } from '@/lib/completions';
import { PRACTICE_PASS_RATIO } from '@/lib/config';

interface PracticePhaseProps {
  lesson: Lesson;
  moduleId: string;
  onAdvance: () => void;
}

export default function PracticePhase({ lesson, moduleId, onAdvance }: PracticePhaseProps) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  // Per-question correctness, appended when an answer locks in (options
  // disable after selection, so a recorded result is final for the run).
  // Drives the progress pips only — score/pass logic reads `score`, not this.
  const [results, setResults] = useState<boolean[]>([]);

  const quiz = lesson.quiz;

  // Passing requires PRACTICE_PASS_RATIO of the questions correct (4/5 on the
  // standard quiz). Advancing — and the practice completion — is gated on it.
  const passNeeded = Math.ceil(quiz.length * PRACTICE_PASS_RATIO);
  const passed = score >= passNeeded;

  // Log the practice completion once the quiz is finished AND passed.
  // Fire-and-forget; a failed run logs nothing so retrying stays required.
  useEffect(() => {
    if (done && passed) {
      logLessonCompletion({ module_id: moduleId, lesson_id: lesson.id, phase: 'practice' });
    }
  }, [done, passed, moduleId, lesson.id]);

  const retryQuiz = () => {
    setQIdx(0);
    setSelected(null);
    setScore(0);
    setDone(false);
    setResults([]);
  };

  // If no quiz content for this lesson, advancing past it still completes the
  // practice phase for progress tracking.
  const handleEmptyAdvance = () => {
    logLessonCompletion({ module_id: moduleId, lesson_id: lesson.id, phase: 'practice' });
    onAdvance();
  };

  // If no quiz content for this lesson
  if (quiz.length === 0) {
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Star size={28} color="var(--brand-deep)" />
        </div>
        <div className="label-mono">Practice</div>
        <h2 className="display" style={{ fontSize: 32, color: 'var(--brand-deep)', margin: '8px 0 16px' }}>
          Quiz coming soon
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, marginBottom: 28 }}>
          Practice questions for this lesson are being prepared.
        </p>
        <button className="btn-brand" onClick={handleEmptyAdvance}>
          Go to Apply <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  const q = quiz[qIdx];
  const isCorrect = selected === q.correct;

  const handleNext = () => {
    const newScore = selected === q.correct ? score + 1 : score;
    if (qIdx === quiz.length - 1) {
      setScore(newScore);
      setDone(true);
    } else {
      setScore(newScore);
      setQIdx(qIdx + 1);
      setSelected(null);
    }
  };

  // Results screen
  if (done) {
    const pct = Math.round((score / quiz.length) * 100);
    return (
      <div className="card" style={{ padding: 48, textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
        <div style={{ width: 72, height: 72, margin: '0 auto 20px', borderRadius: '50%', background: passed ? 'var(--sage)' : 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {passed
            ? <Trophy size={32} color="white" />
            : <Star size={32} color="var(--brand-deep)" />
          }
        </div>
        <div className="label-mono">{passed ? 'Practice complete' : 'Not quite there yet'}</div>
        <h2 className="display" style={{ fontSize: 44, color: 'var(--brand-deep)', margin: '8px 0' }}>
          {score}/{quiz.length} correct
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: 15, maxWidth: 420, margin: '0 auto 28px', lineHeight: 1.6 }}>
          {pct === 100
            ? 'Perfect. You know this cold. Let\'s take it live.'
            : passed
            ? 'Strong work. One quick review and you\'ll be flawless.'
            : `You need ${passNeeded}/${quiz.length} to move on. Review the feedback and give it another go — the questions stay the same.`}
        </p>
        {passed ? (
          <button className="btn-brand" onClick={onAdvance}>
            {lesson.scenarioId ? 'Try a live scenario' : 'Finish lesson'} <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn-brand" onClick={retryQuiz}>
            <RotateCcw size={15} /> Retry quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      {/* Progress bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="label-mono">Question {qIdx + 1} of {quiz.length}</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {quiz.map((_, i) => (
            <div
              key={i}
              style={{
                width: 24, height: 4, borderRadius: 2,
                // Answered questions show their result (green/red); the current
                // unanswered one is brand-colored; the rest are neutral.
                background: i < results.length
                  ? (results[i] ? 'var(--sage)' : 'var(--coral)')
                  : i === qIdx ? 'var(--brand)' : 'var(--sand-deeper)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 36 }}>
        <h3 className="display" style={{ fontSize: 22, color: 'var(--brand-deep)', lineHeight: 1.35, marginBottom: 28 }}>
          {q.q}
        </h3>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            let cls = 'quiz-opt';
            if (selected !== null) {
              if (i === q.correct) cls += ' is-correct';
              else if (i === selected) cls += ' is-wrong';
              else cls += ' is-faded';
            } else if (selected === i) {
              cls += ' is-selected';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => {
                  if (selected !== null) return;
                  setSelected(i);
                  setResults((prev) => [...prev, i === q.correct]);
                }}
                disabled={selected !== null}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{opt}</span>
                {selected !== null && i === q.correct && <Check size={16} color="var(--sage-deep)" />}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {selected !== null && (
          <div className={`feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>
              {isCorrect ? '✓ Correct' : '✗ Not quite'}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.55 }}>{q.explain}</div>
          </div>
        )}
      </div>

      {selected !== null && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn-brand" onClick={handleNext}>
            {qIdx === quiz.length - 1 ? 'See results' : 'Next question'} <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
