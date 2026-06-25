// The Hostia Demo property. When the signed-in manager belongs to this property,
// the dashboard renders the hardcoded mock data (Omar, 74% team health, etc.) so
// Julian can sell with a polished, populated screen. Every OTHER property gets
// real Supabase-backed metrics. Keep this in sync with the demo property's row id.
export const DEMO_PROPERTY_ID = 'f86752e5-f7f1-46a2-acd3-90764ce1c403';

export const PROPERTY = {
  name: '[Property Name]',
  fullName: '[Property Name]',
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
