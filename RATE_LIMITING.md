# Rate limiting

Two layers, deliberately different in what they can see:

| Layer | Where | Keys on | Catches |
|---|---|---|---|
| **App limits** (implemented) | `src/lib/rate-limit.ts` + Postgres counters | **user id**, or IP on public routes | cost abuse and brute-forcing by a signed-in account |
| **Vercel Firewall** (to configure) | Vercel dashboard, at the edge | IP / path | volumetric floods, before a function ever runs |

The app layer is the one that can stop a logged-in staffer brute-forcing the
exam; the edge layer is the one that makes a flood cost nothing. Neither
replaces the other.

---

## App limits

**Counters live in Postgres** (`supabase/migrations/add_rate_limits.sql`),
because they must be shared across serverless instances. The limiter this
replaced was an in-memory `Map` in the roleplay route: on Vercel each instance
had its own copy and every cold start reset it, so the real ceiling was
`limit × instance count` — it loosened precisely as load rose.

Every limit is declared in one place, `LIMITS` in `src/lib/rate-limit.ts`:

| Route | Limit | Why |
|---|---|---|
| `POST /api/roleplay` | 60/min per IP, then 20/min + 500/day per user | Anthropic spend — the only route that costs money per call |
| `POST /api/exam` | 5 per 10 min per user | grading is server-side, so unlimited submissions converge on the answer key |
| `POST /api/accept-invite` | 10/hour per IP | unauthenticated Supabase **auth user creation** |
| `GET /api/accept-invite` | 20/min per IP | only place an anonymous caller drives service-role DB reads |
| `POST /api/staff/create` | 30/hour per user | caps mass account creation from one compromised manager |
| `POST /api/admin/upload-{logo,menu}` | 40/hour per user | each upload consumes storage (menus up to 10 MB) |
| `POST /api/roleplay-sessions` | 60/hour per user | bounded by how fast roleplays can legitimately finish |
| `POST /api/lesson-completions` | 120/hour per user | these rows are the basis of XP and streaks |
| `GET /api/manager/dashboard`, `GET /api/admin/dashboard` | 60/min per user | the most expensive reads in the app (up to 10k sessions + 20k completions) |

**Keyed on user id, not IP**, wherever there is a session. Staff in one
restaurant share a NAT address, so an IP limit would throttle a whole team
together while leaving one account roaming across IPs unlimited.

**Fail-open.** If the RPC errors, the request is allowed and the failure is
logged as `[rate-limit] RPC failed`. A limiter outage must not become an app
outage — but it does mean **the limits do nothing until the migration is
applied**. Grep the Vercel logs for that prefix to confirm they're live.

**Fixed window, not sliding.** A caller can spend up to 2× a limit across a
window boundary. That's the accepted cost of one atomic UPSERT per check; these
limits exist to stop runaway spend and brute-forcing, not to meter usage.

### Applying it

Run `supabase/migrations/add_rate_limits.sql` in the Supabase SQL editor. It
creates the `rate_limits` table (RLS on, zero policies — service role only) and
the `consume_rate_limit()` function, revoking execute from `anon` and
`authenticated` so nobody can burn another subject's budget by passing their id.

### What is NOT covered here

**Login.** `src/app/login/page.tsx` calls `supabase.auth.signInWithPassword`
directly from the browser — it never touches our server, so no code we write can
throttle it. Password-guessing protection is **Supabase's own auth rate limits**
(Dashboard → Authentication → Rate Limits). Worth confirming those are set to
something sane; that is the only control over login attempts.

---

## Vercel Firewall rules (to add in the dashboard)

Edge rules reject before the function runs, so floods don't consume invocations
or Postgres round trips. Configure under **Project → Firewall → Rate limiting**
(rate-limit rules require a Pro plan). Suggested rules, all keyed on IP:

| Rule | Match | Limit | Action |
|---|---|---|---|
| Roleplay flood | path `/api/roleplay` | 100 / 1 min | Deny (429) |
| Invite acceptance | path `/api/accept-invite` | 30 / 1 hour | Deny |
| API blanket | path starts with `/api/` | 600 / 1 min | Challenge |
| Login page | path `/login` | 60 / 1 min | Challenge |

Set these **above** the app limits, not below. The edge layer is there to absorb
volumetric abuse; the per-user app limits should stay the binding constraint for
normal traffic, since they are the ones that can tell users apart.
