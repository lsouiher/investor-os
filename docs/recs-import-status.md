# RECS import: status of the InvestorsMap side of the hand-off

**Date:** 2026-10-23. **Branch of record:** `master` at a9c03bb (v0.4.1.0, brand v0.4 merged).
**Verdict:** nothing of the import has been built here. Not on `master`, not on the one other
branch, not in a stash, not in a local-only branch. The only RECS-facing code in this repo is
the "Calculators" link, which is a different requirement (RECS D-105, not §10.8).

This note records what was checked, what the contract asks for item by item, and a proposed
task list. It is read-only with respect to RECS: nothing under `~/projects/recs` was edited.

## 1. What exists

### 1.1 Searches run (all on 2026-10-23, after `git fetch --all --prune`)

| Check | Result |
|---|---|
| `git log --all -i --grep="import\|recs\|hand-off\|handoff"` | 6 commits. Five are the brand.md work of 2026-10-22/23 (`2e562e4`, `ee30d87`, `5ed3020`, `ec331b8`, `3f0b5f7`); one is a 2026-09-12 test commit matching "import" in the ordinary TypeScript sense. None touches an import page or a deals table. |
| `git grep -il "recs_deals\|#d=\|Open in RECS\|/import\|InvestorsMap"` over `origin/master`, `origin/004-french-language`, `HEAD` | Hits only in the two `package-lock.json` files and `docs/deploy.md` (the `NEXT_PUBLIC_RECS_URL` row). No source file. |
| `git log --all -S"recs_deals"`, `-S"Open in RECS"` | No commit ever added or removed either string. |
| `git stash list` | Empty. |
| `git branch -vv` | Two local branches, `master` and `004-french-language`, both tracking origin and in sync. No unpushed branch. |
| `git branch -r` | `origin/master`, `origin/004-french-language`. Nothing else on the remote. |
| `backend/prisma/schema.prisma` | 15 models (`tenants` … `export_history`). No model whose name or `@@map` contains "deal". |
| `backend/prisma/migrations/` | Five migrations, last one `20260913050000_launch_beta_fields`. No `deal` anywhere in their SQL. |
| `frontend/app/` | Routes: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/terms`, and the authenticated group (`audits`, `contacts`, `dashboard`, `growth-strategy`, `hub`, `identity`, `simulation`, `strategies`, `tasks`). No `/import`. |
| `PRD_InvestorOS_Identity_Platform.md` | No "RECS", "§10.8" or "amendment". "Deal" appears only as audit questions, the post-MVP "Deal Pipeline with Identity Scoring" (V3.1) and "Property Deal Analyzer" (V3.2) rows in §7, and §4.2 / §5.5 about identity-scored deals. |
| `docs/` | `brand-notes.md` and `deploy.md` mention RECS only for brand.md and the Calculators link. `docs/decisions/` and `docs/architecture/` are empty directories. No design note for an import. |
| `TODOS.md`, `CHANGELOG.md` | No RECS, import, deal or hand-off entry. |
| `.specify/specs/` | `001-identity-platform` and `002-ui-personalization` only. No feature folder for the import. |

### 1.2 The RECS-related code that does exist (and is not the import)

All of it landed in `5ed3020` (2026-10-22, "brand(5): navy header band, wordmark, active-route
line, Calculators link"), merged to `master` in PR #9 on 2026-10-23, pushed, not deployed:

- `frontend/components/shared/recs-link.tsx` (+ test): a "Calculators" anchor to
  `NEXT_PUBLIC_RECS_URL`, opened in a new tab, rendered nowhere when the variable is empty.
- Used in `frontend/components/shared/site-header.tsx` and
  `frontend/app/(authenticated)/layout.tsx` (header and sidebar).
- `NEXT_PUBLIC_RECS_URL` in `frontend/.env.local.example`, `frontend/Dockerfile` (build arg)
  and the `docs/deploy.md` variable table. `nav.calculators` in `frontend/locales/{en,fr}.json`.

This satisfies RECS D-105's "a plain link" in the other direction. It provides none of FR-10.8.2.
It is, however, the one piece FR-10.8.2's "Open in RECS" will reuse: the RECS base URL is already
a configured, documented build variable.

### 1.3 Two things that will help the build

- `users.signup_source` (v0.4.0) records `?utm_source=` from the landing page via
  `frontend/lib/signup-source.ts` (sessionStorage, regex-validated, consumed at register). RECS
  sends `?ref=recs`, which this code does not read today. Extending it to accept `ref` is a
  one-line change and gives the funnel report RECS arrivals for free.
- `backend/scripts/delete-user.ts` is the account-deletion purge. It blanks every user-owned
  table in one transaction. A `recs_deals` row joins that list.

## 2. The contract, item by item

Source: `~/projects/recs/docs/spec.md` §10.8 FR-10.8.2 and DM-7; `~/projects/recs/docs/decisions.md`
D-108 (2), (3), (4). Related: D-105, D-112, D-264, Q-14, Q-17 to Q-27, Appendix A row 8.
Everything below is **missing** unless marked otherwise.

| # | Requirement (FR-10.8.2 / DM-7 / D-108 (2)) | Status | Notes |
|---|---|---|---|
| 1 | `/import` page reads the fragment `#c=<slug>&n=<name>&d=<payload>` from `<origin>/import?ref=recs` | **missing** | Must be client-side: a fragment never reaches the server, and that is the point of the design (RECS I5, D-02). |
| 2 | Keeps the fragment across sign-in or sign-up | **missing** | Neither `/login` nor `/register` takes a return path today; login lands on `/dashboard`, register on `/hub`. The authenticated layout redirects to `/login` with no `next`. |
| 3 | Shows the deal name and asks the user to confirm before storing | **missing** | `n` is URL-encoded; `d` is shown to no one. |
| 4 | Stores `{ c, name, d }` for the user | **missing** | No endpoint, no module. |
| 5 | Validation: `c` in a known-slug list | **missing** | RECS Q-17 to Q-27 assume a `config/recs.json` here. Registered RECS slugs today: `multifamily`, `quick-screen`, `single-family`, `fix-and-flip`, `brrrr`, `wholesaling`, `subject-to`, `short-term-rental`. RECS hides Send until the list here has the slug and `VITE_INVESTORSMAP_URL` is set. |
| 6 | Validation: `name` under 120 characters | **missing** | |
| 7 | Validation: `d` under 8,000 base64url characters, never decoded | **missing** | RECS caps `d` at 7,997 (D-112 (2)) so every stored deal reopens. We store opaque text; no lz-string, no schema (D-108 (3)). |
| 8 | `recs_deals` table: `id`, `user_id`, `c`, `name`, `d`, `created_at`, `deleted_at` (DM-7) | **missing** | Plus `tenant_id` and `public_id` (CUID2) per this repo's constitution; soft delete via `deleted_at`. |
| 9 | Hub section "Deals from your calculators": name, date, delete, "Open in RECS" | **missing** | "Open in RECS" = `<RECS URL>/calculators/<c>#d=<d>`. The URL base exists as `NEXT_PUBLIC_RECS_URL` (**partial**: the variable and its plumbing are built). |
| 10 | Retention and account-deletion purge as for other rows | **missing** | `delete-user.ts` is the purge path; `recs_deals` is not in it. Retention is "90 days recommended, manual purge for now" (data-model.md), so there is nothing scheduled to extend. |
| 11 | A second send adds a row; dedup is our choice | **missing** | Proposal: no dedup in v1 (DM-7 says RECS sends no id, so equality would have to be on `d`, and two edits of one deal are legitimately two rows). |
| 12 | PRD amendment row naming RECS spec §10.8 as the contract (D-108 (4)) | **missing** | The PRD has no amendments section; one must be added. §7's "Property Deal Analyzer, V3.2" row should also note that calculators live in RECS and arrive by this hand-off. |
| 13 | RECS acceptance: a sent deal opened from the list shows an identical summary strip (round trip) | **missing** | Follows from 7 and 9 if `d` is stored and echoed byte for byte. Worth one end-to-end check against a local RECS build before `VITE_INVESTORSMAP_URL` is set. |
| 14 | `?ref=recs` is countable in our logs (D-105) | **partial** | Request logs see the query string; nothing records it. Extending `signup-source.ts` to read `ref` makes it a funnel source. |

FR-10.8.3 (InvestorsMap computes on sent deals, P2) is out of scope: it depends on RECS's
engine package (P2-10) and our deal pipeline (PRD V3.1). Nothing here should decode `d`.

## 3. Proposed task list

Sized the way `.specify/specs/001-identity-platform/tasks.md` sizes tasks: one task is one
file or one closely related set of files, `[P]` where it can run in parallel with its
neighbours. Roughly a two-day feature. Numbering is provisional; the spec-kit pass
(`/speckit-specify` → `/speckit-plan` → `/speckit-tasks`) would renumber it under a
`003-recs-import` folder. No identity, AI, or worker code is touched.

### Phase A: Data and API (backend)

- [ ] R001 Add `RecsDeal` model to `backend/prisma/schema.prisma` (`@@map("recs_deals")`): `id`, `publicId` (CUID2), `tenantId`, `userId`, `c` (varchar 64), `name` (varchar 120), `d` (text, opaque), `createdAt`, `deletedAt`; index `(user_id, deleted_at, created_at)`.
- [ ] R002 Migration `add_recs_deals` with the table, the index and the RLS policy in the style of `20260404200000_add_growth_strategy_engine`. Append-only.
- [ ] R003 [P] `backend/config/recs.json`: the known-slug list, starting with the eight registered RECS slugs. Loaded once at start; a missing file disables the endpoint with a clear log line.
- [ ] R004 New module `backend/src/modules/recs-deal/` (`types.ts`, `repository.ts`, `service.ts`, `routes.ts`): `POST /api/v1/recs-deals` body `{ c, name, d }` → 201 `{ data: { id, c, name, created_at } }`; `GET /api/v1/recs-deals` → list (name, date, `c`, `d`, newest first, soft-deleted excluded); `DELETE /api/v1/recs-deals/:id` → soft delete. Validation per §2 items 5 to 7 (`c` in the list, `name` 1 to 120 after trim, `d` matches `^[A-Za-z0-9_-]{1,8000}$`). `d` is never parsed. Mount in `backend/src/main.ts` behind auth and the per-user brake.
- [ ] R005 [P] Add `recsDeal.updateMany({ d: '', name: 'deleted', deletedAt: now })` to `backend/scripts/delete-user.ts`.
- [ ] R006 Contract tests co-located in the module: happy path; unknown slug 400; 121-character name 400; 8,001-character `d` 400; `d` with a `+` or `/` 400; the stored `d` equals the sent `d`; another user's deal is 404; delete then list omits it.
- [ ] R007 Add the three routes to `.specify/specs/001-identity-platform/contracts/api-v1.md` (or the new feature's contracts file).

### Phase B: Import page and auth return path (frontend)

- [ ] R008 `frontend/lib/recs-import.ts`: `parseImportFragment(hash)` → `{ c, name, d } | null` (URL-decodes `c` and `n`, leaves `d` untouched), with the same bounds as the API; `stashImport` / `takeImport` on `sessionStorage` (same pattern and lifetime as `signup-source.ts`). Unit tests, including a name with `&`, `#`, `%` and non-ASCII (the D-112 (5) cases).
- [ ] R009 `frontend/app/import/page.tsx` (public route, client component): reads the fragment on mount, stashes it, strips the hash from the address bar (`history.replaceState`) so a later reload or share does not re-import. Signed in: shows the deal name and the calculator's label with "Save to InvestorsMap" and "Cancel". Signed out: see open question 3. Invalid or absent fragment: a short "nothing to import" message with a link to the hub.
- [ ] R010 Return path: `/login` and `/register` accept `?next=/import` (allow-list of relative paths, no open redirect) and `rememberSignupSource` also reads `ref` so `?ref=recs` is recorded as the signup source. The authenticated layout's redirect to `/login` carries `next` for `/import`.
- [ ] R011 `frontend/lib/signup-source.ts` test update and a contract test that `signup_source: "recs"` is accepted by `validateSignupSource` (it already matches the regex; the test pins it).
- [ ] R012 EN and FR strings for the page and the hub section (`import.*`, `hub.recs_deals.*`) in `frontend/locales/{en,fr}.json`.

### Phase C: Hub list

- [ ] R013 `frontend/components/hub/recs-deals.tsx`: "Deals from your calculators" with name, calculator label, date, "Open in RECS" (`${NEXT_PUBLIC_RECS_URL}/calculators/${c}#d=${d}`, new tab, `rel="noopener noreferrer"`) and delete with an inline confirm. Hidden when the list is empty and `NEXT_PUBLIC_RECS_URL` is unset; shows an empty state when the variable is set and the list is empty. Reuses `RecsLink`'s env handling.
- [ ] R014 Mount the section on the page chosen in open question 1, below the audit cards.
- [ ] R015 Component tests: renders rows, Open in RECS href is exact (byte-for-byte `d`), delete calls the API and removes the row.

### Phase D: Docs, ops and release

- [ ] R016 PRD amendment: add an "Amendments" section to `PRD_InvestorOS_Identity_Platform.md` with row 1: "2026-xx-xx, RECS hand-off: deals sent from RECS calculators are stored as opaque payloads and listed in the hub; the contract is RECS `docs/spec.md` §10.8 (FR-10.8.1, FR-10.8.2) and D-108. InvestorsMap never decodes the payload." Cross-reference from §7's "Property Deal Analyzer" row.
- [ ] R017 `docs/deploy.md`: `backend/config/recs.json` and the slug-list procedure (add the slug here, deploy, then RECS sets `VITE_INVESTORSMAP_URL`, per RECS Q-17); `/import` in the route list; retention sentence. `frontend/.env.local.example` comment for the new use of `NEXT_PUBLIC_RECS_URL`.
- [ ] R018 Round-trip check against a local RECS build (RECS Appendix A row 8 acceptance): Send → sign up → hub lists name and date → Open in RECS shows the identical summary strip → delete removes it. Record the result in the feature's QA note.
- [ ] R019 CHANGELOG entry and version bump (0.5.0.0: a new table and a new public route) via `/ship`.

Dependencies: R001 → R002 → R004 → R006; R003 ∥ R005 ∥ R008; R008 → R009 → R010; R004 + R009 → R013 → R014 → R015; R018 after everything; R016 and R017 any time.

## 4. Open questions

1. **Which hub page hosts the list?** `/hub` is the identity hub (five audit cards and progressive
   disclosure); `/dashboard` is the return-visit page (identity snapshot, active strategy, priority
   tasks). RECS says "the hub". Recommendation: `/hub`, below the audit cards, because the section
   is a library the user curates, not a daily surface, and the dashboard is already three sections
   deep on a phone. Revisit when the deal pipeline (PRD V3.1) exists; the list moves there.

2. **How does purge run?** Account deletion is covered by extending `delete-user.ts` (R005).
   Time-based retention has no runner in this repo yet: data-model.md says "90 days recommended,
   manual purge for now, scheduled task post-MVP". Options: (a) no time-based purge for
   `recs_deals`, as for contacts and tasks, which are also kept until the account goes; (b) a
   Bull repeatable job on the existing Redis worker that hard-deletes rows with `deleted_at`
   older than 30 days, which would be the first scheduled purge in the codebase and would also
   suit `password_reset_tokens`. Recommendation: (a) for v1, stated in `docs/deploy.md`; (b) as a
   follow-up TODO so soft-deleted rows do not accumulate forever.

3. **Signed-out visitor: confirmation before or after sign-in?** FR-10.8.2 says "keeps it across
   sign-in or sign-up, shows the name for confirmation, then stores". Two readings:
   (a) `/import` shows the deal name immediately, with "Sign in to save" / "Create an account"
   buttons, and after auth returns to `/import` where a one-click "Save" completes it; (b) `/import`
   redirects straight to sign-in and the confirmation appears only afterwards. Recommendation: (a).
   A stranger arriving from RECS should see what they are about to save before being asked for
   an account; it is also the better conversion screen (the deal name is the hook). The stash is
   session-scoped, so an abandoned sign-in leaves nothing behind. Either way the fragment is
   stashed before any navigation, so a redirect through `/login` cannot lose it.

4. **Dedup.** Recommendation: none in v1 (§2 item 11). If the list fills with near-duplicates in
   the beta, dedup on exact `(user_id, c, d)` with a "saved again" notice is a one-line unique
   index later.

5. **Scope of the known-slug list.** Start with all eight registered RECS slugs so RECS can set
   `VITE_INVESTORSMAP_URL` once; or start with the two v1 calculators and extend as RECS ships?
   Recommendation: all eight. The list only gates what we accept to store; it carries no
   calculator knowledge, so there is no cost to being generous and a coordination cost to being
   strict (RECS Q-17 to Q-27 each wait on it).

## 5. Not in scope

- FR-10.8.3 / P2-17 (computing on sent deals). Needs RECS P2-10 and our deal pipeline.
- Any shared cookie, database or RECS-facing API (RECS D-105, D-264 forbid them; the future
  link is OpenID Connect).
- Decoding `d` for display. The hub shows `name` and `c` only.
