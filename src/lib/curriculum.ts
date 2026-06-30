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
  | { type: 'menu-pdf'; title: string; caption?: string }
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
  // Phase placement. Optional because the demo property and any not-yet-categorized
  // ("universal") modules may have no phase assigned yet. Mirrors the DB columns
  // modules.phase_id / modules.order_in_phase (see add_phases_architecture.sql).
  phase_id?: string;
  order_in_phase?: number;
}

// A curriculum phase — first-class entity. Mirrors the `phases` DB table.
export interface Phase {
  id: string;
  track: 'casual-dining' | 'fine-dining' | 'fast-casual';
  phase_number: number;
  title: string;
  goal: string;
  outcome: string;
  certification_title: string;
  order_index: number;
}

// ─── MODULE 0: ONBOARDING — WELCOME TO [PROPERTY] ────────────

const onboardingLessons: Lesson[] = [
  {
    id: 'our-story',
    title: 'Our Story & DNA',
    desc: 'Where [Property] came from and what we stand for',
    duration: '7 min',
    xp: 20,
    status: 'available',
    learn: [
      { type: 'intro', text: 'Before you carry a single plate, you need to know the story you\'re a part of. [Property] didn\'t start as a business plan — it started as an idea about how people should be treated when they sit down to eat. Knowing where we came from isn\'t trivia. When a guest asks "how long have you been here?" or "what\'s the story behind this place?", your answer is part of the experience. You are not just staff — you are the storyteller of [Property].' },
      { type: 'principles', items: [
        { num: 1, title: 'Hospitality over transactions', body: 'We are not here to turn tables — we are here to make people feel cared for. Every decision at [Property] starts with the guest\'s experience, not the bottom line. Revenue follows hospitality, never the other way around.' },
        { num: 2, title: 'Craft and pride', body: 'Everything we serve and every table we set reflects real care. We do the small things right — a polished glass, a folded napkin, a remembered name — because the details are what guests actually feel.' },
        { num: 3, title: 'We are a team, not a hierarchy', body: 'From the kitchen to the floor to the host stand, everyone owns the guest experience. No one says "that\'s not my job." If something needs doing, we do it together.' },
      ]},
      { type: 'callout', tone: 'rule', label: 'What makes us different', text: 'Anyone can serve food. [Property] exists to make every guest feel like they were expected, welcomed, and remembered. If a guest leaves having eaten well but feeling like a number — we failed, no matter how good the food was.' },
    ],
    quiz: [
      { q: 'A guest asks you, "So what\'s the story behind this place?" Why does your answer matter?', options: ['It doesn\'t — just point them to the website.', 'You are the storyteller of [Property]; your answer is part of the guest experience.', 'Only managers should answer history questions.', 'It\'s just small talk and has no real impact.'], correct: 1, explain: 'Every staff member carries the story. How you answer shapes how connected the guest feels to the place.' },
      { q: 'At [Property], when a decision is made, what comes first?', options: ['The bottom line and turning tables quickly.', 'The guest\'s experience — revenue follows hospitality.', 'Whatever is easiest for staff.', 'The fastest option, always.'], correct: 1, explain: 'We lead with hospitality. Profit is the result of caring for guests well — never the starting point.' },
      { q: 'A table needs clearing but it\'s technically in another server\'s section. What does our DNA say?', options: ['Leave it — it\'s not your job.', 'Wait for the assigned server to handle it.', 'Handle it — at [Property] everyone owns the guest experience.', 'Report it to a manager and move on.'], correct: 2, explain: 'We are a team, not a hierarchy. "That\'s not my job" has no place here — if something needs doing, we do it.' },
      { q: 'Why do we obsess over small details like a polished glass or a remembered name?', options: ['Because health inspectors check for them.', 'Because the details are what guests actually feel — they signal real care.', 'Because they\'re required by law.', 'They don\'t really matter; the food is all that counts.'], correct: 1, explain: 'Craft and pride live in the small things. Details are how a guest feels cared for, even if they can\'t name why.' },
      { q: 'A guest eats a flawless meal but leaves feeling like just another number. By [Property]\'s standard, how did the night go?', options: ['It was a success — the food was perfect.', 'It was a failure — we exist to make guests feel welcomed and remembered.', 'It was fine — you can\'t please everyone.', 'It was a success as long as they paid.'], correct: 1, explain: 'Great food isn\'t enough. If a guest doesn\'t feel expected, welcomed, and remembered, we missed our actual purpose.' },
    ],
  },
  {
    id: 'our-menu',
    title: 'The Menu & Signature Dishes',
    desc: 'Know what we serve — and how to talk about it',
    duration: '8 min',
    xp: 25,
    status: 'available',
    learn: [
      { type: 'intro', text: 'The menu is your script and your sales tool. Guests will ask you what\'s good, what you recommend, what\'s in a dish, and whether something fits their diet. "I\'m not sure" is the answer that loses trust fastest. You don\'t need to be a chef — but you do need to know every dish well enough to describe it, recommend it, and flag allergens with confidence. A staff member who knows the menu sells more, earns more trust, and makes guests feel like they\'re in good hands.' },
      { type: 'steps', title: 'How to describe a dish confidently', items: [
        { num: 1, title: 'Lead with the hero ingredient', body: 'Start with what makes the dish special — the star of the plate. "The short rib is braised for eight hours until it falls apart." Not "it\'s a beef dish."' },
        { num: 2, title: 'Add a sensory word', body: 'Give them something to taste in their imagination: rich, crispy, bright, smoky, silky. Sensory language turns a list of ingredients into a craving.' },
        { num: 3, title: 'Mention preparation or origin if it\'s a selling point', body: '"House-made daily," "freshly ground," "locally caught" — these signal quality and justify the price.' },
        { num: 4, title: 'End with a personal or popular endorsement', body: '"It\'s honestly my favorite," or "It\'s our most-ordered dish for a reason." A genuine recommendation closes the decision.' },
      ]},
      { type: 'tip-list', title: 'Top items every staff member MUST know cold', items: [
        'The signature dish — the one thing [Property] is known for, and why it\'s special.',
        'The top 2–3 best-sellers and what makes each one a go-to.',
        'At least one strong vegetarian and one vegan option.',
        'Which dishes contain the most common allergens (nuts, shellfish, gluten, dairy).',
        'What\'s currently unavailable or 86\'d — never promise something the kitchen can\'t deliver.',
        'One confident pairing: a drink or side that goes with the signature dish.',
      ]},
    ],
    quiz: [
      { q: 'A guest asks "What\'s good here?" What\'s the strongest response?', options: ['"Everything\'s good, honestly."', '"I\'m not sure, let me ask someone."', '"Our short rib is the move — braised eight hours until it falls apart. It\'s our most-ordered dish."', '"Whatever you\'re in the mood for."'], correct: 2, explain: 'A specific, confident recommendation with a sensory detail and an endorsement makes the guest feel guided and builds trust.' },
      { q: 'When describing a dish, where should you start?', options: ['With the price so they know what to expect.', 'With the hero ingredient — the star of the plate.', 'With the allergens.', 'With how long it takes to prepare.'], correct: 1, explain: 'Lead with the hero ingredient. It frames the dish around what makes it special, not a generic category.' },
      { q: 'A guest mentions a severe nut allergy and asks if a dish is safe. You\'re not 100% sure. What do you do?', options: ['Guess based on what you can see in the dish.', 'Say it\'s probably fine to avoid slowing them down.', 'Tell them you\'ll confirm with the kitchen before they order — never guess on allergens.', 'Recommend a different dish without explaining why.'], correct: 2, explain: 'Allergens are never a guessing game. Knowing the menu means knowing when to confirm with the kitchen — a wrong guess can be dangerous.' },
      { q: 'Why does adding a sensory word ("crispy," "silky," "smoky") matter when describing a dish?', options: ['It makes you sound more formal.', 'It turns a list of ingredients into something the guest can crave.', 'It\'s required by the menu.', 'It helps you remember the ingredients.'], correct: 1, explain: 'Sensory language lets the guest taste the dish in their imagination — that\'s what turns a description into a decision to order.' },
      { q: 'The kitchen has just 86\'d (run out of) the salmon. A guest asks about it. What\'s the right move?', options: ['Take the order anyway and let the kitchen sort it out.', 'Let them know it\'s unavailable tonight and confidently suggest a similar dish.', 'Tell them it\'s available and hope more comes in.', 'Avoid mentioning it and steer them elsewhere without explanation.'], correct: 1, explain: 'Never promise what the kitchen can\'t deliver. Knowing what\'s 86\'d and pivoting smoothly to a great alternative protects the guest\'s trust.' },
    ],
  },
  {
    id: 'our-standards',
    title: 'House Standards & Expectations',
    desc: 'What [Property] expects from every team member',
    duration: '7 min',
    xp: 20,
    status: 'available',
    learn: [
      { type: 'intro', text: 'Standards are not about being strict — they\'re about being consistent. A guest should get the same excellent experience whether it\'s your first shift or your five-hundredth, whether the room is empty or slammed. [Property] holds every team member to the same expectations around appearance, punctuality, attitude, and care. When you walk through that door, you stop being an individual having a good or bad day — you become [Property]. These standards are how we protect that.' },
      { type: 'do-dont', title: 'The standards in practice', items: [
        { do: 'Arrive 10–15 minutes early, in clean uniform, groomed and ready to start on time.', dont: 'Stroll in at the start of your shift, still getting dressed or eating.' },
        { do: 'Keep a positive, composed attitude on the floor — guests never see the stress behind service.', dont: 'Let a bad mood, a kitchen delay, or a rude guest show on your face in the dining room.' },
        { do: 'Put phones away during service — your attention belongs to the floor.', dont: 'Check your phone, lean on furniture, or cluster with coworkers where guests can see.' },
        { do: 'Speak about colleagues, guests, and the restaurant respectfully, on and off shift.', dont: 'Gossip, complain about guests within earshot, or badmouth the restaurant online.' },
      ]},
      { type: 'callout', tone: 'rule', label: 'You represent the brand', text: 'The moment you put on the uniform, you are [Property] — not just to guests, but online and in the community too. Every interaction, every post, every overheard comment reflects on all of us. Protect the name like it\'s your own, because while you wear it, it is.' },
    ],
    quiz: [
      { q: 'Why does [Property] hold every team member to the same standards?', options: ['To make the rules feel strict.', 'So guests get the same excellent experience every time, regardless of who\'s working or how busy it is.', 'Because corporate requires it.', 'To make new staff feel pressured.'], correct: 1, explain: 'Standards exist for consistency — a guest should never be able to tell if it\'s your first shift or your five-hundredth.' },
      { q: 'The kitchen is 20 minutes behind and you\'re stressed. A guest at your table looks up. What should they see?', options: ['Your honest frustration — guests appreciate authenticity.', 'A composed, positive attitude — the stress behind service stays invisible.', 'You venting about the kitchen so they understand the delay.', 'You avoiding eye contact until things calm down.'], correct: 1, explain: 'Guests never see the stress behind service. Composure on the floor is part of the standard, especially when things go wrong.' },
      { q: 'When does representing [Property] begin and end?', options: ['Only while you\'re clocked in and on the floor.', 'Only when a manager is watching.', 'The moment you put on the uniform — and it extends to how you act online and in the community.', 'Only during interactions with guests.'], correct: 2, explain: 'You represent the brand on and off shift, including online. While you wear the name, it\'s yours to protect.' },
      { q: 'What\'s the expectation around arriving for a shift?', options: ['Arrive exactly at start time and clock in.', 'Arrive 10–15 minutes early, in clean uniform, ready to start on time.', 'Arrive whenever, as long as you stay late.', 'Arrive a few minutes late if it\'s not busy.'], correct: 1, explain: 'Early, groomed, and ready means you start on time — not start getting ready when your shift begins.' },
      { q: 'A guest was rude to you and just left. A coworker asks what happened, while you\'re still on the floor. What\'s the right move?', options: ['Vent loudly so other staff know what you dealt with.', 'Describe the guest in detail to anyone who\'ll listen.', 'Keep it brief and respectful where guests can hear — debrief properly off the floor later.', 'Post about it online once your shift ends.'], correct: 2, explain: 'Speaking respectfully about guests, on and off the floor, is a house standard. The floor is never the place to vent, and the brand follows you online too.' },
    ],
  },
  {
    id: 'our-guests',
    title: 'Who Are Our Guests',
    desc: 'Understand who walks through our door and what they need',
    duration: '7 min',
    xp: 20,
    status: 'available',
    learn: [
      { type: 'intro', text: 'You can\'t deliver a great experience if you don\'t understand who you\'re serving. [Property] welcomes a real mix of people — locals who treat us like a second home, travelers discovering us for the first time, and guests marking the biggest moments of their lives. Each one wants something a little different. The best staff don\'t serve everyone the same way — they read who\'s in front of them and adjust. Knowing our guest profiles helps you anticipate needs before they\'re spoken.' },
      { type: 'culture-cards', items: [
        { group: '🏠 Regulars & Locals', cues: 'They come back because we make them feel at home. Learn their names, remember their usual, greet them like you\'re glad they\'re back. They forgive a busy night — but never being treated like a stranger. Familiarity is the whole point for them.' },
        { group: '🌍 Travelers & First-Timers', cues: 'They don\'t know the menu, the area, or what makes us special — so they rely on you completely. Offer recommendations, share what we\'re known for, and make them feel like insiders. A great experience here becomes the highlight of their trip and a five-star review.' },
        { group: '🎉 Celebration Guests', cues: 'Birthdays, anniversaries, engagements, big news. The stakes are high and the memory is what matters. Acknowledge the occasion genuinely, add a small surprise if you can, and protect the moment. Get this right and they\'ll choose us for every milestone.' },
      ]},
      { type: 'tip-list', title: 'Adapting to different guest needs', items: [
        'Read before you speak — energy, body language, and pace tell you who you\'re serving.',
        'For regulars: use their name and reference what they usually love.',
        'For first-timers: offer to guide them — "Want me to walk you through our favorites?"',
        'For celebration guests: acknowledge the occasion early and quietly flag the team.',
        'Never apply the same script to every table — match your approach to the guest in front of you.',
        'When unsure what someone needs, ask warmly and listen — guests will tell you how they want to be treated.',
      ]},
    ],
    quiz: [
      { q: 'Why does knowing our guest profiles matter?', options: ['So you can serve everyone in exactly the same way.', 'So you can read who\'s in front of you and anticipate their needs before they\'re spoken.', 'So you can decide who deserves better service.', 'It doesn\'t really matter — good food serves everyone equally.'], correct: 1, explain: 'The best staff adjust to the guest in front of them. Knowing profiles helps you anticipate needs instead of reacting to them.' },
      { q: 'A regular walks in for the third time this week. What do they value most?', options: ['The fastest possible service.', 'Being treated like family — name remembered, usual known, welcomed back warmly.', 'A formal, by-the-book greeting.', 'Being left completely alone.'], correct: 1, explain: 'Familiarity is the whole point for regulars. They forgive a busy night, but never being treated like a stranger.' },
      { q: 'A first-time guest is staring at the menu, clearly unsure. Best move?', options: ['Give them more time alone to figure it out.', 'Tell them to order whatever looks good.', 'Offer to guide them — "Want me to walk you through our favorites?"', 'Bring the bill early to keep things moving.'], correct: 2, explain: 'First-timers rely on you completely. Guiding them makes them feel like insiders — and often turns into a five-star review.' },
      { q: 'You learn a table is celebrating an engagement. What should you do?', options: ['Treat it like any other table to avoid pressure.', 'Acknowledge the occasion genuinely and quietly flag the team to protect the moment.', 'Announce it loudly to the whole dining room immediately.', 'Wait for them to mention it again before acting.'], correct: 1, explain: 'Celebration guests remember how the moment felt. Acknowledging it early and coordinating with the team is how we earn their future milestones.' },
      { q: 'You can\'t tell what a new table needs — they\'re hard to read. What\'s the best approach?', options: ['Default to your fastest, most efficient script.', 'Treat them exactly like the last table you served.', 'Ask warmly and listen — guests will tell you how they want to be treated.', 'Give them space and avoid checking in.'], correct: 2, explain: 'Never apply one script to every table. When unsure, a warm question and genuine listening lets the guest show you what they need.' },
    ],
  },
  {
    id: 'your-first-shift',
    title: 'Your First Shift',
    desc: 'What to expect and how to start strong on day one',
    duration: '8 min',
    xp: 25,
    status: 'available',
    learn: [
      { type: 'intro', text: 'Your first shift is not a test you can fail — it\'s the day you start learning the floor for real. Nobody expects you to be perfect. They expect you to show up ready, stay observant, and ask good questions. The staff who thrive on day one aren\'t the ones who pretend to know everything — they\'re the ones who watch closely, follow the routine, and aren\'t afraid to say "show me." Here\'s how to make a strong first impression on the team and the guests.' },
      { type: 'steps', title: 'Your first shift routine', items: [
        { num: 1, title: 'Arrive early and check in', body: 'Get there 15 minutes before your start time. Find your manager or trainer, introduce yourself, and ask where you should be and what you should do first.', badge: 'Before service' },
        { num: 2, title: 'Shadow and observe', body: 'Stay close to your trainer. Watch how they greet, move, carry, and talk to guests. Notice the rhythm of the floor before you try to match it.', badge: 'Watch' },
        { num: 3, title: 'Take on small tasks', body: 'Start with the basics — refilling water, clearing plates, resetting tables. Do the small things excellently. Trust is built one clean table at a time.', badge: 'Do' },
        { num: 4, title: 'Debrief and reflect', body: 'After service, ask your trainer what you did well and what to work on. Write down anything you want to remember for next time.', badge: 'After service' },
      ]},
      { type: 'callout', tone: 'tip', label: 'Asking questions is a strength', text: 'Never guess when you can ask. A new team member who asks "which side do I serve from?" looks far more professional than one who guesses wrong in front of a guest. Questions show you care about getting it right — that\'s exactly what we want to see on day one.' },
      { type: 'do-dont', title: 'Common first-shift mistakes', items: [
        { do: 'Stay close to your trainer and ask before you act when unsure.', dont: 'Wander off alone and try to run a table you haven\'t been shown how to handle.' },
        { do: 'Focus on doing small tasks well and observing the flow.', dont: 'Try to prove yourself by taking on more than you\'re ready for.' },
        { do: 'Keep your energy up and stay engaged even during slow moments.', dont: 'Stand around on your phone or disappear when the floor is quiet.' },
      ]},
    ],
    quiz: [
      { q: 'What\'s the right mindset to bring to your first shift?', options: ['Prove you already know everything so the team trusts you.', 'Show up ready, stay observant, and ask good questions — nobody expects perfection.', 'Stay quiet and avoid asking anything so you don\'t look new.', 'Take on as many tables as possible to impress your manager.'], correct: 1, explain: 'Day one is for learning the floor, not passing a test. The staff who thrive observe closely and ask rather than pretending to know.' },
      { q: 'You\'re unsure which side to serve a plate from, mid-service. What\'s the most professional move?', options: ['Guess and hope it\'s right.', 'Skip serving that guest entirely.', 'Quickly ask your trainer — asking looks more professional than guessing wrong in front of a guest.', 'Serve from whichever side is closest.'], correct: 2, explain: 'Asking when you can ask shows you care about getting it right. A wrong guess in front of a guest costs far more than a quick question.' },
      { q: 'It\'s your first shift and the floor goes quiet for a stretch. What should you do?', options: ['Check your phone since there\'s nothing happening.', 'Disappear to the back until it picks up.', 'Stay engaged — reset tables, restock, observe, or ask your trainer what to learn next.', 'Stand in one spot and wait to be told what to do.'], correct: 2, explain: 'Slow moments are for learning and prepping. Staying engaged on day one signals exactly the attitude we want to see.' },
      { q: 'When should you arrive for your first shift?', options: ['Right at your start time.', 'About 15 minutes early, so you can check in and find out where to start.', 'A few minutes late is fine on day one.', 'Whenever, since you\'re only shadowing.'], correct: 1, explain: 'Arriving early lets you introduce yourself, get oriented, and start on time — it sets the tone for how reliable you\'ll be.' },
      { q: 'After your first shift ends, what\'s the smartest thing to do?', options: ['Leave quickly — the work is done.', 'Ask your trainer what you did well and what to work on, and note it for next time.', 'Wait for your next shift to think about how it went.', 'Only ask for feedback if something went wrong.'], correct: 1, explain: 'A short debrief turns one shift into real progress. Reflecting and writing down what to improve is how strong staff grow fast.' },
    ],
  },
  {
    id: 'our-menu-pdf',
    title: 'Our Menu',
    desc: 'Study the full menu — every dish, ingredient, and price',
    duration: '12 min',
    xp: 40,
    status: 'available',
    learn: [
      { type: 'intro', text: 'Study the menu carefully. Knowing every dish — ingredients, preparation, and price — is what separates a good server from a great one.' },
      { type: 'tip-list', title: 'What to pay attention to as you read', items: [
        'Ingredients in every dish — so you can answer "what\'s in this?" instantly and flag allergens before you\'re asked.',
        'How each dish is prepared — grilled, braised, fried, raw — and what makes the signature items special.',
        'Prices and what each dish includes — sides, portion size, and anything that costs extra.',
        'Dietary options — which dishes are vegetarian, vegan, or can be made gluten-free.',
        'Natural pairings — which drinks, sides, or starters you\'d confidently recommend alongside each main.',
      ]},
      { type: 'menu-pdf', title: 'The full menu', caption: 'Take your time — this is the exact menu your guests will be reading. Come back to it whenever you need a refresher.' },
    ],
    quiz: [
      { q: 'A guest asks "what\'s in this dish?" and you\'ve studied the menu. What does that let you do?', options: ['Guess based on the name of the dish.', 'Answer instantly and flag any allergens before they have to ask.', 'Send the question to the kitchen every time.', 'Change the subject to a dish you do know.'], correct: 1, explain: 'Knowing ingredients cold means you answer with confidence and catch allergen risks early — that\'s the mark of a great server.' },
      { q: 'Why is it worth knowing the price and what each dish includes?', options: ['So you can upsell guests on everything.', 'So you can set expectations clearly — what comes with the dish and what costs extra.', 'Prices don\'t matter to servers.', 'So you can decide which guests can afford what.'], correct: 1, explain: 'Knowing exactly what a dish includes lets you set honest expectations and avoid surprises on the bill.' },
      { q: 'A guest says they\'re vegan. Because you studied the menu, you can:', options: ['Tell them there\'s probably nothing for them.', 'Point them confidently to vegan dishes and ones that can be adapted.', 'Guess which dishes might work.', 'Ask them to check with the kitchen themselves.'], correct: 1, explain: 'Knowing the dietary options in advance means a vegan guest feels taken care of instead of like an afterthought.' },
      { q: 'What separates a good server from a great one, according to this lesson?', options: ['Speed of service alone.', 'Knowing every dish — its ingredients, preparation, and price.', 'Memorizing only the most expensive items.', 'Being friendly without knowing the menu.'], correct: 1, explain: 'Deep menu knowledge — ingredients, preparation, and price — is exactly what elevates good service into great service.' },
      { q: 'Why does it help to know natural pairings as you study the menu?', options: ['So you can force add-ons onto every table.', 'So you can confidently recommend a drink, side, or starter that complements a guest\'s choice.', 'Pairings are only the bartender\'s job.', 'It doesn\'t help — guests decide on their own.'], correct: 1, explain: 'A genuine, well-matched recommendation enhances the guest\'s meal and shows you truly know what you\'re serving.' },
    ],
  },
];

// ─── MODULE 1: GREETINGS & FIRST IMPRESSIONS ────────────────

const greetingsLessons: Lesson[] = [
  {
    id: 'five-second',
    title: 'The 5-Second Rule',
    desc: 'Immediate greeting within 5 seconds of arrival',
    duration: '7 min',
    xp: 50,
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
    duration: '7 min',
    xp: 50,
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
    duration: '10 min',
    xp: 50,
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
    duration: '8 min',
    xp: 50,
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
    duration: '10 min',
    xp: 50,
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
    duration: '9 min',
    xp: 50,
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
    duration: '7 min',
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
    duration: '8 min',
    xp: 50,
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
    xp: 50,
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
    duration: '7 min',
    xp: 50,
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
    duration: '7 min',
    xp: 50,
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
    duration: '7 min',
    xp: 50,
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
    duration: '8 min',
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
    xp: 50,
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
    xp: 50,
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
    duration: '8 min',
    xp: 50,
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
    xp: 50,
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
    xp: 50,
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
    duration: '7 min',
    xp: 50,
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
    xp: 50,
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
    xp: 50,
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
    xp: 50,
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
    xp: 50,
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
    xp: 50,
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
    xp: 50,
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

// ─── MODULE 7: THE CASUAL DINING STANDARD ───────────────────
// Casual-dining-specific track. Covers the foundational "who you are at work"
// skills — appearance, attitude, teamwork, and food-safety awareness — that the
// universal modules deliberately don't touch.

const casualDiningStandardLessons: Lesson[] = [
  {
    id: 'showing-up-right',
    title: 'Showing Up Right',
    desc: 'Professional appearance and attitude before you hit the floor',
    duration: '7 min',
    xp: 20,
    status: 'available',
    scenarioId: 'casual-dining-arrival',
    learn: [
      { type: 'intro', text: 'Your first impression starts before you say a single word — before the first guest even looks at you. The way you walk in, the state of your uniform, the energy you carry: all of it sets the tone for the entire shift. A guest reads a server\'s confidence and care in the first glance, long before they\'re greeted. In casual dining the pace is fast and the room is open, so there\'s nowhere to hide a wrinkled shirt or a checked-out attitude. Showing up right isn\'t vanity — it\'s the foundation everything else is built on.' },
      { type: 'tip-list', title: 'The pre-shift checklist', items: [
        'Clean uniform — pressed, stain-free, and properly fitted. If it smells like last night\'s shift, it\'s not ready.',
        'Name badge on and visible — guests want to know who\'s taking care of them.',
        'Hair tied back, neat, and out of your face — nothing that ends up near food or in your eyes during a rush.',
        'Hands washed, nails short and clean — the part of you that touches every plate and glass.',
        'Phone away and on silent — stored in your locker or back pocket, never in your hand on the floor.',
        'Posture ready — stand tall, shoulders back, take one breath. You\'re about to step into service mode.',
      ]},
      { type: 'intro', text: 'The hardest part of showing up right isn\'t the uniform — it\'s the attitude shift. Whatever happened before your shift (traffic, an argument, a bad day) has to stay at the door. Guests didn\'t cause it and shouldn\'t feel it. The professionals build a small ritual to make the switch: a deep breath before walking in, a quick look in the mirror, a reminder of why the next few hours matter. When you cross onto the floor, you stop being whoever you were five minutes ago and become the person every guest deserves: present, warm, and ready.' },
      { type: 'tip-list', title: 'Body language guests read without you knowing', items: [
        'Slouching — it signals boredom and low energy, and it makes the whole section feel tired.',
        'Crossed arms — reads as closed-off, defensive, or unapproachable, even when you\'re just resting.',
        'Avoiding eye contact — makes guests feel like they have to chase you down to be helped.',
        'Rushing past tables without a glance — tells waiting guests they\'re invisible, even if you\'re slammed.',
      ]},
    ],
    quiz: [
      { q: 'When does your first impression on a guest actually begin?', options: ['The moment you greet them at the table.', 'Before you say a word — through your appearance and the energy you carry.', 'Only once you take their order.', 'When you drop the bill at the end.'], correct: 1, explain: 'Guests read your confidence and care in the first glance. The impression is set long before any greeting — which is why showing up right matters.' },
      { q: 'You had a stressful morning and your shift is about to start. What\'s the professional move?', options: ['Let the guests know you\'re having a rough day so they\'re understanding.', 'Carry the stress onto the floor — authenticity matters more than performance.', 'Take a breath at the door and switch into "service mode" — the stress stays behind.', 'Work quietly in the back until your mood improves.'], correct: 2, explain: 'Guests didn\'t cause your bad day and shouldn\'t feel it. A small ritual at the door lets you leave personal stress behind and show up present.' },
      { q: 'Which of these is part of the pre-shift checklist?', options: ['Phone in your hand in case you need to check the time.', 'Clean, pressed uniform, name badge visible, hair tied back, hands washed.', 'A quick scroll through social media to relax.', 'Whatever uniform is closest, as long as you\'re on time.'], correct: 1, explain: 'A clean uniform, visible badge, neat hair, and clean hands are the baseline. They signal to guests that they\'re in capable, caring hands.' },
      { q: 'You\'re slammed and walking quickly past a table that hasn\'t been helped yet. What does rushing past without a glance communicate?', options: ['That you\'re hardworking and they\'ll respect that.', 'Nothing — guests understand busy.', 'That they\'re invisible, even though you\'re busy.', 'That they should flag down another server.'], correct: 2, explain: 'Guests read body language you\'re not aware of. Rushing past without acknowledgment makes them feel unseen — a glance or "I\'ll be right with you" changes everything.' },
      { q: 'Why does posture and body language matter so much on a casual dining floor?', options: ['It doesn\'t — only the food and speed matter.', 'Because the room is open and fast, so guests constantly read your slouch, crossed arms, or avoided eye contact.', 'Because managers grade you on how you stand.', 'Because it\'s required for the dress code only.'], correct: 1, explain: 'In an open, fast room there\'s nowhere to hide. Slouching, crossed arms, and avoided eye contact all send messages to guests — usually the wrong ones.' },
    ],
  },
  {
    id: 'working-as-a-team',
    title: 'Working as a Team',
    desc: 'Cover, communicate, and never leave a teammate stranded',
    duration: '8 min',
    xp: 25,
    status: 'available',
    scenarioId: 'casual-dining-teamwork',
    learn: [
      { type: 'intro', text: 'Casual dining runs on teamwork even more than fine dining does. The pace is higher, the tickets come faster, and the margin for error is smaller. There\'s no army of support staff to absorb a mistake — when one person drops the ball, it lands on everyone. A forgotten drink order, an unbussed table, a server who vanishes mid-rush: each one slows the whole floor, frustrates guests, and shrinks the tips the entire team shares. The best casual dining teams move like one organism. You don\'t just run your section — you watch the whole floor and step in before anyone has to ask.' },
      { type: 'tip-list', title: 'The 5 unwritten rules of floor teamwork', items: [
        'If you see it, own it. A spill, an empty glass, a guest looking around — if you notice it, it\'s yours, regardless of section.',
        'Never say "that\'s not my table." Those four words are poison to a team. Help first, sort out sections later.',
        'Communicate before you disappear. Going on break, heading to the walk-in, stepping outside? Tell someone, so your tables are covered.',
        'Check on your colleagues, not just your section. Glance at how your teammates are doing — if someone\'s drowning, you already know.',
        'End of shift = help close together. Nobody leaves while a teammate is still buried in side work. You came in as a team, you leave as one.',
      ]},
      { type: 'intro', text: 'The kitchen is your most important teammate, and how you talk to them under pressure decides whether service flows or breaks. Use clear timing language — "ordering," "fire table 12," "how long on the fish?" — instead of vague pressure. When there\'s a problem, flag it calmly and early, with the facts, not blame: "Table 6 has been waiting 20 minutes, can we prioritize?" beats "What\'s taking so long?!" Never bark orders, never argue on the line, and never make the kitchen the enemy during a rush. A server the kitchen trusts gets their tickets taken care of; a server who creates conflict gets nothing but slower.' },
      { type: 'intro', text: 'Picture a Saturday lunch rush. Your colleague\'s section has filled all at once — six tables seated in five minutes, and they\'re visibly underwater. The wrong move is to either ignore it ("not my section") or to barge in and take over their tables, which embarrasses them and confuses the guests. The right move: catch their eye, ask quietly "what do you need?", and take one concrete thing off their plate — run their drinks, drop their bread, clear a finished table. You\'re not stealing their section or their tips. You\'re buying them ninety seconds to get their head above water. Then you check back once more. That\'s stepping in without stepping on toes.' },
    ],
    quiz: [
      { q: 'Why does teamwork matter even more in casual dining than fine dining?', options: ['It doesn\'t — fine dining needs more coordination.', 'The pace is higher and the margin for error is smaller, so one person dropping the ball affects everyone.', 'Because casual dining has more managers watching.', 'Because casual dining guests tip individually, not by section.'], correct: 1, explain: 'Higher pace, faster tickets, and less support staff mean a single dropped ball lands on the whole floor — and on everyone\'s shared tips.' },
      { q: 'You spot an empty water glass at a table that isn\'t in your section. What does the team standard say?', options: ['Leave it — it\'s the other server\'s responsibility.', 'Find that server and tell them about it.', 'If you see it, own it — refill it yourself.', 'Wait to see if the guest flags someone.'], correct: 2, explain: '"If you see it, own it" is the first rule of floor teamwork. Help the guest first; section boundaries come second.' },
      { q: 'You need to step outside for a quick break during service. What should you do first?', options: ['Just go — you\'ll only be a minute.', 'Tell a colleague so your tables are covered while you\'re gone.', 'Wait until every one of your tables is completely settled, even if it takes 30 minutes.', 'Leave a note on the host stand.'], correct: 1, explain: '"Communicate before you disappear" keeps tables covered. A teammate can\'t cover for you if they don\'t know you\'re gone.' },
      { q: 'Table 6 has waited 20 minutes for their food during a rush. What\'s the best way to raise it with the kitchen?', options: ['"What is taking so long with table 6?!"', 'Say nothing and hope it comes up soon.', 'Calmly: "Table 6 has been waiting 20 minutes — can we prioritize them?"', 'Tell the guest the kitchen is too slow today.'], correct: 2, explain: 'Flag issues calmly and early with facts, not blame. A server the kitchen trusts gets their tickets handled; conflict only slows things down.' },
      { q: 'A colleague\'s section just got slammed with six new tables. What\'s the right way to step in?', options: ['Take over their tables entirely so they can catch up.', 'Ignore it — it\'s their section and their tips.', 'Catch their eye, ask "what do you need?", and take one concrete task off their plate.', 'Tell a manager their section is too busy.'], correct: 2, explain: 'Stepping in without stepping on toes means asking what they need and handling one thing — running drinks, dropping bread — not seizing their section.' },
    ],
  },
  {
    id: 'food-safety-floor',
    title: 'Food Safety on the Floor',
    desc: 'Allergens, cross-contamination, and when to flag a concern',
    duration: '8 min',
    xp: 25,
    status: 'available',
    scenarioId: 'casual-dining-allergy',
    learn: [
      { type: 'intro', text: 'Food safety isn\'t just a kitchen job — it\'s a front-of-house responsibility too. As a server, you\'re the last line of defense between the kitchen and the guest. You\'re the one who hears "I\'m allergic to nuts," the one who carries the plate to the table, the one who notices a dish that doesn\'t look right. A missed allergen flag isn\'t a small mistake — it can end in a hospital visit, or worse. You don\'t need to be a food scientist, but you do need to take allergies seriously, know the common danger zones, and know exactly what to do when something feels off.' },
      { type: 'tip-list', title: 'The 8 most common allergens', items: [
        'Milk (dairy) — hidden in sauces, dressings, butter, and many desserts.',
        'Eggs — in mayonnaise, batters, custards, and some pasta.',
        'Fish — including fish sauce and Worcestershire, not just whole fillets.',
        'Shellfish — shrimp, crab, lobster; often in stocks and broths too.',
        'Tree nuts — almonds, walnuts, cashews; common in oils, pesto, and desserts.',
        'Peanuts — distinct from tree nuts; in sauces, garnishes, and fryer oil.',
        'Wheat (gluten) — bread, pasta, breading, soy sauce, many thickeners.',
        'Soybeans (soy) — in soy sauce, tofu, edamame, and many processed items. Remember: guests don\'t always volunteer an allergy — you must ask.',
      ]},
      { type: 'intro', text: 'When a guest mentions an allergy, follow these exact steps every time. First, confirm the details with the guest — "How severe is it? Is even a trace a problem?" Second, take it straight to the kitchen and flag the ticket clearly — write it on the order and say it out loud. Third, never assume the kitchen already knows or that a dish is "probably fine" — assumptions are how people get hurt. Fourth, follow up when you deliver the dish: confirm out loud that this is the allergy-safe plate so there\'s no mix-up at the table. An allergy is never a place to guess, rush, or cut a corner.' },
      { type: 'tip-list', title: 'Red flags to always report', items: [
        'Food that looks undercooked — pink chicken, cold centers, raw-looking meat where it shouldn\'t be.',
        'A strong off or sour smell coming from a dish or ingredient — trust your nose.',
        'A plated dish that was left sitting out during a rush instead of going to the table — temperature matters.',
        'A guest showing signs of an allergic reaction — flushing, swelling, hives, difficulty breathing. Act immediately.',
        'A colleague skipping handwashing or handling food after touching something dirty — speak up or tell a manager.',
      ]},
    ],
    quiz: [
      { q: 'Why is food safety a front-of-house responsibility, not just the kitchen\'s?', options: ['It isn\'t — servers only deliver what the kitchen makes.', 'Because servers are the last line of defense between the kitchen and the guest.', 'Because servers cook part of the meal at the table.', 'Because health inspectors only talk to servers.'], correct: 1, explain: 'You hear the allergy, carry the plate, and notice when something looks off. That makes you the final safeguard before food reaches the guest.' },
      { q: 'Which of these is one of the 8 most common allergens?', options: ['Tomatoes.', 'Black pepper.', 'Shellfish.', 'Garlic.'], correct: 2, explain: 'The 8 common allergens are milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, and soybeans. Shellfish is one of the most severe.' },
      { q: 'A guest says they have a peanut allergy. What\'s the correct sequence?', options: ['Assume the kitchen knows and put the order in normally.', 'Confirm severity with the guest, flag the ticket clearly to the kitchen, never assume, and reconfirm when delivering.', 'Just avoid the obvious peanut dishes and serve the rest.', 'Tell them to ask the kitchen themselves.'], correct: 1, explain: 'Confirm, flag clearly, never assume, and reconfirm at delivery. An allergy is never a place to guess or cut a corner.' },
      { q: 'Do guests always tell you about their allergies up front?', options: ['Yes — they always mention it when ordering.', 'No — they may not volunteer it, so you should ask.', 'Only guests with severe allergies mention it.', 'It\'s not your job to ask; wait for them to say.'], correct: 1, explain: 'Guests don\'t always volunteer an allergy. Asking is part of protecting them — never assume silence means no allergy.' },
      { q: 'You\'re about to run a chicken dish and notice the center looks pink and undercooked. What do you do?', options: ['Serve it — the guest can send it back if they\'re worried.', 'Report it and don\'t take it to the table.', 'Take it out and quietly warn the guest to check it.', 'Leave it on the pass for another server to handle.'], correct: 1, explain: 'Undercooked food is a red flag you always report. Catching it before it reaches the guest is exactly the server\'s job as the last line of defense.' },
    ],
  },
  {
    id: 'speed-without-rushing',
    title: 'Speed Without Rushing',
    desc: 'Stay efficient and organized without making guests feel hurried',
    duration: '9 min',
    xp: 50,
    status: 'available',
    scenarioId: 'casual-dining-pace',
    learn: [
      { type: 'intro', text: 'There\'s a world of difference between being fast and making guests feel rushed. Done right, efficiency is completely invisible to the guest. They should feel relaxed, unhurried, and well looked after — even when you\'re actually moving at double speed behind the scenes. The goal is never to make a table feel like you\'re trying to turn them. It\'s to handle everything so smoothly that they never wait, never want for anything, and never sense the controlled chaos around them. A great casual dining server is a calm swan on the surface, paddling furiously underneath.' },
      { type: 'tip-list', title: 'The priority ladder during a rush', items: [
        'Food that\'s ready in the kitchen — hot plates wait for no one. Run them before they die under the heat lamp.',
        'Drink refills at the table — empty glasses are the most visible sign of neglect. Catch them fast.',
        'Check-ins for tables that have been waiting — a quick word resets a guest\'s patience.',
        'Clearing finished plates — it keeps tables comfortable and signals you\'re on top of things.',
        'Everything else — side work, restocking, resetting. Important, but it never comes before a guest.',
      ]},
      { type: 'intro', text: 'Attention to detail is a speed multiplier, not the opposite of speed. The servers who seem effortlessly fast aren\'t running harder — they\'re seeing more. They catch the nearly empty glass before it\'s empty, notice the guest scanning the room before they have to wave, spot the table that\'s ready for the bill before they ask. Each thing caught early means one fewer interruption, one fewer return trip, one fewer guest left waiting. Sloppy attention creates extra work: forgotten refills, missed signals, double-backs. Sharp attention removes work before it appears. That\'s how you move fast without ever looking rushed.' },
      { type: 'tip-list', title: '5 habits of efficient servers', items: [
        'Pre-bussing — clear empty plates and glasses as you pass, so tables never pile up and the final clear is quick.',
        'Carrying more in one trip — never make two trips when one will do; bring the refill and clear the plate together.',
        'Anticipating refills before they\'re asked — watch the glass line, not the raised hand.',
        'Knowing which tables are next in the sequence — hold the whole floor in your head so nothing surprises you.',
        'Never walking the floor empty-handed — every trip out carries something, every trip back brings something.',
      ]},
    ],
    quiz: [
      { q: 'What\'s the difference between being fast and making a guest feel rushed?', options: ['There is no difference — fast always feels rushed.', 'Efficiency done right is invisible; the guest feels relaxed even while you move at double speed.', 'Rushing is good when the restaurant is busy.', 'Feeling rushed means the server is working hard, which guests appreciate.'], correct: 1, explain: 'Great efficiency is invisible to the guest. They should feel unhurried and cared for, never like you\'re trying to turn their table.' },
      { q: 'During a rush, what sits at the top of the priority ladder?', options: ['Restocking and side work.', 'Clearing finished plates from every table.', 'Hot food that\'s ready in the kitchen.', 'Resetting empty tables for the next guests.'], correct: 2, explain: 'Ready food is the top priority — hot plates die under the heat lamp. Run them first, then refills, check-ins, clearing, and everything else.' },
      { q: 'How is attention to detail a "speed multiplier"?', options: ['It isn\'t — paying attention slows you down.', 'Catching things early means fewer interruptions, fewer return trips, and fewer waiting guests.', 'It only matters in fine dining, not casual.', 'It just makes managers happy during reviews.'], correct: 1, explain: 'Seeing the near-empty glass or the searching guest before they signal removes work before it appears — that\'s what makes sharp servers seem effortlessly fast.' },
      { q: 'Which of these is a core habit of an efficient server?', options: ['Walking the floor empty-handed to move faster.', 'Making two trips so you never carry too much.', 'Pre-bussing and never walking the floor empty-handed.', 'Waiting for the raised hand before refilling drinks.'], correct: 2, explain: 'Pre-bussing and always carrying something each direction cut down trips and keep tables clean — hallmarks of efficiency.' },
      { q: 'A guest at your table keeps glancing around the room. What does an attentive server read from this?', options: ['Nothing — they\'re just looking at the décor.', 'They need something and shouldn\'t have to wave you down — go check in.', 'They\'re bored and will leave soon.', 'They want the bill, so bring it without asking.'], correct: 1, explain: 'A guest scanning the room is a signal you catch before they have to flag you. Anticipating it is exactly how you stay ahead and avoid the wave.' },
    ],
  },
];

const casualDiningFloorLessons: Lesson[] = [
  {
    id: 'taking-orders',
    title: 'Taking Orders Correctly',
    desc: 'Full attention, clean modifications, and a confident read-back',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'casual-dining-order',
    learn: [
      { type: 'intro', text: 'Taking an order looks simple, but it\'s where more guest frustration is born than almost anywhere else in service. A wrong dish, a forgotten modification, a missed allergy — every one of them starts at this moment, with how well you listened. Taking an order correctly is not about writing fast. It\'s about giving the table your complete attention for the sixty seconds it takes, getting every detail right, and confirming it before you walk away. Get this right and the rest of the meal flows. Get it wrong and you\'ll be apologizing for it ten minutes later.' },
      { type: 'tip-list', title: 'Taking the order with full attention', items: [
        'Phone away, body squared to the table — you are present and nowhere else for these sixty seconds.',
        'Don\'t interrupt — let each guest finish before you respond or suggest.',
        'Make eye contact and acknowledge each order as it comes ("great choice," a nod) so they know they\'ve been heard.',
        'Know the menu well enough to answer questions instantly — and confirm with the kitchen rather than guessing if you\'re unsure.',
        'Capture modifications and allergies the moment they\'re said — write them down clearly, never trust them to memory in a rush.',
        'Move around the table in a logical order so nobody gets skipped or doubled up.',
      ]},
      { type: 'intro', text: 'Modifications and allergies are where attention matters most. When a guest changes a dish — dressing on the side, no onions, a swap of sides — repeat that change back as you note it: "Got it, the chicken bowl with the dressing on the side and greens instead of rice." When a guest mentions an allergy, treat it as non-negotiable: confirm the severity, write it on the ticket, and flag it out loud to the kitchen. Never wave a modification through with a vague "sure" and hope you remember — that\'s how the wrong plate reaches the table. A modification handled with confidence tells the guest they can trust you with the whole meal.' },
      { type: 'tip-list', title: 'Common order-taking mistakes to avoid', items: [
        'Trusting your memory instead of writing it down — the rush will erase it.',
        'Nodding along to a modification you didn\'t fully catch instead of asking them to repeat it.',
        'Forgetting to ask the follow-up questions — cook temperature, side choice, dressing, sauce.',
        'Letting a quieter guest get talked over and skipped in a big group.',
        'Walking away without reading the order back — the single fastest way to send the wrong food.',
        'Treating an allergy like a preference instead of confirming severity and flagging it properly.',
      ]},
      { type: 'intro', text: 'Picture a table of four with mixed modifications: one orders a burger medium with no pickle, one wants the salad with grilled chicken added and dressing on the side, one has a gluten allergy and needs the bun swapped and the kitchen flagged, and one orders straight off the menu. The amateur tries to hold all of that in their head and gets at least one wrong. The professional writes each one down as it\'s said, asks the cook-temperature and side questions in the moment, notes the allergy clearly and says it back, and then — before leaving — reads the entire table\'s order out loud to confirm. Thirty seconds of read-back saves ten minutes of remade plates and a table that no longer trusts you.' },
    ],
    quiz: [
      { q: 'What is taking an order correctly actually about?', options: ['Writing as fast as possible to save time.', 'Giving the table full attention, getting every detail right, and confirming before you leave.', 'Memorizing everything so you don\'t need to write it down.', 'Getting through it quickly so you can move to the next table.'], correct: 1, explain: 'Accuracy beats speed. Full attention for sixty seconds and a read-back before you walk away is what makes the rest of the meal flow.' },
      { q: 'A guest changes their dish — dressing on the side, greens instead of rice. What\'s the right move?', options: ['Say "sure" and trust yourself to remember it.', 'Write it down and repeat the change back as you note it.', 'Tell them modifications slow the kitchen down.', 'Note only the part you think matters most.'], correct: 1, explain: 'Capture the modification the moment it\'s said and read it back. A vague "sure" you hope to remember is how the wrong plate reaches the table.' },
      { q: 'A guest mentions an allergy while ordering. How should you treat it?', options: ['Like any other preference — note it and move on.', 'As non-negotiable — confirm severity, write it on the ticket, and flag it to the kitchen.', 'Assume the kitchen will catch it from the order.', 'Avoid the obvious dishes and serve the rest.'], correct: 1, explain: 'An allergy is never a preference. Confirm severity, note it clearly, and flag it out loud to the kitchen — guessing can put a guest in the hospital.' },
      { q: 'Why read the full order back before leaving the table?', options: ['It fills time while the guests settle.', 'It\'s the fastest way to catch a mistake before it becomes a remade plate and a table that doesn\'t trust you.', 'It\'s only necessary for large groups.', 'It shows the guests how good your memory is.'], correct: 1, explain: 'Thirty seconds of read-back saves ten minutes of remade food. It catches errors while they\'re still free to fix.' },
      { q: 'At a four-top with mixed modifications, what separates the professional from the amateur?', options: ['The professional holds it all in their head to look impressive.', 'The professional writes each order down as it\'s said, asks the follow-up questions, notes the allergy clearly, and reads the whole table back.', 'The professional takes the orders faster.', 'The professional lets the kitchen sort out the modifications.'], correct: 1, explain: 'Writing each item down in the moment, asking cook-temp and side questions, flagging the allergy, and confirming the full order is exactly how the pro avoids a wrong plate.' },
    ],
  },
  {
    id: 'managing-sections',
    title: 'Managing Multiple Tables',
    desc: 'Always know the status of every table at once',
    duration: '9 min',
    xp: 50,
    status: 'available',
    scenarioId: 'casual-dining-multitable',
    learn: [
      { type: 'intro', text: 'The single skill that separates a server who survives a rush from one who owns it is section awareness — holding the live status of every table in your head at once. A great server always knows, without looking twice, which table just sat down, which has ordered, which is waiting on food, which is eating, and which is ready for the bill. They don\'t react to whichever guest waves loudest; they work a mental map and stay ahead of all of it. Lose that map and you\'re suddenly running in circles, double-backing, and letting tables slip — which is exactly when guests start to feel forgotten.' },
      { type: 'tip-list', title: 'The five states every table is always in', items: [
        'Just seated — needs greeting, water, and menus. The clock is running on their first impression.',
        'Ordered — needs drinks out fast and the order fired correctly to the kitchen.',
        'Waiting on food — the danger zone; this is where guests feel forgotten, so keep them seen.',
        'Eating — needs a check-in, refills, and pre-bussing, then space to enjoy it.',
        'Ready for the bill — needs the check promptly and a warm close before they have to ask.',
      ]},
      { type: 'intro', text: 'Knowing the states is one thing; prioritizing them under pressure is another. When three tables need you at once, you triage. Hot food that\'s ready always goes first — it dies under the lamp and the table\'s already waiting. A new table that hasn\'t been greeted comes next, because an unacknowledged guest\'s frustration grows fastest. A guest who simply needs a refill or the bill can be held for thirty seconds with a glance and a "right with you." The mistake is serving whoever is closest or loudest instead of whoever the floor actually needs you to serve next. Triage by impact, not by volume.' },
      { type: 'tip-list', title: 'Prioritization under pressure', items: [
        'Ready hot food first — always. It only gets worse the longer it waits.',
        'Greet a new table before it starts to stew — an unacknowledged guest sours fastest.',
        'Batch your trips — never cross the floor for one thing when you could carry three.',
        'Acknowledge everyone you can\'t serve yet with eye contact and "I\'ll be right with you."',
        'Reset your mental map every time you pass the floor — re-scan, re-rank, keep moving.',
      ]},
      { type: 'intro', text: 'When you\'re genuinely stretched, the goal is to manage the guest\'s experience without ever making them feel the strain you\'re under. Guests forgive a busy room; they don\'t forgive feeling forgotten. So acknowledge waits honestly and warmly, set a realistic expectation ("I\'m firing your order now — about ten minutes"), and never let your stress show on your face or in your pace. A small gesture — topping up water, a quick honest update, "you\'re next" — buys enormous patience. What kills it is excuses, blaming the kitchen, vanishing, or over-apologizing. Calm, honest, and seen: that\'s how a stretched server keeps every table feeling looked after.' },
    ],
    quiz: [
      { q: 'What does "section awareness" actually mean?', options: ['Knowing how many tables are in your section.', 'Holding the live status of every table in your head at once — who just sat, who ordered, who\'s waiting, who\'s eating, who needs the bill.', 'Watching your manager\'s section as well as your own.', 'Remembering which tables tip the best.'], correct: 1, explain: 'Section awareness is the mental map of every table\'s state at once. It\'s what lets you stay ahead instead of reacting to whoever waves loudest.' },
      { q: 'Three tables need you at the same time. How do you decide what comes first?', options: ['Serve whoever is closest to you.', 'Serve whoever is waving or calling loudest.', 'Triage by impact — ready hot food first, then a new ungreeted table, then quick needs like a refill or bill.', 'Handle them strictly in the order they sat down.'], correct: 2, explain: 'Triage by impact, not volume. Hot food dies under the lamp and an ungreeted guest sours fastest — those come before a quick refill that can wait thirty seconds.' },
      { q: 'Which table state is the "danger zone" where guests most often feel forgotten?', options: ['Just seated.', 'Waiting on food.', 'Eating.', 'Ready for the bill.'], correct: 1, explain: 'Waiting on food is where guests feel forgotten. Keeping them seen during that stretch is what prevents frustration before it starts.' },
      { q: 'You\'re slammed and stretched thin. What\'s the right way to handle a waiting guest?', options: ['Explain how busy you are so they understand.', 'Acknowledge the wait warmly, set a realistic expectation, and never let your stress show.', 'Apologize repeatedly every time you pass.', 'Avoid eye contact until you can actually help them.'], correct: 1, explain: 'Guests forgive busy; they don\'t forgive feeling forgotten. Honest acknowledgment, a realistic time, and calm composure keep them patient — excuses and over-apologizing don\'t.' },
      { q: 'You\'re crossing the floor to grab one drink refill. What does an aware server do?', options: ['Make the single trip — focus on one task at a time.', 'Batch it — check the mental map and carry or clear whatever else is on the way.', 'Wait until several tables need things before moving.', 'Ask another server to cover the trip.'], correct: 1, explain: 'Never cross the floor for one thing. Batching trips off your mental map is what keeps a stretched section moving without double-backs.' },
    ],
  },
  {
    id: 'table-turns',
    title: 'Table Turns & Pacing',
    desc: 'Move tables through efficiently without ever rushing a guest',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'casual-dining-turn',
    learn: [
      { type: 'intro', text: 'Turning tables and rushing guests are not the same thing — and confusing them is one of the most expensive mistakes a server makes. Turning a table means moving it through the service sequence smoothly and at the right pace, so when the guests are naturally ready to go, everything\'s in place for them to leave happy and for the next party to sit. Rushing a guest means making them feel pushed out before they\'re ready. The first protects revenue and the guest experience at the same time. The second sacrifices the guest experience for a few extra minutes — and costs you the return visit and the tip. The whole craft is turning tables without anyone ever feeling turned.' },
      { type: 'tip-list', title: 'Reading the natural pacing signals', items: [
        'Plates pushed toward the edge or stacked — they\'re finished; clear promptly to open the next phase.',
        'Conversation winding down, glances around the room — the meal is closing; this is your window to offer dessert or the bill.',
        'Cutlery laid together on the plate — the universal "I\'m done" signal; don\'t leave it sitting.',
        'Cards or wallet appearing on the table — they want the bill now; don\'t make them ask.',
        'Settling back in, ordering another round, leaning into conversation — they\'re staying; give them space, don\'t force the close.',
      ]},
      { type: 'intro', text: 'Good pacing is the engine of a clean turn, and most of it is invisible. Clear plates promptly the moment a course is finished — a table buried under empty dishes feels neglected and stalls. Offer dessert and coffee at the natural lull rather than waiting to be asked, which keeps the meal moving forward. Present the bill at the right moment: after you\'ve read that they\'re winding down, framed with zero pressure — "no rush at all, just leaving this whenever you\'re ready." Each of these nudges the table gently toward its natural conclusion without a single word that sounds like "hurry up." The guest experiences a smooth, complete meal; you experience a table that turns itself.' },
      { type: 'tip-list', title: 'Turning a table without rushing the guest', items: [
        'Pre-bus throughout so the final clear is small and the table never feels stalled.',
        'Offer dessert, coffee, or the bill at the natural lull — read the moment, don\'t force it.',
        'Present the bill warmly and with no pressure: "whenever you\'re ready, no rush at all."',
        'Never hover, sigh, or stack chairs nearby — body language rushes guests louder than words.',
        'Close with genuine warmth and an invitation back — a great wrap-up makes the next visit, not just this turn.',
        'When a table genuinely wants to linger and the floor allows it, let them — a forced turn that sours a regular costs more than the table.',
      ]},
    ],
    quiz: [
      { q: 'What\'s the difference between turning a table and rushing a guest?', options: ['They\'re the same thing — both just mean getting guests to leave faster.', 'Turning moves a table smoothly through the sequence so it\'s ready when guests naturally are; rushing makes them feel pushed out before they\'re ready.', 'Turning only happens at busy times; rushing happens when it\'s slow.', 'Turning is for big tables, rushing is for small ones.'], correct: 1, explain: 'Turning protects both revenue and experience by pacing well. Rushing sacrifices the experience for a few minutes — and costs the return visit and the tip.' },
      { q: 'A guest lays their cutlery together on the plate. What does this signal?', options: ['They want more food.', 'They\'re finished with the course — clear it promptly.', 'They\'re unhappy with the dish.', 'They want to be left alone.'], correct: 1, explain: 'Cutlery laid together is the universal "I\'m done" signal. Clearing promptly opens the next phase and keeps the table from stalling.' },
      { q: 'What\'s the right way to present the bill when a table is winding down?', options: ['Drop it silently and walk away fast.', 'Wait until they explicitly ask for it.', 'Present it warmly with no pressure — "whenever you\'re ready, no rush at all."', 'Tell them you need the table for the next party.'], correct: 2, explain: 'Present at the natural lull, framed with zero pressure. It nudges the table toward its close without a single word that sounds like "hurry up."' },
      { q: 'Which of these rushes a guest the loudest — even without words?', options: ['Pre-bussing empty plates as you pass.', 'Offering dessert at a natural lull.', 'Hovering nearby, sighing, or stacking chairs close to the table.', 'Closing with a warm invitation back.'], correct: 2, explain: 'Body language rushes guests louder than words. Hovering, sighing, and stacking chairs nearby all scream "hurry up" even if you never say it.' },
      { q: 'A table genuinely wants to linger and the floor isn\'t under pressure. What\'s the smart call?', options: ['Force the turn anyway — every table must turn on schedule.', 'Let them linger — a forced turn that sours a regular costs more than the table.', 'Present the bill repeatedly until they leave.', 'Start clearing everything to signal they should go.'], correct: 1, explain: 'When the floor allows it, let a table linger. A great wrap-up makes the next visit; a forced turn that sours a guest costs far more than a few minutes.' },
    ],
  },
  {
    id: 'floor-efficiency',
    title: 'Efficiency & Attention to Detail',
    desc: 'Catch the small things before guests ever have to ask',
    duration: '9 min',
    xp: 50,
    status: 'available',
    scenarioId: 'casual-dining-efficiency',
    learn: [
      { type: 'intro', text: 'The best servers don\'t look like they\'re working harder than everyone else — they look like they\'re working less, because everything is handled before it becomes a problem. That\'s the difference between proactive and reactive service. Reactive service waits for the raised hand, the empty glass, the request; it\'s always one step behind, always apologizing for a thing that was already too late. Proactive service sees the need forming and meets it before the guest even registers it. The refill arrives before they reach for the glass. The plate is cleared before they push it away. Nothing is ever asked for, because nothing is ever missed. That\'s what "seamless" actually means — and it\'s built entirely on attention to detail.' },
      { type: 'tip-list', title: 'Proactive vs reactive — the shift', items: [
        'Reactive waits for the empty glass; proactive watches the glass line and refills before it\'s empty.',
        'Reactive waits to be flagged; proactive catches the guest scanning the room and is already on the way.',
        'Reactive clears when asked; proactive clears the finished plate the moment cutlery goes down.',
        'Reactive brings the bill when requested; proactive reads the close and has it ready at the right moment.',
        'Reactive apologizes for the miss; proactive never creates the miss in the first place.',
      ]},
      { type: 'intro', text: 'Two habits turn attention into efficiency. The first is the scan: every single time you pass through your section, your eyes do a quick sweep — glass levels, plate states, faces, body language. One pass, the whole picture updated, every time. The servers who seem to have eyes everywhere aren\'t gifted; they\'ve just made scanning automatic. The second is the one-trip rule, sometimes called never walking empty-handed: every trip out of the kitchen carries something to the floor, and every trip back brings something with it. A dropped plate cleared on the way past, a refill delivered en route, a condiment grabbed because you noticed it was needed two tables ago. Small details compound: catch ten tiny things early and you\'ve erased ten interruptions, ten return trips, ten moments a guest might have felt overlooked. That compounding is what an exceptional experience is actually made of.' },
      { type: 'tip-list', title: '6 efficiency habits every floor server should build', items: [
        'Scan your section every single time you pass — one sweep, glasses and plates and faces, picture updated.',
        'Live by the one-trip rule — never walk the floor empty-handed in either direction.',
        'Pre-bus constantly — clear finished plates and glasses as you go so the table never piles up.',
        'Anticipate the next need — read what each table will want next and have it moving before they ask.',
        'Batch tasks by trip — group what you carry and where you stop so one lap does the work of three.',
        'Reset and restock proactively in the lulls — stock your station so a rush never catches you running for napkins.',
      ]},
      { type: 'intro', text: 'The observant regular is the ultimate test of all of this. They\'ve been in enough times to know exactly how good service feels, and they read your section the way you should be reading it — they see the glass you didn\'t refill, the plate you left sitting, the moment you waited to be told. You can\'t charm your way past that guest; you can only out-attention them. Catch the near-empty glass before they touch it, clear the finished plate without being asked, anticipate the next thing they\'ll want and have it ready — and do all of it smoothly, in one pass, without making a performance of it. Get there and the regular stops noticing the service at all, which is the highest compliment there is: it just feels effortless, because you did all the work where they couldn\'t see it.' },
    ],
    quiz: [
      { q: 'What\'s the core difference between proactive and reactive service?', options: ['Proactive is faster; reactive is slower.', 'Proactive sees the need forming and meets it before the guest registers it; reactive waits for the raised hand and is always a step behind.', 'Proactive is for regulars; reactive is for new guests.', 'There is no real difference — both get the job done.'], correct: 1, explain: 'Reactive waits for the request and apologizes for the miss. Proactive meets the need before it\'s voiced, so nothing is ever asked for because nothing is ever missed.' },
      { q: 'What is the "scan," and how often should you do it?', options: ['A quick check of your phone between tables.', 'A sweep of your whole section — glasses, plates, faces — done every single time you pass through it.', 'A once-per-shift review with your manager.', 'A check you do only when a table flags you.'], correct: 1, explain: 'The scan is a one-pass sweep of glass levels, plate states, and body language, done every time you cross your section. Making it automatic is how great servers seem to have eyes everywhere.' },
      { q: 'What does the "one-trip rule" (never walking empty-handed) mean?', options: ['Only make one trip to each table per visit.', 'Every trip out of the kitchen carries something to the floor, and every trip back brings something with it.', 'Never carry more than one plate at a time for safety.', 'Limit yourself to one lap of the floor between orders.'], correct: 1, explain: 'Never walking empty-handed means each trip in either direction is doing work — delivering, clearing, or grabbing what you spotted was needed. It erases return trips.' },
      { q: 'How do small details "compound" into an exceptional experience?', options: ['They don\'t — only big gestures matter to guests.', 'Catching ten tiny things early erases ten interruptions, ten return trips, and ten moments a guest might feel overlooked.', 'They add up to a bigger tip at the end of one meal.', 'They mainly impress the manager, not the guest.'], correct: 1, explain: 'Each detail caught early removes work and a potential miss before it appears. Stacked up across a meal, that\'s exactly what makes service feel seamless and exceptional.' },
      { q: 'Why is the observant regular the ultimate test of efficiency and attention?', options: ['Because they always tip the most.', 'Because they read your section the way you should — they see the glass you didn\'t refill and the plate you left, so you can only out-attention them, not charm them.', 'Because they expect free items for being loyal.', 'Because they prefer slower, more formal service.'], correct: 1, explain: 'A sharp regular notices every detail you miss. The only way to win them is to anticipate everything smoothly — and when service feels effortless to them, that\'s the highest compliment there is.' },
    ],
  },
];

// ─── FINE DINING PHASE 1 · MODULE 1: THE FINE DINING STANDARD ─

const fineDiningStandardLessons: Lesson[] = [
  {
    id: 'fds-what-it-means',
    title: 'What Fine Dining Actually Means',
    desc: 'The mindset that separates fine dining from everything else.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-mindset',
    learn: [
      { type: 'intro', text: 'Fine dining is not about being stiff, formal, or robotic. It is about making guests feel genuinely, deeply cared for — at a level most people rarely experience. Every detail you control either elevates or diminishes that feeling. A half-filled water glass, a rushed approach, a distracted look — guests notice all of it. That is the standard you are training for.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'The standard is simple: every action you take either elevates or diminishes the guest experience. There is no neutral.' },
      { type: 'steps', title: 'The four principles of the fine dining mindset', items: [
        { num: 1, title: 'Hospitality over service', body: 'Service is delivering food and drink; hospitality is making the guest feel seen, valued, and cared for. Fine dining demands hospitality, not just service.' },
        { num: 2, title: 'Details are not small', body: 'In fine dining there are no small details. A wrinkled shirt, a fingerprint on a glass, a mispronounced dish: every detail speaks to the standard of the house.' },
        { num: 3, title: 'Calm is a skill', body: 'A busy service will always bring pressure, and fine dining professionals never let it reach the guest. Calm is not something you feel; it is something you perform until it becomes natural.' },
        { num: 4, title: 'Pride in craft', body: 'The best fine dining servers take genuine pride in what they do. This is not just a job; it is a craft. Carry it that way.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Pause before approaching a table to read the energy, then move.', dont: 'Walking up mid-conversation and launching straight into your opening line.' },
        { do: 'Notice a nearly empty glass and refill it before the guest looks for you.', dont: 'Waiting until a guest has to wave or call for water.' },
        { do: 'When something goes wrong, fix it quietly and efficiently.', dont: 'Over-apologizing, making excuses, or involving the guest in the problem.' },
        { do: 'Take one breath before re-entering the dining room during a busy service.', dont: 'Carrying kitchen stress onto your face or into your pace.' },
      ]},
      { type: 'tip-list', title: 'Five fine dining mindset habits', items: [
        'Before every shift: stand in front of a mirror and check that you look the part.',
        'On the floor: move with purpose — not urgency.',
        'When you make a mistake: acknowledge, apologize once, fix it, move on.',
        'During service: always know the status of every table in your section.',
        'At the end of every shift: ask yourself one thing you could have done better.',
      ]},
    ],
    quiz: [
      { q: 'What is fine dining fundamentally about?', options: ['Being formal, stiff, and following strict rules.', 'Making guests feel genuinely and deeply cared for.', 'Serving food as quickly and efficiently as possible.', 'Impressing guests with expensive ingredients.'], correct: 1, explain: 'Fine dining is not about stiffness or formality — it is about making guests feel cared for at a level they rarely experience.' },
      { q: 'What is the difference between service and hospitality?', options: ['There is no difference — they mean the same thing.', 'Service is delivering food and drink; hospitality is making the guest feel seen, valued, and cared for.', 'Hospitality is faster; service is slower.', 'Service is for fine dining; hospitality is for casual dining.'], correct: 1, explain: 'Service delivers food and drink. Hospitality makes the guest feel cared for — and fine dining demands hospitality, not just service.' },
      { q: 'How should you treat small details like a fingerprint on a glass or a wrinkled shirt?', options: ['They\'re minor and not worth the time during a busy service.', 'There are no small details — every one speaks to the standard of the house.', 'Only fix them if a guest points them out.', 'They matter only during inspections.'], correct: 1, explain: 'In fine dining there are no small details. Every one, however small, communicates the standard of the house to the guest.' },
      { q: 'What does it mean that "calm is a skill"?', options: ['Calm is a personality trait you either have or you don\'t.', 'Calm is something you perform under pressure until it becomes natural — you never let pressure reach the guest.', 'Calm means working slowly so you never feel rushed.', 'Calm only matters when the restaurant is quiet.'], correct: 1, explain: 'Pressure is constant in a busy service. Calm is not a feeling you wait for — it is something you perform, so the pressure never reaches the guest.' },
      { q: 'Which of these is one of the four principles of the fine dining mindset?', options: ['Speed above all else.', 'Pride in craft — treating the work as a craft, not just a job.', 'Telling guests when the kitchen is running slow.', 'Keeping every conversation casual and relaxed.'], correct: 1, explain: 'Pride in craft is one of the four principles. The best fine dining servers carry the work as a craft, not just a job.' },
    ],
  },
  {
    id: 'fds-your-presence',
    title: 'Your Presence on the Floor',
    desc: 'Guests read your energy before you say a single word.',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-presence',
    learn: [
      { type: 'intro', text: 'In a fine dining room, you are always on stage. A guest seated at the far end of the room can see how you walk, how you carry yourself, and whether you look like you belong here. Your presence — posture, pace, expression, energy — communicates your standard before you ever open your mouth.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'You are always on stage. A guest anywhere in the room can read your energy.' },
      { type: 'steps', title: 'The five elements of fine dining presence', items: [
        { num: 1, title: 'Posture', body: 'Stand tall, shoulders relaxed and back, chin level. Don\'t slouch against walls or lean on furniture. Your posture says either "I take this seriously" or "I am just passing through."' },
        { num: 2, title: 'Pace', body: 'Walk at a calm, purposeful pace. Not slow; purposeful. Never rush through the dining room, because rushing communicates chaos. If you need to move fast, do it through the kitchen.' },
        { num: 3, title: 'Expression', body: 'A neutral, warm expression: not a performed smile, not a blank face. You are approachable and calm. If you are stressed, the dining room is not where that shows.' },
        { num: 4, title: 'Voice', body: 'Speak calmly and at a conversational volume. The table next to the one you are serving should not hear your conversation. Control your volume at all times.' },
        { num: 5, title: 'Hands', body: 'Hands out of pockets at all times on the floor. They should be at your sides, behind your back, or carrying something. Never crossed arms, never fiddling.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Walk through the dining room at a calm, even pace even when you are in a hurry.', dont: 'Rushing visibly, weaving between tables.' },
        { do: 'Reset your expression before re-entering the dining room from the kitchen.', dont: 'Bringing a stressed or frustrated look onto the floor.' },
        { do: 'Stand straight and still while taking an order or speaking to a guest.', dont: 'Shifting your weight, leaning on the table, or looking distracted while a guest is speaking.' },
        { do: 'Acknowledge a guest across the room with a small nod if you cannot reach them yet.', dont: 'Ignoring a guest who is looking for you because you are finishing something else.' },
      ]},
      { type: 'tip-list', title: 'Five presence habits to build now', items: [
        'Before walking into the dining room: take one breath and reset your face.',
        'Every time you pass a mirror or reflective surface: a quick posture check.',
        'If you are stressed: drop your shoulders, slow your pace by 10%, and keep moving.',
        'Never have a personal conversation — phone or colleague — in view of guests.',
        'After a tough table: give yourself 20 seconds in the kitchen before going back out.',
      ]},
    ],
    quiz: [
      { q: 'Why does the lesson say you are "always on stage" in a fine dining room?', options: ['Because managers are always watching you.', 'Because a guest anywhere in the room can see how you carry yourself and read your energy.', 'Because there are cameras on the floor.', 'Because you have to perform a fixed script for guests.'], correct: 1, explain: 'In an open dining room a guest at the far end can see your posture, pace, and expression. Your presence communicates your standard before you speak.' },
      { q: 'What is the right pace to move through the dining room?', options: ['As fast as possible to serve more tables.', 'Slow and relaxed so you never seem busy.', 'Calm and purposeful — never rushing, because rushing communicates chaos.', 'Whatever pace matches how busy you feel inside.'], correct: 2, explain: 'Walk at a calm, purposeful pace — not slow, but never rushed. If you genuinely need to move fast, do it through the kitchen, not the dining room.' },
      { q: 'You need to hurry to the kitchen during a busy service. What\'s the right move?', options: ['Rush straight across the dining room — guests understand busy.', 'Move fast through the kitchen, not visibly through the dining room.', 'Jog between tables while apologizing as you go.', 'Stop serving until the rush passes.'], correct: 1, explain: 'Rushing through the dining room communicates chaos. If you must move quickly, route through the kitchen so the floor stays calm.' },
      { q: 'What does the lesson say about your hands while on the floor?', options: ['Keep them in your pockets so you look relaxed.', 'Cross your arms while waiting so you look composed.', 'Keep them out of pockets — at your sides, behind your back, or carrying something.', 'Use them constantly to gesture so you seem warm.'], correct: 2, explain: 'Hands stay out of pockets at all times — at your sides, behind your back, or carrying something. Never crossed arms, never fiddling.' },
      { q: 'You\'ve just had a stressful table and you\'re tense. How do you manage your presence?', options: ['Carry on at the same fast pace so you don\'t fall behind.', 'Let the guests see you\'re stressed so they\'re patient with you.', 'Drop your shoulders, slow your pace slightly, reset your face — and take 20 seconds in the kitchen if you can.', 'Vent quickly to a colleague on the floor to release it.'], correct: 2, explain: 'Reset your presence deliberately: drop your shoulders, slow down a touch, reset your expression, and decompress in the kitchen — never on the floor.' },
    ],
  },
  {
    id: 'fds-uniform-grooming',
    title: 'Uniform & Grooming Standards',
    desc: 'Your appearance sets the standard before service begins.',
    duration: '6 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-presentation',
    learn: [
      { type: 'intro', text: 'In fine dining, your appearance is part of the guest experience. A stain on your uniform, an untied apron, strong cologne — these things break the spell. Guests notice the entire environment, and you are part of it. Your presentation communicates the level of care the restaurant has for its guests, before you have said a word.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Your appearance tells guests how seriously you take your craft before you say a single word.' },
      { type: 'steps', title: 'The pre-shift presentation checklist', items: [
        { num: 1, title: 'Uniform', body: 'Pressed, stain-free, and properly fitted. If it needs ironing, iron it before you arrive. If it has a stain that won\'t come out, report it and request a replacement.' },
        { num: 2, title: 'Hair', body: 'Clean, neat, and secured away from the face, with no loose strands that could fall near food. Fine dining guests watch your hands and your hair during service.' },
        { num: 3, title: 'Hands and nails', body: 'Short, clean, no strong nail polish. Your hands are visible during every interaction — placing plates, pouring wine, presenting menus — so they must be immaculate.' },
        { num: 4, title: 'Scent', body: 'No strong perfume, cologne, or deodorant. Fine dining guests are eating, and strong scent interferes with the aroma of food and wine. Subtle is professional.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Arrive with your uniform pressed and your shoes clean, ready before the shift briefing.', dont: 'Ironing or fixing your uniform during pre-service prep time.' },
        { do: 'Check your appearance in a mirror before entering the dining room for the first time.', dont: 'Going straight from the locker room to the floor without a final check.' },
        { do: 'Keep your phone stored completely out of sight, in a locker.', dont: 'Tucking it in an apron pocket where it can be seen or heard.' },
        { do: 'Report a uniform issue to management immediately and ask for a solution.', dont: 'Trying to hide a stain or damage through a full service.' },
      ]},
      { type: 'tip-list', title: 'Pre-shift checklist — run through this every day', items: [
        'Uniform pressed and stain-free.',
        'Shoes clean and polished.',
        'Hair secured and clean.',
        'Nails short and clean.',
        'No strong scent.',
        'Name badge straight and visible.',
        'Phone stored away.',
        'Mirror check before the floor.',
      ]},
    ],
    quiz: [
      { q: 'Why does personal presentation matter in a fine dining context?', options: ['It only matters for the manager\'s inspection.', 'Your appearance is part of the guest experience and communicates the restaurant\'s care before you speak.', 'It doesn\'t — only the food matters to guests.', 'It matters only for staff working near the entrance.'], correct: 1, explain: 'In fine dining you are part of the environment guests notice. Your presentation communicates the level of care the restaurant has for its guests before a word is said.' },
      { q: 'You notice a stain on your uniform that won\'t come out. What should you do?', options: ['Wear it anyway and hope no one notices.', 'Try to hide the stain with your apron through service.', 'Report it to management immediately and request a replacement.', 'Wait until after service to mention it.'], correct: 2, explain: 'Report a uniform issue immediately and ask for a solution. Hiding a stain through a full service is exactly what the standard forbids.' },
      { q: 'What does the lesson say about scent in fine dining?', options: ['Wear a strong signature cologne so you\'re memorable.', 'No strong perfume, cologne, or deodorant — strong scent interferes with the aroma of food and wine.', 'Scent doesn\'t matter as long as you\'re clean.', 'Only the kitchen staff need to avoid strong scent.'], correct: 1, explain: 'Guests are eating and drinking, so strong scent interferes with the aroma of food and wine. Subtle is professional.' },
      { q: 'When should your uniform be pressed and your shoes polished?', options: ['During pre-service prep time once you arrive.', 'Before you arrive — ready before the shift briefing.', 'Only on busy nights.', 'Whenever you find a spare moment during service.'], correct: 1, explain: 'Arrive already presentable. Ironing or fixing your uniform during prep time means you showed up unready.' },
      { q: 'A colleague arrives wearing strong cologne before service. Why is that a problem?', options: ['It isn\'t — cologne shows they made an effort.', 'Strong scent interferes with the aroma of food and wine for guests who are eating.', 'It only matters if a guest complains.', 'It\'s a problem only in the kitchen, not the dining room.'], correct: 1, explain: 'Fine dining guests are tasting food and wine; strong scent disrupts that experience. Subtle, not strong, is the professional standard.' },
    ],
  },
  {
    id: 'fds-team-conduct',
    title: 'Professional Conduct & Teamwork',
    desc: 'What guests feel from the team is everything.',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-teamwork',
    learn: [
      { type: 'intro', text: 'Guests cannot see what happens between staff members. But they feel it. A team that communicates poorly, covers for each other badly, or shows tension in the dining room — guests sense it even when they cannot name it. A great fine dining team is invisible to guests: seamless, coordinated, and always composed.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'What happens between staff is invisible to guests. What guests feel from the team is everything.' },
      { type: 'steps', title: 'The four principles of fine dining teamwork', items: [
        { num: 1, title: 'Cover without being asked', body: 'If you see a colleague\'s table needs water, refill it; if their guest is looking around, acknowledge them. You don\'t wait to be asked, you see it and handle it.' },
        { num: 2, title: 'Communicate quietly and precisely', body: 'On the floor, all communication between staff is brief, quiet, and purposeful. No personal conversations, no venting, no raised voices, ever. The kitchen is where you decompress; the dining room is where you perform.' },
        { num: 3, title: 'Handle mistakes with solutions, not excuses', body: 'When something goes wrong, the only relevant question is what we do right now. Not whose fault it was, not how it happened. Fine dining professionals fix first and debrief later.' },
        { num: 4, title: 'Respect the kitchen relationship', body: 'The kitchen and floor are one team. Speak to kitchen staff with respect, communicate clearly about table pace, and never blame the kitchen in front of a guest. Ever.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Notice a colleague is stretched and quietly offer to cover one of their tables.', dont: 'Watching them struggle and waiting to be asked for help.' },
        { do: 'When something goes wrong, take two seconds to think, then act with calm precision.', dont: 'Visibly panicking, arguing about fault, or involving the guest in the problem.' },
        { do: 'Communicate with kitchen staff clearly, respectfully, and directly.', dont: 'Arguing with or venting to them during a service.' },
        { do: 'If you disagree with a colleague, handle it after service.', dont: 'Hashing it out during service, in the dining room or kitchen.' },
      ]},
      { type: 'tip-list', title: 'Five professional conduct rules — no exceptions', items: [
        'Never argue, vent, or show frustration in the dining room.',
        'Always cover a colleague\'s table if you see it needs attention.',
        'Never blame the kitchen in front of a guest.',
        'Mistakes get fixed first, discussed later.',
        'The dining room is a performance — your personal feelings stay in the locker room.',
      ]},
    ],
    quiz: [
      { q: 'Guests can\'t see what happens between staff. So why does teamwork matter so much?', options: ['It doesn\'t affect guests, since they can\'t see it.', 'Guests feel the team\'s coordination and tension even when they can\'t name it.', 'It only matters for the staff\'s own comfort.', 'It matters only when the restaurant is busy.'], correct: 1, explain: 'Guests sense a poorly coordinated or tense team even without seeing it. A great team is invisible: seamless, coordinated, and composed.' },
      { q: 'A colleague\'s guest is looking around for water and you\'re passing by. What does fine dining teamwork say?', options: ['Find that colleague and tell them their table needs water.', 'Ignore it — it\'s not your table.', 'Cover it yourself — refill the water without waiting to be asked.', 'Wait to see if the guest flags someone down.'], correct: 2, explain: 'Cover without being asked. If you see a colleague\'s table needs something, you handle it — you don\'t wait to be asked.' },
      { q: 'Something goes wrong during service. What\'s the only relevant question in the moment?', options: ['Whose fault was it?', 'How did this happen?', 'What do we do right now?', 'Who should we tell about it?'], correct: 2, explain: 'Fine dining professionals fix first and debrief later. In the moment, the only question that matters is what to do right now — not blame.' },
      { q: 'A course is badly delayed from the kitchen and a guest asks why. What do you never do?', options: ['Apologize and give a realistic time.', 'Blame the kitchen in front of the guest.', 'Offer something to ease the wait.', 'Check with the kitchen on timing.'], correct: 1, explain: 'The kitchen and floor are one team. You never blame the kitchen in front of a guest — ever.' },
      { q: 'You strongly disagree with a colleague during a busy service. When do you address it?', options: ['Immediately, so it doesn\'t fester.', 'In the kitchen, quietly, mid-service.', 'After service — never during, and never in the dining room.', 'In front of the guest so they understand the situation.'], correct: 2, explain: 'Disagreements are handled after service. The dining room is a performance; personal feelings and conflicts stay out of it until you\'re off the floor.' },
    ],
  },
];

// ─── FINE DINING PHASE 1 · MODULE 2: PROFESSIONAL APPEARANCE & PRESENCE ─

const fineDiningPresenceLessons: Lesson[] = [
  {
    id: 'fdp-body-language',
    title: 'Body Language That Communicates Care',
    desc: 'Guests read how you move long before they hear what you say.',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-body-language',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'A guest decides how cared for they feel from the way you carry yourself — before you have said a single word.' },
      { type: 'intro', text: 'In a fine dining room, your body is always speaking. The way you approach a table, where you place your hands, how steadily you stand while a guest is talking — all of it tells the guest, instantly, whether they are in capable hands or being processed. Elegance is not something you switch on at the table. It is the way you cross the room, the way you wait, the way you turn to leave. Master your body language and you communicate care in the silence between words.' },
      { type: 'steps', title: 'The five signals your body is always sending', items: [
        { num: 1, title: 'Your approach', body: 'Approach unhurried, on a slight angle rather than head-on, and stop at a respectful distance — close enough to be attentive, never looming over the table. A measured approach tells the guest they have your full attention.' },
        { num: 2, title: 'Your posture', body: 'Stand tall with shoulders relaxed and open, weight even on both feet. Never lean on the table, the wall, or a chair back. An upright, settled posture says you are present and unrushed, however busy the room.' },
        { num: 3, title: 'Your pace', body: 'Move deliberately and smoothly. Quick, darting movements read as anxiety and ripple through the room. A calm pace at the table reassures the guest that nothing is more important than they are right now.' },
        { num: 4, title: 'Your hands', body: 'Keep your hands still and purposeful — at your sides, lightly clasped behind your back, or placing something with care. Never fidget, point, or gesture broadly. Composed hands are the quiet signature of a professional.' },
        { num: 5, title: 'Acknowledging across the room', body: 'When a guest catches your eye from another table, meet it with a small, warm nod — a silent "I see you, I am coming." A guest who feels seen will wait calmly; a guest who feels invisible grows restless within seconds.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Approach on a gentle angle and pause a beat before speaking.', dont: 'Marching up head-on and starting to talk before you have fully arrived.' },
        { do: 'Stand square and still, hands composed, while a guest speaks to you.', dont: 'Shifting your weight, glancing across the room, or letting your hands wander.' },
        { do: 'Return a distant guest\'s glance with a calm, reassuring nod.', dont: 'Pretending not to notice a guest looking for you because your hands are full.' },
        { do: 'Lower yourself slightly toward the table when speaking to seated guests.', dont: 'Towering over the table and forcing guests to crane upward to meet your eye.' },
      ]},
      { type: 'tip-list', title: 'Five body-language habits to build now', items: [
        'Before you reach a table, slow your last few steps by a fraction.',
        'Catch yourself the moment you start to lean on something — reset and stand tall.',
        'Keep your hands behind your back when waiting, so they never fidget.',
        'Make a habit of scanning your section and nodding to anyone seeking you.',
        'When a guest is speaking, hold still — stillness is a form of listening.',
      ]},
    ],
    quiz: [
      { q: 'According to the standard, when does a guest decide how cared for they feel?', options: ['Once they have tasted the first course.', 'From the way you carry yourself, before you say a single word.', 'Only when you present the bill.', 'When they read the online reviews beforehand.'], correct: 1, explain: 'Your body language communicates care in the silence before words. A guest reads how you move and stand long before you speak.' },
      { q: 'What is the correct way to approach a fine dining table?', options: ['Quickly and head-on, so the guest knows you are attentive.', 'Unhurried, on a slight angle, stopping at a respectful distance.', 'From directly behind, to surprise them pleasantly.', 'As close as possible so they can hear you over the room.'], correct: 1, explain: 'A measured approach on a slight angle, stopping at a respectful distance, signals full attention without looming over the table.' },
      { q: 'A guest is speaking to you. What does your posture say in that moment?', options: ['It doesn\'t matter as long as you are listening.', 'Standing square and still signals you are present; shifting and glancing away signals distraction.', 'Leaning on the table shows you are relaxed and friendly.', 'Crossing your arms shows you are concentrating.'], correct: 1, explain: 'Stillness is a form of listening. Standing square and composed tells the guest nothing matters more than them right now.' },
      { q: 'A guest at another table catches your eye while your hands are full. What do you do?', options: ['Look away — you can\'t help them right now anyway.', 'Meet their eye with a small, warm nod that says "I see you, I am coming."', 'Rush over immediately and abandon what you are carrying.', 'Call across the room that you will be there shortly.'], correct: 1, explain: 'A guest who feels seen waits calmly. A small nod acknowledges them silently; a guest who feels invisible grows restless within seconds.' },
      { q: 'Why does quick, darting movement work against you on the floor?', options: ['It doesn\'t — fast movement shows the guests you are working hard.', 'It reads as anxiety and ripples through the room, undermining the sense of calm.', 'It is only a problem if a guest mentions it.', 'It tires you out before the end of service.'], correct: 1, explain: 'Calm, deliberate movement reassures the room. Darting, anxious movement signals chaos and quietly unsettles every guest who sees it.' },
    ],
  },
  {
    id: 'fdp-voice',
    title: 'Voice, Tone & Vocabulary',
    desc: 'How you speak is as much a part of the room as how it looks.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-voice',
    learn: [
      { type: 'intro', text: 'In an elegant room, your voice is an instrument. The same sentence can sound rushed and ordinary or warm and refined depending entirely on your pace, your volume, and the words you choose. Casual phrasing — "no problem," "you guys," "no worries" — instantly drops the room a level, no matter how beautiful the plates. Guests at this level notice language the way they notice a smudged glass. Refining how you speak is not about sounding stiff or scripted; it is about choosing warmth and precision over habit.' },
      { type: 'principles', items: [
        { num: 1, title: 'Slow down', body: 'Speak a touch slower than feels natural. Rushed speech signals you would rather be elsewhere. A calm, measured pace tells the guest you have all the time in the world for them.' },
        { num: 2, title: 'Control your volume', body: 'Speak softly enough that the next table cannot follow your conversation, yet clearly enough to be understood the first time. The guest you are serving should feel they are in a private exchange, not a public announcement.' },
        { num: 3, title: 'Choose elevated words', body: 'Swap habit for intention. "Of course" instead of "no problem." "May I" instead of "can I." "Certainly" instead of "sure." The right word costs nothing and lifts the entire interaction.' },
        { num: 4, title: 'Warm, never casual', body: 'Refined does not mean cold. You can be genuinely warm — a real smile, real interest — while keeping your language polished. Warmth and elegance live together; slang and elegance do not.' },
      ]},
      { type: 'do-dont', title: 'Upgrade your phrases', items: [
        { do: '"Of course — right away."', dont: '"No problem, I got you."' },
        { do: '"And for yourself, sir?" / "And for you, madam?"', dont: '"What about you guys?"' },
        { do: '"My pleasure." / "It would be my pleasure."', dont: '"No worries." / "It\'s all good."' },
        { do: '"May I clear this for you?"', dont: '"You done with that?"' },
        { do: '"Certainly. Allow me a moment."', dont: '"Yeah, sure, hang on."' },
        { do: '"Is there anything else I may bring you?"', dont: '"You guys need anything else?"' },
      ]},
      { type: 'callout', tone: 'warn', label: 'The slang trap', text: 'Casual phrases are habits, not decisions — they slip out under pressure. The only way to retire them is to practice the refined version until it becomes your automatic response, even on the busiest night.' },
      { type: 'tip-list', title: 'Five voice habits to build now', items: [
        'Address guests directly — "sir," "madam," or by name — never "you guys."',
        'Replace "no problem" with "of course" until it is automatic.',
        'Lower your volume by a notch when you reach the table.',
        'Pause for a half-second before answering — it slows your pace naturally.',
        'Catch one casual phrase you say often and drill its refined replacement.',
      ]},
    ],
    quiz: [
      { q: 'Why does casual phrasing matter so much in a fine dining room?', options: ['It doesn\'t — guests only care about the food.', 'Guests at this level notice language the way they notice a smudged glass; slang instantly drops the room a level.', 'It only matters with older guests.', 'It matters only when the manager is on the floor.'], correct: 1, explain: 'Refined guests register language as keenly as any other detail. A casual phrase undermines the experience no matter how beautiful the plates are.' },
      { q: 'A guest thanks you and you want to respond well. What do you say?', options: ['"No problem!"', '"Of course — my pleasure."', '"No worries at all."', '"It\'s all good."'], correct: 1, explain: '"Of course" and "my pleasure" are the elevated responses. "No problem" and "no worries" are casual habits that lower the tone.' },
      { q: 'How should you manage your volume at the table?', options: ['Speak loudly so the whole party hears you clearly.', 'Soft enough that the next table can\'t follow, clear enough to be understood the first time.', 'As quietly as possible, even if guests must ask you to repeat.', 'Match the volume of the room around you.'], correct: 1, explain: 'The guest should feel they are in a private exchange, not a public announcement — soft but perfectly clear.' },
      { q: 'You are addressing a mixed table and want to ask the others what they would like. What is the refined approach?', options: ['"What about you guys?"', 'Address each guest directly — "And for yourself, sir?" / "And for you, madam?"', '"Anyone else want anything?"', '"You all good for now?"'], correct: 1, explain: 'Address guests directly and individually. "You guys" is exactly the casual habit fine dining language replaces.' },
      { q: 'Why do casual phrases tend to "slip out" even when you know better?', options: ['Because the refined versions are too long to say.', 'Because they are habits, not decisions — so they surface under pressure until you drill the replacement.', 'Because guests sometimes prefer them.', 'They don\'t — anyone can simply choose better words on the spot.'], correct: 1, explain: 'Slang is automatic, not chosen. Only practicing the refined version until it becomes your default retires it, even on the busiest night.' },
    ],
  },
  {
    id: 'fdp-approach',
    title: 'Approaching Tables & Reading Timing',
    desc: 'The art of arriving at exactly the right moment — and leaving gracefully.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-approach',
    learn: [
      { type: 'intro', text: 'Picture a table of four mid-conversation. One guest is finishing a story, the others are leaning in, laughter building. A weaker server walks straight into the middle of it and breaks the moment to recite the specials. A fine dining professional reads the table from a few steps away, lets the story land, and arrives in the breath that follows — welcomed, not intrusive. Knowing what to say is only half the craft. Knowing when to say it, and when to wait, is what separates polished service from interruption.' },
      { type: 'steps', title: 'The approach, step by step', items: [
        { num: 1, title: 'The three-second read', body: 'Before you reach the table, take three seconds to read it. Are they mid-conversation, mid-toast, mid-decision? Or open and ready? The read happens at a glance, from a step or two away, before you commit to speaking.', badge: 'Read first' },
        { num: 2, title: 'The angle of approach', body: 'Approach so you enter the guests\' field of vision gently, rather than appearing suddenly at a shoulder. Coming in slightly to the side gives them a moment to register you and lets the conversation pause naturally.' },
        { num: 3, title: 'When to speak', body: 'Speak in the natural gap — when a sentence finishes, when eyes lift toward you, when a guest sets something down. There is almost always a gap within a few seconds. Wait for it rather than forcing your way in.' },
        { num: 4, title: 'When to wait — or withdraw', body: 'If the moment is wrong — an emotional conversation, a toast, a serious discussion — hold a respectful step back, or withdraw smoothly and return shortly. A held plate is always better than a broken moment.' },
        { num: 5, title: 'Leaving gracefully', body: 'Close with a brief, warm line, a small nod, and turn away unhurried. Never back away awkwardly or linger waiting for thanks. The exit is as much a part of the interaction as the arrival.' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'The guest should never feel interrupted. Your timing should make every arrival feel like it was exactly what they wanted, exactly when they wanted it.' },
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Pause a step away to read the table, then arrive in the natural gap.', dont: 'Walking straight into the middle of a story to deliver your line.' },
        { do: 'Hold a delayed course one moment longer to let a toast finish.', dont: 'Cutting across a raised glass because the plate is ready now.' },
        { do: 'Withdraw smoothly and return when a tense conversation has passed.', dont: 'Hovering at the table\'s edge, visibly waiting for them to stop talking.' },
        { do: 'Close with a warm word, a nod, and an unhurried turn away.', dont: 'Backing away awkwardly or lingering for acknowledgment.' },
      ]},
    ],
    quiz: [
      { q: 'A table of four is mid-story, laughter building, as you approach with the specials. What does the professional do?', options: ['Deliver the specials now — the information is what matters.', 'Read the table from a step away, let the story land, and arrive in the breath that follows.', 'Interrupt politely with "sorry to break in."', 'Skip the table entirely and come back much later.'], correct: 1, explain: 'Knowing when to speak is half the craft. The professional reads the moment and arrives in the natural gap — welcomed, not intrusive.' },
      { q: 'What is the "three-second read"?', options: ['Counting to three before you speak at every table.', 'A glance from a step or two away to read whether the table is open or mid-moment before you commit to speaking.', 'The time it takes to recite the specials.', 'A rule that you may only spend three seconds per table.'], correct: 1, explain: 'The three-second read happens at a glance before you arrive — are they mid-conversation, mid-toast, or open and ready?' },
      { q: 'A course is ready, but the table is mid-toast with glasses raised. What do you do?', options: ['Deliver it now — the kitchen\'s timing comes first.', 'Hold the plate one moment longer and let the toast finish.', 'Set it down quietly between them during the toast.', 'Ask them to pause their toast so you can serve.'], correct: 1, explain: 'A held plate is always better than a broken moment. The right timing protects the guest\'s experience over the kitchen\'s convenience.' },
      { q: 'The moment is genuinely wrong — an emotional, serious conversation. What is the move?', options: ['Push through gently; the service still has to happen.', 'Hold a respectful step back, or withdraw smoothly and return shortly.', 'Hover at the edge of the table until they notice you.', 'Interrupt with an apology so they know you tried.'], correct: 1, explain: 'When the moment is wrong, withdraw smoothly and return. Hovering or interrupting both break the moment you are trying to protect.' },
      { q: 'Why does the lesson treat leaving the table as part of the craft?', options: ['It isn\'t — only the arrival and the order matter.', 'The exit shapes the impression too; a warm close and an unhurried turn matter as much as the arrival.', 'Because guests grade you on your exit.', 'Because you must always wait for the guest to thank you first.'], correct: 1, explain: 'The exit is as much a part of the interaction as the arrival. Close warmly, nod, and turn away unhurried — never linger or back away awkwardly.' },
    ],
  },
  {
    id: 'fdp-invisible',
    title: 'The Art of Invisible Service',
    desc: 'The highest service is the kind a guest never notices happening.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-invisible',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'The finest service is invisible. The guest\'s glass is always full, the table always clear — and they never once saw you do it.' },
      { type: 'intro', text: 'There is a level of service above attentive: invisible. The water is refilled without a pause in conversation. The finished plate disappears between sentences. The next course arrives as if it simply materialized. The guest enjoys an effortless evening and never registers the dozens of small movements that made it so. Invisible service is not about hiding — it is about moving with such timing and economy that your care is felt everywhere and noticed nowhere. It is the truest expression of the fine dining craft.' },
      { type: 'principles', items: [
        { num: 1, title: 'Clear in the gaps', body: 'Clear and reset between conversational beats, not across them. Wait for the natural lull — a pause, a glance away — and remove plates quietly from the right, without asking the table to stop and acknowledge you.' },
        { num: 2, title: 'Refill before empty, without interrupting', body: 'Watch the water and wine line from across the room. Top up before a glass runs low, approaching from the side, pouring smoothly, withdrawing — all without breaking the flow of the table\'s conversation.' },
        { num: 3, title: 'Move with purpose', body: 'Every trip carries intent. You arrive knowing exactly what you will do, do it in one smooth motion, and leave. No hovering, no second-guessing, no return trips for what you could have brought the first time.' },
        { num: 4, title: 'Anticipate, don\'t react', body: 'Invisible service is built on anticipation. The cleared plate, the refilled glass, the fresh cutlery for the next course — all arrive before the guest thinks to want them. A need a guest has to voice is a need you noticed too late.' },
      ]},
      { type: 'tip-list', title: 'Invisible-service techniques to master', items: [
        'Read glass levels from across the room so you never approach just to check.',
        'Clear from the right, quietly, during a natural pause in conversation.',
        'Carry the next course\'s cutlery with you so the table is set before the plate lands.',
        'Pour wine and water with a steady hand and a clean withdrawal — no clinking, no fuss.',
        'Plan each trip so one smooth pass replaces three hesitant ones.',
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Refill a glass from the side during a lull and withdraw without a word.', dont: 'Interrupting the table to ask "more water?" every few minutes.' },
        { do: 'Clear a finished plate quietly in the gap between conversation.', dont: 'Reaching across a guest mid-sentence and making them pause for you.' },
        { do: 'Arrive at the table knowing exactly what you will do, then do it in one motion.', dont: 'Hovering nearby, deciding what to handle while the guests feel watched.' },
        { do: 'Set the next course\'s cutlery before the plate arrives.', dont: 'Returning three separate times for cutlery, water, and the plate.' },
      ]},
    ],
    quiz: [
      { q: 'What does "invisible service" actually mean?', options: ['Staying out of sight and letting guests fend for themselves.', 'Moving with such timing and economy that your care is felt everywhere and noticed nowhere.', 'Serving as quickly as possible to minimize contact.', 'Only approaching the table when a guest signals you.'], correct: 1, explain: 'Invisible service is care that is felt everywhere and noticed nowhere — the glass stays full and the table clear, yet the guest never sees you do it.' },
      { q: 'When should you clear a finished plate from a fine dining table?', options: ['The instant the guest puts down their fork, mid-sentence if needed.', 'In the natural lull between conversational beats, quietly and from the right.', 'Only once you have asked the table if they are finished.', 'At the end of the meal, all at once.'], correct: 1, explain: 'Clear in the gaps, not across them — wait for a natural pause and remove plates quietly without making the table stop to acknowledge you.' },
      { q: 'How should you handle water and wine refills invisibly?', options: ['Ask "more water?" each time you pass so the guest stays in control.', 'Watch the line from across the room and top up before empty, from the side, without breaking the conversation.', 'Wait until a glass is completely empty so you don\'t over-pour.', 'Leave the bottle on the table for guests to pour themselves.'], correct: 1, explain: 'Anticipate the refill and deliver it smoothly from the side, withdrawing without interrupting — the guest enjoys a full glass and never registers how.' },
      { q: 'What does "move with purpose" mean for invisible service?', options: ['Walk as fast as you can between tables.', 'Arrive knowing exactly what you will do, do it in one smooth motion, and leave — no hovering or return trips.', 'Only move when a guest is watching.', 'Take the longest route so you can observe more tables.'], correct: 1, explain: 'Every trip carries intent. You arrive knowing your task, do it in one motion, and leave — eliminating hovering and wasted return trips.' },
      { q: 'A guest has to ask you for more bread. By the standard of invisible service, what does that tell you?', options: ['Nothing — answering requests is the job.', 'You noticed the need too late; invisible service anticipates before the guest thinks to ask.', 'The guest is being demanding.', 'The kitchen should have sent more bread automatically.'], correct: 1, explain: 'A need a guest has to voice is a need you noticed too late. Invisible service is built on anticipation, not reaction.' },
    ],
  },
];

// ─── FINE DINING PHASE 1 · MODULE 3: FINE DINING ETIQUETTE ───

const fineDiningEtiquetteLessons: Lesson[] = [
  {
    id: 'fde-napkin-service',
    title: 'Napkin Service & Placement',
    desc: 'The first touch of the meal — and a quiet measure of the whole house.',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-napkin',
    learn: [
      { type: 'intro', text: 'The napkin is the first thing you handle for a guest after they sit down. How you handle it sets the tone for the whole meal. A napkin placed with care says the evening is in good hands. A napkin thrown across the table, or left for the guest to deal with, says the opposite. None of this is hard. It is a few small, careful movements, done the same way every time. Learn them until they feel natural, and the napkin becomes one more place where your care is quietly felt.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'You place the napkin for the guest. You refresh it when they leave the table. You never leave them to handle it themselves.' },
      { type: 'steps', title: 'Napkin service, moment by moment', items: [
        { num: 1, title: 'On seating', body: 'Once the guest is seated, step in from the right. Lift the napkin from the setting, open it in one smooth motion, and lay it gently across their lap. With a single guest, you may simply hand it to them. Move calmly, and never make a fuss of it.', badge: 'Seating' },
        { num: 2, title: 'When a guest steps away', body: 'The moment a guest stands to leave the table, take their napkin. Fold it loosely, or replace it with a fresh one, and lay it to the left of the setting, ready for when they come back. Never leave a crumpled napkin on the chair or table.', badge: 'Stepping away' },
        { num: 3, title: 'If a napkin is dropped', body: 'A dropped napkin never goes back to the guest. Quietly pick it up from the floor and bring a fresh one. Hand it over without a word, so the guest never feels they caused a problem.', badge: 'Dropped' },
        { num: 4, title: 'At the end of the meal', body: 'When the guest leaves, clear the napkin with the rest of the setting. Never bundle it up at the table in front of them. The table goes back to perfect the moment they leave it.', badge: 'Departure' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Open the napkin and lay it across the lap in one calm, smooth motion.', dont: 'Shaking it open loudly or fumbling the fold in front of the guest.' },
        { do: 'Refold or replace the napkin neatly when a guest steps away.', dont: 'Leaving a crumpled napkin on the chair or table.' },
        { do: 'Bring a fresh napkin, quietly, when one is dropped.', dont: 'Picking the dropped napkin off the floor and handing it back.' },
        { do: 'Come in from the right and work without crowding the guest.', dont: 'Reaching across the guest or hovering over their shoulder.' },
      ]},
      { type: 'tip-list', title: 'Five napkin habits to make automatic', items: [
        'Seat the guest first; the napkin comes after, never before.',
        'Keep the motion quiet — never snap the napkin open at the table.',
        'When a guest stands up, reset their napkin before they have crossed the room.',
        'Always keep a fresh napkin within reach for a dropped or dirty one.',
        'A dropped napkin goes to the laundry, never back to the guest.',
      ]},
    ],
    quiz: [
      { q: 'A guest has just sat down. What is the correct napkin service?', options: ['Leave the napkin folded so they can place it themselves.', 'Step in from the right, open it smoothly, and lay it gently across their lap.', 'Shake it open over the table and drape it across the plate.', 'Wait until the first course arrives, then hand it to them.'], correct: 1, explain: 'Once the guest is seated, open the napkin in one calm motion and lay it across the lap from the right. You place it for the guest — you do not leave them to handle it.' },
      { q: 'A guest stands up to leave the table during the meal. What do you do with their napkin?', options: ['Leave it where it fell so you don\'t disturb their place.', 'Take it, fold it loosely or replace it, and set it to the left of the setting.', 'Drape it over the back of their chair.', 'Take it away until they return.'], correct: 1, explain: 'When a guest steps away, fold or replace the napkin and set it neatly by the setting, ready for their return. Never leave it crumpled on the chair or table.' },
      { q: 'A guest drops their napkin on the floor. What is the correct response?', options: ['Pick it up and hand it straight back to them.', 'Leave it — pointing it out would embarrass them.', 'Quietly remove it and bring a fresh one without a word.', 'Ask the guest whether they would like a new one.'], correct: 2, explain: 'A dropped napkin never goes back. You remove it quietly and bring a fresh one without a word, so the guest never feels they caused a problem.' },
      { q: 'At the end of the meal, how is the napkin handled?', options: ['Bundled up and left on the table for the next reset.', 'Folded neatly and left at the place for the guest to take.', 'Cleared with the rest of the setting once the guest leaves, never bundled up in front of them.', 'Handed to the guest as they leave.'], correct: 2, explain: 'The napkin is cleared with the setting after the guest leaves. The table goes back to perfect the moment they leave — nothing is bundled up in front of them.' },
      { q: 'Why does the way you handle the napkin matter so much?', options: ['It doesn\'t — only the food and wine service count.', 'It is the first thing you handle for the seated guest, so it sets the tone for the whole meal.', 'It only matters if the guest asks about it.', 'It matters only for hygiene.'], correct: 1, explain: 'The napkin is the first thing you handle once a guest sits down. Handled with care, it quietly shows that the whole evening is in good hands.' },
    ],
  },
  {
    id: 'fde-service-direction',
    title: 'Service Direction & Order of Precedence',
    desc: 'Who is served first, from which side, and how you read the host.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-service-direction',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Serve from the left. Clear from the right. Pour from the right. And serve guests in the right order — never just going around the table.' },
      { type: 'intro', text: 'Fine dining service follows a set order. A table notices the difference between a server who follows it and one who just works around the table clockwise. There is an order to who is served, a side for each task, and a quiet rhythm to it all. Above all these rules sits one skill: reading the host. The host is the person who booked the table and is looking after the guests. They set the pace, and a good server watches them for cues all through the meal.' },
      { type: 'principles', items: [
        { num: 1, title: 'The order of serving', body: 'Serve ladies first, then gentlemen, then the host last. If some guests are clearly older or more senior, honour them first within that order. The host is served last on purpose — it shows that their guests were cared for before them.' },
        { num: 2, title: 'Serve from the left', body: 'Place plated food from the guest\'s left side, with your left hand when you can, so you never reach across them. Set the plate down quietly, with any logo or main part of the dish squared to the guest.' },
        { num: 3, title: 'Clear from the right', body: 'Take finished plates and glasses away from the right, so your arm never crosses in front of the guest as you leave. Left to serve, right to clear — the two never cross.' },
        { num: 4, title: 'Pour from the right', body: 'Pour water and wine from the right, because the glasses sit to the upper right of the setting. Reach the glass without lifting it from the table, pour, and step back cleanly.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Serve the ladies first, then the gentlemen, then the host.', dont: 'Starting with whoever is nearest and going around the table clockwise.' },
        { do: 'Place each plate from the left and clear each from the right.', dont: 'Reaching across one guest to serve or clear for another.' },
        { do: 'Pour wine from the right without lifting the glass off the table.', dont: 'Picking up the guest\'s glass to pour, or pouring across the setting.' },
        { do: 'Look to the host for a nod before pouring more wine or starting the next course.', dont: 'Topping up glasses or sending courses without reading the host\'s cues.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'When the setting won\'t allow it', text: 'Sometimes a tight bench seat or a guest against a wall makes the correct side impossible. When that happens, choose the side that lets you avoid reaching across the guest. Do it smoothly, and never make the change obvious. The rule — never cross the guest — matters more than the side.' },
      { type: 'tip-list', title: 'Five serving-order habits to build now', items: [
        'Spot the host the moment the table is seated, and watch them all through the meal.',
        'Default order: ladies, then gentlemen, then the host last.',
        'Left to serve, right to clear — repeat it until it is automatic.',
        'Glasses sit on the right, so water and wine are always poured from the right.',
        'Before refilling or starting a course, look to the host for the quiet nod.',
      ]},
    ],
    quiz: [
      { q: 'In what order are guests served at a fine dining table?', options: ['Whoever is closest first, then around the table.', 'Ladies first, then gentlemen, then the host last.', 'The host first, as they are paying.', 'Oldest to youngest, nothing else.'], correct: 1, explain: 'The order is ladies first, then gentlemen, then the host last. Serving the host last shows their guests were cared for before them.' },
      { q: 'From which side do you place plated food, and from which side do you clear?', options: ['Serve from the right, clear from the left.', 'Serve and clear both from the left.', 'Serve from the left, clear from the right.', 'Always from whichever side is closer.'], correct: 2, explain: 'Serve from the left, clear from the right. This way your arm never crosses in front of the guest.' },
      { q: 'Where do you pour wine and water from, and why?', options: ['From the left, to match the food service.', 'From the right, because the glasses sit to the upper right of the setting.', 'From wherever you can reach the glass most easily.', 'From the right, after lifting the glass off the table.'], correct: 1, explain: 'Glasses sit to the upper right of the setting, so water and wine are poured from the right — reaching the glass without lifting it from the table.' },
      { q: 'Why is reading the host called the skill "above the rules"?', options: ['Because the host decides who sits where.', 'Because the host sets the pace of the meal, and a good server takes cues from them all through it.', 'Because only the host may ask for more wine.', 'Because the host must approve each course in person.'], correct: 1, explain: 'The host sets the pace of the table. Reading their cues — a nod for more wine, a readiness for the next course — matters more than the fixed rules of service.' },
      { q: 'A guest is seated tight against a wall, so the correct side is impossible. What do you do?', options: ['Insist on the correct side and ask the guest to move.', 'Choose the side that avoids reaching across the guest, do it smoothly, and don\'t make it obvious.', 'Skip that guest and serve them last from any angle.', 'Reach across the guest quickly to keep the rule.'], correct: 1, explain: 'The rule — never reach across the guest — matters more than the side. When the setting won\'t allow the normal way, adapt smoothly so no one notices.' },
    ],
  },
  {
    id: 'fde-table-conduct',
    title: 'Conduct at the Table',
    desc: 'The small disciplines that keep service elegant — and the habits that break it.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-conduct',
    learn: [
      { type: 'intro', text: 'Most of what makes service feel refined happens in small moments at the table — the reach you did not make, the plates you did not stack, the polite phrase you chose over the casual one. These are habits you build, not instincts you are born with. Under pressure, the easy thing is to reach across, to stack plates as you clear, to ask "are you still working on that?" Fine dining asks you to hold the higher standard exactly when it is hardest, because that is when the guest is watching most closely.' },
      { type: 'steps', title: 'The habits that protect the table', items: [
        { num: 1, title: 'Never reach across a guest', body: 'Reaching across a guest to place or clear puts your arm in their space and breaks the calm of the table. Always move around to the correct side instead. If the layout truly makes it impossible, a quiet "excuse me, may I?" comes first.', badge: 'Space' },
        { num: 2, title: 'Never stack plates at the table', body: 'Scraping and stacking plates in front of guests turns fine service into clearing-up. Clear quietly, carry only what you can handle well, and do the stacking and scraping out of sight, never at the table.', badge: 'Clearing' },
        { num: 3, title: 'Never scrape or sort in view', body: 'Anything that looks like cleaning up — scraping food, sorting cutlery, brushing crumbs into your hand quickly — belongs out of the guest\'s sight. The table should always look cared for, never cleaned up after.', badge: 'Discretion' },
        { num: 4, title: 'Choose the polite phrase', body: 'Say "May I clear this for you?" instead of "Are you still working on that?" "Working on it" makes the meal sound like a job. "May I clear this" makes it a courtesy. The words you reach for under pressure show your standard.', badge: 'Language' },
      ]},
      { type: 'callout', tone: 'warn', label: 'The phrase that gives you away', text: '"Are you still working on that?" is the most common sign of casual-level service. It treats the meal as work and rushes the guest. "May I clear this for you?" — or simply reading the cutlery and clearing in a quiet moment — keeps the moment elegant.' },
      { type: 'do-dont', title: 'Handling a complaint with grace', items: [
        { do: 'Listen fully, say sorry sincerely, and fix it quietly and quickly.', dont: 'Interrupting, getting defensive, or explaining why it happened.' },
        { do: 'Take responsibility for the house — "I\'m so sorry, let me put that right."', dont: 'Blaming the kitchen, a colleague, or the guest for the mistake.' },
        { do: 'Move around the table to clear and re-set, calmly and from the correct side.', dont: 'Reaching across the guest or stacking the wrong plates in front of them.' },
        { do: 'Come back quietly to check the fix made them happy.', dont: 'Making a show of the fix or drawing the table\'s attention to it.' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Elegance is about holding back: never reach across, never stack at the table, never scrape in view, and never let a casual phrase rush a guest. Hold the standard hardest when it is hardest to.' },
    ],
    quiz: [
      { q: 'You need to place a dish, but the guest in the way makes the correct side awkward. What is the right move?', options: ['Reach across the guest quickly — it\'s only a moment.', 'Move around to the correct side; if it\'s truly impossible, a quiet "excuse me, may I?" comes first.', 'Hand the plate to the guest and ask them to pass it.', 'Set it at the nearest open spot and let them slide it over.'], correct: 1, explain: 'You never reach across a guest. Move to the correct side. Only if it is truly impossible do you ask "excuse me, may I?" before reaching.' },
      { q: 'Why should you never stack plates at the table?', options: ['It\'s faster to carry them one at a time anyway.', 'Scraping and stacking in front of guests turns fine service into clearing-up — it belongs out of sight.', 'Stacked plates break more easily.', 'Guests find it unhygienic.'], correct: 1, explain: 'Stacking and scraping at the table makes service look like clearing-up. Clear quietly and do the stacking and scraping out of the guest\'s sight.' },
      { q: 'What is wrong with asking "Are you still working on that?"', options: ['Nothing — it\'s a perfectly polite way to check.', 'It makes the meal sound like a job and rushes the guest; "May I clear this for you?" makes it a courtesy.', 'It\'s too formal for most guests.', 'It should be asked only of the host, not other guests.'], correct: 1, explain: '"Working on it" treats the meal as work and rushes the guest. "May I clear this for you?" keeps the moment a courtesy — the words you choose show your standard.' },
      { q: 'A guest makes a real complaint about their dish. What is the graceful response?', options: ['Explain exactly why the kitchen made the mistake.', 'Listen fully, say sorry sincerely, take responsibility for the house, and fix it quietly and quickly.', 'Apologize again and again and hover until they\'re happy.', 'Offer a discount right away to close the matter.'], correct: 1, explain: 'Listen, say sorry, take responsibility for the house, and put it right quietly — never interrupt, get defensive, or blame the kitchen or a colleague.' },
      { q: 'The lesson says these small moments are "habits you build, not instincts." What does that mean for you?', options: ['They come naturally once you\'ve served a few tables.', 'Under pressure the easy thing is the casual one, so you must hold the higher standard exactly when it\'s hardest.', 'They only matter when a manager is watching.', 'They are optional extras once the basics are covered.'], correct: 1, explain: 'Under pressure the easy thing is to reach across, stack, or rush. Refined conduct is a habit you hold hardest when it is hardest — because that\'s when guests watch most closely.' },
    ],
  },
  {
    id: 'fde-formal-settings',
    title: 'Reading & Respecting Formal Settings',
    desc: 'The place setting as a map — and the silent signals it sends back to you.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-settings',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'A formal setting works both ways. It guides the guest through the meal, and it tells you — through where their cutlery sits — exactly where they are in it.' },
      { type: 'intro', text: 'A formal place setting can look scary — rows of forks, a row of glasses, knives and spoons laid out like a ceremony. In truth, it follows a simple, clear logic. Once you understand it, you can guide a guest through it with quiet confidence and read where they are in the meal without asking a single question. The setting is not just decoration; it is a language. Your job is to know it well, so the guest never has to.' },
      { type: 'steps', title: 'Reading the place setting', items: [
        { num: 1, title: 'Cutlery is used outside-in', body: 'Cutlery is used from the outside in, one pair per course. The outer fork and knife are for the first course, then you work inward with each course that follows. A guest who is unsure where to start need only begin at the outside — and you can tell them exactly that.', badge: 'Cutlery' },
        { num: 2, title: 'Forks left, knives and spoons right', body: 'Forks sit to the left of the plate, knives and spoons to the right, with the knife blades turned toward the plate. Dessert cutlery often sits flat above the plate. The bread plate sits to the upper left, and the glasses to the upper right.', badge: 'Layout' },
        { num: 3, title: 'Change cutlery between courses', body: 'As each course is cleared, the used cutlery goes with it, and fresh cutlery for the next course is set if it is not there already. The guest should always find the right tools waiting — never have to reuse one or look for it.', badge: 'Between courses' },
        { num: 4, title: 'Hold glassware correctly', body: 'Hold glasses by the stem, never the bowl — a warm hand clouds the glass and warms the wine. When you set, move, or clear glassware, take the stem or the base, and keep your fingers off the rim.', badge: 'Glassware' },
      ]},
      { type: 'principles', items: [
        { num: 1, title: 'The "still eating" signal', body: 'Cutlery resting apart — fork and knife angled open on the plate, often like an upside-down V — means the guest is pausing, not finished. The plate stays. Clearing it now would interrupt them mid-meal.' },
        { num: 2, title: 'The "finished" signal', body: 'Cutlery placed together — fork and knife laid side by side, usually across the plate around the four-o\'clock position — means the guest is done. That is your cue to clear, in the next natural pause.' },
        { num: 3, title: 'Read before you ask', body: 'These silent signals exist so the guest never has to say they are finished. Read the cutlery first, and only ask "may I?" when the signal is truly unclear. That is the mark of a server who knows the language.' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Tell an unsure guest to simply work from the outside in.', dont: 'Letting a guest feel lost in front of the setting without quietly helping them.' },
        { do: 'Read the cutlery position to know whether to clear or wait.', dont: 'Asking "are you finished?" when the cutlery side by side already tells you.' },
        { do: 'Set fresh cutlery for each course as the last one is cleared.', dont: 'Leaving the guest to reuse a knife or look for the right fork.' },
        { do: 'Lift and place every glass by the stem or base.', dont: 'Grabbing glasses by the bowl and leaving prints on the rim.' },
      ]},
      { type: 'tip-list', title: 'Five habits to build now', items: [
        'Outside-in: the outer cutlery is always for the next course.',
        'A glance at the plate replaces a question — read the cutlery before you approach.',
        'Fork and knife apart means wait; side by side means clear.',
        'Set the next course\'s cutlery before its plate arrives.',
        'Hold every glass by the stem or base, never the bowl or rim.',
      ]},
    ],
    quiz: [
      { q: 'A guest is unsure which fork to use first. What do you tell them?', options: ['Whichever feels most comfortable to them.', 'Work from the outside in — the outer cutlery is for the first course.', 'Always start with the fork nearest the plate.', 'Wait for you to hand them the right one each course.'], correct: 1, explain: 'Cutlery is used outside-in, one pair per course. A guest need only start at the outside, and you can tell them exactly that.' },
      { q: 'A guest\'s fork and knife are resting apart, angled open on the plate. What does this mean?', options: ['They are finished — clear the plate.', 'They are pausing, not finished — the plate stays.', 'They want the next course right away.', 'They are unhappy with the dish.'], correct: 1, explain: 'Cutlery resting apart means the guest is pausing, not finished. Clearing now would interrupt them mid-meal — the plate stays.' },
      { q: 'A guest has laid their fork and knife together, side by side across the plate. What is your cue?', options: ['Leave the plate until they ask you to take it.', 'They are finished — clear in the next natural pause.', 'They want to keep the cutlery for the next course.', 'They are signalling a complaint.'], correct: 1, explain: 'Cutlery side by side across the plate means the guest is finished. That is your cue to clear in the next natural pause.' },
      { q: 'What is the correct way to hold glassware?', options: ['By the bowl, for a firm grip.', 'By the stem or base, never the bowl, so you don\'t cloud the glass or warm the wine.', 'By the rim, lifting it cleanly from the top.', 'However is fastest during a busy service.'], correct: 1, explain: 'Hold glasses by the stem or base. A warm hand on the bowl clouds the glass and warms the wine, and fingers on the rim leave prints.' },
      { q: 'Why does the lesson call the place setting "a language"?', options: ['Because each piece is labelled for the guest.', 'Because it guides the guest through the meal and tells you, through where the cutlery sits, exactly where they are in it.', 'Because guests are expected to learn it before they arrive.', 'Because the setting changes every night to show the menu.'], correct: 1, explain: 'The setting works both ways: it maps the meal for the guest and shows their progress back to you. Your job is to know it well so the guest never has to.' },
    ],
  },
];

// ─── FINE DINING PHASE 1 · MODULE 4: TABLE SETUP & DINING ROOM STANDARDS ─

const fineDiningTableSetupLessons: Lesson[] = [
  {
    id: 'fdt-mise-en-place',
    title: 'Mise en Place — The Foundation',
    desc: 'Everything in its place, long before the first guest sits down.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-mise-en-place',
    learn: [
      { type: 'intro', text: 'Mise en place means "everything in its place." It is the quiet work that happens before a single guest arrives, and it is where a fine dining evening is quietly won or lost. A room set to standard carries the service with ease. A room set carelessly fights you all night.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'By the time the first guest sits down, every detail is already perfect. The setup is not getting ready for the standard — the setup is the standard.' },
      { type: 'steps', title: 'Setting a cover, piece by piece', items: [
        { num: 1, title: 'The clothed table', body: 'Start with the base: a pressed, spotless cloth laid square to the table, dropping the same distance on all four sides. The cloth is the surface everything else sits on. A crease or an uneven edge spoils every detail you place on top of it.', badge: 'Linen' },
        { num: 2, title: 'The cover position', body: 'The charger or show plate anchors the cover. Centre it to the chair, with the same gap from the table edge at every seat. Space the covers evenly around the table, so the whole setting looks like one careful piece, not a set of separate places.', badge: 'Anchor' },
        { num: 3, title: 'Cutlery, outside-in', body: 'Lay the cutlery in the order the courses will be used, working outside-in, forks to the left and knives and spoons to the right, blades turned inward. Every handle sits the same distance — about a thumb\'s width — from the table edge, lined up with its neighbours.', badge: 'Cutlery' },
        { num: 4, title: 'Glassware', body: 'Set the glasses to the upper right of the cover, polished to a clear shine and held only by the stem or base. Place them in the same order and angle at every cover, so the room looks even when you look down its length.', badge: 'Glass' },
        { num: 5, title: 'The napkin', body: 'Fold each napkin to the one house style and place it the same way at every cover. Sameness is the point. Twelve napkins folded the same way show a house in control of its details; twelve slightly different ones show the opposite.', badge: 'Napkin' },
        { num: 6, title: 'Salt, pepper & the small things', body: 'Place salt, pepper, and any shared items to the house plan, wipe them clean, and check they are full before service — never top them up in front of guests. A blocked or half-empty pot found mid-service is a setup mistake, not a service one.', badge: 'Condiments' },
        { num: 7, title: 'Candle & centrepiece', body: 'Keep the candle clean and light it at the right moment. Keep the centrepiece low enough that guests can see one another across the table. Nothing on the table should make a guest lean around it to meet the eye of the person opposite.', badge: 'Finish' },
      ]},
      { type: 'tip-list', title: 'Five setup habits to make automatic', items: [
        'Check with your eye at every cover — guests feel good alignment even when they never notice it.',
        'A thumb\'s width from the table edge for every handle and every base — the same, everywhere.',
        'Polish every glass and every piece of cutlery before it touches the table, never after.',
        'Check salt, pepper, and pots are full and clean before service — never during.',
        'When the table is set, sit or crouch in the guest\'s chair and look at it from their eye level, not yours.',
      ]},
    ],
    quiz: [
      { q: 'What does "mise en place" mean, and why does it matter so much in fine dining?', options: ['It is the kitchen\'s job, not the floor\'s.', '"Everything in its place" — the room is set to standard before any guest arrives, so the standard is already met when service begins.', 'It means setting up as fast as possible before doors open.', 'It only matters on fully booked nights.'], correct: 1, explain: 'Mise en place means "everything in its place." A room set to standard carries the evening with ease — the setup is not getting ready for the standard, it is the standard.' },
      { q: 'How is cutlery laid at a cover?', options: ['In any order, as long as forks and knives are together.', 'Outside-in in course order, forks left and knives and spoons right, each handle the same distance from the table edge.', 'Inside-out, starting from the plate.', 'Bunched close to the plate to save space.'], correct: 1, explain: 'Cutlery is laid outside-in in the order courses are used, forks left, knives and spoons right, with every handle the same distance — about a thumb\'s width — from the edge.' },
      { q: 'Where is glassware placed at the cover, and how is it held?', options: ['To the upper left, held by the bowl.', 'To the upper right, polished, and held only by the stem or base.', 'Directly above the plate, held by the rim.', 'Wherever there is room once the plates are down.'], correct: 1, explain: 'Glasses sit to the upper right of the cover, polished to a clear shine and held only by the stem or base — never the bowl or rim.' },
      { q: 'What is the rule for a candle or centrepiece on a fine dining table?', options: ['The taller and more dramatic, the better.', 'It stays low enough that guests can see one another across the table, and the candle is clean and lit at the right moment.', 'It should sit a little off-centre to look interesting.', 'It only matters for special occasions.'], correct: 1, explain: 'The centrepiece stays low enough that no guest has to lean around it to meet the eye of the person opposite — nothing on the table should block the guests from each other.' },
      { q: 'You\'ve finished setting a table. What is the last check the lesson recommends?', options: ['Ask a colleague to glance at it as they pass.', 'Look at the finished table from the guest\'s chair and eye level, not from where you stand.', 'Photograph it for the pre-service brief.', 'Move on — if each piece is placed, the table is done.'], correct: 1, explain: 'Sit or crouch in the guest\'s chair and look at the table from their eye level. A setting that looks right when you stand over it can look quite different from where the guest sits.' },
    ],
  },
  {
    id: 'fdt-linen-glassware',
    title: 'Linen & Glassware Standards',
    desc: 'The white field and the moving light — the two surfaces a guest never stops seeing.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-linen',
    learn: [
      { type: 'do-dont', title: 'The difference a guest feels', items: [
        { do: 'Lay a crisp, spotless cloth with the same even drop on every side.', dont: 'A cloth with a crease, a faint stain, or an edge hanging longer on one side.' },
        { do: 'Bring glasses polished to a clear shine, lifted only by the stem.', dont: 'Glasses with water spots, lip marks, or fingerprints on the bowl.' },
        { do: 'Re-lay the table the moment the cloth is marked — quietly and fully.', dont: 'Leaving a small stain in place because the cloth is "mostly clean."' },
        { do: 'Fold every napkin to the same house style, edges sharp and the same.', dont: 'Napkins folded loosely, each one a little different from the last.' },
      ]},
      { type: 'intro', text: 'Linen and glassware are the two surfaces a guest\'s eye comes back to all evening — the white of the cloth and the light moving through a glass. Both show every flaw: a single water spot or a small crease stands out across a candlelit room. Keeping their standard is not fussiness. It is the clearest sign the house gives of how closely it cares for detail.' },
      { type: 'principles', items: [
        { num: 1, title: 'The cloth', body: 'Pressed, spotless, and laid square, with an even drop on all sides. One clean cloth — never a patched or doubled layer to hide a flaw underneath. The cloth sets the tone of the whole table before a single plate is placed.' },
        { num: 2, title: 'The napkin', body: 'Folded to one house style, the same way every time, and handled with clean hands. The fold is the same across every cover, so the room looks like one careful setting rather than many separate hands.' },
        { num: 3, title: 'Polishing glassware', body: 'Polish each glass over steam with a clean cloth. Hold it by the base, work up the bowl without touching the rim, and check it against the light before it leaves your hand. A glass goes to the table perfect, or it does not go at all.' },
        { num: 4, title: 'Check it before it travels', body: 'Check every piece of linen and glassware away from the table. The table is the wrong place to find a chip, a spot, or a mark. By the time it reaches the guest, it has already passed the check.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'When to re-lay', text: 'The moment a cloth is marked — a wine spill, a stain, a tear — you replace it, not ignore it. With guests seated, cover the mark with a clean napkin first so it leaves their sight at once, then change the cloth properly at the next natural break. A flaw left in place tells the guest the standard slipped; a calm, unhurried fix tells them it holds.' },
      { type: 'tip-list', title: 'Five linen & glass habits to build now', items: [
        'Lift every glass by the stem or base — a hand on the bowl is a fingerprint waiting to show.',
        'Polish glassware over steam and check it against the light before it ever leaves your hand.',
        'Fold each napkin to the exact same house style, every single time.',
        'Check the drop is even on all sides before service — an uneven edge is the first thing a sharp eye catches.',
        'A mark or spill on the cloth means re-lay — there is no "mostly clean" at this level.',
      ]},
    ],
    quiz: [
      { q: 'What is the correct way to clean and prepare a wine glass for the table?', options: ['Wipe it quickly by the bowl and set it down.', 'Polish it over steam holding the base, work up the bowl without touching the rim, and check it against the light first.', 'Hold it by the rim for control and breathe on it to clean it.', 'Only polish glasses for guests who order wine.'], correct: 1, explain: 'Polish over steam, hold by the base, never touch the rim, and check against the light. A glass goes to the table perfect, or it does not go at all.' },
      { q: 'A seated guest points out a small wine stain on the tablecloth during the meal. What is the correct response?', options: ['Tell them it\'s barely noticeable and leave it.', 'Cover the mark with a clean napkin so it leaves their sight, then re-lay the cloth properly at the next natural break.', 'Strip the whole table right away, mid-course, in front of them.', 'Say sorry and offer a discount to make up for it.'], correct: 1, explain: 'A marked cloth is replaced, not ignored. Cover it so it leaves their sight at once, then re-lay calmly at the natural break — a calm fix tells the guest the standard holds.' },
      { q: 'What is the standard for how a tablecloth is laid?', options: ['Pulled tight on the guests\' side, looser behind.', 'Pressed, spotless, laid square, with an even drop on all sides — one clean cloth, never a patched or doubled layer.', 'Whatever drop length the cloth happens to give.', 'Doubled up so spills don\'t reach the table.'], correct: 1, explain: 'The cloth is pressed, spotless, and square with an even drop on every side — a single clean cloth, never patched or doubled to hide a flaw underneath.' },
      { q: 'Why are napkins folded to one same style across every cover?', options: ['It\'s only for looks and not really important.', 'Sameness shows a house in control of its details; mismatched folds show the opposite.', 'So guests know which napkin is theirs.', 'It makes the napkins easier to count.'], correct: 1, explain: 'The fold is the same across every cover so the room looks like one careful setting. Matching folds show control of detail; different ones show it is missing.' },
      { q: 'Where should a chip, spot, or mark on glassware be found?', options: ['At the table, where the light is best for checking.', 'Away from the table, during the check — the table is the wrong place to find a flaw.', 'It doesn\'t matter where, as long as it\'s caught in the end.', 'By the guest, who can ask for a new one.'], correct: 1, explain: 'Every piece is checked away from the table. By the time glassware reaches the guest it has already passed the check — the table is never where a flaw is found.' },
    ],
  },
  {
    id: 'fdt-sideboard',
    title: 'The Sideboard & Service Station',
    desc: 'Yours to run, and invisible to the guest — the engine room of a smooth section.',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-sideboard',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'The sideboard is yours, and the guest never sees it. Everything service needs lives there; nothing the guest should never see does. A glance at it tells you the station is ready — and tells the guest nothing at all.' },
      { type: 'intro', text: 'Every smooth section has a sideboard — the service station where backup cutlery, clean linen, and the tools of service wait within arm\'s reach. Run well, it lets you reset a table or replace a dropped fork without leaving the room, and the guest never knows it is there. Run badly, it becomes a messy shelf of used plates and personal bits in full view — the one place where the feeling of effortless service quietly falls apart.' },
      { type: 'do-dont', title: 'What belongs — and what never does', items: [
        { do: 'Polished backup cutlery, clean napkins, and spare glasses, sorted and ready.', dont: 'Used plates or dirty glasses left sitting in the guest\'s sight.' },
        { do: 'Crumbers, clean service cloths, the wine list, and bill folders, neatly arranged.', dont: 'Personal items — phones, drinks, notebooks, keys — anywhere on the station.' },
        { do: 'Spare salt, pepper, and backups stocked out of sight, below or behind.', dont: 'Open food, rubbish, or anything that looks like clearing-up on show.' },
        { do: 'A surface tidy enough to find any item almost without looking.', dont: 'A messy top you have to dig through while a guest waits on you.' },
      ]},
      { type: 'steps', title: 'Keeping the station invisible', items: [
        { num: 1, title: 'Stock before service, never during', body: 'Stock it fully at the start of service, and top it up again at every quiet moment, so you are never digging through an empty station in the middle of a rush. The time to find you are out of fish forks is before service, not as a guest waits for one.', badge: 'Timing' },
        { num: 2, title: 'Clear it all the time', body: 'Used items go to the dish area on your next trip past — they never pile up on the sideboard. A well-run station empties as fast as it fills, so it never becomes a visible heap of the evening\'s work.', badge: 'Clearing' },
        { num: 3, title: 'Place it and screen it', body: 'Turn the working side of the station away from the room. Keep only clean, ready items on top; keep anything used or messy below, behind, or move it on at once. The guest\'s eye should slide past the sideboard without stopping.', badge: 'Placement' },
        { num: 4, title: 'Reset between seatings', body: 'Return the station to its starting state before the next guests arrive, so every service begins from the same standard. A station that gets messier with each seating is a section slowly losing its grip.', badge: 'Reset' },
      ]},
      { type: 'callout', tone: 'tip', label: 'The test', text: 'Look at your sideboard the way a guest at the nearest table would. If you can see anything that shows the work behind the service — a stacked plate, a phone, a smear, a pile of used napkins — the illusion has a crack in it. A station the guest never even notices is a station run exactly right.' },
    ],
    quiz: [
      { q: 'What belongs on the sideboard during service?', options: ['Whatever you happen to be holding at the time.', 'Polished backup cutlery, clean linen, spare glasses, and the tools of service — ready and sorted.', 'Used plates, so they\'re off the tables quickly.', 'Your phone, in case the manager needs to reach you.'], correct: 1, explain: 'The station holds everything service needs — backup cutlery, clean napkins, spare glasses, crumbers, service cloths — sorted and ready, and nothing the guest should never see.' },
      { q: 'When should the service station be stocked?', options: ['Whenever you notice it\'s running low, mid-service.', 'Fully before service, and topped up at every quiet moment — never dug through empty in the middle of a rush.', 'Only at the end of the night.', 'Once a guest asks for something you\'ve run out of.'], correct: 1, explain: 'Stock before service and at every quiet moment. The time to find you\'re out of an item is before service begins, never as a guest waits for it.' },
      { q: 'Where do personal items — your phone, a drink, your keys — belong during service?', options: ['Tucked quietly at the back of the sideboard.', 'Nowhere on the station — personal items are kept off it completely, out of sight.', 'On the station is fine as long as guests can\'t quite see them.', 'In an apron pocket on the station top.'], correct: 1, explain: 'Personal items never belong on the station. The sideboard holds only the tools of service — anything personal stays out of the room completely.' },
      { q: 'How should the sideboard be placed and screened?', options: ['Facing the room so guests can see how tidy you are.', 'Its working side turned away from the room, with only clean, ready items on top and anything used kept out of sight.', 'In the busiest sightline so you can reach it fastest.', 'It doesn\'t matter where it faces.'], correct: 1, explain: 'The working side turns away from the room. Only clean, ready items sit on top; anything used or messy is kept below, behind, or cleared at once — the guest\'s eye slides past it.' },
      { q: 'What is the "test" the lesson gives for a well-run sideboard?', options: ['Whether the manager approves it before service.', 'Look at it as a guest at the nearest table would — if you can see anything that shows the work of service, the illusion has a crack.', 'Whether everything is stacked as tightly as possible.', 'Whether it holds enough backup for the whole night.'], correct: 1, explain: 'Look at the station from the nearest guest\'s point of view. A stacked plate, a phone, or a pile of used napkins in their sight breaks the illusion — a station the guest never notices is one run right.' },
    ],
  },
  {
    id: 'fdt-room-flow',
    title: 'Dining Room Flow & Atmosphere',
    desc: 'The feeling of the room — tended quietly, all evening long.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-room-flow',
    learn: [
      { type: 'intro', text: 'A dining room has a feeling before it has anything else — the warmth of the light, the level of the music, the temperature of the air, the sense that someone is quietly looking after all of it. Guests rarely name these things, but they feel every one of them. The food and the service live inside this feeling, and a great room is cared for like an instrument: all the time, out of sight, and always for the guest\'s comfort. This is the work that never stops, from the first guest to the last.' },
      { type: 'principles', items: [
        { num: 1, title: 'Sound sits under the talk', body: 'Music belongs under the talk of the room, never over it. The test is simple: can a table talk easily without raising their voices? As the room fills and empties through the evening, the right level changes with it — what is perfect for a full room is too loud for a quiet one.' },
        { num: 2, title: 'Light softens as the evening does', body: 'Set the lighting to flatter, and soften it as the night goes on. A level that felt right at seven can feel harsh at nine. Keep the candles lit, no table in shadow, and no guest squinting against a glare. The room should feel warmer as it gets later, not brighter.' },
        { num: 3, title: 'Temperature you watch, not set and forget', body: 'A comfortable room goes unnoticed; a cold or stuffy one is all a guest can think about. Read the room as it really is — filling with people, warming through the evening — and respond to that, rather than trusting a setting you made hours ago.' },
        { num: 4, title: 'Atmosphere is felt as one thing', body: 'Guests do not feel sound, light, and warmth as separate things — they feel them as one impression of the room. A perfect plate served in a room that is too loud and too warm still lands as a poor evening. The parts only matter as they add up to the whole.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'Mind the dead zones', text: 'Every room has dead zones — the table by the kitchen door, the seat in the draught, the corner the light never quite reaches, the spot where the music drowns the talk. Guests seated there quietly get a poorer version of the evening unless someone notices. Walk your room and find these zones before service does, and give those tables a little more attention and care, never less.' },
      { type: 'steps', title: 'The fifteen-minute look around', items: [
        { num: 1, title: 'Pause and read the whole room', body: 'Every fifteen minutes, stop and take the room in as a guest would — the light, the sound, the temperature, the energy of the floor. This is a standing habit, not something you do only when a problem appears.', badge: 'Pause' },
        { num: 2, title: 'Check the levels', body: 'Is the music still under the talk? Has the light gone harsh as the sky outside got dark? Has the filling room grown warm? Catch each change and fix it before any guest would think to mention it.', badge: 'Adjust' },
        { num: 3, title: 'Look for what is missed', body: 'Look for the dead-zone table, the guest glancing around for someone, the candle that has burned out, the empty glass across the room. This is how you find the small things before they become the guest\'s problem.', badge: 'Notice' },
        { num: 4, title: 'Fix it quietly, then return to the floor', body: 'Make the small change — the dimmer, the temperature, the volume, the candle relit — and fold straight back into service, so the room is cared for without anyone ever seeing it done.', badge: 'Correct' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Bring the music down a little as the room empties and voices drop.', dont: 'Keeping a full-room level in a near-empty late-evening floor.' },
        { do: 'Soften the lighting as the evening gets dark so the room stays warm.', dont: 'Letting bright early-evening light leave a late table feeling exposed.' },
        { do: 'Notice a guest fanning themselves and ease the temperature before they ask.', dont: 'Waiting for a guest to complain that the room has grown warm.' },
        { do: 'Give the table by the kitchen door a little extra attention and warmth.', dont: 'Treating a dead-zone table as a worse seat and serving it like one.' },
      ]},
    ],
    quiz: [
      { q: 'What is the right level for music in a fine dining room?', options: ['Loud enough to fill any silence between tables.', 'Under the talk — a table should be able to talk easily without raising their voices.', 'A fixed level set once at the start of the night.', 'As quiet as possible until guests ask for more.'], correct: 1, explain: 'Music sits under the talk, never over it. The test is whether a table can talk easily without raising their voices — and the right level changes as the room fills and empties.' },
      { q: 'What is a "dead zone," and how should you handle the tables in one?', options: ['A table no one books — leave it unset.', 'A seat that gets a poorer version of the evening — by the kitchen, in a draught, in shadow — so you give it more attention and care, not less.', 'An area of the floor you keep guests out of.', 'A table kept for staff breaks.'], correct: 1, explain: 'Dead zones are seats that quietly get a poorer evening — by the kitchen door, in a draught, in shadow. You find them before service does and give those tables more attention, never less.' },
      { q: 'What is the fifteen-minute look around?', options: ['A timed walk to check every table has ordered.', 'A standing habit of pausing every fifteen minutes to read the whole room as a guest would — light, sound, temperature, energy — and fixing any change.', 'A fifteen-minute break for staff to reset.', 'A check you do only when the room feels off.'], correct: 1, explain: 'Every fifteen minutes you pause and read the room as a guest would, catch any change in light, sound, or temperature, look for what is missed, and fix it quietly — a habit, not a reaction.' },
      { q: 'A guest is quietly fanning themselves with the menu. What does the standard ask of you?', options: ['Wait until they actually say the room is too warm.', 'Read the signal and ease the temperature before they have to ask.', 'Offer them a glass of iced water and leave the room as it is.', 'Open a nearby window without checking how it affects other tables.'], correct: 1, explain: 'A comfortable room goes unnoticed; you respond to the room as it really is. Notice the guest fanning themselves and adjust the temperature before they ever have to mention it.' },
      { q: 'Why does the lesson say atmosphere is "felt as one thing"?', options: ['Because only the lighting really matters to guests.', 'Because guests feel sound, light, and warmth as one impression — a perfect plate in a too-loud, too-warm room still lands as a poor evening.', 'Because the parts can each be perfected and forgotten.', 'Because atmosphere is the kitchen\'s job, not the floor\'s.'], correct: 1, explain: 'Guests don\'t feel the parts separately — they feel the room as one thing. Even a perfect plate, served into a room that is too loud and too warm, still lands as a poor evening.' },
    ],
  },
];

// ─── RESERVED FOR FINE DINING PHASE 2 — ANTICIPATORY SERVICE ──
// These lessons (and their scenarios in scenarios.ts) are written and kept here
// for a future Fine Dining Phase 2 module. They are intentionally NOT referenced
// by any module in the CURRICULUM array below — do not delete them.

const fineDiningAnticipatoryLessons: Lesson[] = [
  {
    id: 'fda-reading-table',
    title: 'Reading the Table',
    desc: 'Guests tell you what they need without saying a word. Learn to read it.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-reading',
    learn: [
      { type: 'intro', text: 'The best fine dining staff seem to read minds. A guest looks up, and you are already there. The water is poured before the glass runs dry. But it is not magic — it is reading. Guests are always telling you what they need, even when they say nothing. They tell you with their eyes, their hands, and the small things they do at the table. Your job is to learn this quiet language and act on it before the guest has to ask.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'A guest should almost never have to ask you for anything. When they do, you read the table too late.' },
      { type: 'steps', title: 'The 15-second scan', items: [
        { num: 1, title: 'Make the scan a habit', body: 'Every time you pass through your section, take fifteen seconds to read it. Not a quick glance — a real look. Check every glass, every plate, every face. Do this on every single pass, until it becomes automatic and you no longer have to think about it.', badge: 'Habit' },
        { num: 2, title: 'Read the eyes', body: 'A guest looking around the room is searching for you. A guest looking down and relaxed is happy and content. Catch the searching look fast — meet it with a small nod so they know you are coming, then go to them.', badge: 'Eyes' },
        { num: 3, title: 'Read the hands and the plate', body: 'Cutlery placed together means finished. A hand resting near an empty glass means thirsty. A guest folding their napkin and sitting back is often ready to move on. The table shows you, if you watch for it.', badge: 'Hands' },
        { num: 4, title: 'Read the mood', body: 'Is the table leaning in and laughing, or quiet and serious? A lively table wants energy and may want to stay longer. A quiet table wants calm and space. Match your service to the mood you see in front of you.', badge: 'Mood' },
      ]},
      { type: 'principles', items: [
        { num: 1, title: 'Comfort comes first', body: 'Water, bread, the room temperature, a clear menu. These are the basics. A guest cannot enjoy anything else until these are right, so you handle them first, fast, and without being asked.' },
        { num: 2, title: 'Then clarity', body: 'A guest who is unsure what to order, or how the menu works, feels uneasy. Notice the puzzled look at the menu and offer gentle help before they have to ask for it.' },
        { num: 3, title: 'Then pace', body: 'Once the food is flowing, the main need becomes timing — the right gap between courses, the glass topped up, the table cleared. This is the longest part of the meal to read, and the most important.' },
        { num: 4, title: 'Then the close', body: 'Near the end, watch for the signs that the meal is winding down. A guest who is ready for the bill should never have to hunt for you to get it.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'Every table has its own rhythm', text: 'A couple on a date, a group of friends, a business lunch, a family with children — each one moves at a different speed and wants a different kind of attention. Read which kind of table you have early in the meal, and serve its rhythm, not your own.' },
    ],
    quiz: [
      { q: 'What is the 15-second scan?', options: ['A quick glance at your phone between tables.', 'A real, careful look at your whole section — every glass, plate, and face — on every single pass through it.', 'A check you do once at the start of service.', 'A timed sweep to see which tables have ordered.'], correct: 1, explain: 'The scan is a real look — not a glance — at every glass, plate, and face, done every time you pass through your section, until it becomes automatic.' },
      { q: 'A guest is looking around the room. What does it mean, and what do you do?', options: ['They are bored — bring the bill.', 'They are searching for you — meet their eye with a small nod so they know you are coming, then go to them.', 'They are admiring the room — leave them be.', 'Nothing — wait until they raise a hand.'], correct: 1, explain: 'A guest looking around is searching for you. Catch it fast, acknowledge them with a small nod so they feel seen, and go to them.' },
      { q: 'In the order that needs come in, what do you handle first?', options: ['The bill, so the table is ready to turn.', 'Comfort — water, bread, temperature, a clear menu — before anything else.', 'The wine recommendation.', 'A personal conversation to build rapport.'], correct: 1, explain: 'Comfort comes first. A guest cannot enjoy anything else until the basics are right, so you handle water, bread, temperature, and a clear menu first, without being asked.' },
      { q: 'A guest has placed their knife and fork together on the plate. What is this telling you?', options: ['They want more of the dish.', 'They are finished — clear the plate in the next natural pause.', 'They are unhappy with the food.', 'They are pausing and will eat more.'], correct: 1, explain: 'Cutlery placed together means finished. The table is showing you it is ready to move on — clear quietly in the next natural pause.' },
      { q: 'Why does the lesson say every table has its own rhythm?', options: ['Because all tables should be served at the same speed.', 'Because a couple, a group of friends, a business lunch, and a family each move at a different speed and want a different kind of attention.', 'Because the kitchen sets the pace for every table.', 'Because rhythm only matters for large groups.'], correct: 1, explain: 'Each type of table moves differently and wants a different kind of attention. Read which kind of table you have early, and serve its rhythm, not your own.' },
    ],
  },
  {
    id: 'fda-pacing',
    title: 'Pacing the Meal',
    desc: 'The right pace belongs to the table — your job is to read it and protect it.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-pacing',
    learn: [
      { type: 'intro', text: 'Pace is the heartbeat of a meal. Get it right and the evening flows — each course arrives at the moment the guest is ready for it, with just enough space to breathe in between. Get it wrong and even perfect food feels off. A course that comes too fast makes a guest feel rushed. One that comes too slow makes them feel forgotten. Reading and controlling pace is one of the hardest skills in fine dining, because the right pace is never fixed. It belongs to the table, and you have to read it from them.' },
      { type: 'principles', items: [
        { num: 1, title: 'Watch the plates, not the clock', body: 'A table is ready for the next course when they are nearly finished — not when a set number of minutes has passed. Read the plates and the speed of eating, and let that tell you when to send the next course to the kitchen.' },
        { num: 2, title: 'Read the energy', body: 'A table deep in conversation is not ready to be moved on, even if their plates are clear. A table that has gone quiet and is glancing around may be ready for more. The energy tells you as much as the plates do.' },
        { num: 3, title: 'Leave room to breathe', body: 'Between courses, a guest needs a short pause — to talk, to rest, to finish their wine. Never let the next plate land the second the last one is cleared. The gap is part of the meal, not wasted time.' },
        { num: 4, title: 'You control the timing', body: 'You are the link between the table and the kitchen. When you read that a table needs to slow down or speed up, you tell the kitchen to hold or send the next course. The pace is yours to manage, not the kitchen\'s to guess.' },
      ]},
      { type: 'callout', tone: 'warn', label: 'Never rush a table', text: 'A rushed guest feels it at once, even when nothing is said. Clearing too fast, hovering for the next order, bringing the bill before it is wanted — these all tell a guest that their table is needed back. In fine dining, a guest should always feel the evening is theirs for as long as they want it. Slow the pace down sooner than you speed it up.' },
      { type: 'steps', title: 'The natural transition moments', items: [
        { num: 1, title: 'The clear', body: 'When the last guest at the table sets their cutlery together, the course is finished. Clear quietly in the next natural pause. This is the first sign that the meal is ready to move forward.', badge: 'Clear' },
        { num: 2, title: 'The reset', body: 'Between courses, reset the table for what comes next: the right cutlery, a crumb-down if needed, glasses topped up. This quiet work bridges one course to the next without the guest noticing.', badge: 'Reset' },
        { num: 3, title: 'The check-in', body: 'A short, well-timed word — "May I bring your next course?" — lets you confirm the pace without rushing the table. Use it when you are unsure, not as a habit on every table.', badge: 'Confirm' },
        { num: 4, title: 'The wind-down', body: 'As the meal nears its end — coffee, dessert, the last of the wine — let the pace soften. This is the table\'s time to linger, and your job is to be present but unhurried.', badge: 'Close' },
      ]},
      { type: 'tip-list', title: 'Five pacing habits to build now', items: [
        'Read the plates, not your watch — the table decides when it is ready, not the clock.',
        'Always leave a breathing gap between courses — never let plates land back to back.',
        'When a table slows down, hold the kitchen; when they pick up, let the next course go.',
        'When you are unsure of the pace, a short "May I bring your next course?" settles it.',
        'Slow the pace down sooner than you speed it up — a rushed guest feels it at once.',
      ]},
    ],
    quiz: [
      { q: 'How do you know a table is ready for the next course?', options: ['When a set number of minutes has passed.', 'When they are nearly finished and the energy is right — you read the plates and the table, not the clock.', 'When the kitchen tells you the dish is ready.', 'When the table is the last one left in your section.'], correct: 1, explain: 'A table is ready when they are nearly finished, not when the clock says so. Read the plates and the energy of the table, and let that set the pace.' },
      { q: 'Why should you leave a gap between courses?', options: ['To give yourself time to rest.', 'Because a guest needs a short pause to talk, rest, and finish their wine — the gap is part of the meal, not wasted time.', 'To make the kitchen\'s job easier.', 'There is no reason — the next course should come right away.'], correct: 1, explain: 'The gap lets the guest breathe, talk, and finish their wine. It is part of the meal — never let the next plate land the second the last one is cleared.' },
      { q: 'Who controls the timing of the courses?', options: ['The kitchen, who send food when it is ready.', 'You — you read the table and tell the kitchen when to hold or send the next course.', 'The guest, who must ask for each course.', 'No one — the courses come on a fixed schedule.'], correct: 1, explain: 'You are the link between the table and the kitchen. The pace is yours to manage — you tell the kitchen when to hold and when to send, based on what you read from the table.' },
      { q: 'A guest feels rushed even though they have not said anything. What likely caused it?', options: ['The food was too good.', 'Clearing too fast, hovering for the next order, or bringing the bill before it was wanted.', 'The room was too quiet.', 'They were given too much time between courses.'], correct: 1, explain: 'A rushed guest feels it without a word being said. Clearing too fast, hovering, or bringing the bill early all signal that their table is needed back. Slow down sooner than you speed up.' },
      { q: 'When should you use a check-in line like "May I bring your next course?"', options: ['On every table, after every course.', 'When you are genuinely unsure of the pace — to confirm without rushing the table.', 'Never — you should always guess the pace silently.', 'Only when the kitchen is behind.'], correct: 1, explain: 'A short check-in confirms the pace without rushing the table. Use it when you are unsure, not as a habit on every course.' },
    ],
  },
  {
    id: 'fda-personal',
    title: 'Personal Touches & Guest Memory',
    desc: 'Anyone can serve a guest. A great server makes the guest feel known.',
    duration: '7 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-personal',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'Anyone can serve a guest. A great server makes the guest feel known. The difference is memory and attention to the small, personal things.' },
      { type: 'intro', text: 'Two restaurants can serve the same dish on the same plate. What a guest remembers is whether they felt like a person or a number. The small personal touches are what make the difference — using a name with care, remembering that one guest is having the fish, noticing it is a special night and treating it as one. None of this is on the menu. It is the part of fine dining that turns a good meal into a memory, and it costs nothing but attention.' },
      { type: 'principles', items: [
        { num: 1, title: 'Use the name with care', body: 'If you know a guest\'s name, use it — but lightly, and at the right moments. A warm "Welcome back, Mr. Lewis" lands well. Using a name in every sentence feels forced. The goal is warmth, not a performance.' },
        { num: 2, title: 'Remember the small things', body: 'Who ordered the sparkling water. Who cannot eat nuts. Who wanted their steak well done. Hold these in your head through the meal so the guest never has to repeat themselves. Being remembered feels like being cared for.' },
        { num: 3, title: 'Treat an occasion as an occasion', body: 'A birthday, an anniversary, a celebration — when a guest shares one, mark it warmly. A quiet word, a small gesture from the house, a "congratulations" that feels real. These are the moments a guest will talk about later.' },
        { num: 4, title: 'Check the dietary notes every course', body: 'An allergy or dietary need is not a one-time note. Carry it with you through every course, every plate, every drink. One missed detail can turn a special evening into a frightening one.' },
      ]},
      { type: 'do-dont', title: 'Using a name and a personal touch well', items: [
        { do: 'Greet a returning guest warmly by name as they arrive.', dont: 'Repeat the guest\'s name in every single sentence until it feels forced.' },
        { do: 'Remember who ordered what and serve each plate to the right guest without asking.', dont: 'Arrive with the plates and ask "who had the fish?" across the table.' },
        { do: 'Mark a guest\'s special occasion with a warm, genuine word or gesture.', dont: 'Ignore an anniversary the guest mentioned, or treat the night like any other.' },
        { do: 'Carry a guest\'s allergy in your mind through every course you serve them.', dont: 'Note an allergy once at the start, then forget it by the main course.' },
      ]},
      { type: 'tip-list', title: 'Five memory habits to build now', items: [
        'Use a guest\'s name warmly, but only at the right moments — never in every sentence.',
        'Lock in who ordered what, so every plate goes to the right guest without a word.',
        'When a guest mentions a special occasion, hold it and mark it before they leave.',
        'Carry every dietary note with you, course by course — never just at the start.',
        'Notice the small preferences during the meal, and act on them next time without being asked.',
      ]},
    ],
    quiz: [
      { q: 'How should you use a guest\'s name?', options: ['In every sentence, so they know you remember it.', 'Warmly and lightly, at the right moments — the goal is warmth, not a performance.', 'Never — it is too informal for fine dining.', 'Only when presenting the bill.'], correct: 1, explain: 'Use the name with care — a warm "Welcome back, Mr. Lewis" lands well, but a name in every sentence feels forced. The goal is warmth, not a performance.' },
      { q: 'The plates are ready to go to a table of four. What does the standard ask of you?', options: ['Carry them out and ask "who had the fish?" at the table.', 'Remember who ordered what, and serve each plate to the right guest without asking.', 'Put all the plates in the middle for guests to sort out.', 'Ask the kitchen to label each plate.'], correct: 1, explain: 'Remembering who ordered what, and serving each plate to the right guest without asking, is a small touch that makes a guest feel cared for.' },
      { q: 'A returning guest mentioned on a past visit that tonight is their anniversary. What do you do?', options: ['Nothing — it is not your place to bring it up.', 'Mark it warmly — a genuine word, a small gesture, a real "congratulations."', 'Mention it loudly so the whole room joins in.', 'Wait for them to bring it up again first.'], correct: 1, explain: 'When a guest shares an occasion, mark it warmly with a genuine word or gesture. These are exactly the moments a guest remembers and talks about later.' },
      { q: 'How often should you keep a guest\'s allergy in mind?', options: ['Just once, when they first mention it.', 'Through every course, every plate, and every drink — it is not a one-time note.', 'Only for the main course.', 'Only if the kitchen reminds you.'], correct: 1, explain: 'An allergy is not a one-time note. Carry it with you through every course and every plate — one missed detail can turn a special evening into a frightening one.' },
      { q: 'What turns a good meal into a memory?', options: ['Expensive ingredients and a large menu.', 'The small personal touches — being remembered, feeling known, having an occasion marked.', 'The speed of the service.', 'The size of the dining room.'], correct: 1, explain: 'Two restaurants can serve the same dish. What a guest remembers is feeling like a person, not a number — and that comes from the small personal touches and memory.' },
    ],
  },
  {
    id: 'fda-recovery',
    title: 'Proactive Recovery',
    desc: 'The best recovery is the one the guest never knows happened.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-recovery',
    learn: [
      { type: 'intro', text: 'The best recovery is the one the guest never knows happened. Things go wrong in every service — a dish comes out wrong, a course runs late, a guest is quietly unhappy. The weak server waits until the guest complains, then apologizes. The fine dining professional catches the problem first, often before the guest has fully noticed it, and fixes it so smoothly that the evening is never disturbed. This is the highest form of anticipation: reading not just what a guest needs, but what is about to go wrong — and getting there first.' },
      { type: 'callout', tone: 'rule', label: 'The golden rule of recovery', text: 'When something goes wrong, the goal is not just to fix it. It is to leave the guest feeling better than if nothing had gone wrong at all. A problem caught early and handled with grace can become the moment a guest remembers most warmly.' },
      { type: 'steps', title: 'Catching it early — the warning signs', items: [
        { num: 1, title: 'The unhappy face', body: 'A guest who takes one bite and sets the fork down. A small frown at a plate. A quiet look between two guests after the food arrives. These are the early signs that something is not right — long before a word is said.', badge: 'Watch' },
        { num: 2, title: 'Step in gently', body: 'When you see a sign, go over quietly and check: "How are you finding everything?" Ask it warmly, not anxiously. This opens the door for the guest to tell you, without turning it into a complaint.', badge: 'Check' },
        { num: 3, title: 'Catch the kitchen mistake first', body: 'Before a plate leaves your hand, look at it. Wrong dish, wrong temperature, a missing side, an allergy ignored — catch it at the pass, not at the table. The best recovery is the one that never reaches the guest.', badge: 'Intercept' },
        { num: 4, title: 'Fix it quietly', body: 'When something does go wrong, fix it calmly and without fuss. No panic, no long apology, no blaming the kitchen. Take it away, make it right, and keep the guest comfortable the whole time.', badge: 'Recover' },
      ]},
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Notice a guest set down their fork after one bite and check in gently.', dont: 'Wait until the guest flags you down to say the dish is wrong.' },
        { do: 'Check every plate before it leaves your hand for the table.', dont: 'Carry a plate out without looking, and find the mistake at the table.' },
        { do: 'Fix a wrong dish calmly — take it away and make it right at once.', dont: 'Argue, make excuses, or explain how the kitchen made the error.' },
        { do: 'After a problem, give the guest a little extra care for the rest of the meal.', dont: 'Fix the issue, then act as if the guest should be grateful it is over.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'The quiet save', text: 'Most problems can be solved before they grow, if you catch them in the first few seconds. A wrong plate spotted at the pass, a frown noticed across the room, a late course you warn the table about before they start to wonder — these small, early saves are invisible to the guest, and they are the real work of recovery.' },
    ],
    quiz: [
      { q: 'What is the golden rule of recovery?', options: ['Fix the problem as fast as possible and move on.', 'Leave the guest feeling better than if nothing had gone wrong at all.', 'Always offer a discount when something goes wrong.', 'Explain exactly what went wrong so the guest understands.'], correct: 1, explain: 'The goal is not just to fix the problem — it is to leave the guest feeling better than if nothing had gone wrong. Handled with grace, a problem can become a warm memory.' },
      { q: 'A guest takes one bite, frowns, and sets the fork down. What do you do?', options: ['Wait until they call you over to complain.', 'Step in gently and ask warmly, "How are you finding everything?"', 'Ignore it — they may just be pausing.', 'Take the plate away without asking.'], correct: 1, explain: 'A bite set down and a small frown are early warning signs. Step in gently and check warmly — this opens the door for the guest to tell you, without making it a complaint.' },
      { q: 'Where is the best place to catch a kitchen mistake?', options: ['At the table, after the guest points it out.', 'At the pass, before the plate ever leaves your hand for the table.', 'After the meal, in the debrief.', 'It does not matter where you catch it.'], correct: 1, explain: 'Check every plate before it leaves your hand. Catching a wrong dish or temperature at the pass means the best recovery of all — the one that never reaches the guest.' },
      { q: 'A dish comes out wrong and the guest has noticed. How do you fix it?', options: ['Explain how the kitchen made the mistake.', 'Fix it calmly and without fuss — take it away, make it right, and keep the guest comfortable.', 'Apologize at length so they know you are sorry.', 'Offer a free dessert before doing anything else.'], correct: 1, explain: 'Fix it calmly — no panic, no long apology, no blaming the kitchen. Take it away, make it right, and keep the guest comfortable the whole time.' },
      { q: 'What is the difference between proactive and reactive recovery?', options: ['Proactive is slower; reactive is faster.', 'Proactive catches the problem early, often before the guest fully notices; reactive waits for the complaint, then apologizes.', 'There is no real difference.', 'Proactive is only for regulars.'], correct: 1, explain: 'Reactive recovery waits for the guest to complain. Proactive recovery reads what is about to go wrong and gets there first — fixing it so smoothly the evening is never disturbed.' },
    ],
  },
];

// ─── FINE DINING PHASE 1 · MODULE 5: MENU KNOWLEDGE & DESCRIBING THE DISH ─

const fineDiningMenuKnowledgeLessons: Lesson[] = [
  {
    id: 'fmk-know-your-menu',
    title: 'Knowing Your Menu',
    desc: 'Speak about the food with real knowledge, not memorized lines.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-menu-explain',
    learn: [
      { type: 'intro', text: 'A guest can always tell the difference between a server who knows the food and one who learned a few lines by heart. Real menu knowledge gives you confidence. You can answer questions, guide a choice, and talk about a dish like someone who understands it — not someone reading from a card. You do not need to be a chef. You need to know, for every dish, three things: the key ingredients, how it is cooked, and how it tastes. Learn those three, and you can speak about any plate with ease.' },
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'For every dish on the menu, you know the key ingredients, the main cooking method, and how it tastes. That is the floor, not the ceiling.' },
      { type: 'steps', title: 'The three things to know about every dish', items: [
        { num: 1, title: 'The key ingredients', body: 'Know what is in the dish — the main protein or vegetable, and the parts that define it. You do not need every herb, but you do need the ones a guest would ask about, and anything common people avoid, like nuts, shellfish, or dairy.', badge: 'Ingredients' },
        { num: 2, title: 'How it is cooked', body: 'Know the basic method: grilled, roasted, pan-fried, steamed, braised, raw, cured. The cooking method tells the guest a lot — whether a dish is light or rich, crisp or soft, simple or slow-cooked. A few clear words here go a long way.', badge: 'Method' },
        { num: 3, title: 'How it tastes', body: 'Know the main flavours: is it rich, fresh, spicy, smoky, sweet, sharp, delicate? This is what a guest most wants to know and what a memorized line never gives them. Taste the dishes when you can — nothing replaces having tried it yourself.', badge: 'Flavour' },
      ]},
      { type: 'do-dont', title: 'Knowledge vs memorized lines', items: [
        { do: 'Explain a dish in your own words, plainly and with real understanding.', dont: 'Reciting the exact menu text back word for word.' },
        { do: 'Know the key ingredients well enough to answer a follow-up question.', dont: 'Going blank the moment a guest asks something past the menu wording.' },
        { do: 'Describe how a dish is cooked and how it tastes, simply.', dont: 'Guessing, or making something up when you are not sure.' },
        { do: 'Taste the dishes yourself whenever the kitchen allows it.', dont: 'Describing a dish you have never seen or tried.' },
      ]},
      { type: 'tip-list', title: 'Five ways to learn your menu', items: [
        'For each dish, learn three things: key ingredients, cooking method, main flavours.',
        'Taste as many dishes as you can — your own experience beats any description.',
        'Learn which dishes contain common allergens: nuts, shellfish, dairy, gluten.',
        'Ask the kitchen about anything you don\'t understand, before service, not during.',
        'Explain a dish out loud to a colleague until it sounds natural, not memorized.',
      ]},
    ],
    quiz: [
      { q: 'What three things should you know about every dish on the menu?', options: ['The price, the portion size, and the plate it comes on.', 'The key ingredients, how it is cooked, and how it tastes.', 'The exact menu wording, word for word.', 'The chef\'s name, the supplier, and the recipe.'], correct: 1, explain: 'For every dish, know the key ingredients, the main cooking method, and how it tastes. Those three let you speak about any plate with confidence.' },
      { q: 'How can a guest tell the difference between real knowledge and memorized lines?', options: ['They can\'t — the words sound the same either way.', 'A server with real knowledge can answer follow-up questions and explain a dish in their own words; one with memorized lines goes blank.', 'Only the manager can tell the difference.', 'It only shows when the dish is very unusual.'], correct: 1, explain: 'Real knowledge lets you answer questions and explain a dish in your own words. Memorized lines fall apart the moment a guest asks something past the menu wording.' },
      { q: 'Why does the cooking method matter when you describe a dish?', options: ['It doesn\'t — only the ingredients matter.', 'The method tells the guest a lot — whether the dish is light or rich, crisp or soft, simple or slow-cooked.', 'Guests only ask about the method when there is a problem.', 'It matters only for meat dishes.'], correct: 1, explain: 'Grilled, roasted, braised, raw — the cooking method tells the guest whether a dish is light or rich, crisp or soft. A few clear words about it go a long way.' },
      { q: 'What is the best way to learn how a dish really tastes?', options: ['Read the menu description a few more times.', 'Taste the dish yourself whenever the kitchen allows it.', 'Ask another guest what they thought.', 'Guess from the ingredients listed.'], correct: 1, explain: 'Nothing replaces having tried it yourself. Taste the dishes when you can — your own experience beats any description on a card.' },
      { q: 'A guest asks if a dish contains nuts and you are not sure. What should you do?', options: ['Guess, since it probably doesn\'t.', 'Know your menu\'s common allergens in advance — and if you are ever unsure, check with the kitchen before answering.', 'Tell them it\'s fine to avoid worrying them.', 'Suggest they order something else instead.'], correct: 1, explain: 'You should know which dishes contain common allergens like nuts, shellfish, and dairy. When you are not certain, never guess — check with the kitchen before you answer.' },
    ],
  },
  {
    id: 'fmk-describing-dish',
    title: 'Describing a Dish with Confidence',
    desc: 'Make a dish sound appealing and true — without sounding scripted.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-recommend',
    learn: [
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'A good description is honest and appealing. You help the guest picture the dish and want it — you never oversell or promise what the plate cannot deliver.' },
      { type: 'intro', text: 'How you describe a dish can make a guest want it before it arrives. The goal is simple: help them picture it, and make it sound as good as it really is. This is not about big, fancy words or a long speech. A short, warm, honest description does more than a list of every ingredient. The best descriptions sound natural, like you are telling a friend about something you genuinely enjoy — not reading from a script.' },
      { type: 'principles', items: [
        { num: 1, title: 'Lead with the best part', body: 'Start with what makes the dish special — the flavour, the texture, the one thing a guest will remember. "The lamb is slow-cooked until it falls apart, with a rich, smoky sauce." One strong line beats a full list of ingredients.' },
        { num: 2, title: 'Use simple, real words', body: 'Plain words a guest can picture work best: tender, crisp, fresh, rich, light, smoky. You do not need rare or fancy words. The aim is for the guest to imagine the taste, not to be impressed by your vocabulary.' },
        { num: 3, title: 'Inform, don\'t oversell', body: 'Your job is to help the guest choose, not to push the most expensive dish. Describe honestly and let them decide. A guest who feels informed trusts you; a guest who feels sold to puts their guard up.' },
        { num: 4, title: 'Keep it short', body: 'Two or three sentences is usually enough. Say what the dish is, the best thing about it, and how it tastes, then stop. A long description loses the guest and starts to sound scripted.' },
      ]},
      { type: 'do-dont', title: 'Describing a dish well', items: [
        { do: 'Lead with the one thing that makes the dish special.', dont: 'Listing every single ingredient in order off the menu.' },
        { do: 'Use simple words a guest can picture — tender, fresh, rich, crisp.', dont: 'Reaching for rare or fancy words to sound impressive.' },
        { do: 'Describe the dish honestly so the guest can choose for themselves.', dont: 'Overselling a dish or promising more than the plate delivers.' },
        { do: 'Keep it to two or three warm, natural sentences.', dont: 'Giving a long speech that sounds memorized.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'The friend test', text: 'Before you describe a dish, ask yourself: how would I tell a friend about it? You would not list every ingredient or use fancy words. You would say the best part, simply and warmly. That is exactly how a great description sounds at the table.' },
    ],
    quiz: [
      { q: 'How should you start a description of a dish?', options: ['With the full list of ingredients in menu order.', 'With the best part — the flavour, texture, or the one thing a guest will remember.', 'With the price, so they know what to expect.', 'With how long it takes to cook.'], correct: 1, explain: 'Lead with what makes the dish special. One strong line about the best part beats a full list of ingredients.' },
      { q: 'What kind of words work best when describing a dish?', options: ['Rare and fancy words that sound impressive.', 'Simple, real words a guest can picture — tender, crisp, fresh, rich, smoky.', 'The exact words printed on the menu.', 'Technical cooking terms only chefs use.'], correct: 1, explain: 'Plain words a guest can picture work best. The aim is for them to imagine the taste, not to be impressed by your vocabulary.' },
      { q: 'What is the difference between informing and overselling?', options: ['There is no difference — both help the guest.', 'Informing helps the guest choose honestly; overselling pushes a dish and makes the guest put their guard up.', 'Informing is for cheap dishes, overselling for expensive ones.', 'Overselling is fine as long as the dish is good.'], correct: 1, explain: 'Your job is to help the guest choose, not to push the priciest dish. A guest who feels informed trusts you; a guest who feels sold to puts their guard up.' },
      { q: 'How long should a good dish description be?', options: ['As long as possible, to cover every detail.', 'Usually two or three sentences — what it is, the best thing about it, and how it tastes.', 'One word, so you don\'t bore the guest.', 'A full minute, like a small speech.'], correct: 1, explain: 'Two or three sentences is usually enough. Say what the dish is, the best thing about it, and how it tastes, then stop — a long description sounds scripted.' },
      { q: 'What is the "friend test" for describing a dish?', options: ['Asking a friend to taste the dish first.', 'Describing it the way you would tell a friend — the best part, simply and warmly, with no fancy words.', 'Only describing dishes your friends would like.', 'Checking the description with a colleague before service.'], correct: 1, explain: 'How would you tell a friend about the dish? You\'d say the best part, simply and warmly — not list every ingredient. That is exactly how a great description sounds.' },
    ],
  },
  {
    id: 'fmk-beverage-foundations',
    title: 'Beverage Foundations',
    desc: 'The basics of wine and drinks — enough to guide a guest with confidence.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-pairing-basic',
    learn: [
      { type: 'intro', text: 'You do not need to be a wine expert to serve drinks well. That deeper knowledge comes later. What you need now is a solid foundation: the main types of wine, a few simple words to describe them, and the basic idea of which drink goes with which food. With these basics, you can guide a guest, answer common questions, and know when to bring in a colleague who knows more. This lesson is the floor to stand on, not the whole building.' },
      { type: 'principles', items: [
        { num: 1, title: 'Red, white, and sparkling', body: 'Red wine is usually served with richer food and at room temperature. White wine is usually served cold and goes with lighter food. Sparkling wine has bubbles and is often served as a celebration drink or before the meal. These three groups are the start of everything.' },
        { num: 2, title: 'Light vs full-bodied', body: '"Body" means how heavy or light a wine feels in the mouth. A light wine feels delicate and easy; a full-bodied wine feels rich and strong. Light wines suit lighter dishes; full-bodied wines suit richer ones. This one idea helps you guide most choices.' },
        { num: 3, title: 'What "dry" means', body: 'A "dry" wine is simply a wine that is not sweet. Most wines served with a meal are dry. The opposite is "sweet," which is more common with dessert. If a guest says they like dry wine, they mean they do not want it sweet.' },
        { num: 4, title: 'Non-alcoholic options matter', body: 'Not every guest drinks alcohol, and they deserve the same care. Know your non-alcoholic options well — sparkling water, soft drinks, juices, mocktails, alcohol-free wine or beer. Offer them with the same warmth you would a fine wine.' },
      ]},
      { type: 'callout', tone: 'tip', label: 'The simplest pairing rule', text: 'A simple, safe starting point: white wine with fish and light dishes, red wine with red meat and rich dishes. It is not a strict law, and there are many exceptions — but as a basic guide it is correct far more often than not, and it lets you make a sensible suggestion with confidence.' },
      { type: 'do-dont', title: 'Guiding a guest on drinks', items: [
        { do: 'Suggest white wine with fish and lighter plates, red with red meat and richer ones.', dont: 'Acting like a wine expert and inventing details you don\'t actually know.' },
        { do: 'Explain "dry" simply — a wine that is not sweet.', dont: 'Using complicated wine terms that confuse the guest.' },
        { do: 'Offer non-alcoholic options with the same care as wine.', dont: 'Treating a guest who doesn\'t drink as an afterthought.' },
        { do: 'Bring in a colleague who knows more when a guest wants deeper advice.', dont: 'Bluffing your way through a question you can\'t really answer.' },
      ]},
      { type: 'tip-list', title: 'Five beverage basics to know now', items: [
        'Red with rich food and red meat; white with fish and lighter dishes.',
        'White and sparkling are served cold; red is served at room temperature.',
        '"Dry" means not sweet — most meal wines are dry.',
        'Light wines suit light food; full-bodied wines suit rich food.',
        'Know your non-alcoholic options, and offer them with equal care.',
      ]},
    ],
    quiz: [
      { q: 'What is the simplest basic pairing rule?', options: ['Red wine with everything, since it\'s the most popular.', 'White wine with fish and lighter dishes, red wine with red meat and richer dishes.', 'Sparkling wine with every course.', 'Whatever wine is most expensive goes with everything.'], correct: 1, explain: 'A simple, safe starting point: white with fish and light dishes, red with red meat and rich dishes. It has exceptions, but as a basic guide it is right far more often than not.' },
      { q: 'What does it mean when a wine is "dry"?', options: ['It has been open too long and gone flat.', 'It is simply not sweet — most wines served with a meal are dry.', 'It is a very strong, high-alcohol wine.', 'It is served without ice.'], correct: 1, explain: '"Dry" just means not sweet. Most meal wines are dry; sweet wines are more common with dessert. A guest who likes dry wine does not want it sweet.' },
      { q: 'What does "body" mean when talking about wine?', options: ['The colour of the wine.', 'How heavy or light the wine feels in the mouth — light feels delicate, full-bodied feels rich.', 'The region the wine comes from.', 'How old the wine is.'], correct: 1, explain: '"Body" is how heavy or light a wine feels. Light wines suit lighter dishes, full-bodied wines suit richer ones — this one idea helps you guide most choices.' },
      { q: 'A guest tells you they do not drink alcohol. How should you handle it?', options: ['Just bring them tap water without asking.', 'Offer your non-alcoholic options with the same care and warmth as you would a fine wine.', 'Tell them the menu is really built around the wine.', 'Leave them to ask if they want something.'], correct: 1, explain: 'Every guest deserves the same care. Know your non-alcoholic options — sparkling water, soft drinks, juices, mocktails — and offer them with the same warmth as a fine wine.' },
      { q: 'A guest asks a detailed wine question you cannot really answer. What is the professional move?', options: ['Make up a confident-sounding answer so you don\'t look unsure.', 'Bring in a colleague who knows more, rather than bluffing.', 'Tell them the question is too complicated.', 'Change the subject back to the food.'], correct: 1, explain: 'This lesson is a foundation, not deep expertise. When a guest wants deeper advice, bring in a colleague who knows more — never bluff your way through.' },
    ],
  },
  {
    id: 'fmk-answering-questions',
    title: 'Answering Guest Questions with Confidence',
    desc: 'Recommend, handle dietary needs, and say "let me check" the right way.',
    duration: '8 min',
    xp: 50,
    status: 'available',
    scenarioId: 'fine-dining-dietary',
    learn: [
      { type: 'intro', text: 'Guests ask questions all the time. "What do you recommend?" "Is this gluten-free?" "What\'s good tonight?" How you answer shapes how much they trust you. A confident, honest answer puts a guest at ease. A vague or unsure one makes them worry. The good news: you do not need to know everything. You need to answer well what you know, handle dietary needs with care, and have a calm, professional way to say "let me check on that" when you don\'t know. Done right, even "I don\'t know" builds trust.' },
      { type: 'steps', title: 'Answering the common questions', items: [
        { num: 1, title: '"What do you recommend?"', body: 'Give a real answer, not "it\'s all good." Name one or two dishes you genuinely like, and say why in a sentence. A guest asking this wants your honest opinion. A confident, personal recommendation is one of the most reassuring things you can offer.', badge: 'Recommend' },
        { num: 2, title: 'Dietary questions', body: 'Take every dietary question seriously — vegetarian, vegan, gluten-free, allergies. Know your menu well enough to point to safe options, and never guess with an allergy. When in doubt, check with the kitchen. Getting this right can matter to a guest\'s health.', badge: 'Dietary' },
        { num: 3, title: 'When you don\'t know', body: 'Never guess or make something up. Say it simply and calmly: "That\'s a good question — let me check on that for you." Then go and find out. A confident "let me check" is far better than a wrong answer said with a smile.', badge: 'Honesty' },
        { num: 4, title: 'Come back with the answer', body: 'When you say you\'ll check, always come back — clearly and promptly — with the answer. The check only builds trust if you follow through. A question left hanging does the opposite.', badge: 'Follow through' },
      ]},
      { type: 'callout', tone: 'rule', label: 'The Standard', text: 'You never guess on a dietary or allergy question. "Let me check on that for you" said with confidence is always the right answer when you are not sure — and then you check, and you come back.' },
      { type: 'do-dont', title: 'In practice', items: [
        { do: 'Recommend one or two dishes you genuinely like, and say why.', dont: 'Answering "it\'s all good" when a guest asks what you recommend.' },
        { do: 'Take every allergy and dietary need seriously, and check when unsure.', dont: 'Guessing whether a dish is safe for someone with an allergy.' },
        { do: 'Say "let me check on that for you" calmly and confidently when you don\'t know.', dont: 'Making up an answer so you don\'t look unsure.' },
        { do: 'Always come back promptly with the answer you went to find.', dont: 'Saying you\'ll check, then never returning with the answer.' },
      ]},
      { type: 'tip-list', title: 'Five habits for answering well', items: [
        'Have two or three dishes ready to recommend, with a reason for each.',
        'Know your menu\'s vegetarian, vegan, and gluten-free options before service.',
        'Never guess on an allergy — check with the kitchen every time.',
        'Say "let me check on that for you" with confidence, not apology.',
        'Always follow through — come back with the answer you promised.',
      ]},
    ],
    quiz: [
      { q: 'A guest asks "What do you recommend?" What is the best response?', options: ['"It\'s all good, honestly."', 'Name one or two dishes you genuinely like, and say why in a sentence.', 'Recommend the most expensive dish on the menu.', '"Whatever you feel like is fine."'], correct: 1, explain: 'A guest asking this wants your honest opinion. Name one or two dishes you really like and say why — a confident, personal recommendation is deeply reassuring.' },
      { q: 'A guest says they have a serious nut allergy and asks if a dish is safe. What do you do?', options: ['Tell them it\'s probably fine.', 'Take it seriously, and if you are not completely sure, check with the kitchen before answering.', 'Suggest they just avoid that one dish.', 'Guess based on the ingredients you can see.'], correct: 1, explain: 'Never guess on an allergy — it can matter to a guest\'s health. Take it seriously, and when you are not completely sure, check with the kitchen before you answer.' },
      { q: 'A guest asks a question and you genuinely don\'t know the answer. What is the professional move?', options: ['Make up a confident answer so you don\'t look unsure.', 'Say calmly "let me check on that for you," then go and find out.', 'Tell them you\'re not sure and leave it there.', 'Change the subject to something you do know.'], correct: 1, explain: 'Never guess. A calm, confident "let me check on that for you" is far better than a wrong answer said with a smile — then you go and find out.' },
      { q: 'You\'ve told a guest you\'ll check on something for them. What must you do next?', options: ['Wait for them to ask again before chasing it up.', 'Always come back promptly with the answer — the check only builds trust if you follow through.', 'Only return if the answer is good news.', 'Mention it to a colleague and hope they handle it.'], correct: 1, explain: 'The check only builds trust if you follow through. Always come back, clearly and promptly, with the answer — a question left hanging does the opposite.' },
      { q: 'Why can saying "I don\'t know, let me check" actually build trust?', options: ['It can\'t — guests want instant answers only.', 'Because an honest, confident "let me check" followed by the real answer reassures the guest far more than a wrong answer would.', 'Because it makes the guest feel sorry for you.', 'Because it gives you time to take a break.'], correct: 1, explain: 'Done right, even "I don\'t know" builds trust. An honest "let me check," followed by coming back with the real answer, reassures a guest far more than a confident wrong answer.' },
    ],
  },
];

export const CURRICULUM: Module[] = [
  // Module 0
  {
    id: 'onboarding',
    title: 'Welcome to [Property]',
    subtitle: 'Know your home before your first shift',
    iconName: 'House',
    color: '#051956',
    progress: 0,
    totalLessons: 6,
    completedLessons: 0,
    available: true,
    xpTotal: 150,
    lessons: onboardingLessons,
  },
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
    xpTotal: 200,
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
    xpTotal: 250,
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
    xpTotal: 150,
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
    xpTotal: 200,
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
    xpTotal: 200,
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
    xpTotal: 250,
    lessons: guestPsychologyLessons,
  },
  // Module 7
  {
    id: 'casual-dining-standard',
    title: 'The Casual Dining Standard',
    subtitle: 'Habits, teamwork, and safety on a fast floor.',
    iconName: 'Utensils',
    color: '#2D6A4F',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 120,
    lessons: casualDiningStandardLessons,
    phase_id: 'casual-dining-phase-1',
    order_in_phase: 1,
  },
  // Module 8
  {
    id: 'casual-dining-floor',
    title: 'Running the Floor',
    subtitle: 'Own your section, read the room, never miss a beat.',
    iconName: 'Utensils',
    color: '#1B4332',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 200,
    lessons: casualDiningFloorLessons,
    phase_id: 'casual-dining-phase-1',
    order_in_phase: 2,
  },
  // Fine Dining Phase 1 — Module 1
  {
    id: 'fine-dining-standard',
    title: 'The Fine Dining Standard',
    subtitle: 'The mindset, presence, and habits that define fine dining.',
    iconName: 'Star',
    color: '#1a1a2e',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 200,
    lessons: fineDiningStandardLessons,
  },
  // Fine Dining Phase 1 — Module 2
  {
    id: 'fine-dining-presence-module',
    title: 'Professional Appearance & Presence',
    subtitle: 'Be seen before you speak — elegance starts with how you carry yourself.',
    iconName: 'Eye',
    color: '#2c1654',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 200,
    lessons: fineDiningPresenceLessons,
  },
  // Fine Dining Phase 1 — Module 3
  {
    id: 'fine-dining-etiquette',
    title: 'Fine Dining Etiquette',
    subtitle: 'The rules of the table — know them, own them, never break them.',
    iconName: 'BookOpen',
    color: '#1B4332',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 200,
    lessons: fineDiningEtiquetteLessons,
  },
  // Fine Dining Phase 1 — Module 4
  {
    id: 'fine-dining-table-setup',
    title: 'Table Setup & Dining Room Standards',
    subtitle: 'Before the first guest arrives, the standard is already set.',
    iconName: 'Layout',
    color: '#2D4A22',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 200,
    lessons: fineDiningTableSetupLessons,
  },
  // Fine Dining Phase 1 — Module 5
  {
    id: 'fine-dining-menu-knowledge',
    title: 'Menu Knowledge & Describing the Dish',
    subtitle: 'Know the food, describe it well, and answer any guest question with confidence.',
    iconName: 'UtensilsCrossed',
    color: '#7A2E1E',
    progress: 0,
    totalLessons: 4,
    completedLessons: 0,
    available: true,
    xpTotal: 200,
    lessons: fineDiningMenuKnowledgeLessons,
  },
  // Phase 1 Certification (placeholder) — always the final item in the grid.
  {
    id: 'phase-1-certification',
    title: 'Phase 1 Certification',
    subtitle: 'Prove what you know. Unlock Phase 2.',
    iconName: 'Trophy',
    color: '#B8860B',
    progress: 0,
    totalLessons: 0,
    completedLessons: 0,
    available: false,
    xpTotal: 0,
    lessons: [],
  },
];

// ─── PROPERTY CURRICULUM RESOLUTION ──────────────────────────
// The `property_modules` DB table is the source of truth for WHICH modules a
// property shows, in WHAT ORDER, and whether they're active. The CURRICULUM
// array above remains the source of the actual CONTENT (lessons, quizzes,
// learn sections). `resolveCurriculum` merges the two: it takes the property's
// module rows and rebuilds the curriculum from CURRICULUM content accordingly.

export interface PropertyModuleRow {
  module_id: string;
  order_index: number;
  is_active: boolean;
}

const CURRICULUM_BY_ID: Record<string, Module> = Object.fromEntries(
  CURRICULUM.map((m) => [m.id, m]),
);

export function resolveCurriculum(
  propertyModules: PropertyModuleRow[] | null | undefined,
): Module[] {
  // No rows for this property → fall back to the full hardcoded curriculum so
  // nothing breaks for properties that haven't been configured in the Library.
  if (!propertyModules || propertyModules.length === 0) return CURRICULUM;

  return propertyModules
    .filter((pm) => pm.is_active) // inactive modules never reach staff
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((pm) => CURRICULUM_BY_ID[pm.module_id])
    // Drop any module_id that has no matching content (e.g. removed from code).
    .filter((m): m is Module => Boolean(m));
}
