// ─── PHASE CERTIFICATION EXAM — engine + per-track content ───────────────────
//
// Every track (fast-casual, casual-dining, fine-dining) certifies a phase with
// the SAME four-round exam structure, pass rules, and grading engine:
//
//   Round 1 · Sort & Match      — tap/swipe cards into the right bucket
//   Round 2 · Sequence Builder  — drag service protocols into the right order
//   Round 3 · Scenario Sprint   — timed rapid-fire situational questions
//   Round 4 · Final Challenge   — one continuous shift story, beat by beat
//
// Only the CONTENT differs per track, via EXAM_CONFIGS below. A track whose
// niche modules aren't built yet (fast-casual today) still gets the full
// four-round exam — its rounds simply draw on the universal Phase 1 modules
// until niche content lands; adding that content later is a config edit, not
// an engine change.
//
// PASS RULE (identical everywhere): overall score ≥ EXAM_PASS_SCORE, where the
// overall score is the plain average of the four round scores (each 0–100).
//
// REWARD: no XP — computeTotalXp is untouched by design. Passing writes a
// phase_completions row (server-side, /api/exam), which is exactly what the
// curriculum's phase gating reads: the badge is the phase's
// certification_title and the next phase unlocks on the next fetch.
//
// GRADING runs on the server (/api/exam) against this config — the client
// only collects answers. The same functions are importable client-side for
// optimistic display, but the server result is the one that counts.

import type { Phase } from '@/lib/curriculum';

export type Track = Phase['track'];

export const EXAM_PASS_SCORE = 80;

// ─── ROUND TYPES ─────────────────────────────────────────────

// Round 1 — Sort & Match. Exactly two buckets so the round works as a
// phone-friendly swipe (left = first bucket, right = second) as well as tap.
export interface ExamBucket {
  id: string;
  label: string;
}
export interface SortCard {
  id: string;
  text: string;
  bucket: string; // id of the correct bucket
}
export interface SortMatchRound {
  type: 'sort-match';
  title: string;
  instructions: string;
  buckets: [ExamBucket, ExamBucket];
  cards: SortCard[];
}

// Round 2 — Sequence Builder. `steps` is authored in the CORRECT order; the
// client shuffles for play and reports the arrangement as original indexes.
export interface ExamSequence {
  id: string;
  prompt: string;
  steps: string[];
}
export interface SequenceRound {
  type: 'sequence';
  title: string;
  instructions: string;
  sequences: ExamSequence[];
}

// Round 3 — Scenario Sprint. One timer per question; an expired timer counts
// as unanswered (null).
export interface SprintQuestion {
  id: string;
  q: string;
  options: string[];
  correct: number;
}
export interface SprintRound {
  type: 'sprint';
  title: string;
  instructions: string;
  secondsPerQuestion: number;
  questions: SprintQuestion[];
}

// Round 4 — Final Challenge. One continuous scenario told in beats; each beat
// is a decision worth 0/1/2 points so a strong-but-not-perfect read still
// earns credit. `feedback` is shown after the choice locks.
export interface ChallengeOption {
  text: string;
  points: 0 | 1 | 2;
  feedback: string;
}
export interface ChallengeBeat {
  id: string;
  setup: string;
  prompt: string;
  options: ChallengeOption[];
}
export interface FinalChallengeRound {
  type: 'final-challenge';
  title: string;
  instructions: string;
  intro: string;
  beats: ChallengeBeat[];
}

export type ExamRound = SortMatchRound | SequenceRound | SprintRound | FinalChallengeRound;

export interface ExamConfig {
  track: Track;
  phaseNumber: number; // the phase this exam certifies
  rounds: [SortMatchRound, SequenceRound, SprintRound, FinalChallengeRound];
}

// ─── ANSWERS + GRADING ───────────────────────────────────────

export interface ExamAnswers {
  sortMatch: Record<string, string>; // card id → chosen bucket id
  sequence: Record<string, number[]>; // sequence id → arranged original indexes
  sprint: (number | null)[]; // option index per question; null = timed out
  finalChallenge: Record<string, number>; // beat id → chosen option index
}

export interface ExamResult {
  roundScores: [number, number, number, number]; // 0–100 each, round order
  overall: number; // 0–100
  passed: boolean;
}

const pct = (earned: number, max: number) =>
  max > 0 ? Math.round((earned / max) * 100) : 0;

export function gradeSortMatch(round: SortMatchRound, answers: Record<string, string>): number {
  const correct = round.cards.filter((c) => answers[c.id] === c.bucket).length;
  return pct(correct, round.cards.length);
}

// Positional scoring: each step placed in its correct slot earns a point, so
// one adjacent swap in a 10-step sequence doesn't zero the round.
export function gradeSequence(round: SequenceRound, answers: Record<string, number[]>): number {
  let earned = 0;
  let max = 0;
  for (const seq of round.sequences) {
    max += seq.steps.length;
    const placed = answers[seq.id];
    if (!Array.isArray(placed)) continue;
    for (let pos = 0; pos < seq.steps.length; pos++) {
      if (placed[pos] === pos) earned++;
    }
  }
  return pct(earned, max);
}

export function gradeSprint(round: SprintRound, answers: (number | null)[]): number {
  const correct = round.questions.filter((q, i) => answers[i] === q.correct).length;
  return pct(correct, round.questions.length);
}

export function gradeFinalChallenge(
  round: FinalChallengeRound,
  answers: Record<string, number>,
): number {
  let earned = 0;
  for (const beat of round.beats) {
    earned += beat.options[answers[beat.id]]?.points ?? 0;
  }
  return pct(earned, round.beats.length * 2);
}

export function gradeExam(config: ExamConfig, answers: ExamAnswers): ExamResult {
  const [r1, r2, r3, r4] = config.rounds;
  const roundScores: [number, number, number, number] = [
    gradeSortMatch(r1, answers.sortMatch ?? {}),
    gradeSequence(r2, answers.sequence ?? {}),
    gradeSprint(r3, Array.isArray(answers.sprint) ? answers.sprint : []),
    gradeFinalChallenge(r4, answers.finalChallenge ?? {}),
  ];
  const overall = Math.round(roundScores.reduce((a, b) => a + b, 0) / roundScores.length);
  return { roundScores, overall, passed: overall >= EXAM_PASS_SCORE };
}

// ─── CASUAL DINING · PHASE 1 EXAM ────────────────────────────
// Content drawn from the modules casual-dining staff actually complete in
// Phase 1: greetings, service-flow, language, complaints, guest-psychology,
// casual-dining-standard, casual-dining-floor.

const casualDiningPhase1: ExamConfig = {
  track: 'casual-dining',
  phaseNumber: 1,
  rounds: [
    {
      type: 'sort-match',
      title: 'Five-Star or Fix It',
      instructions:
        'Twelve moments from the floor. Sort each one: is it the five-star move, or a mistake that needs fixing? Tap a bucket — or swipe left and right.',
      buckets: [
        { id: 'five-star', label: '✓ Five-star move' },
        { id: 'fix-it', label: '✗ Fix it' },
      ],
      cards: [
        { id: 'sm-1', text: 'A guest walks in while you\'re mid-task. You look up, make eye contact, and say "Welcome! I\'ll be right with you."', bucket: 'five-star' },
        { id: 'sm-2', text: 'Telling a guest who thanks you: "No problem!"', bucket: 'fix-it' },
        { id: 'sm-3', text: 'Walking guests to their table with the menu open, mentioning tonight\'s special on the way.', bucket: 'five-star' },
        { id: 'sm-4', text: 'Pointing across the room: "Table 7 is just over there, near the window."', bucket: 'fix-it' },
        { id: 'sm-5', text: 'Refilling a water glass before it\'s empty, without being asked.', bucket: 'five-star' },
        { id: 'sm-6', text: 'Checking in with "Is everything okay?" three minutes after the food lands.', bucket: 'fix-it' },
        { id: 'sm-7', text: 'An empty glass at a table outside your section — you refill it yourself.', bucket: 'five-star' },
        { id: 'sm-8', text: 'Saying "that\'s not my table" when a guest outside your section flags you.', bucket: 'fix-it' },
        { id: 'sm-9', text: 'Writing down every modification as it\'s said, then reading the whole order back before leaving.', bucket: 'five-star' },
        { id: 'sm-10', text: 'Nodding "sure" to a modification and trusting your memory through the rush.', bucket: 'fix-it' },
        { id: 'sm-11', text: 'Flagging the kitchen calmly: "Table 6 has been waiting 20 minutes — can we prioritize them?"', bucket: 'five-star' },
        { id: 'sm-12', text: 'Hovering near a finished table, sighing, and stacking chairs so they get the hint.', bucket: 'fix-it' },
      ],
    },
    {
      type: 'sequence',
      title: 'Build the Protocol',
      instructions:
        'Three protocols you live by on the floor. Drag the steps into the right order — every correctly placed step counts.',
      sequences: [
        {
          id: 'seq-priority',
          prompt: 'The priority ladder during a rush — what comes first when everything needs you at once?',
          steps: [
            'Run hot food that\'s ready in the kitchen',
            'Catch drink refills at the table',
            'Check in with tables that have been waiting',
            'Clear finished plates',
            'Side work, restocking, and resetting',
          ],
        },
        {
          id: 'seq-complaint',
          prompt: 'The 4-step complaint protocol — a guest says their dish is wrong.',
          steps: [
            'Listen — without interrupting or defending',
            'Acknowledge genuinely — "I completely understand, and I\'m sorry"',
            'Resolve with a concrete offer, immediately',
            'Follow up after the fix to confirm it landed',
          ],
        },
        {
          id: 'seq-ten-steps',
          prompt: 'The 10-step service sequence — from the front door to the goodbye.',
          steps: [
            'Reception — greet within 5 seconds',
            'Seating — guide, never point',
            'First contact — water and a brief introduction',
            'Drinks — proactive suggestion',
            'Order taking — listen, confirm everything',
            'Food service — correct side, plates together',
            'Follow-up — check in 2–3 minutes after food arrives',
            'Clearing — synchronized, never while someone eats',
            'Dessert & digestifs — offer before they ask',
            'Close — personalized thank-you and invitation back',
          ],
        },
      ],
    },
    {
      type: 'sprint',
      title: 'Scenario Sprint',
      instructions:
        'Ten floor situations, twenty seconds each. Trust your training — the clock is part of the test.',
      secondsPerQuestion: 20,
      questions: [
        {
          id: 'sp-1',
          q: 'A guest lays their cutlery together on the plate. What does it mean?',
          options: ['They want more food', 'They\'re finished — clear promptly', 'They\'re unhappy with the dish', 'Leave it until everyone leaves'],
          correct: 1,
        },
        {
          id: 'sp-2',
          q: 'A guest keeps glancing around the room. You…',
          options: ['Wait for them to wave', 'Assume they\'re admiring the décor', 'Go check in — they need something', 'Send the host over'],
          correct: 2,
        },
        {
          id: 'sp-3',
          q: 'A closed menu placed on the table signals…',
          options: ['They need more time', 'They\'re ready to order', 'They want to leave', 'Nothing in particular'],
          correct: 1,
        },
        {
          id: 'sp-4',
          q: 'You\'re about to run a chicken dish and the center looks pink. You…',
          options: ['Serve it — they can send it back', 'Report it and don\'t take it to the table', 'Warn the guest to check it', 'Leave it for another server'],
          correct: 1,
        },
        {
          id: 'sp-5',
          q: 'A colleague\'s section gets slammed with six tables at once. You…',
          options: ['Take over their tables entirely', 'Stay out — their section, their tips', 'Ask "what do you need?" and take one task', 'Tell the manager'],
          correct: 2,
        },
        {
          id: 'sp-6',
          q: 'How do you say "Welcome" in Papiamentu?',
          options: ['Bon dia', 'Danki', 'Bon nochi', 'Bon biní'],
          correct: 3,
        },
        {
          id: 'sp-7',
          q: 'The right moment to offer dessert is…',
          options: ['When guests ask for the menu', 'At the natural lull, before they ask', 'After presenting the bill', 'Only for tables celebrating something'],
          correct: 1,
        },
        {
          id: 'sp-8',
          q: 'Cards and a wallet appear on the table. You…',
          options: ['Bring the bill without making them ask', 'Wait for them to request it', 'Offer another round first', 'Finish your other tables first'],
          correct: 0,
        },
        {
          id: 'sp-9',
          q: 'A solo guest, phone out, eating quickly. They want…',
          options: ['A chat about the menu', 'Efficient service — clean check-ins, no hovering', 'To be upsold on dessert', 'To be left entirely alone, no check-in'],
          correct: 1,
        },
        {
          id: 'sp-10',
          q: 'A guest asks about an ingredient and you\'re not sure. You say…',
          options: ['"I don\'t know."', '"It should be fine."', '"I\'m not certain — let me find out for you right now."', '"You\'d have to ask the kitchen."'],
          correct: 2,
        },
      ],
    },
    {
      type: 'final-challenge',
      title: 'The Friday Night Rush',
      instructions:
        'One full shift, one story. Every decision earns points — the five-star move earns the most, but a solid professional call still counts.',
      intro:
        'Friday, 7:40 PM at [Property]. Your section is full, the kitchen is loud, and the door hasn\'t stopped. This is the shift that shows what you\'ve learned. Ready?',
      beats: [
        {
          id: 'fc-1',
          setup: 'You\'re carrying three plates to table 9 when a family of four walks in. No host in sight — they\'re looking around, waiting to be seen.',
          prompt: 'Hands full, section busy. What do you do?',
          options: [
            { text: 'Deliver the plates first — you can\'t greet anyone with your hands full.', points: 1, feedback: 'The plates matter, but 15 silent seconds is an eternity at the door. Acknowledgment costs nothing, even mid-task.' },
            { text: 'Make eye contact, smile, and call out a warm "Welcome! I\'ll be right with you" — then run the plates.', points: 2, feedback: 'Exactly. The 5-second rule doesn\'t require free hands — eye contact and a warm word reset the guests\' clock while you finish.' },
            { text: 'Keep moving — the family can see you\'re busy, and someone else will get to them.', points: 0, feedback: 'Nobody "gets to them" in time. An unacknowledged guest sours fastest — this is exactly how a visit starts wrong.' },
          ],
        },
        {
          id: 'fc-2',
          setup: 'Plates delivered. You head back to the family. Their table is ready near the window, clearly visible from the door.',
          prompt: 'How do you seat them?',
          options: [
            { text: 'Point it out — "the window table right there is yours" — so they can settle in while you grab menus.', points: 0, feedback: 'Pointing is directions, not hospitality. The walk to the table is the second act of the first impression.' },
            { text: 'Walk them over, menus in hand, and let them settle in.', points: 1, feedback: 'Good — you escorted. The missed layer: open the menu as you place it and plant one line about tonight\'s experience.' },
            { text: 'Walk them over at their pace, menus open, with one line on the way: "The kitchen\'s doing something special with the ribs tonight."', points: 2, feedback: 'Guide, never point — menu open, one seed planted. That\'s the full standard, even on a packed Friday.' },
          ],
        },
        {
          id: 'fc-3',
          setup: 'Taking the family\'s order: two burgers with modifications, and the mother says her daughter has a gluten allergy.',
          prompt: 'How do you handle the order?',
          options: [
            { text: 'Note the allergy on the ticket and avoid the obvious bread items when the kitchen plates it.', points: 1, feedback: 'You noted it — but you skipped confirming severity and saying it out loud to the kitchen. Allergies get the full protocol, every time.' },
            { text: 'Confirm how severe the allergy is, write every modification down, flag the ticket AND tell the kitchen out loud, then read the whole order back.', points: 2, feedback: 'The complete chain: confirm severity, capture in writing, flag loudly, read back. This is what "last line of defense" means.' },
            { text: 'Reassure her the kitchen handles allergies all the time and put the order through.', points: 0, feedback: 'Assuming the kitchen "handles it" is exactly how the wrong plate reaches an allergic guest. Never assume — confirm and flag.' },
          ],
        },
        {
          id: 'fc-4',
          setup: '8:15 PM. Everything happens at once: the pass bell rings — table 9\'s hot mains are up — a new couple slides into a just-cleared table, and table 3 waves an empty soda glass.',
          prompt: 'Three needs, one of you. What\'s the order?',
          options: [
            { text: 'Refill first — it\'s fastest — then greet the couple, then run the food.', points: 0, feedback: 'You served the loudest need, not the biggest. The mains died under the lamp and the couple stewed. Triage by impact, not volume.' },
            { text: 'Run the hot food, then greet the new couple, then the refill — with a quick "right with you" glance at table 3 on the way.', points: 2, feedback: 'The priority ladder, executed: hot food first, ungreeted guests second, and the refill held with an acknowledgment that keeps table 3 feeling seen.' },
            { text: 'Greet the couple first so they don\'t feel ignored, then food, then refill.', points: 1, feedback: 'Close — but hot food always tops the ladder. It only gets worse under the lamp; a greeting can wait ninety seconds, a dying plate can\'t.' },
          ],
        },
        {
          id: 'fc-5',
          setup: '8:40 PM. The kitchen is buried. Table 6 ordered 25 minutes ago and their mains are nowhere. They\'re starting to look around.',
          prompt: 'What\'s your move?',
          options: [
            { text: 'Go to the table: "I\'m so sorry — the kitchen is slammed tonight. Friday, you know how it is."', points: 0, feedback: 'You acknowledged them but blamed the kitchen. Excuses make the guest feel like a problem — own the wait instead.' },
            { text: 'Check the ticket with the kitchen calmly — "table 6 is at 25 minutes, can we prioritize?" — then update the table honestly: "Your mains are about five minutes out. Thank you for your patience."', points: 2, feedback: 'Both halves, done right: facts (not blame) to the kitchen, an honest expectation (not an excuse) to the guests. That\'s how a stretched server keeps trust.' },
            { text: 'Avoid the table until the food is actually up — checking in with nothing to offer only draws attention to the wait.', points: 1, feedback: 'Guests forgive busy; they don\'t forgive feeling forgotten. A wait with no acknowledgment feels twice as long — go be seen.' },
          ],
        },
        {
          id: 'fc-6',
          setup: 'The mains land at table 6 — and two minutes later the man waves you over: "This burger is well done. I ordered medium."',
          prompt: 'He\'s right. What do you say?',
          options: [
            { text: '"You\'re absolutely right, and I\'m sorry. Let me get that replaced right away — can I bring you something while you wait?" Then check back once the new plate lands.', points: 2, feedback: 'Listen, acknowledge, resolve, follow up — the full protocol, with a gesture for the wait. This is how a mistake becomes a loyalty moment.' },
            { text: '"Are you sure? Medium can look more done than expected — but I can send it back if you want."', points: 0, feedback: 'Questioning the guest\'s experience ends the relationship. He knows what he ordered — own it and fix it.' },
            { text: '"I\'m so sorry about that — I\'ll have the kitchen refire it now."', points: 1, feedback: 'Owned and resolved — good. What\'s missing is the recovery: something while they wait, and a follow-up to confirm the new plate landed right.' },
          ],
        },
        {
          id: 'fc-7',
          setup: '9:30 PM. The rush breaks. The window family is finishing — plates pushed aside, conversation easing. The daughter is eyeing the dessert case.',
          prompt: 'The natural lull. How do you play it?',
          options: [
            { text: 'Drop the bill now so the table can turn — it\'s still Friday, and the door hasn\'t stopped.', points: 0, feedback: 'You read the lull but forced the close. A rushed table remembers being rushed — and you skipped the easiest revenue moment of the night.' },
            { text: 'Ask if anyone\'s saved room for dessert.', points: 1, feedback: 'Right moment, flat delivery. "Any dessert?" invites a no — a specific recommendation with a story is what tips the decision.' },
            { text: '"The warm rum cake is the one guests come back for — baked in-house every afternoon. One with four spoons?"', points: 2, feedback: 'Proactive, specific, and sold with a story — social proof and craft in one line, offered exactly at the lull. That\'s suggestive selling done right.' },
          ],
        },
        {
          id: 'fc-8',
          setup: '10:05 PM. The family is ready to go. The father catches your eye and reaches for his wallet. They\'ve had a great night — you can see it.',
          prompt: 'The close. What does it sound like?',
          options: [
            { text: 'Bring the bill promptly with a warm "no rush at all", and when they get up: "It was a pleasure having you tonight — come back for that rum cake soon."', points: 2, feedback: 'Prompt on the signal, zero pressure, and a personal invitation back that references their night. The close is what they walk out remembering.' },
            { text: 'Bring the bill quickly and thank them as they leave.', points: 1, feedback: 'Efficient and polite — but generic. A personal touch referencing their visit is what turns tonight into a return visit.' },
            { text: 'Let them flag you when they\'re ready — you don\'t want to seem like you\'re pushing them out.', points: 0, feedback: 'The wallet on the table WAS the signal. Making guests ask for the bill at the end undoes an evening of good service.' },
          ],
        },
      ],
    },
  ],
};

// ─── CONFIG REGISTRY ─────────────────────────────────────────
// fast-casual and fine-dining Phase 1 configs are built after the casual
// dining pilot is reviewed — same structure, track-specific content.
// (Fast-casual draws on universal modules only until its niche modules ship;
// its Final Challenge carries rush-pressure framing and an upsell beat.)

const EXAM_CONFIGS: ExamConfig[] = [casualDiningPhase1];

export function getExamConfig(track: string | null | undefined, phaseNumber: number): ExamConfig | null {
  if (!track) return null;
  return EXAM_CONFIGS.find((c) => c.track === track && c.phaseNumber === phaseNumber) ?? null;
}
