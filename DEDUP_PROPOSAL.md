# Hostia Curriculum — De-duplication & Contradiction Resolution Proposal

> **Status: proposal only. No source files were modified.**
> Investigation 2026-08-21 · Source: `CONTENT_AUDIT.md` §7.4 + §7.5, verified against `src/lib/curriculum.ts`, `src/lib/scenarios.ts`, `src/lib/exam.ts`.

> ### ⚠️ Revision 2 — citation apparatus rebuilt
> Revision 1 of this document expressed every edit target as a **line number**. A review pass found roughly a quarter of them wrong — most off by 1–4, two pointing at entirely unrelated quiz questions, and **five stated deletion ranges that would have removed structural delimiters and broken the TypeScript file**. The *analysis* survived review intact; the *edit plan* was not safe to execute.
>
> This revision replaces every actionable citation with a **verbatim anchor string** (`file » "text"`). An anchor either matches exactly once or it doesn't — the failure is loud instead of silent. Every anchor and every line number below has been mechanically verified against the current tree; re-verify with `scripts/verify-dedup-anchors.py` (Part G) before editing, since line numbers drift as soon as the first edit lands.
>
> Three substantive claims were also corrected — see **Part H** for the full list of what changed and why.

> ### ✅ Revision 3 — both open questions closed (2026-08-21)
> **D11 is answered from the code, not from inference**, and it answers the *opposite* way revision 2 assumed — see **A2** and **Part D**. **D10 is decided**: content changes now carry a mandatory completion reset, written up as a standing rule in **Part I**.
>
> Two further corrections fell out of verifying them: `runner-coordination` and four other scenarios are **orphans no lesson links to**, which demotes A4(a) from "the only live defect" (**A4**, **Part F**), and the fast-casual exam grades the thanks-response axis **twice** (**C8**).

> ### ✅ Revision 4 — quiz-integrity policy added (2026-08-24)
> Answer-position balance is now a **standing rule for all quiz writing** (**Part J**), applied to Step 1's nine replacements. Measuring the corpus to set the rule turned up a defect larger than the batch: **position A is correct in 0 of 313 questions**, and **70 % of lesson quizzes can be passed by rote** with no knowledge of the content. The platform-wide fix is **backlogged**, not folded into this pass.
>
> Two smaller additions: **`[X]` is overloaded three ways, not two** (Part E constraint 2 — the third is inside a graded quiz option), and the "guest looking around" signal is graded **four** times to one casual trainee (**C9**, backlogged — it contradicts B2 edit 5's "unique and good").

---

## 0 · How to read this

Each item carries a **verdict** and a **confidence**:

| Confidence | Meaning |
| --- | --- |
| 🟢 **High** | The conflict is mechanical and the resolution follows from the code. Safe to implement on your approval alone. |
| 🟡 **Medium** | The conflict is real and verified, but the *right* answer depends on a hospitality judgement I can defend but not prove. Read my reasoning before approving. |
| 🔴 **Needs a human decision** | I am not confident. Approving my guess would risk teaching real staff a wrong standard. Listed again in **Part D**. |

Verdicts use three resolution types:

- **CANONICAL** — pick one version, delete or fold in the other.
- **CONFIGURABLE** — the fact is genuinely property-specific. It should become a slot fed from `property_intake` / `property_overrides`, not a fixed truth.
- **SCOPED** — both versions are correct, but for different tracks/registers. Fix by making the scoping explicit rather than by choosing.

**Citation format.** Evidence tables give a line number *and* a quoted anchor: `curriculum.ts:819 » "No problem."`. Edit instructions give the **anchor only** — line numbers are deliberately omitted there so nobody edits by offset.

### Three implementation constraints that shape every recommendation

1. **Lesson IDs are immutable identity.** `lesson_completions` is keyed `UNIQUE(staff_id, lesson_id, phase)` (audit §2.5). Deleting a lesson does not just remove content — `computeTotalXp` (`progress-model.ts:200–210`) resolves lesson XP by iterating the *live* curriculum, so a removed lesson's XP **disappears retroactively** from every staff member who already earned it. Their hero XP number goes down.
   → **Prefer emptying/rescoping a lesson over deleting it.**

2. **`totalLessons` and `xpTotal` are hardcoded per module**, not derived (e.g. `onboarding` at `curriculum.ts:2500` and `:2503`). Adding or removing a lesson must update **three** places in sync: the lessons array, `totalLessons`, and `xpTotal`. `completedCount` clamps to `totalLessons` (`progress-model.ts:214–219`), so a mismatch silently breaks module completion.

3. **🆕 Fixing content does not reach staff who already completed the lesson.** `lesson_completions` rows are keyed `(staff_id, lesson_id, phase)`, and quizzes are the `practice` phase. Anyone who has already passed `reading-table` or `handling-complaints` keeps their row and **will never be shown the corrected content**. For the two items where the trainee was actively taught something wrong — **C1** (shown "You guys ready?" as a model DO, then penalised for it in a graded roleplay) and **B7** (graded on the wrong clearing trigger) — the fix does not reach the people it was written for.
   → **A re-attestation decision is required and no item below resolves it.** Options: (a) accept the gap for existing staff, (b) delete `lesson_completions` rows for the affected `lesson_id`s to force a retake, (c) add a lightweight "standard updated" acknowledgement flow. **This is a Part D question — see D10.**

---

# PART A — The six contradictions from §7.5

---

## A1 · Greeting speed: "5 seconds" is hardcoded as a house standard in 16 places

**Verdict: CONFIGURABLE** · **Confidence: 🟢 High** (that it must become a slot) / 🔴 needs your call on the default

### The conflict

`five-second` teaches, quizzes, and names itself after a 5-second standard. Maison Test's intake declares 30 seconds.

| Layer | Location | Anchor |
| --- | --- | --- |
| Lesson id + title | `curriculum.ts:294–295` | `id: 'five-second'` / `title: 'The 5-Second Rule'` |
| Lesson desc | `curriculum.ts:296` | `"Immediate greeting within 5 seconds of arrival"` |
| Intro prose | `curriculum.ts:302` | `"The first five seconds set the emotional tone"` |
| **Rule callout** | `curriculum.ts:303` | `"Every guest is acknowledged within 5 seconds of stepping through the door."` |
| **Quiz (graded)** | `curriculum.ts:319` | `"What is the [Property] standard for greeting speed?"` → correct **5 seconds**; distractor **30 seconds** |
| Second rule callout | `curriculum.ts:365` (`multilingual`) | `"Greet every guest within 5 seconds."` |
| 10-step spine | `curriculum.ts:716` | `"Greet within 5 seconds of arrival. Confirm reservation."` |
| Module subtitle | `curriculum.ts:2510` | `"The first 5 seconds shape the entire experience"` |
| Scenario opening | `scenarios.ts:30`, `:104` | `"You have 5 seconds. Go."` |
| **Scenario goal (graded)** | `scenarios.ts:33` | `"Greet the family within 5 seconds with genuine warmth."` |
| **Scenario grading rule** | `scenarios.ts:42` | `"Greeting within 5 seconds (timer is 45 seconds"` |
| Scenario grading rule | `scenarios.ts:116` | `"Greeting within 5 seconds (simulated by how quickly"` |
| **Exam sequencing (graded)** | `exam.ts:247`, `:489`, `:733` | `'Reception — greet within 5 seconds'` (all three tracks) |
| **Exam feedback** | `exam.ts:344`, `:586` | `"The 5-second rule doesn't require free hands"` |

`curriculum.ts:317` already contradicts the headline internally: it accepts *"finish within 10 seconds"* as correct behaviour while `:319` insists the standard is 5.

### Recommendation

**Do not pick a canonical number.** Introduce a `[GreetingSeconds]` slot fed from a new `property_overrides` key (default `5`), following the `[Property]` precedent in `src/lib/substitute-property.ts`.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `Every guest is acknowledged within 5 seconds of stepping through the door.` | → `within [GreetingSeconds] seconds` |
| 2 | curriculum.ts | `Greet every guest within 5 seconds. If you detect their language` | → `within [GreetingSeconds] seconds` |
| 3 | curriculum.ts | `Greet within 5 seconds of arrival. Confirm reservation.` | → `within [GreetingSeconds] seconds` |
| 4 | curriculum.ts | `desc: 'Immediate greeting within 5 seconds of arrival'` | → `within [GreetingSeconds] seconds` |
| 5 | curriculum.ts | `title: 'The 5-Second Rule'` | → `The [GreetingSeconds]-Second Rule` (cosmetic; **leave `id: 'five-second'` alone** — constraint 1) |
| 6 | scenarios.ts | `Greet the family within 5 seconds with genuine warmth` · `Greeting within 5 seconds (timer is 45 seconds` · `Greeting within 5 seconds (simulated by how quickly` | same slot — **graded**, must not diverge from the lesson |
| 7 | exam.ts | `'Reception — greet within 5 seconds'` (**3 occurrences** — one per track config) | same slot |

**The quiz cannot be templated as-is.** `curriculum.ts:319` has options `['30 seconds','10 seconds','5 seconds','1 minute']` with fixed `correct: 2`. A property whose answer is 30 would be graded wrong on its own policy. Recommended fix — **rewrite the stem to test the principle**:

> *"You're mid-task when a guest walks in. What does the house standard require?"* → correct: *"Acknowledge them within the house greeting window, even if it's only eye contact and 'I'll be right with you.'"*

This survives any property value and needs no new mechanism. (Anchor: `What is the [Property] standard for greeting speed?`)

Leave the intro prose (`The first five seconds set the emotional tone`) and the module subtitle for the AI tailoring pass — rhetorical, not standards.

### 🔴 Needs a human decision — **D1**
Is 5 seconds the Hostia house default, or is greeting speed a required intake field with no default?

---

## A2 · "No problem" replacement: *"Absolutely — my pleasure"* vs *"Of course — my pleasure"*

**Verdict: CONFIGURABLE with a track-scoped default** · **Confidence: 🟢 High**

### The conflict

| Side | Location | Anchor |
| --- | --- | --- |
| A | `curriculum.ts:819` (`banned-phrases`, module `language`, **universal**) | `dont: '"No problem."', do: '"Absolutely — my pleasure."'` |
| A | `curriculum.ts:828` | `Choose "absolutely" or "my pleasure" instead.` |
| A | **`curriculum.ts:837` (graded)** | correct = `"Absolutely — my pleasure."` |
| B | `curriculum.ts:1770` (`fdp-voice`, **fine-only**) | `"Of course" instead of "no problem."` |
| B | `curriculum.ts:1774` | `do: '"Of course — right away."'` |
| B | `curriculum.ts:1784` | `Replace "no problem" with "of course" until it is automatic.` |
| B | **`curriculum.ts:1792` (graded)** | correct = `"Of course — my pleasure."` |

Fine dining ships **both** (audit §3.3 — `language` is module 10 on that track). Two graded questions, same stem, different correct answers.

**Two corrections to the audit:**

1. **The audit says `fdp-voice` "treats 'Absolutely'-register as a level-drop." It does not.** `curriculum.ts:1766` names only *"no problem," "you guys," "no worries"*; the `fine-dining-voice` scenario (`scenarios.ts:1972`, `:1981`) penalises those three plus *"honestly," "yeah," "for sure," "totally"*. **"Absolutely" is nowhere penalised.** The lessons are not in opposition on register — they picked different words for the same slot.

2. **🆕 Correcting revision 1 of this document:** I previously wrote that "the exam layer is already correctly split." That overstated it. The two "my pleasure" items in `exam.ts` are at `:549` — inside **`fastCasualPhase1`** (`exam.ts:431–670`), not the casual exam — and `:781` inside `fineDiningPhase1` (`:671–910`). That part stands.

3. **🆕 Correcting revision 2 of this document — the D11 premise was wrong.** Revision 2 wrote that `casualDiningPhase1` "never tests this at all." **It does test it — once, and negatively.** `exam.ts:203` (`sm-2`, sort-match round *Five-Star or Fix It*) reads `Telling a guest who thanks you: "No problem!"` → bucket `fix-it`. What the casual exam never does is state the *correct replacement*: it bans the phrase without naming the house response.

   But the exam was the wrong place to look. **`banned-phrases` is a universal lesson** — `language` is in `config.ts:22` `activeModules` — so **every casual trainee is already taught and graded on `"Absolutely — my pleasure."`** at `curriculum.ts:819` (do/dont) and `curriculum.ts:837` (graded, `correct: 2`). The casual default is therefore **an existing product decision that is live in production today**, not an inference. **D11 is closed** — see Part D.

### Recommendation

Introduce a `[ThanksResponse]` slot fed from `brand_tone_notes` (audit §8.2 already routes that field here):

- fast-casual → `Absolutely — my pleasure` *(anchored in `exam.ts:549`)*
- fine dining → `Of course — my pleasure` *(anchored in `exam.ts:781`)*
- casual → `Absolutely — my pleasure` ✅ *(anchored in `curriculum.ts:837` — the universal `banned-phrases` graded question that casual trainees already take. **D11 closed.**)*

So the default is **not** track-scoped three ways: it is `Absolutely — my pleasure` everywhere except fine dining, which overrides to `Of course — my pleasure`. One default plus one override, which is what `brand_tone_notes` already expresses.

**Caveat that survives the slot:** `exam.ts` is *not* templated (Part E, constraint 4). `exam.ts:549` and `:781` keep their literal correct answers, so a property that overrides `[ThanksResponse]` to something else will teach its own phrase in the lesson and then grade the Hostia phrase in the Phase-1 exam. Either accept that exams test the Hostia standard rather than the house standard — defensible, and worth saying out loud in the exam framing — or restrict `[ThanksResponse]` overrides to properties whose staff have not reached the exam. **Do not template the exam for this.**

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `do: '"Absolutely — my pleasure."'` | → `'"[ThanksResponse]"'` |
| 2 | curriculum.ts | `'"No problem" — Implies it could have been a problem. Choose "absolutely" or "my pleasure" instead.'` | → `…Use the house response instead.` (drop the word list — it is what created the clash) |
| 3 | curriculum.ts | `"Of course" instead of "no problem."` · `do: '"Of course — right away."'` · `Replace "no problem" with "of course" until it is automatic.` | → same slot |
| 4 | curriculum.ts | `A guest thanks you for handling a problem quickly. Which response is correct?` | template **option index 2 only** → `'"[ThanksResponse]"'`; leave `correct: 2` |
| 5 | curriculum.ts | `A guest thanks you and you want to respond well. What do you say?` | template **option index 1 only** → `'"[ThanksResponse]"'`; leave `correct: 1` |

Unlike A1, this quiz **is** safely templatable: both candidate values occupy one option slot in each question, so the correct index never moves.

Once slotted, the two lessons stop contradicting and become **redundant** instead — see **C6** on whether `banned-phrases` should ship to fine dining at all.

---

## A3 · The bill: prompt-on-signal vs never-unprompted

**Verdict: CONFIGURABLE** · **Confidence: 🟡 Medium**

### The conflict

The corpus is internally **consistent** — every live site teaches *prompt on the signal*. The conflict is policy-vs-content, not lesson-vs-lesson.

| Location | Anchor |
| --- | --- |
| `curriculum.ts:1490` (`table-turns`) | `Cards or wallet appearing on the table — they want the bill now; don't make them ask.` |
| `curriculum.ts:1497`, `:1506` (graded) | `Present the bill warmly and with no pressure: "whenever you're ready, no rush at all."` |
| `curriculum.ts:1118`, `:1129` (graded, `guest-types`, **universal**) | `anticipate the bill request and have it ready without being asked` |
| `curriculum.ts:1525` (`floor-efficiency`) | `proactive reads the close and has it ready at the right moment` |
| `exam.ts:312–313` (casual, graded) | `Cards and a wallet appear on the table. You…` → correct **"Bring the bill without making them ask"** |
| `exam.ts:554–555` (fast-casual, graded) | `Cards and a wallet land on the table. You…` → same |
| `exam.ts:410–415` (casual final challenge) | **2 pts** prompt bill on wallet signal; **0 pts** "let them flag you" |
| `exam.ts:652–657` (fast-casual final challenge) | same |
| `exam.ts:899–901` (**fine dining** final) | **2 pts** bill on the host's nod; **0 pts** holding back |
| Maison Test intake | *"Bill is never dropped unprompted."* |

The only counterweight is `fda-pacing` (`curriculum.ts:2240`, `:2259`), which calls "bringing the bill before it is wanted" a rushing signal. **But `fda-pacing` is parked** (`fineDiningAnticipatoryLessons`, `curriculum.ts:2225–2263`, in no module — audit §6). It ships to nobody. So there is **no live contradiction**, only a live conflict with a client's stated rule.

Note `exam.ts:899` may already be compatible with Maison Test: Mrs. Devries' nod *is* the ask, and the feedback says so ("Her nod WAS the ask"). A tasting-menu house's real objection is to the *wallet-on-table* trigger.

### Recommendation
`[BillPolicy]` slot, two values: `on-signal` (default, current content) / `on-request`.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `Cards or wallet appearing on the table — they want the bill now; don't make them ask.` | gate on `[BillPolicy]` — becomes a slot-fed string, not a literal |
| 2 | curriculum.ts | `Present the bill warmly and with no pressure` | same |
| 3 | curriculum.ts | `anticipate the bill request and have it ready without being asked` (**`guest-types`, universal, graded — sharpest conflict, reaches all three tracks**) | → `have it ready to move the moment they signal` — true under both policies, keeps the quiz answer stable |
| 4 | curriculum.ts | `Suits plus laptop equals business mode.` … `Have the bill ready before they ask.` (the `explain` of the same graded item) | same softening |
| — | exam.ts | `Cards and a wallet appear on the table. You…` · `Cards and a wallet land on the table. You…` | ⛔ **Blocked.** Under `on-request` these need item *swaps*, not rewording — which requires exam templating that does not exist. |

**Do nothing to `fda-pacing` while it stays parked.** But note: un-parking `fineDiningAnticipatoryLessons` makes `curriculum.ts:2240`/`:2259` a live contradiction with `table-turns`/`guest-types` and with all three exams. Un-parking is not a free action — see **D9**.

### 🟡 Why medium confidence
Confident about the mapping; less confident two values cover the space. A bar-tab house, a pay-at-counter fast-casual, and a tasting-menu house may each differ — and fast-casual arguably shouldn't be taught table-bill etiquette at all (audit §3.1 flags `service-flow` as a poor fast-casual fit). See **D8**.

---

## A4 · Serve side — four sites, and one is graded *backwards*

**Verdict: CANONICAL (bug fix) + CONFIGURABLE (the hedge)** · **Confidence: 🟢 High on the bug** / 🟡 Medium on the slot

### The conflict — worse than §7.5 describes

The audit lists two sides. There are **four**, and one teaches the exact inverse *inside a graded roleplay*.

| # | Location | Module / track | Anchor |
| --- | --- | --- | --- |
| 1 | `curriculum.ts:582` (`plate-carrying`) | `physical-craft`, **universal** | `Serve from the correct side (property standard).` — hedged, nowhere to read the standard from |
| 2 | `curriculum.ts:721` (`ten-steps`, step 6 "Food Service") | `service-flow`, **universal** | `Serve from the correct side. Never interrupt conversations.` — hedged, no note at all |
| 3 | `curriculum.ts:1923` + steps + **`:1948` (graded)** (`fde-service-direction`) | fine-only | **Absolute:** `Serve from the left. Clear from the right. Pour from the right.` |
| 4 | **`scenarios.ts:1171`** (`runner-coordination` — ⚠️ **orphan, see below**) | *none — no lesson links it* | **Absolute and inverted:** `Correct at [Property]: food from the right, drinks from the left.` |

Site 4 is scored under `standards_knowledge` (`scenarios.ts:1182`). The exam scores the opposite: `exam.ts:775–776` → *"Left, and cleared from the right"*; `exam.ts:769–770` → poured from *"The right, because the glasses sit to the upper right."*

> ### ⚠️ Correction to revision 2 — site 4 is in **parked code**
> Revision 2 attributed `scenarios.ts:1171` to **`six-top-all-at-once`** (lesson `synchronized-service`, universal). **It does not live there.** `six-top-all-at-once` spans `scenarios.ts:893–…`; line `:1171` is inside **`runner-coordination`** (`:1146–1186`) — the Marco/table-8 runner scenario — and `:1182`'s `scoreKeys` belong to that scenario too.
>
> **`runner-coordination` is an orphan.** No lesson in `curriculum.ts` carries `scenarioId: 'runner-coordination'`, and `ApplyPhase.tsx:120` reaches a scenario **only** through `lesson.scenarioId`. There is no UI path to it. It is one of **five orphans** — `drinks-upsell`, `order-taking-allergy`, `overcooked-burger`, `runner-coordination`, `two-minute-check` — out of 62 scenarios; the other 57 are each linked to exactly one lesson, and no lesson references a missing scenario.
>
> **Consequence:** nobody is being graded backwards today. This is the same shape as `fda-pacing` in A3 — a real contradiction sitting in code that ships to nobody. Fix it anyway (it is one line and it will bite whenever the scenario is adopted), but it is **not** the urgent live defect Part F ranked it as, and it needs **no completion reset** under Part I. Decide the orphans' fate the same way D9 decides `fineDiningAnticipatoryLessons`: adopt them or delete them, rather than leaving them to drift.

**Concretely:** a fine-dining trainee is graded **correct** for the exact opposite of "food from the right, drinks from the left" in `fde-service-direction`'s quiz and again in the Phase 1 exam — and *would* have been graded correct for the inverted version too, if `runner-coordination` were reachable. `curriculum.ts:247` (`your-first-shift`) even uses *"which side do I serve from?"* as its worked example of a question worth asking — the one question the curriculum answers three incompatible ways.

### Recommendation

**(a) Fix `scenarios.ts:1171` as a bug — canonical, no config.** 🟢 High. The convention taught everywhere else (serve left, clear right, pour right) is also what the exam grades. Site 4 is an outlier, contradicts the graded exam, and asserts a house standard it has no authority for. **Still an unambiguous defect rather than a design question — but in parked code, so it is cheap, not urgent** (see the correction above).

**(b) Make the convention a slot — `[ServeSide]` / `[ClearSide]` / `[PourSide]`.** 🟡 Medium. American-style (serve right, clear right) is a legitimate house standard, and sites 1 and `your-first-shift` were both *written expecting a house answer to exist* — closing the §8.4 gap.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | scenarios.ts | `Correct at [Property]: food from the right, drinks from the left.` | → `Correct at [Property]: follow the house service-direction standard — serve from the left, clear and pour from the right.` |
| 2 | curriculum.ts | `Serve from the correct side (property standard).` | → `Serve from the [ServeSide]; clear from the [ClearSide].` |
| 3 | curriculum.ts | `Serve from the correct side. Never interrupt conversations.` | → `Serve from the [ServeSide].` |
| 4 | curriculum.ts | `Serve from the left. Clear from the right. Pour from the right.` + the four step bodies + `Default order: ladies, then gentlemen, then the host last.`-adjacent tip items | → slots |
| 5 | exam.ts | `options: ['The left, to match food service', 'The right, because the glasses sit to the upper right'` · `options: ['Right, and cleared from the left', 'Left, and cleared from the right'` | → same slot, or the exam contradicts the lesson for any non-default property |
| 6 | scenarios.ts | `- Serve from the left, clear from the right, pour from the right` · `WARMTH INCREASES WITH: serving ladies first then gentlemen then host, serving from the left` | → same slot |

> **⚠️ Correction to revision 1.** Revision 1 pointed edit 4's quiz at `curriculum.ts:1947`. **That is the *precedence* question** (`In what order are guests served at a fine dining table?`). The serve-side quiz is `:1948` (`From which side do you place plated food, and from which side do you clear?`). Editing by the old line number would have slotted `[ServeSide]` into the ladies/gentlemen/host question.

**Quiz caveat (same class as A1):** `curriculum.ts:1948` has options `['Serve from the right, clear from the left.','Serve and clear both from the left.','Serve from the left, clear from the right.','Always from whichever side is closer.']`, `correct: 2`. An American-standard property would be graded wrong. Either template option index 2 only (safe — both plausible values fit one slot), or rewrite the stem to test the *principle* (`so your arm never crosses in front of the guest`).

---

## A5 · Table cover: two different "standard" covers, taught in the wrong order

**Verdict: SCOPED + CONFIGURABLE** · **Confidence: 🟡 Medium**

### The conflict

| | `table-setting` (`curriculum.ts:625`) | `fdt-mise-en-place` (`curriculum.ts:2037`) |
| --- | --- | --- |
| Module / track | `physical-craft` — **universal** | `fine-dining-table-setup` — **fine-only** |
| Header | **`title: 'Standard cover setup'`** | `title: 'Setting a cover, piece by piece'` |
| Steps | 6 | 7 |
| Tablecloth | absent | `a pressed, spotless cloth laid square to the table` |
| Charger | absent | `The charger or show plate anchors the cover.` |
| Cutlery | `Left of the plate. Tines up` / blade inward | `outside-in`, `about a thumb's width`, blades inward |
| **Napkin** | **`On the plate or to the left of the fork.`** — a choice | **`Fold each napkin to the one house style`… `Sameness is the point.`** — no choice |
| Water glass | `Above the knife, positioned slightly to the right.` | `Set the glasses to the upper right of the cover` |

`fdt-mise-en-place` is strictly richer. The genuine conflicts are narrow:

1. `table-setting` calls its 6-step version **"Standard cover setup"** — presented as *the* standard, when for fine dining it is a subset.
2. It grants a **napkin-position choice** that `fdt-mise-en-place` explicitly forbids.
3. **Pedagogical order is inverted for fine dining.** `fine-dining-table-setup` is module #5 on that track; `physical-craft` is #8 (audit §3.3). Fine-dining trainees learn the fuller standard first, then meet a looser one labelled "standard" — reading as a downgrade of a rule they were just given.

The quizzes do **not** contradict: `curriculum.ts:655` (blade inward) and `:2066` (blades turned inward) agree; `:656` (glass above knife, slightly right) and `:2068` (upper right) agree.

### Recommendation
**Do not merge.** They are correctly *scoped* and badly *labelled*.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `title: 'Standard cover setup'` | → `title: 'The basic cover'` |
| 2 | curriculum.ts | `title: 'Setting a cover, piece by piece'` | → `title: 'The [Property] cover, piece by piece'` |
| 3 | curriculum.ts | `On the plate or to the left of the fork.` | → `[NapkinPosition]` slot (audit §8.4 lists this as uncaptured; `the one house style` is literally asking for it) |

Leave `Tines up, handle parallel to the knife.` alone — `fdt-mise-en-place` states no tine direction, so there is a **gap**, not a contradiction. See **D3**.

### 🟡 Why medium confidence
The labelling fix is right. But I'm not confident `table-setting` belongs in `physical-craft` at all for fast-casual — audit §9 fn.6 flags it as "wrong module assignment for fast-casual". Fixing the label without fixing the assignment leaves a counter-service property learning to lay a cover. That's a module-assignment decision, out of scope here.

---

## A6 · Proactive dessert upsell vs a tasting menu that forbids it

**Verdict: CONFIGURABLE — but the real problem is bigger than step 3** · **Confidence: 🟡 Medium**

### The conflict

| Location | Anchor |
| --- | --- |
| `curriculum.ts:1212` (`buying-signals`, step 3) | `"Can I tell you about our desserts? The [signature dessert] is made fresh daily"` — badge **`Proactive`** |
| `curriculum.ts:724` (`ten-steps`, step 9) | `Offer before they ask. Directed suggestion based on what they ordered.` |
| **`curriculum.ts:732` (graded)** | `When should you offer dessert or digestifs?` → correct **"Before guests ask — proactive, directed suggestion."** |
| `curriculum.ts:1488`, `:1496` (`table-turns`) | `this is your window to offer dessert or the bill` |
| `exam.ts:307` (casual, graded) | `options: ['When guests ask for the menu', 'At the natural lull, before they ask'` → correct index 1 |
| `exam.ts:255`, `:497`, `:741` (all three tracks) | `'Dessert & digestifs — offer before they ask'` |
| Maison Test intake | proactive dessert offers forbidden on the tasting menu |

### Recommendation — and a scope warning

Treating this as "toggle step 3 off" **under-reads it**. For a fixed tasting-menu property, `buying-signals` is not a lesson with one wrong step — its entire premise (four discretionary upsell moments across an à-la-carte meal) doesn't apply. All four steps (`curriculum.ts:1210–1213`):

- **1 On arrival** — `[signature drink]` — may apply (aperitif)
- **2 During ordering** — `The [dish] pairs really beautifully with [wine/side]` — **no dish choice exists on a tasting menu**; the analogue is a wine pairing, a different sale
- **3 After mains** — `[signature dessert]` — **dessert is a fixed course, not an offer**
- **4 With the bill** — digestif — may apply

**Two-level control:**
1. **`property_modules`-level** — a tasting-menu property should be able to drop `buying-signals` (or all of `guest-psychology`). **This mechanism already exists** — Bistro 91 is already hand-pruning `language` this way (audit §3.3).
2. **Slot-level** — an `[UpsellApproach]` slot (intake field `upsell_approach` already exists) controlling which moments render.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `title: 'Natural upselling moments', items: [` | `steps.items` becomes a slot-filtered list rather than four literals. **First place in the file where a block's item count varies by property** — the `LearnSection` union supports it (`items` is an array) but no resolver does it today. |
| 2 | curriculum.ts | `When should you offer dessert or digestifs?` (**graded, universal, all three tracks**) | rewrite the stem to test the principle: *"Step 9 is dessert and digestifs. What makes the step 'proactive' rather than 'reactive'?"* → *"You act at the right moment with a directed suggestion, rather than waiting to be asked"* — stays true where the "offer" is a pairing |

### 🆕 Unfilled placeholders — corrected inventory

Revision 1 said "five tokens in this one lesson." **That undercounted.** Full inventory of non-`[Property]` tokens shipping as literal bracket text today (`substitutePropertyDeep` handles only `[Property]`/`[PROPERTY]` — `substitute-property.ts:19–21`):

| Token | Locations | Lesson |
| --- | --- | --- |
| `[dish]` ×2 | `curriculum.ts:818` | `banned-phrases` |
| `[dish]` | `curriculum.ts:1086` | `prevention` |
| `[signature drink]` | `curriculum.ts:1210` | `buying-signals` |
| `[dish]` | `curriculum.ts:1211` | `buying-signals` |
| `[signature dessert]` | `curriculum.ts:1212` | `buying-signals` |
| `[option]` | `curriculum.ts:1213` | `buying-signals` |
| `[X]`, `[what makes it special]` | `curriculum.ts:1216` | `buying-signals` |
| `[dish]`, `[wine]` | `curriculum.ts:1217` | `buying-signals` |
| `[what makes it special]` | `curriculum.ts:1223` | `buying-signals` (**quiz explain — graded surface**) |
| `[wine]` | `curriculum.ts:1225` | `buying-signals` |
| `[dish]` | **`scenarios.ts:167`** | roleplay prompt |
| `[specific dish]` | **`scenarios.ts:610`** | roleplay prompt |

**15 tokens across 4 lessons plus 2 roleplay prompts** — and `scenarios.ts` was missing from revision 1 entirely. Part E's token table must cover `[what makes it special]` and `[specific dish]`, or literal brackets still ship after implementation. `[X]` at `curriculum.ts:1216` is *"I'd go with the [X]"* — a menu item, unlike the `[X]` party-size token in `multilingual` (`:367–370`). **Same token, two meanings — a token-map pass must disambiguate by context or one of them must be renamed.**

---

# PART B — The seven duplication clusters from §7.4

---

## B1 · Complaint protocol — 4-step vs 5-step, plus three near-duplicate graded questions

**Verdict: CANONICAL (merge toward LEARN)** · **Confidence: 🟢 High**

### The duplication

| Lesson | Extent | Module / track | Structure |
| --- | --- | --- | --- |
| `handling-complaints` | `curriculum.ts:919–955` | `language`, **universal** | `desc: 'The 4-step protocol…'` — Listen / Acknowledge / Resolve / Follow up (`:929–934`) |
| `learn-protocol` | `curriculum.ts:994–1025` | `complaints`, **universal** | `desc: 'The 5-step framework…'` — L·E·A·R·N (`:1003–1009`) |
| `common-situations` | `curriculum.ts:1026–1065` | `complaints`, **universal** | five scripted situations |
| `fde-table-conduct` | do-dont `curriculum.ts:1971–1976` + quiz `:1983` | fine-only | **one** block + **one** question |

> **⚠️ Correction to revision 1**, which gave the lesson as `:920–961` (961 is inside `complaintsLessons`) and the `fde-table-conduct` block as `:1978–1983` (`:1978` is `],`).

The two protocols are the **same**: LEARN's *Empathize* + *Apologize* is the single *Acknowledge*; *Notify* is *Follow up*. Neither is wrong. Both call themselves *the* protocol, in the same phase, to the same trainee.

**Verified overlapping graded content** (full near-duplicate scan of all 295 quiz stems):

| Similarity | A | B |
| --- | --- | --- |
| **0.77** | `curriculum.ts:950` `A guest says "We've been waiting 30 minutes." You say:` | `curriculum.ts:1058` `A guest says "We've been waiting 40 minutes." Which response is correct?` |
| **0.75** | `curriculum.ts:953` `After resolving a complaint, you should:` | `curriculum.ts:1021` `After resolving a complaint, what must you always do?` |
| same answer | `curriculum.ts:949` `A guest says "This is overcooked." You say:` | `curriculum.ts:1059` `A guest says their steak is overcooked. What's the first thing you do?` |

Three of `handling-complaints`' five graded questions have a near-twin in the same phase.

### Recommendation

**Canonicalise on LEARN** — more complete, externally anchored (`used by Marriott, Hilton and IHG`), and in the module named for the topic. Then **rescope rather than delete** `handling-complaints` (constraint 1: deleting it removes 50 XP retroactively).

Its unique contribution is the *language* of recovery, which appears nowhere else.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `title: 'The 4-step complaint protocol', items: [` | **Delete this whole `steps` block** — the sole source of the 4-vs-5 collision. Replace with a one-line cross-reference callout pointing at LEARN. **Delete from the `{ type: 'steps'` opener through its matching `]},` — do not delete by line offset.** |
| 2 | curriculum.ts | `label: 'Prohibited in complaint handling'` | **Keep** — unique |
| 3 | curriculum.ts | `title: 'Difficult scenarios — correct responses'` | **Keep** — unique scripts |
| 4 | curriculum.ts | `title: 'What guests actually want when they complain'` | **Keep** (but see **C2** for the escalation line inside it) |
| 5 | curriculum.ts | `desc: 'The 4-step protocol that turns a broken moment into a defining one'` | → retitle to the language framing, e.g. *"The words that turn a broken moment into a defining one"* |
| 6 | curriculum.ts | `A guest says "We've been waiting 30 minutes." You say:` · `After resolving a complaint, you should:` · `A guest says "This is overcooked." You say:` | **Replace all three** with language-focused questions drawn from the retained content (why *"I'm sorry but…"* fails; which prohibited phrase ends the relationship) |

`common-situations` and `fde-table-conduct` need **no change** — the first legitimately *applies* the protocol; the second's contribution is 1 block + 1 question, which is reinforcement.

### Implementation impact
Content-only. `handling-complaints` keeps its `id`, `xp: 50`, and `scenarioId`. `language.totalLessons` stays `4`, `xpTotal` stays `200`. **No XP regression** — but see constraint 3 / **D10** on staff who already completed it.

---

## B2 · Guest type profiles — the only verbatim duplicate in the file

**Verdict: CANONICAL** · **Confidence: 🟢 High**

### The duplication — verified verbatim

An exact-match scan of all **58** rule/tip/warn callout bodies in `curriculum.ts` found **exactly one** byte-identical pair:

- `curriculum.ts:412–417` (`reading-table`, module `greetings`) — multi-line callout object, `text:` at `:416`
- `curriculum.ts:1114` (`guest-types`, module `guest-psychology`) — single-line callout

> `Read the table before you open your mouth. Match energy to energy. A quiet couple doesn't need your best party energy — and a birthday table doesn't need a formal check-in. Service adapts to the guest, not the other way around.`

Both `label: 'The Standard'`, `tone: 'rule'`. Both modules ship to **all three tracks**.

The `culture-cards` are a superset relationship, not a copy:

| `reading-table` (`:418–438`, 4 cards) | `guest-types` (`:1115–1122`, 7 cards) | `our-guests` (`:210–213`, 3 cards) |
| --- | --- | --- |
| 💑 Couples | 💑 Romantic Couple | — |
| 👥 Groups (4+) | 👥 Friend Group (4+) | — |
| 💼 Business / Solo | 💼 Business Table **+** 🧳 Solo Traveler *(split)* | — |
| 🌍 Tourists (First-timers) | 🌍 Tourist (First-Timer) | 🌍 Travelers & First-Timers |
| — | 🏠 Local Regular | 🏠 Regulars & Locals |
| — | 👨‍👩‍👧 Family with Kids | — |
| — | — | 🎉 Celebration Guests |

Quiz overlap is heavy but not verbatim — the couple/nod-and-wait, birthday-group/match-energy, and suits+laptop/business-mode teaching points are each asked twice.

### Recommendation
**`guest-types` is canonical** — 7 cards vs 4, a "Golden move" line the others lack, and it sits in the module named for the topic.

### Edits — by anchor

> **⚠️ Correction to revision 1 — this is the change that would have broken the build.** Revision 1 said "delete `:413–419`" and "drop `:420–439`". The callout object actually spans **412–417**; `:418–419` open the `culture-cards` block. The culture-cards object spans **418–438**; `:439` opens the `do-dont` block that the same sentence said to keep. Both ranges would have left orphaned braces and a headless block. **Delete by matched brace, not by line range.**

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | In `reading-table`: the `{ … type: 'callout', … label: 'The Standard', … }` object whose `text:` begins `Read the table before you open your mouth.` | **Delete the whole object**, opening `{` through its matching `},`. Keep the identical callout in `guest-types`. |
| 2 | curriculum.ts | In `reading-table`: the `{ type: 'culture-cards', items: [ … ] }` object containing `group: '💑 Couples'` | **Delete the whole object**, opening `{` through its matching `},`. It is the strictly-poorer copy. **Stop before `{ type: 'do-dont', title: 'In practice'`** — that block is kept. |
| 3 | curriculum.ts | `title: 'In practice', items: [` (the `do-dont` in `reading-table`) and `title: 'Universal rules — every table, every time'` | **Keep both** — approach choreography (nod-and-wait, never hover, never interrupt mid-sentence) is `reading-table`'s unique contribution and `guest-types` doesn't cover it |
| 4 | curriculum.ts | `A couple is deep in conversation, haven't looked up, seated 3 minutes.` · `A group of 6 is celebrating a birthday, loud and happy.` · `A solo businessman has his laptop open and hasn't touched his menu.` | **Replace all three** with approach-technique questions |
| 5 | curriculum.ts | `A couple at table 5 has been waiting 8 minutes and is starting to look around.` | **Keep** — good, and unique *within `reading-table`*. ⚠️ It is **not unique in the corpus**: it is one of four graded sites teaching the same signal — see **C9**, backlogged. Keep it here; decide its fate there. |

**`our-guests` needs no change** — it is the *onboarding* framing, its 🎉 Celebration Guests card is unique, and audit §9 already classes it 🔴 needs real per-property content. Different job.

### ⚠️ Fix C1 in the same pass
`reading-table` also teaches `"You guys ready or still deciding?"` as a model DO — banned elsewhere and penalised in a graded roleplay. See **C1**.

---

## B3 · Proactive vs reactive — three lessons, but no trainee gets all three

**Verdict: SCOPED — leave two, trim one** · **Confidence: 🟢 High**

### Correction to the audit
§7.4 marks this "Tracks affected: **all**". Actual reach:

| Lesson | Location | Module | Fast-casual | Casual | Fine |
| --- | --- | --- | :-: | :-: | :-: |
| `proactive-reactive` | `curriculum.ts:737` | `service-flow` (universal) | ✅ | ✅ | ✅ |
| `floor-efficiency` | `curriculum.ts:1512` | `casual-dining-floor` (**casual-only**) | — | ✅ | — |
| `fdp-invisible` | `curriculum.ts:1832` | `fine-dining-presence-module` (**fine-only**) | — | — | ✅ |

**No trainee receives more than two.**

`fdp-invisible` earns its place — its subject is *invisibility* (timing, economy of motion, clearing in conversational gaps); only ~1 of 4 principles restates proactivity. **Leave it entirely alone** (audit §9 classes it 🟢 keep).

`floor-efficiency` opens with a full paragraph re-teaching proactive-vs-reactive, then a 5-item tip-list re-teaching it again, then quizzes it (`curriculum.ts:1540`, ratio **0.85** against `fda-recovery`'s `:2332`). A third of the lesson on a `service-flow` topic.

### Edits — by anchor

> **⚠️ Correction to revision 1.** It said "drop `:1520` and `:1521–1525`". The tip-list block actually spans **1521–1527** (items 1522–1526). Deleting `:1521–1525` would leave item `:1526` and the closer `]},` at `:1527` dangling. And "keep `:1526–1533`" was self-contradictory — `:1526` is an item the same section ordered deleted, and the 6-habit list runs **1529–1536**, so it dropped habits `:1534–1535` and the observant-regular intro at `:1537`.

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | The `intro` beginning `The best servers don't look like they're working harder than everyone else` | **Delete the whole block** |
| 2 | curriculum.ts | The `tip-list` object `{ type: 'tip-list', title: 'Proactive vs reactive — the shift', items: [ … ] }` | **Delete the whole object**, opener through its matching `]},` — **all five items**, not four |
| 3 | curriculum.ts | The `intro` beginning `Two habits turn attention into efficiency.` | **Keep** — opens the lesson on the scan |
| 4 | curriculum.ts | `title: '6 efficiency habits every floor server should build'` | **Keep, all six items**, opener through matching `]},` |
| 5 | curriculum.ts | The `intro` beginning `The observant regular is the ultimate test` | **Keep** |
| 6 | curriculum.ts | `What's the core difference between proactive and reactive service?` | **Replace** with a scan / one-trip question |

`proactive-reactive` needs no change, except see Part D on its embedded amenity assumptions (crayons, kids' menu, highchair, WiFi — audit §8.4 lists these as uncaptured).

---

## B4 · Uniform & grooming — three lessons, two real overlaps

**Verdict: SCOPED — narrow `our-standards`** · **Confidence: 🟢 High**

| Lesson | Location | Track reach | Content |
| --- | --- | --- | --- |
| `our-standards` | `curriculum.ts:177` | `onboarding` — **universal** | do-dont `:185–190`: arrive early **· clean uniform** (`:186`) · composure (`:187`) · **phones away** (`:188`) · speak respectfully (`:189`). Rule callout `:191`. |
| `showing-up-right` | `curriculum.ts:1269` | `casual-dining-standard` — **casual-only** | 6-item pre-shift checklist: uniform · badge · hair · hands · phone · posture. Plus the attitude ritual and body-language block. |
| `fds-uniform-grooming` | `curriculum.ts:1632` | `fine-dining-standard` — **fine-only** | 4-step checklist: uniform · hair · hands/nails · scent. Plus do-dont and an 8-item list. |

> **⚠️ Correction to revision 1**, which cited `:185` for the arrive item (that's the `do-dont` header — the item is `:186`) and `:187` for phones-away (that's the composure item — phones is `:188`).

The two track-specific lessons don't overlap each other (different tracks). Each overlaps `our-standards` on exactly two points: **clean uniform** and **phone away**. `our-standards` is the *weakest* of the three on uniform ("in clean uniform") and the *only* one on brand-representation and speak-respectfully.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `Arrive 10–15 minutes early, in clean uniform, groomed and ready to start on time.` | → `Arrive [ArrivalMinutes] minutes early and ready to start on time.` — drop the grooming clause (see **C3** for the arrival-time inconsistency) |
| 2 | curriculum.ts | `Put phones away during service — your attention belongs to the floor.` | **Keep.** Appears three times but it is one line; repeating a hard rule across onboarding + track module is defensible reinforcement. |

**Leave `showing-up-right` and `fds-uniform-grooming` untouched** — correctly scoped, track-appropriate, and 1:1 mappable to `uniform_grooming_standards` (audit §8.2). **Do not merge them** — they serve disjoint populations, and the only module both tracks share is `onboarding`, which would put detailed grooming standards before the trainee has any floor context.

---

## B5 · "Never walk empty-handed / pre-bus" — taught three times to the same casual trainee

**Verdict: CANONICAL** · **Confidence: 🟢 High** — *the strongest duplication in the corpus*

All three ship to a **casual-dining** trainee in Phase 1:

| # | Location | Module | Anchor |
| --- | --- | --- | --- |
| 1 | `curriculum.ts:610` (`floor-movement`, principle 5) | `physical-craft` (universal) | `Pre-bus passes` — `Never walk empty-handed past a table that needs attention.` |
| 1 | `curriculum.ts:621` (graded) | | `You are walking past table 3 on your way to the kitchen.` |
| 2 | `curriculum.ts:1386` (`speed-without-rushing`) | `casual-dining-standard` | `Pre-bussing — clear empty plates and glasses as you pass` |
| 2 | `curriculum.ts:1388` | | `Anticipating refills before they're asked — watch the glass line` |
| 2 | `curriculum.ts:1390` | | `Never walking the floor empty-handed — every trip out carries something` |
| 2 | `curriculum.ts:1397` (graded) | | `Which of these is a core habit of an efficient server?` |
| 3 | `curriculum.ts:1531` (`floor-efficiency`) | `casual-dining-floor` | `Live by the one-trip rule — never walk the floor empty-handed in either direction.` |
| 3 | `curriculum.ts:1532` | | `Pre-bus constantly — clear finished plates and glasses as you go` |
| 3 | `curriculum.ts:1533` | | `Anticipate the next need` |
| 3 | `curriculum.ts:1542` (graded) | | `What does the "one-trip rule" (never walking empty-handed) mean?` |

> **⚠️ Correction to revision 1**, whose numbers for both tip-lists were off by 1–4 throughout (it cited `:1387`/`:1389`/`:1391` and `:1527`/`:1528`/`:1529`), and which cited `floor-movement:611` (that's "Always moving with purpose") and `:622` (that's `],`, the quiz array terminator — deleting it breaks the file).

Sites 2 and 3 are a **four-of-five / four-of-six item overlap** between two tip-lists, in adjacent modules, same phase, both 9 min / 50 XP, both graded. The near-duplicate scan independently surfaced their quiz stems at ratio **0.77**.

### Recommendation
**`floor-efficiency` is canonical** — longer, better-articulated, and includes the **scan**, which nothing else teaches.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | The `tip-list` object `{ type: 'tip-list', title: '5 habits of efficient servers', items: [ … ] }` in `speed-without-rushing` | **Delete the whole object**, opener through matching `]},` |
| 2 | curriculum.ts | `Which of these is a core habit of an efficient server?` | **Replace** with a priority-ladder question |
| 3 | curriculum.ts | `You are walking past table 3 on your way to the kitchen. What should you do?` | **Delete this one quiz item object** (`{` through `},`) — same test as `floor-efficiency`'s one-trip question. **Do not touch the `],` that closes the quiz array.** `floor-movement` retains four unique items (right-side corridors, right of way, kitchen doors, wet floors). |
| 4 | curriculum.ts | `{ num: 5, title: 'Pre-bus passes'` | **Keep.** Its framing is *movement* ("every time you walk **past a table**"), it lands in `physical-craft` before either casual lesson, and one principle of six is legitimate foundation-then-depth. |

What remains in `speed-without-rushing` — the priority ladder, the calm-swan framing, the fast-vs-rushed distinction — is unique and matches the lesson's title.

### Implementation impact
Content-only. Three lesson IDs preserved; `casual-dining-standard` and `casual-dining-floor` keep `totalLessons`/`xpTotal`. **Note:** deleting a quiz item changes the pass threshold — `PRACTICE_PASS_RATIO = 0.8`, so 5 questions → `ceil(5×0.8)=4`, 4 questions → `ceil(4×0.8)=4`. `floor-movement` would go from 4/5 to **4/4**. Recommend replacing item 3 rather than deleting it, or adding a fifth.

---

## B6 · Describing a dish — this is a **contradiction**, not a duplication

**Verdict: SCOPED — recommend promoting to §7.5** · **Confidence: 🟢 High**

The audit files this as "two different formulas". Read in full, they take **opposite positions on what a description is for** — and both are graded, and fine dining gets both.

| | `describe-serving` (`curriculum.ts:844`) | `fmk-describing-dish` (`curriculum.ts:2379`) |
| --- | --- | --- |
| Module / track | `language` — **universal** (incl. fine dining) | `fine-dining-menu-knowledge` — fine-only |
| Framing | `desc:` `The 3-part formula that sells any dish` | `A good description is honest and appealing.` … `you never oversell` |
| Structure | **mandatory 3 parts**: Star → Method → Experience (`:854–856`) | `One strong line beats a full list of ingredients.` |
| Step-3 badge | `:856` **`badge: 'Close the sale'`** | — |
| Price | `:855` `justifies the price before they ask` | `not to push the most expensive dish` |
| Vocabulary | `:858` `you taste the technique in every bite`; `:861` `a long warming note that's completely ours` | `You do not need rare or fancy words.` … `not to be impressed by your vocabulary` |
| Length | `2-3 sentences maximum` | `Two or three sentences` ✅ *(the one agreement)* |
| **Graded** | `:875` correct = the 3-part formula applied to a **burger** | **`:2404` correct = "overselling pushes a dish and makes the guest put their guard up"** |

`a guest who feels **sold to** puts their guard up` is a direct rebuttal of `Close the sale`.

Compounding it: `describe-serving`'s worked examples are `hand-selected Wagyu`, `freshly ground beef blend… cast-iron flat top`, and a rum cocktail — burger-shop and bar copy, delivered to a fine-dining trainee immediately before a lesson telling them not to talk like that.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `desc: 'The 3-part formula that sells any dish or drink in one sentence'` | → `…that brings any dish or drink to life in one sentence` |
| 2 | curriculum.ts | `badge: 'Close the sale'` | → `badge: 'Make it real'` |
| 3 | curriculum.ts | `The method signals craft and pride — and justifies the price before they ask.` | → `The method signals craft and care.` |
| 4 | curriculum.ts | `Lead with the key ingredient or what makes it special. "This starts with hand-selected Wagyu..."` · the `Formula in action` callout · the three `do:` strings in `What makes a description land` | → `[MenuItem]`-shaped slots fed from `property_menu_items` (audit §8.2 assigns this lesson "all examples" to that source). **This is the change that makes the lesson safe on all three tracks.** |
| 5 | curriculum.ts | intro `The menu describes the dish. You bring it to life.` | **Keep** — good, and not a sales claim |

**Leave `fmk-describing-dish` untouched** — the more disciplined lesson, and the one that maps to `property_menu_items` (audit §10.3 names `fine-dining-menu-knowledge` as a starting point).

**Consider dropping `language` from fine dining entirely** — Bistro 91 already does. That resolves B6, A2, C1 and half of B1 in one config change, no code edit. See **C6** / **D2**.

---

## B7 · Cutlery "finished" signal — the clearing *trigger* is taught three incompatible ways

**Verdict: CANONICAL** · **Confidence: 🟢 High** — *recommend promoting to §7.5*

The three lessons the audit names agree on *what the signal means*. They disagree — along with two others and the exams — on **what you do when you see it**.

| Trigger | Location | Module / track | Anchor |
| --- | --- | --- | --- |
| **(a) Clear that plate, promptly** | `curriculum.ts:1489` (`table-turns`) | `casual-dining-floor` | `the universal "I'm done" signal; don't leave it sitting.` |
| | **`curriculum.ts:1505` (graded)** | | correct = `They're finished with the course — clear it promptly.` |
| | `curriculum.ts:1524` (`floor-efficiency`) | `casual-dining-floor` | `proactive clears the finished plate the moment cutlery goes down` |
| **(b) Wait for the LAST guest, clear all together** | **`curriculum.ts:696` (graded)** (`synchronized-service`) | `physical-craft` — **universal** | correct = `When the last guest finishes — then all plates together`; explain: `Never clear while someone is still eating.` |
| | `curriculum.ts:675` | | `Clear simultaneously` — `One plate at a time is amateur` |
| | **`curriculum.ts:731` (graded)** (`ten-steps`) | `service-flow` — **universal** | correct = `Wait until everyone finishes, then clear simultaneously.` |
| | `exam.ts:254`, `:496`, `:740` | all three exams | `'Clearing — synchronized, never while someone eats'` |
| **(c) Clear in the next natural pause** | `curriculum.ts:2006` (`fde-formal-settings`) | fine-only | `That is your cue to clear, in the next natural pause.` |
| | **`curriculum.ts:1864` (graded)** (`fdp-invisible`) | fine-only | **`The instant the guest puts down their fork, mid-sentence if needed` is the WRONG answer**; `In the natural lull` is correct |
| | `curriculum.ts:2220`, `:2242` (`fda-*`) | **parked** | same as (c) |

> **⚠️ Correction to revision 1**, which cited `curriculum.ts:673` for `Clear simultaneously` (`:673` is "All plates go out together"; the anchor is `:675`) and `exam.ts:736` for the fine-dining clearing item (`:736` is "Drinks"; it is `:740`).

**(a) and (b) are directly opposed**, and a **casual-dining trainee receives both** — `physical-craft` and `service-flow` are universal, `casual-dining-floor` is on their track. Graded on (b) twice in lessons and again in the exam; graded on (a) at `:1505`. No reading makes both correct.

**(c) is compatible with (b)**, and both ship to fine dining — no conflict there. **Fine dining never receives (a)** (`table-turns` and `floor-efficiency` are casual-only), so the fine-dining half of the audit's cluster is not a live problem.

### Recommendation
**(b) is canonical**, absorbing (c) as its fine-dining refinement:

> Clear when the **last** guest at the table has finished, all plates together, **in the next natural pause**.

(b) is taught in two universal modules, graded twice in lessons, and graded in **all three exams** — widest reach, most authority. (a) is casual-only and reads as imprecise writing rather than a position: `table-turns`' subject is table *turns*, so "don't leave it sitting" is about not stalling the table.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `Cutlery laid together on the plate — the universal "I'm done" signal; don't leave it sitting.` | → `…the universal "I'm done" signal. Once the last guest at the table shows it, clear together in the next natural pause.` |
| 2 | curriculum.ts | `They're finished with the course — clear it promptly.` (graded option) | → `They're finished with the course — clear the table together once the last guest signals.` Update the matching `explain`. **Options count and `correct` index unchanged.** |
| 3 | curriculum.ts | `Reactive clears when asked; proactive clears the finished plate the moment cutlery goes down.` | → `…proactive reads the finished signal and has the table cleared together in the next pause.` |
| 4 | — | `curriculum.ts:696`, `:731`, `:2006`, `:1864`, `exam.ts:254/496/740` | **No change** — already correct |

**For un-parking:** `fda-pacing`'s `When the last guest at the table sets their cutlery together, the course is finished. Clear quietly in the next natural pause.` already states (b)+(c) correctly — the best-written version in the file. Use it as canonical source if `fineDiningAnticipatoryLessons` is ever un-parked.

---

# PART C — Findings the audit's list of 6 did not include

Three independent sweeps over `curriculum.ts` (295 quiz stems, 58 callout bodies, 132 do/dont strings, 171 step/principle bodies, 40 culture-card cues) plus targeted greps across `scenarios.ts` and `exam.ts` on eleven policy axes.

---

## C1 · 🔴 "You guys" is taught as a model DO in one lesson and penalised in a graded roleplay in another

**Confidence: 🟢 High that it's a defect** · **Severity: highest in this document**

| Side | Location | Anchor |
| --- | --- | --- |
| **Taught** | `curriculum.ts:427` (`reading-table` culture-card, module `greetings`, **universal**) | `"You guys ready or still deciding? Take your time — we're here all night!"` |
| **Taught as a DO** | `curriculum.ts:448` (same lesson, `do-dont`) | `do: '"You guys ready or still deciding?…" (birthday table, big group)'` |
| **Banned** | `curriculum.ts:1775` (`fdp-voice`, fine-only) | `dont: '"What about you guys?"'` |
| **Banned** | `curriculum.ts:1779` | `dont: '"You guys need anything else?"'` |
| **Banned** | `curriculum.ts:1783` | `Address guests directly — "sir," "madam," or by name — never "you guys."` |
| **Graded** | `curriculum.ts:1794` | `"What about you guys?"` is the **wrong** answer |
| **Graded (roleplay)** | `scenarios.ts:1981` | `WARMTH DECREASES WITH: any casual phrasing or slang ("no problem," "you guys,"` |
| **Graded (roleplay)** | `scenarios.ts:1972` | same |

`greetings` ships to fine dining (audit §3.3, module #7). **A fine-dining trainee is shown "You guys ready?" as an exemplar DO, then loses warmth points for saying it in a scored roleplay.** Materially worse than A2 — one side is a graded penalty.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | Both occurrences of `"You guys ready or still deciding? Take your time — we're here all night!"` (culture-card `cues:` and `do-dont` `do:`) | → `"Are you ready, or would you like a few more minutes? No rush at all — we're here all night."` Same warmth, same permission-to-linger, no banned token. Alternatively a `[GroupAddress]` slot from `brand_tone_notes`. |
| 2 | curriculum.ts | Both occurrences of `First time here? Our signature burger is the move — freshly ground daily` (`curriculum.ts:435` culture-card cue and `:456` do-dont) | → `[SignatureDish]` slot — burger copy in a universal module reaching fine dining (audit §3.3 flags the tonal clash) |

> **⚠️ Correction to revision 1**, which cited `:438` and `:454` for the signature-burger strings. `:438` is `},` and `:454` is a bare `{`. The strings are at **`:435`** and **`:456`**.

**Note:** if B2 edit 2 deletes the whole `culture-cards` object, occurrence 1 of each pair disappears with it — apply B2 first, then fix only the surviving `do-dont` strings.

---

## C2 · 🟡 Escalation to a manager is forbidden in one universal lesson and correct in another

**Confidence: 🟡 Medium** (real, but reconcilable — the fix is a clause, not a choice)

| Side | Location | Anchor |
| --- | --- | --- |
| **Escalation = failure** | `curriculum.ts:939` (`handling-complaints`, `language`, universal) | `dont: '"That's not something I can fix — you'd need to speak with the manager."'` |
| | `curriculum.ts:944` | `A real solution, fast — not a process, not an escalation.` |
| **Escalation = correct** | **`curriculum.ts:1022` (graded)** (`learn-protocol`, `complaints`, universal) | correct = `Escalate to a manager immediately — some situations require more authority`; explain: `Escalation is not failure — it's professionalism.` |

Both universal, both Phase 1, all three tracks. Reconcilable — `learn-protocol`'s stem says *"still unhappy **after your resolution attempt**"* — but `:944` states its rule with no carve-out, and the option says "immediately", which is exactly what `:939` forbids.

### Edits — by anchor

| # | File | Anchor | Change |
| --- | --- | --- | --- |
| 1 | curriculum.ts | `A real solution, fast — not a process, not an escalation.` | → `A real solution, fast — never a process. Escalate only after your own best effort has not landed.` |
| 2 | curriculum.ts | `Escalate to a manager immediately — some situations require more authority` | → `Escalate to a manager — some situations need more authority than you hold.` **`correct` index and `explain` unchanged.** |

Best done **together with B1**, which already rewrites `handling-complaints`' non-unique content.

---

## C3 · 🟢 Arrival-early standard stated two ways inside the same module

**Confidence: 🟢 High**

| Location | Lesson | Anchor |
| --- | --- | --- |
| `curriculum.ts:186` | `our-standards` | `Arrive 10–15 minutes early, in clean uniform` |
| **`curriculum.ts:197` (graded)** | `our-standards` | `What's the expectation around arriving for a shift?` → correct `Arrive 10–15 minutes early` |
| `curriculum.ts:242` | `your-first-shift` | `Get there 15 minutes before your start time.` |
| **`curriculum.ts:258` (graded)** | `your-first-shift` | `When should you arrive for your first shift?` → correct `About 15 minutes early` |

> **⚠️ Correction to revision 1**, which cited `:185`/`:198`/`:259`. `:185` is the `do-dont` header; `:198` is *"A guest was rude to you and just left…"*; `:259` is *"After your first shift ends…"*. **Editing by the old numbers would have rewritten two unrelated graded questions.**

Both lessons are in `onboarding`. Not strictly contradictory (15 ∈ [10,15]) but the same policy is quizzed twice with two stated values, and audit §8.4 lists arrival-early policy as having **no intake field**.

### Edits — by anchor
Add `[ArrivalMinutes]` (default `15`) + intake field; use one value across all four anchors above. Quiz caveat is the mild form: only the *correct* option needs templating in each, so both are safe.

---

## C4 · 🟡 Two "I don't know → let me find out" questions in the same module

**Confidence: 🟢 High on the duplication · 🟡 Medium on whether it's worth fixing**

Surfaced by the quiz-stem scan at ratio **0.76**:

- `curriculum.ts:2447` (`fmk-beverage-foundations`) — `A guest asks a detailed wine question you cannot really answer. What is the professional move?`
- `curriculum.ts:2484` (`fmk-answering-questions`) — `A guest asks a question and you genuinely don't know the answer. What is the professional move?`

Adjacent lessons in `fine-dining-menu-knowledge`. A third instance in `banned-phrases` (`curriculum.ts:820`, `:838`) and a fourth in the fine-dining exam (`exam.ts:793`).

**Recommendation:** replace the beverage one with a wine-knowledge question (the lesson already has "dry" material). **Low priority — one question, within-module reinforcement, no answer is wrong.** Flagging for completeness, not urging action.

---

## C5 · 🟡 `learn-protocol` step 5 uses a phrase-shape that `banned-phrases` bans

**Confidence: 🟡 Medium** (editorial, not a graded conflict)

`curriculum.ts:1008` (`learn-protocol`, N — NOTIFY) scripts `"Is everything better now? Is there anything else I can do?"`

`banned-phrases` (`curriculum.ts:815`, `:828`, graded at `:835`) bans *"Is everything okay?"* because it *"gets a yes/no. Tells you nothing."* "Is everything better now?" has the identical failure mode. Both universal, same phase.

Everywhere else the corpus is consistent — `curriculum.ts:722`, `:1086`, `:1093`, `scenarios.ts:561/567/603/1125/1423`, `exam.ts:207/450` all ban the yes/no check-in. This is the only leak.

### Edit — by anchor
`Is everything better now? Is there anything else I can do?` → `How is the new dish? Is there anything else I can bring you?`

---

## C6 · 🟢 A config-only change would resolve four items at once

A2, B6, C1, and half of B1 **all originate in the same two universal modules reaching fine dining**: `language` and `greetings`.

Bistro 91's live `property_modules` **already drops `language`** from fine dining (audit §3.3) — a manual prune by someone who presumably hit exactly these clashes.

**Before implementing A2/B6/C1 as content edits, decide whether `language` and `greetings` should ship to fine dining at all.** If not, these become `module_phase_assignments` rows, not `curriculum.ts` diffs, and the content edits become optional polish. **This materially changes the size of the next session's work — see D2.**

---

## C7 · Verified clean — axes with **no** contradiction

Recording these so the next session doesn't re-investigate.

| Axis | Verdict |
| --- | --- |
| "Is everything okay?" ban | ✅ Consistent across 14 sites in all three files (one editorial leak — C5) |
| First-contact / follow-up timing (2 min, 2–3 min) | ✅ `curriculum.ts:718`, `:722`, `:729`, `:1075`, `:1086`; `exam.ts:249/491/735` |
| Allergen handling *procedure* | ✅ `curriculum.ts:1350`, `:1362`; `exam.ts:364`, `:606`, `:793` |
| Knife blade faces inward | ✅ `curriculum.ts:636`/`:655` and `:2050`/`:2066` agree |
| Glassware position (upper right) | ✅ `curriculum.ts:638`/`:656` and `:2051`/`:2068` agree |
| Order of precedence (ladies → gentlemen → host last) | ✅ Consistent across `curriculum.ts:1926/1932/1940/1947`, `exam.ts:693/839/841`, `scenarios.ts:2131/2136` — **but it is a gendered convention, see D5** |
| "All plates go out together" | ✅ `curriculum.ts:673`, `:694`, `:721`; `exam.ts:252/494/738` |
| Verbatim-duplicate callouts | ✅ Exactly **one** in 58 (B2). No others. |
| Verbatim-duplicate quiz stems | ✅ **Zero** exact duplicates in 295. All overlap is paraphrase-level. |
| Verbatim-duplicate do/dont, tip-list, step-body, culture-card strings | ✅ **Zero** cross-lesson exact matches |

---

## C8 · 🆕 The fast-casual exam grades the thanks-response axis **twice**

**Verdict: CANONICAL (drop one)** · **Confidence: 🟢 High** — found while verifying D11.

`fastCasualPhase1` tests the same principle in two different rounds:

| Round | Anchor | Form |
| --- | --- | --- |
| Sort-match (`exam.ts:446`, `sm-2`) | `A guest thanks you for the quick refill. You answer: "No problem!"` → `fix-it` | bans the phrase |
| Sprint (`exam.ts:548–549`, `sp-7`) | `A guest thanks you for fixing something fast. The right response is…` → `"Absolutely — my pleasure."` | names the replacement |

The other two exams test it **once each** — casual only the ban (`exam.ts:203`), fine dining only the replacement (`exam.ts:780`). Fast-casual is the outlier, and its two items are close enough in stem that a trainee answers the same knowledge twice.

**Recommendation: drop `sm-2` from `fastCasualPhase1` and keep `sp-7`** — the sprint item is the more valuable of the two (it tests the replacement, not just the ban) and the sort-match round has eleven other cards, so removing one costs the round nothing.

⚠️ **Check the round's scoring denominator before deleting** — same class of side effect as B5's `PRACTICE_PASS_RATIO` note. Verify how `pct()` (`exam.ts:131`) is fed for the sort-match round before changing the card count.

**Also worth considering (not recommended without your call):** the casual exam is the one that tests only the ban. Adding the fast-casual `sp-7` item to `casualDiningPhase1` would make all three exams test the replacement, and it is now clearly non-arbitrary which phrase is correct there. Left out of the recommendation because it grows an exam rather than deduplicating one.

---

## C9 · 🟡 The "guest looking around" signal is graded four times to one casual trainee

**Verdict: CANONICAL (pick one of three)** · **Confidence: 🟢 High on the duplication** · **📋 BACKLOG — deliberately not fixed in this pass**

Surfaced while re-checking the quiz item B2 edit 5 retains. The teaching point — *a guest scanning the room needs you and must not have to flag you down* — has **four graded sites** plus two prose sites, and a **casual-dining trainee receives all six** in Phase 1.

| # | Location | Lesson | Module / track | Form |
| --- | --- | --- | --- | --- |
| 1 | **`curriculum.ts:518` (graded)** | `reading-table` | `greetings` — **universal** | `A couple at table 5 has been waiting 8 minutes and is starting to look around. They haven't flagged you. What's happening?` |
| 2 | **`curriculum.ts:797` (graded)** | `nonverbal-signals` | `service-flow` — **universal** | `A guest keeps looking around the restaurant. What's happening?` |
| 3 | **`curriculum.ts:1398` (graded)** | `speed-without-rushing` | `casual-dining-standard` — **casual-only** | `A guest at your table keeps glancing around the room. What does an attentive server read from this?` |
| 4 | **`exam.ts:276` (graded)** | — | `casualDiningPhase1` | `A guest keeps glancing around the room. You…` |
| 5 | `curriculum.ts:1077` (prose) | `prevention` | `complaints` — **universal** | `Looking around repeatedly = waiting for attention.` |
| 6 | `curriculum.ts:1523` (prose) | `floor-efficiency` | `casual-dining-floor` — **casual-only** | `Reactive waits to be flagged; proactive catches the guest scanning the room and is already on the way.` |

Sites 1 and 2 are near-verbatim in both stem and correct answer, and site 4 is the exam's restatement of site 2. `fda-reading-table` (`curriculum.ts:2218`) is a seventh instance but is **parked**.

> ⚠️ **This contradicts B2 edit 5**, which keeps `curriculum.ts:518` on the grounds that it is "unique and good". It is good. It is not unique — it is one of three near-identical graded questions, two of them in universal modules.

### Why it is backlogged rather than fixed here

Resolving it means choosing a canonical site **across two universal modules and one track module**, which is B-class scoping work carrying its own Part I reset. More practically: Step 1 already replaces **three of `reading-table`'s five** quiz questions under B2. Folding C9 in would replace a fourth, leaving that lesson with one original question — a rewrite, not a dedup. **Sequence it after Step 1 lands**, when `reading-table`'s new question set is the thing being compared against.

---

# PART D — Resolved and open decisions

**Do not let me guess on these.** Each would become a training standard taught to real staff.

**Two are now closed** — D10 by your decision of 2026-08-21, D11 by direct verification against the code. **Nine remain open.**

| # | Question | Why I can't answer it | Blocks |
| --- | --- | --- | --- |
| **D1** | **Is 5 seconds the Hostia house default, or a required intake field with no default?** | Product-positioning question — is Hostia opinionated or neutral? Determines whether `[GreetingSeconds]` has a fallback or gates the lesson. | A1 |
| **D2** | **Should `language` and `greetings` ship to the fine-dining track?** | Bistro 91 already drops `language`; Maison Test keeps everything. Two different calls already made. | A2, B1, B6, C1, C6 |
| **D3** | **Fork tines up or down?** `table-setting` says **up**; `fdt-mise-en-place` states **no** tine direction. | British/American is tines up; French is tines down. The omission may be deliberate or an oversight. Wrong answer teaches a visibly wrong table. | A5 |
| **D4** | **Allergen jurisdiction: US Big-8 or EU-14?** `food-safety-floor` teaches **8** (`curriculum.ts:1340–1348`) and quizzes it at `:1361`. Curaçao sits under a different regime. | **Compliance**, not preference. Audit §8.4 flags it; no intake field captures it. I will not pick a legal standard. | New |
| **D5** | **Keep the gendered precedence convention?** (`curriculum.ts:1926`, `exam.ts:841`, `scenarios.ts:2131`) | Editorial/values call. `exam.ts:841`'s own feedback flags the awkwardness ("the host last, **even though the host is a lady**"). | New |
| **D6** | **Is `sir` / `madam` the required fine-dining register, or configurable?** | Same class as D5. Taught as an absolute, graded at `curriculum.ts:1794`. | A2 |
| **D7** | **Does a tasting-menu property drop `buying-signals` entirely, or keep a reduced version?** | Determines whether A6 is a `property_modules` row or a slot-filtered `steps` array. | A6 |
| **D8** | **Bill policy — are two values enough?** (`on-signal` / `on-request`) | A bar-tab house, a pay-at-counter fast-casual, and a tasting-menu house may each differ. | A3 |
| **D9** | **Un-parking `fineDiningAnticipatoryLessons`** — `fda-pacing` contradicts `table-turns`/`guest-types`/the exams on the bill; `fda-recovery` duplicates `floor-efficiency`. | If they're meant to ship, A3 and B3 need re-scoping first. If dead, delete rather than leave to drift. | A3, B3 |
| ~~**D10**~~ | ✅ **CLOSED 2026-08-21 — how do fixes reach staff who already completed the affected lessons?** | **Decided: option (b), scoped by phase.** Any lesson whose content changes has its `lesson_completions` rows deleted for the changed phase, so staff always see the corrected version. Now a **standing rule for all future content changes**, not just this pass. **Full policy, verified side effects, and the per-item impact table: [Part I](#part-i--standing-policy-content-change-re-attestation).** | ~~C1, B7, B1, B2~~ — unblocked |
| ~~**D11**~~ | ✅ **CLOSED 2026-08-21 — what is the casual-dining `[ThanksResponse]` default?** | **`Absolutely — my pleasure` — evidenced, not inferred.** Revision 2's premise was wrong twice over. (1) `casualDiningPhase1` *does* test the axis: `exam.ts:203` (`sm-2`) buckets `"No problem!"` as `fix-it` — it bans the phrase but never names the replacement. (2) More decisively, the exam was the wrong place to look: `banned-phrases` is **universal** (`language` ∈ `config.ts:22` `activeModules`), so casual trainees are already **taught** it at `curriculum.ts:819` and **graded** on it at `curriculum.ts:837` (`correct: 2` = `"Absolutely — my pleasure."`). The casual default has been live in production all along. | ~~A2~~ — unblocked |

---

# PART E — Proposed mechanism

Nine items resolve to "make this a slot." One extension of the existing `[Property]` mechanism covers all of them.

**Extend `src/lib/substitute-property.ts` from a one-token substitution to a token-map substitution**, at the same data boundary:

```
substitutePropertyDeep(tree, propertyName)
  →  substituteTokensDeep(tree, tokenMap)
```

`tokenMap` assembled server-side from `properties` + `property_overrides` + `property_intake`, with a per-token default. `[Property]` becomes one entry among many — no behaviour change for existing content, and the existing fast path generalises to a single regex test.

| Token | Source | Default | Fixes |
| --- | --- | --- | --- |
| `[Property]` | `properties.name` / override | `the restaurant` | *(existing)* |
| `[GreetingSeconds]` | new intake field | 🔴 D1 | A1 |
| `[ThanksResponse]` | `brand_tone_notes` | `Absolutely — my pleasure`; fine dining overrides to `Of course — my pleasure` ✅ D11 | A2 |
| `[BillPolicy]` | new intake field | `on-signal` | A3 |
| `[ServeSide]` / `[ClearSide]` / `[PourSide]` | new intake field | left / right / right | A4 |
| `[NapkinPosition]` | new intake field | 🔴 D3-adjacent | A5 |
| `[ArrivalMinutes]` | new intake field | `15` | C3 |
| `[GroupAddress]` | `brand_tone_notes` | neutral phrasing | C1 |
| `[SignatureDish]` | `property_menu_items` | — | C1, B6 |
| `[MenuItem]` family — incl. **`[dish]`, `[wine]`, `[option]`, `[signature drink]`, `[signature dessert]`, `[what makes it special]`, `[specific dish]`** | `property_menu_items` | — | A6, B6 |
| `[UpsellApproach]` | `upsell_approach` | full 4-step | A6 |

**Four constraints this design must respect:**

1. **`[Star]` / `[Method]` / `[Experience]` (`curriculum.ts:858`) are illustrative labels, not slots.** They annotate a worked example inside the `Formula in action` callout. A naive token-map pass must not fill them. **Recommend renaming to a non-bracket form (`«Star»`, or bold) so the conventions never collide.**
   > **⚠️ Correction to revision 1**, which cited `:857` (that's `]},`). Since this note exists precisely to stop a naive pass mangling them, an implementer grepping `:857` would find nothing and might drop the guard.
2. **`[X]` is overloaded three ways.** In `multilingual` (`curriculum.ts:367–368`) it is **party size** — `Table for [X]?`; in `buying-signals` (`:1216`) it is a **menu item** — `I'd go with the [X]`; and in `handling-complaints` (**`:952`**) it is a **ticket line item** — `'"The ticket showed [X] — let me show you."'`. A token map must disambiguate by context, or two of the three must be renamed.

   ⚠️ **The third site is the most dangerous of the three.** The other two sit in `learn` prose, where a wrong fill reads oddly. This one sits inside `options[]` of a **graded** quiz question — a token pass that fills it rewrites what a distractor says to the trainee being scored. It is also the one an implementer is least likely to find: it is the only `[X]` that is not in a lesson about menus or greetings.

   **It survives B1.** `handling-complaints`' quiz is rewritten by B1, but this is one of the two questions B1 **keeps** (`A guest receives the wrong order.`), so the collision is still live after Step 1 and must be resolved here.
3. **`scenarios.ts` is in scope** — `:167` and `:610` carry `[dish]` / `[specific dish]`. Revision 1 omitted this file from the token table. ⚠️ **`:610` is in `two-minute-check`, an orphan scenario** (see A4) — real work, but it reaches nobody until the orphan is adopted.
4. **Quiz templating is the hard part and this design does not solve it.** A token inside `options[]` changes what the correct answer is, and `correct` is a fixed index. A1, A4, and A6 hit this. My recommendation in each case is **rewrite the stem to test the principle rather than the value** — needs no new mechanism. **Do not build a quiz-templating engine for three questions.**

---

# PART F — Suggested order of operations

Ordered by risk-adjusted value. Each row independently approvable. **All targets are anchors — verify with Part G before editing.**

> ### ✅ Items 1–9 SHIPPED 2026-08-24 ("Step 1")
> Two files: `curriculum.ts`, `scenarios.ts`. `tsc --noEmit` clean; Part G at **92 anchors, 0 failures**. Question count unchanged at **313**, so no `PRACTICE_PASS_RATIO` threshold moved. Nine quiz questions replaced with balanced answer positions per **Part J** — `reading-table` and `handling-complaints` are no longer passable by rote (44 → 42 of 63).
>
> **Not yet run: the completion reset.** `supabase/migrations/reset_completions_dedup_step1.sql` — deploy the content first, then run it (Part I.4), after checking the `SELECT count(*)` form. Reset list re-derived from the landed diff; see **I.5**.
>
> **Deferred out of this batch:** **C1 edit 2** (`[SignatureDish]` for the signature-burger `do-dont` string) needs the Part E token mechanism and is not in items 1–9. The burger copy still ships to fine dining until then.

| Order | Item | Type | Risk | Why here |
| --- | --- | --- | --- | --- |
| 1 | **A4(a)** — `scenarios.ts` » `Correct at [Property]: food from the right, drinks from the left.` | 1-line bug fix | none | Only unambiguous defect. Currently grades trainees correct for the opposite of the exam. |
| 2 | **C1** — the two `"You guys ready or still deciding?"` strings | 2-line content | none | Taught as a DO, penalised in a graded roleplay. |
| 3 | **C5** — `Is everything better now?` | 1-line content | none | Closes the last leak on an otherwise clean axis. |
| 4 | **B2** — delete the duplicated callout object + the poorer `culture-cards` object in `reading-table` | brace-matched deletion | **low, but delete by brace not by line** | Only verbatim duplicate in the file. |
| 5 | **B7** — canonicalise the clearing trigger (3 strings) | content | low | Direct graded contradiction for every casual trainee. |
| 6 | **C2** — escalation clause (2 strings) | content | low | Do together with B1. |
| 7 | **B5** — delete the `5 habits of efficient servers` object; replace 2 quiz items | brace-matched deletion | low | Strongest duplication. **Watch the pass-ratio note.** |
| 8 | **B3** — delete the `Proactive vs reactive — the shift` object + its intro | brace-matched deletion | low | Composes with B5 into one clean lesson. |
| 9 | **B1** — rescope `handling-complaints`; 3 quiz rewrites | content | medium | Biggest rewrite; preserves ID/XP. |
| 10 | **A5** — relabel covers; slot the napkin | 3 strings | low | Blocked on **D3** for tines. |
| 11 | **B6** — de-sell `describe-serving` | 3 strings + menu slots | low | **Check D2 first** — may be moot. |
| 12 | **A2** — `[ThanksResponse]` | needs Part E | medium | **D11 closed** — default is `Absolutely — my pleasure`, fine dining overrides. Still **check D2 first**. |
| 13 | **C3** — `[ArrivalMinutes]` | needs Part E | low | |
| 14 | **A1** — `[GreetingSeconds]` + quiz rewrite | needs Part E, 16 sites | **high** | Touches all three files incl. graded scenarios and all three exams. Blocked on **D1**. |
| 15 | **A4(b)** — `[ServeSide]` family | needs Part E | medium | |
| 16 | **A3** — `[BillPolicy]` | needs Part E + exam templating | **high** | Partly blocked — two exam items need *swaps*, not rewording. Blocked on **D8**. |
| 17 | **A6** — `[UpsellApproach]` + slot-filtered steps | needs Part E + variable-length blocks | **high** | First place a block's item count varies by property. Blocked on **D7**. |
| — | **C4** | 1 quiz swap | none | Optional. Lowest value here. |
| 📋 | **C9** — canonicalise the "guest looking around" signal across `reading-table` / `nonverbal-signals` / `speed-without-rushing` + `exam.ts:276` | content | low | **Backlog.** Four graded sites, all reaching one casual trainee. Sequence **after** Step 1, which already replaces 3 of `reading-table`'s 5 questions. |
| 📋 | **Part J** — platform-wide quiz answer-position rebalance (**304 questions**, all 63 lessons) | mechanical | **high blast radius** | **Backlog, needs its own approval.** No string changes — permute `options[]`, move `correct`. But 70 % of lesson quizzes are currently passable by rote (J.2), and fixing it resets `practice` on **every lesson for every staff member**. |

**Items 1–9 are content-only, need no new mechanism, and are now unblocked by every Part D question** — **D10 is closed**, so each of them carries a mandatory completion reset per **Part I**; the reset is what makes the fix actually reach existing staff. They are the natural first session.

⚠️ **"No XP risk" needs one correction.** Under the Part I policy each of these items now *does* move XP — a reset un-completes the lesson, so its lesson XP drops until the staff member redoes the phase, and re-locks the modules after it in display order. That is intended and self-healing (Part I §3), but it is no longer true that items 1–9 leave progress untouched.

⚠️ **Item 1 (A4(a)) should be re-ranked.** Its "currently grades trainees correct for the opposite of the exam" rationale does not hold — the string sits in `runner-coordination`, an **orphan scenario no lesson links to** (see A4). It grades nobody. Still a correct 1-line fix with zero risk, but it is parked code, not a live defect, and it needs no reset. **The live half of A4 is `fde-service-direction` vs `plate-carrying`/`ten-steps`, which is item 15.**

---

# PART G — Anchor verifier

Every edit target in Parts A–C is backed by a **verified anchor** in `scripts/dedup-anchors.txt`
(pipe-delimited: `item|file|expected_count|anchor`). Run the checker before editing:

```
python3 scripts/verify-dedup-anchors.py
```

It normalises TypeScript's escaped apostrophes (`\'` → `'`) and asserts each anchor
matches its **expected count** — which is `1` for most, and deliberately `2` or `3` where
an item targets several sites (A1's exam sequencing item appears once per track config;
C1's two strings each appear in both a `culture-cards` cue and a `do-dont`; B2's duplicated
callout is the pair being resolved).

**Current state: 92 anchors, 0 failures** (was 87 before Step 1 landed).

**Expected count `0` means "this string must stay gone."** Step 1 consumed 25 anchors — the strings it rewrote or deleted. Rather than leave the verifier permanently reporting 25 failures (which would mask real drift for the items still to come), each consumed anchor was re-pointed to its **post-edit** count: `0` for deleted content, and `1` for the two that were partially consumed —

- `Read the table before you open your mouth…` 2 → **1** (the `reading-table` copy is deleted; the canonical `guest-types` copy remains — this is B2's intended end state).
- `First time here? Our signature burger is the move…` 2 → **1** (the culture-card copy went with B2's deletion; the `do-dont` copy survives because **C1 edit 2 is deferred** — it needs the Part E `[SignatureDish]` token).

Five new anchors were added guarding Step 1's replacement content, so downstream items (A4(b), A3, C6) cannot silently clobber it.

A `FAIL` means either the tree has moved or this document is wrong. **Do not edit by that
anchor until it is resolved** — and re-run after every edit, since anchors you have already
rewritten will legitimately stop matching.

> **Note on the first attempt.** Revision 2 initially specified a verifier that scraped
> every backticked string out of this document and searched for it. That does not work:
> it cannot distinguish a source anchor from replacement text, a table name, or ordinary
> prose, and it reported 238 false positives out of 559 candidates. An **explicit manifest
> is the only reliable form** — it says exactly which strings are load-bearing.


# PART H — Revision history

| Kind | Change |
| --- | --- |
| **Structural** | Every actionable edit converted from line number to **verbatim anchor**. Line numbers retained only in evidence tables, each paired with a quote so it is self-checking. |
| **Build-breaking, fixed** | **B2** — callout is `412–417` not `413–419`; culture-cards is `418–438` not `420–439` (`:439` opens the kept `do-dont`). **B3** — tip-list is `1521–1527` not `1521–1525`, and "keep `1526–1533`" was self-contradictory (6-habit list is `1529–1536`). **B5** — `:622` is `],`, the quiz array terminator, not a quiz item. All five now specified as **brace-matched object deletions**. |
| **Wrong-target, fixed** | **A4** — pointed at `:1947` (*precedence* question); serve-side is `:1948`. **C3** — pointed at `:198` and `:259` (two unrelated graded questions); correct are `:197` and `:258`. **C1** — `:438`/`:454` are punctuation; strings are `:435`/`:456`. **B4** — `:185` is a header (item is `:186`), `:187` is composure (phones is `:188`). **B5** — `floor-movement:611` is "moving with purpose" (pre-bus is `:610`); both tip-lists off by 1–4. **B7** — `:673` is "All plates go out together" (`Clear simultaneously` is `:675`); `exam.ts:736` is "Drinks" (clearing is `:740`). **B1** — lesson is `919–955` not `920–961`; `fde-table-conduct` block is `1971–1976`+`:1983` not `1978–1983`. **A4/A6** — `ten-steps` step 6 is `:721` not `:722`; exam dessert items are `:255/497/741`. **Part E** — `[Star]/[Method]/[Experience]` are at `:858` not `:857`. |
| **Substantive claim corrected** | **A2** — "the exams are already correctly split" was overstated. `exam.ts:549` is **fast-casual**, not casual; `casualDiningPhase1` never tests it. It is a two-of-three split, and the casual default is unanchored → **new D11**. |
| **Substantive claim corrected** | **A6** — "five tokens in this one lesson" undercounted. Full inventory is **15 tokens across 4 lessons plus 2 roleplay prompts**, including `[what makes it special]` (in a graded `explain`) and two in `scenarios.ts`, which revision 1 omitted from Part E entirely. Also surfaced that **`[X]` is overloaded** (party size vs menu item). |
| **Gap added** | **Constraint 3 / D10** — fixing content does not reach staff who already completed the lesson. For **C1** and **B7** the fix never reaches the people it was written for. No item in revision 1 raised this. |
| **Added** | **Part G** anchor verifier, backed by `scripts/dedup-anchors.txt` (87 anchors) and `scripts/verify-dedup-anchors.py`. The first verifier specified in this revision was itself defective — it scraped all backticked prose and produced 238 false positives; replaced with an explicit manifest. **B5** pass-ratio note (`PRACTICE_PASS_RATIO` makes a 5→4 question deletion tighten `floor-movement` from 4/5 to 4/4). |
| **Unchanged** | Every verdict, every confidence rating, and all thirteen findings. The review confirmed the analysis; only the citation layer was defective. |

## What revision 3 changed (2026-08-21)

| Kind | Change |
| --- | --- |
| **Decision recorded** | **D10 CLOSED.** Content changes now carry a mandatory, phase-scoped `lesson_completions` reset — a **standing rule for all future content changes**, written up with its verified side effects and a per-item impact table as **Part I**. Unblocks C1, B7, B1, B2. |
| **Substantive claim corrected** | **D11 CLOSED, and revision 2's premise was wrong.** Revision 2 claimed `casualDiningPhase1` "never tests" the thanks response. It does — `exam.ts:203` (`sm-2`) buckets `"No problem!"` as `fix-it`, banning the phrase without naming the replacement. More decisively, the exam was the wrong evidence: `banned-phrases` is universal (`language` ∈ `config.ts:22` `activeModules`), so casual trainees are **taught** `"Absolutely — my pleasure."` at `curriculum.ts:819` and **graded** on it at `:837`. The casual default was a live product decision all along, not an inference. |
| **Substantive claim corrected** | **A4 site 4 is in parked code.** Revision 2 attributed `scenarios.ts:1171` to `six-top-all-at-once` (lesson `synchronized-service`, universal). It is actually inside **`runner-coordination`** (`:1146–1186`), one of **five orphan scenarios** no lesson links to (`ApplyPhase.tsx:120` reaches scenarios only via `lesson.scenarioId`). Nobody is graded backwards today — same shape as parked `fda-pacing` in A3. **Part F item 1 loses its urgency rationale.** `scenarios.ts:610` (Part E token work) is in an orphan too. |
| **Claim corrected** | **Part F's "items 1–9 carry no XP risk"** no longer holds under the Part I policy — each now moves lesson XP and re-locks later modules until retaken. Intended and self-healing, but no longer "untouched". |
| **Finding added** | **C8** — `fastCasualPhase1` grades the thanks-response axis **twice** (`sm-2` at `:446` and `sp-7` at `:548`); casual and fine dining test it once each. Recommend dropping `sm-2`, with the same scoring-denominator caution as B5. |
| **Unchanged** | Every verdict and confidence rating in Parts A–C, except A4(a)'s urgency. All findings stand; the count goes from thirteen to fourteen (C8). |

## What revision 4 changed (2026-08-24)

| Kind | Change |
| --- | --- |
| **Policy added** | **Part J — quiz answer-position balance**, a standing rule for all future quiz writing, applied to Step 1's nine replacements (J.4). Sits alongside Part I as the second standing content rule. |
| **Finding added** | **Measured the whole corpus to set that rule: 313 questions across 63 lessons** (not 295 — see below). **Position A is correct 0 times; B 247; C 65; D once.** Answering `B` to everything passes **42 of 63** lesson quizzes; **44 of 63 (70 %)** fall to some single fixed position; **33 of 63** have all five answers in one position. A practice-phase integrity defect, **backlogged** in Part F with its own approval gate — the fix resets `practice` on every lesson for every staff member. |
| **Count corrected** | Parts B1 and C say "**295** quiz stems". The actual figure is **313** — 62 lessons × 5 questions plus `welcome-to-hostia`'s 3. The near-duplicate *findings* drawn from that scan are unaffected (they are pairwise and each was verified by anchor), but the scan did not cover the whole corpus it claimed to, which is how **C9** went unnoticed. |
| **Finding added** | **C9** — the "guest looking around" signal is **graded at four sites** (`curriculum.ts:518`, `:797`, `:1398`, `exam.ts:276`) plus two prose sites, **all six reaching one casual trainee**. Directly contradicts **B2 edit 5**'s "unique and good"; that row now cross-references it. **Backlogged** — Step 1 already replaces 3 of `reading-table`'s 5 questions. |
| **Claim corrected** | **Part E constraint 2 — `[X]` is overloaded three ways, not two.** The third is `curriculum.ts:952` in `handling-complaints`, a **ticket line item** inside a graded `options[]` array. It is the highest-risk of the three for a naive token pass, and it **survives B1** (that question is one of the two B1 keeps). |
| **Unchanged** | Every verdict, confidence rating, and finding in Parts A–C. Part G still verifies **87 anchors, 0 failures**. |

---

<a id="part-i--standing-policy-content-change-re-attestation"></a>

# PART I — Standing policy: content-change re-attestation

**Decided 2026-08-21. Resolves D10. This is the rule for every curriculum content change from now on — not just this dedup pass.**

## I.1 · The rule

> **When a lesson's content changes, the completions for the phase that changed are deleted, so every staff member is shown the corrected version.**

Scope the delete by **phase**, not by whole lesson — the phase whose content changed is the phase that must be re-seen.

| What you edited | Delete |
| --- | --- |
| `learn` blocks — `intro`, `steps`, `callout`, `do-dont`, `tip-list`, `culture-cards` | `lesson_completions` rows for that `lesson_id` `WHERE phase = 'learn'` |
| `quiz` — stem, options, `correct` index, or `explain` | `… WHERE phase = 'practice'` |
| the roleplay in `scenarios.ts` — `systemPrompt`, `goal`, scoring | `… WHERE phase = 'apply'` |
| more than one of the above | all matching phases |

**Exempt: edits that cannot change what a trainee would answer or do** — typos, punctuation, casing, formatting, a rewording that teaches the identical standard. **When in doubt, reset.** Showing a lesson twice costs a staff member four minutes; leaving a wrong standard in their head costs a guest.

`exam.ts` edits are **out of scope** for this rule — exams write `phase_completions`, not `lesson_completions`, and a passed exam is an attestation of an event that really happened. See §I.3.4.

## I.2 · Why this, and why now

All current property data is test/pilot — the review and pilot accounts (De Gouverneur, Brgr House, Maison Test, Bistro 91). **No real client staff has a live completion at risk today**, so the reset costs nothing at this moment. That is precisely why the policy should be set now: it is far cheaper to establish the discipline before the first paying cohort than to retrofit it after, and it means option (c) from constraint 3 — a "standard updated" acknowledgement flow — is a feature we never have to build to justify shipping a correction.

The alternative, option (a) "accept the gap", fails the two items that motivated the question. **C1** taught trainees *"You guys ready or still deciding?"* as a model DO and then penalised them for it in a graded roleplay; **B7** graded them on the wrong clearing trigger. Accepting the gap means the people who were actively taught the wrong thing are exactly the people the fix never reaches.

## I.3 · What a reset actually does — verified against the code

**1. XP moves, and it self-heals.** Lesson XP is **derived, never stored**: `progress-model.ts` awards it once per DISTINCT fully-completed `(module, lesson)` by walking the *live* catalog. Deleting a required-phase row un-completes the lesson, so its lesson XP — base plus warmth bonus — **drops until the staff member redoes that phase**, then returns automatically and retroactively. **Roleplay XP is untouched**: it sums `roleplay_sessions.xp_earned` over passed sessions, a separate table this policy never deletes from. A staff member who redoes a `learn` phase gets every point back.

**2. Module re-locking is the enforcement mechanism, not a side effect.** `/api/curriculum` locks each module until every earlier one in display order is fully complete (`route.ts:172`, `:184`). A reset in module N therefore **re-locks N+1…** for that staff member until they redo it. This is exactly what makes "always see the corrected version" true rather than aspirational. If a specific person must not be blocked, use the existing additive escape hatch — `property_overrides.unlocked_modules` (`route.ts:118–141`), which unlocks without un-resetting.

**3. ⚠️ Streaks can shorten retroactively — the one genuinely destructive effect.** The streak day-set is recomputed from *current* rows on every request via `fullCompletionTimes` (`progress-model.ts`), which pins a lesson's completion moment to the timestamp of its **last** required phase. Delete a phase row and that lesson stops contributing its historical day. **If it was the only thing earned on some past day, that day leaves the set and a past streak shortens.** Redoing the lesson does **not** restore it — the retake re-pins the completion to today.

  Accepted, because current data is test/pilot. For a future reset touching a real cohort: run it anyway, and tell them. A wrong standard is worse than a broken streak, and this is the price of not building an acknowledgement flow.

**4. Exam badges are NOT revoked.** `phase_completions` is a separate table keyed `UNIQUE(staff_id, phase_id)`, and this policy **never touches it**. A staff member can therefore hold a phase certification while one lesson inside that phase is temporarily incomplete. **That is intended** — the badge attests to a passed exam, which really happened; the reset attests to corrected content. **Do not delete `phase_completions` to "keep them consistent."**

## I.4 · How to run one

```sql
-- Example: the C1 + B2 fixes, both of which edit reading-table's learn blocks.
DELETE FROM lesson_completions
WHERE lesson_id IN ('reading-table')
  AND phase = 'learn';
```

- **Service role, Supabase SQL editor.** `lesson_completions` has no DELETE policy for staff or managers (`add_lesson_completions.sql`) — by design.
- **Run it in the same deploy as the content change, and *after* it.** Resetting before the corrected content ships sends staff back through the wrong version.
- **Scope it globally, not per property**, unless the edit is property-specific. The curriculum is shared; so is the correction.
- **Record it.** Add the statement to `supabase/migrations/` as `reset_completions_<slug>.sql` even though it is data rather than schema. It is the audit trail of which standard changed when — the same reason `record_live_rls_policies.sql` exists.
- **Verify by count first**: run the `SELECT count(*)` form of the same `WHERE` clause before the `DELETE`, and expect a number consistent with the pilot roster. A surprising count means the `lesson_id` is wrong.

## I.5 · What this pass resets

Every item in Parts A–C, with the affected `(lesson_id, phase)` pairs **derived mechanically from `scripts/dedup-anchors.txt`** — each anchor resolved to its enclosing lesson and to `learn` vs `practice` by its position relative to that lesson's `quiz:` key.

| Item | Lessons + phases to reset |
| --- | --- |
| **A1** | `five-second` (learn, practice), `multilingual` (learn), `ten-steps` (learn) |
| **A2** | `banned-phrases` (learn, practice), `fdp-voice` (learn, practice) |
| **A3** | `guest-types` (learn, practice), `table-turns` (learn) |
| **A4** | `fde-service-direction` (learn, practice), `plate-carrying` (learn), `ten-steps` (learn) — **A4(a) alone resets nothing** (orphan scenario, see A4) |
| **A5** | `fdt-mise-en-place` (learn), `table-setting` (learn) |
| **A6** | `buying-signals` (learn), `ten-steps` (practice) |
| **B1** | `handling-complaints` (learn, practice) |
| **B2** | `guest-types` (learn), `reading-table` (learn, practice) |
| **B3** | `floor-efficiency` (learn, practice) |
| **B4** | `our-standards` (learn) |
| **B5** | `floor-movement` (learn, practice), `speed-without-rushing` (learn, practice) |
| **B6** | `describe-serving` (learn) |
| **B7** | `floor-efficiency` (learn), `table-turns` (learn, practice) |
| **C1** | `reading-table` (learn) |
| **C2** | `handling-complaints` (learn), `learn-protocol` (practice) |
| **C3** | `our-standards` (learn, practice), `your-first-shift` (learn, practice) |
| **C4** | `fmk-beverage-foundations` (practice) |
| **C5** | `learn-protocol` (learn) |
| **C8** | *none* — `exam.ts` only (see §I.1) |
| **Part E** token work | `buying-signals` (learn, practice), `describe-serving` (learn) |

**For the first session (Part F items 1–9), that collapses to:**

```sql
DELETE FROM lesson_completions WHERE phase = 'learn' AND lesson_id IN (
  'reading-table', 'guest-types', 'learn-protocol', 'table-turns',
  'floor-efficiency', 'floor-movement', 'speed-without-rushing',
  'handling-complaints'
);
DELETE FROM lesson_completions WHERE phase = 'practice' AND lesson_id IN (
  'reading-table', 'table-turns', 'floor-efficiency', 'floor-movement',
  'speed-without-rushing', 'handling-complaints', 'learn-protocol'
);
```

⚠️ **Re-derive this list after the edits actually land**, the same way Part G re-verifies anchors — if an edit lands in a different lesson than planned, this list is wrong in exactly the way revision 1's line numbers were.

### ✅ Re-derived for Step 1 (2026-08-24) — and the prediction was wrong twice

Derived mechanically from the **landed diff** (enclosing lesson per changed line; `learn` vs `practice` by position relative to that lesson's `quiz:` key), not from the table above. Written up as `supabase/migrations/reset_completions_dedup_step1.sql`.

| | Predicted above | Actually landed |
| --- | --- | --- |
| `learn` | 8 lessons | **6** |
| `practice` | 7 lessons | **7** ✅ |

Two over-inclusions, both confirmed against the diff:

- **`guest-types` (learn) — dropped.** B2 *keeps* the `guest-types` callout and deletes only `reading-table`'s copy. The lesson is never edited, so it must not be reset.
- **`floor-movement` (learn) — dropped.** B5 edit 4 explicitly **keeps** the `Pre-bus passes` principle; only the quiz item changed. `practice` only.

This is the failure mode the warning above predicts, caught by deriving rather than trusting. **The same re-derivation is mandatory for every future batch.** Note the derivation must handle **pure-deletion hunks** (`@@ … +n,0 @@`): a deleted `learn` block adds no lines, so a naive scan of added lines misses it — it initially dropped `floor-efficiency` and `speed-without-rushing` from the `learn` list.

---

<a id="part-j--standing-policy-quiz-answer-position-balance"></a>

# PART J — Standing policy: quiz answer-position balance

**Decided 2026-08-24. This is the rule for every quiz question written from now on — not just this dedup pass.**

## J.1 · The rule

> **The correct answer's position is chosen deliberately, never by habit.** Within any one lesson's quiz, no position may hold the correct answer more than **twice**. Where a batch introduces genuinely new questions rather than replacing existing ones, every position appears at least once across the batch.

Two supporting rules, because position balance alone does not make a quiz unguessable:

- **Never let length or hedging mark the answer.** The correct option must not be reliably the longest, the most qualified, or the only one written as a complete sentence. Position balance and length balance are two halves of the same defect.
- **A replacement inherits its lesson's obligation, not its batch's.** If the four retained questions in a lesson all sit on `B`, the replacement takes a different position even when that skews the batch's own spread.

## J.2 · Why — the corpus is currently passable without knowledge

Measured across **all 313 quiz questions in 63 lessons** in `curriculum.ts`. Every question has exactly 4 options, so positions are directly comparable.

| Position | Correct answers | Share |
| --- | --- | --- |
| **A** (index 0) | **0** | **0.0 %** |
| **B** (index 1) | 247 | 78.9 % |
| **C** (index 2) | 65 | 20.8 % |
| **D** (index 3) | **1** | 0.3 % |

**Position A is never correct — not once in 313 questions.** The single `D` is `curriculum.ts:396`, *"What does 'Bon tardi' mean?"* — a Papiamentu vocabulary item, and the one question in the corpus that is not a service-judgement question.

The consequence is not cosmetic. `PRACTICE_PASS_RATIO = 0.8` means 4 correct of 5:

- **Answering `B` to every question passes 42 of the 63 lesson quizzes** with no knowledge of the content whatsoever.
- Allowing any one fixed position, **44 of 63 (70 %) are passable by rote.**
- **33 of 63 lessons have all five correct answers in the same position** — including `reading-table`, `floor-movement`, `floor-efficiency`, `banned-phrases`, and every one of the 13 `fd*`/`fmk-*` fine-dining lessons. For those, a single observation hands a trainee a permanent perfect score.

This is a **practice-phase integrity defect**, not a style preference. A `lesson_completions` row for `phase = 'practice'` is the system's attestation that a trainee knows the material; it gates module unlocking (`route.ts:172`) and lesson XP (`progress-model.ts`). Today that attestation is available without the knowledge.

## J.3 · Scope of this decision

**This pass rebalances only the 9 questions Step 1 already replaces** (J.4). **The other 304 are not touched.**

Rebalancing them is mechanically trivial — permute `options[]`, move the `correct` index, leave every string intact — but it is 304 edits to graded content, and under **Part I** each one resets `practice` completions for its lesson. That is **all 63 lessons reset at once**, i.e. every staff member re-takes every quiz on the platform. It is a deliberate, separately-approved operation, not something to let ride along inside a dedup pass. **Backlogged in Part F.**

`exam.ts` is out of scope for the Part I *reset* rule (§I.1) but **in scope for J.1** — future exam items follow it. The existing exam distribution has not been measured; measuring it belongs with the platform-wide rebalance.

## J.4 · Position assignment for Step 1's nine replacements

All nine currently cluster on B/C — **A=0, B=5, C=4, D=0** — the corpus pattern in miniature.

| # | Item | Lesson | Question being replaced | Now | **New** |
| --- | --- | --- | --- | :-: | :-: |
| 1 | B2 | `reading-table` | `A couple is deep in conversation, haven't looked up, seated 3 minutes.` | B | **A** |
| 2 | B2 | `reading-table` | `A group of 6 is celebrating a birthday, loud and happy.` | B | **C** |
| 3 | B2 | `reading-table` | `A solo businessman has his laptop open and hasn't touched his menu.` | B | **D** |
| 4 | B5 | `speed-without-rushing` | `Which of these is a core habit of an efficient server?` | C | **A** |
| 5 | B5 | `floor-movement` | `You are walking past table 3 on your way to the kitchen.` | B | **D** |
| 6 | B3 | `floor-efficiency` | `What's the core difference between proactive and reactive service?` | B | **C** |
| 7 | B1 | `handling-complaints` | `A guest says "We've been waiting 30 minutes." You say:` | C | **A** |
| 8 | B1 | `handling-complaints` | `After resolving a complaint, you should:` | C | **D** |
| 9 | B1 | `handling-complaints` | `A guest says "This is overcooked." You say:` | C | **C** |

Resulting per-lesson spread, retained questions included:

| Lesson | Before | After |
| --- | --- | --- |
| `reading-table` | A0 **B5** C0 D0 | A1 B2 C1 D1 ✅ |
| `handling-complaints` | A0 B1 **C4** D0 | A1 B1 C2 D1 ✅ |
| `speed-without-rushing` | A0 B3 C2 D0 | A1 B3 C1 D0 |
| `floor-movement` | A0 **B5** C0 D0 | A0 B4 C0 D1 |
| `floor-efficiency` | A0 **B5** C0 D0 | A0 B4 C1 D0 |

The two lessons where Step 1 replaces three questions reach a clean spread and stop being rote-passable. **The three where it replaces only one do not** — one question cannot fix a five-question lesson, and J.3 forbids touching the other four here. `floor-movement` and `floor-efficiency` remain passable by answering `B`. That is the honest state of it after Step 1, and it is what the platform-wide backlog item exists to close.

**Length was checked too, and the first draft failed it.** On the first pass all nine questions had the correct option as the **longest** of the four — J.1's second tell, reproduced at smaller amplitude (margins of 2–11 characters rather than the 20–40 typical of the existing corpus). Distractors were padded or correct options trimmed until **0 of 9** are longest. Worth stating because it is the failure mode of writing a rule and then not measuring against it: the position column looked balanced while the questions were still guessable. **Measure both, every time.**

**The batch uses `B` zero times, deliberately.** `B` is the saturated position in all five affected lessons; spending a replacement on it would leave `reading-table` and `handling-complaints` unbalanced for no gain. J.1's "every position appears at least once" governs batches of *new* questions — this is a corrective batch, and the balance that matters is the per-lesson column above.

---

## Summary of what this proposal changes relative to the audit

| Audit said | This proposal says |
| --- | --- |
| §7.5 has 6 contradictions | **10.** Added C1 (you guys — graded penalty), C2 (escalation), C3 (arrival time), C5 (yes/no check-in); promoted B6 (sell vs inform) and B7 (clearing trigger) from §7.4. |
| §7.5 #2: `fdp-voice` treats "Absolutely" as a level-drop | **It does not.** Only "no problem", "you guys", "no worries" are named. Corrected. |
| §7.5 #3 (bill): a live contradiction | **No live lesson-vs-lesson contradiction** — the only counterweight is parked. It is a live policy-vs-content conflict. |
| §7.5 #4 (serve side): 2 sides | **4 sides**, one of them teaching and *grading* the exact inverse. |
| §7.4 proactive/reactive: "tracks affected: all" | **No trainee gets all three.** Casual 2, fine 2, fast-casual 1. |
| §7.4 cutlery cluster: casual + fine | The *meaning* is consistent; the **trigger** has three versions, and the live conflict is **casual-only**. |
| §7.4 guest-type "identical callout, verbatim" | **Confirmed** — and it is the *only* verbatim duplicate among 58 callouts. |
| *(not in the audit)* | **Five scenarios are orphans** — `drinks-upsell`, `order-taking-allergy`, `overcooked-burger`, `runner-coordination`, `two-minute-check`. No lesson links them, so nothing in them ships. Two findings (A4(a), one Part E token site) live entirely inside them. |
| *(not in the audit)* | **Fixing content does not reach staff who already completed it.** Now resolved by a standing re-attestation policy — **Part I**. |
