// ─── TYPES ───────────────────────────────────────────────────

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explain: string;
}

// Discriminated union for lean content sections
export type LearnSection =
  | { type: 'intro'; text: string }
  | { type: 'callout'; tone: 'tip' | 'warn' | 'rule'; label: string; text: string }
  | { type: 'principles'; items: { num: number; title: string; body: string }[] }
  | { type: 'steps'; title: string; items: { num: number; title: string; body: string; badge?: string }[] }
  | { type: 'lang-grid'; items: LangCard[] }
  | { type: 'phrase-table'; rows: PhraseRow[] }
  | { type: 'do-dont'; title: string; items: { do: string; dont: string }[] }
  | { type: 'culture-cards'; items: { group: string; cues: string }[] }
  | { type: 'tip-list'; title: string; items: string[] };

export interface LangCard {
  lang: string;
  flag: string;
  formal: string;
  casual: string;
  tip: string;
}

export interface PhraseRow {
  en: string;
  nl: string;
  es: string;
  pap: string;
}

export interface Lesson {
  id: string;
  title: string;
  desc: string;
  duration: string;
  xp: number;
  status: 'completed' | 'current' | 'available';
  scenarioId?: string;
  learn: LearnSection[];
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  subtitle: string;
  iconName: string; // maps to lucide icon in components
  color: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  available: boolean;
  xpTotal: number;
  lessons: Lesson[];
}

// ─── MODULE 1: GREETINGS & FIRST IMPRESSIONS ────────────────

const greetingsLessons: Lesson[] = [
  {
    id: 'five-second',
    title: 'The 5-Second Rule',
    desc: 'Immediate greeting within 5 seconds of arrival',
    duration: '5 min',
    xp: 30,
    status: 'completed',
    scenarioId: 'five-second-rule',
    learn: [
      { type: 'intro', text: 'The first five seconds set the emotional tone for the entire visit. A guest who walks into [Property] and is acknowledged immediately feels welcomed. A guest who has to look around, make eye contact twice, and wait — already feels like an afterthought. It costs nothing to greet quickly. It costs a lot not to.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Every guest is acknowledged within 5 seconds of stepping through the door. If you\'re mid-task, look up, make eye contact, and say "I\'ll be right with you" — that counts.' },
      { type: 'principles', items: [
        { num: 1, title: 'Stop what you\'re doing', body: 'If a guest walks in, they are the priority. Complete or pause your current task and acknowledge them immediately.' },
        { num: 2, title: 'Eye contact first', body: 'Before you say a word, make genuine eye contact and smile. That 1-second connection tells them: "I see you. You matter here."' },
        { num: 3, title: 'Use their name if you have it', body: 'If there\'s a reservation, use the name: "Mr. de Jong? Welcome back." It turns a greeting into a moment.' },
        { num: 4, title: 'When you\'re busy, still acknowledge', body: '"One moment, I\'ll be right with you" said warmly is 100x better than ignoring someone for 30 seconds.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: '"Good evening, welcome to [Property]! Table for two?"', dont: 'Continuing to clean a table for 15 seconds before looking up.' },
        { do: 'Making eye contact across the room and nodding while finishing a task.', dont: '"Yep, just a sec" while looking at your phone.' },
        { do: '"Mr. Santos! Great to see you again. Your usual corner table?"', dont: '"Name on the reservation?" delivered to the floor.' },
      ]},
    ],
    quiz: [
      { q: 'A guest walks in while you\'re explaining something to a colleague. What do you do?', options: ['Finish your explanation, then greet the guest.', 'Make eye contact with the guest, hold up one finger, and finish within 10 seconds.', 'Ignore them — they can see you\'re busy.', 'Wait for them to approach you.'], correct: 1, explain: 'Acknowledging immediately — even non-verbally — tells the guest they\'ve been seen. Finishing a thought within 10 seconds is acceptable; ignoring them is not.' },
      { q: 'You have a reservation for the Santos family. They walk in. Best opening?', options: ['"How many in your party?"', '"Santos? Right this way."', '"Mr. Santos, welcome to [Property]! We\'ve been expecting you."', '"Name on the reservation?"'], correct: 2, explain: 'Using their name + warmth + context ("we\'ve been expecting you") is the high-impact opening that makes guests feel like VIPs.' },
      { q: 'What is the [Property] standard for greeting speed?', options: ['30 seconds', '10 seconds', '5 seconds', '1 minute'], correct: 2, explain: '5 seconds is the standard. Every guest should be acknowledged within 5 seconds of walking through the door.' },
      { q: 'You\'re fully in the weeds — three tables need attention. A new guest arrives. What do you do?', options: ['Ask a colleague to greet them.', 'Look up, make eye contact, smile, and say "Welcome! I\'ll be right with you."', 'Continue serving other tables — they can wait.', 'Hand them a menu without speaking.'], correct: 1, explain: 'A warm acknowledgment ("I\'ll be right with you") with eye contact resets the guest\'s clock. They now feel seen, and waiting feels different.' },
      { q: 'A regular guest, Erik, walks in every Tuesday. You recognize him. Best move?', options: ['Standard greeting: "Welcome to [Property]."', '"Erik! Good to see you — your usual spot in the corner?"', '"Name on reservation?"', '"Table for one?"'], correct: 1, explain: 'Regulars are gold. Using their name, referencing their habit — this is what creates loyalty. It costs 3 seconds and earns a lifetime.' },
    ],
  },
  {
    id: 'guide-dont-point',
    title: 'Guide, Don\'t Point',
    desc: 'Always escort guests to their table — never point',
    duration: '6 min',
    xp: 35,
    status: 'completed',
    scenarioId: 'guide-dont-point',
    learn: [
      { type: 'intro', text: 'Pointing to a table is the service equivalent of handing someone directions on a napkin. Walking them there — menu open, at their pace — is the difference between service and hospitality. The walk to the table is not dead time. It\'s the second act of the first impression.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Always escort. Never point. Open the menu as you walk. Say one thing about the experience before you seat them.' },
      { type: 'principles', items: [
        { num: 1, title: 'Walk, don\'t gesture', body: 'Step out from behind the host stand and lead the way. Even if the restaurant is small. The act of walking with them signals: "You are being taken care of."' },
        { num: 2, title: 'Menu in hand, open', body: 'Carry the menu as you walk and open it before placing it on the table. This small gesture communicates readiness and care.' },
        { num: 3, title: 'One line about the experience', body: 'As you walk: "We have a great craft beer on tap tonight" or "The kitchen\'s doing something special with the truffle fries." Plants a seed, creates anticipation.' },
        { num: 4, title: 'Adjust to their pace', body: 'Walk at their speed, not yours. If they\'re slow, elderly, or with kids — match it. This is not about efficiency.' },
      ]},
      { type: 'do-dont', title: 'The difference', items: [
        { do: 'Walking them to the table, opening the menu, mentioning the chef\'s special.', dont: '"Table 7 is over there, near the window."' },
        { do: 'Slowing down for a family with young children.', dont: 'Power-walking ahead while a couple with luggage tries to keep up.' },
        { do: '"Right this way — I\'ll grab you some water as soon as you\'re settled."', dont: '"Sit wherever you like."' },
      ]},
    ],
    quiz: [
      { q: 'A couple arrives. Every table is visible from the entrance. You should:', options: ['Point to their table: "Just over there."', 'Hand them a menu and let them find it.', 'Walk them to the table, menu in hand.', 'Tell them the table number.'], correct: 2, explain: 'Even when the restaurant is small, escorting the guest creates a feeling of personal service. Always walk them there.' },
      { q: 'As you escort guests, you should:', options: ['Walk in silence so they can enjoy the atmosphere.', 'Mention something about the menu or what\'s special tonight.', 'Ask them all your demographic questions.', 'Rush to seat them quickly.'], correct: 1, explain: 'One natural, genuine line about the experience creates anticipation and starts the conversation on a high note.' },
      { q: 'An elderly couple arrives. You should walk:', options: ['At your normal server pace.', 'At their pace.', 'Ahead and then wait at the table.', 'As fast as possible to turn the table.'], correct: 1, explain: 'You match the guest\'s pace. Always. Rushing ahead communicates that you have somewhere better to be.' },
      { q: 'What does carrying the menu open as you walk communicate?', options: ['You\'re in a hurry.', 'Readiness and care — you\'re already thinking about their experience.', 'You don\'t have enough staff to carry it properly.', 'Nothing — it\'s just habit.'], correct: 1, explain: 'Small gestures communicate big things. An open menu says: "I\'m already thinking about your experience." It\'s a statement of readiness.' },
      { q: 'A group arrives and says "Oh, we know where to go!" Should you still escort them?', options: ['No — respect their preference, let them go.', 'Yes — walk with them and mention something on the menu anyway.', 'Yes, but just hand them menus without walking.', 'No — only escort first-time guests.'], correct: 1, explain: 'Even for regulars, walking with them (at their pace) and adding something warm creates connection. You can be brief — "Right this way then, good to have you back" — but walk.' },
    ],
  },
  {
    id: 'multilingual',
    title: 'Multilingual Welcome',
    desc: 'Greet in English, Dutch, Spanish & Papiamentu',
    duration: '8 min',
    xp: 60,
    status: 'current',
    scenarioId: 'greeting-dutch-couple',
    learn: [
      { type: 'intro', text: 'On any given evening at [Property], you might welcome a Dutch couple celebrating an anniversary, a Venezuelan family on vacation, American tourists from a cruise ship, and local Curaçaoans celebrating a birthday — all in the same shift. A greeting in someone\'s language is not just a courtesy. It\'s a signal: "We know who you are, and you\'re home here." It takes three seconds. The return is enormous.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Greet every guest within 5 seconds. If you detect their language — or their name suggests it — lead with a greeting in their language. If in doubt, lead in English, then adapt immediately when you hear them.' },
      { type: 'lang-grid', items: [
        { lang: 'English', flag: '🇺🇸', formal: 'Welcome to [Property], great to have you here. Table for [X]?', casual: 'Hey! Welcome in — good to see you. How many are joining you tonight?', tip: 'Americans respond to enthusiasm and warmth. Smile wide, make strong eye contact. Acknowledge occasions if you know them.' },
        { lang: 'Dutch', flag: '🇳🇱', formal: 'Welkom bij [Property]. Fijn dat u er bent. Tafel voor [X]?', casual: 'Hoi! Welkom bij [Property] — gezellig dat jullie er zijn!', tip: 'Dutch guests value efficiency and directness. Friendly but not overdone. Get to seating quickly — they appreciate it.' },
        { lang: 'Spanish', flag: '🇪🇸', formal: 'Bienvenidos a [Property]. Qué bueno tenerlos aquí. ¿Mesa para cuántos?', casual: '¡Hola! Bienvenidos — qué gusto verlos. ¿Cuántos son?', tip: 'Venezuelan and Colombian guests appreciate warmth and an unhurried welcome. Ask how they\'re doing and mean it. Small talk is a sign of respect.' },
        { lang: 'Papiamentu', flag: '🇨🇼', formal: 'Bon biní na [Property]! Kon ta bai? ¿Mesa pa kuantu persona?', casual: 'Bon biní! Kon ta bai — tur kos ta bon?', tip: 'Papiamentu from a non-local staff member earns instant trust and warmth. Local guests will love you for trying. They will help you improve.' },
      ]},
      { type: 'phrase-table', rows: [
        { en: 'Welcome', nl: 'Welkom', es: 'Bienvenido(a)', pap: 'Bon biní' },
        { en: 'Good morning', nl: 'Goedemorgen', es: 'Buenos días', pap: 'Bon dia' },
        { en: 'Good afternoon', nl: 'Goedemiddag', es: 'Buenas tardes', pap: 'Bon tardi' },
        { en: 'Good evening', nl: 'Goedenavond', es: 'Buenas noches', pap: 'Bon nochi' },
        { en: 'How are you?', nl: 'Hoe gaat het?', es: '¿Cómo están?', pap: 'Kon ta bai?' },
        { en: 'Thank you', nl: 'Dank u wel', es: 'Gracias', pap: 'Danki' },
        { en: 'Enjoy your meal', nl: 'Eet smakelijk', es: 'Buen provecho', pap: 'Bon apetit' },
        { en: 'Come back soon', nl: 'Tot ziens', es: 'Hasta pronto', pap: 'Te aworo' },
      ]},
      { type: 'culture-cards', items: [
        { group: '🇳🇱 Dutch', cues: 'Direct, efficient, value honesty over flattery. Less small talk. They\'ll tell you exactly what they want — respect that. A clean, confident greeting lands better than an elaborate one.' },
        { group: '🇺🇸 American', cues: 'Want warmth, enthusiasm, eye contact. Love when you acknowledge special occasions. A genuine "wow, congratulations!" for a birthday goes a long way.' },
        { group: '🇻🇪 Venezuelan / 🇨🇴 Colombian', cues: 'Treat like family. Slower pace is a sign of respect. Ask about their trip, their day. Small talk is not wasted time — it\'s relationship-building.' },
        { group: '🇩🇪 German', cues: 'Precision and punctuality matter. Formal address. Don\'t overpromise. If you say it\'ll be 10 minutes, it should be 10 minutes.' },
        { group: '🇨🇦 Canadian', cues: 'Polite, friendly, low-key. Appreciate honesty. If the kitchen is backed up, tell them early. They\'d rather know than be surprised.' },
        { group: '🇨🇼 Local Curaçaoan', cues: 'Papiamentu is the language of home and trust. Even "Bon biní" from a non-local staff member changes the entire dynamic. Try it — they will teach you more.' },
      ]},
    ],
    quiz: [
      { q: 'A Dutch couple walks in — well-dressed, efficient body language. Best opening?', options: ['"Hey!! Welcome, so great to see you!!"', '"Welkom bij [Property]. Fijn dat u er bent. Tafel voor twee?"', '"Welcome! Can I get a name for the reservation?"', '"Bon biní! Kon ta bai?"'], correct: 1, explain: 'Dutch guests appreciate a clean, efficient, warm greeting in their own language. Not over-the-top — just genuinely professional.' },
      { q: 'How do you say "Welcome" in Papiamentu?', options: ['Bon dia', 'Danki', 'Bon biní', 'Bon nochi'], correct: 2, explain: 'Bon biní = welcome. Bon dia = good morning. Danki = thank you. Bon nochi = good evening.' },
      { q: 'A Venezuelan family arrives. They\'re speaking Spanish. What\'s the highest-impact opening?', options: ['"Welcome to [Property], how many?"', '"¡Hola! Bienvenidos — qué gusto verlos. ¿Cuántos son?"', '"Table for four?"', '"Welkom bij [Property]."'], correct: 1, explain: 'Spanish + genuine warmth + interest in their group = instant connection. This family will remember this moment.' },
      { q: 'An American couple mentions it\'s their anniversary as they walk in. What do you do?', options: ['Standard check-in and seating.', 'Note it for later — bring it up at dessert.', '"Oh, congratulations! We\'re so happy you chose us for this evening."', 'Don\'t mention it to avoid making them uncomfortable.'], correct: 2, explain: 'Americans light up when you acknowledge occasions with genuine enthusiasm. This is not awkward — this is service.' },
      { q: 'What does "Bon tardi" mean?', options: ['Good morning', 'Good evening', 'Thank you', 'Good afternoon'], correct: 3, explain: 'Bon tardi = good afternoon. Bon dia = morning. Bon nochi = evening. Bon biní = welcome.' },
    ],
  },
  {
    id: 'reading-table',
    title: 'Reading the Table',
    desc: 'Adapt your energy to couples, groups, and demanding guests',
    duration: '6 min',
    xp: 40,
    status: 'current',
    scenarioId: 'reading-table-romantic',
    learn: [
      {
        type: 'intro',
        text: 'Every table at [Property] tells you something before anyone says a word. A couple on a date wants presence, not interruption. A group of friends wants energy and fun. A solo businessman wants precision and speed. Read the room before you open your mouth.',
      },
      {
        type: 'callout',
        tone: 'rule',
        label: 'The Standard',
        text: 'Read the table before you open your mouth. Match energy to energy. A quiet couple doesn\'t need your best party energy — and a birthday table doesn\'t need a formal check-in. Service adapts to the guest, not the other way around.',
      },
      {
        type: 'culture-cards',
        items: [
          {
            group: '💑 Couples',
            cues: 'Discrete, quieter tone — their conversation is the priority. Approach softly, make eye contact, give a small nod and wait for them to acknowledge you before speaking. Check in briefly and non-intrusively, then give them space. Never hover. Never interrupt mid-sentence.',
          },
          {
            group: '👥 Groups (4+)',
            cues: 'Match their energy — more interaction is welcome. Be warm, enthusiastic, and flexible with pacing. "You guys ready or still deciding? Take your time — we\'re here all night!" Never be stiff or formal. Never rush their ordering.',
          },
          {
            group: '💼 Business / Solo',
            cues: 'Efficient, precise, minimal small talk. They want speed and accuracy — not conversation. Check in quickly and cleanly. Offer what they need before they have to ask: "Your order and the bill whenever you\'re ready — just wave." Never make them wait. Never ask unnecessary questions.',
          },
          {
            group: '🌍 Tourists (First-timers)',
            cues: 'Enthusiastic, local knowledge, help them discover. Offer recommendations naturally. "First time here? Our signature burger is the move — freshly ground daily." Make them feel like insiders, not tourists. Never make them feel out of place.',
          },
        ],
      },
      {
        type: 'do-dont',
        title: 'In practice',
        items: [
          {
            do: 'Approach softly, make eye contact, give a small nod — wait for the couple to acknowledge you before speaking.',
            dont: 'Walk up and start talking mid-sentence at a couple\'s table.',
          },
          {
            do: '"You guys ready or still deciding? Take your time — we\'re here all night!" (birthday table, big group)',
            dont: 'Be stiff and formal at a group celebration.',
          },
          {
            do: '"Your order and the bill whenever you\'re ready — just wave." (solo diner)',
            dont: 'Hover near the solo diner or pile on unnecessary questions.',
          },
          {
            do: '"First time here? Our signature burger is the move — freshly ground daily." (tourists)',
            dont: 'Treat first-timers like a number and miss the chance to create a moment.',
          },
        ],
      },
      {
        type: 'tip-list',
        title: 'Universal rules — every table, every time',
        items: [
          'Never interrupt a conversation mid-sentence — wait for a natural pause or eye contact.',
          'Never hover after serving — check in once, then give space.',
          'Never let a table look around for more than 30 seconds — that\'s your signal to move.',
          'Never apply one energy to all tables — read first, act second.',
        ],
      },
    ],
    quiz: [
      {
        q: 'A couple is deep in conversation, haven\'t looked up, seated 3 minutes. What do you do?',
        options: [
          'Interrupt politely and take their order',
          'Approach quietly, make eye contact, give a small nod and wait for them to acknowledge you',
          'Wait until they call you over',
          'Send a runner to check',
        ],
        correct: 1,
        explain: 'The nod-and-wait is the five-star move. You show presence without interrupting their moment.',
      },
      {
        q: 'A group of 6 is celebrating a birthday, loud and happy. How do you match them?',
        options: [
          'Professional and formal — keep it serious',
          'Match their energy — be warm, smile, acknowledge the birthday',
          'Keep it quick and efficient',
          'Let them settle before approaching',
        ],
        correct: 1,
        explain: 'Groups want energy matched. Stiff service at a birthday table kills the vibe.',
      },
      {
        q: 'A solo businessman has his laptop open and hasn\'t touched his menu. What does this tell you?',
        options: [
          'He hasn\'t decided — leave him longer',
          'He\'s working — approach efficiently, ask if he\'s ready, don\'t linger',
          'He needs help with the menu',
          'He wants to be left completely alone',
        ],
        correct: 1,
        explain: 'Laptop = working. He wants speed and precision, not conversation.',
      },
      {
        q: 'Tourists are photographing their food. You should:',
        options: [
          'Wait until they\'re done to check in',
          'Ask if everything looks good and mention what\'s in the dish — they\'ll likely share it',
          'Not interrupt — they\'re busy',
          'Offer to take a photo of the whole group',
        ],
        correct: 1,
        explain: 'Tourists sharing food photos is free marketing. Engage them — tell them what\'s in the dish, it adds to the experience and their caption.',
      },
      {
        q: 'A couple at table 5 has been waiting 8 minutes and is starting to look around. They haven\'t flagged you. What\'s happening?',
        options: [
          'They\'re fine — they would have called',
          'They\'re uncomfortable but don\'t want to make a fuss — go check immediately',
          'They\'re having a deep conversation',
          'Send a runner',
        ],
        correct: 1,
        explain: 'Guests who look around are waiting for you. They shouldn\'t have to flag anyone. Constant observation without hovering — you see it before they have to ask.',
      },
    ],
  },
];

// ─── MODULE 2: THE SERVICE FLOW ─────────────────────────────

const serviceFlowLessons: Lesson[] = [
  {
    id: 'ten-steps',
    title: 'The 10-Step Service Sequence',
    desc: 'The complete service standard every hospitality professional must master',
    duration: '10 min',
    xp: 80,
    status: 'available',
    scenarioId: 'full-service-run',
    learn: [
      { type: 'intro', text: 'Every perfect service experience follows the same 10-step sequence. This is not a rigid script — it\'s a framework. Master the sequence and it becomes invisible. Skip steps and guests feel it, even if they can\'t name it.' },
      { type: 'steps', title: 'The 10 Steps', items: [
        { num: 1, title: 'Reception', body: 'Greet within 5 seconds of arrival. Confirm reservation. Use their name.', badge: 'Always' },
        { num: 2, title: 'Seating', body: 'Guide — never point. Walk them to the table. Deliver the menu open.', badge: 'Always' },
        { num: 3, title: 'First Contact', body: 'Offer water immediately. Brief, genuine introduction to the concept.', badge: 'Within 2 min' },
        { num: 4, title: 'Drinks', body: 'Proactive suggestion — don\'t wait to be asked. Brief recommendation with a reason.', badge: 'Proactive' },
        { num: 5, title: 'Order Taking', body: 'Listen actively. Confirm everything. Detect and acknowledge restrictions and preferences.', badge: 'Confirm' },
        { num: 6, title: 'Food Service', body: 'Serve from the correct side. Never interrupt conversations. All plates go out together.', badge: 'Synchronized' },
        { num: 7, title: 'Follow-up', body: 'Check 2-3 minutes after food arrives. Ask about flavors — never "Is everything OK?"', badge: '2–3 min' },
        { num: 8, title: 'Clearing', body: 'Never clear while someone is still eating. Synchronized clearing — never one plate at a time.', badge: 'Never rush' },
        { num: 9, title: 'Dessert / Digestifs', body: 'Offer before they ask. Directed suggestion based on what they ordered.', badge: 'Proactive' },
        { num: 10, title: 'Close', body: 'Personalized thank-you. Invitation to return. Use their name if you have it.', badge: 'Personal' },
      ]},
    ],
    quiz: [
      { q: 'Step 3 (First Contact) should happen within how long of guests being seated?', options: ['5 minutes', '2 minutes', '30 seconds', '10 minutes'], correct: 1, explain: 'First contact — offering water and a brief concept introduction — should happen within 2 minutes of seating. It sets the service tone.' },
      { q: 'Which step comes directly after Food Service?', options: ['Clearing', 'Dessert/Digestifs', 'Follow-up', 'Close'], correct: 2, explain: 'Step 7 is Follow-up: check in 2-3 minutes after food arrives. Clearing (Step 8) comes after the follow-up.' },
      { q: 'A guest finishes their main course while two others are still eating. You should:', options: ['Clear their plate immediately — it\'s polite.', 'Ask if you can clear their plate.', 'Wait until everyone finishes, then clear simultaneously.', 'Clear when the second person finishes.'], correct: 2, explain: 'Never clear while someone is still eating. Wait for the last person to finish, then clear all plates together (Step 8 — synchronized clearing).' },
      { q: 'When should you offer dessert or digestifs?', options: ['When guests ask for them.', 'After presenting the bill.', 'Before guests ask — proactive, directed suggestion.', 'Only if the table has been there over 2 hours.'], correct: 2, explain: 'Step 9 is proactive — offer before they ask, with a specific suggestion based on what they ordered. Waiting to be asked is reactive and misses the moment.' },
      { q: 'What makes a close "personalized"?', options: ['Handing over a feedback form.', 'Using their name and inviting them back with a genuine reference to their visit.', 'A smile and a wave.', 'Offering a discount for their next visit.'], correct: 1, explain: 'The close (Step 10) uses the guest\'s name when you have it and includes a genuine invitation to return — not just "have a good night."' },
    ],
  },
  {
    id: 'language-of-service',
    title: 'The Language of Service',
    desc: 'What to say, what never to say, and how to describe what you serve',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'two-minute-check',
    learn: [
      { type: 'intro', text: '"Is everything okay?" is the most dangerous phrase in hospitality. It sounds like a check-in. It is a missed opportunity. It invites a one-word answer, reveals nothing, and signals average service. Every word you choose is either building the experience or flattening it.' },
      { type: 'do-dont', title: 'Phrases to replace immediately', items: [
        { dont: '"Is everything okay?"', do: '"How are you finding the flavors tonight?"' },
        { dont: '"Did you like it?"', do: '"What did you think of the [dish]?"' },
        { dont: '"No problem"', do: '"Of course — my pleasure."' },
        { dont: '"I can\'t / we don\'t have"', do: '"What I can do is..."' },
        { dont: '"I\'ll check on that"', do: '"Let me find out for you — I\'ll be right back."' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Language Rule', text: 'Never focus on what you can\'t do. Every response pivots to what you can do. "What I can do is..." changes the entire conversation.' },
      { type: 'principles', items: [
        { num: 1, title: 'Lead with the star ingredient', body: 'When describing a dish, open with the hero element: "This starts with hand-selected Wagyu..." — not "this is a burger with..."' },
        { num: 2, title: 'Mention the technique', body: 'The method matters: "slow-smoked for 8 hours", "house-ground daily", "fermented in-house". It signals craft and pride.' },
        { num: 3, title: 'End with the flavor experience', body: 'Close with what the guest will feel: "...giving you a deep, smoky finish that\'s completely unique to us." Paint the experience, not the ingredients.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'Example', text: '"Our signature burger starts with hand-ground [Property] blend beef, seared on a cast-iron flat top, giving you a crust that holds all the juice — you taste the technique in every bite."' },
    ],
    quiz: [
      { q: 'A guest thanks you for your help. Which response is correct?', options: ['"No problem."', '"No worries!"', '"Of course — my pleasure."', '"That\'s what I\'m here for."'], correct: 2, explain: '"No problem" implies there could have been a problem. "My pleasure" signals that serving them is genuinely enjoyable — a completely different message.' },
      { q: 'A guest asks about a dish you\'re not certain about. You say:', options: ['"I think it should be fine."', '"Probably — it\'s quite popular."', '"Let me find out for you — I want to be sure."', '"Most guests like it."'], correct: 2, explain: '"Let me find out for you" signals ownership and honesty. "I think" and "probably" signal uncertainty and erode trust.' },
      { q: 'You don\'t carry a wine the guest specifically requested. You say:', options: ['"We don\'t have that."', '"That\'s not on our list."', '"What I can do is suggest our [X], which has a similar profile — bold, fruit-forward."', '"I\'ll check with the bar."'], correct: 2, explain: '"What I can do is..." pivots immediately to a solution. It acknowledges the gap without making the guest feel like a problem.' },
      { q: 'How should you open a description of a menu item?', options: ['With the price point.', 'With the star ingredient.', 'With what other guests say about it.', 'With the cooking time.'], correct: 1, explain: 'Lead with the star ingredient — the hero of the dish. That\'s what makes guests lean in. Price and reviews come after the desire is created.' },
      { q: 'Which check-in is correct 2-3 minutes after food arrives?', options: ['"Is everything okay?"', '"Everything good?"', '"How are you finding the flavors tonight?"', '"Did you enjoy your meal so far?"'], correct: 2, explain: '"How are you finding the flavors?" invites a real answer and shows genuine interest. Any "okay/good/enjoy" variant is lazy and closes the conversation.' },
    ],
  },
  {
    id: 'proactive-reactive',
    title: 'Proactive vs Reactive Service',
    desc: 'The difference between 4-star and 5-star service',
    duration: '9 min',
    xp: 60,
    status: 'available',
    scenarioId: 'proactive-floor-signal',
    learn: [
      { type: 'intro', text: 'Four-star service waits for guests to ask. Five-star service anticipates. The difference between the two is not skill — it\'s attention. Most of what guests need, they signal before they ask. Your job is to read the signal and act before they have to say a word.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Reactive = 4 stars. Proactive = 5 stars. Every time a guest has to ask for something you could have anticipated, you missed a 5-star moment.' },
      { type: 'culture-cards', items: [
        { group: '💧 Guest reaches for water', cues: 'Refill before the glass hits half-empty. Proactive refills keep the table smooth and silent — the guest never has to think about it.' },
        { group: '⌚ Guest glances at watch', cues: 'They may be on a schedule. Offer to move the next course along: "I can have your main out in the next 8 minutes if you\'d like."' },
        { group: '👶 Guest with children', cues: 'Bring crayons, a kids\' menu, and highchair without being asked. Parents notice — and they remember.' },
        { group: '💼 Guest in business attire', cues: 'Mention quiet seating and fast WiFi proactively. They may not ask, but they\'ll appreciate the offer.' },
        { group: '💑 Couple stops talking', cues: 'Give them space. A comfortable silence between a couple is theirs — not yours. Don\'t interrupt a moment to check in.' },
      ]},
      { type: 'principles', items: [
        { num: 1, title: 'Observe', body: 'What do you see? Empty glass, glance at the watch, closed menu, leaning back, phone out — read the table before approaching.' },
        { num: 2, title: 'Interpret', body: 'What does this signal mean? Empty glass = needs a refill. Closed menu = ready to order. Leaning back = course complete.' },
        { num: 3, title: 'Act', body: 'Do it before they ask. The guest who never had to ask for anything is the guest who returns.' },
      ]},
    ],
    quiz: [
      { q: 'A guest reaches for their water glass — it\'s half empty. 5-star service means:', options: ['Waiting for them to finish before offering a refill.', 'Asking "Would you like more water?"', 'Refilling before they have to ask or reach.', 'Asking the runner to handle refills.'], correct: 2, explain: 'Proactive service happens before the guest has to act. If they\'re already reaching, you\'re reacting — refill when the glass drops below half.' },
      { q: 'A guest glances at their watch twice during dinner. You should:', options: ['Ignore it — it\'s not your business.', 'Ask "Are you in a hurry?"', 'Proactively offer to move the next course along: "I can have your main out in 8 minutes if that helps."', 'Bring the bill immediately.'], correct: 2, explain: 'A glance at the watch is a signal. Offering to help without waiting for them to ask is 5-star service — anticipate, don\'t react.' },
      { q: 'The anticipation formula in correct order is:', options: ['Ask → Interpret → Act', 'Observe → Interpret → Act', 'Observe → Act → Confirm', 'Ask → Observe → Respond'], correct: 1, explain: 'Observe what\'s happening → Interpret what it means → Act before they ask. This sequence is the core of proactive service.' },
      { q: 'A family with two young kids is seated. Proactive service means:', options: ['Waiting for the parents to ask for what the kids need.', 'Asking "Do you need anything for the children?"', 'Bringing crayons and a kids\' menu without being asked.', 'Prioritizing the children\'s orders first.'], correct: 2, explain: 'Parents are watching whether you anticipate their family\'s needs. Bringing kids\' items without prompting signals experience and care — no one had to ask.' },
      { q: 'A couple at your table goes quiet and both lean back. This is your cue to:', options: ['Approach immediately to check in.', 'Give them space — a comfortable silence is theirs, not a service moment.', 'Clear the table immediately.', 'Offer dessert right away.'], correct: 1, explain: 'Not every moment is a service moment. Read the quiet and give space — coming in now would interrupt their experience.' },
    ],
  },
  {
    id: 'nonverbal-signals',
    title: 'Reading Non-Verbal Signals',
    desc: 'What guests communicate before they say a word',
    duration: '8 min',
    xp: 55,
    status: 'available',
    scenarioId: 'nonverbal-observation',
    learn: [
      { type: 'intro', text: 'Most guests don\'t wave or call for service. They signal. A closed menu means "ready." A phone out means "keep it moving." Leaning forward mid-conversation means "don\'t interrupt." Reading these signals accurately is what separates a reactive server from an invisible one.' },
      { type: 'principles', items: [
        { num: 1, title: 'Looking around', body: 'They are waiting for attention. Do not make them wait. Catch their eye, nod, and get there within 60 seconds.' },
        { num: 2, title: 'Menu closed', body: 'Ready to order. Approach with a natural, unhurried energy — they\'ve decided.' },
        { num: 3, title: 'Leaning back', body: 'Satisfied with the current course. Good moment to clear or offer the next.' },
        { num: 4, title: 'Leaning forward / talking', body: 'Conversation in full swing. Do not interrupt. Wait for a natural pause or eye contact.' },
        { num: 5, title: 'Phone out', body: 'May want quick, efficient service. Be precise, minimal small talk. Check in cleanly and move on.' },
        { num: 6, title: 'Looking at the bill', body: 'Ready to leave. Process payment quickly — don\'t make them wait for the close.' },
      ]},
      { type: 'culture-cards', items: [
        { group: '🇳🇱 Dutch / Northern European', cues: 'Direct eye contact = ready. They signal clearly and directly. Don\'t over-interpret — if they want something, they\'ll let you know.' },
        { group: '🇻🇪 Latin American', cues: 'Animated conversation ≠ signal to approach. They\'ll tell you when they\'re ready. Watch for a natural pause or a closed menu — not a glance.' },
        { group: '🌏 Asian Guests', cues: 'May not wave or make obvious signals. Watch for subtle cues: closed menu, end of conversation, brief stillness. Don\'t wait for an obvious signal that may never come.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'The Invisible Standard', text: 'The best servers respond to signals before guests become aware they need something. Constant floor awareness — not hovering — is what makes service feel effortless.' },
    ],
    quiz: [
      { q: 'A guest closes their menu and places it on the table. This signals:', options: ['They want to leave.', 'They need more time.', 'They are ready to order.', 'They\'re unhappy with the options.'], correct: 2, explain: 'A closed menu placed on the table is one of the clearest order signals in hospitality. Approach calmly and naturally — they\'ve decided.' },
      { q: 'Two guests are leaning forward in animated conversation. You should:', options: ['Approach immediately to take their order.', 'Wait for a natural pause or eye contact before approaching.', 'Tap one of them on the shoulder to signal you\'re there.', 'Come back in 10 minutes without checking.'], correct: 1, explain: 'Leaning forward + active conversation = do not interrupt. Wait for a natural pause, eye contact, or a closed menu before approaching.' },
      { q: 'A solo guest has their phone on the table and is eating quickly. This suggests:', options: ['They\'re unhappy and distracted.', 'They want a long conversation about the food.', 'They want efficient service — clean, quick, no hovering.', 'They\'ll definitely want dessert.'], correct: 2, explain: 'Phone visible + eating quickly = working mode or time-pressured. Efficient, no-frills service is what they want. Check in, confirm all is well, and move on.' },
      { q: 'A guest keeps looking around the restaurant. What\'s happening?', options: ['They\'re enjoying the decor.', 'They\'re waiting for someone.', 'They need service and are looking for a staff member.', 'They\'re bored.'], correct: 2, explain: 'Looking around is the classic signal for "I need service." Don\'t wait for them to flag you — catch their eye, nod, and get there within 60 seconds.' },
      { q: 'An Asian guest has a closed menu but hasn\'t waved or made eye contact. You should:', options: ['Wait until they make a clear signal.', 'Approach — the closed menu is a sufficient signal.', 'Ask a colleague to check on them.', 'Wait 5 more minutes.'], correct: 1, explain: 'Cultural differences mean some guests won\'t wave even when ready. The closed menu is your cue — approach calmly without waiting for a more obvious signal.' },
    ],
  },
  {
    id: 'team-service',
    title: 'Synchronized Team Service',
    desc: 'The choreography that makes great service look effortless',
    duration: '8 min',
    xp: 55,
    status: 'available',
    scenarioId: 'runner-coordination',
    learn: [
      { type: 'intro', text: 'Guests don\'t see the teamwork behind great service — and that\'s exactly the point. When service is synchronized, it looks effortless. When it breaks down, guests feel it immediately: one person eating while the others watch, servers crossing paths, plates arriving one at a time. Choreography is not accidental.' },
      { type: 'steps', title: 'The choreography rules', items: [
        { num: 1, title: 'All plates go out together', body: 'Every plate for a table leaves the kitchen at the same time. No exceptions. If one plate is 2 minutes behind, the team waits.', badge: 'Non-negotiable' },
        { num: 2, title: 'Never cross paths', body: 'Know who is carrying what and which route they\'re taking. A collision — physical or visual — breaks the illusion of fluid service.', badge: 'Always' },
        { num: 3, title: 'Clear simultaneously', body: 'When the last guest at a table finishes, all servers move in together. One plate at a time is amateur — synchronized clearing is invisible.', badge: 'Together' },
        { num: 4, title: 'Communicate without words', body: 'Eye contact, nods, and brief gestures coordinate the floor silently. Loud verbal coordination in front of guests breaks the experience.', badge: 'Silent' },
        { num: 5, title: 'Move with intention', body: 'No rushing, no stopping mid-floor to chat. Every movement has a purpose and a destination.', badge: 'Intention' },
      ]},
      { type: 'principles', items: [
        { num: 1, title: 'Server', body: 'Owns the guest relationship. Knows the table\'s history, preferences, and flow. Communicates pace to the team.' },
        { num: 2, title: 'Runner', body: 'Supports timing and logistics. Carries plates, watches the kitchen window, confirms readiness before service.' },
        { num: 3, title: 'Captain', body: 'Coordinates the floor in real time. Corrects issues before guests notice. The eye above the floor.' },
      ]},
      { type: 'tip-list', title: 'The 5-minute after-service brief', items: [
        'What went well tonight — name it specifically.',
        'What could have been smoother — one concrete thing.',
        'One fix to implement tomorrow — not a complaint, an action.',
      ]},
    ],
    quiz: [
      { q: 'A table of 5 is ready for their mains — but one plate is 2 minutes behind. You:', options: ['Serve the 4 ready plates — guests shouldn\'t wait.', 'Wait for all 5 plates before leaving the kitchen.', 'Warn the guests that one plate is coming separately.', 'Ask the guest whose plate is late to wait.'], correct: 1, explain: 'All plates go out together — non-negotiable. One person eating while four others watch is worse than a 2-minute hold. Wait for the full table.' },
      { q: 'A runner\'s role in synchronized service is:', options: ['To manage guest relationships for their assigned section.', 'To coordinate the entire floor and correct issues in real time.', 'To support timing and logistics — plates, timing, kitchen coordination.', 'To handle complaints and escalations.'], correct: 2, explain: 'The runner is the logistics support. They watch the kitchen window, confirm timing, and carry plates — freeing the server to manage the guest relationship.' },
      { q: 'How do experienced servers coordinate during synchronized clearing?', options: ['They call out to each other across the floor.', 'They use a walkie-talkie or headset system.', 'Eye contact and nods — silent visual communication.', 'They pre-plan all routes at the start of service.'], correct: 2, explain: 'Silent communication — eye contact, nods, brief gestures — keeps the coordination invisible to guests. Vocal coordination in front of a table breaks the experience.' },
      { q: 'Table 8 of 4 has finished their mains — two have empty plates, one has a bite left, one is still eating. You should:', options: ['Clear the two finished plates immediately.', 'Ask if you can start clearing.', 'Wait until the last person finishes, then clear all plates together.', 'Clear each plate as each guest finishes.'], correct: 2, explain: 'Never clear while someone is still eating. Wait for the last person to finish — then clear all plates simultaneously.' },
      { q: 'An after-service brief should include:', options: ['Individual staff performance scores.', 'Only the complaints and incidents from the shift.', 'What went well, what to improve, and one concrete fix for tomorrow.', 'Sales numbers and table turnover times.'], correct: 2, explain: 'The 5-minute brief is a team tool — not a performance review. One win, one improvement, one action. Short, specific, forward-looking.' },
    ],
  },
];

// ─── MODULE 3: LANGUAGE & STORYTELLING ──────────────────────

const languageLessons: Lesson[] = [
  {
    id: 'banned-phrases',
    title: 'The Banned Phrases',
    desc: 'What never to say — and what to say instead',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'language-followup',
    learn: [
      { type: 'intro', text: '"Is everything okay?" is the most dangerous phrase in a restaurant. It sounds like a check-in. It is actually a missed opportunity. It invites a one-word answer, adds nothing, and signals to guests that your service is average. Every word you choose either builds the experience or flattens it. Choose deliberately.' },
      { type: 'do-dont', title: 'Replace these immediately', items: [
        { dont: '"Is everything okay?" / "¿Todo bien?"', do: '"How are you finding the balance of flavors?" / "¿Cómo percibieron el balance de sabores?"' },
        { dont: '"Did you like it?" / "¿Les gustó?"', do: '"What did you think of the [dish]?" / "¿Qué les pareció la [dish]?"' },
        { dont: '"No problem."', do: '"Absolutely — my pleasure."' },
        { dont: '"I don\'t know."', do: '"I don\'t know — let me find out for you right away."' },
        { dont: '"That\'s not my department."', do: '"Let me take care of that right now." (Own every problem.)' },
        { dont: '"We can\'t do that."', do: '"What I can do is..." (Focus on what you CAN offer.)' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Language Rule', text: 'Every phrase should make the guest feel heard, valued, and in good hands. Never focus on what you can\'t do — always pivot to what you can. "What I can do is..." changes the entire conversation.' },
      { type: 'tip-list', title: 'Why these phrases are banned', items: [
        '"Is everything okay?" — Gets a yes/no. Tells you nothing. Makes guests feel like a checkbox, not a person.',
        '"Did you like it?" — Puts guests on the spot. Awkward if they didn\'t.',
        '"No problem" — Implies it could have been a problem. Choose "absolutely" or "my pleasure" instead.',
        '"I don\'t know" (alone) — Never say this without immediately following with action: "let me find out."',
        '"That\'s not my department" — Never. Own every problem, even ones that didn\'t start with you.',
        '"We can\'t do that" — Focus on solutions, not limitations. Guests remember how you made them feel.',
      ]},
    ],
    quiz: [
      { q: 'A table just received their main course 3 minutes ago. They look happy. You walk over. What\'s the correct check-in?', options: ['"Is everything okay?"', '"Did you like it so far?"', '"How are you finding the balance of flavors tonight?"', '"Everything good over here?"'], correct: 2, explain: '"How are you finding the balance of flavors?" invites a real conversation and signals genuine interest. All the others are banned yes/no traps that tell you nothing and signal average service.' },
      { q: 'A guest asks to move to another table. That table is reserved. You say:', options: ['"We can\'t do that — it\'s reserved."', '"That\'s not possible tonight."', '"What I can do is check if there\'s a comparable table available — give me one moment."', '"I don\'t think that\'s going to work."'], correct: 2, explain: '"What I can do is..." pivots immediately from limitation to solution. Never say "we can\'t" — always reframe toward what you can offer.' },
      { q: 'A guest thanks you for handling a problem quickly. Which response is correct?', options: ['"No problem!"', '"No worries!"', '"Absolutely — my pleasure."', '"That\'s what I\'m here for."'], correct: 2, explain: '"No problem" implies there could have been a problem. "Absolutely — my pleasure" signals that serving them is genuinely enjoyable. That\'s a completely different message.' },
      { q: 'A guest asks about an ingredient in a dish. You\'re not certain. You say:', options: ['"I don\'t know."', '"I think it should be fine."', '"I\'m not certain — let me find out for you right now."', '"Ask the kitchen."'], correct: 2, explain: '"I don\'t know" alone is never acceptable in front of a guest. Always follow it with immediate action: "let me find out right now" turns a gap into a service moment.' },
      { q: 'A guest\'s order has a dietary issue you didn\'t catch at the table. You say:', options: ['"That\'s not my department — the kitchen handles this."', '"I can\'t change the order now."', '"Let me take care of that right now — I\'ll check with the kitchen immediately."', '"The menu clearly shows the ingredients."'], correct: 2, explain: 'Own every problem, even if it didn\'t start with you. "Let me take care of that right now" signals accountability — which is what turns a mistake into a loyalty moment.' },
    ],
  },

  {
    id: 'describe-serving',
    title: 'Describing What You Serve',
    desc: 'The 3-part formula that sells any dish or drink in one sentence',
    duration: '8 min',
    xp: 60,
    status: 'available',
    scenarioId: 'describe-recommend',
    learn: [
      { type: 'intro', text: 'The menu describes the dish. You bring it to life. The difference between reading back what\'s on a card and painting a picture in one sentence is the difference between a server and a storyteller. The 3-part formula makes this effortless — and it works for every dish and every drink on the menu.' },
      { type: 'steps', title: 'The 3-part description formula', items: [
        { num: 1, title: 'The Star', body: 'Lead with the key ingredient or what makes it special. "This starts with hand-selected Wagyu..." — not "this is a burger with..." The star is what creates desire.', badge: 'Lead here' },
        { num: 2, title: 'The Method', body: 'How it\'s made. "Slow-smoked for 8 hours", "seared on cast iron", "fermented in-house." The method signals craft and pride — and justifies the price before they ask.', badge: 'Build desire' },
        { num: 3, title: 'The Experience', body: 'What it tastes or feels like. "...giving you a deep, smoky finish that\'s completely unique to us." Paint what the guest will feel — not just what\'s in it.', badge: 'Close the sale' },
      ]},
      { type: 'callout', tone: 'tip', label: 'Formula in action', text: '"This starts with our freshly ground beef blend [Star], seared on a cast-iron flat top [Method], giving you a crust that locks in every bit of juice — you taste the technique in every bite [Experience]."' },
      { type: 'callout', tone: 'rule', label: 'The Rule', text: 'Never say "it\'s good." Tell them WHY it\'s good and what they\'ll feel when they taste it. "Good" is the laziest word in hospitality.' },
      { type: 'do-dont', title: 'What makes a description land', items: [
        { do: '"This opens with dark rum, shaken with fresh citrus and house bitters, and finishes with a long warming note that\'s completely ours."', dont: '"It has rum, citrus, and mint."' },
        { do: '"Caught this morning from local waters, simply pan-seared, with a charred lime that cuts through the richness perfectly."', dont: '"It\'s our fish dish — it\'s very popular."' },
        { do: '"Do you lean toward something lighter and fresh, or richer and more filling? That helps me point you in the right direction."', dont: '"They\'re both good — you can\'t go wrong."' },
      ]},
      { type: 'tip-list', title: 'What NOT to do', items: [
        'Don\'t read the menu back to them word for word — they can read.',
        'Don\'t over-explain — 2-3 sentences maximum.',
        'Don\'t use jargon without explaining it.',
        'Don\'t say "it\'s good" or "it\'s popular" — tell them WHY.',
        'Don\'t list. Paint. There is a difference.',
      ]},
    ],
    quiz: [
      { q: 'Which description correctly uses the 3-part formula?', options: ['"This is our burger — it\'s really good."', '"This starts with freshly ground beef, seared on cast iron, giving you a crust that holds all the juice inside."', '"This is a classic beef burger with lettuce, tomato, and sauce."', '"This dish is very popular with guests."'], correct: 1, explain: 'Star (freshly ground beef) + Method (seared on cast iron) + Experience (crust that holds the juice) = the 3-part formula working perfectly. The others describe without selling.' },
      { q: 'A guest asks about your signature cocktail. Best response:', options: ['"It\'s our most popular drink."', '"It has rum, citrus, and a mint finish."', '"This opens with dark rum, shaken with fresh citrus and house bitters, and finishes with a long warming note that\'s completely ours."', '"It\'s really refreshing — most guests love it."'], correct: 2, explain: 'The formula works for drinks too. Star → Method → Experience. Lead with what makes it special — not just an ingredient list.' },
      { q: 'What should you never do when describing a menu item?', options: ['Use the guest\'s language', 'Read the menu card back to them word for word', 'Lead with the star ingredient', 'Describe the flavor experience'], correct: 1, explain: 'Reading the menu back to them is lazy — they can read it themselves. Your job is to bring it to life in your own words with genuine enthusiasm.' },
      { q: 'A guest says "I can\'t decide between the fish and the steak." Best move:', options: ['"They\'re both excellent — you can\'t go wrong."', '"The steak is more popular."', '"Can I ask — do you lean toward something lighter and fresh, or richer and more filling? That helps me point you in the right direction."', '"What does the menu say about them?"'], correct: 2, explain: 'Asking about preference before recommending is the expert move. It turns a generic answer into a personalized recommendation — and makes the guest feel heard rather than sold to.' },
      { q: 'Which phrase is forbidden when describing a dish?', options: ['"This gives you a smoky, rich finish."', '"It\'s good."', '"Slow-smoked for 8 hours."', '"You\'ll taste the technique in every bite."'], correct: 1, explain: '"It\'s good" is the laziest phrase in hospitality. Every other option builds desire — "it\'s good" destroys it. Tell them WHY it\'s good.' },
    ],
  },

  {
    id: 'storytelling',
    title: 'Storytelling — Selling Through Stories',
    desc: 'Guests remember stories, not facts. Here\'s how to use them.',
    duration: '9 min',
    xp: 70,
    status: 'available',
    scenarioId: 'storytelling-property',
    learn: [
      { type: 'intro', text: 'Guests remember stories, not facts. "We use fresh ingredients" is a fact — it creates nothing. "Our vegetables come from a local farm in the interior — picked this morning" is a story — it creates craving, trust, and a reason to return. You have three story types available at any moment. Learn when to use each one.' },
      { type: 'do-dont', title: 'Facts vs. stories', items: [
        { dont: '"We use fresh ingredients."', do: '"Our vegetables come from a local farm in the interior — picked this morning."' },
        { dont: '"This is our signature dish."', do: '"This is the dish that started it all — the owner created it on the first night we opened. Guests kept coming back for it specifically."' },
        { dont: '"This cocktail is popular."', do: '"Most guests who try this end up making it their regular order. One couple comes back every Friday just for this one."' },
      ]},
      { type: 'steps', title: 'The 3 story types', items: [
        { num: 1, title: 'The Origin Story', body: 'Where did this dish, drink, or property come from? The owner\'s first recipe. The local supplier relationship. The night a dish was invented. Use it to: create connection and authenticity.', badge: 'Builds trust' },
        { num: 2, title: 'The Process Story', body: 'How is this made? What makes it special? "Slow-smoked for 8 hours over local wood." "House-ground daily." "Fermented in-house for 3 weeks." Use it to: justify the price and build excitement.', badge: 'Builds desire' },
        { num: 3, title: 'The Guest Story', body: '"Most guests who try this end up ordering it again the next visit." "A regular couple comes back every Friday specifically for this one." Use it to: provide social proof and tip the undecided guest.', badge: 'Closes the decision' },
      ]},
      { type: 'callout', tone: 'rule', label: 'When to use stories', text: 'When a guest seems undecided — tell a Guest Story. When describing a premium item — use a Process Story. When a guest asks "what\'s special here?" — Origin Story. Timing matters: the right story at the wrong moment is just noise.' },
      { type: 'culture-cards', items: [
        { group: '🤔 Guest seems undecided', cues: 'Guest Story: "Most guests who try this end up coming back for it specifically." Social proof tips the balance when they\'re on the fence.' },
        { group: '💰 Premium item', cues: 'Process Story: Slow-smoked, house-ground, fermented in-house. The technique justifies the price before they have to ask.' },
        { group: '❓ "What\'s special here?"', cues: 'Origin Story: The dish that started it all. The supplier relationship. The owner\'s first night. Authenticity is the answer to this question.' },
        { group: '🌍 First-time visitor', cues: 'All three: start with the Origin, add a Process for your recommendation, and close with a Guest Story. Make them feel like an insider.' },
      ]},
    ],
    quiz: [
      { q: 'A guest asks "What\'s special about this place?" Best response:', options: ['"We have great food and a beautiful location."', '"We\'ve been open for 5 years."', '"This started as one dish — the owner made it on opening night. Guests kept coming back for it specifically. Everything else grew from that."', '"Check the menu — it explains our concept."'], correct: 2, explain: 'An Origin Story answers the emotional question behind "what\'s special?" — not the factual one. Facts list. Stories connect.' },
      { q: 'Instead of "We use fresh ingredients," say:', options: ['"Our ingredients are very fresh."', '"Everything here is fresh, locally sourced."', '"Our vegetables come from a local farm in the interior — picked this morning."', '"We care a lot about quality."'], correct: 2, explain: 'Specificity is what makes a story credible and memorable. "A farm in the interior, picked this morning" puts a picture in the guest\'s mind. "Fresh ingredients" puts nothing.' },
      { q: 'Which is a "Guest Story"?', options: ['"This dish is made using a traditional method."', '"This is where the dish comes from — the owner created it in his family\'s kitchen."', '"Most guests who try this end up ordering it every time they come back."', '"This ingredient is sourced from a local supplier."'], correct: 2, explain: 'A Guest Story uses social proof — what previous guests experience — to build desire and confidence. It\'s a five-star review delivered in person, at the exact moment it matters.' },
      { q: 'When should you use a story?', options: ['Only when a guest asks a direct question about the menu.', 'When a guest seems undecided, asks what\'s special, or you\'re describing a premium item.', 'At the close of every service, as a farewell.', 'When the kitchen is running behind and you need to buy time.'], correct: 1, explain: 'Stories work best when a guest is undecided, curious about the property, or considering a premium item. Timing matters — the right story at the wrong moment is just noise.' },
      { q: 'A Process Story is best used to:', options: ['Create nostalgia and connection to heritage', 'Justify the price and build excitement for how something is made', 'Reference other guests\' positive experiences', 'Explain why an item is unavailable'], correct: 1, explain: '"Slow-smoked for 8 hours over local wood" is worth more than any price tag explanation. The Process Story builds excitement and makes the craft visible — which is what justifies premium pricing.' },
    ],
  },

  {
    id: 'handling-complaints',
    title: 'Handling Difficult Conversations',
    desc: 'The 4-step protocol that turns a broken moment into a defining one',
    duration: '9 min',
    xp: 65,
    status: 'available',
    scenarioId: 'overcooked-complaint',
    learn: [
      { type: 'intro', text: 'A complaint handled perfectly creates more loyalty than a meal that went right the first time. Guests don\'t expect perfection — they expect honesty and action. Most complaints are not about the mistake. They\'re about whether you cared enough to fix it.' },
      { type: 'steps', title: 'The 4-step complaint protocol', items: [
        { num: 1, title: 'Listen — without interrupting or defending', body: 'Let the guest finish completely. Don\'t justify, don\'t explain, don\'t pre-empt. This takes discipline — especially when you know the kitchen was slammed. Do it anyway.', badge: 'Always first' },
        { num: 2, title: 'Acknowledge — genuinely', body: '"I completely understand, and I\'m sorry this happened." Not "I\'m sorry you feel that way." Not "I understand but..." The but cancels everything before it.', badge: 'No buts' },
        { num: 3, title: 'Resolve — with a concrete offer, immediately', body: '"Let me replace that for you right away." Specific. Fast. No checking-in — act. A beverage while they wait is the minimum gesture.', badge: 'Act now' },
        { num: 4, title: 'Follow up — to confirm it landed', body: 'Check back after the fix. "Is the new dish exactly what you were expecting?" This turns the resolution into a recovery — and shows you cared beyond the transaction.', badge: 'Close the loop' },
      ]},
      { type: 'callout', tone: 'warn', label: 'Prohibited in complaint handling', text: '"The kitchen was very busy tonight." / "Are you sure you ordered medium-rare?" / "That\'s never happened before." / "That\'s not my fault." / "I\'m sorry but..." — These phrases end the relationship. Every single one.' },
      { type: 'do-dont', title: 'Difficult scenarios — correct responses', items: [
        { dont: '"The kitchen was really backed up tonight — that\'s why it took so long."', do: '"I sincerely apologize for the wait. Let me check on that right now and I\'ll be back with you in two minutes."' },
        { dont: '"Are you sure it was overcooked? Medium-rare can look more done than expected."', do: '"You\'re absolutely right, and I\'m sorry. Let me get that replaced for you right away. Can I bring you something while you wait?"' },
        { dont: '"That\'s not something I can fix — you\'d need to speak with the manager."', do: '"I\'m so sorry about that. Let me fix this for you right now."' },
      ]},
      { type: 'tip-list', title: 'What guests actually want when they complain', items: [
        'To be heard — this is the most important thing. Let them finish.',
        'To be believed — never question their experience.',
        'A real solution, fast — not a process, not an escalation.',
        'To feel valued, not like a burden or a problem to be managed.',
      ]},
    ],
    quiz: [
      { q: 'A guest says "This is overcooked." You say:', options: ['"Are you sure? Medium-rare can look more done than expected."', '"I\'m so sorry — the kitchen has been really busy tonight."', '"You\'re absolutely right, and I\'m sorry. Let me get that replaced for you right away."', '"I\'ll mention it to the chef."'], correct: 2, explain: 'Own it immediately. No excuses, no deflection. "You\'re right, I\'m sorry, I\'ll fix it" is the entire protocol compressed into one sentence.' },
      { q: 'A guest says "We\'ve been waiting 30 minutes." You say:', options: ['"I\'m sorry but the kitchen is backed up tonight."', '"30 minutes isn\'t unusual on a busy night."', '"I sincerely apologize for the wait. Let me check on that right now and I\'ll be back in two minutes."', '"Did you let anyone know you were waiting?"'], correct: 2, explain: 'Acknowledge the wait with a genuine apology, then act immediately with a specific time you\'ll return. Never explain or justify — that\'s your problem, not theirs.' },
      { q: 'Which response is prohibited in complaint handling?', options: ['Offering a concrete solution immediately', '"The kitchen was backed up — that\'s why it happened."', 'Checking back after the fix', 'Acknowledging the guest\'s frustration'], correct: 1, explain: 'Blaming the kitchen — or any circumstance — shifts responsibility away from you and makes the guest feel like a problem. Never deflect. Own it entirely.' },
      { q: 'A guest receives the wrong order. The correct response is:', options: ['"The ticket showed [X] — let me show you."', '"That sometimes happens with our system."', '"I\'m so sorry about that. Let me fix this for you immediately."', '"Which server took your order?"'], correct: 2, explain: 'It doesn\'t matter how it happened — only how you fix it. Defending the process or questioning the guest signals that you value being right over their experience.' },
      { q: 'After resolving a complaint, you should:', options: ['Leave them alone — they\'ve had enough interaction.', 'Offer a discount on the bill immediately.', 'Check back after the fix to confirm they\'re satisfied.', 'Ask them to fill out a feedback form.'], correct: 2, explain: 'The follow-up is Step 4 — and often the most powerful. Checking back shows you cared beyond the fix. It turns a recovery into a loyalty moment.' },
    ],
  },
];

// ─── MODULE 4: HANDLING COMPLAINTS & ERRORS ─────────────────

const complaintsLessons: Lesson[] = [
  {
    id: 'four-step',
    title: 'The 4-Step Error Protocol',
    desc: 'Listen → Accept → Resolve → Compensate',
    duration: '8 min',
    xp: 60,
    status: 'available',
    scenarioId: 'overcooked-burger',
    learn: [
      { type: 'intro', text: 'A complaint handled perfectly creates more loyalty than a meal that went right the first time. Guests don\'t expect perfection — they expect honesty and action. The 4-step protocol is your tool for turning a broken moment into a defining one.' },
      { type: 'steps', title: 'The 4 Steps', items: [
        { num: 1, title: 'Listen without interrupting', body: 'Let the guest finish completely. Don\'t justify, don\'t explain, don\'t pre-empt. This takes discipline. Do it.' },
        { num: 2, title: 'Accept responsibility', body: 'Never blame the kitchen. Never say "that happens sometimes." Own it: "That is absolutely our mistake and I\'m sorry."' },
        { num: 3, title: 'Resolve immediately', body: 'Don\'t say "I\'ll check." Say "I\'m going to fix this right now." Then do it — replace the dish, get the manager, act.' },
        { num: 4, title: 'Compensate if needed', body: 'A complimentary drink while they wait. A dessert on the house. The gesture doesn\'t have to be large — it has to be genuine.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'Never Say This', text: '"The kitchen was very busy tonight." / "Are you sure you ordered medium-rare?" / "That happens sometimes with our grill." These phrases end the relationship.' },
    ],
    quiz: [],
  },
  {
    id: 'overcooked',
    title: 'The Overcooked Burger',
    desc: 'The most common complaint — handled perfectly',
    duration: '7 min',
    xp: 50,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'long-wait',
    title: 'The Long Wait',
    desc: 'Proactive communication vs reactive apology',
    duration: '7 min',
    xp: 50,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'wrong-order',
    title: 'Wrong Order Recovery',
    desc: 'Own it. Fix it. Make it count.',
    duration: '6 min',
    xp: 45,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'noise-environment',
    title: 'Environment Complaints',
    desc: 'Temperature, noise, seating — what\'s in your control',
    duration: '6 min',
    xp: 40,
    status: 'available',
    learn: [],
    quiz: [],
  },
];

// ─── MODULE 5: FLOOR CHOREOGRAPHY ───────────────────────────

const floorLessons: Lesson[] = [
  {
    id: 'route-coordination',
    title: 'Routes & Coordination',
    desc: 'Never cross paths — move with intention',
    duration: '7 min',
    xp: 50,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'synchronized-service',
    title: 'Synchronized Plating',
    desc: 'All plates go out together — always',
    duration: '8 min',
    xp: 55,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'visual-signals',
    title: 'Visual Communication',
    desc: 'Eye contact, nods, and silent coordination',
    duration: '6 min',
    xp: 45,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'clearing',
    title: 'Clearing Protocol',
    desc: 'Never clear while someone is still eating',
    duration: '5 min',
    xp: 35,
    status: 'available',
    learn: [],
    quiz: [],
  },
];

// ─── MODULE 6: GUEST PSYCHOLOGY ─────────────────────────────

const guestPsychologyLessons: Lesson[] = [
  {
    id: 'couple-service',
    title: 'Serving Couples',
    desc: 'Low interruption, high discretion',
    duration: '7 min',
    xp: 50,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'group-service',
    title: 'Serving Groups',
    desc: 'High energy, flexible pacing, read the table',
    duration: '7 min',
    xp: 50,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'demanding-guest',
    title: 'The Demanding Guest',
    desc: 'Precision over improvisation',
    duration: '8 min',
    xp: 60,
    status: 'available',
    learn: [],
    quiz: [],
  },
  {
    id: 'reading-emotions',
    title: 'Reading the Room',
    desc: 'Adapt before they have to ask',
    duration: '6 min',
    xp: 45,
    status: 'available',
    learn: [],
    quiz: [],
  },
];

// ─── MODULE REGISTRY ─────────────────────────────────────────

export const CURRICULUM: Module[] = [
  {
    id: 'greetings',
    title: 'Greetings & First Impressions',
    subtitle: 'The first 5 seconds shape the entire experience',
    iconName: 'Hand',
    color: '#F5A623',
    progress: 0.5,
    totalLessons: 4,
    completedLessons: 2,
    available: true,
    xpTotal: 165,
    lessons: greetingsLessons,
  },
  {
    id: 'service-flow',
    title: 'The Service Flow',
    subtitle: '[Property]\'s 10-step standard, start to finish',
    iconName: 'BookOpen',
    color: '#111111',
    progress: 0,
    totalLessons: 5,
    completedLessons: 0,
    available: true,
    xpTotal: 300,
    lessons: serviceFlowLessons,
  },
  {
    id: 'language',
    title: 'Language & Storytelling',
    subtitle: 'The words that create extraordinary experiences',
    iconName: 'MessageSquare',
    color: '#D4A574',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 245,
    lessons: languageLessons,
  },
  {
    id: 'complaints',
    title: 'Handling Complaints & Errors',
    subtitle: 'Turn a broken moment into a defining one',
    iconName: 'Shield',
    color: '#E07A5F',
    progress: 0,
    totalLessons: 5,
    completedLessons: 0,
    available: true,
    xpTotal: 245,
    lessons: complaintsLessons,
  },
  {
    id: 'floor',
    title: 'Floor Choreography',
    subtitle: 'Fluid, synchronized, invisible teamwork',
    iconName: 'Users',
    color: '#81B29A',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 185,
    lessons: floorLessons,
  },
  {
    id: 'guest-psychology',
    title: 'Guest Psychology',
    subtitle: 'Read the table. Adapt the service.',
    iconName: 'Brain',
    color: '#8DA9C4',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 205,
    lessons: guestPsychologyLessons,
  },
];
