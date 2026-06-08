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
  | { type: 'tip-list'; title: string; items: string[] }
  | { type: 'video-group'; videos: { title: string; url: string; description: string }[] };

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

// ─── MODULE 2: THE PHYSICAL CRAFT ───────────────────────────

const physicalCraftLessons: Lesson[] = [
  {
    id: 'tray-carrying',
    title: 'Tray Carrying — The Foundation',
    desc: 'The skill that defines your confidence on the floor',
    duration: '8 min',
    xp: 60,
    status: 'available',
    scenarioId: 'first-tray-full-room',
    learn: [
      { type: 'intro', text: 'Before you serve a single guest — master the tray.\n\nA dropped tray is not just lost food. It breaks the entire atmosphere of the room. Guests notice. Confidence with a tray communicates competence before you say a word.' },
      { type: 'principles', items: [
        { num: 1, title: 'Left hand only', body: 'Palm open, fingers spread. The tray rests on your palm and fingertips — not just your fingers.' },
        { num: 2, title: 'Shoulder height', body: 'Carry at shoulder height or just above. Never in front of the body, never down by your side.' },
        { num: 3, title: 'Weight distribution', body: 'Heavy items at the CENTER of the tray, lighter items on the outside. Balance is everything.' },
        { num: 4, title: 'Turning correctly', body: 'When turning: rotate your ENTIRE BODY — never twist just your wrist. The wrist alone cannot handle the torque.' },
        { num: 5, title: 'Putting down', body: 'Bend at the knees, back straight. Use both hands to lower the tray — never let it drop.' },
        { num: 6, title: 'Route planning', body: 'Never use narrow paths or busy areas. Plan your route before you load the tray.' },
        { num: 7, title: 'If unstable', body: 'If a tray feels unstable: stop, steady, then continue — never rush through instability.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'Common Mistakes', text: 'Fingers only (no palm support) → unstable. Carrying too high above head → dangerous. Twisting wrist to turn → spills guaranteed. Overloading → make two trips, never risk it. Looking down at the tray → look forward, trust your hands. Hair tied back, face forward when carrying.' },
      { type: 'video-group', videos: [
        { title: 'Tray Carrying Technique', url: 'https://www.youtube.com/embed/4c2sIvi196c', description: '' },
      ]},
    ],
    quiz: [
      { q: 'Which hand should always carry the tray?', options: ['Right hand', 'Left hand', 'Either hand', 'Both hands together'], correct: 1, explain: 'Left hand always — this keeps your right hand free to open doors, guide guests, or steady items.' },
      { q: 'Where do heavy items go on the tray?', options: ['Outer edges for easy access', 'Center of the tray', 'Left side to balance your arm', "It doesn't matter"], correct: 1, explain: 'Heavy items center — this keeps the weight balanced over your palm. Heavy items on the edge tip the tray.' },
      { q: 'Your tray feels unstable while walking. What do you do?', options: ['Speed up to get to the table faster', 'Stop completely, steady the tray, then continue', 'Grab the tray with both hands and carry it in front of you', 'Ask a colleague to take it'], correct: 1, explain: "Stop and steady. Never rush through instability. A moment's pause is better than a full tray on the floor." },
      { q: 'When you need to turn direction, you:', options: ['Pivot your wrist to redirect the tray', 'Rotate your entire body as one unit', 'Lean in the direction you want to go', 'Switch the tray to your other hand'], correct: 1, explain: 'Full body rotation. Your wrist alone cannot handle the torque — rotating your whole body keeps the tray level and safe.' },
      { q: 'The path to table 7 goes through a narrow corridor. You should:', options: ['Go through carefully, holding the tray high', 'Find an alternate route, never use narrow paths with a tray', 'Ask a colleague to clear the way', 'Put the tray down and carry plates by hand'], correct: 1, explain: "Never use narrow or busy paths. Plan your route before you load the tray. If you can't walk through comfortably, find another way." },
    ],
  },
  {
    id: 'plate-carrying',
    title: 'Plate Carrying',
    desc: 'One plate, two plates, three plates — the technique that saves time and looks professional',
    duration: '7 min',
    xp: 55,
    status: 'available',
    scenarioId: 'table-6-main-course',
    learn: [
      { type: 'intro', text: 'Plates are the most visible skill you have on the floor. How you carry them tells guests everything about your confidence and training before you say a word.' },
      { type: 'steps', title: 'The progression', items: [
        { num: 1, title: 'One plate', body: 'Right hand, three middle fingers together under the plate. Thumb and little finger raised as guides. Keep the plate level — tilting shows the sauce.', badge: 'Master this first' },
        { num: 2, title: 'Two plates (same hand)', body: 'First plate: standard one-plate grip. Second plate: rest the center on the thumb muscle (base of thumb). Adjust position until balanced — every hand is different, practice matters.', badge: 'Then this' },
        { num: 3, title: 'Three plates', body: 'First two plates in right hand as above. Third plate: rest on your forearm/wrist, balanced on the rim of the second plate. Left hand holds the third plate steady from below. Move slowly — this takes practice.', badge: 'Advanced' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Rules', text: 'Never tilt a plate — it looks rushed and can spill. Never cover the food with your thumb. Serve from the correct side (property standard). Never stack plates you are actively serving. If unsure about 3 plates — do 2 trips. A clean 2-plate carry beats a shaky 3-plate every time.' },
      { type: 'video-group', videos: [
        { title: 'Plate Carrying Technique', url: 'https://www.youtube.com/embed/ZfIyfODimvo', description: '' },
      ]},
    ],
    quiz: [
      { q: 'When carrying one plate, which fingers go under the plate?', options: ['Thumb and index finger only', 'Three middle fingers together', 'All five fingers spread', 'Pinky and ring finger'], correct: 1, explain: 'Three middle fingers together give a stable flat surface. Thumb and pinky act as side guides.' },
      { q: 'For a two-plate carry, where does the second plate rest?', options: ['On top of the first plate', 'On the thumb muscle at the base of your hand', 'Balanced on your forearm', 'In your other hand'], correct: 1, explain: 'The thumb muscle (base of thumb) gives a wide, stable surface for the second plate to rest on.' },
      { q: "You need to carry 3 plates to a table of 5. You've only practiced 2-plate carries. What do you do?", options: ["Attempt the 3-plate carry — guests don't mind if you're slow", "Do two clean 2-plate trips — don't risk an unstable carry", 'Use a tray instead', 'Ask a colleague to carry the third'], correct: 1, explain: 'Two clean trips beats one shaky 3-plate carry every time. Confidence and safety first. Build up to 3 plates with practice.' },
      { q: "What's wrong with tilting a plate while carrying it?", options: ["Nothing — it's faster", 'It looks unprofessional and can spill the food or sauce', 'It makes the plate easier to carry', 'Guests prefer seeing the food from an angle'], correct: 1, explain: 'A tilted plate tells the guest you are rushing. It also risks spilling sauce or liquid — always keep plates level.' },
      { q: 'You are mid-service and one of your three plates starts slipping. What now?', options: ['Tighten your grip and keep walking', 'Stop immediately, find a stable surface, reset your grip', 'Speed up to get to the table faster', 'Call for help loudly'], correct: 1, explain: 'Stop immediately. A plate on the floor — or on a guest — is worse than a brief pause. Always choose safety over speed.' },
    ],
  },
  {
    id: 'floor-movement',
    title: 'Floor Movement & Navigation',
    desc: 'How you move says everything about who you are on the floor',
    duration: '6 min',
    xp: 50,
    status: 'available',
    scenarioId: 'busy-saturday',
    learn: [
      { type: 'intro', text: 'How you move through a room communicates everything. A server who moves with purpose, head up, at the right pace — tells every guest that this floor is under control.' },
      { type: 'principles', items: [
        { num: 1, title: 'Posture', body: 'Back straight, shoulders relaxed, head up. Never looking down at the floor. Deliberate pace — not slow, not rushed.' },
        { num: 2, title: 'Right side of corridors', body: 'Always walk on the right side of pathways. This prevents collisions and creates natural flow.' },
        { num: 3, title: 'Guests always have right of way', body: 'Step aside for guests — always. Never expect them to move for you. Give way to colleagues carrying food.' },
        { num: 4, title: 'No running, no shuffling', body: 'Never run — it signals panic and stresses the room. Never shuffle — it signals disengagement. Smooth, quiet, purposeful movement only.' },
        { num: 5, title: 'Pre-bus passes', body: 'Every time you walk past a table, check what is needed. Never walk empty-handed past a table that needs attention.' },
        { num: 6, title: 'Always moving with purpose', body: 'Never stand idle in the middle of the floor. Always be moving toward something purposeful. If unsure what to do — check the tables.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'Danger Zones', text: 'Kitchen door exits: slow down, look before entering/exiting. Corners: slow down and step out before turning. Wet floors: never rush, always tell a manager immediately.' },
      { type: 'callout', tone: 'tip', label: 'What movement communicates', text: 'Rushed movement = stressed kitchen, stressed guest. Slow wandering = nobody is in control. Purposeful smooth movement = everything is under control.' },
    ],
    quiz: [
      { q: 'On which side of corridors and pathways should you always walk?', options: ['Left side', 'Right side', 'Either side', 'Down the middle'], correct: 1, explain: 'Always walk on the right side of corridors. This prevents collisions and creates a natural flow of traffic through the space.' },
      { q: 'A guest is walking toward you in a narrow corridor. You should:', options: ['Continue walking — they will move', 'Step aside and let them pass', 'Speed up to get past them quickly', 'Ask them to move to the side'], correct: 1, explain: 'Guests always have right of way. Always step aside — never expect a guest to move for you. This is non-negotiable.' },
      { q: 'You are approaching a kitchen door exit with a full tray. You should:', options: ['Walk through quickly to save time', 'Slow down and look before entering or exiting', 'Use your shoulder to push through', 'Announce loudly that you are coming through'], correct: 1, explain: 'Kitchen door exits are danger zones — always slow down and look before entering or exiting. A moment of caution prevents a collision.' },
      { q: 'You notice a wet floor near table 5 during service. What is the correct action?', options: ['Walk carefully and continue with service', 'Tell a manager immediately and avoid the area', 'Clean it yourself while still carrying items', 'Let guests know to be careful'], correct: 1, explain: 'Never rush on a wet floor. Alert a manager immediately and avoid the area. Safety first — service waits.' },
      { q: 'You are walking past table 3 on your way to the kitchen. What should you do?', options: ['Walk straight through without stopping', 'Glance at the table and check if anything is needed', 'Stop and ask if everything is okay', 'Only stop if a guest flags you'], correct: 1, explain: 'Every pass by a table is an opportunity — the pre-bus pass. Check what is needed as you walk by. It catches problems before they become requests.' },
    ],
  },
  {
    id: 'table-setting',
    title: 'Table Setting to Standard',
    desc: "The table is the guest's first impression before you say a word",
    duration: '7 min',
    xp: 60,
    status: 'available',
    scenarioId: 'pre-service-inspection',
    learn: [
      { type: 'intro', text: "A perfectly set table communicates standards before the guest speaks to a single staff member. A crooked fork, a smudged glass, a missing napkin — these tell the guest everything about how much you care." },
      { type: 'steps', title: 'Standard cover setup', items: [
        { num: 1, title: 'Fork', body: 'Left of the plate. Tines up, handle parallel to the knife.' },
        { num: 2, title: 'Knife', body: 'Right of the plate. Blade facing INWARD — toward the plate. Always.' },
        { num: 3, title: 'Spoon', body: 'Right of the knife. Handle aligned with the knife handle.' },
        { num: 4, title: 'Water glass', body: 'Above the knife, positioned slightly to the right.' },
        { num: 5, title: 'Wine glass', body: 'To the right of the water glass (if applicable). Polished and streak-free.' },
        { num: 6, title: 'Napkin', body: 'On the plate or to the left of the fork. Folded cleanly and consistently across all tables.' },
      ]},
      { type: 'tip-list', title: 'Pre-service checklist — every table, every time', items: [
        'All glasses polished and streak-free — hold to light to check.',
        'Cutlery aligned and parallel — fork handles at the same level as knife handles.',
        'Plates clean and chip-free — any damaged plate goes back, not to a table.',
        'Napkins folded consistently across all tables in the section.',
        'Table surface clean and completely dry.',
        'Centerpiece or candle in position.',
        'Menus clean and in position.',
      ]},
      { type: 'callout', tone: 'rule', label: 'The Golden Rule', text: "Never seat a guest at a table you would not be proud to sit at yourself. If you would notice it — they will too." },
      { type: 'callout', tone: 'tip', label: 'Polishing glasses', text: 'Hold the glass by the stem only — never the bowl. Polish with a clean lint-free cloth. Hold up to light to check for streaks. A smudged glass goes back — never to a guest table.' },
    ],
    quiz: [
      { q: 'Where does the knife blade face in a standard cover?', options: ['Away from the plate (outward)', 'Toward the plate (inward)', 'Upward', "It doesn't matter"], correct: 1, explain: 'The knife blade always faces inward — toward the plate. This is a universal dining standard and a sign of a correctly set table.' },
      { q: 'Where should the water glass be placed in a standard cover?', options: ['Directly above the fork', 'Above the knife, slightly to the right', 'To the left of the fork', 'In the center of the cover'], correct: 1, explain: 'Water glass goes above the knife, positioned slightly to the right. This is the standard cover position.' },
      { q: 'How should you hold a glass when polishing it?', options: ['By the bowl for a firm grip', 'By the stem only', 'By the rim', 'By the base'], correct: 1, explain: 'Always hold glasses by the stem when polishing — never the bowl. Fingerprints on the bowl require re-polishing and are visible to guests.' },
      { q: 'A glass still has a streak after polishing. What do you do?', options: ['Turn it streak-side away from the guest', 'Polish it again until completely streak-free', "Place it anyway — guests won't notice in the lighting", 'Use a damp cloth to remove the streak'], correct: 1, explain: 'A smudged or streaked glass never goes to a guest table. Polish again until it passes the light test.' },
      { q: 'You find a small chip on one plate while resetting a table. What do you do?', options: ['Place it at the bottom of the stack', "Use it — it's only a small chip", 'Remove it from service immediately', 'Place it with the chip facing down, away from the guest'], correct: 2, explain: 'Chipped or damaged plates are removed from service immediately — no exceptions. A chipped plate is a safety concern and signals poor standards.' },
    ],
  },
  {
    id: 'synchronized-service',
    title: 'Synchronized Service',
    desc: 'Great service is invisible — because the whole team moves as one',
    duration: '8 min',
    xp: 75,
    status: 'available',
    scenarioId: 'six-top-all-at-once',
    learn: [
      { type: 'intro', text: "Guests don't see the teamwork behind great service — and that's exactly the point. When service is synchronized, it looks effortless. When it breaks down, guests feel it immediately: one person eating while the others watch, servers crossing paths, plates arriving one at a time. Choreography is not accidental." },
      { type: 'steps', title: 'The choreography rules', items: [
        { num: 1, title: 'All plates go out together', body: 'Every plate for a table leaves the kitchen at the same time. No exceptions. If one plate is 2 minutes behind, the team waits.', badge: 'Non-negotiable' },
        { num: 2, title: 'Never cross paths', body: 'Know who is carrying what and which route they are taking. A collision — physical or visual — breaks the illusion of fluid service.', badge: 'Always' },
        { num: 3, title: 'Clear simultaneously', body: 'When the last guest at a table finishes, all servers move in together. One plate at a time is amateur — synchronized clearing is invisible.', badge: 'Together' },
        { num: 4, title: 'Communicate without words', body: 'Eye contact, nods, and brief gestures coordinate the floor silently. Loud verbal coordination in front of guests breaks the experience.', badge: 'Silent' },
        { num: 5, title: 'Move with intention', body: 'No rushing, no stopping mid-floor to chat. Every movement has a purpose and a destination.', badge: 'Intention' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The 3-Second Rule', text: 'When you approach a table with your team, everyone arrives within 3 seconds of each other. Not 30. Not 10. Three. This is what makes synchronized service invisible.' },
      { type: 'principles', items: [
        { num: 1, title: 'Server', body: 'Owns the guest relationship. Knows the table\'s history, preferences, and flow. Calls the timing — communicates pace to the team.' },
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
      { q: 'A table of 5 is ready for their mains — but one plate is 2 minutes behind. You:', options: ["Serve the 4 ready plates — guests shouldn't wait", 'Wait for all 5 plates before leaving the kitchen', 'Warn the guests that one plate is coming separately', 'Ask the guest whose plate is late to wait'], correct: 1, explain: 'All plates go out together — non-negotiable. One person eating while four others watch is worse than a 2-minute hold.' },
      { q: 'The 3-second rule of synchronized service means:', options: ['Each plate should be placed within 3 seconds', 'All team members arrive at the table within 3 seconds of each other', 'Food should reach the table within 3 seconds of leaving the kitchen', 'Clearing should take no more than 3 seconds'], correct: 1, explain: 'All servers arrive at the table within 3 seconds of each other — not 30, not 10. Three. This is what makes service look choreographed rather than chaotic.' },
      { q: 'How do you coordinate with your team during synchronized service without disturbing guests?', options: ['Whisper quietly near the kitchen', 'Use a headset communication system', 'Eye contact and small nods — silent visual communication', 'Pre-plan all movements before service starts'], correct: 2, explain: 'Silent communication — eye contact and nods — keeps coordination invisible to guests. Verbal coordination in front of a table breaks the experience.' },
      { q: 'Who owns the timing and calls the pace of service for a table?', options: ['The runner, who controls kitchen timing', 'The captain, who manages the whole floor', 'The server, who owns the guest relationship', 'The kitchen, which sets the pace'], correct: 2, explain: 'The server owns the guest relationship and calls the timing. Runners support logistics. The captain coordinates the floor. But timing comes from the person closest to the guest.' },
      { q: 'When should the team move in to clear a table?', options: ['When each guest finishes their plate', 'When the majority of guests have finished', 'When the last guest finishes — then all plates together', 'After asking each guest individually'], correct: 2, explain: 'Clear when the last guest finishes — and clear all plates simultaneously. Never clear while someone is still eating. Never clear one plate at a time at the same table.' },
    ],
  },
];

// ─── MODULE 3: THE SERVICE FLOW ─────────────────────────────

const serviceFlowLessons: Lesson[] = [
  // 3 lessons: ten-steps, proactive-reactive, nonverbal-signals
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
];

// ─── MODULE 4: LANGUAGE & STORYTELLING ──────────────────────

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

// ─── MODULE 5: HANDLING DIFFICULT SITUATIONS ────────────────

const complaintsLessons: Lesson[] = [
  {
    id: 'mindset-shift',
    title: 'The Mindset Shift',
    desc: 'Why complaints are the best thing that can happen to you',
    duration: '7 min',
    xp: 60,
    status: 'available',
    scenarioId: 'silent-table',
    learn: [
      { type: 'intro', text: '96% of dissatisfied guests leave without saying a word. They just never come back. The 4% who do complain are giving you a second chance — and most hospitality professionals don\'t realize it.' },
      { type: 'callout', tone: 'rule', label: 'The Service Recovery Paradox', text: 'Guests who experience a great service recovery are MORE loyal than guests who never had a problem at all. A complaint is not a failure. A guest leaving silently IS the failure.' },
      { type: 'principles', items: [
        { num: 1, title: '96% never say a word', body: 'They just leave — and never come back. The ones who complain are the minority, and they\'re giving you a gift.' },
        { num: 2, title: '70% will return if resolved', body: 'Resolve a complaint and 70% of unhappy guests come back. Resolve it quickly and that number jumps to 95%.' },
        { num: 3, title: 'Speed is everything', body: 'A problem solved in 2 minutes creates more loyalty than a perfect night. Speed of recovery matters more than the mistake itself.' },
        { num: 4, title: 'A complaint is a second chance', body: 'When a guest complains, they\'re saying: "I still believe in this place. I\'m giving you a chance." Honor that.' },
      ]},
      { type: 'do-dont', title: 'The mindset shift', items: [
        { dont: 'OLD: "Oh no, a complaint. This is bad."', do: 'NEW: "This guest is giving me a rare opportunity to earn their loyalty permanently."' },
        { dont: 'Freezing or getting defensive when someone complains.', do: 'Moving fast, with ownership, with genuine care.' },
        { dont: 'Making excuses for what went wrong.', do: 'Focusing entirely on fixing it — right now.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'What great hospitality professionals do differently', text: 'They don\'t freeze when someone complains. They don\'t get defensive. They don\'t make excuses. They move — fast, with ownership, with genuine care. The most important rule: speed of recovery matters more than the mistake itself.' },
    ],
    quiz: [
      { q: 'What percentage of unhappy guests never complain — they just leave?', options: ['40%', '65%', '96%', '80%'], correct: 2, explain: '96% of dissatisfied guests leave without saying a word. The ones who complain are the minority — and they\'re giving you a gift.' },
      { q: 'A guest complains about their meal. According to the Service Recovery Paradox, what\'s possible if you handle it brilliantly?', options: ['They will probably never return regardless', 'They can become MORE loyal than guests who never had a problem', 'They will leave a negative review no matter what', 'You can only hope they forgive you'], correct: 1, explain: 'The Service Recovery Paradox is real — a brilliantly handled complaint creates stronger loyalty than a flawless experience. The emotional impact of being truly heard and helped is that powerful.' },
      { q: 'What does it mean when a guest chooses to complain instead of leaving?', options: ['They are difficult and demanding', 'They are giving you a second chance — they still believe in you', 'They want compensation', 'They are testing your patience'], correct: 1, explain: 'A complaining guest is a loyal guest in waiting. They chose to speak up instead of walking out. That\'s a gift.' },
      { q: 'A table has been waiting 25 minutes for their food and nobody has checked on them. They haven\'t said anything. What\'s the real danger?', options: ['Nothing — if they were upset they would have said something', 'They are silently building frustration and may never return after tonight', 'They are probably fine, just enjoying the conversation', 'You should wait until they flag you'], correct: 1, explain: 'Silent dissatisfaction is the most dangerous kind. 96% never say anything. You must proactively check — don\'t wait to be flagged.' },
      { q: 'What matters MORE in service recovery?', options: ['The size of the compensation offered', 'Speed — how quickly the problem is resolved', 'A detailed explanation of what went wrong', 'Involving a manager immediately'], correct: 1, explain: 'Speed of recovery is the single biggest factor in guest satisfaction after a complaint. A fast, genuine fix beats a slow perfect one every time.' },
    ],
  },
  {
    id: 'learn-protocol',
    title: 'The LEARN Protocol',
    desc: 'The 5-step framework used by Marriott, Hilton and IHG worldwide',
    duration: '8 min',
    xp: 65,
    status: 'available',
    scenarioId: 'wrong-order-allergy',
    learn: [
      { type: 'intro', text: 'When something goes wrong, there is one framework used by the world\'s leading hospitality groups. It works in every situation, with every guest, every time. Master it.' },
      { type: 'steps', title: 'The LEARN Model', items: [
        { num: 1, title: 'L — LISTEN', body: 'Give the guest your full attention. Do not interrupt. Do not prepare your response while they speak. Let them finish completely. Face them directly. No phone, no notepad. Make eye contact.', badge: 'Full attention' },
        { num: 2, title: 'E — EMPATHIZE', body: 'Acknowledge what they felt, not just what happened. Not: "I understand there was an issue." But: "I completely understand — that\'s genuinely frustrating and I\'m sorry." Guests need to feel understood before they can accept a solution.', badge: 'Feelings first' },
        { num: 3, title: 'A — APOLOGIZE', body: 'A genuine, direct apology. No excuses. Say: "I\'m sorry this happened." Not: "I\'m sorry you feel that way." Not: "I\'m sorry but the kitchen was busy." The apology must be unconditional.', badge: 'No excuses' },
        { num: 4, title: 'R — RESOLVE', body: 'Offer a concrete solution immediately. Don\'t say "let me see what I can do." Say "Here\'s what I\'m going to do right now." Always tell them WHAT and WHEN. "I\'m going to the kitchen right now and I\'ll be back in 3 minutes."', badge: 'Act now' },
        { num: 5, title: 'N — NOTIFY', body: 'Follow up. Always. Check back after the resolution. "Is everything better now? Is there anything else I can do?" Most staff resolve and disappear. The follow-up is what turns a recovered guest into a loyal one.', badge: 'Close the loop' },
      ]},
      { type: 'callout', tone: 'warn', label: 'The Most Common Failure', text: 'Jumping to a solution before the guest finishes speaking. This makes them feel unheard — and more frustrated. Let them finish. Every time.' },
      { type: 'do-dont', title: 'In practice', items: [
        { dont: '"I understand there was an issue with your food."', do: '"I completely understand — waiting that long when you\'re hungry is genuinely frustrating and I\'m sorry for that."' },
        { dont: '"I\'m sorry you feel that way."', do: '"I\'m sorry — that\'s not acceptable and I\'m going to fix it right now."' },
        { dont: '"Let me see what I can do."', do: '"Here\'s what I\'m going to do right now." Then do it.' },
      ]},
    ],
    quiz: [
      { q: 'A guest is explaining their complaint. You realize you know exactly what happened and how to fix it. What do you do?', options: ['Interrupt politely and offer the solution — saves time', 'Let them finish speaking completely before responding', 'Start walking toward the kitchen to fix it while they talk', 'Nod and say "yes yes I know"'], correct: 1, explain: 'Never interrupt. The most common mistake in complaint handling is jumping to a solution before the guest finishes. They need to feel completely heard first.' },
      { q: 'What\'s the difference between empathy and sympathy in complaint handling?', options: ['Nothing — they mean the same thing', 'Empathy acknowledges their feelings; sympathy just acknowledges the facts', 'Sympathy is more professional', 'Empathy is only for serious complaints'], correct: 1, explain: '"I understand there was a problem" is sympathy — facts only. "I understand how frustrating that must have been" is empathy — feelings first. Guests need to feel understood, not just processed.' },
      { q: 'A guest complains their food was cold. Which apology is correct?', options: ['"I\'m sorry you feel that way"', '"I\'m sorry but we\'ve been very busy tonight"', '"I\'m sorry — that\'s not acceptable and I\'m going to fix it right now"', '"I apologize but it was hot when it left the kitchen"'], correct: 2, explain: 'The apology must be direct and unconditional. No excuses, no blame-shifting. "I\'m sorry you feel that way" is not an apology — it dismisses their experience.' },
      { q: 'After resolving a complaint, what must you always do?', options: ['Thank the guest for their patience and move on', 'Follow up to confirm they\'re satisfied', 'Let them enjoy their meal without further interruption', 'Inform the manager immediately'], correct: 1, explain: 'The N in LEARN is Notify — always follow up. Most staff resolve and disappear. The follow-up is what converts a recovered guest into a loyal one.' },
      { q: 'A guest is still unhappy after your resolution attempt. What now?', options: ['Apologize again and walk away', 'Escalate to a manager immediately — some situations require more authority', 'Offer more and more compensation until they\'re happy', 'Explain the situation more clearly'], correct: 1, explain: 'Know when to escalate. You are empowered to resolve most situations — but if a guest remains upset after your best effort, a manager must step in. Escalation is not failure — it\'s professionalism.' },
    ],
  },
  {
    id: 'common-situations',
    title: 'The Most Common Situations',
    desc: 'Exact scripts for the situations that happen every service',
    duration: '9 min',
    xp: 70,
    status: 'available',
    scenarioId: 'billing-dispute',
    learn: [
      { type: 'intro', text: 'These five situations will happen tonight. Know exactly what to say before they happen — and you\'ll handle them with confidence every time.' },
      { type: 'do-dont', title: 'Situation 1: Overcooked / Undercooked Food', items: [
        { dont: '"I\'ll let the kitchen know." (Too passive — no ownership)', do: '"You\'re absolutely right and I\'m sorry — that\'s not what you ordered. Let me get that replaced right away. Can I bring you something to enjoy while you wait? I\'ll be back in 8 minutes."' },
      ]},
      { type: 'do-dont', title: 'Situation 2: Long Wait', items: [
        { dont: '"The kitchen is really busy tonight." (Excuse, not a solution)', do: '"I\'m so sorry for the wait — that\'s too long and you\'re right to say something. Let me check on your order right now and I\'ll be back in two minutes with an update. Can I bring you some bread while you wait?"' },
      ]},
      { type: 'do-dont', title: 'Situation 3: Wrong Order', items: [
        { dont: '"Are you sure? Let me check what you ordered." (Never question the guest)', do: '"I\'m so sorry — let me fix this for you immediately. What did you order? I\'ll have the correct dish out as quickly as possible."' },
      ]},
      { type: 'do-dont', title: 'Situation 4: Billing Dispute', items: [
        { dont: '"That\'s what our system shows." (Dismissive)', do: '"Let me take a look at this right away. If there\'s an error, we\'ll correct it immediately. Can you show me which item you\'re referring to?"' },
      ]},
      { type: 'do-dont', title: 'Situation 5: Quality Complaint', items: [
        { dont: '"That\'s how it\'s supposed to taste." (Dismissive and argumentative)', do: '"Thank you for telling me — I\'ll take this back right away and bring you something fresh. I\'m sorry this wasn\'t right."' },
      ]},
      { type: 'tip-list', title: 'The universal rules across all situations', items: [
        'Own it immediately — never question, deflect, or blame.',
        'Give a specific action: "I\'ll be back in X minutes" — not vague promises.',
        'Offer something during the wait: bread, a drink, an amuse.',
        'Follow up after the fix — every single time.',
      ]},
    ],
    quiz: [
      { q: 'A guest says "We\'ve been waiting 40 minutes." Which response is correct?', options: ['"The kitchen is really busy tonight."', '"I\'m so sorry for the wait — that\'s too long. Let me check right now and be back in two minutes. Can I bring you something while you wait?"', '"40 minutes isn\'t unusual on a busy night."', '"I\'ll go find out what happened."'], correct: 1, explain: 'Acknowledge the wait specifically, never make excuses, give a concrete timeline, and offer something. The kitchen being busy is your problem — not theirs.' },
      { q: 'A guest says their steak is overcooked. What\'s the first thing you do?', options: ['Ask how they\'d like the replacement cooked', 'Own it immediately: "You\'re absolutely right and I\'m sorry — let me get that replaced right away"', 'Check with the kitchen before responding', 'Offer a discount instead of replacing it'], correct: 1, explain: 'Own it immediately. No excuses, no deflection. Replace it, offer something during the wait, give a specific time. Checking with the kitchen before responding wastes precious recovery time.' },
      { q: 'A guest says "This isn\'t what I ordered." What should you NEVER say?', options: ['"I\'m so sorry — what did you order? I\'ll fix this right away."', '"Are you sure? Let me check what you ordered."', '"Let me get the correct dish out as quickly as possible."', '"I sincerely apologize for the confusion."'], correct: 1, explain: 'Never question the guest. "Are you sure?" is the most damaging phrase in complaint handling — it shifts blame onto the guest and signals you don\'t believe them. Own it and fix it.' },
      { q: 'A guest questions a charge on the bill. The correct response is:', options: ['"That\'s what our system shows."', '"Let me take a look at this right away. If there\'s an error, we\'ll correct it immediately."', '"Our billing is always accurate."', '"You\'ll need to speak with the manager about billing."'], correct: 1, explain: 'Never argue. Look at it together. Fix any error immediately and apologize. "That\'s what our system shows" dismisses the guest and invites a confrontation.' },
      { q: 'A guest says "This doesn\'t taste right — it seems off." You say:', options: ['"That\'s how it\'s supposed to taste."', '"Thank you for telling me — I\'ll take this back right away and bring you something fresh. I\'m sorry."', '"Can you describe what\'s wrong with it?"', '"Let me check with the kitchen to confirm."'], correct: 1, explain: 'Never argue about taste. If a guest says something is wrong, believe them and act. "That\'s how it\'s supposed to taste" is the most dismissive response in hospitality.' },
    ],
  },
  {
    id: 'prevention',
    title: 'Prevention Over Recovery',
    desc: 'The best complaint is the one that never happens',
    duration: '7 min',
    xp: 55,
    status: 'available',
    scenarioId: 'read-the-room',
    learn: [
      { type: 'intro', text: 'Every complaint has a warning sign that appeared before the guest said anything. Your job is to see it and act before they have to speak. Prevention is always better — and easier — than recovery.' },
      { type: 'callout', tone: 'rule', label: 'The Prevention Mindset', text: 'The best service recovery is the one you never need. A proactive check-in 2-3 minutes after food arrives prevents 90% of complaints from escalating. Not "Is everything okay?" — but "How are you finding the flavors? Is the temperature right on the dish?"' },
      { type: 'tip-list', title: 'Warning signs — act before they speak', items: [
        'Looking around repeatedly = waiting for attention.',
        'Food barely touched = something may be wrong with the dish.',
        'Whispering between guests = something is being discussed.',
        'Checking the time = feeling rushed or waiting too long.',
        'Pushing food around the plate = not enjoying it.',
        'Tense body language = discomfort with something.',
        'Order taking more than 20 minutes = flag it before they do.',
      ]},
      { type: 'principles', items: [
        { num: 1, title: 'The proactive check-in', body: '2-3 minutes after food arrives, approach before they need to flag you. Not "Is everything okay?" but "How are you finding the flavors? Is the temperature right on the [dish]?" This single habit prevents 90% of complaints from escalating.' },
        { num: 2, title: 'The communication chain', body: 'Server notices a delay → tells the table proactively. Kitchen has an issue → manager tells the floor → floor tells the table. A guest seems unhappy → address it immediately, don\'t wait for it to escalate.' },
        { num: 3, title: 'Catch it before it leaves the kitchen', body: 'If a dish looks different from standard — don\'t send it out. Catching the problem before it reaches the table is the highest level of prevention. The guest never has to know it happened.' },
      ]},
    ],
    quiz: [
      { q: 'A guest has barely touched their food 5 minutes after it arrived. What do you do?', options: ['Wait — they\'ll eat when they\'re ready', 'Approach proactively: "How are you finding the flavors? Is the temperature right?" — something may be wrong', 'Clear the plate and offer something else from the menu', 'Wait for them to flag you'], correct: 1, explain: 'Food barely touched is one of the clearest warning signs. Approach before they have to say anything — "How are you finding the flavors?" gives them a natural opening to speak up without having to escalate.' },
      { q: 'Which check-in phrase prevents 90% of complaints from escalating?', options: ['"Is everything okay?"', '"How are you finding the flavors? Is the temperature right on the dish?"', '"Everything good over here?"', '"Did you enjoy it?"'], correct: 1, explain: '"Is everything okay?" invites a yes/no answer. "How are you finding the flavors?" invites a real conversation and catches problems before they become complaints.' },
      { q: 'A ticket has been sitting for 20 minutes with no update. You should:', options: ['Wait for the kitchen to let you know when it\'s ready', 'Proactively update the table before they have to ask', 'Tell the table only if they complain about the wait', 'Ask your manager to handle the communication'], correct: 1, explain: 'Order taking more than 20 minutes is a warning sign. Communicate to the table proactively — tell them before they have to ask. This converts a potential complaint into a trust moment.' },
      { q: 'A guest keeps glancing at their watch during dinner. This signals:', options: ['They\'re bored with their companion', 'They may be on a schedule — offer to move the pace along proactively', 'They\'re just a nervous person', 'Nothing specific — it\'s a habit'], correct: 1, explain: 'A glance at the watch is a signal. Offer to help before they have to ask: "I can have your next course out in about 8 minutes if that helps." Anticipation turns a potential complaint into a 5-star moment.' },
      { q: 'What does a guest whispering to their dining partner most likely signal?', options: ['They\'re having an intimate private moment', 'Something may be bothering them — approach when there\'s a natural pause', 'They just prefer quiet conversation', 'They\'re deciding on dessert'], correct: 1, explain: 'Whispering between guests — especially after food arrives — often means something is being discussed that they haven\'t decided to raise yet. Approach with a natural check-in and give them the opening.' },
    ],
  },
];

// ─── MODULE 6: GUEST PSYCHOLOGY ─────────────────────────────

const guestPsychologyLessons: Lesson[] = [
  {
    id: 'guest-types',
    title: 'Types of Guests',
    desc: 'Every table is different. Read who you are serving before you open your mouth.',
    duration: '8 min',
    xp: 65,
    status: 'available',
    scenarioId: 'seven-tables',
    learn: [
      { type: 'intro', text: 'The table tells you everything before anyone says a word. Before you approach, look. What do you see? Two people close together — or four suits with laptops? A family with young kids — or a solo traveler with a book? Each requires a completely different version of you.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Read the table before you open your mouth. Match energy to energy. A quiet couple doesn\'t need your best party energy — and a birthday table doesn\'t need a formal check-in. Service adapts to the guest, not the other way around.' },
      { type: 'culture-cards', items: [
        { group: '💑 Romantic Couple', cues: 'Soft, discrete, give them space and privacy. Approach softly, make eye contact, wait for a natural pause. Never interrupt mid-conversation. Never hover. Golden move: acknowledge a special occasion without making it a production.' },
        { group: '👥 Friend Group (4+)', cues: 'Match their energy — warm, playful, engage with the celebration. Flexible pacing — group decisions take time, be patient. Never be stiff or formal. Never rush their ordering. Golden move: engage with the occasion — acknowledge the birthday or celebration.' },
        { group: '💼 Business Table', cues: 'Professional, precise, minimal small talk. Fast and accurate service — invisible. Never ask unnecessary questions or slow them down. Golden move: anticipate the bill request and have it ready without being asked.' },
        { group: '🧳 Solo Traveler', cues: 'Warm welcome, offer local knowledge, don\'t make them feel awkward. Attentive but not intrusive. Never seat them in a bad spot or ignore them because there\'s only one cover. Golden move: a genuine recommendation makes them feel like a local, not a tourist.' },
        { group: '🌍 Tourist (First-Timer)', cues: 'Enthusiastic, share local knowledge, make them feel like they found something special. Never rush their experience. Golden move: tell them one thing about this place they won\'t find on TripAdvisor.' },
        { group: '🏠 Local Regular', cues: 'Recognition, personal touch, use their name if you know it. They know the drill — don\'t over-explain. Never treat them like a stranger. Golden move: remember something from their last visit.' },
        { group: '👨‍👩‍👧 Family with Kids', cues: 'Practical and helpful, support the parents. Kids first: drinks, bread. Flexible on timing. Never seat them next to a romantic couple. Never make them feel like a burden. Golden move: bring something for the kids without being asked.' },
      ]},
    ],
    quiz: [
      { q: 'A couple is seated, speaking softly, clearly on a date night. They haven\'t looked up from their conversation. You approach. What do you do?', options: ['Greet them loudly and enthusiastically to set the energy', 'Approach softly, make eye contact, and wait for a natural pause before speaking', 'Leave them completely alone until they wave at you', 'Ask immediately if they\'re celebrating anything'], correct: 1, explain: 'Romantic couples want presence without interruption. The nod-and-wait is the five-star move — you show you\'re there without breaking their moment.' },
      { q: 'A group of 6 friends is celebrating a birthday — loud, laughing, taking photos. Your service approach should be:', options: ['Formal and professional — keep it polished and efficient', 'Match their energy — warm, playful, engage with the celebration', 'Quick and efficient — they\'re loud enough without you adding to it', 'Quieter than usual to balance their energy'], correct: 1, explain: 'Groups want energy matched. A stiff or over-efficient approach at a birthday table kills the vibe. Match their enthusiasm while keeping service smooth.' },
      { q: 'A solo traveler sits down and looks around with curiosity. Best opening?', options: ['"Table for one?"', '"Sitting alone tonight?"', '"Welcome — first time here? I have a recommendation most guests love"', '"What would you like to order?"'], correct: 2, explain: 'Solo travelers respond powerfully to being made to feel like a local. A genuine recommendation plus "first time here?" opens a relationship and turns a solo meal into a discovery.' },
      { q: 'Four guests in suits are seated. One has a laptop open. This is most likely:', options: ['Friends out for a social dinner', 'A business meal — they want precision, speed, and minimal interruption', 'Tourists on a group tour', 'A family business celebration'], correct: 1, explain: 'Suits plus laptop equals business mode. They want accuracy and efficiency — not conversation. Be professional, precise, and invisible. Have the bill ready before they ask.' },
      { q: 'A couple you recognize walks in and moves confidently to their usual table. Best move?', options: ['Standard greeting — treat everyone equally', 'Acknowledge them by name if you know it and reference their last visit or usual preference', 'Let them settle in and approach after a few minutes', 'Ask if they have a reservation as usual'], correct: 1, explain: 'Recognition is the most powerful tool in hospitality. Regulars chose to come back — acknowledge that. A name plus a personal reference creates loyalty that no discount can match.' },
    ],
  },
  {
    id: 'cultural-awareness',
    title: 'Cultural Awareness',
    desc: 'Curaçao welcomes the world. Know how to welcome each culture back.',
    duration: '9 min',
    xp: 70,
    status: 'available',
    scenarioId: 'dutch-businessman',
    learn: [
      { type: 'intro', text: 'On any given night in Curaçao you might serve Dutch tourists, Venezuelan families, American travelers, Canadian couples, German visitors, and local Curaçaoans — sometimes at the same table. Each culture has different expectations, different communication styles, different definitions of great service. This is not a stereotype guide. It\'s a pattern recognition guide.' },
      { type: 'callout', tone: 'rule', label: 'The Universal Rule', text: 'Adjust your approach, never your standards. The service quality is identical for every guest. Only the style and energy adapts.' },
      { type: 'culture-cards', items: [
        { group: '🇳🇱 Dutch', cues: 'Direct, efficient, no-nonsense. They value quality, honesty, and speed. Over-eager service frustrates them. Approach: professional and warm but efficient — competence over charm. Tip: even "Welkom!" or "Dank u wel" earns immediate respect.' },
        { group: '🇻🇪 Venezuelan / Latin American', cues: 'Warm, expressive, relationship-oriented. They value personal connection and being treated like family. Being rushed or transactional frustrates them. Approach: slow down, make eye contact, ask how they are and mean it. The relationship matters as much as the food. Tip: Spanish greeting = instant connection.' },
        { group: '🇺🇸 American', cues: 'Enthusiastic, direct, feedback-oriented. They value friendliness, recommendations, and feeling special. Indifferent service frustrates them. Approach: genuine enthusiasm, strong recommendations, check in more than you think you need to. Tip: Americans tip based on emotional connection — make them feel chosen.' },
        { group: '🇨🇦 Canadian', cues: 'Polite, non-confrontational, warm. Similar to Americans but slightly more reserved. They appreciate warmth without over-eagerness. Being ignored or rushed frustrates them. Approach: attentive, friendly, good humor.' },
        { group: '🇩🇪 German', cues: 'Precise, quality-focused, reserved. They value accuracy, punctuality, and quality over quantity. Errors and vague answers frustrate them. Approach: precise and professional — if they ask a question, give a real answer. Never guess.' },
        { group: '🇨🇼 Local Curaçaoan', cues: 'Warm, community-oriented, multilingual. They value recognition and being known — not being treated like a tourist in their own island. Approach: personal, use Papiamentu if you know it, remember their preferences. Tip: word-of-mouth on the island travels fast in both directions.' },
      ]},
    ],
    quiz: [
      { q: 'A Dutch couple walks in — direct, efficient, dressed well. Best opening?', options: ['Loud and enthusiastic: "Welcome, so great to have you here tonight!!"', '"Welkom! Fijn dat u er bent — tafel voor twee?"', 'Silent and formal — let them lead entirely', '"Bon biní — how are you my friends?"'], correct: 1, explain: 'Dutch guests appreciate a clean, professional greeting in their own language. Not over-the-top — competence over charm. A Dutch greeting signals respect and immediately raises warmth.' },
      { q: 'A Venezuelan family arrives — animated, in no rush, speaking Spanish. Best service approach?', options: ['Efficient and fast — get them seated and ordered as quickly as possible', 'Warm, personal, ask how they\'re doing and mean it — the relationship matters as much as the food', 'Minimal interaction until they order', 'Extra-loud enthusiasm to match their energy'], correct: 1, explain: 'Latin American guests want to feel like family. Slow down. Ask and listen. The relationship you build in the first 2 minutes will shape their entire experience.' },
      { q: 'A German couple asks exactly what is in a dish — every ingredient. You should:', options: ['Give a rough answer — the details don\'t really matter', 'Give a precise, accurate answer — or offer to find out right now. Never guess.', 'Tell them it\'s "probably fine" and redirect to something else', 'Recommend a different dish to avoid the detailed question'], correct: 1, explain: 'German guests value precision. A vague or improvised answer loses their trust immediately. If you don\'t know, say "let me find out right now" — accuracy matters more than speed here.' },
      { q: 'What is the universal rule of cultural awareness in hospitality?', options: ['Adjust your service standards based on the guest\'s cultural expectations', 'Adjust your approach and style — never your service standards', 'Serve all guests identically regardless of cultural cues', 'Let guests set the pace entirely before deciding how to approach them'], correct: 1, explain: 'Service quality is non-negotiable and identical for every guest. Only the style adapts — the warmth, the communication approach, the pace. The standard never changes.' },
      { q: 'A local Curaçaoan walks in for the first time. What makes the biggest immediate difference?', options: ['A standard English greeting with a warm smile', 'Even a simple "Bon biní" in Papiamentu signals recognition and belonging', '"Welcome to [Property]!" delivered with genuine warmth', 'Asking what they\'d like and getting straight to business'], correct: 1, explain: 'Papiamentu from a non-local earns immediate warmth and trust. It says: "You are home here." Locals will appreciate the effort — and often help you improve. One word changes the entire dynamic.' },
    ],
  },
  {
    id: 'vip-guests',
    title: 'VIP & Returning Guests',
    desc: 'The guest who comes back is worth ten new ones. Treat them like it.',
    duration: '7 min',
    xp: 60,
    status: 'available',
    scenarioId: 'welcome-back',
    learn: [
      { type: 'intro', text: 'A returning guest costs 5-7x less to retain than to acquire a new one. They spend more, refer others, and give you the benefit of the doubt when things go wrong. Recognition is the most powerful tool you have — and it costs nothing.' },
      { type: 'principles', items: [
        { num: 1, title: 'Being remembered', body: 'Their name, their preferences, their last visit. "Your usual corner table" — three words that create loyalty no marketing can buy.' },
        { num: 2, title: 'Being anticipated', body: 'Their usual drink ready before they ask. Their dietary restriction flagged before they have to repeat it. Anticipation signals they matter.' },
        { num: 3, title: 'Being acknowledged', body: 'A genuine "It\'s great to see you again" — not a scripted line. Make eye contact. Mean it.' },
        { num: 4, title: 'Being upgraded', body: 'A better table, a small complimentary gesture, a welcome bite. The upgrade doesn\'t have to be expensive — it has to be thoughtful.' },
        { num: 5, title: 'Being told something exclusive', body: '"We just got something in I think you\'d love." Giving a returning guest inside information makes them feel like a partner, not a customer.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'The Mental Database', text: 'Even without a CRM, great hospitality professionals build a mental map: "The couple who always orders the fish." "The man who takes his coffee black and reads." "The family that brings the grandparents on Sundays." Build yours.' },
      { type: 'tip-list', title: 'The departure ritual — every guest, every time', items: [
        'Genuine thank you — not a reflex.',
        'Something personal if possible: "Hope the meeting went well."',
        'An invitation to return that feels real: "We\'d love to see you again soon."',
        'For regulars: "We have something new next week I think you\'d really enjoy — hope to see you then."',
      ]},
    ],
    quiz: [
      { q: 'A guest returns for the third time this month. You recognize them. Best first move?', options: ['Standard greeting — treat everyone equally out of respect', '"Welcome back — it\'s great to see you again" using their name if you know it', 'Just nod and take their usual order', 'Ask if they have a reservation as usual'], correct: 1, explain: 'Recognition is the whole game. A returning guest chose to come back — acknowledge that explicitly. Treating them like a new guest is a missed loyalty moment every single time.' },
      { q: 'What is the most powerful retention tool in hospitality?', options: ['Offering a discount on every return visit', 'Recognition — being remembered, anticipated, and acknowledged personally', 'A complimentary dessert on every return visit', 'Perfectly consistent service with zero variation'], correct: 1, explain: 'Discounts train guests to wait for deals. Recognition builds loyalty that outlasts any promotion. Being remembered by name, by preference, by occasion — that\'s what brings people back.' },
      { q: 'A regular guest always orders the same coffee to start. They sit down. What do you do?', options: ['Wait for them to order — presuming their drink could feel invasive', '"Your usual espresso — or would you like to try something different tonight?" and bring it', 'Ask what they\'d like as you would any new guest', 'Only do this if a manager specifically instructs you to'], correct: 1, explain: 'Anticipating a regular\'s preference and naming it is one of the highest-impact moves in hospitality. "Or would you like something different" keeps it as an offer, not a presumption.' },
      { q: 'A VIP guest is leaving after a great meal. The ideal farewell includes:', options: ['A quick "thank you, have a great night"', 'A genuine, personal farewell using their name, referencing something from their visit, with a specific invitation to return', 'Handing them a loyalty card or discount for next time', 'Just a warm smile — they know you appreciate them'], correct: 1, explain: 'The close is the last thing they\'ll remember. Recency bias makes the departure as powerful as the arrival. Use their name, reference the evening specifically, and make the invitation to return feel personal.' },
      { q: 'How many times during a meal should you use a guest\'s name?', options: ['As many times as possible to build connection', 'Approximately three times: arrival, once mid-meal, and at departure', 'Only at arrival — after that it can feel forced', 'Only if they introduce themselves first'], correct: 1, explain: 'Three times: arrival, mid-meal, departure. Using a name too often feels transactional — like a call center script. Used at the right moments, it creates genuine personal connection.' },
    ],
  },
  {
    id: 'buying-signals',
    title: 'Reading Buying Signals',
    desc: 'Great upselling feels like a recommendation. Bad upselling feels like pressure. Know the difference.',
    duration: '8 min',
    xp: 65,
    status: 'available',
    scenarioId: 'undecided-guest',
    learn: [
      { type: 'intro', text: 'Upselling is not about adding to the bill. It\'s about helping the guest have a better experience. When done right: the guest leaves happier, spends more, and comes back. When done wrong: the guest feels pushed and doesn\'t return.' },
      { type: 'callout', tone: 'rule', label: 'The Upselling Mindset', text: 'The best upsell is one the guest doesn\'t realize is an upsell. It feels like a recommendation from someone who knows the menu and genuinely wants them to enjoy it.' },
      { type: 'culture-cards', items: [
        { group: '✅ Open to suggestions', cues: 'Looking at other tables\' food with curiosity. Asking "what do you recommend?" Taking a long time with the menu. Making eye contact and pausing with the menu open.' },
        { group: '❌ Not open to suggestions', cues: 'Menu already closed — they\'ve decided. Ordering quickly and confidently. Business guest in a hurry. Guest who has been here many times and always orders the same thing.' },
      ]},
      { type: 'steps', title: 'Natural upselling moments', items: [
        { num: 1, title: 'On arrival', body: '"Can I start you with sparkling or still water? We also have [signature drink] if you\'d like something special to begin."', badge: 'Always' },
        { num: 2, title: 'During ordering', body: '"The [dish] pairs really beautifully with [wine/side] — a lot of guests order them together."', badge: 'When relevant' },
        { num: 3, title: 'After mains', body: '"Can I tell you about our desserts? The [signature dessert] is made fresh daily — it\'s something special."', badge: 'Proactive' },
        { num: 4, title: 'With the bill', body: '"Would you like a digestif to finish? We have [option] which is a local favorite."', badge: 'Optional' },
      ]},
      { type: 'do-dont', title: 'The formula in practice', items: [
        { do: '"I\'d go with the [X] — it\'s [what makes it special] and it\'s one of our most popular." (Recommendation + reason + social proof)', dont: '"Would you like anything else?" (Generic — produces no result)' },
        { do: '"The [dish] pairs beautifully with [wine] — a lot of guests order them together." (Natural pairing)', dont: 'Recommending the most expensive item every single time.' },
        { do: 'Reading the table first — only suggest when they\'re open to it.', dont: 'Asking multiple upsell questions in the same visit.' },
      ]},
    ],
    quiz: [
      { q: 'A guest says "What do you recommend?" This signals:', options: ['They don\'t understand the menu — give them more time', 'They are open to suggestions — this is your upselling moment', 'They want the cheapest option available', 'They\'ve already decided and want confirmation'], correct: 1, explain: '"What do you recommend?" is the clearest buying signal in hospitality. The guest is placing their experience in your hands. Respond with confidence, a genuine recommendation, and a reason.' },
      { q: 'Which is the correct upselling formula?', options: ['Item name + price', 'Recommendation + reason + social proof', 'Menu description + alternative option', 'Price comparison + portion size'], correct: 1, explain: '"I\'d go with the X — it\'s [what makes it special] and it\'s one of our most popular." Star + reason + social proof. Every effective upsell follows this structure.' },
      { q: 'A business guest orders quickly with their menu closed. You should:', options: ['Upsell a starter and dessert — every table is an opportunity', 'Confirm their order accurately and process it efficiently — they\'re not open to suggestions', 'Offer the wine list before taking the order', 'Ask if they\'re sure about their choice'], correct: 1, explain: 'Reading the signal correctly means knowing when NOT to upsell. A closed menu and a quick order means decided and in a hurry. Accuracy and speed are what this guest needs — not a recommendation.' },
      { q: '"The dish pairs really beautifully with [wine] — a lot of guests order them together." This is:', options: ['An aggressive upsell that will make guests feel pressured', 'A natural upsell: recommendation + reason + social proof working together', 'A scripted phrase that sounds inauthentic', 'An unnecessary interruption to the ordering moment'], correct: 1, explain: 'This is the formula at work. A pairing suggestion with a reason and social proof doesn\'t feel like an upsell — it feels like genuine expertise. The guest feels helped, not sold to.' },
      { q: 'What should you NEVER do when upselling?', options: ['Offer a specific recommendation with a genuine reason', 'Push when a guest has clearly decided and doesn\'t want more suggestions', 'Use social proof ("a lot of guests love this")', 'Mention a natural pairing with their chosen dish'], correct: 1, explain: 'Pushing after a guest has clearly decided destroys trust and makes the interaction feel transactional. Read the signal. If they\'re done deciding, confirm their order and serve with excellence.' },
    ],
  },
  {
    id: 'emotional-journey',
    title: 'The Emotional Journey of a Guest',
    desc: 'Guests remember how you made them feel, not what they ate.',
    duration: '8 min',
    xp: 70,
    status: 'available',
    scenarioId: 'full-journey',
    learn: [
      { type: 'intro', text: 'Guests remember how you made them feel, not what they ate. The guest who tells their friend "you have to go there" isn\'t talking about the food. They\'re talking about a moment. Your job is to create those moments at every stage of the journey.' },
      { type: 'steps', title: 'The 7 Emotional Stages', items: [
        { num: 1, title: 'Anticipation (before they arrive)', body: 'The guest has already formed an expectation — from a review, a recommendation, or a memory. You can\'t control this. But you can exceed it or confirm it from the first second.', badge: 'Expectation set' },
        { num: 2, title: 'Arrival (first 5 seconds)', body: 'This is the moment that sets everything. Warmth here = goodwill that lasts the entire meal. Coldness here = suspicion that follows them to the table. The first impression is worth more than the next 30 minutes combined.', badge: 'Most powerful' },
        { num: 3, title: 'Settling In (first 3 minutes)', body: 'The guest is orienting — reading the space, reading the menu, reading the energy. They need: water, acknowledgment, a moment to breathe. Don\'t rush this stage.', badge: 'Give space' },
        { num: 4, title: 'Ordering (the trust moment)', body: 'When a guest asks for a recommendation, they are placing their trust in you. A confident, genuine recommendation here builds loyalty that outlasts the meal.', badge: 'Trust moment' },
        { num: 5, title: 'The Experience (during the meal)', body: 'The guest is in the deepest emotional state — relaxed, eating, talking. Your job: be invisible but present. Check without interrupting. Refill without asking. Notice without hovering.', badge: 'Invisible presence' },
        { num: 6, title: 'The Close (final impression)', body: 'Recency bias: the last thing that happens is what they remember most. A warm, personal farewell can rescue an average meal. A cold goodbye can ruin a great one. The close is your last chance — use it.', badge: 'Recency bias' },
        { num: 7, title: 'The Memory (after they leave)', body: 'What did they tell their friends? "The food was great" fades. "The server remembered we were celebrating and brought us something extra without being asked" — that story gets told. Create stories, not just meals.', badge: 'What gets told' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Emotional Arc', text: 'High at arrival → comfortable during the meal → high again at departure. Your goal: never let the arc drop below "comfortable" at any point. Every stage is a chance to elevate or lose the story the guest will tell.' },
    ],
    quiz: [
      { q: 'The last thing a guest experiences is disproportionately powerful in shaping their overall memory. This is called:', options: ['The halo effect', 'Recency bias', 'Peak performance syndrome', 'Emotional anchoring'], correct: 1, explain: 'Recency bias means guests remember the end of an experience more vividly than the middle. A warm, personal close can rescue an average meal — and a cold goodbye can ruin a great one.' },
      { q: 'During the ordering stage, a guest asks for a recommendation. This is:', options: ['A simple transaction — tell them what\'s most popular', 'A trust moment — they\'re placing confidence in you. A great recommendation builds loyalty beyond the meal.', 'An opportunity to recommend the most profitable item', 'A sign they haven\'t read the menu properly'], correct: 1, explain: 'When a guest asks for a recommendation, they\'re offering you their trust. Respond with genuine expertise and a confident suggestion. This moment builds loyalty that outlasts the meal.' },
      { q: 'What is your goal during "the experience" stage — when guests are eating and relaxed?', options: ['Check in frequently to demonstrate attentiveness', 'Be invisible but present — notice without hovering, refill without asking', 'Leave guests completely alone — they have everything they need', 'Focus on clearing and resetting tables efficiently'], correct: 1, explain: '"Invisible but present" is the highest service standard. The guest should never feel ignored — but also never feel watched or interrupted. Anticipate needs silently.' },
      { q: 'What do guests remember and share most after a meal?', options: ['The specific flavors and quality of what they ate', 'Stories — moments of genuine connection or surprise worth telling a friend', 'The exact price they paid', 'How quickly or slowly the service moved'], correct: 1, explain: '"The food was great" fades. "The server remembered it was our anniversary and brought us something extra without being asked" gets told for years. Create stories, not just meals.' },
      { q: 'A couple arrives having been told by a friend that this place is exceptional. Their emotional state is:', options: ['Neutral — they\'ll judge entirely on their own experience', 'Anticipation with high expectations — you must exceed what they\'ve been told, not just match it', 'Skeptical — they\'ve heard recommendations before', 'Competitive — comparing everything to what their friend described'], correct: 1, explain: 'A recommendation raises expectations. The anticipation stage is already active before they walk in. Your arrival moment must confirm and exceed what they\'ve been told — from the very first second.' },
    ],
  },
];

// ─── MODULE REGISTRY ─────────────────────────────────────────

export const CURRICULUM: Module[] = [
  // Module 1
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
  // Module 2
  {
    id: 'physical-craft',
    title: 'The Physical Craft',
    subtitle: 'Master the physical skills before anything else',
    iconName: 'Hand',
    color: '#8B7355',
    progress: 0,
    totalLessons: 5,
    completedLessons: 0,
    available: true,
    xpTotal: 300,
    lessons: physicalCraftLessons,
  },
  // Module 3
  {
    id: 'service-flow',
    title: 'The Service Flow',
    subtitle: "[Property]'s 10-step standard, start to finish",
    iconName: 'BookOpen',
    color: '#111111',
    progress: 0,
    totalLessons: 3,
    completedLessons: 0,
    available: true,
    xpTotal: 195,
    lessons: serviceFlowLessons,
  },
  // Module 4
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
  // Module 5
  {
    id: 'complaints',
    title: 'Handling Difficult Situations',
    subtitle: 'Turn a broken moment into a defining one',
    iconName: 'Shield',
    color: '#E07A5F',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 250,
    lessons: complaintsLessons,
  },
  // Module 6
  {
    id: 'guest-psychology',
    title: 'Guest Psychology',
    subtitle: 'Read the table. Adapt the service.',
    iconName: 'Brain',
    color: '#8DA9C4',
    progress: 0,
    totalLessons: 5,
    completedLessons: 0,
    available: true,
    xpTotal: 330,
    lessons: guestPsychologyLessons,
  },
];
