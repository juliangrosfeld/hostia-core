// The Hostia Demo property. When the signed-in manager belongs to this property,
// the dashboard renders the hardcoded mock data (Omar, 74% team health, etc.) so
// Julian can sell with a polished, populated screen. Every OTHER property gets
// real Supabase-backed metrics. Keep this in sync with the demo property's row id.
export const DEMO_PROPERTY_ID = 'f86752e5-f7f1-46a2-acd3-90764ce1c403';

// Fraction of practice-quiz questions that must be answered correctly before a
// staff member can advance past the Practice phase (and have it count as a
// practice completion). 0.8 → 4/5 on the standard five-question quiz; the
// required count is ceil(quiz.length × ratio), so a one-question quiz needs 1/1.
export const PRACTICE_PASS_RATIO = 0.8;

// NOTE: the old `name`/`fullName` placeholder fields ('[Property Name]') were
// removed — property names always come from the DB (properties.name / the
// property_name override). Never reintroduce a display-name fallback here.
export const PROPERTY = {
  location: 'Curaçao',
  type: 'hospitality',
  manager: 'Manager',
  managerRole: 'General Manager',
  languages: ['english', 'spanish', 'dutch', 'papiamentu'],
  activeModules: ['greetings', 'service-flow', 'language',
  'complaints', 'floor', 'guest-psychology'],
  goldStandard: 'The goal is not for the guest to be satisfied. The goal is for them to say: "This was different from anywhere else."',
  goldenRule: 'If it is not perfectly executed, it is not done.',
};
