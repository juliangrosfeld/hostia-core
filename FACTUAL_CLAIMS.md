# Hostia — Factual & Regulatory Claim Extraction

**Purpose:** every concrete assertion in lesson content that could be objectively right or wrong, pulled for external fact-checking. **No accuracy verification has been done here** — this is extraction only.

**Scope:** all lesson content in `src/lib/curriculum.ts` (15 modules, 59 live lessons — Learn sections *and* quiz text/explanations), across all three tracks. Phase-1 exam content (`src/lib/exam.ts`) is covered in §17.

**Excluded by design:** service style, tone, brand voice, greeting scripts, upselling language, "banned phrases," and judgment calls about how to treat a guest.

## How track labels work

7 of the 15 modules are **shared verbatim by all three tracks**, so they're listed once with an `ALL TRACKS` label rather than repeated three times. Track→module mapping is DB-driven (`module_phase_assignments`), resolved as:

- **ALL TRACKS** (fast-casual, casual-dining, fine-dining): `onboarding`, `greetings`, `physical-craft`, `service-flow`, `language`, `complaints`, `guest-psychology`
- **CASUAL-DINING ONLY**: `casual-dining-standard`, `casual-dining-floor`
- **FINE-DINING ONLY**: `fine-dining-standard`, `fine-dining-presence-module`, `fine-dining-etiquette`, `fine-dining-table-setup`, `fine-dining-menu-knowledge`

*Caveat:* individual properties can prune modules (Bistro 91's live config drops `language` entirely). Track labels reflect the standard track configuration.

---

## 1 · MODULE `onboarding` — "Welcome to [Property]" — ALL TRACKS

**Lesson: House Standards & Expectations** (`our-standards`)
- "Arrive 10–15 minutes early, in clean uniform, groomed and ready to start on time."
- Quiz: "What's the expectation around arriving for a shift? → Arrive 10–15 minutes early, in clean uniform, ready to start on time."

**Lesson: Your First Shift** (`your-first-shift`)
- "Get there 15 minutes before your start time."
- Quiz: "When should you arrive for your first shift? → About 15 minutes early, so you can check in and find out where to start."

**Lesson: Our Menu** (`our-menu-pdf`)
- "Ingredients in every dish — so you can answer 'what's in this?' instantly and flag allergens before you're asked."
- "Dietary options — which dishes are vegetarian, vegan, or can be made gluten-free."
- Quiz explanation: "Knowing ingredients cold means you answer with confidence and catch allergen risks early."

---

## 2 · MODULE `greetings` — "Greetings & First Impressions" — ALL TRACKS

**Lesson: The 5-Second Rule** (`five-second`)
- "Every guest is acknowledged within 5 seconds of stepping through the door."
- "It costs nothing to greet quickly."
- Quiz: "What is the [Property] standard for greeting speed? → 5 seconds"
- Quiz explanation: "Finishing a thought within 10 seconds is acceptable; ignoring them is not."
- "'One moment, I'll be right with you' said warmly is 100x better than ignoring someone for 30 seconds."
- "That 1-second connection tells them: 'I see you. You matter here.'"
- Quiz explanation: "It costs 3 seconds and earns a lifetime."

**Lesson: Multilingual Welcome** (`multilingual`) — *translation accuracy; every row below is a checkable language claim*

Phrase table (English → Dutch → Spanish → Papiamentu):
- Welcome → Welkom → Bienvenido(a) → **Bon biní**
- Good morning → Goedemorgen → Buenos días → **Bon dia**
- Good afternoon → Goedemiddag → Buenas tardes → **Bon tardi**
- Good evening → Goedenavond → Buenas noches → **Bon nochi**
- How are you? → Hoe gaat het? → ¿Cómo están? → **Kon ta bai?**
- Thank you → Dank u wel → Gracias → **Danki**
- Enjoy your meal → Eet smakelijk → Buen provecho → **Bon apetit**
- Come back soon → Tot ziens → Hasta pronto → **Te aworo**

Full greeting sentences presented as correct usage:
- Dutch formal: "Welkom bij [Property]. Fijn dat u er bent. Tafel voor [X]?"
- Dutch casual: "Hoi! Welkom bij [Property] — gezellig dat jullie er zijn!"
- Spanish formal: "Bienvenidos a [Property]. Qué bueno tenerlos aquí. ¿Mesa para cuántos?"
- Spanish casual: "¡Hola! Bienvenidos — qué gusto verlos. ¿Cuántos son?"
- Papiamentu formal: "Bon biní na [Property]! Kon ta bai? ¿Mesa pa kuantu persona?" ⚠️ *flag: mixes Spanish-style inverted `¿` into a Papiamentu sentence*
- Papiamentu casual: "Bon biní! Kon ta bai — tur kos ta bon?"

Quiz translation claims:
- "How do you say 'Welcome' in Papiamentu? → Bon biní"
- "Bon biní = welcome. Bon dia = good morning. Danki = thank you. Bon nochi = good evening."
- "What does 'Bon tardi' mean? → Good afternoon"
- "Bon tardi = good afternoon. Bon dia = morning. Bon nochi = evening. Bon biní = welcome."

**Lesson: Reading the Table** (`reading-table`)
- "Never let a table look around for more than 30 seconds — that's your signal to move."
- Product claim used as example: "First time here? Our signature burger is the move — freshly ground daily."

---

## 3 · MODULE `physical-craft` — "The Physical Craft" — ALL TRACKS

**Lesson: Tray Carrying** (`tray-carrying`)
- "Left hand only. Palm open, fingers spread. The tray rests on your palm and fingertips — not just your fingers."
- Quiz: "Which hand should always carry the tray? → Left hand" / explanation: "Left hand always — this keeps your right hand free to open doors, guide guests, or steady items."
- "Carry at shoulder height or just above. Never in front of the body, never down by your side."
- "Heavy items at the CENTER of the tray, lighter items on the outside."
- "When turning: rotate your ENTIRE BODY — never twist just your wrist. The wrist alone cannot handle the torque."
- "Putting down: Bend at the knees, back straight. Use both hands to lower the tray."
- "Never use narrow paths or busy areas. Plan your route before you load the tray."
- "If a tray feels unstable: stop, steady, then continue."
- "Carrying too high above head → dangerous."
- "Hair tied back, face forward when carrying."

**Lesson: Plate Carrying** (`plate-carrying`)
- One plate: "Right hand, three middle fingers together under the plate. Thumb and little finger raised as guides."
- Two plates: "Second plate: rest the center on the thumb muscle (base of thumb)."
- Three plates: "Third plate: rest on your forearm/wrist, balanced on the rim of the second plate. Left hand holds the third plate steady from below."
- "Serve from the correct side (property standard)." ⚠️ *flag: contradicts the fine-dining module, which states a fixed rule, not a property variable*
- "Never stack plates you are actively serving."

**Lesson: Floor Movement & Navigation** (`floor-movement`)
- "Always walk on the right side of pathways. This prevents collisions and creates natural flow."
- Quiz: "On which side of corridors and pathways should you always walk? → Right side"
- "Guests always have right of way. Step aside for guests — always."
- "Kitchen door exits: slow down, look before entering/exiting."
- "Wet floors: never rush, always tell a manager immediately."
- Quiz: "You notice a wet floor near table 5 during service → Tell a manager immediately and avoid the area."

**Lesson: Table Setting to Standard** (`table-setting`) — *standard cover layout*
- "Fork: Left of the plate. Tines up, handle parallel to the knife."
- "Knife: Right of the plate. Blade facing INWARD — toward the plate. Always."
- "Spoon: Right of the knife. Handle aligned with the knife handle."
- "Water glass: Above the knife, positioned slightly to the right."
- "Wine glass: To the right of the water glass (if applicable)."
- "Napkin: On the plate or to the left of the fork."
- Quiz explanation: "The knife blade always faces inward — toward the plate. **This is a universal dining standard.**"
- "Hold the glass by the stem only — never the bowl. Polish with a clean lint-free cloth. Hold up to light to check for streaks."
- "Plates clean and chip-free — any damaged plate goes back, not to a table."
- Quiz explanation: "Chipped or damaged plates are removed from service immediately — no exceptions. **A chipped plate is a safety concern.**"
- "Table surface clean and completely dry."

**Lesson: Synchronized Service** (`synchronized-service`)
- "All plates go out together. Every plate for a table leaves the kitchen at the same time. No exceptions. If one plate is 2 minutes behind, the team waits."
- **"The 3-Second Rule:** When you approach a table with your team, everyone arrives within 3 seconds of each other. Not 30. Not 10. Three."
- "Clear simultaneously. When the last guest at a table finishes, all servers move in together."
- Role definitions stated as fact: **Server** ("Owns the guest relationship… Calls the timing"), **Runner** ("Supports timing and logistics"), **Captain** ("Coordinates the floor in real time").
- "The 5-minute after-service brief" (three named components).

---

## 4 · MODULE `service-flow` — "The Service Flow" — ALL TRACKS

**Lesson: The 10-Step Service Sequence** (`ten-steps`) — *the full sequence is asserted as "the complete service standard every hospitality professional must master"*
1. "Reception — Greet within 5 seconds of arrival. Confirm reservation. Use their name."
2. "Seating — Guide — never point. Deliver the menu open."
3. "First Contact — Offer water immediately… **Within 2 min**"
4. "Drinks — Proactive suggestion"
5. "Order Taking — Listen actively. Confirm everything. Detect and acknowledge restrictions and preferences."
6. "Food Service — **Serve from the correct side.** All plates go out together."
7. "Follow-up — Check **2-3 minutes** after food arrives."
8. "Clearing — Never clear while someone is still eating. Synchronized clearing."
9. "Dessert / Digestifs — Offer before they ask."
10. "Close — Personalized thank-you. Invitation to return."
- Quiz: "Step 3 (First Contact) should happen within how long of guests being seated? → 2 minutes"

**Lesson: Proactive vs Reactive Service** (`proactive-reactive`)
- "Reactive = 4 stars. Proactive = 5 stars."
- "Refill before the glass hits half-empty." / quiz explanation: "refill when the glass drops below half."
- "'I can have your main out in the next 8 minutes if you'd like.'"
- Anticipation formula stated as fixed: "Observe → Interpret → Act."
- Signal→meaning claims: "Empty glass = needs a refill. Closed menu = ready to order. Leaning back = course complete."

**Lesson: Reading Non-Verbal Signals** (`nonverbal-signals`)
- "Looking around → They are waiting for attention… get there **within 60 seconds**." (repeated in quiz explanation)
- "Menu closed → Ready to order." / quiz explanation: "A closed menu placed on the table is one of the clearest order signals in hospitality."
- "Leaning back → Satisfied with the current course."
- "Looking at the bill → Ready to leave."

---

## 5 · MODULE `language` — "Language & Storytelling" — ALL TRACKS *(dropped from Bistro 91's live config)*

**Lesson: The Banned Phrases** (`banned-phrases`) — *Spanish translation pairs only; the English phrase choices are tone and are excluded*
- "'Is everything okay?' / '¿Todo bien?'"
- "'How are you finding the balance of flavors?' / '¿Cómo percibieron el balance de sabores?'"
- "'Did you like it?' / '¿Les gustó?'"
- "'What did you think of the [dish]?' / '¿Qué les pareció la [dish]?'" ⚠️ *flag: `la [dish]` hard-codes feminine gender agreement*

**Lesson: Describing What You Serve** (`describe-serving`) — *product/preparation claims presented as model answers*
- "This starts with hand-selected Wagyu…"
- "Slow-smoked for 8 hours"
- "seared on cast iron" / "seared on a cast-iron flat top"
- "fermented in-house"
- "This starts with our freshly ground beef blend… giving you a crust that locks in every bit of juice"
- "Caught this morning from local waters, simply pan-seared, with a charred lime…"
- "This opens with dark rum, shaken with fresh citrus and house bitters…"
- "Don't over-explain — 2-3 sentences maximum."

**Lesson: Storytelling** (`storytelling`) — *venue-origin and sourcing claims presented as model answers*
- "Our vegetables come from a local farm in the interior — picked this morning."
- "This is the dish that started it all — the owner created it on the first night we opened."
- "Most guests who try this end up making it their regular order. One couple comes back every Friday just for this one."
- "Slow-smoked for 8 hours over local wood." / "House-ground daily." / "Fermented in-house for 3 weeks."
- Quiz distractor treated as a fact about the venue: "We've been open for 5 years."
- Three story types asserted as a fixed taxonomy: Origin Story / Process Story / Guest Story.

**Lesson: Handling Difficult Conversations** (`handling-complaints`)
- The 4-step complaint protocol stated as the protocol: "Listen → Acknowledge → Resolve → Follow up."
- "A beverage while they wait is the minimum gesture."
- Timeframes given as commitments: "I'll be back with you in two minutes." / "I'll be back in 8 minutes."

---

## 6 · MODULE `complaints` — "Handling Difficult Situations" — ALL TRACKS

**Lesson: The Mindset Shift** (`mindset-shift`) — ⚠️ *highest density of unsourced statistics in the curriculum*
- **"96% of dissatisfied guests leave without saying a word."** (stated in intro, in principles, in a quiz answer, and in a quiz explanation)
- **"The 4% who do complain are giving you a second chance."**
- **"70% will return if resolved. Resolve a complaint and 70% of unhappy guests come back. Resolve it quickly and that number jumps to 95%."**
- **"The Service Recovery Paradox:** Guests who experience a great service recovery are MORE loyal than guests who never had a problem at all."
- "A problem solved in 2 minutes creates more loyalty than a perfect night."
- "Speed of recovery is the single biggest factor in guest satisfaction after a complaint."
- Quiz: "What percentage of unhappy guests never complain — they just leave? → 96%"

**Lesson: The LEARN Protocol** (`learn-protocol`)
- ⚠️ Lesson description (visible on the module card): **"The 5-step framework used by Marriott, Hilton and IHG worldwide."**
- Intro: "there is one framework used by the world's leading hospitality groups. It works in every situation, with every guest, every time."
- LEARN defined as: **L**isten, **E**mpathize, **A**pologize, **R**esolve, **N**otify.
- Definitional claim: "'I understand there was a problem' is sympathy — facts only. 'I understand how frustrating that must have been' is empathy — feelings first."
- Timeframe: "I'm going to the kitchen right now and I'll be back in 3 minutes."

**Lesson: The Most Common Situations** (`common-situations`)
- Timeframes given as commitments: "I'll be back in 8 minutes" (overcooked food), "back in two minutes with an update" (long wait).
- "Offer something during the wait: bread, a drink, an amuse."

**Lesson: Prevention Over Recovery** (`prevention`)
- **"A proactive check-in 2-3 minutes after food arrives prevents 90% of complaints from escalating."** (stated in callout, restated in principles, and asked directly in the quiz: "Which check-in phrase prevents 90% of complaints from escalating?")
- "Order taking more than 20 minutes = flag it before they do." / quiz: "A ticket has been sitting for 20 minutes with no update → Proactively update the table."
- Warning-sign→meaning claims: "Food barely touched = something may be wrong with the dish." / "Pushing food around the plate = not enjoying it." / "Checking the time = feeling rushed or waiting too long."

---

## 7 · MODULE `guest-psychology` — "Guest Psychology" — ALL TRACKS

**Lesson: VIP & Returning Guests** (`vip-guests`)
- **"A returning guest costs 5-7x less to retain than to acquire a new one."**
- "They spend more, refer others, and give you the benefit of the doubt when things go wrong."
- Quiz: "How many times during a meal should you use a guest's name? → **Approximately three times: arrival, once mid-meal, and at departure.**" / explanation: "Using a name too often feels transactional."

**Lesson: The Emotional Journey of a Guest** (`emotional-journey`)
- "The 7 Emotional Stages" asserted as a fixed model: Anticipation → Arrival → Settling In → Ordering → The Experience → The Close → The Memory.
- "Arrival (**first 5 seconds**)… The first impression is worth more than the next **30 minutes** combined."
- "Settling In (**first 3 minutes**)."
- **"Recency bias:** the last thing that happens is what they remember most."
- Quiz: "The last thing a guest experiences is disproportionately powerful in shaping their overall memory. This is called… → Recency bias" (distractors offered: halo effect, peak performance syndrome, emotional anchoring).

**Lesson: Reading Buying Signals** (`buying-signals`)
- Product claim used as a model line: "The [signature dessert] is made fresh daily."

**Lesson: Cultural Awareness** (`cultural-awareness`) — see §16 (national-generalization claims).

---

## 8 · MODULE `casual-dining-standard` — CASUAL-DINING ONLY

**Lesson: Showing Up Right** (`showing-up-right`) — *hygiene requirements*
- "Clean uniform — pressed, stain-free, and properly fitted."
- "Hair tied back, neat, and out of your face — nothing that ends up near food or in your eyes during a rush."
- "Hands washed, nails short and clean — the part of you that touches every plate and glass."
- "Phone away and on silent — stored in your locker or back pocket, never in your hand on the floor."
- "Name badge on and visible."

**Lesson: Food Safety on the Floor** (`food-safety-floor`) — ⚠️ **the single densest food-safety lesson in the curriculum**

*Framing claim:*
- "As a server, you're the last line of defense between the kitchen and the guest."
- "A missed allergen flag isn't a small mistake — it can end in a hospital visit, or worse."

*"The 8 most common allergens" — asserted as a closed list of eight:*
- "Milk (dairy) — hidden in sauces, dressings, butter, and many desserts."
- "Eggs — in mayonnaise, batters, custards, and some pasta."
- "Fish — including fish sauce and Worcestershire, not just whole fillets."
- "Shellfish — shrimp, crab, lobster; often in stocks and broths too."
- "Tree nuts — almonds, walnuts, cashews; common in oils, pesto, and desserts."
- "Peanuts — distinct from tree nuts; in sauces, garnishes, and fryer oil."
- "Wheat (gluten) — bread, pasta, breading, soy sauce, many thickeners."
- "Soybeans (soy) — in soy sauce, tofu, edamame, and many processed items."
- "Remember: guests don't always volunteer an allergy — you must ask."
- Quiz explanation: "The 8 common allergens are milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, and soybeans. **Shellfish is one of the most severe.**"

*The allergy protocol — four steps stated as mandatory, every time:*
1. "Confirm the details with the guest — 'How severe is it? Is even a trace a problem?'"
2. "Take it straight to the kitchen and flag the ticket clearly — write it on the order **and** say it out loud."
3. "Never assume the kitchen already knows or that a dish is 'probably fine.'"
4. "Follow up when you deliver the dish: confirm out loud that this is the allergy-safe plate."
- "An allergy is never a place to guess, rush, or cut a corner."

*"Red flags to always report":*
- "Food that looks undercooked — pink chicken, cold centers, raw-looking meat where it shouldn't be."
- "A strong off or sour smell coming from a dish or ingredient — trust your nose."
- "A plated dish that was left sitting out during a rush instead of going to the table — temperature matters."
- "A guest showing signs of an allergic reaction — **flushing, swelling, hives, difficulty breathing.** Act immediately."
- "A colleague skipping handwashing or handling food after touching something dirty — speak up or tell a manager."
- Quiz: "You're about to run a chicken dish and notice the center looks pink and undercooked → Report it and don't take it to the table."

**Lesson: Speed Without Rushing** (`speed-without-rushing`)
- Priority ladder during a rush, stated as a fixed order: "Food that's ready in the kitchen → drink refills → check-ins for waiting tables → clearing finished plates → everything else."
- "Hot plates wait for no one. Run them before they die under the heat lamp."

---

## 9 · MODULE `casual-dining-floor` — "Running the Floor" — CASUAL-DINING ONLY

**Lesson: Taking Orders Correctly** (`taking-orders`)
- "Capture modifications and allergies the moment they're said — write them down clearly, never trust them to memory in a rush."
- "When a guest mentions an allergy, treat it as non-negotiable: confirm the severity, write it on the ticket, and flag it out loud to the kitchen."
- Quiz explanation: "An allergy is never a preference. Confirm severity, note it clearly, and flag it out loud to the kitchen — **guessing can put a guest in the hospital.**"
- Required follow-up questions listed as standard: "cook temperature, side choice, dressing, sauce."
- Worked example: "one has a gluten allergy and needs the bun swapped and the kitchen flagged."
- "Thirty seconds of read-back saves ten minutes of remade plates."
- "Giving the table your complete attention for the sixty seconds it takes."

**Lesson: Managing Multiple Tables** (`managing-sections`)
- "The five states every table is always in" asserted as a closed model: Just seated → Ordered → Waiting on food → Eating → Ready for the bill.
- "Waiting on food — the danger zone; this is where guests feel forgotten."
- Triage order stated as fixed: "Ready hot food first — always. Greet a new table before it starts to stew. A guest who simply needs a refill or the bill can be held for thirty seconds."
- Expectation-setting example: "I'm firing your order now — about ten minutes."

**Lesson: Table Turns & Pacing** (`table-turns`)
- **"Cutlery laid together on the plate — the universal 'I'm done' signal."** (restated in the quiz)
- "Plates pushed toward the edge or stacked — they're finished."
- "Cards or wallet appearing on the table — they want the bill now."

**Lesson: Efficiency & Attention to Detail** (`floor-efficiency`)
- "The one-trip rule… every trip out of the kitchen carries something to the floor, and every trip back brings something with it."
- "The scan… every single time you pass through your section, your eyes do a quick sweep — glass levels, plate states, faces, body language."

---

## 10 · MODULE `fine-dining-standard` — FINE-DINING ONLY

**Lesson: Your Presence on the Floor** (`fds-your-presence`)
- "Hands out of pockets at all times on the floor. They should be at your sides, behind your back, or carrying something."
- "If you need to move fast, do it through the kitchen." (not through the dining room)
- "Speak calmly and at a conversational volume. The table next to the one you are serving should not hear your conversation."
- "If you are stressed: drop your shoulders, **slow your pace by 10%**, and keep moving."
- "After a tough table: give yourself **20 seconds** in the kitchen before going back out."

**Lesson: Uniform & Grooming Standards** (`fds-uniform-grooming`) — *hygiene/presentation requirements*
- "Uniform: Pressed, stain-free, and properly fitted."
- "Hair: Clean, neat, and secured away from the face, with no loose strands that could fall near food."
- "Hands and nails: Short, clean, no strong nail polish."
- **"Scent: No strong perfume, cologne, or deodorant. Fine dining guests are eating, and strong scent interferes with the aroma of food and wine."** (restated twice in the quiz)
- "Keep your phone stored completely out of sight, in a locker."
- Pre-shift checklist (8 items): uniform pressed and stain-free / shoes clean and polished / hair secured and clean / nails short and clean / no strong scent / name badge straight and visible / phone stored away / mirror check.

---

## 11 · MODULE `fine-dining-presence-module` — FINE-DINING ONLY

**Lesson: Approaching Tables & Reading Timing** (`fdp-approach`)
- **"The three-second read:** Before you reach the table, take three seconds to read it." (restated in the quiz)

**Lesson: The Art of Invisible Service** (`fdp-invisible`)
- **"Clear from the right."** — "remove plates quietly **from the right**, without asking the table to stop." (restated in the quiz)
- "Top up before a glass runs low, **approaching from the side**, pouring smoothly, withdrawing."
- "Carry the next course's cutlery with you so the table is set before the plate lands."
- "Read glass levels from across the room so you never approach just to check."

*(The `fdp-voice` lesson is entirely vocabulary/register and is excluded as tone. Noted only for consistency: it teaches "No problem" → "**Of course** — my pleasure," while the shared `language` module teaches "No problem" → "**Absolutely** — my pleasure." Both are delivered to fine-dining trainees in the same phase.)*

---

## 12 · MODULE `fine-dining-etiquette` — FINE-DINING ONLY

**Lesson: Napkin Service & Placement** (`fde-napkin-service`)
- "Once the guest is seated, **step in from the right**. Lift the napkin from the setting, open it in one smooth motion, and lay it gently across their lap."
- "With a single guest, you may simply hand it to them."
- "The moment a guest stands to leave the table, take their napkin. Fold it loosely, or replace it with a fresh one, and lay it **to the left of the setting**."
- **"A dropped napkin never goes back to the guest."** / "A dropped napkin goes to the laundry, never back to the guest."
- "At the end of the meal… clear the napkin with the rest of the setting. Never bundle it up at the table in front of them."
- "Seat the guest first; the napkin comes after, never before."

**Lesson: Service Direction & Order of Precedence** (`fde-service-direction`) — ⚠️ **the core etiquette rule-set**
- **"Serve from the left. Clear from the right. Pour from the right."**
- **"Serve ladies first, then gentlemen, then the host last."** (restated in do/don't, tips, and quiz) ⚠️ *flag: gendered precedence*
- "If some guests are clearly older or more senior, honour them first within that order."
- "The host is served last on purpose — it shows that their guests were cared for before them."
- "Place plated food from the guest's left side, **with your left hand when you can**, so you never reach across them."
- "Set the plate down quietly, with any logo or main part of the dish squared to the guest."
- "Take finished plates and glasses away from the right, so your arm never crosses in front of the guest."
- **"Pour water and wine from the right, because the glasses sit to the upper right of the setting. Reach the glass without lifting it from the table."**
- Documented exception: "When a tight bench seat or a guest against a wall makes the correct side impossible… choose the side that lets you avoid reaching across the guest. The rule — never cross the guest — matters more than the side."
- "The host is the person who booked the table and is looking after the guests."

**Lesson: Conduct at the Table** (`fde-table-conduct`)
- "Never reach across a guest to place or clear… If the layout truly makes it impossible, a quiet 'excuse me, may I?' comes first."
- "Never stack plates at the table… do the stacking and scraping out of sight."
- "Never scrape or sort in view — anything that looks like cleaning up… belongs out of the guest's sight."

**Lesson: Reading & Respecting Formal Settings** (`fde-formal-settings`) — ⚠️ **place-setting layout and cutlery-signal claims**
- **"Cutlery is used from the outside in, one pair per course."** (restated in quiz + tips)
- **"Forks sit to the left of the plate, knives and spoons to the right, with the knife blades turned toward the plate."**
- **"Dessert cutlery often sits flat above the plate. The bread plate sits to the upper left, and the glasses to the upper right."**
- "As each course is cleared, the used cutlery goes with it, and fresh cutlery for the next course is set."
- **"Hold glasses by the stem, never the bowl — a warm hand clouds the glass and warms the wine."** / "keep your fingers off the rim."
- **The "still eating" signal:** "Cutlery resting apart — fork and knife angled open on the plate, **often like an upside-down V** — means the guest is pausing, not finished."
- **The "finished" signal:** "Cutlery placed together — fork and knife laid side by side, usually across the plate **around the four-o'clock position** — means the guest is done."

---

## 13 · MODULE `fine-dining-table-setup` — FINE-DINING ONLY

**Lesson: Mise en Place** (`fdt-mise-en-place`)
- Translation claim: **"Mise en place means 'everything in its place.'"**
- "A pressed, spotless cloth laid square to the table, **dropping the same distance on all four sides**."
- "The charger or show plate anchors the cover. Centre it to the chair, with the same gap from the table edge at every seat."
- "Lay the cutlery in the order the courses will be used, working outside-in, forks to the left and knives and spoons to the right, blades turned inward."
- **"Every handle sits the same distance — about a thumb's width — from the table edge."** (restated in tips)
- "Set the glasses to the upper right of the cover… held only by the stem or base."
- "Fold each napkin to the one house style and place it the same way at every cover."
- "Place salt, pepper, and any shared items to the house plan, wipe them clean, and **check they are full before service — never top them up in front of guests.**"
- "Keep the centrepiece **low enough that guests can see one another across the table**."
- Final check: "sit or crouch in the guest's chair and look at it from their eye level."

**Lesson: Linen & Glassware Standards** (`fdt-linen-glassware`)
- **"Polish each glass over steam with a clean cloth. Hold it by the base, work up the bowl without touching the rim, and check it against the light before it leaves your hand."** (restated in quiz + tips)
- "One clean cloth — never a patched or doubled layer to hide a flaw underneath."
- "Check every piece of linen and glassware away from the table."
- **Re-lay protocol:** "The moment a cloth is marked… you replace it. With guests seated, cover the mark with a clean napkin first so it leaves their sight at once, then change the cloth properly at the next natural break."

**Lesson: The Sideboard & Service Station** (`fdt-sideboard`)
- Belongs on station: "polished backup cutlery, clean napkins, spare glasses, crumbers, clean service cloths, the wine list, and bill folders."
- Never on station: "used plates or dirty glasses… personal items — phones, drinks, notebooks, keys… open food, rubbish."
- "Stock it fully at the start of service, and top it up again at every quiet moment."
- "Turn the working side of the station away from the room."
- "Return the station to its starting state before the next guests arrive."

**Lesson: Dining Room Flow & Atmosphere** (`fdt-room-flow`)
- **Music level test:** "Music belongs under the talk of the room, never over it. The test is simple: **can a table talk easily without raising their voices?**"
- "As the room fills and empties through the evening, the right level changes with it."
- "Set the lighting to flatter, and soften it as the night goes on… The room should feel warmer as it gets later, not brighter."
- "Keep the candles lit, no table in shadow, and no guest squinting against a glare."
- "Read the room as it really is — filling with people, warming through the evening — and respond to that, rather than trusting a setting you made hours ago."
- **"The fifteen-minute look around: Every fifteen minutes, stop and take the room in as a guest would — the light, the sound, the temperature, the energy."** (restated in the quiz)
- "Dead zones — the table by the kitchen door, the seat in the draught, the corner the light never quite reaches… give those tables a little more attention and care, never less."

---

## 14 · MODULE `fine-dining-menu-knowledge` — FINE-DINING ONLY

**Lesson: Knowing Your Menu** (`fmk-know-your-menu`)
- "For every dish on the menu, you know the key ingredients, the main cooking method, and how it tastes."
- "You do not need every herb, but you do need… anything common people avoid, like **nuts, shellfish, or dairy**."
- Cooking methods listed as the set to know: "grilled, roasted, pan-fried, steamed, braised, raw, cured."
- **"Learn which dishes contain common allergens: nuts, shellfish, dairy, gluten."** ⚠️ *flag: a 4-item allergen list here vs. the 8-item list in the casual-dining track*
- Quiz: "A guest asks if a dish contains nuts and you are not sure → Know your menu's common allergens in advance — and if you are ever unsure, check with the kitchen before answering."
- "Ask the kitchen about anything you don't understand, before service, not during."

**Lesson: Beverage Foundations** (`fmk-beverage-foundations`) — ⚠️ **the only wine/alcohol content in the entire curriculum**
- **"Red wine is usually served with richer food and at room temperature."**
- **"White wine is usually served cold and goes with lighter food."**
- "Sparkling wine has bubbles and is often served as a celebration drink or before the meal."
- **"'Body' means how heavy or light a wine feels in the mouth.** A light wine feels delicate and easy; a full-bodied wine feels rich and strong. Light wines suit lighter dishes; full-bodied wines suit richer ones."
- **"A 'dry' wine is simply a wine that is not sweet. Most wines served with a meal are dry. The opposite is 'sweet,' which is more common with dessert."**
- **The pairing rule:** "White wine with fish and light dishes, red wine with red meat and rich dishes. It is not a strict law, and there are many exceptions — **but as a basic guide it is correct far more often than not.**"
- Summary tips: "Red with rich food and red meat; white with fish and lighter dishes." / **"White and sparkling are served cold; red is served at room temperature."** / "'Dry' means not sweet — most meal wines are dry."
- Non-alcoholic options listed: "sparkling water, soft drinks, juices, mocktails, alcohol-free wine or beer."
- "Bring in a colleague who knows more when a guest wants deeper advice."

**Lesson: Answering Guest Questions with Confidence** (`fmk-answering-questions`)
- **"You never guess on a dietary or allergy question."**
- "Take every dietary question seriously — vegetarian, vegan, gluten-free, allergies. Know your menu well enough to point to safe options, and never guess with an allergy. When in doubt, check with the kitchen. **Getting this right can matter to a guest's health.**"
- "Know your menu's vegetarian, vegan, and gluten-free options before service."
- "Never guess on an allergy — check with the kitchen every time."
- "Always come back promptly with the answer you went to find."

---

## 15 · Notable absences (things a fact-checker would expect to find and won't)

Grepped across all lesson and exam content — **zero occurrences**:

- **No temperatures anywhere.** No °C or °F figure appears in any lesson. No cooking temperatures, no holding temperatures, no cold-chain figures, no serving temperatures for wine (only the qualitative "cold" / "room temperature"), no fridge/freezer targets.
- **No temperature danger zone**, no time-out-of-refrigeration limits, no "2-hour rule" or equivalent.
- **No handwashing specifics.** "Hands washed" and "a colleague skipping handwashing" appear, but no duration, no method, no when-to-wash trigger list.
- **No sanitation/cleaning-chemical content**, no HACCP reference, no food-safety certification reference, no cleaning schedules or sanitizer concentrations.
- **No alcohol service law of any kind.** No legal drinking age, no ID/age verification, no refusal-of-service for intoxication, no visible-intoxication indicators, no dram-shop/licensee liability, no standard measures or pour sizes, no last-call/licensing hours. The only alcohol content in the entire curriculum is the qualitative pairing lesson in §14.
- **No allergen-disclosure regulation.** No statutory duty to provide allergen information, no timeframe for providing it, no written-information requirement, no jurisdiction named. The allergen content is entirely procedural ("ask, confirm, flag, reconfirm") with no legal grounding, and the 8-item list is presented without naming a regulatory regime.
- **No cross-contamination handling procedure** despite "cross-contamination" appearing in the `food-safety-floor` lesson's description line.
- **No jurisdiction is ever named.** The content assumes Curaçao geographically (§16) but cites no country's food-safety or alcohol regime.

---

## 16 · Borderline — national/cultural generalizations

These are empirical-sounding assertions about groups, taught as "pattern recognition." They're not brand voice, but they're also not cleanly verifiable. Flagging them separately so you can decide whether they belong in the fact-check.

**`greetings` / `multilingual`** (ALL TRACKS) — culture cards: Dutch ("Direct, efficient, value honesty over flattery. Less small talk"), American ("Want warmth, enthusiasm, eye contact"), Venezuelan/Colombian ("Treat like family. Slower pace is a sign of respect"), German ("Precision and punctuality matter. Formal address"), Canadian ("Polite, friendly, low-key"), Local Curaçaoan ("Papiamentu is the language of home and trust").

**`service-flow` / `nonverbal-signals`** (ALL TRACKS) — "Dutch / Northern European: Direct eye contact = ready." / "Latin American: Animated conversation ≠ signal to approach." / **"Asian Guests: May not wave or make obvious signals."** (plus a quiz question built on it: "An Asian guest has a closed menu but hasn't waved or made eye contact…").

**`guest-psychology` / `cultural-awareness`** (ALL TRACKS) — an entire lesson of these, plus: **"Americans tip based on emotional connection"** and "word-of-mouth on the island travels fast in both directions."

**Geographic assumption baked into lesson bodies** (ALL TRACKS): "On any given night **in Curaçao** you might serve Dutch tourists, Venezuelan families…" (`cultural-awareness` intro) and "local Curaçaoans celebrating a birthday" (`multilingual` intro). The lesson description reads "Curaçao welcomes the world."

---

## 17 · Phase-1 exam content (`src/lib/exam.ts`) — all three tracks

The three exams restate lesson claims rather than introducing new ones. Claims that appear in exam form, with the track that gets them:

- "Reception — greet within 5 seconds" (10-step sequence rebuild) — **all three exams**
- "Follow-up — check in 2–3 minutes after food arrives" — **all three exams**
- "Food service — correct side, plates together" — **all three exams**
- "What percentage of unhappy guests never complain? → 96%" — **fast-casual**
- "How do you say 'Welcome' in Papiamentu? → Bon biní" — **casual-dining**
- "How do you say 'Thank you' in Papiamentu? → Danki" — **fast-casual**
- "Which hand always carries the tray? → Left hand" — **fast-casual**
- "Where do the heavy items go when you load a tray? → The center of the tray" — **fast-casual**
- "A guest lays their cutlery together on the plate → They're finished" — **casual-dining**
- "You're about to run a chicken dish and the center looks pink → Report it and don't take it to the table" — **casual-dining**
- Allergy protocol in full: "Confirm how severe the allergy is, write every modification down, flag the ticket AND tell the kitchen out loud, then read the whole order back" — **casual-dining and fast-casual**
- "Wine and water are poured from which side — and why?" / "Plated food is served from the guest's [left]" — **fine-dining**
- "Serving the ladies first, then the gentlemen, then the host last" — **fine-dining**
- "A guest says they like their wine 'dry'. They mean…" — **fine-dining**
- "Holding every glass by the stem and checking it against the light before it reaches the table" — **fine-dining**
- "A guest drops their napkin — you quietly remove it and bring a fresh one" — **fine-dining**
- "'With the sole, a crisp white is lovely — light, fresh, served cold.'" — **fine-dining**
- "A ticket hits 20 minutes with no update — you go tell the table before they have to ask" — **casual-dining and fast-casual**

Property/menu-fact claims embedded in exam scenarios: "The warm rum cake is the one guests come back for — **baked in-house every afternoon**" and "The kitchen's doing something special with the **ribs** tonight" (**casual-dining**); "**freshly ground** daily" burger framing (**fast-casual**).

---

## 18 · Parked content (not live on any track)

`fineDiningAnticipatoryLessons` (4 lessons, `curriculum.ts:2190–2337`) is written and exported but deliberately not attached to any module, so **no trainee on any track currently sees it**. It contains one procedural number worth noting if it ever ships: **"the 15-second scan — every time you pass through your section, take fifteen seconds to read it."** Its allergy line is: "An allergy or dietary need is not a one-time note. Carry it with you through every course, every plate, every drink."
