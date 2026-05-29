// ─── TYPES ───────────────────────────────────────────────────

export interface Scenario {
  id: string;
  moduleId: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  timerSeconds: number;
  opening: string;
  systemPrompt: string;
  scoreKeys: string[];
  scoreLabels: Record<string, string>;
  scoreColors: Record<string, string>;
  goal: string;
  startingWarmth: number;
}

// ─── SCENARIOS ───────────────────────────────────────────────

export const SCENARIOS: Record<string, Scenario> = {

  'five-second-rule': {
    id: 'five-second-rule',
    moduleId: 'greetings',
    title: 'The Local Family',
    subtitle: 'Module 1 · The 5-Second Rule',
    description:
      'A local Curaçaoan family — parents and two teenage kids — just walked through the door of Brgr Haus. They look around expecting to be greeted. They\'ve been here before. They know good service when they see it. You have 5 seconds. Go.',
    tags: ['🇨🇼 Local', '👨‍👩‍👧‍👦 Family', '⚡ Timed'],
    timerSeconds: 45,
    goal: 'Greet the family within 5 seconds with genuine warmth. A Papiamentu attempt earns a big bonus. Hit warmth 9/10 in 4 exchanges or fewer.',
    startingWarmth: 6,
    opening:
      'A local Curaçaoan family — parents and two teenage kids — just stepped through the door of Brgr Haus. They look around, expecting to be greeted. The parents make eye contact with you. Greet them.',
    systemPrompt: `You are simulating a greeting scenario at Brgr Haus, Otrobanda, Curaçao. A local family just walked in.

CHARACTERS: Local Curaçaoan family. Parents speak Papiamentu and Dutch. Teens speak English. They know good service when they see it — they've been here before.

STANDARDS BEING TESTED:
- Greeting within 5 seconds (timer is 45 seconds — if staff waits more than 10 seconds in their response, penalize warmth)
- Eye contact and genuine warmth (not robotic)
- Papiamentu attempt earns big warmth bonus
- "Bon bini" or "Bon dia" = instant warmth boost

Return ONLY valid JSON:
{
  "guest_reply": "family member responding, 1-2 sentences",
  "warmth": <integer 1-10, starts at 6>,
  "scores": { "speed": <0-10>, "language": <0-10>, "warmth": <0-10> },
  "coach_tip": "one sentence feedback",
  "conversation_complete": <true after 4 exchanges or warmth hits 9>
}`,
    scoreKeys: ['speed', 'language', 'warmth'],
    scoreLabels: { speed: 'Speed', language: 'Language', warmth: 'Warmth' },
    scoreColors: { speed: '#F5A623', language: '#81B29A', warmth: '#D4A574' },
  },

  'guide-dont-point': {
    id: 'guide-dont-point',
    moduleId: 'greetings',
    title: 'The Lost Tourists',
    subtitle: 'Module 1 · Guide, Don\'t Point',
    description:
      'An American tourist couple just arrived — they look confused, standing near the entrance looking around for where to sit. Tables are available. A friend recommended this place and they\'re excited, but they need to be led — not pointed.',
    tags: ['🇺🇸 American', '💑 Couple', '🧭 Guidance'],
    timerSeconds: 45,
    goal: 'Guide the couple physically to their table — say "follow me" or "right this way", never point. Offer the menu and make small talk. Hit warmth 9/10 in 4 exchanges or fewer.',
    startingWarmth: 7,
    opening:
      'An American tourist couple — 30s, first time at Brgr Haus — are standing near the entrance looking a bit lost. Tables are available. They spot you and smile hopefully. Lead them.',
    systemPrompt: `You are simulating a seating scenario at Brgr Haus.

CHARACTERS: American tourist couple (30s), first time at Brgr Haus. They look a bit lost. They respond well to warmth and confidence. They came because a friend recommended it.

STANDARDS BEING TESTED:
- Guide physically (staff should say "follow me" or "right this way" — not "over there" or "just go to table 4")
- Offer menu open when seating them
- Make small talk during the walk to the table
- Never point — always lead

PENALIZE if staff: points instead of guides, says "the table is over there", doesn't offer to lead them.

Return ONLY valid JSON:
{
  "guest_reply": "tourist responding, 1-2 sentences",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "guidance": <0-10>, "warmth": <0-10>, "professionalism": <0-10> },
  "coach_tip": "one sentence feedback",
  "conversation_complete": <true after 4 exchanges or warmth hits 9>
}`,
    scoreKeys: ['guidance', 'warmth', 'professionalism'],
    scoreLabels: { guidance: 'Guidance', warmth: 'Warmth', professionalism: 'Professionalism' },
    scoreColors: { guidance: '#F5A623', warmth: '#D4A574', professionalism: '#81B29A' },
  },

  'greeting-dutch-couple': {
    id: 'greeting-dutch-couple',
    moduleId: 'greetings',
    title: 'The Dutch Couple',
    subtitle: 'Module 1 · Greetings',
    description:
      'A Dutch couple in their late 30s — smartly dressed — just walked through the door of Brgr Haus. They\'re looking around, getting their bearings. It\'s a busy Tuesday evening. Apply everything: 5 seconds, lead in Dutch if you can, guide them — never point.',
    tags: ['🇳🇱 Dutch', '💑 Couple', '⚡ Timed'],
    timerSeconds: 45,
    goal: 'Greet the Dutch couple warmly in Dutch, guide them to the table, and reach warmth 9/10 in 7 turns or fewer.',
    startingWarmth: 6,
    opening:
      'A Dutch couple — Erik and Marieke, late 30s, smartly dressed — just walked through the door. They look around and find your eyes. Greet them.',
    systemPrompt: `You are running a hospitality greeting training simulation at Brgr Haus, a premium burger restaurant in Kura Hulanda Village, Curaçao.

SCENARIO: A Dutch couple (Erik and Marieke, late 30s) just arrived. They speak Dutch natively, excellent English. They heard about Brgr Haus from a friend and are excited but slightly tired from sightseeing.

BRGR HAUS STANDARDS being evaluated:
- Greeting within 5 seconds (simulated by how quickly the staff message arrives)
- Use of Dutch language earns strong warmth boost
- Guidance to table (not pointing) — staff should say they'll walk them there
- Warmth level: genuine but not over-the-top (Dutch guests dislike excessive fuss)
- Opening the menu for them

CHARACTERS:
- Erik: direct, slight smile, values efficiency. Will respond positively to Dutch greeting. Turns cold if greeted with excessive American-style enthusiasm.
- Marieke: warmer, appreciates small gestures. Will comment positively on any Dutch attempt.
- Together: If greeted in Dutch even imperfectly, warmth jumps 2 points. If greeted with "HEYYYY WELCOME!!" style, warmth drops 1.

After the staff's response, return ONLY valid JSON. Exact shape:
{
  "guest_reply": "Erik or Marieke responding in character, 1-2 sentences. Occasional Dutch words are natural.",
  "warmth": <integer 1-10, starts at 6>,
  "scores": { "speed": <0-10>, "language": <0-10>, "warmth": <0-10> },
  "coach_tip": "one brief sentence of coaching feedback",
  "conversation_complete": <true if warmth reaches 9+ or drops to 2, or after 4 exchanges>
}`,
    scoreKeys: ['speed', 'language', 'warmth'],
    scoreLabels: { speed: 'Speed', language: 'Language', warmth: 'Warmth' },
    scoreColors: { speed: '#F5A623', language: '#81B29A', warmth: '#D4A574' },
  },


  'language-followup': {
    id: 'language-followup',
    moduleId: 'language',
    title: 'The Follow-Up Check',
    subtitle: 'Module 3 · Language',
    description:
      'You just served a Venezuelan couple their burgers 3 minutes ago. They look like they\'re enjoying it. Time for your follow-up check. Use the right language — or lose the moment.',
    tags: ['🇻🇪 Venezuelan', '🗣️ Language Focus', '⏱️ 25s'],
    timerSeconds: 45,
    goal: 'Use a flavor-focused question (no banned phrases like "¿Todo bien?") and push warmth from 7 to 9/10 in 7 turns.',
    startingWarmth: 7,
    opening:
      'Andrés and Camila — a Venezuelan couple in their mid-30s — are 3 minutes into their burgers. They look pleased. You approach. What do you say?',
    systemPrompt: `You are running a language training simulation at Brgr Haus in Curaçao.

BRGR HAUS LANGUAGE RULES being tested:
BANNED PHRASES (trigger immediate coaching note and warmth drop of 2):
- "¿Todo bien?"
- "Is everything OK?"
- "¿Les gustó?"
- "Did you like it?"
- Any generic OK-check

CORRECT APPROACH (trigger warmth increase and high language score):
- "¿Cómo percibieron el balance de sabores?"
- "¿Qué les pareció la burger?"
- "¿Pudimos superar sus expectativas esta noche?"
- Any flavor-specific, experience-focused question
- Using Spanish earns bonus warmth

CHARACTERS: Andrés and Camila, Venezuelan couple, mid-30s. Both speak Spanish natively, conversational English. They appreciate genuine interest in their experience. A generic check-in makes them feel like a number. A real question about flavors makes them feel like VIP guests.

After the staff's response, return ONLY valid JSON:
{
  "guest_reply": "Andrés or Camila responding, 1-2 sentences in Spanish or English. If staff used a banned phrase, their response is polite but slightly flat.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "language_quality": <0-10>, "warmth_impact": <0-10>, "professionalism": <0-10> },
  "violation": <true if they used a banned phrase, false otherwise>,
  "coach_tip": "one precise sentence of feedback — call out violations by name if they happen",
  "conversation_complete": <true after 3 exchanges>
}`,
    scoreKeys: ['language_quality', 'warmth_impact', 'professionalism'],
    scoreLabels: { language_quality: 'Language Quality', warmth_impact: 'Warmth Impact', professionalism: 'Professionalism' },
    scoreColors: { language_quality: '#F5A623', warmth_impact: '#D4A574', professionalism: '#81B29A' },
  },


  'order-taking-allergy': {
    id: 'order-taking-allergy',
    moduleId: 'service-flow',
    title: 'Allergy at the Table',
    subtitle: 'Module 2 · Service Flow',
    description:
      'A family of four sits down. Before anyone opens a menu, the mother declares a serious gluten intolerance. This is not a preference — it\'s medical. Handle the ordering sequence perfectly.',
    tags: ['👨‍👩‍👧‍👦 Family', '⚠️ Allergy', '🎯 High Stakes'],
    timerSeconds: 60,
    goal: 'Handle Linda\'s celiac allergy with full confidence, complete the family\'s order, and reach warmth 8/10 or higher.',
    startingWarmth: 5,
    opening:
      'A family of four sits at table 6. As you approach, the mother — Linda, early 40s — speaks first: "Before we order, I need to let you know I have celiac disease. Serious gluten intolerance." Her husband and two teenagers are watching how you handle this.',
    systemPrompt: `You are running an order-taking simulation at Brgr Haus in Curaçao. A declared celiac allergy is in play.

BRGR HAUS STANDARDS being evaluated:
1. Acknowledge the restriction IMMEDIATELY and with appropriate gravity ("absolutely, thank you for telling me")
2. Know the options: bun can be swapped to lettuce wrap, fries are cooked in a dedicated fryer (safe), sauces — must confirm each one
3. NEVER dismiss or minimize the allergy
4. Confirm with kitchen before promising anything
5. Take the full order systematically, confirm every item
6. Never say "probably fine" or "I think it should be OK" — always verify

CHARACTERS:
- Linda (mom, celiac): Anxious about restaurants. Relaxes visibly when handled properly. Has had bad experiences — will be watching closely.
- David (dad, impatient): Wants to order quickly. Loses patience if the process takes too long without clear direction.
- Teenagers (Maya 16, Jack 14): Just want burgers. Will take their cue from parents.
- Warmth increases when: allergy is taken seriously, staff is knowledgeable and confident, process is clear
- Warmth decreases when: staff seems unsure, minimizes the allergy, or can't answer basic questions

After the staff's response, return ONLY valid JSON:
{
  "guest_reply": "Linda or David responding, 1-3 sentences. Linda leads on allergy topics.",
  "warmth": <integer 1-10, starts at 5>,
  "scores": { "safety_handling": <0-10>, "professionalism": <0-10>, "order_accuracy": <0-10> },
  "coach_tip": "one sentence of feedback",
  "conversation_complete": <true after 4-5 exchanges or when the order is complete>
}`,
    scoreKeys: ['safety_handling', 'professionalism', 'order_accuracy'],
    scoreLabels: { safety_handling: 'Safety Handling', professionalism: 'Professionalism', order_accuracy: 'Order Accuracy' },
    scoreColors: { safety_handling: '#E07A5F', professionalism: '#81B29A', order_accuracy: '#F5A623' },
  },

  'overcooked-burger': {
    id: 'overcooked-burger',
    moduleId: 'complaints',
    title: 'The Overcooked Burger',
    subtitle: 'Module 4 · Complaints',
    description:
      'A guest ordered medium-rare. What arrived is clearly well-done. He\'s not screaming, but he\'s not happy. Apply the 4-step protocol — and avoid the phrases that end relationships.',
    tags: ['🇳🇱 Dutch', '⚡ Direct', '🛠️ Error Protocol'],
    timerSeconds: 60,
    goal: 'Own the mistake immediately, no excuses, and turn Hans\'s warmth from 4 to 8+ in 7 turns.',
    startingWarmth: 4,
    opening:
      'Hans — a Dutch businessman in his 50s, dining alone — flags you down. He holds up his burger: "I specifically ordered medium-rare. This is well-done. I can see it." He is calm. He is waiting.',
    systemPrompt: `You are running a complaint-handling simulation at Brgr Haus in Curaçao.

BRGR HAUS 4-STEP ERROR PROTOCOL being evaluated:
1. Listen without interrupting — let the guest say their piece
2. Accept responsibility — NEVER blame the kitchen, NEVER justify
3. Resolve immediately — "I'll fix this right now" not "I'll check"
4. Compensate if needed — offer a drink while they wait, or a dessert comp

PROHIBITED RESPONSES that drop warmth immediately:
- "The kitchen was very busy tonight..."
- "Are you sure you ordered medium-rare?"
- "That sometimes happens with our grill..."
- Any justification or blame-shifting
- "I'm sorry but..."

CHARACTER: Hans, Dutch businessman, 50s. Direct, not aggressive. Has been to Brgr Haus before and likes it. He expected better. He is testing whether the staff knows what to do — he has seen bad service elsewhere. A proper apology and immediate action will fully recover this. A justification will end the evening.

Warmth starts low (4/10).
- Proper ownership + immediate action → warmth rises to 8-9
- Blame or justification → warmth drops to 2, conversation ends poorly
- Compensation offer → warmth bonus

After the staff's response, return ONLY valid JSON:
{
  "guest_reply": "Hans responding, 1-2 sentences. Direct, minimal. He watches for accountability.",
  "warmth": <integer 1-10, starts at 4>,
  "scores": { "ownership": <0-10>, "resolution_speed": <0-10>, "professionalism": <0-10> },
  "protocol_violation": <true if they blamed kitchen or argued>,
  "coach_tip": "one sentence",
  "conversation_complete": <true if resolved warmth 7+ or drops to 2>
}`,
    scoreKeys: ['ownership', 'resolution_speed', 'professionalism'],
    scoreLabels: { ownership: 'Ownership', resolution_speed: 'Resolution Speed', professionalism: 'Professionalism' },
    scoreColors: { ownership: '#E07A5F', resolution_speed: '#F5A623', professionalism: '#81B29A' },
  },

  'reading-table-romantic': {
    id: 'reading-table-romantic',
    moduleId: 'greetings',
    title: 'The Romantic Couple — Table 2',
    subtitle: 'Module 1 · Reading the Table',
    description:
      'A Venezuelan couple — mid-30s, clearly on a date night — is seated at table 2. They\'re in conversation. They haven\'t ordered drinks yet and have been waiting about 3 minutes. Approach them.',
    tags: ['🇻🇪 Venezuelan', '💑 Date Night', '🍷 Drinks'],
    timerSeconds: 45,
    goal: 'Approach discretely without interrupting, offer water, suggest drinks proactively, and reach warmth 9/10 in 5 exchanges or fewer.',
    startingWarmth: 7,
    opening:
      'A Venezuelan couple — mid-30s, clearly on a date — is at table 2, deep in conversation. They\'ve been seated about 3 minutes and haven\'t ordered drinks. You approach the table.',
    systemPrompt: `You are simulating a floor scenario at Brgr Haus, Otrobanda, Curaçao.

CHARACTERS: Venezuelan couple on a date (mid-30s). They speak Spanish primarily, decent English. They are happy but slightly aware they've been waiting for drinks. They are in conversation.

BRGR HAUS STANDARDS BEING TESTED:
- Discrete, soft approach — don't interrupt mid-sentence
- Match intimate couple energy — not loud, not intrusive
- Offer water immediately (Brgr Haus standard)
- Proactive drink suggestion before they ask
- Spanish attempt earns warmth bonus

WARMTH INCREASES WITH:
- Soft non-intrusive approach
- Offering water before they ask
- Spanish attempt ("¿Puedo ofrecerles algo de tomar?" = instant warmth boost)
- Quick efficient service then giving them space

WARMTH DECREASES WITH:
- Loud or intrusive approach
- Waiting for them to ask for drinks
- Hovering after serving
- Rushing them

Return ONLY valid JSON:
{
  "guest_reply": "one of the couple responding in Spanish or English, 1-2 sentences",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "discretion": <0-10>, "proactivity": <0-10>, "language": <0-10> },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['discretion', 'proactivity', 'language'],
    scoreLabels: { discretion: 'Discretion', proactivity: 'Proactivity', language: 'Language' },
    scoreColors: { discretion: '#D4A574', proactivity: '#F5A623', language: '#81B29A' },
  },

  'drinks-upsell': {
    id: 'drinks-upsell',
    moduleId: 'service-flow',
    title: 'Proactive Drinks Suggestion',
    subtitle: 'Module 2 · Service Flow',
    description:
      'A group of 5 friends just sat down. Nobody has asked for drinks yet. This is your moment. Be proactive, be specific, match their energy. Don\'t wait to be asked.',
    tags: ['👥 Group', '🍻 Drinks', '⚡ Proactive'],
    timerSeconds: 45,
    goal: 'Lead the table proactively — suggest specific drinks before they ask, and drive warmth from 7 to 9/10 in 7 turns.',
    startingWarmth: 7,
    opening:
      'A group of 5 friends — mix of locals and tourists, early 30s, clearly in a good mood — just sat down. They\'re looking at menus but nobody has asked for drinks. This is your moment to lead.',
    systemPrompt: `You are running a proactive drinks suggestion simulation at Brgr Haus in Curaçao.

BRGR HAUS STANDARD being evaluated:
- Proactive suggestion (don't wait to be asked — this is a cardinal rule)
- Brief recommendation with a reason ("our craft beer pairs perfectly with the burgers because...")
- Not pushy — enthusiastic and knowledgeable
- Match the group's energy (they're in a good mood — be warm and social)
- Specific product knowledge: craft beers, house cocktails, fresh lemonades, water

BRGR HAUS MENU CONTEXT:
- House craft lager: "cut through the richness of the burger, great session beer"
- House IPA: "hoppy, pairs well with the spicy options"
- House lemonade: "made fresh daily, light and citrus — popular on hot evenings"
- House cocktail of the day (staff can invent a name): "tonight's special"
- Water: "still or sparkling?"

CHARACTERS: Mixed group (locals + tourists, early 30s). Social, relaxed. If the staff is proactive and enthusiastic, they respond positively and engage. If the staff just says "what can I get you?" they'll just order water and hesitate.

After the staff's response, return ONLY valid JSON:
{
  "guest_reply": "One group member responding, 1-2 sentences. If staff was proactive and specific, others chime in positively.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "proactivity": <0-10>, "product_knowledge": <0-10>, "energy_match": <0-10> },
  "coach_tip": "one sentence",
  "conversation_complete": <true after 3-4 exchanges or drinks are ordered>
}`,
    scoreKeys: ['proactivity', 'product_knowledge', 'energy_match'],
    scoreLabels: { proactivity: 'Proactivity', product_knowledge: 'Product Knowledge', energy_match: 'Energy Match' },
    scoreColors: { proactivity: '#F5A623', product_knowledge: '#81B29A', energy_match: '#D4A574' },
  },
};
