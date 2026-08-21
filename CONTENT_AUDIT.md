# Hostia Content Audit — Customization Readiness

**Date:** 2026-08-21 · **Scope:** read-only audit of `hostia-core` (no files modified) · **Purpose:** identify, lesson by lesson, what is genuinely universal vs. what must be tailored per property before an AI drafting pass can fill in the customizable slots from a `hostia-onboarding` intake.

**Sources read:** `src/lib/curriculum.ts` (2,735 lines — all lesson content), `src/lib/scenarios.ts` (2,697 lines — 62 roleplay scenarios), `src/lib/exam.ts` (916 lines — 3 phase-1 exams), `src/lib/substitute-property.ts`, `src/lib/config.ts`, `src/app/api/curriculum/route.ts`, `src/app/api/roleplay/route.ts`, `src/components/staff/LearnPhase.tsx`, `supabase/migrations/*`, plus **live read-only queries against the production Supabase** to resolve the real track→module mapping (which is DB-driven, not in code) and the current intake schema.

---

## 0 · How this document is organised (and one deviation from the brief)

The brief asked for track → module → lesson. The codebase does not partition that way: **7 of the 15 modules are shared verbatim by all three tracks.** Writing them out three times would triple the length without adding information, so:

- **§3** gives the exact module sequence per track (the track view you asked for), with a per-track fit verdict on every module.
- **§4–§6** give the lesson-by-lesson extraction, grouped by module: the **universal core** once (§4), then **casual-dining-only** modules (§5), then **fine-dining-only** modules (§6). Each module carries a "per-track fit" line so the track reading stays intact.

Every lesson entry cites `file:line` so you can jump to the source.

---

## 1 · Executive summary

**Scale.** 15 modules · **59 live lessons** (+4 parked) · 295 quiz questions · 62 roleplay scenarios · 3 exams. All of it is **hardcoded TypeScript**, not database rows.

**The headline finding:** the content was written for **one specific restaurant** — a mid-market, table-service venue in **Curaçao** — and then generalised only by find-and-replacing the venue name with `[Property]`. Everything else about that original venue is still baked in:

| What's baked in | Where | Why it breaks |
| --- | --- | --- |
| **Curaçao geography & the 4-language mix** (English/Dutch/Spanish/Papiamentu) | 1 full lesson + 1 full lesson + 12 of 62 scenarios + 2 of 3 exams + **the `PhraseRow` TypeScript type and the React component headings** | A restaurant in Rotterdam or Austin is taught Papiamentu and quizzed on "Bon tardi". This is the deepest-rooted problem — it is not just copy, it is the schema and the renderer (§7.1). |
| **A burger/steak/fish menu** | `language` module, `storytelling`, `describe-recommend`, `storytelling-property`, casual + fast-casual exams | Bistro 91 (French-Peruvian) and Maison Test (7-course tasting menu) are taught to sell "hand-ground beef" and "warm rum cake". |
| **An invented brand story** ("the owner created it on opening night", "we are a team, not a hierarchy", "hospitality over transactions") | The entire `onboarding` module | Presented to staff as *their* restaurant's DNA. It is fiction, and it is the first thing a new hire reads. |
| **Full table service** (tray at shoulder height, wine glass placement, synchronized clearing, "Captain" role, table turns) | `physical-craft`, `service-flow` | Assigned to **Brgr House (fast-casual)** today. |

**The good news — three things are already right:**
1. `[Property]` → real name substitution is clean, deep, and total (`substitutePropertyDeep`, §2.3). It just doesn't go far enough.
2. `property_overrides.scenario_context` is a working per-property free-text slot that is injected into **every** roleplay system prompt (§2.4). This is the existing customization mechanism — and it currently carries the whole load.
3. **The intake schema already exists live and is already populated for one property.** `property_intake`, `property_menu_items`, `property_documents` are in the production database, with a `status: 'reviewed'` row for Maison Test containing brand story, service standards, pacing rules, uniform standards, guest profile, and two signature dishes. `hostia-core` **does not reference any of these tables yet** (§8). The pipeline's input side is done; nothing consumes it.

**Rough split of what needs tailoring:** of the 59 lessons, **17 need real per-property content** (their substance is a claim about the venue), **20 need a light parameter swap** (a dish name, a language set, a pacing number, a role list), and **22 are genuinely universal** (technique and psychology that hold anywhere a person serves another person). Full table in §9.

---

## 2 · Data architecture — where content lives and where the pipeline must write

### 2.1 Content lives in code, not the database

There is **no lessons table.** All theory, quizzes, scenarios, and exams are static TypeScript arrays compiled into the Next.js bundle:

```
src/lib/curriculum.ts   →  CURRICULUM: Module[]        (15 modules, 59 lessons)
src/lib/scenarios.ts    →  SCENARIOS: Record<id, Scenario>  (62 roleplay scenarios)
src/lib/exam.ts         →  EXAM_CONFIGS: ExamConfig[]  (3 track exams)
```

> **This is the single biggest structural constraint on the pipeline.** A "targeted content swap inside fixed containers" currently means either (a) a code-generation step that rewrites `curriculum.ts` and redeploys, or (b) introducing a per-property content-override table that the resolver merges at request time — the same pattern `property_modules` already uses for module selection. Option (b) fits the existing architecture much more naturally and is what `resolveCurriculum` is already shaped for. Nothing in the code today can vary lesson *content* per property.

### 2.2 The type shapes (these are your templating containers)

`curriculum.ts:1–87`. A lesson is:

```ts
interface Lesson {
  id, title, desc, duration, xp, status,
  scenarioId?: string,      // links to SCENARIOS
  learn: LearnSection[],    // the theory — a discriminated union, see below
  quiz: QuizQuestion[],     // { q, options[], correct, explain }
}
```

`LearnSection` is a **discriminated union of 11 block types** — this is genuinely good news for templating, because each block is already an addressable, typed unit:

| `type` | Uses | Shape | Customization role |
| --- | --- | --- | --- |
| `intro` | 71 | `{ text }` | Prose. **The main tailoring surface.** |
| `callout` | 55 | `{ tone: tip\|warn\|rule, label, text }` | `tone:'rule'` blocks are house standards — high tailoring value. |
| `tip-list` | 41 | `{ title, items[] }` | Checklists — often property-specific (uniform, pre-shift). |
| `do-dont` | 36 | `{ title, items: {do,dont}[] }` | **Contains most of the verbatim "say this" scripts.** |
| `steps` | 26 | `{ title, items: {num,title,body,badge?}[] }` | Protocols — mostly universal. |
| `principles` | 19 | `{ items: {num,title,body}[] }` | Mostly universal. |
| `culture-cards` | 9 | `{ items: {group,cues}[] }` | Guest profiles + nationality cards — **highly property-specific.** |
| `video-group` | 2 | `{ videos: {title,url,description}[] }` | Two YouTube embeds, both in `physical-craft`. |
| `menu-pdf` | 1 | `{ title, caption? }` | **Already fully parameterized** — renders `properties.menu_pdf_url`. |
| `lang-grid` | 1 | `{ items: LangCard[] }` | **Type is hardcoded to 4 Curaçao languages.** See §7.1. |
| `phrase-table` | 1 | `{ rows: PhraseRow[] }` | **`PhraseRow` has fixed keys `en/nl/es/pap`.** See §7.1. |

### 2.3 The one existing content parameter: `[Property]`

`src/lib/substitute-property.ts`. All authored content is written against a literal `[Property]` (and `[PROPERTY]` in prompt headers) placeholder. Two helpers swap it at the data boundary:

- `substituteProperty(text, name)` — one string, used for roleplay prompt assembly.
- `substitutePropertyDeep(tree, name)` — walks the whole resolved curriculum in one pass, so no render site ever sees the raw placeholder.

Fallback when no name is available: `'the restaurant'`. The code comments are explicit that a client must never see the literal placeholder. **This mechanism is solid and is the obvious model to extend** — the pipeline should think of itself as adding more placeholders of the same kind (`[SignatureDish]`, `[GreetingScript]`, `[Languages]`), not as rewriting prose.

### 2.4 The other existing parameter: `scenario_context`

`src/app/api/roleplay/route.ts:138–145`. Per-property free text from `property_overrides`, appended to **every** roleplay system prompt:

```
VENUE CONTEXT (use this for all property-specific details):
<admin-authored text>
```

Live example (Bistro 91): *"Bistro 91 is Upscale French-Peruvian fusion restaurant in Nieuwestraat 48, Pietermaai, Willemstad, Curaçao. The menu centers on Peruvian ceviche, lomo saltado, steak au poivre, duck ravioli, seafood dishes and Pisco Sour cocktails. Service style: Refined full-table service…"*

This is doing real work — but note it is **appended after** the scenario's own hardcoded `[PROPERTY] DISH CONTEXT` block, so the model receives contradictory menus (see §7.3).

### 2.5 Live database — the full picture

Tables (from the production PostgREST schema):

**Content selection & structure (already per-property):**
- `property_modules` (property_id, module_id, order_index, is_active) — **which** modules a property shows. `resolveCurriculum()` merges these rows against `CURRICULUM` for content.
- `module_phase_assignments` (module_id, phase_id, order_in_phase) — the real track→phase→order mapping.
- `phases` (id, track, phase_number, title, goal, outcome, certification_title) — seeded for all 3 tracks; fine-dining has 6 phases, casual 5, fast-casual 4.
- `modules` — **stale and unread.** No `from('modules')` call exists anywhere in `src/`. Its metadata has drifted badly (see §7.6).

**Per-property config:**
- `properties` (name, slug, logo_url, primary_color, menu_pdf_url, venue_type) — `venue_type` maps 1:1 to track.
- `property_overrides` (property_id, key, value) — keys in live use: `property_name`, `scenario_context`, `manager_name`, `unlocked_modules`.

**Progress (write targets to protect):**
- `lesson_completions` (staff_id, property_id, module_id, lesson_id, phase) — **`UNIQUE(staff_id, lesson_id, phase)`**.
- `roleplay_sessions` (…, lesson_id, module_id, scenario_id, scenario_variant, warmth_score, transcript, verified, proof_chain_hash).
- `phase_completions`, `lesson_progress` (legacy — unreferenced), `certifications` (unreferenced).

> ⚠️ **Constraint for the pipeline:** `lesson_completions` is keyed on `lesson_id`, not on a content version. If a customization pass forks or renames lessons per property, existing progress silently detaches. **Lesson IDs must be treated as immutable identity; only the content inside them may vary.** This strongly favours the "swap slots inside fixed containers" model you already described, and rules out "generate a new lesson list per client".

**Intake (the pipeline's input — already live, see §8):** `property_intake` (36 columns), `property_menu_items`, `property_documents`.

---

## 3 · The three tracks, as actually configured

Resolved from live `module_phase_assignments`. **Only Phase 1 has content on any track**; Phases 2–6 exist as locked cards with curated topic pills (`curriculum.ts:90–108`).

### 3.1 Fast-Casual — Phase 1 "Onboarding" (7 content modules, 41 lessons)

| # | Module | Type | Fit for fast-casual |
| --- | --- | --- | --- |
| 1 | `onboarding` | universal | ⚠️ Brand story & guest profiles are invented |
| 2 | `greetings` | universal | ⚠️ Assumes a host stand, seating, reservations |
| 3 | `physical-craft` | universal | ❌ **Poor fit** — shoulder-height tray carrying, wine glass placement, napkin folds, a "Captain" role |
| 4 | `service-flow` | universal | ❌ **Poor fit** — a 10-step full-service sequence incl. digestifs |
| 5 | `language` | universal | ⚠️ Menu examples are burger-shop, which happens to fit here |
| 6 | `complaints` | universal | ✅ Good fit |
| 7 | `guest-psychology` | universal | ⚠️ Curaçao nationality cards |
| 8 | `phase-1-certification` | exam | ⚠️ Assumes table service and names specific dishes |

> **Fast-casual has no track-specific module at all.** The exam file comments acknowledge this: *"Fast-casual Phase 1 assigns only the universal modules today… When the fast-casual niche modules ship, adding their content here is a config edit."* Brgr House's live `property_modules` omits nothing — it gets the full universal set, table-service content included.
>
> Also note Brgr House's configured module order is `greetings, physical-craft, service-flow, language, complaints, onboarding, phase-1-certification, guest-psychology` — the onboarding module is 6th and the certification sits *before* guest-psychology. The phase ordering comes from `module_phase_assignments` at render time, so this doesn't surface, but the `property_modules` rows are stale.

### 3.2 Casual Dining — Phase 1 "Foundation" (9 content modules, 49 lessons)

| # | Module | Type | Fit |
| --- | --- | --- | --- |
| 1 | `onboarding` | universal | ⚠️ Invented brand story |
| 2 | `casual-dining-standard` | **casual-only** | ✅ Genuinely casual-dining-shaped |
| 3 | `casual-dining-floor` | **casual-only** | ✅ Genuinely casual-dining-shaped |
| 4 | `greetings` | universal | ⚠️ Curaçao languages |
| 5 | `physical-craft` | universal | ✅ Good fit |
| 6 | `service-flow` | universal | ✅ Good fit |
| 7 | `language` | universal | ⚠️ Burger/steak examples |
| 8 | `complaints` | universal | ⚠️ Duplicates `language/handling-complaints` |
| 9 | `guest-psychology` | universal | ⚠️ Curaçao nationality cards |
| 10 | `phase-1-certification` | exam | ⚠️ Names ribs, burgers, rum cake |

This is the track the content was originally written for. It is the best fit and needs the least structural work — only property-fact substitution.

### 3.3 Fine Dining — Phase 1 "Foundation" (11 content modules, 59 lessons)

| # | Module | Type | Fit |
| --- | --- | --- | --- |
| 1 | `onboarding` | universal | ⚠️ Invented brand story; tone reads mid-market |
| 2 | `fine-dining-standard` | **fine-only** | ✅ Excellent |
| 3 | `fine-dining-presence-module` | **fine-only** | ✅ Excellent |
| 4 | `fine-dining-etiquette` | **fine-only** | ✅ Excellent (one gendered-precedence caveat) |
| 5 | `fine-dining-table-setup` | **fine-only** | ✅ Excellent |
| 6 | `fine-dining-menu-knowledge` | **fine-only** | ⚠️ Deliberately menu-agnostic — the biggest missed opportunity |
| 7 | `greetings` | universal | ❌ **Tonal clash** — "Hey! Welcome in — good to see you", "First time here? Our signature burger is the move" |
| 8 | `physical-craft` | universal | ⚠️ Partly contradicts fine-dining modules (serve-side, clearing) |
| 9 | `service-flow` | universal | ⚠️ Its 10-step sequence is coarser than the fine-dining pacing content |
| 10 | `language` | universal | ❌ **Direct contradiction** — teaches `"No problem"` → `"Absolutely — my pleasure"` while `fdp-voice` teaches `"No problem"` → `"Of course — my pleasure"`, and the burger/Wagyu examples clash hard |
| 11 | `complaints` | universal | ⚠️ Duplicates content in `fde-table-conduct` |
| 12 | `guest-psychology` | universal | ⚠️ Curaçao nationality cards |
| 13 | `phase-1-certification` | exam | ✅ Best-written of the three exams |

> Fine dining is the longest track (59 lessons in Phase 1) and it's the one where the universal modules fit worst. **Note Bistro 91's live config drops `language` entirely and omits `phase-1-certification`** — someone has already been hand-pruning this. Maison Test keeps everything.

---

## 4 · The universal core — module by module, lesson by lesson

These 7 modules are shared by all three tracks.

---

### MODULE `onboarding` — "Welcome to [Property]"
`curriculum.ts:119–288` · 6 lessons · 135 XP · **no roleplay scenarios on any lesson** (the only such module)

> **Module verdict: this is the single highest-value target for the pipeline.** Every lesson here is a *claim about the venue*, written as generic filler. It is also the first thing a new hire ever reads, so generic-ness here poisons the whole experience.

---

#### 4.1 `welcome-to-hostia` — "Welcome to Hostia" · 4 min · 10 XP
`curriculum.ts:121–151`

**Objective:** How Hostia works and how to find your way around.

**Theory:**
- `intro` — "Hostia is your personal hospitality trainer. Everything you'll learn for your work at **[Property]** lives here — short lessons, quick quizzes, and live practice conversations with an AI guest…"
- `video-group` — **conditionally rendered**: `HOSTIA_WELCOME_VIDEO_URL` is `''` at `curriculum.ts:117`, so the block is spread out of the array entirely. The lesson renders cleanly with no video. Paste an embed URL and it appears.
- `steps` "How a lesson works" — 1 Learn / 2 Practice / 3 Apply (badge `Live`).
- `callout` (tip) "XP & streaks".

**Quiz:** 3 questions (**the only 3-question quiz in the product**; all other 58 lessons have 5). Q: the three phases; Q: when a lesson counts as complete; Q: how to resume.

**Note:** ✅ **Fully universal** — it's product onboarding, not hospitality content. The only property token is one `[Property]` mention, already handled. **Do not touch this in the pipeline.** Two live to-dos unrelated to customization: the video URL is still empty, and the 3-vs-5 quiz length is an inconsistency.

---

#### 4.2 `our-story` — "Our Story & DNA" · 7 min · 20 XP
`curriculum.ts:153–175`

**Objective:** Where [Property] came from and what we stand for.

**Theory:**
- `intro` — *"Before you carry a single plate, you need to know the story you're a part of. **[Property] didn't start as a business plan — it started as an idea about how people should be treated when they sit down to eat.** … When a guest asks 'how long have you been here?' or 'what's the story behind this place?', your answer is part of the experience. You are not just staff — you are the storyteller of [Property]."*
- `principles` — three invented brand values:
  1. **Hospitality over transactions** — *"We are not here to turn tables… Revenue follows hospitality, never the other way around."*
  2. **Craft and pride** — *"a polished glass, a folded napkin, a remembered name."*
  3. **We are a team, not a hierarchy** — *"From the kitchen to the floor to the host stand… No one says 'that's not my job.'"*
- `callout` (rule) "What makes us different" — *"Anyone can serve food. [Property] exists to make every guest feel like they were expected, welcomed, and remembered. If a guest leaves having eaten well but feeling like a number — we failed, no matter how good the food was."*

**Quiz:** 5 questions, all of which quiz the trainee **on the invented values as fact**: "At [Property], when a decision is made, what comes first?" → correct answer "The guest's experience — revenue follows hospitality." "A table needs clearing but it's technically in another server's section. What does our DNA say?" → "Handle it — at [Property] everyone owns the guest experience."

**Note:** ❌ **100% property-specific and currently 100% fictional.** This lesson tells a new hire their restaurant's origin story and core values — and invents both. For Maison Test (a 40-cover tasting-menu room open since 2019, "guests come for a special occasion") the real story exists in `property_intake.brand_description` and `brand_differentiator` and is *far* better than the filler. The structure is a perfect container: 1 intro + 3 principles + 1 rule callout + 5 quiz questions derived from them. **Highest-priority templating target in the whole product.**
**Intake mapping:** intro ← `brand_description`; principles ← `brand_differentiator` + `brand_tone_notes`; rule callout ← `brand_differentiator`; quiz must be regenerated from whatever the principles become.

---

#### 4.3 `our-standards` — "House Standards & Expectations" · 7 min · 20 XP
`curriculum.ts:177–200`

**Objective:** What [Property] expects from every team member.

**Theory:**
- `intro` — *"Standards are not about being strict — they're about being consistent… When you walk through that door, you stop being an individual having a good or bad day — you become [Property]."*
- `do-dont` "The standards in practice" — 4 pairs, each a **specific policy claim**:
  - do: *"Arrive **10–15 minutes early**, in clean uniform, groomed and ready to start on time."* / dont: *"Stroll in at the start of your shift…"*
  - do: *"Keep a positive, composed attitude on the floor."* / dont: *"Let a bad mood… show on your face in the dining room."*
  - do: *"Put phones away during service."* / dont: *"Check your phone, lean on furniture, or cluster with coworkers where guests can see."*
  - do: *"Speak about colleagues, guests, and the restaurant respectfully, on and off shift."* / dont: *"Gossip… or badmouth the restaurant online."*
- `callout` (rule) "You represent the brand" — extends to online conduct and the community.

**Quiz:** 5 questions, including one that quizzes the **10–15 minute** number directly.

**Note:** ⚠️ **Property-specific policy presented as universal truth.** The values (composure, phone discipline, discretion) are universal; the *specifics* are not — 10–15 minutes early, uniform rules, and social-media policy vary by house and are exactly what a handbook defines. Maison Test's real standard is far more specific and would land much harder: *"All black — tailored, no visible logos. Long hair tied back. No visible tattoos on hands or forearms during service… **No cologne or perfume, out of respect for the tasting menu's aromatics.** Polished black shoes, no sneakers."* Using the generic version there is a wasted lesson.
**Intake mapping:** do/dont items ← `uniform_grooming_standards`; the arrival number ← needs a new intake field (not currently captured); rule callout is universal enough to keep.

---

#### 4.4 `our-guests` — "Who Are Our Guests" · 7 min · 20 XP
`curriculum.ts:202–231`

**Objective:** Understand who walks through our door and what they need.

**Theory:**
- `intro` — *"[Property] welcomes a real mix of people — **locals who treat us like a second home, travelers discovering us for the first time, and guests marking the biggest moments of their lives.**"*
- `culture-cards` — three invented guest profiles: 🏠 **Regulars & Locals**, 🌍 **Travelers & First-Timers** (*"A great experience here becomes the highlight of their trip and a five-star review"*), 🎉 **Celebration Guests**.
- `tip-list` "Adapting to different guest needs" — 6 items, incl. the script *"Want me to walk you through our favorites?"*

**Quiz:** 5 questions built entirely on those three invented profiles.

**Note:** ❌ **Property-specific and guessed.** The three profiles are a plausible default, not this restaurant's actual guest mix. The intake captures this precisely: `tourist_percentage` (65% for Maison Test), `top_nationalities`, `age_range` (35–50), `avg_party_size` (2), `price_positioning` (premium), `peak_days`. For a 40-cover tasting-menu room whose guests are *"anniversaries, proposals, milestone birthdays"* with an average party of **2**, the "🎉 Celebration Guests" card should be the *primary* profile, not the third — and "Regulars & Locals" barely applies at 65% tourists. Same three cards would be actively misleading at a fast-casual lunch counter.
**Intake mapping:** culture-cards ← `tourist_percentage` + `top_nationalities` + `age_range` + `avg_party_size` + `price_positioning`; tip-list ← `brand_tone_notes`.

---

#### 4.5 `your-first-shift` — "Your First Shift" · 8 min · 25 XP
`curriculum.ts:233–261`

**Objective:** What to expect and how to start strong on day one.

**Theory:**
- `intro` — *"Your first shift is not a test you can fail… The staff who thrive on day one aren't the ones who pretend to know everything — they're the ones who watch closely, follow the routine, and aren't afraid to say 'show me.'"*
- `steps` "Your first shift routine" — 1 Arrive early and check in (`Before service`, **15 minutes**) / 2 Shadow and observe (`Watch`) / 3 Take on small tasks (`Do`) / 4 Debrief and reflect (`After service`).
- `callout` (tip) "Asking questions is a strength" — includes the example *"which side do I serve from?"*
- `do-dont` "Common first-shift mistakes" — 3 pairs.

**Quiz:** 5 questions.

**Note:** ✅ **Mostly universal** with two soft spots. The advice (observe, ask, do small things well, debrief) holds anywhere. But it assumes a **shadowing-with-a-trainer** onboarding model and a **15-minute early arrival** — neither is guaranteed. It also silently assumes plated table service (*"refilling water, clearing plates, resetting tables"*, *"which side do I serve from?"*), which is wrong for a counter operation. **Light parameter swap, not a rewrite.**
**Intake mapping:** step bodies ← `shift_structure` + `roles_to_train` + `hire_profile` (Maison Test's *"Career hospitality professionals, not students or first jobs — most have 3+ years fine dining experience"* would completely change the tone of this lesson, which currently addresses a first-timer).

---

#### 4.6 `our-menu-pdf` — "Our Menu" · 12 min · 40 XP
`curriculum.ts:263–286`

**Objective:** Study the full menu — every dish, ingredient, and price.

**Theory:**
- `intro` — short and deliberately generic.
- `tip-list` "What to pay attention to as you read" — 5 items: ingredients/allergens, preparation method, prices and what's included, dietary options, natural pairings.
- `menu-pdf` "The full menu" — **renders `properties.menu_pdf_url`** via `SectionMenuPdf` (`LearnPhase.tsx:218–232`), with a placeholder while NULL.

**Quiz:** 5 questions — all *meta* ("why is it worth knowing the price?"), none about actual dishes.

**Note:** ✅ **Already the best-parameterized lesson in the product** and the model the rest should follow: fixed container, property-specific payload, no fabricated facts. **But it stops one step short.** The quiz can't ask about real dishes because the content layer has no structured menu — even though `property_menu_items` now holds exactly that (name, description, category, allergens, is_signature). This lesson is the obvious first place to prove the pipeline: generate 5 real menu questions from `property_menu_items` (e.g. Maison Test: *"Which allergens are in the Kadushi & Goat Cheese Tart?"* → Gluten, Milk).
**Intake mapping:** quiz ← `property_menu_items` (direct, structured, zero hallucination risk).

---

### MODULE `greetings` — "Greetings & First Impressions"
`curriculum.ts:292–530` · 4 lessons · 200 XP · every lesson has a scenario

> **Per-track fit:** casual ✅ · fast-casual ⚠️ (assumes a host stand and seating) · fine dining ❌ (tone is too casual; contains a burger line)

---

#### 4.7 `five-second` — "The 5-Second Rule" · 7 min · 50 XP · scenario `five-second-rule`
`curriculum.ts:294–323`

**Objective:** Immediate greeting within 5 seconds of arrival.

**Theory:**
- `intro` — *"A guest who walks into [Property] and is acknowledged immediately feels welcomed. A guest who has to look around, make eye contact twice, and wait — already feels like an afterthought."*
- `callout` (rule) **The Standard** — *"Every guest is acknowledged **within 5 seconds** of stepping through the door. If you're mid-task, look up, make eye contact, and say 'I'll be right with you' — that counts."*
- `principles` — 1 Stop what you're doing / 2 Eye contact first / 3 Use their name if you have it / 4 When you're busy, still acknowledge.
- `do-dont` "In practice" — **verbatim scripts**:
  - ✅ *"Good evening, welcome to [Property]! Table for two?"* ❌ *"Continuing to clean a table for 15 seconds before looking up."*
  - ✅ *"Mr. Santos! Great to see you again. Your usual corner table?"* ❌ *"'Name on the reservation?' delivered to the floor."*

**Quiz:** 5 questions, one of which quizzes **"What is the [Property] standard for greeting speed?" → 5 seconds** as a house rule.

**Roleplay `five-second-rule`** (`scenarios.ts:24–58`) — *"The Local Family"*, 45s, warmth starts 6, scores speed/language/warmth. Opening: *"A local **Curaçaoan** family — parents and two teenage kids — just stepped through the door of [Property]."* System prompt: *"You are simulating a greeting scenario at [Property], **Curaçao**… Parents speak **Papiamentu and Dutch**… **'Bon bini' or 'Bon dia' = instant warmth boost**."*

**Note:** ⚠️ **Principle universal, numbers and scenario property-specific.** The 5-second rule is a real industry standard, but it is presented as *[Property]'s* standard and quizzed as such — and Maison Test's actual intake says **"Greeted within 30 seconds of stepping through the door, always by the host first."** Running this lesson unchanged there teaches staff a number their house explicitly contradicts. The scripts also assume table-for-N seating and reservations. The roleplay is hard-Curaçao: a fine-dining room in Amsterdam gets a Papiamentu-speaking family and a warmth bonus for saying "Bon bini".
**Intake mapping:** the 5-second number and the greeting script ← `greeting_script`; scenario nationality/language ← `top_nationalities` + `primary_languages`.

---

#### 4.8 `guide-dont-point` — "Guide, Don't Point" · 7 min · 50 XP · scenario `guide-dont-point`
`curriculum.ts:325–354`

**Objective:** Always escort guests to their table — never point.

**Theory:**
- `intro` — *"Pointing to a table is the service equivalent of handing someone directions on a napkin… The walk to the table is not dead time. It's the second act of the first impression."*
- `callout` (rule) **The Standard** — *"Always escort. Never point. Open the menu as you walk. Say one thing about the experience before you seat them."*
- `principles` — 1 Walk, don't gesture / 2 Menu in hand, open / 3 One line about the experience / 4 Adjust to their pace.
- `do-dont` — includes the **menu-specific example** *"We have a great **craft beer** on tap tonight"* and *"The kitchen's doing something special with the **truffle fries**."*

**Quiz:** 5 questions.

**Roleplay `guide-dont-point`** (`scenarios.ts:60–96`) — *"The Lost Tourists"*, American couple, 45s, warmth 7, scores guidance/warmth/professionalism.

**Note:** ⚠️ **Universal principle, wrong venue assumptions + placeholder menu items.** "Escort, don't point" is a genuine full-service standard — and **meaningless at a counter-service operation**, where the guest orders at the register and seats themselves. It is currently assigned to Brgr House. The two example lines ("craft beer on tap", "truffle fries") are stand-ins for a real signature item and read as filler at a tasting-menu restaurant.
**Intake mapping:** the "one line" examples ← `property_menu_items` (is_signature); applicability ← `table_service_model` / `service_style` (this lesson should arguably be swapped out entirely for counter service).

---

#### 4.9 `multilingual` — "Multilingual Welcome" · 10 min · 50 XP · scenario `greeting-dutch-couple`
`curriculum.ts:356–398`

**Objective:** Greet in English, Dutch, Spanish & Papiamentu.

**Theory:**
- `intro` — *"On any given evening at [Property], you might welcome a Dutch couple celebrating an anniversary, a Venezuelan family on vacation, American tourists **from a cruise ship**, and **local Curaçaoans** celebrating a birthday — all in the same shift."*
- `callout` (rule) The Standard — lead in their language, default English.
- `lang-grid` — **4 hardcoded languages**, each with formal/casual greeting + a cultural tip:
  - 🇺🇸 English — *"Welcome to [Property], great to have you here. Table for [X]?"* / *"Hey! Welcome in — good to see you."*
  - 🇳🇱 Dutch — *"Welkom bij [Property]. Fijn dat u er bent. Tafel voor [X]?"*
  - 🇪🇸 Spanish — *"Bienvenidos a [Property]. Qué bueno tenerlos aquí. ¿Mesa para cuántos?"*
  - 🇨🇼 Papiamentu — *"Bon biní na [Property]! Kon ta bai? ¿Mesa pa kuantu persona?"*
- `phrase-table` — 8 rows × 4 fixed columns (Welcome/Bon biní, Good morning/Bon dia, Good afternoon/Bon tardi, Good evening/Bon nochi, How are you?/Kon ta bai?, Thank you/Danki, Enjoy your meal/Bon apetit, Come back soon/Te aworo).
- `culture-cards` — 6 nationality cards: 🇳🇱 Dutch, 🇺🇸 American, 🇻🇪 Venezuelan/🇨🇴 Colombian, 🇩🇪 German, 🇨🇦 Canadian, 🇨🇼 Local Curaçaoan.

**Quiz:** 5 questions — **two are pure Papiamentu vocabulary tests** ("How do you say 'Welcome' in Papiamentu?" → Bon biní; "What does 'Bon tardi' mean?" → Good afternoon).

**Roleplay `greeting-dutch-couple`** (`scenarios.ts:98–139`) — 45s, warmth 6, scores speed/language/warmth, Curaçao-set.

**Note:** ❌ **The most locale-locked lesson in the product, and the hardest to fix**, because the lock is in the type system and the renderer, not just the copy:
- `PhraseRow` is `{ en, nl, es, pap }` — **four fixed fields** (`curriculum.ts:33–38`).
- `SectionPhraseTable` hardcodes the column headers `English | Dutch | Spanish | Papiamentu` (`LearnPhase.tsx:125`).
- `SectionLangGrid` hardcodes the heading **"The four languages of Curaçao"** (`LearnPhase.tsx:91`).

A property in Lisbon cannot be given Portuguese/Spanish/English without a **type change and a component change**. See §7.1 for the recommended fix. Everything else about the lesson — greet in their language, adapt style not standard — is universal and worth keeping.
**Intake mapping:** `primary_languages`, `top_nationalities` (Maison Test: *"English, Papiamentu, Dutch"*, *"Dutch, American, Venezuelan"* — note the intake stores these as **single-element arrays of comma-joined strings**, a data-quality bug in the intake tool; see §7.8).

---

#### 4.10 `reading-table` — "Reading the Table" · 8 min · 50 XP · scenario `reading-table-romantic`
`curriculum.ts:400–530`

**Objective:** Adapt your energy to couples, groups, and demanding guests.

**Theory:**
- `intro` — *"A couple on a date wants presence, not interruption. A group of friends wants energy and fun. A solo businessman wants precision and speed."*
- `callout` (rule) The Standard — *"Read the table before you open your mouth. Match energy to energy… Service adapts to the guest, not the other way around."*
- `culture-cards` — 4 table types: 💑 Couples / 👥 Groups (4+) / 💼 Business/Solo / 🌍 Tourists.
- `do-dont` — 4 pairs with verbatim scripts, including **🚩 *"First time here? **Our signature burger** is the move — freshly ground daily."*** (a burger line inside a universal module that fine-dining properties receive)
- `tip-list` "Universal rules — every table, every time" — 4 items, incl. *"Never let a table look around for more than 30 seconds."*

**Quiz:** 5 questions.

**Roleplay `reading-table-romantic`** (`scenarios.ts:447–494`) — *"The Romantic Couple — Table 2"*, Venezuelan, 45s, warmth 7, scores discretion/proactivity/language.

**Note:** ⚠️ **Substance is universal; one script is badly out of place.** Energy-matching is real hospitality craft and travels everywhere. But the "signature burger… freshly ground daily" line is served today to **Bistro 91 and Maison Test** — fine-dining properties. It is the clearest single example of what "generic content used unchanged" looks like in practice. Also note this lesson's `culture-cards` are **~70% duplicated** by `guest-psychology/guest-types` (§4.27) — including the *identical* "The Standard" callout text, verbatim.
**Intake mapping:** the signature-item script ← `property_menu_items` (is_signature).

---

### MODULE `physical-craft` — "The Physical Craft"
`curriculum.ts:534–699` · 5 lessons · 250 XP

> **Per-track fit:** casual ✅ · fine dining ⚠️ (partly superseded/contradicted by `fine-dining-table-setup` and `fdp-invisible`) · fast-casual ❌ **(poor fit — currently assigned to Brgr House)**

---

#### 4.11 `tray-carrying` — "Tray Carrying — The Foundation" · 10 min · 50 XP · scenario `first-tray-full-room`
`curriculum.ts:536–566`

**Objective:** The skill that defines your confidence on the floor.

**Theory:** `intro` (*"A dropped tray is not just lost food. It breaks the entire atmosphere of the room."*) · `principles` × 7 — 1 Left hand only (palm open, fingers spread) / 2 **Shoulder height or just above** / 3 Heavy items at the CENTER / 4 Rotate your entire body, never twist the wrist / 5 Bend at the knees, both hands to lower / 6 Route planning, never narrow paths / 7 If unstable: stop, steady, continue · `callout` (warn) "Common Mistakes" · `video-group` → `https://www.youtube.com/embed/4c2sIvi196c`

**Quiz:** 5 questions (which hand; heavy items where; unstable tray; turning; narrow corridor).

**Roleplay `first-tray-full-room`** — 45s, warmth 6, scores technique/safety/confidence.

**Note:** ✅ **Genuinely universal *technique*** — physics doesn't vary by brand. ⚠️ But it is **not universal by venue**: shoulder-height tray service is a full-service skill. At a counter-service burger shop this is training for a job the staff don't do. This is a *module-assignment* problem, not a content problem — the fix is `property_modules`, not the AI pass. **Do not send this to the drafting pass.** (One caveat: "left hand only" is a house convention, not a law — some operations train right-hand-dominant.)

---

#### 4.12 `plate-carrying` — "Plate Carrying" · 9 min · 50 XP · scenario `table-6-main-course`
`curriculum.ts:568–594`

**Objective:** One plate, two plates, three plates — the technique that saves time and looks professional.

**Theory:** `intro` · `steps` "The progression" — 1 One plate (three middle fingers under, thumb and little finger raised; `Master this first`) / 2 Two plates (second rests on the thumb muscle; `Then this`) / 3 Three plates (third on forearm/wrist; `Advanced`) · `callout` (rule) — *"Never tilt a plate… **Serve from the correct side (property standard).** … If unsure about 3 plates — do 2 trips."* · `video-group` → `https://www.youtube.com/embed/ZfIyfODimvo`

**Quiz:** 5 questions.

**Roleplay `table-6-main-course`** — *"Three mains are up: a fish, a steak, and a pasta"* (generic placeholder dishes).

**Note:** ✅ **Universal technique**, with one already-parameterized detail worth highlighting: the callout literally says **"(property standard)"** for serve-side — an author acknowledging a customization slot in prose instead of in data. Meanwhile `fde-service-direction` (§6.10) states the fine-dining rule flatly as "serve from the left, clear from the right", so a fine-dining trainee gets a hedge in one module and an absolute in another. The scenario's fish/steak/pasta are placeholders that should come from the real menu.

---

#### 4.13 `floor-movement` — "Floor Movement & Navigation" · 7 min · 50 XP · scenario `busy-saturday`
`curriculum.ts:596–623`

**Objective:** How you move says everything about who you are on the floor.

**Theory:** `intro` · `principles` × 6 — 1 Posture / 2 **Always walk on the right side of corridors** / 3 Guests always have right of way / 4 No running, no shuffling / 5 Pre-bus passes / 6 Always moving with purpose · `callout` (warn) "Danger Zones" (kitchen doors, corners, wet floors) · `callout` (tip) "What movement communicates"

**Quiz:** 5 questions, one of which quizzes **"right side of corridors"** as doctrine.

**Roleplay `busy-saturday`** — ⚠️ **this scenario has an empty `goal` string** (`scenarios.ts:809`), the only one of 62. The Apply-phase UI will render a blank goal.

**Note:** ✅ **Universal**, with one caveat: "walk on the right" is a **left-hand-traffic-country problem** and a floor-plan problem — it's a house convention, not physics. Everything else (right of way, purposeful movement, pre-bussing) travels. **Flag the empty scenario goal as a bug.**

---

#### 4.14 `table-setting` — "Table Setting to Standard" · 8 min · 50 XP · scenario `pre-service-inspection`
`curriculum.ts:625–661`

**Objective:** The table is the guest's first impression before you say a word.

**Theory:** `intro` · `steps` "Standard cover setup" × 6 — Fork left tines up / Knife right **blade facing inward** / Spoon right of knife / Water glass above the knife slightly right / **Wine glass** to the right of the water glass (*"if applicable"*) / Napkin on the plate or left of the fork · `tip-list` "Pre-service checklist" × 7 (polished glasses held to light, cutlery aligned, no chipped plates, consistent napkin folds, dry surface, **centerpiece or candle**, menus clean) · `callout` (rule) "The Golden Rule" — *"Never seat a guest at a table you would not be proud to sit at yourself."* · `callout` (tip) "Polishing glasses" — hold by the stem only.

**Quiz:** 5 questions.

**Note:** ⚠️ **Universal for table service, meaningless below it.** A single standard cover with wine glass, candle, and folded napkin describes a mid-to-upper casual room. It is **wrong in both directions**: a counter operation has no cover at all, and a fine-dining room has a charger, multiple courses of cutlery, and a house napkin fold (all of which `fdt-mise-en-place` teaches properly, §6.13 — so fine-dining staff learn two different cover standards in the same phase). The author hedged once with *"(if applicable)"* on the wine glass. **Candidate for module-level swap-out rather than content tailoring.**

---

#### 4.15 `synchronized-service` — "Synchronized Service" · 8 min · 50 XP · scenario `six-top-all-at-once`
`curriculum.ts:663–699`

**Objective:** Great service is invisible — because the whole team moves as one.

**Theory:** `intro` · `steps` "The choreography rules" × 5 — 1 **All plates go out together** (`Non-negotiable`) / 2 Never cross paths / 3 Clear simultaneously / 4 Communicate without words / 5 Move with intention · `callout` (rule) **"The 3-Second Rule"** — *"everyone arrives within 3 seconds of each other. Not 30. Not 10. Three."* · `principles` — the three floor roles: **Server** (owns the guest relationship, calls timing) / **Runner** (logistics, watches the window) / **Captain** (coordinates the floor, "the eye above the floor") · `tip-list` "The 5-minute after-service brief" × 3.

**Quiz:** 5 questions.

**Roleplay `six-top-all-at-once`** — coordination/timing/standards_knowledge.

**Note:** ⚠️ **Universal principle, property-specific org chart.** "All plates together" is real and travels. But **Server / Runner / Captain is one specific brigade structure.** Maison Test's intake lists `roles_to_train`: *Server, Runner, Host/Maître d', Sommelier* — no Captain, plus two roles this lesson never mentions. Brgr House almost certainly has neither Runner nor Captain. Teaching a trainee to "communicate pace to the Captain" at a restaurant with no Captain is exactly the generic-content failure mode.
**Intake mapping:** the roles `principles` block ← `roles_to_train` + `table_service_model` (Maison Test: *"Sections — one server owns their tables"*).

---

### MODULE `service-flow` — "The Service Flow" ("[Property]'s 10-step standard, start to finish")
`curriculum.ts:703–801` · 3 lessons · 150 XP

> **Per-track fit:** casual ✅ · fine dining ⚠️ (coarser than, and partly contradicted by, the fine-dining pacing content) · fast-casual ❌ **(the 10 steps describe full table service incl. digestifs)**

---

#### 4.16 `ten-steps` — "The 10-Step Service Sequence" · 7 min · 50 XP · scenario `full-service-run`
`curriculum.ts:706–735`

**Objective:** The complete service standard every hospitality professional must master.

**Theory:** `intro` (*"This is not a rigid script — it's a framework."*) · `steps` **The 10 Steps**, each with a timing badge:
1. **Reception** — greet within 5 seconds, confirm reservation, use their name (`Always`)
2. **Seating** — guide, never point; deliver menu open (`Always`)
3. **First Contact** — water immediately, brief concept intro (`Within 2 min`)
4. **Drinks** — proactive suggestion with a reason (`Proactive`)
5. **Order Taking** — listen, confirm, detect restrictions (`Confirm`)
6. **Food Service** — correct side, never interrupt, all plates together (`Synchronized`)
7. **Follow-up** — 2–3 min after food; ask about flavors, never "Is everything OK?" (`2–3 min`)
8. **Clearing** — never while someone is eating; synchronized (`Never rush`)
9. **Dessert / Digestifs** — offer before they ask (`Proactive`)
10. **Close** — personalized thank-you, invitation to return, use their name (`Personal`)

**Quiz:** 5 questions (all sequence/timing recall).

**Note:** ⚠️ **The module subtitle literally calls this "[Property]'s 10-step standard" — so it is framed as a house standard while being a fixed, unvarying sequence.** The framework is broadly universal for full service, but the *numbers* are house policy: "within 2 minutes", "2–3 minutes after food". Maison Test's real pacing is completely different and more specific: *"Amuse-bouche within 10 minutes of the last guest being seated. Roughly 12–15 minutes between courses… **Bill is never dropped unprompted; only presented when a guest asks for it.**"* — which directly **contradicts** the casual/fast-casual exam beat that scores 2 points for reading the wallet signal and bringing the bill unasked. Step 9 (digestifs) is meaningless at fast-casual; steps 1–2 assume a host and seating.
**Intake mapping:** step timings ← `pacing_rules`; steps 1/10 scripts ← `greeting_script` / `farewell_script`; step 4 ← `upsell_approach`.

---

#### 4.17 `proactive-reactive` — "Proactive vs Reactive Service" · 7 min · 50 XP · scenario `proactive-floor-signal`
`curriculum.ts:737–767`

**Objective:** The difference between 4-star and 5-star service.

**Theory:** `intro` · `callout` (rule) — *"Reactive = 4 stars. Proactive = 5 stars."* · `culture-cards` — 5 signal→action pairs: 💧 reaches for water / ⌚ glances at watch (*"I can have your main out in the next 8 minutes"*) / 👶 with children (**crayons, kids' menu, highchair**) / 💼 business attire (*"mention quiet seating and **fast WiFi**"*) / 💑 couple stops talking · `principles` — Observe → Interpret → Act.

**Quiz:** 5 questions.

**Note:** ✅ **Substance is universal** — anticipation is the core of good service anywhere. ⚠️ Three of the five cards assume specific amenities: **crayons and a kids' menu** (a fine-dining tasting-menu room has neither), **WiFi and quiet seating**, and a **"main course"** structure. Light touch-up, not a rewrite.
**Intake mapping:** amenity references ← would need a new intake field (amenities/kids policy is not currently captured — worth adding).

---

#### 4.18 `nonverbal-signals` — "Reading Non-Verbal Signals" · 7 min · 50 XP · scenario `nonverbal-observation`
`curriculum.ts:769–801`

**Objective:** What guests communicate before they say a word.

**Theory:** `intro` · `principles` × 6 — Looking around (*"get there within 60 seconds"*) / Menu closed = ready / Leaning back = course complete / Leaning forward = don't interrupt / Phone out = efficient service / Looking at the bill = ready to leave · `culture-cards` — **3 ethnic-group signal cards**: 🇳🇱 Dutch/Northern European, 🇻🇪 Latin American, **🌏 "Asian Guests"** (*"May not wave or make obvious signals… Don't wait for an obvious signal that may never come."*) · `callout` (tip) "The Invisible Standard".

**Quiz:** 5 questions — including one whose stem is *"An **Asian guest** has a closed menu but hasn't waved or made eye contact."*

**Note:** ⚠️ Signal-reading itself is universal and well done. **But flag the culture cards on editorial grounds**, separate from customization: two cards are national ("Dutch", "Latin American") and the third is a **continent-scale ethnic generalisation ("Asian Guests")**, which is a different and much broader category, and it is carried into a quiz stem. If a client's staff or guests see this, it reads poorly. The `cultural-awareness` lesson (§4.28) opens with a self-aware disclaimer (*"This is not a stereotype guide. It's a pattern recognition guide."*) — this lesson has no such framing. Recommend narrowing these cards to the property's actual `top_nationalities` (which also solves the customization problem).

---

### MODULE `language` — "Language & Storytelling"
`curriculum.ts:805–956` · 4 lessons · 200 XP

> **Per-track fit:** casual ✅ · fast-casual ✅ (burger examples happen to fit) · fine dining ❌ **(direct vocabulary contradiction with `fdp-voice` + burger/Wagyu examples). Bistro 91 has already removed this module from its live config.**

---

#### 4.19 `banned-phrases` — "The Banned Phrases" · 8 min · 50 XP · scenario `language-followup`
`curriculum.ts:807–842`

**Objective:** What never to say — and what to say instead.

**Theory:** `intro` (*"'Is everything okay?' is the most dangerous phrase in a restaurant."*) · `do-dont` "Replace these immediately" — **6 verbatim script swaps, given bilingually (English / Spanish)**:

| ❌ Never | ✅ Instead |
| --- | --- |
| *"Is everything okay?"* / *"¿Todo bien?"* | *"How are you finding the balance of flavors?"* / *"¿Cómo percibieron el balance de sabores?"* |
| *"Did you like it?"* / *"¿Les gustó?"* | *"What did you think of the [dish]?"* / *"¿Qué les pareció la [dish]?"* |
| *"No problem."* | ***"Absolutely — my pleasure."*** |
| *"I don't know."* | *"I don't know — let me find out for you right away."* |
| *"That's not my department."* | *"Let me take care of that right now."* |
| *"We can't do that."* | *"What I can do is…"* |

· `callout` (rule) "The Language Rule" · `tip-list` "Why these phrases are banned" × 6.

**Quiz:** 5 questions, all script-recall.

**Note:** ⚠️ **Mostly universal, with two real problems.** (1) The **Spanish translations are hardcoded** in the do/dont text — a property with a Dutch- or Portuguese-speaking floor gets Spanish it can't use, and there's no mechanism to vary it. (2) **It contradicts `fdp-voice` head-on**: this lesson says the correct response to thanks is *"Absolutely — my pleasure"*; the fine-dining voice lesson says *"Of course — my pleasure"* and specifically brands *"Absolutely"*-style casualness as a level-drop. A fine-dining trainee gets both, in the same phase, both framed as the standard. Note `describe-serving` also uses the bracket-placeholder convention *"What did you think of the **[dish]**?"* — an informal template slot the author already wanted.
**Intake mapping:** the second language ← `primary_languages`; the register (formal vs. warm-casual) ← `brand_tone_notes` (Maison Test: *"Formal register, but never cold"*).

---

#### 4.20 `describe-serving` — "Describing What You Serve" · 8 min · 50 XP · scenario `describe-recommend`
`curriculum.ts:844–881`

**Objective:** The 3-part formula that sells any dish or drink in one sentence.

**Theory:** `intro` · `steps` **The 3-part description formula**:
1. **The Star** — *"This starts with hand-selected **Wagyu**…"* (`Lead here`)
2. **The Method** — *"Slow-smoked for 8 hours", "seared on cast iron", "fermented in-house"* (`Build desire`)
3. **The Experience** — *"…a deep, smoky finish that's completely unique to us."* (`Close the sale`)

· `callout` (tip) "Formula in action" — *"This starts with our **freshly ground beef blend** [Star], seared on a **cast-iron flat top** [Method], giving you a crust that locks in every bit of juice…"* · `callout` (rule) — *"Never say 'it's good.'"* · `do-dont` — 3 pairs, incl. *"This opens with **dark rum**, shaken with fresh citrus and house bitters…"* and *"Caught this morning from **local waters**, simply pan-seared, with a **charred lime**…"* · `tip-list` "What NOT to do" × 5.

**Quiz:** 5 questions — **three of them use burger/beef examples as the correct answer.**

**Roleplay `describe-recommend`** (`scenarios.ts:189–241`) — *"What Do You Recommend?"*, solo American traveler Tyler, 45s, warmth 7. Contains a block literally headed **`[PROPERTY] DISH CONTEXT — staff may describe these:`** with two invented dishes: *"The fish: locally caught, pan-seared simply, served with charred lime and herb butter"* / *"The steak: hand-selected cut, grilled on open flame, aged in-house"*.

**Note:** ❌ **The formula is universal; every single example is a specific restaurant's menu.** Wagyu, freshly ground beef, cast-iron flat top, dark rum, charred lime — this is a burger-and-cocktails venue's voice. Serving it to Maison Test (kadushi tart, pan-seared wahoo, tamarind beurre blanc, 7 courses, no à la carte) makes the whole lesson read as boilerplate. **This is the single highest-leverage menu-substitution target**, because the formula container is perfect and only the fill-ins are wrong. The scenario's `[PROPERTY] DISH CONTEXT` header is effectively an un-wired template slot that is **already labelled as one**.
**Intake mapping:** all examples + scenario dish context ← `property_menu_items` (name, description, category, is_signature). Maison Test's Pan-Seared Wahoo description already contains a ready-made Star/Method/Experience: *"Locally caught wahoo, seared skin-on, served with a tamarind beurre blanc and charred local corn. Our most-ordered main and the dish most guests photograph."*

---

#### 4.21 `storytelling` — "Storytelling — Selling Through Stories" · 9 min · 50 XP · scenario `storytelling-property`
`curriculum.ts:883–918`

**Objective:** Guests remember stories, not facts.

**Theory:** `do-dont` "Facts vs. stories" — ❌ *"We use fresh ingredients"* → ✅ *"Our vegetables come from a **local farm in the interior** — picked this morning"* (⚠️ "the interior" is a Curaçao geographic idiom); ❌ *"This is our signature dish"* → ✅ *"This is the dish that started it all — the owner created it on the first night we opened."* · `steps` **The 3 story types**: 1 **Origin Story** (`Builds trust`) / 2 **Process Story** (*"Slow-smoked for 8 hours over local wood", "House-ground daily"*; `Builds desire`) / 3 **Guest Story** (*"A regular couple comes back every Friday specifically for this one"*; `Closes the decision`) · `callout` (rule) "When to use stories" · `culture-cards` — 4 situation→story-type mappings.

**Quiz:** 5 questions — the correct answer to *"What's special about this place?"* is a **fabricated origin story**: *"This started as one dish — the owner made it on opening night. Guests kept coming back for it specifically. Everything else grew from that."*

**Roleplay `storytelling-property`** (`scenarios.ts:243–298`) — *"Tell Me About This Place"*, guest Rafael asks *"what makes this place different from everywhere else **on the island**?"*. System prompt contains **`[PROPERTY] STORY CONTEXT — staff may use any of these authentically:`** listing: *the signature dish created on the first night of service by the owner*; *the beef: **hand-ground daily in-house***; *local supplier relationships*; *returning guests who come every week*.

**Note:** ❌ **The most acute example of the whole problem.** This lesson trains staff to tell guests a story about the restaurant — and the *only* story available is invented. Worse, the roleplay AI is instructed to reward "authentic, specific storytelling" while the staff have never been given a real fact to be specific about, so the exercise rewards **confident fabrication**. The word *"island"* also hardcodes Curaçao into the guest's own dialogue. Maison Test's intake has the real answer sitting unused: *"We don't do à la carte — every table gets the same tasting menu on a given night, which lets the kitchen commit fully to seasonal, local sourcing… Guests remember the story behind the food, not just the plate."*
**Intake mapping:** all three story types ← `brand_description` (Origin), `property_menu_items.description` (Process), `brand_differentiator` (Guest/differentiator). This lesson becomes genuinely excellent the moment real intake data flows into it.

---

#### 4.22 `handling-complaints` — "Handling Difficult Conversations" · 8 min · 50 XP · scenario `overcooked-complaint`
`curriculum.ts:920–956`

**Objective:** The 4-step protocol that turns a broken moment into a defining one.

**Theory:** `intro` · `steps` **The 4-step complaint protocol** — 1 Listen without interrupting (`Always first`) / 2 Acknowledge genuinely — *"Not 'I'm sorry you feel that way.' Not 'I understand but…' The but cancels everything before it."* (`No buts`) / 3 Resolve with a concrete offer (`Act now`) / 4 Follow up (`Close the loop`) · `callout` (warn) "Prohibited in complaint handling" — 5 banned phrases · `do-dont` × 3 with full verbatim recovery scripts · `tip-list` "What guests actually want" × 4.

**Quiz:** 5 questions.

**Roleplay `overcooked-complaint`** — Dutch professional, 45s, warmth **starts at 4**, scores ownership/resolution_speed/professionalism.

**Note:** ✅ **Universal** — this content is genuinely excellent and travels to any venue anywhere. ⚠️ **But it is a near-duplicate of the entire `complaints` module** (§4.23–4.26), which teaches the same thing as a 5-step "LEARN" model with the same banned phrases and the same recovery scripts, and shares the `overcooked-complaint` / `overcooked-burger` scenario pair. Every track receives **both**. The only property-specific element is the escalation boundary — *when* a server may act alone vs. fetch a manager — which the lesson never states but the intake captures precisely (Maison Test: *"A server can comp a course or offer a replacement dish on their own judgment. Anything involving the full bill, a walkout, or a guest who is visibly upset must go to the manager on duty immediately."*).
**Intake mapping:** add an escalation `callout` ← `escalation_protocol`.

---

### MODULE `complaints` — "Handling Difficult Situations"
`curriculum.ts:960–1099` · 4 lessons · 200 XP

> **Per-track fit:** ✅ all three tracks. This is the most universal module in the product.

---

#### 4.23 `mindset-shift` — "The Mindset Shift" · 7 min · 50 XP · scenario `silent-table`
`curriculum.ts:962–992`

**Objective:** Why complaints are the best thing that can happen to you.

**Theory:** `intro` — *"**96%** of dissatisfied guests leave without saying a word."* · `callout` (rule) **"The Service Recovery Paradox"** · `principles` × 4 — 96% never say a word / **70% will return if resolved (95% if resolved quickly)** / Speed is everything / A complaint is a second chance · `do-dont` "The mindset shift" × 3 · `callout` (tip).

**Quiz:** 5 questions — one is a **direct statistic recall** ("What percentage… never complain?" → 96%).

**Note:** ✅ **Fully universal.** ⚠️ One editorial flag unrelated to customization: the **96% / 70% / 95% statistics are unsourced** and are quizzed as fact. They're widely circulated industry figures (TARP/Lee Resources lineage) but no citation exists in the content. Worth deciding whether to source them or soften them before a client's L&D lead asks.

---

#### 4.24 `learn-protocol` — "The LEARN Protocol" · 8 min · 50 XP · scenario `wrong-order-allergy`
`curriculum.ts:994–1024`

**Objective:** The 5-step framework **"used by Marriott, Hilton and IHG worldwide"**.

**Theory:** `intro` · `steps` **The LEARN Model** — **L**isten (`Full attention`) / **E**mpathize (`Feelings first`) / **A**pologize (`No excuses`) / **R**esolve — *"Don't say 'let me see what I can do.' Say 'Here's what I'm going to do right now.'"* (`Act now`) / **N**otify (`Close the loop`) · `callout` (warn) "The Most Common Failure" · `do-dont` × 3.

**Quiz:** 5 questions, incl. one on empathy vs. sympathy and one on **when to escalate to a manager**.

**Roleplay `wrong-order-allergy`** (`scenarios.ts:986–1036`) — American guest, ordered fish, received chicken, **has a shellfish allergy**; warmth starts 4.

**Note:** ✅ **Universal.** ⚠️ Two flags: (1) the lesson description makes a **third-party brand claim — "used by Marriott, Hilton and IHG worldwide"** — displayed to every trainee, unsourced; that's a legal/editorial call worth making deliberately. (2) It **overlaps `language/handling-complaints` almost completely** (4-step vs. 5-step versions of the same protocol, both taught in the same phase). Consolidating these two would remove ~2 lessons of redundancy from every track.

---

#### 4.25 `common-situations` — "The Most Common Situations" · 7 min · 50 XP · scenario `billing-dispute`
`curriculum.ts:1026–1064`

**Objective:** Exact scripts for the situations that happen every service.

**Theory:** Five `do-dont` blocks, each a full verbatim recovery script:
1. **Overcooked/Undercooked** — ✅ *"You're absolutely right and I'm sorry — that's not what you ordered. Let me get that replaced right away. Can I bring you something to enjoy while you wait? **I'll be back in 8 minutes.**"*
2. **Long Wait** — ✅ *"…I'll be back in two minutes with an update. **Can I bring you some bread while you wait?**"*
3. **Wrong Order** — ✅ *"I'm so sorry — let me fix this for you immediately."*
4. **Billing Dispute** — ✅ *"Let me take a look at this right away."*
5. **Quality Complaint** — ✅ *"Thank you for telling me — I'll take this back right away."*

· `tip-list` "The universal rules across all situations" × 4 — incl. *"Offer something during the wait: **bread, a drink, an amuse**."*

**Quiz:** 5 questions.

**Note:** ✅ **Near-universal and very strong** — these are the five things that actually happen. ⚠️ Two small property assumptions embedded in the scripts: the **comp/gesture** offered (*bread*, *a drink*, *an amuse* — a fine-dining amuse vs. a fast-casual free drink vs. nothing at all is a house policy, and whether a server may offer it unilaterally is exactly what `escalation_protocol` governs), and the **"8 minutes" / "two minutes"** timings.
**Intake mapping:** gesture + authority ← `escalation_protocol`; timings ← `pacing_rules`.

---

#### 4.26 `prevention` — "Prevention Over Recovery" · 7 min · 50 XP · scenario `read-the-room`
`curriculum.ts:1066–1099`

**Objective:** The best complaint is the one that never happens.

**Theory:** `intro` · `callout` (rule) "The Prevention Mindset" — *"A proactive check-in 2-3 minutes after food arrives prevents **90%** of complaints from escalating."* · `tip-list` "Warning signs" × 7 (looking around / food barely touched / whispering / checking the time / pushing food around / tense body language / **order taking more than 20 minutes**) · `principles` × 3 — The proactive check-in / The communication chain / **Catch it before it leaves the kitchen**.

**Quiz:** 5 questions.

**Note:** ✅ **Universal.** The "90%" figure is another unsourced statistic quizzed as fact. The "20 minutes" ticket threshold is a house-specific number (at a tasting-menu restaurant with 12–15 minutes between courses by design, "20 minutes" is not a warning sign at all — it's the intended pacing).
**Intake mapping:** ticket-time threshold ← `pacing_rules`.

---

### MODULE `guest-psychology` — "Guest Psychology"
`curriculum.ts:1103–1258` · 5 lessons · 250 XP

> **Per-track fit:** all three tracks ⚠️ — one lesson is entirely Curaçao-specific.

---

#### 4.27 `guest-types` — "Types of Guests" · 8 min · 50 XP · scenario `seven-tables`
`curriculum.ts:1105–1132`

**Objective:** Every table is different. Read who you are serving before you open your mouth.

**Theory:** `intro` · `callout` (rule) The Standard — **⚠️ text is byte-identical to `greetings/reading-table`'s Standard callout** · `culture-cards` × 7 guest types, each with a "Golden move": 💑 Romantic Couple / 👥 Friend Group (4+) / 💼 Business Table / 🧳 Solo Traveler / 🌍 Tourist First-Timer (*"tell them one thing about this place they won't find on **TripAdvisor**"*) / 🏠 Local Regular / 👨‍👩‍👧 Family with Kids (*"Never seat them next to a romantic couple"*).

**Quiz:** 5 questions.

**Note:** ⚠️ **Universal in substance, but ~70% duplicated with `reading-table` (§4.10)** — same framing, same Standard callout verbatim, four of the same table types with rewritten cues. Both are delivered to every track in the same phase. The 7 profiles are also a *guess* at the venue's guest mix — the same gap `our-guests` has (§4.4), and the two lessons don't agree with each other. **Consolidation opportunity before customization**: one guest-profile lesson, driven by intake, would replace two.
**Intake mapping:** ← `tourist_percentage`, `top_nationalities`, `age_range`, `avg_party_size`.

---

#### 4.28 `cultural-awareness` — "Cultural Awareness" · 9 min · 50 XP · scenario `dutch-businessman`
`curriculum.ts:1134–1160`

**Objective (verbatim `desc`):** ***"Curaçao welcomes the world. Know how to welcome each culture back."***

**Theory:** `intro` — *"On any given night **in Curaçao** you might serve Dutch tourists, Venezuelan families, American travelers, Canadian couples, German visitors, and **local Curaçaoans**… This is not a stereotype guide. It's a pattern recognition guide."* · `callout` (rule) "The Universal Rule" — *"Adjust your approach, never your standards."* · `culture-cards` × 6 — 🇳🇱 Dutch / 🇻🇪 Venezuelan-Latin American / 🇺🇸 American (*"Americans tip based on emotional connection"*) / 🇨🇦 Canadian / 🇩🇪 German / 🇨🇼 **Local Curaçaoan** (*"use **Papiamentu** if you know it… word-of-mouth **on the island** travels fast"*).

**Quiz:** 5 questions — the last one's correct answer is ***"Even a simple 'Bon biní' in Papiamentu signals recognition and belonging."***

**Note:** ❌ **Fully Curaçao-locked, including the lesson's own title text.** Even the `desc` field a trainee sees on the module card says "Curaçao". The *framework* — read national/cultural service expectations, adapt style not standard — is genuinely universal and well-written (the "not a stereotype guide" framing is a nice touch the `nonverbal-signals` cards lack). The six specific cards and the Papiamentu quiz answer are not. This is the **cleanest structural template in the whole product**: 1 intro + 1 rule callout + N nationality cards + 5 quiz questions, where N and the card contents are pure data.
**Intake mapping:** ← `top_nationalities` + `primary_languages` + `tourist_percentage`. A property with 0% tourists should arguably not get this lesson at all.

---

#### 4.29 `vip-guests` — "VIP & Returning Guests" · 7 min · 50 XP · scenario `welcome-back`
`curriculum.ts:1162–1193`

**Objective:** The guest who comes back is worth ten new ones.

**Theory:** `intro` — *"A returning guest costs **5-7x less** to retain than to acquire a new one."* · `principles` × 5 — Being remembered / anticipated / acknowledged / **upgraded** (*"a better table, a small complimentary gesture, a welcome bite"*) / told something exclusive · `callout` (tip) **"The Mental Database"** — *"'The couple who always orders the fish.' 'The man who takes his coffee black and reads.'"* · `tip-list` "The departure ritual" × 4.

**Quiz:** 5 questions — incl. **"How many times during a meal should you use a guest's name?" → "Approximately three times: arrival, once mid-meal, and at departure."** (a very specific, unsourced house rule)

**Note:** ✅ **Universal in principle.** ⚠️ The "upgrade" principle is **house policy dressed as technique** — whether a server may comp a welcome bite or move a table is exactly `escalation_protocol` territory, and at a fixed tasting-menu restaurant "a better table / a welcome bite" may not exist as options. The "three times" name rule is arbitrary and quizzed as doctrine. At 65% tourists (Maison Test) the *entire premise* of this lesson is weaker than at a neighbourhood regulars' room, which is precisely what `tourist_percentage` tells you.
**Intake mapping:** upgrade gestures ← `escalation_protocol`; lesson emphasis/inclusion ← `tourist_percentage`.

---

#### 4.30 `buying-signals` — "Reading Buying Signals" · 8 min · 50 XP · scenario `undecided-guest`
`curriculum.ts:1195–1228`

**Objective:** Great upselling feels like a recommendation. Bad upselling feels like pressure.

**Theory:** `intro` · `callout` (rule) "The Upselling Mindset" · `culture-cards` × 2 — ✅ Open to suggestions / ❌ Not open · `steps` "Natural upselling moments" × 4, **all four written with explicit bracket placeholders**:
1. On arrival — *"Can I start you with sparkling or still water? We also have **[signature drink]**…"* (`Always`)
2. During ordering — *"The **[dish]** pairs really beautifully with **[wine/side]**…"* (`When relevant`)
3. After mains — *"The **[signature dessert]** is made fresh daily…"* (`Proactive`)
4. With the bill — *"We have **[option]** which is a local favorite."* (`Optional`)

· `do-dont` — formula = **Recommendation + reason + social proof**.

**Quiz:** 5 questions.

**Note:** ⚠️ **This lesson is the strongest existing evidence for the whole templating thesis** — the author wrote **four literal `[placeholder]` slots** in the shipped copy because there was no mechanism to fill them. **Trainees currently read the word `[signature drink]` on screen**, because `substitutePropertyDeep` only recognises `[Property]`/`[PROPERTY]`. That's a live content bug *and* a ready-made spec for what the pipeline should fill. Separately, the *policy* is property-specific: Maison Test's `upsell_approach` is *"Wine pairing is offered once, clearly, right after the menu is explained — never pushed a second time if declined… **never upsell dessert or extra courses once the tasting menu has started**"* — which makes steps 3 and 4 of this lesson actively wrong there.
**Intake mapping:** the four bracket slots ← `property_menu_items`; the whole `steps` block's shape ← `upsell_approach`.

---

#### 4.31 `emotional-journey` — "The Emotional Journey of a Guest" · 8 min · 50 XP · scenario `full-journey`
`curriculum.ts:1230–1258`

**Objective:** Guests remember how you made them feel, not what they ate.

**Theory:** `intro` · `steps` **The 7 Emotional Stages** — 1 Anticipation (`Expectation set`) / 2 Arrival, first 5 seconds (`Most powerful`) / 3 Settling In, first 3 minutes (`Give space`) / 4 Ordering (`Trust moment`) / 5 The Experience (`Invisible presence`) / 6 The Close (`Recency bias`) / 7 The Memory (`What gets told`) · `callout` (rule) "The Emotional Arc".

**Quiz:** 5 questions, incl. one that names **recency bias** as a term.

**Note:** ✅ **Fully universal.** Zero property-specific content, zero menu references, zero locale. Along with `mindset-shift` and `welcome-to-hostia`, one of the cleanest "leave it alone" lessons in the product. Excellent content.

---

## 5 · Casual-dining-only modules

Assigned only to `casual-dining-phase-1`. Live: De Gouverneur.

> **Structural note applying to all 8 lessons below:** these two modules use **only two section types — `intro` and `tip-list`.** No `callout`, no `steps`, no `do-dont`, no `principles`. Every other module in the product uses 5–8 types. The result is visually flat, prose-heavy pages with none of the rule callouts or script tables that carry the rest of the curriculum, and **none of the verbatim "say this" scripts** that make the universal modules useful. They read like they came from a different authoring batch. This is worth fixing independently of customization — and it also means **these are the two modules with the least structure for a pipeline to target.**

---

#### 5.1 `showing-up-right` — "Showing Up Right" · 7 min · 20 XP · scenario `casual-dining-arrival`
`curriculum.ts:1269–1301`

**Objective:** Professional appearance and attitude before you hit the floor.

**Theory:** `intro` (*"In casual dining the pace is fast and the room is open, so there's nowhere to hide a wrinkled shirt"*) · `tip-list` "The pre-shift checklist" × 6 — clean pressed uniform / **name badge visible** / hair tied back / hands washed, nails short / phone away and on silent / posture ready · `intro` (the attitude shift, the door ritual) · `tip-list` "Body language guests read without you knowing" × 4 — slouching / crossed arms / avoiding eye contact / rushing past tables.

**Quiz:** 5 questions.

**Note:** ⚠️ **The checklist is house policy, not universal.** Name badges, hair rules, and nail policy vary; "clean pressed uniform" assumes a uniform exists. Compare Maison Test's real standard (all black tailored, no visible logos, no visible tattoos on hands/forearms, **no cologne**, polished black shoes) — vastly more specific and more useful. This lesson **duplicates `our-standards` (§4.3) and `fds-uniform-grooming` (§6.3)** substantially. The attitude/body-language halves are universal.
**Intake mapping:** ← `uniform_grooming_standards` (direct, high-confidence mapping).

---

#### 5.2 `working-as-a-team` — "Working as a Team" · 8 min · 25 XP · scenario `casual-dining-teamwork`
`curriculum.ts:1303–1329`

**Objective:** Cover, communicate, and never leave a teammate stranded.

**Theory:** `intro` (*"the tips the entire team shares"*) · `tip-list` **"The 5 unwritten rules of floor teamwork"** — If you see it, own it / **Never say "that's not my table"** / Communicate before you disappear / Check on your colleagues / End of shift = help close together · `intro` (kitchen communication: *"'ordering,' 'fire table 12,' 'how long on the fish?'"*; *"'Table 6 has been waiting 20 minutes, can we prioritize?' beats 'What's taking so long?!'"*) · `intro` (a Saturday-lunch worked example: catch their eye, ask *"what do you need?"*, take one concrete thing).

**Quiz:** 5 questions.

**Note:** ✅ **Genuinely universal and genuinely good** — the "step in without stepping on toes" worked example is one of the better pieces of writing in the curriculum. ⚠️ Two property assumptions: **pooled/shared tips** (*"shrinks the tips the entire team shares"*) is a specific comp model, and **section ownership** — Maison Test's `table_service_model` is *"Sections — one server owns their tables"*, but other houses run team service where this framing doesn't apply.
**Intake mapping:** ← `table_service_model`; tip model would need a new intake field.

---

#### 5.3 `food-safety-floor` — "Food Safety on the Floor" · 8 min · 25 XP · scenario `casual-dining-allergy`
`curriculum.ts:1331–1366`

**Objective:** Allergens, cross-contamination, and when to flag a concern.

**Theory:** `intro` (*"you're the last line of defense"*) · `tip-list` **"The 8 most common allergens"** — Milk, Eggs, Fish, Shellfish, Tree nuts, Peanuts, Wheat/gluten, Soybeans, each with where it hides · `intro` (the 4-step allergy protocol: confirm severity → flag ticket clearly **and say it out loud** → never assume → reconfirm at delivery) · `tip-list` "Red flags to always report" × 5.

**Quiz:** 5 questions.

**Note:** ✅ **Universal in substance and important.** ⚠️ **But the allergen list is jurisdiction-specific**: this is the **US FDA "Big 8"**. The EU/UK regulate **14** declarable allergens (adding celery, mustard, sesame, sulphites, lupin, molluscs — and separating crustaceans from molluscs). For any European client this list is **legally incomplete**, which is a different and more serious class of problem than tonal mismatch. Note also this is the only place in the curriculum that lists allergens — and `property_menu_items.allergens` is now a live structured field, so per-dish allergen quizzing is available. **Flag for a compliance decision, not just a content decision.**
**Intake mapping:** allergen list ← jurisdiction (not currently captured — worth adding to intake); per-dish examples ← `property_menu_items.allergens`.

---

#### 5.4 `speed-without-rushing` — "Speed Without Rushing" · 9 min · 50 XP · scenario `casual-dining-pace`
`curriculum.ts:1368–1400`

**Objective:** Stay efficient and organized without making guests feel hurried.

**Theory:** `intro` (*"a calm swan on the surface, paddling furiously underneath"*) · `tip-list` **"The priority ladder during a rush"** — 1 Ready hot food / 2 Drink refills / 3 Check-ins for waiting tables / 4 Clearing finished plates / 5 Everything else · `intro` (attention as a speed multiplier) · `tip-list` "5 habits of efficient servers" — pre-bussing / carry more per trip / anticipate refills / know the sequence / **never walk the floor empty-handed**.

**Quiz:** 5 questions.

**Note:** ✅ **Universal.** The priority ladder is the single most transferable artifact in these two modules and is reused directly as an exam sequence round. ⚠️ Overlaps `floor-efficiency` (§5.8) heavily — "never walk empty-handed", pre-bussing, and anticipating refills appear in both, in the same phase.

---

#### 5.5 `taking-orders` — "Taking Orders Correctly" · 8 min · 50 XP · scenario `casual-dining-order`
`curriculum.ts:1405–1440`

**Objective:** Full attention, clean modifications, and a confident read-back.

**Theory:** `intro` · `tip-list` "Taking the order with full attention" × 6 · `intro` (modifications and allergies — *"Got it, the **chicken bowl** with the dressing on the side and **greens instead of rice**"*) · `tip-list` "Common order-taking mistakes to avoid" × 6 · `intro` (worked example: a four-top with **a burger medium with no pickle**, a **salad with grilled chicken**, a **gluten allergy needing a bun swap**, and one straight order).

**Quiz:** 5 questions.

**Roleplay `casual-dining-order`** (`scenarios.ts:1602–1640`) — *"The **grilled chicken bowl**, does that come with the **spicy dressing**? … can I swap the **rice for extra greens**?"*

**Note:** ⚠️ **Technique universal; every example is from a specific fast-casual bowl-and-burger menu.** Chicken bowls, rice-vs-greens swaps, and bun substitutions describe a very particular kind of restaurant — and this module is **casual-dining-only**, so the examples don't even match their own track's positioning. At a fixed tasting-menu restaurant the entire concept of "modifications" barely applies. **High-value, low-risk substitution target**: the container (attention → capture → read back) is universal, only the dishes change.
**Intake mapping:** ← `property_menu_items` + `service_style`/`table_service_model` (a no-modifications tasting menu changes the lesson's premise, not just its examples).

---

#### 5.6 `managing-sections` — "Managing Multiple Tables" · 9 min · 50 XP · scenario `casual-dining-multitable`
`curriculum.ts:1442–1475`

**Objective:** Always know the status of every table at once.

**Theory:** `intro` (section awareness as a mental map) · `tip-list` **"The five states every table is always in"** — Just seated / Ordered / **Waiting on food (the danger zone)** / Eating / Ready for the bill · `intro` (triage by impact, not by volume) · `tip-list` "Prioritization under pressure" × 5 · `intro` (managing a stretched section: honest expectations, *"I'm firing your order now — about ten minutes"*).

**Quiz:** 5 questions.

**Note:** ✅ **Universal for any table-service venue.** The five-state model is clean and transferable. ⚠️ Assumes **section ownership** (`table_service_model`) and the ten-minute expectation is a house number. Doesn't apply at counter service.

---

#### 5.7 `table-turns` — "Table Turns & Pacing" · 8 min · 50 XP · scenario `casual-dining-turn`
`curriculum.ts:1477–1510`

**Objective:** Move tables through efficiently without ever rushing a guest.

**Theory:** `intro` (turning ≠ rushing) · `tip-list` "Reading the natural pacing signals" × 5 — plates pushed to the edge / conversation winding down / **cutlery laid together** / cards or wallet appearing / settling back in · `intro` (pacing as the engine of a clean turn) · `tip-list` "Turning a table without rushing the guest" × 6 — incl. *"Present the bill warmly and with no pressure: **'whenever you're ready, no rush at all.'**"* and *"Never hover, sigh, or stack chairs nearby."*

**Quiz:** 5 questions.

**Note:** ⚠️ **Directly property-specific and, for some clients, directly contrary to policy.** Table-turn economics are a business model, not a universal craft. Maison Test's rules are explicit and opposite: *"Bill is never dropped unprompted; only presented when a guest asks for it."* — this lesson teaches, and the casual/fast-casual exams **score 2 points for**, dropping the bill on the wallet signal. Turn philosophy is one of the clearest cases where a wrong default actively contradicts a real client's standards.
**Intake mapping:** ← `pacing_rules` (this lesson should be substantially rewritten or dropped for properties whose pacing rules forbid the behaviour it teaches).

---

#### 5.8 `floor-efficiency` — "Efficiency & Attention to Detail" · 9 min · 50 XP · scenario `casual-dining-efficiency`
`curriculum.ts:1512–1546`

**Objective:** Catch the small things before guests ever have to ask.

**Theory:** `intro` (proactive vs reactive) · `tip-list` "Proactive vs reactive — the shift" × 5 · `intro` (**the scan** — a full section sweep every pass; **the one-trip rule**) · `tip-list` "6 efficiency habits" × 6 · `intro` (**the observant regular** as the ultimate test).

**Quiz:** 5 questions.

**Note:** ✅ **Universal.** ⚠️ **Heavily duplicated** — it repeats `speed-without-rushing` (§5.4, same module family), `service-flow/proactive-reactive` (§4.17, same phase, same proactive/reactive framing), and `fdp-invisible` (§6.8, the fine-dining version of the same idea). A casual-dining trainee learns "never walk empty-handed" and "anticipate the refill" in at least three separate lessons in Phase 1.

---

## 6 · Fine-dining-only modules

Assigned only to `fine-dining-phase-1`. Live: Bistro 91, Maison Test.

> **General verdict on these five modules: they are the best-written content in the product** — consistent voice, rich section vocabulary, concrete standards, well-matched roleplays. They are also, by a wide margin, **the most universal**, because fine-dining craft is genuinely codified across the industry. Most need only light parameterization.
>
> **Scenario-level note:** all 20 fine-dining scenarios differ structurally from the other 42 — `timerSeconds` 240–300 (vs 45–60), **4** `scoreKeys` (vs 3), and **plain-text tags** (`['menu-knowledge', 'describing', 'confidence', …]`) where every other scenario uses emoji tags (`['🇳🇱 Dutch', '💼 Professional', …]`). See §7.5.

---

### MODULE `fine-dining-standard` — "The Fine Dining Standard" (`curriculum.ts:1551–1712`, 4 lessons, 200 XP)

#### 6.1 `fds-what-it-means` — "What Fine Dining Actually Means" · 8 min · scenario `fine-dining-mindset`
**Theory:** `intro` · `callout` (rule) — *"every action you take either elevates or diminishes the guest experience. **There is no neutral.**"* · `steps` **The four principles** — 1 Hospitality over service / 2 Details are not small / 3 **Calm is a skill** (*"Calm is not something you feel; it is something you perform until it becomes natural"*) / 4 Pride in craft · `do-dont` × 4 · `tip-list` "Five fine dining mindset habits" × 5.
**Quiz:** 5 questions. **Note:** ✅ **Universal within the segment.** Zero menu, zero locale, zero house policy. Leave alone. Only optional tailoring: the tone could be shaded by `brand_tone_notes` (Maison Test: *"Warm but precise. Never stiff or over-rehearsed"* — which this lesson already matches almost exactly).

#### 6.2 `fds-your-presence` — "Your Presence on the Floor" · 7 min · scenario `fine-dining-presence`
**Theory:** `intro` (*"you are always on stage"*) · `callout` (rule) · `steps` **The five elements** — Posture / **Pace** (*"If you need to move fast, do it through the kitchen"*) / Expression / Voice (*"The table next to the one you are serving should not hear your conversation"*) / **Hands** (out of pockets at all times) · `do-dont` × 4 · `tip-list` × 5 (incl. *"After a tough table: give yourself 20 seconds in the kitchen"*).
**Quiz:** 5. **Note:** ✅ **Universal.** Excellent, specific, actionable. Leave alone.

#### 6.3 `fds-uniform-grooming` — "Uniform & Grooming Standards" · 6 min · scenario `fine-dining-presentation`
**Theory:** `intro` · `callout` (rule) · `steps` × 4 — Uniform (pressed, stain-free, fitted) / Hair / Hands and nails (*"no strong nail polish"*) / **Scent** (*"No strong perfume, cologne, or deodorant… strong scent interferes with the aroma of food and wine"*) · `do-dont` × 4 · `tip-list` "Pre-shift checklist" × 8.
**Quiz:** 5. **Note:** ⚠️ **The one fine-dining lesson that is squarely property-specific.** Every item is a house rule. Maison Test's actual standard is more specific and more distinctive (*no visible tattoos on hands or forearms; sleeves down if needed; polished black shoes, no sneakers; all black, no visible logos*) — and its no-cologne rule has an even better stated reason than the generic one (*"out of respect for the tasting menu's aromatics"*). This lesson also **triplicates** `our-standards` (§4.3) and `showing-up-right` (§5.1).
**Intake mapping:** ← `uniform_grooming_standards` (direct 1:1 — the cleanest single mapping in the audit).

#### 6.4 `fds-team-conduct` — "Professional Conduct & Teamwork" · 7 min · scenario `fine-dining-teamwork`
**Theory:** `intro` (*"Guests cannot see what happens between staff. But they feel it."*) · `callout` (rule) · `steps` × 4 — Cover without being asked / Communicate quietly and precisely / **Handle mistakes with solutions, not excuses** (*"the only relevant question is what we do right now"*) / **Respect the kitchen relationship** (*"never blame the kitchen in front of a guest. Ever."*) · `do-dont` × 4 · `tip-list` "Five professional conduct rules — no exceptions" × 5.
**Quiz:** 5. **Note:** ✅ **Universal.** Overlaps `casual-dining/working-as-a-team` (§5.2) in substance but at a different register; both are good and neither track gets both.

---

### MODULE `fine-dining-presence-module` — "Professional Appearance & Presence" (`curriculum.ts:1716–1870`, 4 lessons, 200 XP)

#### 6.5 `fdp-body-language` — "Body Language That Communicates Care" · 7 min · scenario `fine-dining-body-language`
**Theory:** `callout` (rule) first (unusual ordering) · `intro` · `steps` **The five signals** — Your approach (*"on a slight angle rather than head-on"*) / Your posture / Your pace / Your hands / **Acknowledging across the room** (*"a small, warm nod — a silent 'I see you, I am coming'"*) · `do-dont` × 4 (incl. *"Lower yourself slightly toward the table when speaking to seated guests"*) · `tip-list` × 5 (*"stillness is a form of listening"*).
**Quiz:** 5. **Note:** ✅ **Universal.** Leave alone.

#### 6.6 `fdp-voice` — "Voice, Tone & Vocabulary" · 8 min · scenario `fine-dining-voice`
**Theory:** `intro` (*"Casual phrasing — 'no problem,' 'you guys,' 'no worries' — instantly drops the room a level"*) · `principles` × 4 — Slow down / Control your volume / **Choose elevated words** / Warm, never casual · `do-dont` **"Upgrade your phrases"** — 6 verbatim swaps:

| ❌ Casual | ✅ Refined |
| --- | --- |
| *"No problem, I got you."* | ***"Of course — right away."*** |
| *"What about you guys?"* | *"And for yourself, sir?" / "And for you, madam?"* |
| *"No worries." / "It's all good."* | *"My pleasure." / "It would be my pleasure."* |
| *"You done with that?"* | *"May I clear this for you?"* |
| *"Yeah, sure, hang on."* | *"Certainly. Allow me a moment."* |
| *"You guys need anything else?"* | *"Is there anything else I may bring you?"* |

· `callout` (warn) **"The slang trap"** · `tip-list` × 5.
**Quiz:** 5. **Note:** ⚠️ **Universal within fine dining, but two flags.** (1) **It directly contradicts `language/banned-phrases` (§4.19)** — which teaches *"Absolutely — my pleasure"* as the correct reply to thanks, while this lesson's whole thesis is that *"Of course"* is the refined form. Both ship to fine-dining properties in the same phase. (2) **The `sir`/`madam` convention is a house register choice**, not a universal — many contemporary fine-dining rooms have deliberately moved to gender-neutral address, and this lesson makes gendered address the correct quiz answer.
**Intake mapping:** register and address convention ← `brand_tone_notes`.

#### 6.7 `fdp-approach` — "Approaching Tables & Reading Timing" · 8 min · scenario `fine-dining-approach`
**Theory:** `intro` (a table mid-story; *"arrives in the breath that follows"*) · `steps` × 5 — **The three-second read** (`Read first`) / The angle of approach / When to speak / **When to wait — or withdraw** (*"A held plate is always better than a broken moment"*) / Leaving gracefully · `callout` (rule) · `do-dont` × 4.
**Quiz:** 5. **Note:** ✅ **Universal.** One of the best-written lessons in the product. Leave alone.

#### 6.8 `fdp-invisible` — "The Art of Invisible Service" · 8 min · scenario `fine-dining-invisible`
**Theory:** `callout` (rule) · `intro` · `principles` × 4 — Clear in the gaps / **Refill before empty, without interrupting** / Move with purpose / **Anticipate, don't react** (*"A need a guest has to voice is a need you noticed too late"*) · `tip-list` × 5 (incl. *"Carry the next course's cutlery with you so the table is set before the plate lands"*) · `do-dont` × 4.
**Quiz:** 5. **Note:** ✅ **Universal.** ⚠️ It states *"clear from the right"* as fact, which matches `fde-service-direction` but sits alongside `physical-craft/plate-carrying`'s hedged *"(property standard)"*. Assumes multi-course service.

---

### MODULE `fine-dining-etiquette` — "Fine Dining Etiquette" (`curriculum.ts:1874–2031`, 4 lessons, 200 XP)

#### 6.9 `fde-napkin-service` — "Napkin Service & Placement" · 7 min · scenario `fine-dining-napkin`
**Theory:** `intro` · `callout` (rule) — *"You place the napkin for the guest… You never leave them to handle it themselves."* · `steps` **Napkin service, moment by moment** — On seating (`Seating`, step in from the right, open in one motion, lay across the lap) / When a guest steps away (`Stepping away`, refold or replace, lay to the left) / **If a napkin is dropped** (`Dropped`, never goes back — fresh one, no word) / At the end (`Departure`) · `do-dont` × 4 · `tip-list` × 5.
**Quiz:** 5. **Note:** ⚠️ **Universal *within* fine dining, but the specific ritual is a house convention** — lap-placement by the server is standard in some fine-dining traditions and considered intrusive in others (many rooms hand or leave the napkin). The *principles* (never leave the guest to deal with it, never return a dropped napkin) are universal. Worth a light per-house parameter.

#### 6.10 `fde-service-direction` — "Service Direction & Order of Precedence" · 8 min · scenario `fine-dining-service-direction`
**Theory:** `callout` (rule) — ***"Serve from the left. Clear from the right. Pour from the right."*** · `intro` (reading the host as the skill above the rules) · `principles` × 4 — **The order of serving** (*"Serve **ladies first, then gentlemen, then the host last**. If some guests are clearly older or more senior, honour them first within that order."*) / Serve from the left / Clear from the right / Pour from the right · `do-dont` × 4 · `callout` (warn) **"When the setting won't allow it"** (*"The rule — never cross the guest — matters more than the side."*) · `tip-list` × 5.
**Quiz:** 5 — incl. one whose correct answer is *"Ladies first, then gentlemen, then the host last."*
**Note:** ⚠️ **Mostly universal, one flag worth a deliberate decision.** Left-serve/right-clear/right-pour is genuine, and the "never cross the guest" override is a nicely reasoned escape hatch. **But gendered precedence is a live industry debate** — a growing number of fine-dining rooms have moved to guest-of-honour-first or clockwise-from-the-host precisely to avoid it, and this content makes gendered order the *scored correct answer* in both the lesson quiz **and** the fine-dining exam (sort-match card `sm-9` and final-challenge beat `fc-2`, which explicitly reasons *"ladies first — honouring the elder guest — then gentlemen, and the host last, even though the host is a lady"*). This is a **per-house convention that should be a parameter, not a constant** — and it's the one place in the audit where the default could actively embarrass a client.

#### 6.11 `fde-table-conduct` — "Conduct at the Table" · 8 min · scenario `fine-dining-conduct`
**Theory:** `intro` · `steps` × 4 — Never reach across a guest (`Space`) / **Never stack plates at the table** (`Clearing`) / Never scrape or sort in view (`Discretion`) / **Choose the polite phrase** (`Language`) · `callout` (warn) **"The phrase that gives you away"** — *"'Are you still working on that?' is the most common sign of casual-level service."* · `do-dont` "Handling a complaint with grace" × 4 · `callout` (rule).
**Quiz:** 5. **Note:** ✅ **Universal.** ⚠️ The complaint `do-dont` block duplicates the `complaints` module, which fine-dining properties also receive.

#### 6.12 `fde-formal-settings` — "Reading & Respecting Formal Settings" · 8 min · scenario `fine-dining-settings`
**Theory:** `callout` (rule) — *"A formal setting works both ways."* · `intro` · `steps` × 4 — **Cutlery is used outside-in** (`Cutlery`) / Forks left, knives and spoons right, blades inward, dessert cutlery above, bread plate upper left, glasses upper right (`Layout`) / Change cutlery between courses (`Between courses`) / **Hold glassware by the stem** (`Glassware`) · `principles` × 3 — **The "still eating" signal** (cutlery apart, upside-down V) / **The "finished" signal** (side by side, ~4 o'clock) / **Read before you ask** · `do-dont` × 4 · `tip-list` × 5.
**Quiz:** 5. **Note:** ✅ **Fully universal** — this is codified Western fine-dining convention, identical in every such room. Leave alone. (Minor: the four-o'clock finished signal is the Continental convention; the American/"10-and-4" variant differs slightly, but the lesson's version is the dominant one.)

---

### MODULE `fine-dining-table-setup` — "Table Setup & Dining Room Standards" (`curriculum.ts:2035–2182`, 4 lessons, 200 XP)

#### 6.13 `fdt-mise-en-place` — "Mise en Place — The Foundation" · 8 min · scenario `fine-dining-mise-en-place`
**Theory:** `intro` · `callout` (rule) — *"the setup is not getting ready for the standard — **the setup is the standard**."* · `steps` **Setting a cover, piece by piece** × 7 — The clothed table (`Linen`) / The cover position, charger centred (`Anchor`) / Cutlery outside-in, **a thumb's width from the edge** (`Cutlery`) / Glassware upper right (`Glass`) / **The napkin — one house style** (`Napkin`) / Salt, pepper & the small things (`Condiments`) / **Candle & centrepiece — low enough to see across** (`Finish`) · `tip-list` × 5 (incl. *"sit or crouch in the guest's chair and look at it from their eye level"*).
**Quiz:** 5. **Note:** ✅ **Universal within fine dining**, with two explicit house-convention slots the author already flagged in prose: *"the **one house style**"* napkin fold and *"the **house plan**"* for condiments. These are naturally parameterizable.
**Intake mapping:** napkin fold + cover layout ← would need new intake fields (not currently captured; `property_documents` handbook uploads may contain them).

#### 6.14 `fdt-linen-glassware` — "Linen & Glassware Standards" · 8 min · scenario `fine-dining-linen`
**Theory:** `do-dont` first (unusual ordering) × 4 · `intro` (*"the two surfaces a guest's eye comes back to all evening"*) · `principles` × 4 — The cloth / The napkin / **Polishing glassware over steam** / Check it before it travels · `callout` (warn) **"When to re-lay"** — *"cover the mark with a clean napkin first so it leaves their sight at once, then change the cloth properly at the next natural break."* · `tip-list` × 5.
**Quiz:** 5. **Note:** ✅ **Fully universal.** Assumes clothed tables (some contemporary fine dining uses bare wood), but that's minor.

#### 6.15 `fdt-sideboard` — "The Sideboard & Service Station" · 7 min · scenario `fine-dining-sideboard`
**Theory:** `callout` (rule) · `intro` · `do-dont` "What belongs — and what never does" × 4 · `steps` "Keeping the station invisible" × 4 — Stock before service, never during (`Timing`) / Clear it all the time (`Clearing`) / **Place it and screen it** (`Placement`) / Reset between seatings (`Reset`) · `callout` (tip) **"The test"** — *"Look at your sideboard the way a guest at the nearest table would."*
**Quiz:** 5. **Note:** ✅ **Fully universal.** Assumes a sideboard exists.

#### 6.16 `fdt-room-flow` — "Dining Room Flow & Atmosphere" · 8 min · scenario `fine-dining-room-flow`
**Theory:** `intro` · `principles` × 4 — **Sound sits under the talk** (*"can a table talk easily without raising their voices?"*) / **Light softens as the evening does** / Temperature you watch, not set and forget / **Atmosphere is felt as one thing** · `callout` (warn) **"Mind the dead zones"** (the table by the kitchen door, the seat in the draught) · `steps` **"The fifteen-minute look around"** × 4 · `do-dont` × 4.
**Quiz:** 5. **Note:** ✅ **Fully universal** and unusually good — atmosphere management is rarely taught and this does it well. Zero property-specific content. Leave alone.

---

### MODULE `fine-dining-menu-knowledge` — "Menu Knowledge & Describing the Dish" (`curriculum.ts:2339–2489`, 4 lessons, 200 XP)

> **This module is the most important customization target on the fine-dining track**, and the most interesting finding in the audit: **it is deliberately written to avoid naming any dish**, because there was no per-property menu data. Two of its four roleplay prompts explicitly instruct the AI grader to ignore menu accuracy (§7.3).

#### 6.17 `fmk-know-your-menu` — "Knowing Your Menu" · 8 min · scenario `fine-dining-menu-explain`
**Theory:** `intro` (*"A guest can always tell the difference between a server who knows the food and one who learned a few lines by heart."*) · `callout` (rule) — *"For every dish on the menu, you know the key ingredients, the main cooking method, and how it tastes. That is the floor, not the ceiling."* · `steps` **The three things to know about every dish** — The key ingredients (`Ingredients`) / How it is cooked (`Method`) / How it tastes (`Flavour`) · `do-dont` "Knowledge vs memorized lines" × 4 · `tip-list` "Five ways to learn your menu" × 5.
**Quiz:** 5 — **all meta**, none about an actual dish.
**Note:** ⚠️ **A method lesson about a menu, containing no menu.** The framework is genuinely universal and well-built; it is also the emptiest lesson in the product relative to its potential. Maison Test's `primary_problem_to_solve` is *literally this lesson's job*: *"new hires take 6-8 weeks to confidently describe every dish and wine pairing from memory without checking notes at the table"*, with `success_definition`: *"Every server can run the full tasting menu narration solo within 2 weeks."* Today this lesson cannot help with that at all, because it never names a dish. With `property_menu_items` wired in, it becomes the single highest-ROI lesson for that client.
**Intake mapping:** ← `property_menu_items` (name, description, category, allergens, is_signature) — direct, structured, zero hallucination risk.

#### 6.18 `fmk-describing-dish` — "Describing a Dish with Confidence" · 8 min · scenario `fine-dining-recommend`
**Theory:** `callout` (rule) · `intro` · `principles` × 4 — **Lead with the best part** (*"The lamb is slow-cooked until it falls apart, with a rich, smoky sauce"* — a generic example, not a real dish) / Use simple, real words (*tender, crisp, fresh, rich, light, smoky*) / **Inform, don't oversell** / Keep it short · `do-dont` × 4 · `callout` (tip) **"The friend test"**.
**Quiz:** 5. **Note:** ⚠️ Same as above — excellent container, placeholder filling. Note it is **the fine-dining twin of `language/describe-serving` (§4.20)**, and the two teach *different formulas* for the same task (3-part Star/Method/Experience vs. lead-with-the-best-part). Fine-dining properties that keep the `language` module get both.
**Intake mapping:** ← `property_menu_items` + `brand_tone_notes`.

#### 6.19 `fmk-beverage-foundations` — "Beverage Foundations" · 8 min · scenario `fine-dining-pairing-basic`
**Theory:** `intro` (*"This lesson is the floor to stand on, not the whole building."*) · `principles` × 4 — Red, white, and sparkling / **Light vs full-bodied** / **What "dry" means** / **Non-alcoholic options matter** · `callout` (tip) **"The simplest pairing rule"** — *"white wine with fish and light dishes, red wine with red meat and rich dishes."* · `do-dont` × 4 · `tip-list` × 5.
**Quiz:** 5. **Note:** ✅ **Universal wine fundamentals**, correctly hedged and appropriately humble. ⚠️ **Zero connection to the property's actual list**, and no mechanism for one. Maison Test's success metric is *"Wine pairing uptake stays above 70%"* and its `upsell_approach` scripts the pairing offer verbatim (*"Would you like the pairing with that, or are you happy with the bottle?"*) — none of which this lesson knows. Also assumes an alcohol licence and a wine programme exist.
**Intake mapping:** pairing offer script ← `upsell_approach`; actual list ← not captured by the intake (**gap**: `property_menu_items` has no beverage/wine category convention documented).

#### 6.20 `fmk-answering-questions` — "Answering Guest Questions with Confidence" · 8 min · scenario `fine-dining-dietary`
**Theory:** `intro` · `steps` × 4 — *"What do you recommend?"* → give a real answer, name one or two dishes and say why (`Recommend`) / **Dietary questions** — never guess with an allergy (`Dietary`) / When you don't know — *"That's a good question — let me check on that for you"* (`Honesty`) / **Come back with the answer** (`Follow through`) · `callout` (rule) · `do-dont` × 4 · `tip-list` × 5 (incl. *"Have **two or three dishes ready to recommend**, with a reason for each."*).
**Quiz:** 5. **Note:** ⚠️ **Universal method, and it explicitly asks the trainee to prepare property-specific content the product never gives them.** *"Have two or three dishes ready to recommend, with a reason for each"* and *"Know your menu's vegetarian, vegan, and gluten-free options before service"* are homework assignments the platform could simply answer from `property_menu_items`. Cleanest example of the gap between what the content asks for and what the platform provides.

---

### PARKED: `fineDiningAnticipatoryLessons` (4 lessons, not in any module)
`curriculum.ts:2184–2336` — exported only so the linter doesn't flag deliberately-parked content as dead code. Reserved for a future Fine Dining Phase 2.

| Lesson | Scenario | One-line |
| --- | --- | --- |
| `fda-reading-table` "Reading the Table" | `fine-dining-reading` | The 15-second scan; read eyes/hands/mood; comfort → clarity → pace → close |
| `fda-pacing` "Pacing the Meal" | `fine-dining-pacing` | Watch plates not the clock; leave room to breathe; **you** control timing, not the kitchen |
| `fda-personal` "Personal Touches & Guest Memory" | `fine-dining-personal` | Use the name with care; remember who ordered what; treat an occasion as an occasion; **carry dietary notes every course** |
| `fda-recovery` "Proactive Recovery" | `fine-dining-recovery` | Catch the unhappy face; intercept at the pass; *"the best recovery is the one the guest never knows happened"* |

**Note:** ✅ All four are universal and well-written. `fda-pacing` is the one place in the entire product where **pacing is treated as a variable the server controls** — which is exactly what `property_intake.pacing_rules` describes, and it's parked. Worth knowing these exist: **4 fully-drafted lessons are sitting unshipped**, and their 4 scenarios *are* live in `SCENARIOS` (with `moduleId: 'fine-dining-anticipatory'`, a module that does not exist in `CURRICULUM`).

---

## 7 · Flags — things worth knowing before you build the pipeline

### 7.1 🔴 The multilingual content is locked at the type and component level, not just in copy

The single hardest customization blocker. Three layers must change together:

```ts
// curriculum.ts:33 — four fixed fields
export interface PhraseRow { en: string; nl: string; es: string; pap: string; }
```
```tsx
// LearnPhase.tsx:91  — hardcoded heading
<h3 …>The four languages of Curaçao</h3>
// LearnPhase.tsx:125 — hardcoded column headers
<div>English</div><div>Dutch</div><div>Spanish</div><div>Papiamentu</div>
```

**Recommended shape:** make `PhraseRow` a `{ lang: string; text: string }[]` (or `Record<langCode, string>`) and drive both the heading and the columns from the property's `primary_languages`. Until this changes, no AI pass can localise the `multilingual` lesson — it can only rewrite the strings inside four slots labelled Dutch/Spanish/Papiamentu.

Blast radius of the Curaçao assumption beyond this lesson: `cultural-awareness` (whole lesson, including its `desc`), 12 of 62 scenarios, and **2 of 3 exams** (casual sprint Q6 "How do you say Welcome in Papiamentu?"; fast-casual sprint Q3 "How do you say Thank you in Papiamentu?"). Note the **fine-dining exam has no Papiamentu question** — someone was already being careful there.

### 7.2 🔴 Unfilled `[placeholder]` tokens are shipping to trainees today

`guest-psychology/buying-signals` (`curriculum.ts:1213–1218`) renders literal bracket text on screen:

> *"We also have **[signature drink]** if you'd like something special to begin."*
> *"The **[dish]** pairs really beautifully with **[wine/side]**…"*
> *"The **[signature dessert]** is made fresh daily…"*
> *"We have **[option]** which is a local favorite."*

`substitutePropertyDeep` only recognises `[Property]`/`[PROPERTY]`, so these pass through untouched. Also in `language/banned-phrases`: *"What did you think of the **[dish]**?"*, and in `complaints/prevention`: *"Is the temperature right on the **[dish]**?"*

**This is simultaneously a live content bug and a free specification** — the author already told you exactly which slots need filling and what they should contain.

### 7.3 🟠 The roleplay AI is told to ignore menu accuracy — and gets a contradictory menu

Two fine-dining scenarios contain an explicit instruction to the grader:

> *"Since the trainee is describing a dish at a **fictional restaurant**, accept whatever specific dish and details they offer as plausible — judge HOW they describe (knowledge, appeal, honesty, natural delivery), **not the specific menu facts**."* — `fine-dining-menu-explain`, `scenarios.ts:2559`

> *"Since this is a **fictional restaurant**, accept whatever specific dishes the trainee names as plausible."* — `fine-dining-recommend`, `scenarios.ts:2596`

And `fine-dining-pairing-basic`: *"Accept whatever specific wine the trainee names as plausible for **a fictional list**."*

This is an honest workaround, but the effect is that **the menu-knowledge module cannot assess menu knowledge.** Meanwhile the two universal scenarios go the other way and hardcode a menu the property doesn't have:

- `describe-recommend` → `[PROPERTY] DISH CONTEXT — staff may describe these:` *the fish (locally caught, charred lime, herb butter)*, *the steak (hand-selected cut, open flame, aged in-house)*
- `storytelling-property` → `[PROPERTY] STORY CONTEXT — staff may use any of these authentically:` *the signature dish created on the first night*, *the beef hand-ground daily in-house*, *local supplier relationships*

Because `scenario_context` is **appended after** these blocks (`route.ts:138`), Bistro 91's roleplay system prompt currently contains *both* the hardcoded hand-ground-beef story **and** the real French-Peruvian ceviche/lomo saltado context. The model gets two menus and picks.

**Both `[PROPERTY] … CONTEXT` headers are already template slots in all but name.** Replacing their bodies from `property_menu_items` + `brand_description` is the highest-value single change in the whole scenario layer, and it also lets the "fictional restaurant" hedges be removed so the grader can finally assess accuracy — which is exactly Maison Test's stated problem.

### 7.4 🟠 Substantial duplication across modules, delivered to the same trainee in the same phase

| Topic | Taught in | Tracks affected |
| --- | --- | --- |
| Complaint protocol | `language/handling-complaints` (4-step) **and** `complaints/learn-protocol` (5-step LEARN) **and** `complaints/common-situations` **and** `fde-table-conduct` | all |
| Guest type profiles | `greetings/reading-table` **and** `guest-psychology/guest-types` (**identical "The Standard" callout, verbatim**) **and** `onboarding/our-guests` | all |
| Proactive vs reactive | `service-flow/proactive-reactive` **and** `casual-dining-floor/floor-efficiency` **and** `fdp-invisible` | all |
| Uniform & grooming | `onboarding/our-standards` **and** `casual-dining-standard/showing-up-right` **and** `fds-uniform-grooming` | all |
| Never walk empty-handed / pre-bus | `speed-without-rushing` **and** `floor-efficiency` **and** `floor-movement` | casual |
| Describing a dish | `language/describe-serving` (3-part formula) **and** `fmk-describing-dish` (lead-with-the-best-part) — **two different formulas** | fine dining |
| Cutlery "finished" signal | `table-turns` **and** `fde-formal-settings` **and** `fda-reading-table` | casual + fine |

**Recommendation:** de-duplicate *before* customizing. Every duplicated lesson is a lesson the AI pass has to tailor twice, and every contradiction between duplicates becomes two contradictory tailored versions.

### 7.5 🟠 Direct contradictions the trainee can actually hit

1. **Greeting speed:** `five-second` teaches and quizzes "5 seconds" as the house standard; Maison Test's intake says 30 seconds. *(policy vs. content)*
2. **"No problem" replacement:** `banned-phrases` → *"Absolutely — my pleasure"*; `fdp-voice` → *"Of course — my pleasure"*, and treats "Absolutely"-register as a level-drop. Both ship to fine dining.
3. **The bill:** casual + fast-casual exams score **2 points** for bringing the bill on the wallet signal; Maison Test's rule is *"Bill is never dropped unprompted."*
4. **Serve side:** `plate-carrying` hedges *"(property standard)"*; `fde-service-direction` and `fdp-invisible` state it absolutely.
5. **Table cover:** `physical-craft/table-setting` teaches one cover standard; `fdt-mise-en-place` teaches a different, fuller one. Fine-dining staff get both.
6. **Upselling dessert:** `buying-signals` step 3 makes proactive dessert offers `Proactive` standard; Maison Test forbids it on the tasting menu.

### 7.6 🟡 The `modules` DB table is dead and has drifted

No `from('modules')` call exists anywhere in `src/`. Its rows have diverged substantially from `CURRICULUM`:

| module_id | DB title | Code title | DB lessons/XP | Code lessons/XP |
| --- | --- | --- | --- | --- |
| `onboarding` | "Welcome to **[Restaurant Name]**" | "Welcome to **[Property]**" | 5 / 100 | 6 / 135 |
| `greetings` | Greetings & First Impressions | same | 4 / **80** | 4 / **200** |
| `language` | **"Communication & Language"** | **"Language & Storytelling"** | 4 / 80 | 4 / 200 |
| `guest-psychology` | **"Guest Psychology & Loyalty"** | **"Guest Psychology"** | 4 / 80 | 5 / 250 |

It also uses **emoji icons** (`👋`, `🧠`) where code uses lucide names (`Hand`, `Brain`), and its legacy `phase_id`/`order_in_phase` columns say *every* module is in `casual-dining-phase-1` — superseded by `module_phase_assignments`, as the code comments state. **Note the `[Restaurant Name]` placeholder** — evidence of an earlier, different placeholder convention. Decide whether to delete this table or make it authoritative before the pipeline picks a write target.

### 7.7 🟡 Smaller content bugs found while reading

- **`busy-saturday` scenario has an empty `goal: ''`** (`scenarios.ts:809`) — the only one of 62. Renders a blank goal in the Apply phase.
- **`welcome-to-hostia` has a 3-question quiz**; all other 58 lessons have 5. `PRACTICE_PASS_RATIO = 0.8` → `ceil(3 × 0.8) = 3`, so this lesson requires **3/3** to pass while every other requires 4/5.
- **`HOSTIA_WELCOME_VIDEO_URL = ''`** (`curriculum.ts:117`) — the intro video is still unproduced; the block is spread out of the array, so it degrades cleanly.
- **`greetings` module ships with mock progress hardcoded** — `progress: 0.5, completedLessons: 2` (`curriculum.ts:2515–2516`), and two of its lessons carry `status: 'completed'` / `'current'`. The API overwrites these per-staff, but they're stale mock data sitting in the content source of truth.
- **`fine-dining-anticipatory` scenarios reference a non-existent module** — 4 scenarios carry `moduleId: 'fine-dining-anticipatory'` while no such module exists in `CURRICULUM`.
- **`src/lib/config.ts` still hardcodes a specific venue**: `PROPERTY.location = 'Curaçao'`, `languages: ['english','spanish','dutch','papiamentu']`, `activeModules: [… 'floor' …]` (a module id that doesn't exist), plus a `goldStandard` and `goldenRule` quote. The file's own comment says display-name fallbacks were deliberately removed — but the locale and language list survived.
- **The roleplay model is `claude-sonnet-4-6`** (`route.ts:172`). Worth a deliberate decision on whether to move to the current Claude 5 family, especially if the pipeline starts feeding real menu data into grading.
- **Admin UI placeholders leak the origin venue**: `"a gourmet burger restaurant"`, `"Willemstad, Curaçao"`, `"smash burgers, loaded fries, local craft beers"`, `"This is Brgr Haus…"` (`admin/clients/[id]/page.tsx:307–315, 1675`).

### 7.8 🟡 Data-quality bugs in the live intake (input side of the pipeline)

From the one `status: 'reviewed'` row (Maison Test):

- **`peak_hours` = `"English, Papiamentu, Dutch"`** — the languages answer landed in the peak-hours field. A field-binding bug in `hostia-onboarding`.
- **`primary_languages` = `["English, Papiamentu, Dutch"]`** and **`top_nationalities` = `["Dutch, American, Venezuelan"]`** — declared as arrays but storing a single comma-joined string. Any pipeline that iterates these will see one element. **Fix the intake before building on these fields**, or normalise on read.
- **Only 2 `property_menu_items` rows** for a restaurant described as a 7-course tasting menu — the menu capture is either optional or incomplete in practice. The pipeline needs a completeness gate.
- `property_documents` holds 4 uploads (2 `logo`, 1 `handbook`, 1 `brand_guide`) — all PNG screenshots. **A handbook exists as an image, not extractable text.** If handbook content is meant to feed the standards lessons, an extraction step is needed.
- Two of four properties sit at `status: 'in_progress'` with empty arrays; one is `not_started`. Only Maison Test is `reviewed`.

---

## 8 · The customization surface: what exists, what's missing

### 8.1 What a property can vary today

| Surface | Storage | Reaches |
| --- | --- | --- |
| Property name | `properties.name` / `property_overrides.property_name` | **All content**, via `substitutePropertyDeep` |
| Logo | `properties.logo_url` | UI chrome |
| Brand colour | `properties.primary_color` | UI chrome |
| **Menu PDF** | `properties.menu_pdf_url` | **One lesson** (`our-menu-pdf`, via the `menu-pdf` section) |
| **Venue context free-text** | `property_overrides.scenario_context` | **Every roleplay system prompt** |
| Manager name | `property_overrides.manager_name` | Prompt assembly |
| Which modules appear + order | `property_modules` | Module grid |
| Early module unlocks | `property_overrides.unlocked_modules` | Locking logic |
| Track | `properties.venue_type` | Phase set + exam selection |

**Nothing varies lesson theory text, quiz questions, or exam content.** That is the entire gap.

### 8.2 Intake → lesson slot mapping (the pipeline's job, concretely)

`property_intake` columns and the lesson slots each one should fill:

| Intake field | Fills |
| --- | --- |
| `brand_description` | `our-story` intro; `storytelling-property` STORY CONTEXT (Origin) |
| `brand_differentiator` | `our-story` principles + rule callout; `storytelling` Guest/differentiator story |
| `brand_tone_notes` | `fdp-voice` register; `banned-phrases` register; `fmk-describing-dish` voice |
| `greeting_script` | `five-second` standard + scripts; `ten-steps` step 1 |
| `farewell_script` | `ten-steps` step 10; `vip-guests` departure ritual; exam final-challenge close beat |
| `uniform_grooming_standards` | `our-standards` do/dont; `showing-up-right` checklist; `fds-uniform-grooming` (1:1) |
| `upsell_approach` | `buying-signals` steps (all 4 slots + whether they apply); `fmk-beverage-foundations` pairing offer |
| `escalation_protocol` | `common-situations` gestures; `learn-protocol` escalation Q; `vip-guests` upgrades |
| `pacing_rules` | `ten-steps` timings; `table-turns` (whole lesson); `prevention` ticket threshold; `fda-pacing` |
| `tourist_percentage`, `top_nationalities`, `age_range`, `avg_party_size`, `price_positioning` | `our-guests` culture-cards; `guest-types` cards; `cultural-awareness` cards; scenario guest personas |
| `primary_languages` | `multilingual` lang-grid + phrase-table **(blocked on §7.1)**; `banned-phrases` second language; exam language questions |
| `service_style`, `table_service_model` | **Module selection** (which modules a property gets at all), not content |
| `roles_to_train` | `synchronized-service` roles; `working-as-a-team` |
| `hire_profile`, `shift_structure` | `your-first-shift` framing and register |
| `primary_problem_to_solve`, `success_definition`, `recurring_complaints` | Prioritisation signal — **which** lessons to tailor first for this client |
| `property_menu_items` | `our-menu-pdf` quiz; `describe-serving` (all examples); `storytelling`; `taking-orders`; `reading-table` signature line; `buying-signals` 4 slots; **all of `fine-dining-menu-knowledge`**; `describe-recommend` + `storytelling-property` DISH/STORY CONTEXT |

### 8.3 Intake fields with no lesson slot (captured but unusable)

`has_existing_handbook`, `peak_hours` (currently corrupt), `peak_days`, `reviewer_notes`, `service_style_other`.

### 8.4 Lesson content with no intake field (needed but not captured)

- **Arrival-early policy** (`our-standards` quizzes "10–15 minutes")
- **Allergen jurisdiction** (US Big-8 vs EU-14 — see §5.3; this is a compliance gap)
- **Tip model** (pooled vs individual — `working-as-a-team` assumes pooled)
- **Amenities** (kids' menu, highchairs, crayons, WiFi — `proactive-reactive` assumes all)
- **House napkin fold / cover layout** (`fdt-mise-en-place` says "the one house style")
- **Precedence convention** (gendered vs guest-of-honour vs clockwise — see §6.10)
- **Beverage/wine list** (`fmk-beverage-foundations` has nothing; `property_menu_items` has no documented beverage convention)
- **Serve-side convention** (`plate-carrying` explicitly defers to "property standard" with nowhere to read it from)

---

## 9 · Classification summary

Rough triage of all 59 live lessons. This is the input to the classification session, not the output of it.

**🔴 Needs real per-property content — the lesson's substance IS a claim about the venue (17)**

`our-story` · `our-standards` · `our-guests` · `our-menu-pdf`¹ · `multilingual`² · `reading-table`³ · `describe-serving` · `storytelling` · `cultural-awareness`² · `buying-signals` · `vip-guests`³ · `showing-up-right` · `taking-orders` · `table-turns` · `fds-uniform-grooming` · `fmk-know-your-menu` · `fmk-describing-dish`

¹ container already parameterized; only the quiz needs menu data · ² blocked on §7.1 type/component change · ³ substance universal, one embedded property fact

**🟡 Light parameter swap — a number, a dish name, a role list, a language (20)**

`your-first-shift` · `five-second` · `guide-dont-point` · `plate-carrying` · `synchronized-service` · `ten-steps` · `proactive-reactive` · `banned-phrases` · `handling-complaints` · `common-situations` · `prevention` · `working-as-a-team` · `managing-sections` · `food-safety-floor`⁴ · `fdp-voice`⁵ · `fde-service-direction`⁵ · `fde-napkin-service`⁵ · `fdt-mise-en-place`⁵ · `fmk-beverage-foundations` · `fmk-answering-questions`

⁴ also a compliance decision (allergen jurisdiction) · ⁵ also a house-convention decision

**🟢 Genuinely universal — leave alone (22 live, + 4 parked)**

`welcome-to-hostia` · `tray-carrying` · `floor-movement` · `table-setting`⁶ · `nonverbal-signals`⁷ · `mindset-shift` · `learn-protocol` · `guest-types`⁸ · `emotional-journey` · `speed-without-rushing` · `floor-efficiency` · `fds-what-it-means` · `fds-your-presence` · `fds-team-conduct` · `fdp-body-language` · `fdp-approach` · `fdp-invisible` · `fde-table-conduct` · `fde-formal-settings` · `fdt-linen-glassware` · `fdt-sideboard` · `fdt-room-flow` · (+ the 4 parked `fda-*` lessons)

⁶ universal *for table service*; wrong module assignment for fast-casual · ⁷ needs the "Asian Guests" card editorial review · ⁸ needs de-duplication against `reading-table` first

**Exams (3):** all three need the same treatment as the lessons — casual and fast-casual carry Papiamentu questions and named dishes (ribs, burgers, rum cake, smash burger, crispy chicken sandwich, skillet cookie); fine dining is the cleanest but carries the gendered-precedence answer in two rounds.

**Scenarios (62):** 12 are Curaçao-set; 2 carry hardcoded `[PROPERTY] DISH/STORY CONTEXT` blocks that should be intake-driven; 3 carry "fictional restaurant" hedges that should be removed once real menu data flows; the remaining ~45 are structurally universal and need only guest-persona nationality swaps from `top_nationalities`.

---

## 10 · Three observations for the classification session

1. **The container/slot model you described is not just viable — it's already half-built.** `[Property]` substitution, `[signature drink]` placeholders, `[PROPERTY] DISH CONTEXT` headers, `"(property standard)"` hedges, `"the one house style"` — five different authors' worth of evidence that the content was written *wanting* a fill-in mechanism. The pipeline's job is largely to formalise slots that already exist informally.

2. **Two things must be fixed before the AI pass, because no amount of good drafting works around them:** the `PhraseRow`/`SectionLangGrid` hardcoding (§7.1), and the duplication + contradictions (§7.4, §7.5). Tailoring duplicated, contradictory content produces tailored, duplicated, contradictory content.

3. **Start with `onboarding` and `fine-dining-menu-knowledge`.** Onboarding because it is 100% property-claims, is the first thing a hire reads, and maps almost 1:1 onto intake fields already collected. Menu-knowledge because it is a perfect empty container, `property_menu_items` is structured and hallucination-safe, and it is *literally the problem Maison Test wrote down on their intake form*: get a server to describe every dish from memory in 2 weeks instead of 6–8.
