// Time-of-day greeting word, based on the viewer's local hour.
//
// Call from a useEffect (not during render) so the value is computed in the
// browser's timezone and never causes a server/client hydration mismatch.
//
//   5am–11:59am  → "Good morning"
//   12pm–5:59pm  → "Good afternoon"
//   6pm–4:59am   → "Good evening"
export function getGreeting(hour: number = new Date().getHours()): string {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 18) return 'Good afternoon'
  return 'Good evening'
}
