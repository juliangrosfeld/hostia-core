# Hostia Full Audit — Phase 1 (Investigation Only)

**Date:** 2026-07-03 · **Branch:** `main` @ `013b418` (clean, pushed)
**Scope:** All of `src/` (60 files), all 9 SQL migrations, git state, lint/typecheck.
**No code was changed.** Every finding lists: what's wrong → why it matters → severity → proposed fix.

Severity counts: **4 critical · 6 high · 12 medium · 10 low**

---

## 1. Known open issues (verified & expanded)

### 1.1 ❗ CRITICAL — `roleplay_sessions` is never persisted (confirmed, and worse than believed)

**What:** No code anywhere inserts into `roleplay_sessions`. Confirmed via grep: the table is only ever **read** (manager dashboard, admin dashboard, xp-streak, delete cascades). `ApplyPhase.tsx:430` computes `xpEarned = calculateRoleplayXP(...)` and displays it (`+{xpEarned}` at line 527), but the value dies with the component. The comment at `ApplyPhase.tsx:156-158` even claims "both fire on a pass" — only `logLessonCompletion` actually fires.

**Compounding problem (this is the "worse" part):** even when the insert is added, the **staff INSERT RLS policy will reject it**. `create_roleplay_sessions.sql` defines:

```sql
CREATE POLICY "Staff can insert own sessions" ON roleplay_sessions
  FOR INSERT WITH CHECK (staff_id = auth.uid());   -- BROKEN: staff_id is users.id, not auth.uid()
```

`fix_roleplay_sessions_manager_rls.sql` fixed only the **manager SELECT** policy. The staff INSERT and staff SELECT policies still use the broken `staff_id = auth.uid()` pattern (`/api/staff/xp-streak/route.ts:45-50` explicitly works around the broken SELECT with the admin client).

**Why it matters:** This is the root cause of the entire dead gamification chain (see §2). Warmth scores, transcripts, XP, team health, skill gaps, trend chart, top performer — all permanently empty for every real client.

**Proposed fix (three parts, in order):**
1. **Migration** — drop and recreate the two staff policies on `roleplay_sessions` using the correct pattern: `staff_id IN (SELECT id FROM users WHERE auth_id = auth.uid())` (mirrors `lesson_completions`).
2. **New API route** `POST /api/roleplay-sessions` (mirroring `/api/lesson-completions`): auth via `createClient()`, resolve `profile.id`/`property_id` via `auth_id`, validate body (`lesson_id`, `module_id`, `scenario_id`, `passed`, `warmth_score` 0–100, `xp_earned`, `turns`, `transcript`), insert with the session-bound client so RLS enforces ownership. Recompute `xp_earned` server-side from `warmth_score` + `passed` (don't trust the client's XP number).
3. **ApplyPhase.tsx** — in the `done` effect (line ~159), fire-and-forget the session POST for **both passed and failed** sessions (the table + manager metrics expect failures too; the migration comment says "one row per completed (passed or failed) roleplay"). Keep the existing `logLessonCompletion` on pass only.

### 1.2 MEDIUM — Commit-but-don't-push pattern

**What:** Currently everything is pushed (`main === origin/main`, both feature branches tracked). But the reflog shows the risk window is real: on 2026-07-01, **13 commits** accumulated locally in one session before landing on origin. No git hooks are installed (`.git/hooks` has only samples).

**Why it matters:** A dead laptop mid-session loses a day of work; Vercel deploys also lag behind local reality.

**Proposed fix (pick one, ordered by recommendation):**
1. **Claude Code hook** (best fit for how these commits happen): a `PostToolUse` hook on `git commit` (or a `Stop` hook) that runs `git status -sb` and surfaces `ahead N` as a reminder to push. I can wire this into `.claude/settings.json` in Phase 2.
2. `git config alias.done '!git commit && git push'` style alias, or simply adopting `git push` as part of the commit ritual.
3. A `post-commit` hook that prints a loud `⚠ N commits ahead of origin/main` banner. (Hooks aren't versioned, so this is per-machine.)

### 1.3 RESOLVED (with 2 residual notes) — XP/streak hero flicker

**What:** The fix in `35b6aad` is structurally sound: `staff/page.tsx:55` gates first paint on all four loaders (`loading || curriculumLoading || progressLoading || xpLoading`), and each hook always resolves its loading state, even on failed/non-OK responses (`useStaffXPAndStreak.ts:35-41`, `useHomeProgress.ts:30-32`, `useCurriculum.ts:45-47`). Manager "view as" short-circuits correctly. No mock-then-real flash remains.

**Residual notes (low):**
- `staff/page.tsx:42-45` — heartbeat effect uses `user` in the body but `user?.id` in the deps array. Works, but fragile; make body and deps agree.
- The four gates serialize behind `useUser()`'s two sequential Supabase queries; total time-to-paint is now 3 round trips. Fine for now; a combined "bootstrap" endpoint is a future optimization, not a bug.

---

## 2. XP & gamification correctness

### 2.1 ❗ CRITICAL — The XP pipeline is severed in the middle (full trace)

The end-to-end path, with break points marked:

| Stage | Where | Status |
|---|---|---|
| Roleplay pass/fail + warmth | `ApplyPhase.tsx` (client state) | ✅ works |
| `xpEarned` computed | `ApplyPhase.tsx:430` → `xp.ts:9` | ✅ works (display only) |
| Persist session row | — nowhere — | ❌ **missing (§1.1)** |
| Staff hero XP | `/api/staff/xp-streak` = `SUM(roleplay_sessions.xp_earned)` | ⚠ correct code, always 0 (no rows) |
| Manager top performer | `/api/manager/dashboard:337-345` sums `roleplay_sessions.xp_earned` | ⚠ correct code, always null |
| Manager roster XP/level | `/api/manager/dashboard:423,448` reads **`users.xp`** | ❌ **wrong source — see 2.2** |
| Roster/insight streak | `/api/manager/dashboard:366,450` reads **`users.streak_days`** | ❌ **wrong source — see 2.2** |

### 2.2 HIGH — Two conflicting XP/streak sources; `users.xp` and `users.streak_days` are dead columns

**What:** Nothing in the codebase ever **writes** `users.xp` or `users.streak_days` (grep: only heartbeat writes `last_active`). Yet the manager roster derives `xp`, `level` (`Math.floor(xp/200)+1`), and `streak` from those columns, while the staff hero and the top-performer card compute the same numbers from `roleplay_sessions`. The xp-streak route's own comment declares "XP … is never read from or written to users.xp" — the manager dashboard violates that contract.

**Why it matters:** Once §1.1 is fixed, a staffer's hero will show e.g. 300 XP while their manager's roster shows 0 XP / L1 / 0-day streak. Inconsistent numbers destroy trust in the product's core mechanic.

**Proposed fix:** Make computed-from-sessions the single source of truth. In `/api/manager/dashboard`, replace roster `xp` with the already-built `xpByStaff` map, and compute streaks per staff from the same day-set logic as `/api/staff/xp-streak` (factor that streak function into a shared `lib/` helper). Then drop `users.xp`/`users.streak_days` from the SELECT (and eventually the schema).

### 2.3 MEDIUM — Streak is computed in UTC, not property-local time

**What:** `/api/staff/xp-streak/route.ts:74-95` buckets activity days as `Math.floor(Date.parse(ts)/86_400_000)` — pure UTC.

**Why it matters:** Hostia's clients are in Curaçao (UTC−4). A staffer who trains at 21:00 local on Monday and 21:00 local on Tuesday gets both credited correctly — but anyone training after 20:00 local (00:00 UTC) has their session credited to the **next** UTC day. Real pattern that breaks: train Mon 09:00 + Tue 20:30 → Tue's session lands on UTC-Wednesday, UTC-Tuesday is empty, and Wednesday morning the streak reads 1 instead of 3. Multiple sessions in one day are handled fine (Set dedup); midnight boundaries are wrong for evening shifts — which is *the* peak time for hospitality workers.

**Proposed fix:** Compute day indices with a fixed property timezone offset (all current clients are UTC−4: `Math.floor((ts - 4*3600_000)/DAY)`), or store a `timezone` column on `properties` and use it. Same helper should serve the manager dashboard once 2.2 lands.

**Also verified:** grace-day logic (today inactive doesn't break streak if yesterday active) is correct; `calculateRoleplayXP` tiers (50/60/75, 0 on fail) match `xp.ts` comments; `getModuleSkillScore` is currently unused by any live path (used only in mock `StaffProfile`).

### 2.4 LOW — Lesson XP (`lesson.xp`, `module.xpTotal`) is display-only

Lesson cards advertise "+15 XP" etc., but only roleplay XP is ever summed. Completing every Learn/Practice phase earns 0 actual XP. Either sum lesson XP from `lesson_completions` into the hero total, or stop advertising per-lesson XP. Decide in Phase 2.

---

## 3. UX / button consistency

### 3.1 HIGH — Dead primary buttons on the manager dashboard

- **"Send team nudge"** (`ManagerDashboard.tsx:734`) — no `onClick`. Renders as the header's primary CTA and does nothing.
- **All three InsightCard CTAs** ("Assign to team", "Send nudge", "View {name}") — `InsightCard.tsx:23` renders a `<button>` with no handler.
- **At-risk insight** says "A nudge … could re-engage them" with a "Send nudge" CTA that is dead.

**Why it matters:** A manager clicks these on day one and concludes the product is broken.
**Proposed fix:** Wire "View {name}" to `onOpenStaff`; either implement or **remove** the nudge/assign buttons until the feature exists (a dead button is worse than no button).

### 3.2 HIGH — Edit/remove staff on a *real* property only mutates local state

`ManagerDashboard.tsx:583-601`: `handleEdit` and `handleRemove` (the edit-modal path, incl. its "Remove from team" flow) only `setStaffList(...)`. On a real property the change silently reverts on the next refetch — and "Remove from team" **looks** like a delete but isn't one (the real delete lives on the row hover trash icon → `DeleteStaffModal` → API).

**Proposed fix:** On real properties, hide the edit-modal "Remove from team" button (route removal exclusively through `DeleteStaffModal`), and either persist edits via a new `PATCH /api/manager/staff/[userId]` (name only — role/dept/color aren't real columns) or mark the edit form demo-only.

### 3.3 MEDIUM — Failure fallback shows demo data to real managers

`ManagerDashboard.tsx:419-436`: any dashboard fetch failure → `setStatus('demo')` → the manager sees the **hardcoded mock roster** (Alex Morgan, 93%…) presented as if real. Same effect for the KPI row.
**Proposed fix:** Add an `'error'` status with a retry banner; never render mock data for a non-demo property.

### 3.4 MEDIUM — Double-submit and feedback gaps (inventory)

Audited every primary action across staff/manager/admin. Solid: admin client-detail page (busy flags, spinners, typed-confirm deletes, toasts), accept-invite, login, ApplyPhase send button, module toggles, overrides save, invite modal.

Gaps found:
- **`patchField` (admin client detail, `clients/[id]/page.tsx:457-474`)** — no in-flight guard and no optimistic-revert; rapid blur+change can race, last-write-wins with a stale "Saved" toast. Low likelihood, low fix cost (per-field busy flag).
- **Primary-color text input** — no hex validation before PATCH; garbage becomes `--brand-color` for every staff page. Validate `/^#[0-9a-fA-F]{6}$/`.
- **`cancelInvite`** uses `window.confirm` while every other destructive action uses the styled typed-confirm modal — inconsistent pattern.
- **PracticePhase empty-quiz button** says "Go to Apply" even when the lesson has no Apply phase (then it exits to the module). Label should branch like the results screen does.
- **LearnPhase/PracticePhase advance buttons** have no debounce, but `logLessonCompletion` is idempotent server-side, so double-fire is harmless. No action needed — noting as verified-safe.

### 3.5 MEDIUM — Login page is a different design system

`login/page.tsx` is Tailwind-utility dark theme (`#0D0D0D`, `#C8A97A` gold); every other page is the sand/CSS-variable system. Also says "Hostia" while TopNav brands "BY GLAD AI". Cosmetic but jarring as the first screen every user sees. Decide on one brand + one system.

### 3.6 LOW — Button style fragmentation

Three coexisting button vocabularies: `.btn-brand`/`.btn-ghost` classes (staff), fully inline styles (admin, manager modals), Tailwind (login). Disabled/loading treatments are ad-hoc per file (`opacity 0.5` vs `0.55` vs `0.6`; `cursor: 'default'` vs unchanged). **Proposed fix:** extract one shared `<Button variant loading disabled>` component in Phase 2+ (mechanical, low risk, big consistency win).

---

## 4. Security audit

### 4.1 ❗ CRITICAL — `POST /api/roleplay` is completely unauthenticated

**What:** `roleplay/route.ts:74` never checks `auth.getUser()` for the main flow (only the optional `getScenarioContext()` does, and it just returns null for anonymous callers). Middleware explicitly excludes `/api` (`middleware.ts:82`). Anyone on the internet can POST `{systemPrompt, staffMessage}` and get Claude responses billed to the Hostia Anthropic key. Worse, the **client supplies the entire system prompt**, so it's a general-purpose free LLM proxy. The rate limiter is an in-memory per-instance Map (resets every cold start, useless across serverless instances).

**Proposed fix:** (a) Require a signed-in user (401 otherwise) exactly like `/api/lesson-completions`; (b) stop accepting `systemPrompt` from the client — send `scenarioId` and look the prompt up server-side from `SCENARIOS` (this also fixes §5.1's `[Property]` substitution in one place); (c) keep the IP limiter as a bonus layer but add a per-user cap.

### 4.2 HIGH — Residual broken RLS on `roleplay_sessions` (staff INSERT + SELECT)

Covered in §1.1. Verified every other policy in the repo against the required pattern:

| Table | Policy pattern | Verdict |
|---|---|---|
| `lesson_completions` (staff ins/sel, mgr sel) | `IN (SELECT … WHERE auth_id = auth.uid())` | ✅ |
| `phase_completions` (staff ins/sel, mgr sel) | same | ✅ |
| `roleplay_sessions` manager SELECT (post-fix) | same | ✅ |
| `roleplay_sessions` staff INSERT/SELECT | `staff_id = auth.uid()` | ❌ broken |
| `manager_invites`, `property_overrides` | fully closed (`false`), service-role only | ✅ |
| `phases`, `module_phase_assignments` | public read (reference data) | ✅ acceptable |
| `storage.objects` property-logos | public read only, no client write | ✅ |

**Gap I could not verify from the repo (HIGH, action item):** there are **no migrations for `users`, `properties`, `modules`, or `property_modules`** — their RLS lives only in the live Supabase dashboard. `useUser.ts` reads `users` and `properties` directly from the browser, so *some* SELECT policy exists, but whether a staff member can read **other users' rows** (emails, names across properties) is unverifiable from code. **Phase 2 action:** dump live policies (`select * from pg_policies`) into a checked-in migration and review; ensure `users` SELECT is scoped to own-row + same-property-for-managers.

### 4.3 ✅ `/api/admin/*` — all server-side gated (verified route-by-route)

All 8 admin routes call `requireAdmin()` before any work: dashboard, properties (GET/POST), properties/[id] (GET/PATCH/DELETE), modules (POST/DELETE), managers (GET/POST), managers/[userId] (DELETE), invites/[inviteId] (DELETE), upload-logo. `requireAdmin` resolves via `auth_id` and checks `role === 'admin'` from the DB. `/api/library` (GET/POST) also checks admin role inline despite living outside `/api/admin/*`. Middleware adds a second layer for `/admin` pages. **No findings** beyond:
- MEDIUM: **`DELETE /api/admin/properties/[id]` will happily delete the demo property** (and with it the sales-demo data) — add a server-side guard on `DEMO_PROPERTY_ID`.
- LOW: `/api/library` naming — an admin-only route outside the `/api/admin` namespace invites future auditing mistakes; move it.
- LOW: `/api/library` POST does delete-all-then-insert with no transaction; a failure after the delete leaves the property with zero modules. Also `modules.map` throws (unhandled 500) on a non-array body.

### 4.4 ✅ `/api/manager/*` — property scoping verified

- `manager/dashboard`: property id comes from the **caller's own profile row**, never from the request; queries additionally run through RLS-bound client with explicit `.eq('property_id', …)`. ✅
- `manager/staff/[userId]` DELETE: verifies target `role === 'staff' && target.property_id === manager.property_id` before any admin-client deletion. ✅ Cross-property deletion blocked.
- `staff/create`: property forced to requester's own `property_id`. ✅
- LOW: `staff/create` allows a **manager** to create another **manager** (role whitelist is `['staff','manager']`). Same-property only, but manager→manager creation is privilege escalation-ish; restrict to `staff` unless intended.
- LOW: `manager/staff/[userId]` rejects admins (`role !== 'manager'`), while every other manager surface accepts `manager || admin` — inconsistent, admin can't delete staff.
- LOW: `staff/create` does `await request.json()` without try/catch → unhandled 500 on malformed JSON (every other route guards this).

### 4.5 MEDIUM — Logo upload validation can be bypassed

`upload-logo/route.ts`:
- `if (file.type && !ALLOWED_TYPES.has(file.type))` — an **empty** content-type skips validation entirely and stores as `application/octet-stream` (line 43, 69).
- Content-type is client-asserted; no magic-byte sniffing. A `.png`-named HTML/JS payload uploads fine.
- **SVG is allowed** → stored XSS vector. Mitigated by serving from `*.supabase.co` (not the app origin) and only ever being used in `<img>` tags, but a direct link executes scripts in the supabase.co context.
- `propertyId` is used raw as the storage folder (line 51) — not validated as UUID.

Admin-gated, so exploitation requires an admin account — hence MEDIUM not HIGH. **Proposed fix:** reject empty `file.type`; validate `propertyId` with a UUID regex; drop SVG from the allowlist (or sanitize); optionally sniff magic bytes for PNG/JPEG/WebP.

### 4.6 ✅ Secrets — clean, with one console leak

- `.env.local` is gitignored and was **never committed** (checked `git log --all -- '*.env*'`).
- `SUPABASE_SERVICE_ROLE_KEY` / `ANTHROPIC_API_KEY` are read only in server code; no client component imports `lib/supabase/admin` (verified). Only `NEXT_PUBLIC_` keys reach the bundle (anon key — by design).
- MEDIUM: **`login/page.tsx:32` logs the full auth result to the console** — `console.log('Auth result:', { data, error })` includes the session `access_token`/`refresh_token`. Tokens in console are exposed to browser extensions/screen-shares/support screenshots. Remove the log.
- LOW: invite links hardcode `APP_ORIGIN = 'https://hostia-core.vercel.app'` (`managers/route.ts:11`) — breaks silently on a custom domain later; move to env.
- ✅ `next.config.ts` ships sane security headers (X-Frame-Options DENY, nosniff, referrer-policy).

---

## 5. General bug sweep

### 5.1 HIGH — `[Property]` / `[Property Name]` placeholders shown to real users

The white-label substitution was never finished. All user-visible occurrences:

| Where | What renders |
|---|---|
| `HomeView.tsx:531` | "**[Property Name] standard**" heading on the gold-standard quote card — every staff home page, real clients included |
| `ApplyPhase.tsx:645` | textarea placeholder "Respond as the server at **[Property]**…" in every roleplay |
| `scenarios.ts` `description`/`opening` fields (lines 30, 36, 72, 104, 201…) | "…walked through the door of **[Property]**" in the pre-start briefing and the opening system message of roleplays |
| `scenarios.ts` `systemPrompt`s (~20 occurrences) | the AI guest is told it's at "[Property]" — model replies can literally echo "[Property]" to staff |
| `ManagerDashboard.tsx:1010` | "Remove {name} from **[Property]**?" in the edit-modal remove confirm |
| `TopNav.tsx:26`, `ManagerDashboard.tsx:407` | fall back to `PROPERTY.name` = "[Property Name]" whenever `property` is null |
| `config.ts:7-19` | the source `PROPERTY` constant (name, manager: 'Manager', etc.) |

**Proposed fix:** thread the real property name everywhere: (a) pass `property.name` into `HomeView`/`ApplyPhase`; (b) do the `[Property]` → name substitution server-side in the roleplay route (natural once §4.1 moves prompts server-side) and client-side for `description`/`opening` at render; (c) replace `PROPERTY.name` fallbacks with a neutral string ("your property") or the loading gate. The `property_name` override key already exists in the admin panel — it's just never consumed.

### 5.2 MEDIUM — "Module 0" and 0% hero on non-legacy modules

`ModuleView.tsx:96` computes the module number from a hardcoded 6-id list (`['greetings','service-flow',…]`). Every other module — onboarding, `casual-dining-standard`, `casual-dining-floor`, all five fine-dining modules — renders "**Module 0**". Also `ModuleView.tsx:110` shows `module.progress` (hardcoded `0` in `curriculum.ts` for real-data paths) so the hero says "Progress 0%" even when `completedLessons` (line 115, real data) says 3/4.
**Proposed fix:** number modules by their position in the resolved curriculum (pass the index in), and derive hero progress from `completedLessons/totalLessons`.

### 5.3 MEDIUM — Staff hero greets everyone as "Welcome back, there"

`HomeView.tsx:426`: `firstName = viewingAs ? … : 'there'`. Real staff never see their own name even though `user.full_name` is available one level up in `staff/page.tsx`. Pass it down.

### 5.4 MEDIUM — Hero Continue button ignores real progress

`HomeView.tsx:441-443`: `currentModule` picks by hardcoded mock fields (`m.progress`, `l.status === 'current'`), not by real completions. Real staff always get "Continue: The 5-Second Rule"-style labels pointing at the first available module's hardcoded 'current' lesson regardless of what they actually finished — while the sentence above it (from `/api/staff/home-progress`) names the *correct* module. **Proposed fix:** have home-progress return the module id (not just title) and use it for the CTA.

### 5.5 Console noise / lint (verified by running eslint + tsc)

`tsc --noEmit` is clean. `eslint` reports **16 errors, 9 warnings**, notably:
- `react-hooks/set-state-in-effect` errors in `useHomeProgress`, `accept-invite`, `admin/clients/[id]`, `login` (cascading-render pattern; works today, will fight React Compiler).
- `react-hooks/purity` error in `ApplyPhase.tsx:145` (`Date.now()` in `useRef` initializer).
- `react/no-unescaped-entities` errors in HomeView/LearnPhase/login/ManagerDashboard (dashboard "Good evening." etc. — cosmetic but they're build-blocking if `next build` lint isn't disabled).
- Dead code warnings: `fineDiningAnticipatoryLessons` never used (`curriculum.ts:2181`), `DEMO_PROPERTY_ID` unused in `admin/page.tsx:10`, `healthPrev` unused in manager dashboard, `totalXp` unused in HomeView.
- Runtime console: `login` logs auth result (§4.6); `useUser` logs profile/property fetch errors (fine); roleplay retries `console.warn` (fine).

### 5.6 Routes & links — all checked, two notes

All `<Link>`/`router.push`/`fetch` targets resolve to real routes. Notes:
- `/` redirects to `/manager` unconditionally (`page.tsx`) → staff users bounce `/` → `/manager` → middleware → `/staff`. Works, but redirecting by role in the root page would save a hop. LOW.
- Manager "View as" (`/staff?as=<id>`): `staff/page.tsx:26` looks the id up in the **mock STAFF array**, so for a real roster row the param silently no-ops and the manager sees *their own* staff view believing it's the staffer's. MEDIUM — either implement real view-as or hide the button on real rosters.

### 5.7 Data consistency (schema-level, from migrations)

- `lesson_completions.module_id`/`lesson_id` and `module_phase_assignments.module_id`/`phase_id` are free TEXT with no FK — orphanable if curriculum ids ever get renamed (already happened once: "Module 5 replaced with Menu Knowledge" in git history — old completions for removed lesson ids now count toward nothing). LOW now, worth an integrity-check script in Phase 2.
- `roleplay_sessions`/`lesson_completions` deletes are handled in dependency order in both delete routes ✅, but `lesson_completions` has `ON DELETE CASCADE` while `roleplay_sessions` does **not** (plain `REFERENCES`) — one more reason property deletion must keep its manual ordering. Consider adding CASCADE for symmetry.
- `phase_completions` has no writer yet (exam feature pending) — expected, not a bug.

---

## 6. Architecture health

### 6.1 HIGH — Three-way phase-assignment drift (`module_phase_assignments` vs hardcoded `phase_id`)

The system has **three competing sources** for "which phase does a module belong to":

1. **`module_phase_assignments` table** — used by `/api/curriculum` (the staff-facing path). ✅ the intended design.
2. **Hardcoded `phase_id` in `curriculum.ts`** — only 2 modules have it (`casual-dining-standard`, `casual-dining-floor`, both `casual-dining-phase-1`). Used by **the admin client-detail Module Library** (`clients/[id]/page.tsx:954-977`), which groups by `CURRICULUM.filter(m => m.phase_id === ph.id)`.
3. **`modules.phase_id` DB column** (seeded by `add_phases_architecture.sql`) — read by nothing in the app anymore.

**Concrete breakage today:** on a **fine-dining** property's admin page, the two casual-dining modules have a `phase_id` that matches none of the fine-dining phases and are excluded from the "to be categorized" bucket (`!m.phase_id` is false) — they **vanish from the admin module library entirely** and can never be assigned/unassigned there. Meanwhile all fine-dining modules (no hardcoded `phase_id`) show under "To be categorized" even when `module_phase_assignments` has them properly assigned — admin UI contradicts what staff actually see.

**Proposed fix:** the admin client-detail page should fetch `module_phase_assignments` (filtered to the property's track phases, same as `/api/curriculum:136-140`) and group by that; delete the `phase_id`/`order_in_phase` fields from `curriculum.ts` so the static file can't drift again.

### 6.2 MEDIUM — `/admin/library` is hardcoded to the demo property

`admin/library/page.tsx:28`: `const PROPERTY_ID = 'f86752e5-…'` (the demo id, duplicated as a raw string). The nav's "Module Library" page **only ever edits the demo property's assignments**, via delete-all-then-insert (§4.3). An admin reasonably believes they're editing a global library. Either scope it per-client (it duplicates the client-detail module section anyway — consider deleting the page) or label it loudly as demo-only.

### 6.3 MEDIUM — Demo property isolation: mostly good, three leaks

Verified isolation points: `xp-streak` ✅ short-circuits, `home-progress` ✅, `curriculum` ✅, `manager/dashboard` ✅, admin dashboard ✅ (separates demo card, excludes from MRR), `useStaffXPAndStreak` ✅ demo constants.

Leaks/risks:
1. **`DEMO_PROPERTY_ID` is defined three times** (`config.ts:5` canonical; `admin/page.tsx:10` unused dupe; `admin/library/page.tsx:28` live dupe). One id change breaks silently. Import from `config.ts` everywhere.
2. **Demo detection relies on `property` loading** — `HomeView.tsx:436` checks `property?.id === DEMO_PROPERTY_ID`; if the properties fetch in `useUser` fails, a demo user is treated as real (and vice-versa fallbacks). Minor, but worth a server-decided `isDemo` flag as the single authority (the APIs already return one — the client should trust only that).
3. **No delete guard** on the demo property (§4.3).

### 6.4 Verified healthy

- `resolveCurriculum` correctly treats `property_modules` as the source of truth for selection/order and `CURRICULUM` for content only; inactive modules never reach staff; unknown ids dropped safely.
- `property_modules` writes are consistent across admin add/remove (idempotent POST, scoped DELETE).
- Env handling (`createAdminClient` reads env at request time), middleware role gates, and the auth callback are sound.
- Both feature branches (`feat/casual-dining-standard-module`, `feat/completed-lesson-indicators`) are merged into main and pushed — no stranded work.

---

## Priority-ordered fix plan (proposed Phase 2 sequence)

| # | Fix | Findings | Size |
|---|---|---|---|
| 1 | RLS migration for `roleplay_sessions` staff policies | 1.1/4.2 | S |
| 2 | `POST /api/roleplay-sessions` route + ApplyPhase persistence | 1.1/2.1 | M |
| 3 | Auth + server-side prompts on `/api/roleplay` | 4.1 | M |
| 4 | `[Property]` substitution everywhere | 5.1 | M |
| 5 | Manager dashboard XP/streak from sessions (kill `users.xp`) | 2.2 | M |
| 6 | Streak timezone fix (shared helper) | 2.3 | S |
| 7 | Dead buttons: wire or remove; real-property edit/remove | 3.1/3.2 | M |
| 8 | Admin phase-grouping from `module_phase_assignments`; fix/remove `/admin/library` | 6.1/6.2 | M |
| 9 | Demo-property guards (single constant, delete guard, error≠demo) | 3.3/6.3 | S |
| 10 | Small security: login console.log, upload content-type, JSON guards, hex validation | 4.5/4.6/3.4 | S |
| 11 | Cosmetics: Module 0, "there" greeting, hero CTA, lint errors | 5.2–5.5 | M |
| 12 | Push-reminder hook + live-RLS dump into repo | 1.2/4.2 | S |

---
*Phase 1 complete. No code has been modified. Awaiting review before any fixes.*
