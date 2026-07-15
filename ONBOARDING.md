# Client Onboarding

How a new Hostia client goes from nothing to staff-in-training. The in-app
**setup checklist** on the client's admin page tracks steps 1–6 live; this
document is the full picture, including everything outside the app.

## The short version

1. Admin creates the property (name + venue type + branding) — Phase 1 modules
   auto-assign.
2. Admin writes the scenario context (guided template available).
3. Admin invites the manager; manager accepts and sets a password.
4. Manager creates staff accounts from their dashboard.
5. Staff log in and train. Done.

## Step by step

### 1. Create the property — `Admin → New Client`

- **Name** — the real venue name. It substitutes the `[Property]` placeholder
  across all curriculum and roleplay content, so spell it the way a guest would
  say it.
- **Venue type** — this is the biggest decision: it selects the curriculum
  track (`casual-dining`, `fine-dining`, `fast-casual`), its phases, and its
  certification exams. Changing it later regroups the module library but does
  **not** re-assign modules.
- **Primary color + logo** — the brand color feeds `--brand-color` on every
  staff page; the logo shows in the top nav and manager dashboard. Both can be
  added later.

On creation the track's **Phase 1 modules are assigned automatically** (same
set as the Module Library's "Assign all" button). Later-phase modules are
assigned as their content ships.

### 2. Property configuration — `Admin → client page`

The **setup checklist** at the top shows what's still missing. Work through it:

- **Module Library** — verify the auto-assigned set; toggle anything the
  client doesn't want. Modules are grouped per phase; the exam line per phase
  is automatic and not assignable.
- **Overrides**:
  - `scenario_context` *(required before launch)* — the venue paragraph that
    seeds every AI roleplay prompt. Use the **guided template** (venue type,
    location, menu, service style) and edit the result. Write it like you'd
    brief a new hire: concrete menu items, service style, the vibe.
  - `property_name` — only when the display name should differ from the
    property record's name.
  - `manager_name` — the manager name staff see referenced in content.
- **Custom overrides** — any additional key/value pairs content might read.

### 3. Manager account — `Admin → client page → Managers`

1. **Invite Manager** — enter name + email; copy the generated link and send
   it yourself (no automated email today). The link **expires in 7 days**.
2. The manager opens the link (`/accept-invite`), sets their password, and
   lands on their dashboard.

### 4. Staff accounts — `Manager dashboard → Add staff member`

Managers create staff one at a time (name, email, password, role). Tell the
manager to do this in the walkthrough call — it's their tool, not admin's.

### 5. Launch checks

- Log in as a staff test account (create one via the manager) and confirm:
  the brand color/logo render, the curriculum shows the right track's Phase 1,
  and a roleplay scenario mentions the venue by name (proves
  `scenario_context` + name substitution work).
- The manager dashboard shows the team roster.

## Conventions

- **Review/test accounts** use `julian.grosfeld+<tag>@gmail.com` (e.g.
  `+fcreview`) so they're identifiable and disposable.
- **Deleting a property** (Danger Zone) permanently removes every manager,
  staff account, and all training data — type-to-confirm guarded, and the
  demo property is not deletable.

## What's config vs. code

| Layer | Source | Per-client work |
|---|---|---|
| Curriculum, scenarios, exams | `src/lib/curriculum.ts`, `scenarios.ts`, `exam.ts` — per track | none |
| Module → phase mapping & order | `module_phase_assignments` table — per track | none |
| Module set | `property_modules` — per property | auto-assigned on create; adjust in Module Library |
| Branding | `properties` row | name, color, logo |
| Roleplay venue context | `property_overrides.scenario_context` | written per client |
| Accounts | Supabase Auth + `users` | manager invite + staff creation |

Adding a whole new **track** (not just a client) is a code change: phases +
`module_phase_assignments` rows (SQL), track content in `curriculum.ts` /
`scenarios.ts`, and an exam config in `exam.ts`.
