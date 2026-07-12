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

// ─── FAST CASUAL · PHASE 1 EXAM ──────────────────────────────
// Fast-casual Phase 1 assigns only the universal modules today (onboarding,
// greetings, physical-craft, service-flow, language, complaints,
// guest-psychology) — so every round draws exclusively on those. When the
// fast-casual niche modules ship, adding their content here is a config edit.
// The Final Challenge carries rush-pressure framing throughout and includes
// a dedicated upsell beat.

const fastCasualPhase1: ExamConfig = {
  track: 'fast-casual',
  phaseNumber: 1,
  rounds: [
    {
      type: 'sort-match',
      title: 'Five-Star or Fix It',
      instructions:
        'Twelve moments from a packed shift. Sort each one: is it the five-star move, or a mistake that needs fixing? Tap a bucket — or swipe left and right.',
      buckets: [
        { id: 'five-star', label: '✓ Five-star move' },
        { id: 'fix-it', label: '✗ Fix it' },
      ],
      cards: [
        { id: 'sm-1', text: 'You\'re running food when a family of four walks in. You make eye contact, smile, and call out "Welcome! I\'ll be right with you."', bucket: 'five-star' },
        { id: 'sm-2', text: 'A guest thanks you for the quick refill. You answer: "No problem!"', bucket: 'fix-it' },
        { id: 'sm-3', text: 'Walking guests to their table with the menu open, mentioning what the kitchen\'s doing special today on the way.', bucket: 'five-star' },
        { id: 'sm-4', text: 'Gesturing across the room: "There\'s a free table over by the window — go ahead."', bucket: 'fix-it' },
        { id: 'sm-5', text: 'Topping up a water glass before it\'s empty, without being asked.', bucket: 'five-star' },
        { id: 'sm-6', text: 'Checking in with "Is everything okay?" a few minutes after the food lands.', bucket: 'fix-it' },
        { id: 'sm-7', text: 'Bringing crayons and a kids\' menu to a family before the parents have to ask.', bucket: 'five-star' },
        { id: 'sm-8', text: 'Attempting a shaky three-plate carry through the rush when you\'ve only practiced two — one trip is faster.', bucket: 'fix-it' },
        { id: 'sm-9', text: 'Writing down every modification as it\'s said, then reading the whole order back before leaving the table.', bucket: 'five-star' },
        { id: 'sm-10', text: 'Nodding "got it" to three modifications and trusting your memory through the rush.', bucket: 'fix-it' },
        { id: 'sm-11', text: 'A ticket hits 20 minutes with no update — you go tell the table before they have to ask.', bucket: 'five-star' },
        { id: 'sm-12', text: 'Running across the floor to catch up when the rush hits.', bucket: 'fix-it' },
      ],
    },
    {
      type: 'sequence',
      title: 'Build the Protocol',
      instructions:
        'Three protocols you live by when the rush is on. Drag the steps into the right order — every correctly placed step counts.',
      sequences: [
        {
          id: 'seq-learn',
          prompt: 'The LEARN model — a guest\'s order came out wrong and they\'re frustrated. Walk the five steps.',
          steps: [
            'Listen — full attention, never interrupt',
            'Empathize — acknowledge what they felt, not just what happened',
            'Apologize — genuinely, with no excuses',
            'Resolve — a concrete fix, right now, with a what and a when',
            'Notify — follow up after the fix to confirm it landed',
          ],
        },
        {
          id: 'seq-describe',
          prompt: 'The 3-part description formula — one sentence that sells any dish or drink.',
          steps: [
            'The Star — lead with the key ingredient or what makes it special',
            'The Method — how it\'s made: the craft that justifies the price',
            'The Experience — what they\'ll taste and feel',
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
        'Ten rush-hour situations, twenty seconds each. Trust your training — the clock is part of the test.',
      secondsPerQuestion: 20,
      questions: [
        {
          id: 'sp-1',
          q: 'What percentage of unhappy guests never complain — they just leave and don\'t come back?',
          options: ['40%', '65%', '80%', '96%'],
          correct: 3,
        },
        {
          id: 'sp-2',
          q: 'A guest closes their menu and sets it on the table. That means…',
          options: ['They need more time', 'They\'re ready to order', 'They want the bill', 'Nothing in particular'],
          correct: 1,
        },
        {
          id: 'sp-3',
          q: 'How do you say "Thank you" in Papiamentu?',
          options: ['Bon biní', 'Bon dia', 'Danki', 'Bon nochi'],
          correct: 2,
        },
        {
          id: 'sp-4',
          q: 'Which hand always carries the tray?',
          options: ['Right hand', 'Left hand', 'Either hand', 'Both hands'],
          correct: 1,
        },
        {
          id: 'sp-5',
          q: 'Where do the heavy items go when you load a tray?',
          options: ['Outer edge for easy access', 'The center of the tray', 'The side closest to your body', 'It doesn\'t matter'],
          correct: 1,
        },
        {
          id: 'sp-6',
          q: 'A guest asks to move to a table that\'s reserved. You say…',
          options: ['"We can\'t do that — it\'s reserved."', '"That won\'t work tonight."', '"What I can do is check for a comparable table — one moment."', '"You\'d have to ask the manager."'],
          correct: 2,
        },
        {
          id: 'sp-7',
          q: 'A guest thanks you for fixing something fast. The right response is…',
          options: ['"No problem!"', '"No worries!"', '"Absolutely — my pleasure."', '"That\'s my job."'],
          correct: 2,
        },
        {
          id: 'sp-8',
          q: 'Cards and a wallet land on the table. You…',
          options: ['Bring the bill without making them ask', 'Wait until they request it', 'Offer another round first', 'Finish your other tables first'],
          correct: 0,
        },
        {
          id: 'sp-9',
          q: 'The kitchen is behind and a ticket hits 20 minutes with no update. You…',
          options: ['Wait for the kitchen to call it', 'Update the table proactively before they have to ask', 'Only say something if they complain', 'Ask the manager to handle it'],
          correct: 1,
        },
        {
          id: 'sp-10',
          q: 'The anticipation formula, in order, is…',
          options: ['Ask → Interpret → Act', 'Observe → Act → Confirm', 'Observe → Interpret → Act', 'Ask → Observe → Respond'],
          correct: 2,
        },
      ],
    },
    {
      type: 'final-challenge',
      title: 'The Saturday Lunch Rush',
      instructions:
        'One full rush, one story. Every decision earns points — the five-star move earns the most, but a solid professional call still counts.',
      intro:
        'Saturday, 12:30 PM at [Property]. There\'s a line at the door, the kitchen bell won\'t stop, and every table in your section is full. The rush is the test — ready?',
      beats: [
        {
          id: 'fc-1',
          setup: 'You\'re carrying two plates to table 4 when a family of four pushes through the door. No one else is near the front — they\'re scanning the room, waiting to be seen.',
          prompt: 'Hands full, rush building. What do you do?',
          options: [
            { text: 'Deliver the plates first — greeting someone with your hands full looks sloppy.', points: 1, feedback: 'The plates matter, but fifteen silent seconds at the door is an eternity. Acknowledgment costs nothing, even mid-carry.' },
            { text: 'Make eye contact, smile, and call out a warm "Welcome! I\'ll be right with you" — then run the plates.', points: 2, feedback: 'Exactly. The 5-second rule doesn\'t require free hands — eye contact and a warm word reset the guests\' clock while you finish.' },
            { text: 'Keep moving — it\'s a rush, and guests can see everyone\'s slammed.', points: 0, feedback: 'An unacknowledged guest sours fastest — a busy room is never an excuse for an invisible welcome.' },
          ],
        },
        {
          id: 'fc-2',
          setup: 'Plates down. You get back to the family. A table just cleared near the window, visible from the door.',
          prompt: 'How do you seat them — with a line still forming behind them?',
          options: [
            { text: 'Point it out — "that window table is all yours" — so you can greet the next group in line.', points: 0, feedback: 'Pointing is directions, not hospitality. Even in a rush, the walk to the table is the second act of the first impression.' },
            { text: 'Walk them over quickly, menus in hand, and get back to the door.', points: 1, feedback: 'You escorted — good. The missed layer: open the menu as you place it and plant one line about the food, even a short one.' },
            { text: 'Walk them over at their pace, menus open, with one line on the way: "The smash burger\'s the move today — kitchen\'s been dialed in all morning."', points: 2, feedback: 'Guide, never point — menu open, one seed planted. The full standard survives the rush; that\'s the point of it.' },
          ],
        },
        {
          id: 'fc-3',
          setup: 'Taking the family\'s order: two burgers with modifications, and the mother mentions her son has a gluten allergy.',
          prompt: 'The kitchen bell is ringing. How do you handle the order?',
          options: [
            { text: 'Note the allergy on the ticket and trust the kitchen to route around the bun.', points: 1, feedback: 'You noted it — but skipped confirming severity and saying it out loud to the kitchen. Allergies get the full protocol, rush or no rush.' },
            { text: 'Confirm how severe the allergy is, write every modification down, flag the ticket AND tell the kitchen out loud, then read the whole order back.', points: 2, feedback: 'The complete chain: confirm severity, capture in writing, flag loudly, read back. The rush is exactly when shortcuts hurt someone.' },
            { text: 'Reassure her the kitchen handles allergies all the time and fire the order — the line is growing.', points: 0, feedback: 'Assuming the kitchen "handles it" is exactly how the wrong plate reaches an allergic guest. Never assume — confirm and flag.' },
          ],
        },
        {
          id: 'fc-4',
          setup: '12:50 PM. Table 7\'s order of five is up — four plates in the window, the fifth about two minutes behind. The table is hungry and you could start running now.',
          prompt: 'Four ready, one lagging. What\'s the move?',
          options: [
            { text: 'Run the four now — nobody wants cold fries, and the fifth follows in two minutes.', points: 0, feedback: 'One person watching four others eat is worse than a two-minute hold. All plates go out together — non-negotiable.' },
            { text: 'Wait for the fifth plate, then take everything out together.', points: 2, feedback: 'All plates go out together, every time. A short hold protects the table\'s experience; a split delivery splits the table.' },
            { text: 'Run the four and warn the fifth guest their plate is coming separately.', points: 1, feedback: 'You communicated, which softens it — but the standard isn\'t "explain the split", it\'s "don\'t split." The team waits for the last plate.' },
          ],
        },
        {
          id: 'fc-5',
          setup: '1:05 PM. The kitchen is buried. Table 2 ordered 25 minutes ago and their food is nowhere. They\'ve started looking around the room.',
          prompt: 'What\'s your move?',
          options: [
            { text: 'Go over: "I\'m so sorry — the kitchen is completely slammed. Saturday lunch, you know how it gets."', points: 0, feedback: 'You acknowledged them but blamed the kitchen. Excuses make the guest feel like a problem — own the wait instead.' },
            { text: 'Check the ticket calmly with the kitchen — "table 2 is at 25 minutes, where are we?" — then update the table honestly: "Your food is about four minutes out. Thank you for your patience."', points: 2, feedback: 'Facts (not blame) to the kitchen, an honest expectation (not an excuse) to the guests. That\'s how a stretched server keeps trust.' },
            { text: 'Stay clear of the table until the food is actually up — checking in with empty hands just highlights the wait.', points: 1, feedback: 'Guests forgive busy; they don\'t forgive feeling forgotten. A wait with no acknowledgment feels twice as long — go be seen.' },
          ],
        },
        {
          id: 'fc-6',
          setup: 'Table 2\'s food lands — and the man waves you back: "I ordered the crispy chicken sandwich. This is the grilled one."',
          prompt: 'He\'s right, and he\'s already waited 25 minutes. What do you say?',
          options: [
            { text: '"Are you sure? The grilled one looks pretty similar once it\'s sauced — but I can swap it if you want."', points: 0, feedback: 'Questioning the guest\'s order after a long wait is a double failure. He knows what he ordered — own it and fix it.' },
            { text: '"I\'m so sorry — I\'ll have the kitchen fire the crispy one right now."', points: 1, feedback: 'Owned and resolved — good. What\'s missing after a wait like this: something for the table while the fix lands, and a follow-up to confirm it\'s right.' },
            { text: '"You\'re absolutely right, and I\'m sorry — especially after that wait. The crispy one is firing now; can I bring you anything while it lands?" Then check back when the new plate arrives.', points: 2, feedback: 'Listen, own it, resolve with a gesture, follow up — the full protocol, sized to the situation. This is how a rough visit becomes a return visit.' },
          ],
        },
        {
          id: 'fc-7',
          setup: '1:35 PM. The rush finally cracks. The window family is finishing, plates pushed aside — but the line at the door hasn\'t fully died, and you could turn this table fast.',
          prompt: 'Turn it, or sell it?',
          options: [
            { text: 'Drop the bill now with a smile — on a Saturday, table turns pay the rent.', points: 0, feedback: 'You read the lull but forced the close. A rushed table remembers being rushed — and you skipped the easiest revenue moment of the shift.' },
            { text: 'Ask if anyone\'s saved room for dessert.', points: 1, feedback: 'Right moment, flat delivery. "Any dessert?" invites a no — a specific recommendation with a story is what tips the decision.' },
            { text: '"The warm skillet cookie is what people come back for — baked to order, one spoon each or one to fight over?"', points: 2, feedback: 'Proactive, specific, sold with a story and a smile — offered exactly at the lull. Suggestive selling done right beats a fast turn.' },
          ],
        },
        {
          id: 'fc-8',
          setup: '1:55 PM. The family is done. The father catches your eye and reaches for his wallet. They rode out the rush with you — and they had a good time doing it.',
          prompt: 'The close. What does it sound like?',
          options: [
            { text: 'Bring the bill promptly with a warm "no rush at all", and when they get up: "Great having you today — come back for that cookie soon."', points: 2, feedback: 'Prompt on the signal, zero pressure, and a personal invitation back that references their visit. The close is what they walk out remembering.' },
            { text: 'Bring the bill quickly and thank them as they leave.', points: 1, feedback: 'Efficient and polite — but generic. A personal touch referencing their visit is what turns today into a return visit.' },
            { text: 'Let them flag you when they\'re ready — after that wait earlier, you don\'t want to seem pushy.', points: 0, feedback: 'The wallet on the table WAS the signal. Making guests ask for the bill at the end undoes the recovery you worked for.' },
          ],
        },
      ],
    },
  ],
};

// ─── FINE DINING · PHASE 1 EXAM ──────────────────────────────
// Content drawn from the modules fine-dining staff actually complete in
// Phase 1: the five niche modules (fine-dining-standard, presence, etiquette,
// table-setup, menu-knowledge) plus the universal modules (greetings,
// physical-craft, service-flow, language, complaints, guest-psychology).

const fineDiningPhase1: ExamConfig = {
  track: 'fine-dining',
  phaseNumber: 1,
  rounds: [
    {
      type: 'sort-match',
      title: 'Elevate or Break',
      instructions:
        'Twelve moments from the dining room. Sort each one: does it elevate the room, or break the spell? Tap a bucket — or swipe left and right.',
      buckets: [
        { id: 'elevates', label: '✓ Elevates the room' },
        { id: 'breaks', label: '✗ Breaks the spell' },
      ],
      cards: [
        { id: 'sm-1', text: 'Topping up a wine glass from the side during a lull in conversation, then withdrawing without a word.', bucket: 'elevates' },
        { id: 'sm-2', text: 'Asking a guest "Are you still working on that?"', bucket: 'breaks' },
        { id: 'sm-3', text: 'A guest drops their napkin — you quietly remove it and bring a fresh one, without a word.', bucket: 'elevates' },
        { id: 'sm-4', text: 'Picking a dropped napkin off the floor and handing it back to the guest.', bucket: 'breaks' },
        { id: 'sm-5', text: 'Holding every glass by the stem and checking it against the light before it reaches the table.', bucket: 'elevates' },
        { id: 'sm-6', text: 'Scraping and stacking finished plates at the table to clear in one trip.', bucket: 'breaks' },
        { id: 'sm-7', text: 'Meeting a distant guest\'s searching look with a small, warm nod — "I see you, I\'m coming."', bucket: 'elevates' },
        { id: 'sm-8', text: 'Rushing visibly through the dining room because the kitchen needs you now.', bucket: 'breaks' },
        { id: 'sm-9', text: 'Serving the ladies first, then the gentlemen, then the host last.', bucket: 'elevates' },
        { id: 'sm-10', text: 'Reaching across a guest to clear their neighbour\'s plate — it\'s only a moment.', bucket: 'breaks' },
        { id: 'sm-11', text: 'Refilling water at a colleague\'s table without being asked, because you saw it needed doing.', bucket: 'elevates' },
        { id: 'sm-12', text: 'Explaining a delay to a guest: "The kitchen is really struggling tonight."', bucket: 'breaks' },
      ],
    },
    {
      type: 'sequence',
      title: 'Build the Protocol',
      instructions:
        'Three protocols that define the fine dining craft. Drag the steps into the right order — every correctly placed step counts.',
      sequences: [
        {
          id: 'seq-cover',
          prompt: 'Setting a cover, piece by piece — the mise en place order.',
          steps: [
            'The clothed table — pressed, spotless, even drop on all sides',
            'The cover position — charger centred to the chair',
            'Cutlery — outside-in, forks left, blades inward',
            'Glassware — upper right, polished, held by the stem',
            'The napkin — one house fold, the same at every cover',
            'Salt, pepper & the small things — clean and full before service',
            'Candle & centrepiece — low enough to see across the table',
          ],
        },
        {
          id: 'seq-approach',
          prompt: 'The approach — arriving at a table at exactly the right moment.',
          steps: [
            'The three-second read — is the table open, or mid-moment?',
            'The angle of approach — enter their field of vision gently',
            'Speak in the natural gap — never force your way in',
            'If the moment is wrong — hold back, or withdraw and return',
            'Leave gracefully — a warm close, a nod, an unhurried turn',
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
        'Ten dining-room situations, twenty seconds each. Trust your training — the clock is part of the test.',
      secondsPerQuestion: 20,
      questions: [
        {
          id: 'sp-1',
          q: 'A guest\'s fork and knife are resting apart, angled open on the plate. It means…',
          options: ['They\'re finished — clear the plate', 'They\'re pausing, not finished — the plate stays', 'They want the next course', 'They\'re unhappy with the dish'],
          correct: 1,
        },
        {
          id: 'sp-2',
          q: 'Fork and knife laid together, side by side across the plate. Your cue is…',
          options: ['Wait until they ask you to clear', 'They\'re finished — clear in the next natural pause', 'Offer more bread', 'Refresh their cutlery'],
          correct: 1,
        },
        {
          id: 'sp-3',
          q: 'Wine and water are poured from which side — and why?',
          options: ['The left, to match food service', 'The right, because the glasses sit to the upper right', 'Whichever side is closest', 'The right, after lifting the glass'],
          correct: 1,
        },
        {
          id: 'sp-4',
          q: 'Plated food is served from the guest\'s…',
          options: ['Right, and cleared from the left', 'Left, and cleared from the right', 'Left, and cleared from the left', 'Nearest open side'],
          correct: 1,
        },
        {
          id: 'sp-5',
          q: 'A guest thanks you. The refined response is…',
          options: ['"No problem!"', '"No worries at all."', '"Of course — my pleasure."', '"It\'s all good."'],
          correct: 2,
        },
        {
          id: 'sp-6',
          q: 'A guest says they like their wine "dry". They mean…',
          options: ['Strong and high in alcohol', 'Served without ice', 'Not sweet', 'Aged and full-bodied'],
          correct: 2,
        },
        {
          id: 'sp-7',
          q: 'A guest asks if a dish contains nuts and you\'re not completely sure. You…',
          options: ['Say it should be fine', 'Check with the kitchen — never guess on an allergy', 'Suggest a different dish', 'Read them the menu description'],
          correct: 1,
        },
        {
          id: 'sp-8',
          q: 'The test for music level in the dining room is…',
          options: ['Loud enough to fill silences', 'A fixed level set before service', 'Under the talk — tables converse without raising their voices', 'As quiet as possible'],
          correct: 2,
        },
        {
          id: 'sp-9',
          q: 'You genuinely need to move fast mid-service. You…',
          options: ['Move fast through the kitchen — never visibly through the dining room', 'Jog discreetly between tables', 'Speed-walk the shortest route', 'Wait until the rush passes'],
          correct: 0,
        },
        {
          id: 'sp-10',
          q: 'You\'ve finished setting a table. The last check is…',
          options: ['Count the covers one more time', 'Ask a colleague to glance at it', 'Look at it from the guest\'s chair, at their eye level', 'Photograph it for the pre-service brief'],
          correct: 2,
        },
      ],
    },
    {
      type: 'final-challenge',
      title: 'The Anniversary Table',
      instructions:
        'One evening of service, one story. Every decision earns points — the five-star move earns the most, but a solid professional call still counts.',
      intro:
        'Saturday, 7:15 PM at [Property]. The room is set to standard, the candles are lit, and table 12 — a party of four, booked by Mrs. Devries for her parents\' anniversary — has just been seated in your section. This evening is the craft. Ready?',
      beats: [
        {
          id: 'fc-1',
          setup: 'The four guests settle into their chairs. The napkins sit folded at each cover, and the table is watching you approach.',
          prompt: 'The first touch of the meal. How does it go?',
          options: [
            { text: 'Leave the napkins — guests prefer to handle their own, and hovering this early feels intrusive.', points: 0, feedback: 'You place the napkin for the guest; you never leave them to handle it. The first touch of the meal sets the tone for all of it.' },
            { text: 'Step in from the right, open each napkin in one smooth motion, and lay it gently across each lap.', points: 2, feedback: 'Exactly — from the right, one calm motion, no fuss. A napkin placed with care says the evening is in good hands.' },
            { text: 'Hand each guest their napkin with a smile as you pour the water.', points: 1, feedback: 'Warm, but rushed — handing works for a single guest; a seated party gets the napkin opened and laid across the lap.' },
          ],
        },
        {
          id: 'fc-2',
          setup: 'First course is up: four plates, ready together. Mrs. Devries booked the table; her mother and father sit across from her and her husband.',
          prompt: 'Who gets served, in what order?',
          options: [
            { text: 'Start with the plate nearest you and work clockwise — it\'s the smoothest path around the table.', points: 0, feedback: 'Clockwise is convenience, not precedence. The order is ladies first, then gentlemen, then the host last — and a table like this notices.' },
            { text: 'Serve Mrs. Devries first — she booked the table and she\'s paying.', points: 1, feedback: 'You identified the host — but the host is served LAST, on purpose. It shows her guests were cared for before her.' },
            { text: 'Serve the mother first, then the two gentlemen, and Mrs. Devries — the host — last.', points: 2, feedback: 'Ladies first — honouring the elder guest — then gentlemen, and the host last, even though the host is a lady. Serving her last tells her that her guests came first.' },
          ],
        },
        {
          id: 'fc-3',
          setup: 'The main courses are in the window. As you approach with the first two plates, the father rises his glass — a toast to fifty years is beginning.',
          prompt: 'Hot plates in hand, a toast in the air. What do you do?',
          options: [
            { text: 'Serve quietly during the toast — the kitchen\'s timing comes first, and the plates are hot.', points: 0, feedback: 'Cutting across a raised glass breaks the very moment this dinner exists for. A held plate is always better than a broken moment.' },
            { text: 'Hold one step back, let the toast land, and serve in the breath that follows.', points: 2, feedback: 'The three-second read, executed. You protected the moment and still served promptly — arriving welcomed, not intrusive.' },
            { text: 'Withdraw to the sideboard and come back once they\'ve all settled back into conversation.', points: 1, feedback: 'You protected the moment — but a full withdrawal costs the plates. Hold close, let the toast finish, and serve in the gap right after.' },
          ],
        },
        {
          id: 'fc-4',
          setup: 'The mother is having the sole. She looks up: "What would you recommend with the fish? We don\'t know much about wine."',
          prompt: 'You know your foundations — not the full cellar. What do you say?',
          options: [
            { text: '"With the sole, a crisp white is lovely — light, fresh, served cold. And if you\'d like to go deeper, our sommelier would be delighted to pick something special for the occasion."', points: 2, feedback: 'Honest foundations confidently offered — white with fish, simply explained — plus the graceful handoff for depth. Never bluff, never shrink.' },
            { text: '"You know, the 2019 vintages from the Loire have this beautiful minerality —" and hope she doesn\'t ask a follow-up.', points: 0, feedback: 'Bluffing wine knowledge you don\'t have is the one unforgivable answer. A guest\'s trust doesn\'t survive the first follow-up question.' },
            { text: '"Let me get our sommelier for you — they know the list far better than I do."', points: 1, feedback: 'Safe and honest — but you skipped the guidance you DO have. White with fish, said simply, is exactly what this guest needed from you first.' },
          ],
        },
        {
          id: 'fc-5',
          setup: 'Mid-course, the husband knocks his glass — a red wine stain spreads on the cloth. He looks mortified. "I\'m so sorry — I\'ve made a mess of your beautiful table."',
          prompt: 'The cloth is marked and the guest is embarrassed. What now?',
          options: [
            { text: '"It\'s barely noticeable — please don\'t worry about it." Leave it; re-laying mid-meal makes it a bigger deal.', points: 0, feedback: 'Kind instinct, wrong standard. A flaw left in place tells the table the standard slipped — and the guest keeps staring at his mistake all night.' },
            { text: 'Reassure him warmly, cover the stain with a clean napkin at once, and re-lay the cloth properly at the next natural break.', points: 2, feedback: 'Both halves: the guest\'s dignity protected, the standard quietly restored. The mark leaves his sight immediately; the fix never makes a scene.' },
            { text: 'Strip and re-lay the table right now — the standard is the standard.', points: 1, feedback: 'The standard matters, but a full mid-course re-lay makes his small accident the event of the evening. Cover now, re-lay at the natural break.' },
          ],
        },
        {
          id: 'fc-6',
          setup: 'The father quietly signals you over: "I don\'t want to make a fuss — but this lamb is well past medium. It\'s not what I asked for."',
          prompt: 'A real complaint, gently raised, at an anniversary dinner. What do you say?',
          options: [
            { text: '"You\'re completely right, and I\'m sorry — let me put that right immediately." Fix it quietly, then return to check the new plate landed perfectly.', points: 2, feedback: 'Listen, own it for the house, fix it quietly, follow up. No fuss, no blame, no drama — a complaint handled with grace at exactly the moment it matters.' },
            { text: '"I\'m so sorry — the kitchen\'s been under real pressure tonight. I\'ll have them redo it."', points: 0, feedback: 'You never blame the kitchen in front of a guest — ever. The kitchen and floor are one team, and excuses make the guest feel like a problem.' },
            { text: '"I\'m so sorry about that — I\'ll have a new one fired right away."', points: 1, feedback: 'Owned and resolved — good. The missing layer is the follow-up: returning to confirm the new plate is exactly right is what closes the loop.' },
          ],
        },
        {
          id: 'fc-7',
          setup: 'Dessert is cleared elsewhere in your section; table 12 is deep in stories, glasses low, finished plates still in front of them. No one has looked up in minutes.',
          prompt: 'The table needs attention — and doesn\'t want interruption. How do you give both?',
          options: [
            { text: 'Step in and ask "May I clear these for you?" — it\'s polite, and the table needs clearing.', points: 1, feedback: 'Polite, but you made them stop for you. The cutlery already said "finished" — invisible service clears in the gaps without asking the table to pause.' },
            { text: 'Wait for the natural lull, then clear quietly from the right and top up the glasses from the side — without breaking the conversation.', points: 2, feedback: 'Invisible service: the care is felt everywhere and noticed nowhere. The table stays in their evening; the table stays perfect. Both, at once.' },
            { text: 'Leave them completely — clearing can wait until they pause on their own, however long that takes.', points: 0, feedback: 'Invisible doesn\'t mean absent. Low glasses and finished plates are needs you\'ve already noticed — serve them in the gaps, don\'t abandon them.' },
          ],
        },
        {
          id: 'fc-8',
          setup: '10:40 PM. Coffee is done. Mrs. Devries catches your eye with a small nod toward her handbag. Fifty years have been well celebrated.',
          prompt: 'The close of an anniversary evening. What does it look like?',
          options: [
            { text: 'Bring the bill discreetly to Mrs. Devries, and as they rise: "It was an honour to look after tonight — happy anniversary. We would love to see you all again."', points: 2, feedback: 'Read the host\'s signal, settle discreetly with her, and close with warmth that references THEIR evening. This is the last thing they\'ll remember — and it lands.' },
            { text: 'Bring the bill promptly and thank the table warmly as they leave.', points: 1, feedback: 'Prompt and warm — but generic, and placed before the whole table rather than discreetly with the host who signalled. The close deserved the same craft as the meal.' },
            { text: 'Hold back — after such a lovely evening, presenting a bill feels abrupt. Let them ask when they\'re truly ready.', points: 0, feedback: 'Her nod WAS the ask. Making the host request the bill twice at the end of a flawless evening is the one flaw she\'ll remember.' },
          ],
        },
      ],
    },
  ],
};

// ─── CONFIG REGISTRY ─────────────────────────────────────────

const EXAM_CONFIGS: ExamConfig[] = [casualDiningPhase1, fastCasualPhase1, fineDiningPhase1];

export function getExamConfig(track: string | null | undefined, phaseNumber: number): ExamConfig | null {
  if (!track) return null;
  return EXAM_CONFIGS.find((c) => c.track === track && c.phaseNumber === phaseNumber) ?? null;
}
