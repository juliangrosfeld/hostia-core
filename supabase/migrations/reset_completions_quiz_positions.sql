-- Content-change re-attestation reset — quiz answer-position rebalance.
-- Policy: DEDUP_PROPOSAL.md Part I (same pattern as
-- reset_completions_dedup_step1.sql). Decided and applied 2026-08-24.
--
-- ============================================================================
-- WHAT CHANGED
--   Every quiz question in src/lib/curriculum.ts was checked for correct-answer
--   position clustering. 237 of 313 questions had their `options` array
--   cyclically rotated so the correct answer moves to a new position; `correct`
--   was updated to match. NOTHING ELSE CHANGED — question text, option text,
--   explanations and scoring logic are byte-identical, verified by re-parsing
--   the file and diffing option sets and correct-answer strings per question.
--
--   Correct-answer distribution across all 313 questions:
--     before   A 3 (1.0%)   B 242 (77.3%)   C 64 (20.4%)   D 4 (1.3%)
--     after    A 78 (24.9%) B 79 (25.2%)    C 79 (25.2%)   D 77 (24.6%)
--   Lessons with all answers in one position: 30 -> 0.
--
-- WHY THIS RESETS `practice` ONLY
--   Quiz options render in the practice phase and nowhere else. `learn` and
--   `apply` content is untouched, so their rows stand. All 63 curriculum
--   lessons have at least one rotated question, so the reset is every practice
--   row for a current lesson.
--
-- EXECUTED 2026-08-24.
--   rows deleted   : 205 (lesson_completions 622 -> 417)
--   lessons        : 53 of the 63 had rows
--   staff affected : 11 — all test/review/verify/demo/pilot accounts
--   untouched      : learn (226), apply (182), phase_completions (2),
--                    roleplay_sessions
--   deliberately excluded: lesson_id = 'our-menu' (9 practice rows). That
--                    lesson was removed from the curriculum in 7f5f74c, so no
--                    quiz of its changed. Orphaned rows, not this reset's job.
--
-- STREAK IMPACT — checked per account before running, not assumed.
--   `practice` is a required phase for every lesson, so this drops all 11
--   accounts to 0 fully completed lessons. 9 of 11 lose past earned days,
--   15 days total, irreversibly (redoing a quiz re-pins the completion to
--   today rather than restoring the original date):
--     Testing123        4 days  2026-07-01, 07-03, 07-05, 07-06
--     BrgrTest          3 days  2026-07-06, 07-07, 07-10
--     Allan Boye        2 days  2026-07-01, 07-07
--     Test (Manou)      1 day   2026-07-07
--     Exam Review       1 day   2026-07-11
--     FC Review         1 day   2026-07-12
--     FD Review         1 day   2026-07-12
--     Julian Grosfeld   1 day   2026-07-22
--     Mauricio Castro   1 day   2026-08-10
--   FC Verify and FD Verify lose no day: each passed a phase exam on their one
--   active day, and phase_completions earns a day independently of any lesson.
--
--   NO LIVE STREAK WAS BROKEN. computeStreak (lib/streak.ts) walks backward
--   from today and stops at the first gap; it never reads further into history.
--   The most recent earned day on the platform was 2026-08-10, so every account
--   already displayed a streak of 0 and still does. The manager dashboard's
--   14-day weekly-lessons KPI reads the same derivation and was 0/0 either way.
--
-- RUN ORDER: this was run BEFORE the content commit reached production,
-- inverting the Step 1 order, at the operator's explicit instruction. Any
-- practice row written between this DELETE and the deploy attests the OLD
-- answer positions and must be deleted again. Checked immediately after: see
-- the post-run note at the bottom of this file.
--
-- Re-running this file is NOT a no-op in the way Step 1's was: it deletes any
-- practice rows written since. That is the intended behaviour here.
--
-- Data, not schema. Service role, Supabase SQL editor. lesson_completions has
-- no DELETE policy for staff or managers by design (add_lesson_completions.sql).
-- ============================================================================

-- VERIFY BY COUNT FIRST. Expect 205 across 53 lessons before running the DELETE.
--
-- SELECT phase, lesson_id, count(*) FROM lesson_completions
--  WHERE phase = 'practice' AND lesson_id IN ( ...the list below... )
--  GROUP BY phase, lesson_id ORDER BY count(*) DESC, lesson_id;

BEGIN;

DELETE FROM lesson_completions
WHERE phase = 'practice'
  AND lesson_id IN (
    'banned-phrases',
    'buying-signals',
    'common-situations',
    'cultural-awareness',
    'describe-serving',
    'emotional-journey',
    'fda-pacing',
    'fda-personal',
    'fda-reading-table',
    'fda-recovery',
    'fde-formal-settings',
    'fde-napkin-service',
    'fde-service-direction',
    'fde-table-conduct',
    'fdp-approach',
    'fdp-body-language',
    'fdp-invisible',
    'fdp-voice',
    'fds-team-conduct',
    'fds-uniform-grooming',
    'fds-what-it-means',
    'fds-your-presence',
    'fdt-linen-glassware',
    'fdt-mise-en-place',
    'fdt-room-flow',
    'fdt-sideboard',
    'five-second',
    'floor-efficiency',
    'floor-movement',
    'fmk-answering-questions',
    'fmk-beverage-foundations',
    'fmk-describing-dish',
    'fmk-know-your-menu',
    'food-safety-floor',
    'guest-types',
    'guide-dont-point',
    'handling-complaints',
    'learn-protocol',
    'managing-sections',
    'mindset-shift',
    'multilingual',
    'nonverbal-signals',
    'our-guests',
    'our-menu-pdf',
    'our-standards',
    'our-story',
    'plate-carrying',
    'prevention',
    'proactive-reactive',
    'reading-table',
    'showing-up-right',
    'speed-without-rushing',
    'storytelling',
    'synchronized-service',
    'table-setting',
    'table-turns',
    'taking-orders',
    'ten-steps',
    'tray-carrying',
    'vip-guests',
    'welcome-to-hostia',
    'working-as-a-team',
    'your-first-shift'
  );

COMMIT;

-- Expected side effects (Part I.3, unchanged from Step 1):
--   1. Lesson XP for these lessons drops until each staff member redoes the
--      quiz, then returns automatically — XP is derived, never stored.
--      Roleplay XP is untouched.
--   2. Modules after these re-lock in display order until redone. That is the
--      enforcement mechanism, not a bug. Use property_overrides.unlocked_modules
--      to unblock an individual without un-resetting.
--   3. Streaks shorten retroactively and irreversibly — see the per-account
--      audit above. No live streak was affected.
--   4. phase_completions (exam badges) are NOT touched. A staff member may hold
--      a phase certification while a lesson inside it is temporarily
--      incomplete. Intended. Do not delete phase_completions to "keep them
--      consistent."

-- ── POST-RUN VERIFICATION, 2026-08-24 ────────────────────────────────────────
--   pre-count  : 205 (matched the per-account audit exactly — nothing landed
--                between taking the audit snapshot and running the DELETE)
--   deleted    : 205
--   re-checked : 0 rows still match the WHERE clause
--   totals     : lesson_completions 622 -> 417
--                learn 226 (unchanged), practice 214 -> 9, apply 182 (unchanged)
--   the 9 remaining practice rows are all lesson_id = 'our-menu', the orphans
--                excluded on purpose above
--   untouched  : phase_completions 2, roleplay_sessions 22
--
--   STILL OWED: this ran before the content deploy. Once the curriculum commit
--   is live, re-run the SELECT above — any practice row with a completed_at
--   later than this reset attests the OLD answer positions and must be deleted.
