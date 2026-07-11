---
name: verify
description: Build/launch/drive recipe for verifying hostia-core changes locally (Next.js + Supabase + Playwright).
---

# Verifying hostia-core locally

## Launch

```bash
npm run dev   # port 3000, uses .env.local (points at PRODUCTION Supabase — reads are safe, avoid writes)
```

Wait for readiness: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/login` → 200.

## Login without a password (magiclink-cookie technique)

Passwords are unknown; mint a session with the service role instead:

1. `admin.auth.admin.generateLink({ type: 'magiclink', email })` (service-role client)
2. `anon.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'magiclink' })`
3. Cookie `sb-<ref>-auth-token` = `base64-` + base64url(JSON.stringify(session)), chunked at 3180 chars (`.0`, `.1` name suffixes only when >1 chunk). `<ref>` = first hostname label of `NEXT_PUBLIC_SUPABASE_URL`. Domain `localhost`, not httpOnly.

Import supabase-js from the repo: `/…/hostia-core/node_modules/@supabase/supabase-js/dist/index.mjs`.

## Browser

`playwright-core` (npm-install it in the scratchpad; not a repo dep) + the cached binary at
`~/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome` (version may drift — `ls ~/.cache/ms-playwright/`).

## Known accounts (test data, safe to drive)

| email | role | property |
|---|---|---|
| testingbrgr12345@gmail.com | manager (Allan Boye) | Brgr House (real/live property) |
| BrgrTest (staff, find id via users table) | staff | Brgr House |
| manou.meersman@gmail.com | manager | De Gouverneur (2 staff) |

## Gotchas

- Manager dashboard: clicking `text=BrgrTest` hits the *insight card*, not the roster. Click the roster row: `page.locator('tr').filter({ hasText: 'Team member' })`.
- Staff-profile live detail fetch races `waitForResponse` — wait for rendered content instead.
- Useful selectors (staff app): `.module-card`, `.lesson-row`, `.phase-tab`, `.quiz-opt`, `.scenario-start-btn`, `textarea.input-field`, `.send-btn`.
- Roleplay pass rule: ≥3 turns, warmth×10 ≥ 55 twice consecutively (max 7 turns).
