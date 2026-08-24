-- Content-change re-attestation reset — DEDUP_PROPOSAL.md Part F items 1-9 ("Step 1")
-- Policy: DEDUP_PROPOSAL.md Part I. Decided 2026-08-21, applied 2026-08-24.
--
-- ============================================================================
-- EXECUTED 2026-08-24, after commit 79453c0 reached production.
--   content commit : 79453c0 "fix: de-duplicate curriculum content and
--                    canonicalise conflicting standards"
--   deployment     : hostia-core-9dx3woaop (READY, target=production,
--                    githubCommitSha=79453c0bcbb5ebd1286eb720165398fd0a68be72)
--   rows deleted   : 46 (lesson_completions 666 -> 620)
--   verified after : 0 rows still match the WHERE clause
--   untouched      : phase_completions (2 rows), roleplay_sessions (22 rows)
--   streak impact  : none. The single candidate day (BrgrTest 2026-07-11)
--                    was never an earned streak day — reading-table had no
--                    `apply` row, so the lesson never reached full completion.
--   affected staff : 8, all test/review/verify accounts plus the admin login.
--                    Bistro 91 had zero matching rows.
-- Re-running this file is a no-op: the rows are already gone.
-- ============================================================================
--
-- Data, not schema. Recorded here as the audit trail of which standard changed when,
-- for the same reason record_live_rls_policies.sql exists.
--
-- RUN ORDER: deploy the curriculum.ts / scenarios.ts content change FIRST, then run this.
-- Resetting before the corrected content ships sends staff back through the wrong version.
-- Service role, Supabase SQL editor. lesson_completions has no DELETE policy for staff
-- or managers by design (add_lesson_completions.sql).
--
-- The (lesson_id, phase) pairs below were derived mechanically from the landed diff --
-- enclosing lesson per changed line, learn vs practice by position relative to `quiz:` --
-- NOT from the plan. Two lessons the plan predicted are deliberately absent:
--   * guest-types  -- B2 keeps its callout untouched; only reading-table's copy was deleted.
--   * floor-movement (learn) -- B5 keeps the `Pre-bus passes` principle; only its quiz changed.
--
-- What changed, per lesson:
--   reading-table         learn: duplicate callout + poorer culture-cards deleted (B2),
--                                "You guys ready" do-dont rewritten (C1)
--                         practice: 3 questions replaced (B2)
--   handling-complaints   learn: 4-step protocol block -> LEARN cross-reference (B1),
--                                escalation clause added to tip-list (C2), desc retitled
--                         practice: 3 questions replaced (B1)
--   learn-protocol        learn: yes/no check-in phrase removed from NOTIFY step (C5)
--                         practice: escalation option reworded (C2)
--   table-turns           learn: clearing trigger canonicalised (B7)
--                         practice: clearing option + explain rewritten (B7)
--   floor-efficiency      learn: proactive/reactive intro + tip-list deleted (B3),
--                                clearing line canonicalised (B7)
--                         practice: 1 question replaced (B3)
--   speed-without-rushing learn: "5 habits" tip-list deleted (B5)
--                         practice: 1 question replaced (B5)
--   floor-movement        practice: 1 question replaced (B5)
--
-- A4(a) (scenarios.ts serve-side fix) resets nothing: runner-coordination is an orphan
-- scenario no lesson links to, so it has never written an `apply` completion.
--
-- VERIFY BY COUNT FIRST -- run each SELECT and expect a number consistent with the
-- pilot roster (De Gouverneur, Brgr House, Maison Test, Bistro 91 + review accounts).
-- A surprising count means a lesson_id is wrong. Do not run the DELETE until it matches.

-- SELECT phase, lesson_id, count(*) FROM lesson_completions
--  WHERE (phase = 'learn' AND lesson_id IN (
--          'floor-efficiency','handling-complaints','learn-protocol',
--          'reading-table','speed-without-rushing','table-turns'))
--     OR (phase = 'practice' AND lesson_id IN (
--          'floor-efficiency','floor-movement','handling-complaints','learn-protocol',
--          'reading-table','speed-without-rushing','table-turns'))
--  GROUP BY phase, lesson_id ORDER BY phase, lesson_id;

BEGIN;

DELETE FROM lesson_completions
WHERE phase = 'learn'
  AND lesson_id IN (
    'floor-efficiency',
    'handling-complaints',
    'learn-protocol',
    'reading-table',
    'speed-without-rushing',
    'table-turns'
  );

DELETE FROM lesson_completions
WHERE phase = 'practice'
  AND lesson_id IN (
    'floor-efficiency',
    'floor-movement',
    'handling-complaints',
    'learn-protocol',
    'reading-table',
    'speed-without-rushing',
    'table-turns'
  );

COMMIT;

-- Expected side effects (Part I.3, verified against the code):
--   1. Lesson XP for these lessons drops until each staff member redoes the phase,
--      then returns automatically -- XP is derived, never stored. Roleplay XP is untouched.
--   2. Modules after these re-lock in display order until redone. That is the enforcement
--      mechanism, not a bug. Use property_overrides.unlocked_modules to unblock an
--      individual without un-resetting.
--   3. Streaks can shorten retroactively and irreversibly -- a past day whose only earned
--      item was one of these lessons leaves the day-set, and redoing it re-pins the
--      completion to today. Accepted: all current property data is test/pilot.
--   4. phase_completions (exam badges) are NOT touched. A staff member may hold a phase
--      certification while a lesson inside it is temporarily incomplete. Intended.
--      Do not delete phase_completions to "keep them consistent."
