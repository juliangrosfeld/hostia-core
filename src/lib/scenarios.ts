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
      'A local Curaçaoan family — parents and two teenage kids — just walked through the door of [Property]. They look around expecting to be greeted. They\'ve been here before. They know good service when they see it. You have 5 seconds. Go.',
    tags: ['🇨🇼 Local', '👨‍👩‍👧‍👦 Family', '⚡ Timed'],
    timerSeconds: 45,
    goal: 'Greet the family within 5 seconds with genuine warmth. A Papiamentu attempt earns a big bonus. Hit warmth 9/10 in 4 exchanges or fewer.',
    startingWarmth: 6,
    opening:
      'A local Curaçaoan family — parents and two teenage kids — just stepped through the door of [Property]. They look around, expecting to be greeted. The parents make eye contact with you. Greet them.',
    systemPrompt: `You are simulating a greeting scenario at [Property], Curaçao. A local family just walked in.

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
      'An American tourist couple — 30s, first time at [Property] — are standing near the entrance looking a bit lost. Tables are available. They spot you and smile hopefully. Lead them.',
    systemPrompt: `You are simulating a seating scenario at [Property].

CHARACTERS: American tourist couple (30s), first time at [Property]. They look a bit lost. They respond well to warmth and confidence. They came because a friend recommended it.

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
      'A Dutch couple in their late 30s — smartly dressed — just walked through the door of [Property]. They\'re looking around, getting their bearings. It\'s a busy Tuesday evening. Apply everything: 5 seconds, lead in Dutch if you can, guide them — never point.',
    tags: ['🇳🇱 Dutch', '💑 Couple', '⚡ Timed'],
    timerSeconds: 45,
    goal: 'Greet the Dutch couple warmly in Dutch, guide them to the table, and reach warmth 9/10 in 7 turns or fewer.',
    startingWarmth: 6,
    opening:
      'A Dutch couple — Erik and Marieke, late 30s, smartly dressed — just walked through the door. They look around and find your eyes. Greet them.',
    systemPrompt: `You are running a hospitality greeting training simulation at [Property], a hospitality property in Curaçao.

SCENARIO: A Dutch couple (Erik and Marieke, late 30s) just arrived. They speak Dutch natively, excellent English. They heard about [Property] from a friend and are excited but slightly tired from sightseeing.

[PROPERTY] STANDARDS being evaluated:
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
    subtitle: 'Module 3 · Banned Phrases',
    description:
      'A table of 3 colleagues just finished their main course — Dutch, Venezuelan, and American. They look satisfied. Walk over and check in on their experience. The words you choose will define how they remember this meal.',
    tags: ['👥 Business Table', '🌍 Mixed Nationalities', '🗣️ Language Focus'],
    timerSeconds: 45,
    goal: 'Use a flavor-focused check-in (zero banned phrases) and push warmth from 7 to 9/10 in 5 exchanges or fewer.',
    startingWarmth: 7,
    opening:
      'Three colleagues — Pieter (Dutch), Valentina (Venezuelan), and Mark (American) — just finished their main course. They look pleased. You approach the table.',
    systemPrompt: `You are simulating a language quality scenario at [Property], Curaçao.

CHARACTERS: Three colleagues on a business lunch — Pieter (Dutch, direct), Valentina (Venezuelan, warm), and Mark (American, enthusiastic). Mixed nationalities. They are having a good time but notice exactly how staff speak to them.

[PROPERTY] LANGUAGE RULES BEING TESTED:
PENALIZE HARD — warmth drops 2 points immediately if staff says:
- "Is everything okay?" / "¿Todo bien?"
- "Did you like it?"
- "Everything good?"
- Any yes/no check-in phrase

REWARD — warmth increases 2 points if staff uses:
- Specific flavor-focused questions ("How did you find the balance of flavors?")
- Mentioning a specific dish by name ("What did you think of the [dish]?")
- "How did you find the..." or "¿Cómo les pareció...?"
- Genuine enthusiasm about what they ordered

Return ONLY valid JSON:
{
  "guest_reply": "One of the three responding naturally, 1-2 sentences. Flat and brief if a banned phrase was used. Engaged and conversational if good language was used.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "language_quality": <0-10>,
    "engagement": <0-10>,
    "professionalism": <0-10>
  },
  "violation": <true if any banned phrase was used, false otherwise>,
  "coach_tip": "One sentence — name the violation if it happened, or praise the specific language choice that worked.",
  "conversation_complete": <true after 5 exchanges>
}`,
    scoreKeys: ['language_quality', 'engagement', 'professionalism'],
    scoreLabels: { language_quality: 'Language Quality', engagement: 'Engagement', professionalism: 'Professionalism' },
    scoreColors: { language_quality: '#F5A623', engagement: '#D4A574', professionalism: '#81B29A' },
  },

  'describe-recommend': {
    id: 'describe-recommend',
    moduleId: 'language',
    title: 'What Do You Recommend?',
    subtitle: 'Module 3 · Describing What You Serve',
    description:
      'A solo American traveler looks up from the menu: "What do you recommend? I can\'t decide between the fish and the steak." This is your moment — use the 3-part formula and help them decide with confidence.',
    tags: ['🇺🇸 American', '👤 Solo Traveler', '🎯 Recommendation'],
    timerSeconds: 45,
    goal: 'Use the 3-part description formula (Star → Method → Experience) and help the guest decide confidently. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'A solo American traveler — mid-30s, adventurous eater, first time at [Property] — looks up from the menu. "What do you recommend? I honestly can\'t decide between the fish and the steak."',
    systemPrompt: `You are simulating a recommendation scenario at [Property], Curaçao.

CHARACTER: Tyler — solo American traveler, mid-30s, adventurous eater. First time at [Property]. He came because a friend told him the food was exceptional. He wants a recommendation, not a list. He responds well to confidence and genuine enthusiasm.

[PROPERTY] STANDARDS BEING TESTED — THE 3-PART FORMULA: Star → Method → Experience.

WARMTH INCREASES WITH:
- Confident, specific recommendation (not "they're both good")
- Using the description formula — lead with star ingredient, mention preparation, describe the experience
- Asking about preference first ("do you lean toward lighter or richer?")
- Genuine enthusiasm that feels personal, not scripted

WARMTH DECREASES WITH:
- "They're both good, you can't go wrong"
- Vague answers ("it depends on your mood")
- Reading the menu back to him
- Lacking confidence in the recommendation

[PROPERTY] DISH CONTEXT — staff may describe these:
- The fish: locally caught, pan-seared simply, served with charred lime and herb butter — clean, bright, light finish
- The steak: hand-selected cut, grilled on open flame, aged in-house — rich, deep, intense

Staff should ask about preference first, then use the formula to sell one confidently.

Return ONLY valid JSON:
{
  "guest_reply": "Tyler responding, 1-2 sentences. Excited if staff was specific and confident. Noncommittal if staff was vague.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "product_knowledge": <0-10>,
    "confidence": <0-10>,
    "description_quality": <0-10>
  },
  "coach_tip": "One sentence — name what worked or which formula step was missing.",
  "conversation_complete": <true after 5 exchanges or when Tyler makes a decision>
}`,
    scoreKeys: ['product_knowledge', 'confidence', 'description_quality'],
    scoreLabels: { product_knowledge: 'Product Knowledge', confidence: 'Confidence', description_quality: 'Description Quality' },
    scoreColors: { product_knowledge: '#81B29A', confidence: '#F5A623', description_quality: '#D4A574' },
  },

  'storytelling-property': {
    id: 'storytelling-property',
    moduleId: 'language',
    title: 'Tell Me About This Place',
    subtitle: 'Module 3 · Storytelling',
    description:
      'A curious tourist settles in and says: "So tell me — what makes this place different from everywhere else on the island?" This is your moment. Facts won\'t cut it. You need a story.',
    tags: ['🌍 Tourist', '❓ Curious', '📖 Storytelling'],
    timerSeconds: 45,
    goal: 'Answer with a genuine story (Origin, Process, or Guest Story) that makes this place feel different. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'A well-traveled solo tourist — curious, clearly used to asking the best questions — settles into his seat and looks at you directly. "So tell me — what makes this place different from everywhere else on the island? I\'ve been to a lot of places. Give me the real answer."',
    systemPrompt: `You are simulating a storytelling scenario at [Property], Curaçao.

CHARACTER: Rafael — well-traveled tourist, 40s, genuinely curious. He has been to many restaurants in many countries. He can detect a scripted answer immediately. He wants authenticity — and will respond powerfully to a real, specific story.

THE 3 STORY TYPES BEING TESTED:
1. Origin Story: Where did this place come from? The first dish? The owner's vision? The local connection?
2. Process Story: What's made differently here? What craft or technique sets [Property] apart?
3. Guest Story: What do returning guests always come back for? What moment do they remember?

WARMTH INCREASES WITH:
- Authentic, specific storytelling (something vivid and real-sounding)
- Combining two story types (Origin + Guest Story, for example)
- Showing genuine pride in the place
- Making Rafael feel like he just got the inside story, not the tourist answer

WARMTH DECREASES WITH:
- Generic answers: "great food, beautiful location"
- Listing facts without any narrative thread
- Corporate-sounding language ("we pride ourselves on...")
- Vague answers that say nothing specific or memorable

[PROPERTY] STORY CONTEXT — staff may use any of these authentically:
- The signature dish: created on the first night of service by the owner, guests kept requesting it specifically, everything else grew around it
- The beef: hand-ground daily in-house, specific blend, technique developed over time
- Local supplier relationships: ingredients sourced from specific local farms and fishermen
- Returning guests: regulars who come every week specifically for certain items

Return ONLY valid JSON:
{
  "guest_reply": "Rafael responding, 1-3 sentences. Leans forward and asks a follow-up if genuinely engaged. Polite but flat if given a generic answer.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "story_authenticity": <0-10>,
    "specificity": <0-10>,
    "engagement": <0-10>
  },
  "coach_tip": "One sentence — name the story type used (or missing) and whether it landed.",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9>
}`,
    scoreKeys: ['story_authenticity', 'specificity', 'engagement'],
    scoreLabels: { story_authenticity: 'Story Authenticity', specificity: 'Specificity', engagement: 'Engagement' },
    scoreColors: { story_authenticity: '#D4A574', specificity: '#F5A623', engagement: '#81B29A' },
  },

  'overcooked-complaint': {
    id: 'overcooked-complaint',
    moduleId: 'language',
    title: 'The Overcooked Complaint',
    subtitle: 'Module 3 · Difficult Conversations',
    description:
      'A Dutch professional flags you down. They ordered medium-rare. It arrived well-done. They\'re frustrated — not aggressive — but direct: "Excuse me — this isn\'t what I asked for." Apply the 4-step protocol.',
    tags: ['🇳🇱 Dutch', '💼 Professional', '⚠️ Complaint'],
    timerSeconds: 45,
    goal: 'Own the mistake immediately with no excuses, offer a concrete solution, and recover warmth from 4 to 8+ in 7 exchanges.',
    startingWarmth: 4,
    opening:
      'A Dutch professional — dining with a colleague, mid-40s — flags you down and holds up their plate. "Excuse me — this isn\'t what I asked for. I ordered medium-rare. This is clearly well-done. I\'d like it fixed."',
    systemPrompt: `You are simulating a complaint-handling scenario at [Property], Curaçao.

CHARACTER: Annemiek — Dutch professional, mid-40s, dining with a colleague. Direct, not aggressive. She expected better and she wants it fixed — not explained. She has seen poor complaint handling before and will not respond well to excuses, deflection, or blame.

THE 4-STEP PROTOCOL BEING TESTED:
1. LISTEN — don't interrupt, don't jump to explanation
2. ACKNOWLEDGE — "You're absolutely right, and I'm sorry"
3. RESOLVE — concrete solution immediately: "Let me get that replaced right now"
4. FOLLOW UP — check back after the fix

WARMTH INCREASES WITH:
- Immediate ownership ("You're absolutely right")
- Concrete offer to fix it right now
- Offering something while they wait (beverage, amuse-bouche)
- Checking back after the replacement arrives

WARMTH DECREASES WITH:
- Any defending, blaming, or explaining
- "The kitchen was very busy..."
- "Are you sure you ordered medium-rare?"
- "That sometimes happens with our grill..."
- "I'm sorry but..." — the but cancels everything before it

Return ONLY valid JSON:
{
  "guest_reply": "Annemiek responding, 1-2 sentences. Direct, minimal. She is watching closely for accountability.",
  "warmth": <integer 1-10, starts at 4>,
  "scores": {
    "ownership": <0-10>,
    "resolution_speed": <0-10>,
    "professionalism": <0-10>
  },
  "violation": <true if staff defended, deflected, or blamed — false if they owned it cleanly>,
  "coach_tip": "One sentence — name the violation if it happened, or confirm which protocol step they executed well.",
  "conversation_complete": <true if warmth reaches 7+ or drops to 2>
}`,
    scoreKeys: ['ownership', 'resolution_speed', 'professionalism'],
    scoreLabels: { ownership: 'Ownership', resolution_speed: 'Resolution Speed', professionalism: 'Professionalism' },
    scoreColors: { ownership: '#E07A5F', resolution_speed: '#F5A623', professionalism: '#81B29A' },
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
    systemPrompt: `You are running an order-taking simulation at [Property] in Curaçao. A declared celiac allergy is in play.

[PROPERTY] STANDARDS being evaluated:
1. Acknowledge the restriction IMMEDIATELY and with appropriate gravity ("absolutely, thank you for telling me")
2. Know the options: dishes can be modified, certain items are safe, sauces — must confirm each one
3. NEVER dismiss or minimize the allergy
4. Confirm with kitchen before promising anything
5. Take the full order systematically, confirm every item
6. Never say "probably fine" or "I think it should be OK" — always verify

CHARACTERS:
- Linda (mom, celiac): Anxious about restaurants. Relaxes visibly when handled properly. Has had bad experiences — will be watching closely.
- David (dad, impatient): Wants to order quickly. Loses patience if the process takes too long without clear direction.
- Teenagers (Maya 16, Jack 14): Just want to order. Will take their cue from parents.
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
    title: 'The Overcooked Menu Item',
    subtitle: 'Module 4 · Complaints',
    description:
      'A guest ordered medium-rare. What arrived is clearly well-done. He\'s not screaming, but he\'s not happy. Apply the 4-step protocol — and avoid the phrases that end relationships.',
    tags: ['🇳🇱 Dutch', '⚡ Direct', '🛠️ Error Protocol'],
    timerSeconds: 60,
    goal: 'Own the mistake immediately, no excuses, and turn Hans\'s warmth from 4 to 8+ in 7 turns.',
    startingWarmth: 4,
    opening:
      'Hans — a Dutch businessman in his 50s, dining alone — flags you down. He holds up his dish: "I specifically ordered medium-rare. This is well-done. I can see it." He is calm. He is waiting.',
    systemPrompt: `You are running a complaint-handling simulation at [Property] in Curaçao.

[PROPERTY] 4-STEP ERROR PROTOCOL being evaluated:
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

CHARACTER: Hans, Dutch businessman, 50s. Direct, not aggressive. Has been to [Property] before and likes it. He expected better. He is testing whether the staff knows what to do — he has seen bad service elsewhere. A proper apology and immediate action will fully recover this. A justification will end the evening.

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
    systemPrompt: `You are simulating a floor scenario at [Property], Curaçao.

CHARACTERS: Venezuelan couple on a date (mid-30s). They speak Spanish primarily, decent English. They are happy but slightly aware they've been waiting for drinks. They are in conversation.

[PROPERTY] STANDARDS BEING TESTED:
- Discrete, soft approach — don't interrupt mid-sentence
- Match intimate couple energy — not loud, not intrusive
- Offer water immediately ([Property] standard)
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
    systemPrompt: `You are running a proactive drinks suggestion simulation at [Property] in Curaçao.

[PROPERTY] STANDARD being evaluated:
- Proactive suggestion (don't wait to be asked — this is a cardinal rule)
- Brief recommendation with a reason ("our craft beer pairs perfectly with the menu items because...")
- Not pushy — enthusiastic and knowledgeable
- Match the group's energy (they're in a good mood — be warm and social)
- Specific product knowledge: craft beers, house cocktails, fresh lemonades, water

[PROPERTY] MENU CONTEXT:
- House craft lager: "cut through the richness of the dish, great session beer"
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

  'full-service-run': {
    id: 'full-service-run',
    moduleId: 'service-flow',
    title: 'Table 4 — Full Service Run',
    subtitle: 'Module 2 · The 10-Step Sequence',
    description:
      'A couple has just been seated at table 4 for their anniversary dinner. They look relaxed and happy. Walk them through the complete service experience — from first contact to close.',
    tags: ['💑 Anniversary', '🎯 Full Run', '⭐ Complete Flow'],
    timerSeconds: 45,
    goal: 'Run the full service sequence — offer water, suggest drinks, take the order, follow up, offer dessert, and close personally. Reach warmth 9/10.',
    startingWarmth: 7,
    opening:
      'Sophie and Marco — a couple in their mid-40s celebrating their anniversary — have just been seated at table 4. They look relaxed and happy. They\'ve been here before and are looking forward to the evening. You approach.',
    systemPrompt: `You are simulating a complete service scenario at [Property].

CHARACTERS: Sophie and Marco, mid-40s, celebrating their anniversary. They are warm and easy to please but notice the small details of service quality. They've been here before — they know what good service feels like.

STANDARDS BEING TESTED:
- Offer water immediately without being asked
- Proactive drink suggestion with brief explanation
- Confirm order accurately
- Check back 2-3 minutes after food arrives with a flavor-focused question (never "is everything okay?")
- Never interrupt their conversation mid-sentence
- Offer dessert before they ask
- Close with their names and a personal touch

WARMTH INCREASES WITH: anticipating needs before asked, smooth non-intrusive service, personal touches (mentioning the anniversary), using their names.
WARMTH DECREASES WITH: waiting to be asked for everything, interrupting conversations, rushing them, generic check-ins ("is everything okay?").

Return ONLY valid JSON:
{
  "guest_reply": "Sophie or Marco responding, 1-2 sentences",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "anticipation": <0-10>,
    "flow": <0-10>,
    "professionalism": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 7 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['anticipation', 'flow', 'professionalism'],
    scoreLabels: { anticipation: 'Anticipation', flow: 'Service Flow', professionalism: 'Professionalism' },
    scoreColors: { anticipation: '#F5A623', flow: '#81B29A', professionalism: '#D4A574' },
  },

  'two-minute-check': {
    id: 'two-minute-check',
    moduleId: 'service-flow',
    title: 'The 2-Minute Check',
    subtitle: 'Module 2 · Language of Service',
    description:
      'A table of 4 just received their food 2 minutes ago. They\'re eating and seem to be enjoying it. Time for your check-in. Choose your words carefully.',
    tags: ['👥 Group', '🗣️ Language', '⏱️ Timed'],
    timerSeconds: 45,
    goal: 'Use a specific, flavor-focused check-in (no banned phrases). Push warmth from 7 to 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'A table of 4 friends — mix of ages, clearly enjoying themselves — received their food 2 minutes ago. They\'re eating and seem pleased. You approach for your follow-up check.',
    systemPrompt: `You are running a language-of-service simulation at [Property].

[PROPERTY] LANGUAGE RULES being tested:
BANNED PHRASES (trigger warmth drop of 2 and coaching note):
- "Is everything okay?"
- "Everything good?"
- "Did you enjoy it?"
- Any generic OK-check

CORRECT APPROACH (trigger warmth increase):
- "How are you finding the flavors?"
- "What do you think of the [specific dish]?"
- Any flavor-specific or experience-focused question
- Mentioning a specific dish by name earns warmth bonus

CHARACTERS: Four friends (mix of 30s-40s), relaxed and happy. They respond warmly to genuine interest in their experience. A generic check-in gets a polite "yes, fine" and no more. A specific, flavor-focused question opens a real conversation.

After the staff's response, return ONLY valid JSON:
{
  "guest_reply": "one of the four responding, 1-2 sentences. Flat if banned phrase was used. Engaged if specific language was used.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "language_quality": <0-10>, "specificity": <0-10>, "professionalism": <0-10> },
  "violation": <true if banned phrase was used, false otherwise>,
  "coach_tip": "one precise sentence of feedback",
  "conversation_complete": <true after 3 exchanges>
}`,
    scoreKeys: ['language_quality', 'specificity', 'professionalism'],
    scoreLabels: { language_quality: 'Language Quality', specificity: 'Specificity', professionalism: 'Professionalism' },
    scoreColors: { language_quality: '#F5A623', specificity: '#81B29A', professionalism: '#D4A574' },
  },

  'proactive-floor-signal': {
    id: 'proactive-floor-signal',
    moduleId: 'service-flow',
    title: 'The Non-Verbal Signal',
    subtitle: 'Module 2 · Proactive Service',
    description:
      'A guest at table 7 is showing clear non-verbal signals that they need attention — without waving or calling out. Will you catch it before they have to ask?',
    tags: ['👁️ Observation', '⚡ Proactive', '🎯 Anticipation'],
    timerSeconds: 45,
    goal: 'Read and act on the non-verbal signal before the guest has to verbally ask. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 6,
    opening:
      'You\'re scanning the floor. At table 7, a solo guest — a Dutch businesswoman in her 40s — has finished her meal, placed her cutlery neatly down, and has been looking around the room for about 30 seconds. She hasn\'t waved. She hasn\'t called out. She\'s waiting.',
    systemPrompt: `You are simulating a proactive service scenario at [Property].

CHARACTERS: Ineke — Dutch businesswoman, 40s, dining alone. Direct but not unkind. She notices when service is proactive vs reactive. She has been waiting 30 seconds without anyone approaching — warmth starts slightly below neutral.

STANDARDS BEING TESTED:
- Reading the non-verbal signal before being asked
- Approaching with intention and the right offer (dessert menu? bill? coffee?)
- Matching her direct, efficient communication style
- Not hovering — read the signal, act, then give space

WARMTH INCREASES WITH:
- Approaching before she has to ask
- Correctly reading what she needs (she's done with the meal — offer dessert menu or the close)
- Efficient, direct service matching her Dutch communication style
- Not over-explaining or over-talking

WARMTH DECREASES WITH:
- Making her wait any longer
- Approaching and asking "can I help you?" without reading the room
- Over-enthusiastic or lengthy service exchange
- Missing what she actually needs

Return ONLY valid JSON:
{
  "guest_reply": "Ineke responding, 1-2 sentences. Direct. Slightly warmer if staff read the room correctly.",
  "warmth": <integer 1-10, starts at 6>,
  "scores": { "anticipation": <0-10>, "reading": <0-10>, "efficiency": <0-10> },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 4 exchanges or warmth reaches 9>
}`,
    scoreKeys: ['anticipation', 'reading', 'efficiency'],
    scoreLabels: { anticipation: 'Anticipation', reading: 'Signal Reading', efficiency: 'Efficiency' },
    scoreColors: { anticipation: '#F5A623', reading: '#81B29A', efficiency: '#D4A574' },
  },

  'nonverbal-observation': {
    id: 'nonverbal-observation',
    moduleId: 'service-flow',
    title: 'The Floor Scan',
    subtitle: 'Module 2 · Reading Signals',
    description:
      'Your floor trainer walks the floor with you and describes three tables. For each one: tell her what\'s happening and what you\'d do.',
    tags: ['👁️ Observation', '📋 Assessment', '🎓 Training'],
    timerSeconds: 45,
    goal: 'Correctly read and respond to all 3 table scenarios. Score 8/10 or above on signal reading.',
    startingWarmth: 7,
    opening:
      'Your floor trainer, Ana, stops beside you during the dinner rush. "Quick floor check — I\'ll describe what I see at three tables. You tell me what\'s happening and what you\'d do. Ready? Table 3: couple, menus closed, both leaning back. What do you see?"',
    systemPrompt: `You are playing Ana, a sharp floor trainer at [Property], conducting a real-time signal-reading assessment.

THREE TABLE SCENARIOS to present one at a time:
1. Table 3: couple, menus closed, both leaning back.
   CORRECT: They're ready to order — approach calmly and take their order.

2. Table 7: group of 4, two empty plates, two still eating. One person keeps glancing at their watch.
   CORRECT: Don't clear — someone is still eating. The watch-glancer may be on a schedule; offer to move the next course along after everyone finishes.

3. Table 12: solo guest, phone on table, eating quickly, hasn't looked up once.
   CORRECT: Efficient, minimal check-in — no small talk. Process payment quickly when they're done.

SCORING:
- Correct signal reading + right action → warmth increases, high scores
- Missed signal or wrong action → coaching note, warmth holds
- You can ask a short follow-up if the answer is only partially right

Return ONLY valid JSON:
{
  "guest_reply": "Ana responding as trainer, 1-2 sentences. Affirm what's right, redirect what's wrong. Present the next table scenario when the previous one is resolved.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "signal_reading": <0-10>, "action_quality": <0-10>, "floor_awareness": <0-10> },
  "coach_tip": "one specific sentence about the most recent response",
  "conversation_complete": <true after all 3 tables have been assessed>
}`,
    scoreKeys: ['signal_reading', 'action_quality', 'floor_awareness'],
    scoreLabels: { signal_reading: 'Signal Reading', action_quality: 'Action Quality', floor_awareness: 'Floor Awareness' },
    scoreColors: { signal_reading: '#F5A623', action_quality: '#81B29A', floor_awareness: '#D4A574' },
  },

  'first-tray-full-room': {
    id: 'first-tray-full-room',
    moduleId: 'physical-craft',
    title: 'First Tray, Full Room',
    subtitle: 'Module 2 · Tray Carrying',
    description:
      "It's your first week. The kitchen just loaded your tray: 3 mains, 2 side dishes, 2 water glasses. The tray is heavier than anything you've practiced with. Table 4 is across a busy floor. Go.",
    tags: ['🍽️ Tray Service', '⚡ First Week', '🎯 Technique'],
    timerSeconds: 45,
    goal: 'Describe checking tray balance, planning your route, and carrying with correct grip and body position. Score 8/10 on technique.',
    startingWarmth: 6,
    opening:
      "It's your first week on the floor. The kitchen just loaded your tray: 3 main courses, 2 side dishes, 2 water glasses. It's heavier than anything you've practiced with. The floor is busy. Table 4 is across the room. Your senior colleague is watching. How do you approach this?",
    systemPrompt: `You are a senior colleague watching a new server carry their first real tray on a busy service night. You observe their technique and coach them.

Evaluate based on:
- Did they describe checking the tray balance before lifting?
- Did they plan their route?
- Correct grip described (left hand, palm open, fingers spread)?
- Correct body position (shoulder height, head up, face forward)?
- Confidence level in their approach?

REWARD: describing good technique, checking balance first, planning route, asking for help if genuinely unsure, steady approach over rushed.
PENALIZE: rushing, describing dangerous shortcuts, ignoring the weight, overconfidence without checking stability, describing wrist-carrying or carrying in front of the body.

Return ONLY valid JSON:
{
  "guest_reply": "Senior colleague responding with observation or coaching tip, 1-2 sentences",
  "warmth": <integer 1-10, starts at 6>,
  "scores": {
    "technique": <0-10>,
    "safety": <0-10>,
    "confidence": <0-10>
  },
  "coach_tip": "one specific technique note",
  "conversation_complete": <true after 5 exchanges>
}`,
    scoreKeys: ['technique', 'safety', 'confidence'],
    scoreLabels: { technique: 'Technique', safety: 'Safety', confidence: 'Confidence' },
    scoreColors: { technique: '#8B7355', safety: '#E07A5F', confidence: '#F5A623' },
  },

  'table-6-main-course': {
    id: 'table-6-main-course',
    moduleId: 'physical-craft',
    title: 'Table 6 — Main Course',
    subtitle: 'Module 2 · Plate Carrying',
    description:
      'Three mains are up: a fish, a steak, and a pasta. The table is 3 guests. Your colleagues are busy. How do you carry and serve them?',
    tags: ['🍽️ Plate Carrying', '👥 3-Top', '⚡ Solo Service'],
    timerSeconds: 45,
    goal: 'Describe your plate carry technique correctly (1, 2, or 3 plates) and explain how you serve safely and professionally.',
    startingWarmth: 7,
    opening:
      'Three mains are up at the kitchen window: a fish, a steak, and a pasta for table 6. The table has 3 guests. Your colleagues are busy with other tables. How do you carry these and serve them?',
    systemPrompt: `You are a floor trainer evaluating a server's plate carrying and serving technique at [Property].

THE CORRECT APPROACH:
- Option A: 3-plate carry (right hand two plates, third on forearm) if confident and practiced
- Option B: Two clean 2-plate trips — the SAFE choice if not fully practiced
- Either is acceptable. A safe 2-trip carry beats a shaky 3-plate every time.

EVALUATE:
- Correct grip described (three middle fingers, thumb muscle for second plate)?
- Plates kept level — no tilting?
- Serving from the correct side?
- Safe decision-making (if unsure about 3 plates, do 2 trips)?

REWARD: correct technique, safety-first thinking, confidence balanced with caution, clean description of the carry.
PENALIZE: tilting plates, covering food with thumb, rushing, describing unsafe carries, stacking plates being served.

Return ONLY valid JSON:
{
  "guest_reply": "Floor trainer responding with coaching, 1-2 sentences",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "technique": <0-10>,
    "presentation": <0-10>,
    "safety": <0-10>
  },
  "coach_tip": "one specific technique note",
  "conversation_complete": <true after 5 exchanges>
}`,
    scoreKeys: ['technique', 'presentation', 'safety'],
    scoreLabels: { technique: 'Technique', presentation: 'Presentation', safety: 'Safety' },
    scoreColors: { technique: '#8B7355', presentation: '#D4A574', safety: '#E07A5F' },
  },

  'busy-saturday': {
    id: 'busy-saturday',
    moduleId: 'physical-craft',
    title: 'The Busy Saturday',
    subtitle: 'Module 2 · Floor Movement',
    description:
      "It's peak service — every table seated, kitchen firing, two colleagues crossing your path. You have a tray of drinks for table 3 and you just noticed table 7 is looking around. What's your move?",
    tags: ['🚶 Floor Movement', '⚡ Peak Service', '🎯 Prioritization'],
    timerSeconds: 45,
    goal: "Navigate the busy floor correctly, prioritize table 7's signal, and describe your movement and decision-making.",
    startingWarmth: 6,
    opening:
      "Peak Saturday service — every table is seated, the kitchen is firing, and two colleagues are crossing your path. You are carrying a tray of drinks for table 3 and have just noticed that table 7 is looking around the room for attention. Walk me through your move.",
    systemPrompt: `You are a floor captain evaluating a server's floor movement decisions during peak service at [Property].

THE CORRECT APPROACH:
- Continue to table 3 first (carry the tray safely to completion)
- Acknowledge table 7 with eye contact and a brief nod — signal you've seen them
- After delivering table 3's drinks, immediately attend to table 7
- Maintain correct floor movement: right side of pathways, smooth pace, not rushing

REWARD: prioritizing the current carry, acknowledging table 7 non-verbally, smooth purposeful movement, correct prioritization.
PENALIZE: rushing and risking the tray, ignoring table 7 entirely, stopping mid-floor to deal with table 7 while carrying drinks, describing frantic or panicked movement.

Return ONLY valid JSON:
{
  "guest_reply": "Floor captain responding with observation or coaching, 1-2 sentences",
  "warmth": <integer 1-10, starts at 6>,
  "scores": {
    "prioritization": <0-10>,
    "floor_awareness": <0-10>,
    "composure": <0-10>
  },
  "coach_tip": "one specific coaching note on movement or decision",
  "conversation_complete": <true after 5 exchanges>
}`,
    scoreKeys: ['prioritization', 'floor_awareness', 'composure'],
    scoreLabels: { prioritization: 'Prioritization', floor_awareness: 'Floor Awareness', composure: 'Composure' },
    scoreColors: { prioritization: '#F5A623', floor_awareness: '#81B29A', composure: '#8B7355' },
  },

  'pre-service-inspection': {
    id: 'pre-service-inspection',
    moduleId: 'physical-craft',
    title: 'Pre-Service Inspection',
    subtitle: 'Module 2 · Table Setting',
    description:
      'The manager does a walk-through in 10 minutes. You have 6 tables to reset and check. Table 3 has a smudged glass, table 5 has misaligned cutlery, and table 6 is missing a napkin. Walk through your approach.',
    tags: ['🍽️ Table Setting', '⏱️ Pre-Service', '✓ Standards'],
    timerSeconds: 45,
    goal: 'Demonstrate correct pre-service table setting standards and systematic approach to resetting multiple tables.',
    startingWarmth: 7,
    opening:
      "The manager is doing a walk-through in 10 minutes. You have 6 tables to check and reset. You've already spotted three problems: table 3 has a smudged glass, table 5 has misaligned cutlery, and table 6 is missing a napkin. Walk me through exactly how you approach this.",
    systemPrompt: `You are a head server evaluating a team member's pre-service table setting process at [Property].

THE CORRECT APPROACH:
- Start systematically — don't jump around randomly between tables
- Table 3: remove the smudged glass, re-polish with a clean lint-free cloth, hold to light to check, return to position
- Table 5: realign cutlery parallel, fork left of plate, knife right with blade inward, spoon to right of knife
- Table 6: add a cleanly folded napkin to the correct position (on plate or left of fork)
- Then check all remaining tables against the full pre-service checklist
- The golden rule: never seat a guest at a table you would not be proud to sit at yourself

REWARD: systematic approach, correct standards knowledge (blade inward, glass by stem only, consistent napkin folding), efficient prioritization.
PENALIZE: placing smudged glass back without full re-polish, ignoring the light test, describing shortcuts, missing parts of the checklist.

Return ONLY valid JSON:
{
  "guest_reply": "Head server responding with observation or follow-up question, 1-2 sentences",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "standards_knowledge": <0-10>,
    "efficiency": <0-10>,
    "attention_to_detail": <0-10>
  },
  "coach_tip": "one specific standards note",
  "conversation_complete": <true after 5 exchanges>
}`,
    scoreKeys: ['standards_knowledge', 'efficiency', 'attention_to_detail'],
    scoreLabels: { standards_knowledge: 'Standards Knowledge', efficiency: 'Efficiency', attention_to_detail: 'Attention to Detail' },
    scoreColors: { standards_knowledge: '#8B7355', efficiency: '#F5A623', attention_to_detail: '#D4A574' },
  },

  'six-top-all-at-once': {
    id: 'six-top-all-at-once',
    moduleId: 'physical-craft',
    title: 'The 6-Top — All At Once',
    subtitle: 'Module 2 · Synchronized Service',
    description:
      'Table 8 is a group of 6. All 6 mains are ready. You have yourself and one runner. How do you get all 6 plates out simultaneously and correctly?',
    tags: ['👥 6-Top', '🎯 Synchronized', '🤝 Team Service'],
    timerSeconds: 45,
    goal: 'Coordinate a perfect synchronized service for 6 guests with one runner. All plates go out together, within 3 seconds.',
    startingWarmth: 7,
    opening:
      'Table 8 — a group of 6 — has all their mains ready at the kitchen window. You have yourself and one runner, Marco. You need all 6 plates on the table simultaneously. How do you coordinate and execute this?',
    systemPrompt: `You are Marco, the runner at [Property], waiting for direction from the server on how to coordinate the 6-plate service for table 8.

THE CORRECT APPROACH:
- Server assigns which plates Marco carries (2-3 plates each, or use a tray)
- Agree on who serves which guests — assign by position around the table
- Both approach the table from opposite sides simultaneously
- All plates placed within 3 seconds of each other — the 3-second rule
- Silent communication confirmed with a nod before approaching
- No verbal coordination at or near the table — guests should not see the coordination

REWARD: clear assignment of plates before approaching, 3-second rule mentioned, silent nod confirmation, approaching from correct sides simultaneously, all plates placed together.
PENALIZE: any approach that results in plates arriving at different times, verbal coordination at the table, forgetting to assign which server takes which guests, not planning route before approaching.

Return ONLY valid JSON:
{
  "guest_reply": "Marco responding as runner, 1-2 sentences confirming or clarifying the coordination plan",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "coordination": <0-10>,
    "timing": <0-10>,
    "standards_knowledge": <0-10>
  },
  "coach_tip": "one specific note on the coordination plan",
  "conversation_complete": <true after 5 exchanges or when table 8 is successfully coordinated>
}`,
    scoreKeys: ['coordination', 'timing', 'standards_knowledge'],
    scoreLabels: { coordination: 'Coordination', timing: 'Timing', standards_knowledge: 'Standards Knowledge' },
    scoreColors: { coordination: '#8B7355', timing: '#F5A623', standards_knowledge: '#81B29A' },
  },

  'silent-table': {
    id: 'silent-table',
    moduleId: 'complaints',
    title: 'The Silent Table',
    subtitle: 'Module 5 · The Mindset Shift',
    description:
      'Table 6 — a couple — ordered 35 minutes ago. Their food hasn\'t arrived. They haven\'t flagged anyone. You walk past and notice they\'re quiet, not talking, occasionally glancing toward the kitchen. Go.',
    tags: ['🇳🇱 Dutch', '💑 Couple', '⚡ Proactive'],
    timerSeconds: 45,
    goal: 'Approach proactively without being flagged, own the problem immediately, and offer a concrete solution. Recover warmth from 5 to 8+ in 5 exchanges.',
    startingWarmth: 5,
    opening:
      'Table 6 — a Dutch couple — ordered 35 minutes ago. The food hasn\'t arrived. They haven\'t flagged anyone. You\'re walking past and notice they\'re sitting in silence, occasionally glancing toward the kitchen. They have not looked at you. Go.',
    systemPrompt: `You are playing a couple at table 6 who have been waiting 35 minutes for their food. You are frustrated but non-confrontational — you haven't said anything yet. You are Dutch (direct but not aggressive). You want this fixed, not explained.

STANDARDS BEING TESTED:
- Did the staff notice without being flagged?
- Did they approach proactively?
- Did they own the problem immediately without excuses?
- Did they offer a concrete solution or update?

WARMTH INCREASES WITH:
- Approaching without being asked
- Immediate ownership ("I'm so sorry, let me find out right now")
- Offering something while they wait (bread, drinks)
- Concrete timeline given ("I'll be back in 2 minutes")

WARMTH DECREASES WITH:
- Waiting to be flagged
- Making excuses ("the kitchen is busy")
- Vague answers ("it should be soon")
- Defensive or uncertain tone

Return ONLY valid JSON:
{
  "guest_reply": "one of the couple responding, 1-2 sentences, direct Dutch tone",
  "warmth": <integer 1-10, starts at 5>,
  "scores": {
    "proactivity": <0-10>,
    "ownership": <0-10>,
    "solution": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['proactivity', 'ownership', 'solution'],
    scoreLabels: { proactivity: 'Proactivity', ownership: 'Ownership', solution: 'Solution' },
    scoreColors: { proactivity: '#E07A5F', ownership: '#F5A623', solution: '#81B29A' },
  },

  'wrong-order-allergy': {
    id: 'wrong-order-allergy',
    moduleId: 'complaints',
    title: 'The Wrong Order',
    subtitle: 'Module 5 · The LEARN Protocol',
    description:
      'A guest at table 3 calls you over. Their expression is tight. "I ordered the fish. This is chicken. I have a shellfish allergy and I wanted to make sure there was no cross-contamination. This is not what I ordered."',
    tags: ['🇺🇸 American', '⚠️ Allergy', '🛠️ LEARN Protocol'],
    timerSeconds: 45,
    goal: 'Apply the full LEARN protocol — listen, empathize (addressing the allergy specifically), apologize unconditionally, resolve with a concrete plan, and commit to follow-up. Reach warmth 8+ in 6 exchanges.',
    startingWarmth: 4,
    opening:
      'A guest at table 3 — American, mid-30s, dining with a colleague — calls you over. Their expression is tight. "I ordered the fish. This is chicken. I have a shellfish allergy and I wanted to make sure there was no cross-contamination. This is not what I ordered."',
    systemPrompt: `You are playing a guest who ordered fish, received chicken, and has a shellfish allergy. You are not aggressive but you are genuinely concerned about the allergy and frustrated about the error. American, mid-30s, dining with a colleague.

THE LEARN PROTOCOL BEING TESTED:
L: Did they listen fully before responding?
E: Did they acknowledge the allergy concern specifically — not just the wrong dish?
A: Was the apology direct and unconditional?
R: Did they offer a concrete resolution with a timeline?
N: Did they commit to following up?

WARMTH INCREASES WITH:
- Immediate ownership of the error
- The allergy concern being taken seriously and addressed specifically
- Concrete resolution offered fast ("I'm replacing this right now and confirming with the kitchen about cross-contamination")
- Commitment to follow up after the fix

WARMTH DECREASES WITH:
- Excuses or defensive tone
- Acknowledging the wrong dish but ignoring the allergy concern
- Vague solutions ("let me see what I can do")
- Questioning the guest ("are you sure you ordered fish?")

Return ONLY valid JSON:
{
  "guest_reply": "guest responding in 1-2 sentences",
  "warmth": <integer 1-10, starts at 4>,
  "scores": {
    "listening": <0-10>,
    "empathy": <0-10>,
    "resolution": <0-10>
  },
  "allergy_acknowledged": <true if staff specifically addressed the allergy concern, false otherwise>,
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['listening', 'empathy', 'resolution'],
    scoreLabels: { listening: 'Listening', empathy: 'Empathy', resolution: 'Resolution' },
    scoreColors: { listening: '#81B29A', empathy: '#D4A574', resolution: '#E07A5F' },
  },

  'billing-dispute': {
    id: 'billing-dispute',
    moduleId: 'complaints',
    title: 'Table 9 — Billing Dispute',
    subtitle: 'Module 5 · The Most Common Situations',
    description:
      'The table is finishing up. You bring the bill. The guest looks at it, frowns, and says: "This isn\'t right. We didn\'t order two of these — and what is this charge for?"',
    tags: ['🇻🇪 Venezuelan', '💑 Couple', '🧾 Billing'],
    timerSeconds: 45,
    goal: 'Handle the billing dispute without arguing — look at it together, acknowledge the error immediately when found, and fix it fast. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'A Venezuelan couple — end of their meal, otherwise a lovely evening — look at the bill you\'ve just placed down. The guest frowns. "This isn\'t right. We didn\'t order two of these — and what is this charge for?"',
    systemPrompt: `You are playing a Venezuelan couple at the end of what was otherwise a good meal at [Property]. You are warm but firm about the bill — there is a duplicate charge and you want it corrected. You are right.

CONTEXT: There is one duplicate charge on the bill. When the staff looks at it with you, they will find it. You are not aggressive — but you are direct and you want this resolved cleanly.

STANDARDS BEING TESTED:
- Never question or argue ("that's what our system shows")
- Look at the bill together with the guest
- Acknowledge the error immediately when found
- Fix it fast and apologize sincerely
- A small gesture for the inconvenience is not required but rewarded

WARMTH INCREASES WITH:
- Looking at the bill together without defensiveness
- Acknowledging the error immediately ("you're absolutely right, I'm so sorry")
- Fixing it on the spot
- A small gesture: complimentary coffee/dessert for the inconvenience

WARMTH DECREASES WITH:
- Defending the bill before checking ("our system is always accurate")
- Questioning whether they ordered the item
- Delay in resolving
- No apology when the error is confirmed

Return ONLY valid JSON:
{
  "guest_reply": "one of the couple responding, 1-2 sentences, warm but firm tone",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "ownership": <0-10>,
    "accuracy": <0-10>,
    "recovery": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['ownership', 'accuracy', 'recovery'],
    scoreLabels: { ownership: 'Ownership', accuracy: 'Accuracy', recovery: 'Recovery' },
    scoreColors: { ownership: '#E07A5F', accuracy: '#F5A623', recovery: '#81B29A' },
  },

  'read-the-room': {
    id: 'read-the-room',
    moduleId: 'complaints',
    title: 'Read the Room',
    subtitle: 'Module 5 · Prevention Over Recovery',
    description:
      'You\'re doing a floor pass. Three tables need your attention. Table 2: couple, food arrived 5 minutes ago, barely touched, not talking. Table 5: group of 4, almost finished, no drinks left. Table 7: solo businessman, 18 minutes since order, food not yet arrived. You have 60 seconds. What\'s your move?',
    tags: ['👁️ Observation', '🎯 Prioritization', '⚡ Prevention'],
    timerSeconds: 60,
    goal: 'Correctly prioritize the three tables (table 7 is most urgent), approach proactively, and read the correct warning signs. Score 8/10 on prioritization.',
    startingWarmth: 6,
    opening:
      'You\'re doing a floor pass during service. You notice: Table 2 — a couple, food arrived 5 minutes ago, barely touched, sitting in silence. Table 5 — a group of 4, laughing, almost finished, no drinks left. Table 7 — a solo businessman, looking at his watch twice in 2 minutes, food has not yet arrived (18 minutes since order). You have 60 seconds. Which table do you approach first, and what do you do?',
    systemPrompt: `You are playing whichever table the staff approaches first.

If staff approaches TABLE 7 FIRST (CORRECT): Play the businessman — he has a meeting in 45 minutes and is getting anxious. He has not flagged anyone. He is direct but not rude. He wants to know when his food is coming.

If staff approaches TABLE 2 FIRST (acceptable but not optimal): Play the couple — their food is cold, the sauce has separated, they didn't want to make a scene. They're relieved someone noticed.

If staff approaches TABLE 5 FIRST (incorrect — least urgent): Play the group — they're happy, they just need another round of drinks. Coach the staff that Table 7 was more urgent.

SCORING:
- Table 7 first → highest prioritization score (18-min wait, time pressure, no food yet)
- Table 2 second → good signal reading (food issue, silent dissatisfaction)
- Table 5 third → least urgent (happy guests, simple need)

WARMTH INCREASES WITH:
- Approaching the most urgent table first
- Proactive approach without being flagged
- Correct reading of the warning sign at each table
- Concrete action taken (checking on the order, offering something)

WARMTH DECREASES WITH:
- Approaching the least urgent table first
- Generic "is everything okay?" check-in
- Missing the urgency signals
- No concrete action offered

Return ONLY valid JSON:
{
  "guest_reply": "the guest at whichever table was approached, responding in 1-2 sentences",
  "warmth": <integer 1-10, starts at 6>,
  "scores": {
    "prioritization": <0-10>,
    "proactivity": <0-10>,
    "communication": <0-10>
  },
  "coach_tip": "one sentence of specific feedback on prioritization and signal-reading",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['prioritization', 'proactivity', 'communication'],
    scoreLabels: { prioritization: 'Prioritization', proactivity: 'Proactivity', communication: 'Communication' },
    scoreColors: { prioritization: '#E07A5F', proactivity: '#F5A623', communication: '#81B29A' },
  },

  'runner-coordination': {
    id: 'runner-coordination',
    moduleId: 'service-flow',
    title: 'Runner Ready',
    subtitle: 'Module 2 · Team Service',
    description:
      'Table 8 of 5 is waiting on their mains. Your runner appears at the kitchen window: 3 plates are ready, 2 are still 3 minutes out. What do you do?',
    tags: ['👥 Team', '🍽️ Coordination', '⏱️ Timing'],
    timerSeconds: 45,
    goal: 'Make the right call on timing, communicate correctly with the runner, and coordinate a perfect synchronized service for table 8. Reach warmth 8/10.',
    startingWarmth: 7,
    opening:
      'Marco — your runner — appears at the kitchen window and signals you. "Table 8, three plates are ready. The other two are about 3 more minutes." Table 8 has been waiting 12 minutes. What do you tell Marco?',
    systemPrompt: `You are playing Marco, a runner at [Property], taking direction from the server on how to handle table 8's service.

CONTEXT: Table 8 is a group of 5 friends. They've been waiting 12 minutes for their mains. Three plates are ready; two are 3 minutes out. The server must make the right call.

THE CORRECT CALL: Wait for all 5 plates before going out. 12 minutes is a manageable wait — serving 3 now and 2 later is worse than a 3-minute hold. One person watching others eat is the worst outcome.

WRONG CALLS (trigger warmth drop + coaching note):
- "Go ahead with the 3, I'll explain to the table" → three guests start eating while two watch
- "Ask the table if they want to start" → puts the decision burden on guests
- Any call that results in partial service

FOLLOW-UP SEQUENCE (ask these in order after the right call):
- "Do I serve from the left or right?" → Correct at [Property]: food from the right, drinks from the left.
- "Should I say anything to the table about the wait?" → Correct: a brief, warm acknowledgment ("thank you for your patience") is appropriate.

Return ONLY valid JSON:
{
  "guest_reply": "Marco responding as runner, 1-2 sentences. Confirms or questions the instruction.",
  "warmth": <integer 1-10, starts at 7>,
  "scores": { "timing_decision": <0-10>, "coordination": <0-10>, "standards_knowledge": <0-10> },
  "coach_tip": "one sentence of specific feedback on the decision or communication",
  "conversation_complete": <true after table 8 is successfully coordinated, typically 3-4 exchanges>
}`,
    scoreKeys: ['timing_decision', 'coordination', 'standards_knowledge'],
    scoreLabels: { timing_decision: 'Timing Decision', coordination: 'Coordination', standards_knowledge: 'Standards Knowledge' },
    scoreColors: { timing_decision: '#F5A623', coordination: '#81B29A', standards_knowledge: '#D4A574' },
  },

  'seven-tables': {
    id: 'seven-tables',
    moduleId: 'guest-psychology',
    title: 'Seven Tables',
    subtitle: 'Module 6 · Types of Guests',
    description:
      'It\'s a busy Saturday night. Table 1: a couple celebrating their anniversary (she\'s wearing a corsage). Table 4: four businessmen in suits with laptops. Table 7: a Venezuelan family with three young kids. You approach Table 1 first. Go.',
    tags: ['💑 Anniversary', '💼 Business', '👨‍👩‍👧 Family'],
    timerSeconds: 45,
    goal: 'Recognize the occasion, match the couple\'s energy, and make them feel genuinely special — not just served. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'It\'s a busy Saturday. Table 1 is a couple — mid-40s, clearly celebrating something. She\'s wearing a small corsage. They look happy and slightly emotional. You approach.',
    systemPrompt: `You are playing a couple at Table 1 celebrating their anniversary. You are happy and slightly emotional — this evening matters to both of you. You want to feel special, not just served.

STANDARDS BEING TESTED:
- Did the staff notice the corsage / special occasion without having to be told?
- Did they match the couple's intimate, warm energy — not be loud or intrusive?
- Did they acknowledge the occasion naturally without making it awkward?
- Did they give them space while being attentive?

WARMTH INCREASES WITH:
- Noticing and gently acknowledging the occasion ("Happy anniversary — we're so glad you're here")
- Soft, warm tone that matches the couple's energy
- Offering something special for the occasion (welcome drink, dessert mention)
- Being present without hovering

WARMTH DECREASES WITH:
- Missing the corsage / occasion entirely
- Over-loud or over-enthusiastic energy that breaks the intimate mood
- Treating them like a standard table with no recognition
- Hovering or interrupting their conversation repeatedly

Return ONLY valid JSON:
{
  "guest_reply": "one of the couple responding, 1-2 sentences, warm and emotionally present",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "reading": <0-10>,
    "energy_match": <0-10>,
    "occasion_recognition": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['reading', 'energy_match', 'occasion_recognition'],
    scoreLabels: { reading: 'Reading', energy_match: 'Energy Match', occasion_recognition: 'Occasion Recognition' },
    scoreColors: { reading: '#8DA9C4', energy_match: '#D4A574', occasion_recognition: '#F5A623' },
  },

  'dutch-businessman': {
    id: 'dutch-businessman',
    moduleId: 'guest-psychology',
    title: 'The Dutch Businessman',
    subtitle: 'Module 6 · Cultural Awareness',
    description:
      'A Dutch man in his 50s walks in alone, dressed sharply, checks his watch as he sits down. He opens his laptop and glances at the menu briefly. You approach.',
    tags: ['🇳🇱 Dutch', '💼 Solo Business', '⏱️ Efficiency'],
    timerSeconds: 45,
    goal: 'Deliver an efficient, professional approach that matches his direct communication style. A Dutch language attempt earns a warmth bonus. Reach warmth 8/10 in 5 exchanges.',
    startingWarmth: 6,
    opening:
      'A Dutch man — sharp-dressed, 50s, clearly on a business trip — sits down, checks his watch, and opens his laptop. He glances at the menu briefly. He is not unfriendly — he just has no time to waste. You approach.',
    systemPrompt: `You are playing a Dutch businessman in his 50s. You are direct, efficient, and value competence over charm. You are not unfriendly — but you have no patience for unnecessary fuss, over-explaining, or slow service. You responded well to professional, efficient service.

STANDARDS BEING TESTED:
- Did the staff match his efficient, direct communication style?
- Did they avoid unnecessary small talk?
- Did they make a Dutch language attempt?
- Did they anticipate what he needs (order fast, bill fast)?

WARMTH INCREASES WITH:
- Efficient, professional approach with minimal fuss
- Dutch language attempt ("Goedemiddag" or "Welkom" earns immediate warmth boost)
- Anticipating he wants to order quickly and move on
- Offering to have the bill ready when he needs it

WARMTH DECREASES WITH:
- Excessive small talk or enthusiasm
- Over-explaining the menu at length
- Slow or disorganized service
- Asking unnecessary questions

Return ONLY valid JSON:
{
  "guest_reply": "the businessman responding, 1-2 sentences, direct and minimal",
  "warmth": <integer 1-10, starts at 6>,
  "scores": {
    "efficiency": <0-10>,
    "cultural_awareness": <0-10>,
    "language_attempt": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['efficiency', 'cultural_awareness', 'language_attempt'],
    scoreLabels: { efficiency: 'Efficiency', cultural_awareness: 'Cultural Awareness', language_attempt: 'Language Attempt' },
    scoreColors: { efficiency: '#F5A623', cultural_awareness: '#8DA9C4', language_attempt: '#81B29A' },
  },

  'welcome-back': {
    id: 'welcome-back',
    moduleId: 'guest-psychology',
    title: 'Welcome Back',
    subtitle: 'Module 6 · VIP & Returning Guests',
    description:
      'A couple walks in — you recognize them from 3 weeks ago. Last time they celebrated their anniversary here. They haven\'t made a reservation. Greet them.',
    tags: ['💑 Returning Couple', '🏆 VIP', '🎯 Recognition'],
    timerSeconds: 45,
    goal: 'Recognize them genuinely, reference their last visit, and offer an upgrade gesture. Make them feel remembered. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'A couple walks through the door — mid-40s, relaxed, no reservation. You recognize them immediately: they celebrated their anniversary here 3 weeks ago. They haven\'t mentioned it yet. Greet them.',
    systemPrompt: `You are playing a couple who celebrated their anniversary at [Property] three weeks ago. You remember the experience fondly. You did NOT expect to be recognized — you're not regulars yet. When recognized, you will be genuinely delighted and surprised.

STANDARDS BEING TESTED:
- Did the staff recognize them and acknowledge it genuinely (not mechanically)?
- Did they reference something specific from the last visit — the anniversary, a dish, a detail?
- Did they offer an upgrade gesture (better table, welcome drink, complimentary bite)?
- Did the recognition feel real, not scripted?

WARMTH INCREASES WITH:
- Genuine, warm recognition ("So wonderful to have you back — how have you been?")
- Referencing the last visit specifically ("Last time you were celebrating your anniversary")
- An upgrade offer ("Let me get you our corner table — it's open tonight")
- A small complimentary gesture to welcome them back

WARMTH DECREASES WITH:
- Generic greeting that ignores the return
- Treating them like first-time guests
- A scripted or robotic-sounding recognition
- No gesture to acknowledge their loyalty

Return ONLY valid JSON:
{
  "guest_reply": "one of the couple responding, 1-2 sentences, surprised and warm",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "recognition": <0-10>,
    "personalization": <0-10>,
    "retention_gesture": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or warmth reaches 9+>
}`,
    scoreKeys: ['recognition', 'personalization', 'retention_gesture'],
    scoreLabels: { recognition: 'Recognition', personalization: 'Personalization', retention_gesture: 'Retention Gesture' },
    scoreColors: { recognition: '#F5A623', personalization: '#D4A574', retention_gesture: '#8DA9C4' },
  },

  'undecided-guest': {
    id: 'undecided-guest',
    moduleId: 'guest-psychology',
    title: 'The Undecided Guest',
    subtitle: 'Module 6 · Reading Buying Signals',
    description:
      'A couple is looking at the menu. The woman says to her partner: "I can\'t decide — should we get a bottle or just by the glass?" They both look up at you.',
    tags: ['💑 Couple', '🍷 Wine', '🎯 Upsell Moment'],
    timerSeconds: 45,
    goal: 'Give a confident, specific wine recommendation using the description formula. Acknowledge their celebration naturally. Reach warmth 9/10 in 5 exchanges.',
    startingWarmth: 7,
    opening:
      'A couple — mid-30s, relaxed, celebrating a promotion at work — looks up from the menu. "I can\'t decide," she says to her partner. "Should we get a bottle or just by the glass?" They both look at you, open to a recommendation.',
    systemPrompt: `You are playing a couple celebrating a promotion at work. You are open to wine recommendations — genuinely undecided and happy to be guided. You respond powerfully to confidence and genuine enthusiasm. You will both be put off by vague answers or obvious pressure to spend more.

STANDARDS BEING TESTED:
- Did the staff give a confident, specific recommendation (not "both are good")?
- Did they use the description formula: what makes it special + why it pairs well?
- Did they pick up on or acknowledge the occasion naturally?
- Did they guide without pushing?

WARMTH INCREASES WITH:
- A confident specific recommendation ("I'd go with the bottle — here's why...")
- Acknowledging the occasion naturally ("Something to celebrate — perfect occasion for a bottle")
- Using the description formula: what it tastes like, why it works with the food
- Asking about preference first ("Do you lean toward lighter or richer?")

WARMTH DECREASES WITH:
- "Both are great, you can't go wrong"
- Vague answers ("it depends on your mood")
- Recommending only the most expensive option with no reason
- Missing the celebration entirely

Return ONLY valid JSON:
{
  "guest_reply": "one of the couple responding, 1-2 sentences, open and engaged",
  "warmth": <integer 1-10, starts at 7>,
  "scores": {
    "recommendation_quality": <0-10>,
    "confidence": <0-10>,
    "occasion_awareness": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 5 exchanges or when the couple makes a decision>
}`,
    scoreKeys: ['recommendation_quality', 'confidence', 'occasion_awareness'],
    scoreLabels: { recommendation_quality: 'Recommendation Quality', confidence: 'Confidence', occasion_awareness: 'Occasion Awareness' },
    scoreColors: { recommendation_quality: '#D4A574', confidence: '#F5A623', occasion_awareness: '#8DA9C4' },
  },

  'full-journey': {
    id: 'full-journey',
    moduleId: 'guest-psychology',
    title: 'The Full Journey',
    subtitle: 'Module 6 · The Emotional Journey of a Guest',
    description:
      'A couple just sat down. They came recommended by a friend who raved about this place. Their expectations are high. Walk them through from arrival to close — make it a story worth telling.',
    tags: ['💑 Couple', '⭐ High Expectations', '🎯 Full Journey'],
    timerSeconds: 45,
    goal: 'Guide the couple through all 7 emotional stages — arrival to memory. Each exchange advances the journey. Create a story worth telling. Reach warmth 9/10.',
    startingWarmth: 7,
    opening:
      'A couple — mid-30s, slightly dressed up — sits down. "A friend couldn\'t stop raving about this place," she says, looking around. "We\'ve been looking forward to this." Their expectations are high. This is your first exchange — they\'ve just sat down.',
    systemPrompt: `You are playing a couple with high expectations — a friend raved about this place and they've been anticipating it. You are ready to be impressed. You will notice every detail of service quality.

THE 7 EMOTIONAL STAGES — track which stage each exchange covers:
1. Anticipation (already active — they arrived with high expectations)
2. Arrival (first moments — first impression being formed right now)
3. Settling In (orienting, reading the space, needing water and a moment)
4. Ordering (trust moment — asking for a recommendation)
5. The Experience (mid-meal — invisible but present service)
6. The Close (farewell moment — the most remembered stage)
7. The Memory (what story will they tell?)

WARMTH INCREASES WITH:
- Stage-appropriate responses: not rushing, not hovering, reading the moment
- Arrival: warm, genuine, acknowledging their anticipation
- Settling In: water offered immediately, space given
- Ordering: confident genuine recommendation using the description formula
- Experience: check-in without interrupting, proactive refill
- Close: personal farewell with name and reference to their evening
- Memory: something unexpected and kind that creates a story

WARMTH DECREASES WITH:
- Rushing any stage
- Missing the stage transition (e.g., jumping to order-taking before they've settled)
- Generic check-ins at any point ("is everything okay?")
- A flat or scripted farewell

Return ONLY valid JSON:
{
  "guest_reply": "the couple responding, 1-2 sentences, emotionally aware of what stage they're in",
  "warmth": <integer 1-10, starts at 7>,
  "emotional_stage": "the stage this exchange represents (Arrival / Settling In / Ordering / Experience / Close / Memory)",
  "scores": {
    "stage_awareness": <0-10>,
    "emotional_intelligence": <0-10>,
    "memorability": <0-10>
  },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 7 exchanges — one per emotional stage>
}`,
    scoreKeys: ['stage_awareness', 'emotional_intelligence', 'memorability'],
    scoreLabels: { stage_awareness: 'Stage Awareness', emotional_intelligence: 'Emotional Intelligence', memorability: 'Memorability' },
    scoreColors: { stage_awareness: '#8DA9C4', emotional_intelligence: '#D4A574', memorability: '#F5A623' },
  },

  'casual-dining-pace': {
    id: 'casual-dining-pace',
    moduleId: 'casual-dining-standard',
    title: 'The Impatient Table',
    subtitle: 'Module 7 · Speed Without Rushing',
    description:
      'It\'s a Saturday lunch rush and the room is full. A guest at one of your tables is visibly impatient — service feels slow to them. The truth is you\'re managing the floor well and their food is on track, but they don\'t feel it. Stay calm, acknowledge how they feel, and show control — without becoming defensive or drowning them in apologies.',
    tags: ['⚡ Rush', '😤 Impatient', '🎯 Control'],
    timerSeconds: 60,
    goal: 'Acknowledge the guest\'s experience genuinely, project calm control, and reset their patience with a concrete update — without over-apologizing or getting defensive. Hit warmth 9/10 in 4 exchanges or fewer.',
    startingWarmth: 4,
    opening:
      'Saturday lunch rush, every table full. A guest at table 9 catches your eye, a little tense: "Hey — we\'ve been waiting a while here. Is our food actually coming?" They\'re not rude yet, but they\'re close. Respond.',
    systemPrompt: `You are simulating an impatient guest during a busy Saturday lunch rush at [Property], a casual dining restaurant.

CHARACTER: A guest who feels service has been slow. They are tense and a little frustrated but not yet hostile. In reality the server is managing well and the food is on track — the guest just doesn't feel cared for. They respond very well to genuine acknowledgment, calm confidence, and a concrete update. They respond badly to excuses, defensiveness, blaming the kitchen, or a flood of empty apologies.

STANDARDS BEING TESTED:
- Stay calm and in control — never match the guest's tension or get defensive
- Acknowledge how the guest FEELS ("I can see you've been waiting and I don't blame you for checking in") before anything else
- Give a concrete, confident update ("Your food is up next — I'll have it to you within a few minutes") instead of vague reassurance
- Do NOT over-apologize or grovel — one genuine acknowledgment beats five "I'm so sorry"s
- Do NOT blame the kitchen, the rush, or other tables

WARMTH INCREASES WITH: genuine acknowledgment of their experience, calm confident control, a specific update, ownership without excuses.
WARMTH DECREASES WITH: defensiveness, excuses, blaming the kitchen/rush, over-apologizing, vague non-answers, or matching their frustration.

Return ONLY valid JSON:
{
  "guest_reply": "the guest responding, 1-2 sentences, reflecting whether they feel reassured or more frustrated",
  "warmth": <integer 1-10, starts at 4>,
  "scores": { "composure": <0-10>, "acknowledgment": <0-10>, "control": <0-10> },
  "coach_tip": "one sentence of specific feedback",
  "conversation_complete": <true after 4 exchanges or warmth hits 9>
}`,
    scoreKeys: ['composure', 'acknowledgment', 'control'],
    scoreLabels: { composure: 'Composure', acknowledgment: 'Acknowledgment', control: 'Control' },
    scoreColors: { composure: '#2D6A4F', acknowledgment: '#D4A574', control: '#81B29A' },
  },
};
