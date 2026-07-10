'use client';

import { useEffect } from 'react';

// Reset the window scroll whenever the page's client-side "screen" changes.
// The staff and manager pages navigate by swapping view state (home → module →
// lesson, dashboard → staff detail) without a route change, so the browser
// never restores scroll on its own and a deep scroll position leaks from one
// screen into the next. Pass every value that identifies the current screen
// (view name, active lesson id, phase, …).
export function useScrollToTop(...keys: unknown[]) {
  // The spread keys ARE the dependency list — each call site's keys identify
  // its screen, so the effect fires exactly on screen changes.
  useEffect(() => {
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, keys);
}
