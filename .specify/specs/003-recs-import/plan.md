# Implementation Plan: RECS Import

**Branch:** `003-recs-import` | **Date:** 2026-10-23 | **Spec:** [spec.md](./spec.md)
**Gate:** lifted by the owner on 2026-10-23; build now. Nothing is added to the candidate repo (spec Gate line).
**Contract:** RECS `docs/spec.md` §10.8 (FR-10.8.1, FR-10.8.2, DM-7), `docs/decisions.md` D-108 (2), read-only.

## Summary

A public `/import` page reads a deal from the URL fragment, holds it in `sessionStorage`
across sign-in or sign-up, and saves it with one click to a new `recs_deals` table through a new
`recs-deal` backend module. The hub lists saved deals last, below the audit cards, with
"Open in RECS" (`<NEXT_PUBLIC_RECS_URL>/calculators/<c>#d=<d>`) and delete. The payload `d` is
opaque text from end to end. `?ref=recs` becomes a signup source. No AI, worker, identity or
RECS code is touched.

## Technical Context

| Item | Value |
|---|---|
| Language / runtime | TypeScript; Node (Express backend), Next.js App Router (frontend) |
| Primary dependencies | Existing only: Express, Prisma, `@paralleldrive/cuid2`, express-rate-limit, Next.js. **No new dependency.** |
| Storage | PostgreSQL via Prisma; one new table `recs_deals` with RLS |
| Testing | Backend: Jest + ts-jest + supertest (route tests with a mocked repository, as `growth/service.test.ts` mocks Prisma). Frontend: Jest + React Testing Library. One RECS round trip by hand. |
| Target platform | Railway (staging), Docker images `backend/Dockerfile`, `frontend/Dockerfile` |
| Project type | Web app: `backend/` + `frontend/` |
| Performance goals | Save, list and delete each one indexed query; list returns at most a user's own rows (no pagination in v1, see research R9). **Targets (constitution IX):** p95 server time under 200 ms for POST, GET and DELETE `/recs-deals` on staging with 100 deals for the user; `/import` interactive (Save clickable) within 1 s of arrival on a cold load. Verified in T041. |
| Constraints | `d` ≤ 8,000 chars, never decoded; fragment never sent to our server before Save; EN + FR; per-user brake 120/min |
| Scale | Beta: tens to hundreds of users, a handful of deals each |

No NEEDS CLARIFICATION remains; the six design questions are settled in [research.md](./research.md).

## Constitution Check

| Principle | How the plan complies | Status |
|---|---|---|
| I. Simplicity | One table, one module (four files, as every module), one page, one hub component, three small lib files (fragment, data access, return path). No dedup, no purge job, no shared package. | Pass |
| II. Dependencies | None added. | Pass |
| III. Code structure | Module keeps routes / service / repository split; validation is a pure function in its own file with a co-located test (as `auth/validation.ts`). Fragment parsing and stash live in `frontend/lib/recs-import.ts`, separate from the page. Data access for the page and the hub section lives in `frontend/lib/recs-deals-api.ts` (`saveRecsDeal`, `listRecsDeals`, `deleteRecsDeal`); the two components call it and render, they do not call `api` themselves ("a file that fetches data MUST NOT also render UI"). | Pass |
| IV. Data | `deleted_at` soft delete; CUID2 `public_id` in every URL and response; new append-only migration; FKs and the list filter indexed; nullable `deleted_at` documented. | Pass |
| V. APIs | All writes server-side; routes mounted after `authenticate, userLimiter, setTenantContext`; standard `{ error: { code, message, details } }` and `{ data }` shapes; snake_case via existing middleware. | Pass |
| VI. AuthN/Z | Centralized `authenticate` middleware; every query filters by `tenantId` and `userId`, pinned by a repository test (T039); another user's deal is 404. `AuthProvider` reloads the page when the token changes in another tab (T040), so `/import` never offers Save for a stale identity. No new role. | Pass |
| VII. Frontend | `/import` and the hub section are client components. **Documented reason:** the fragment, `sessionStorage` and the `localStorage` token exist only in the browser, and the hub page is already a client component. Validation in browser (UX) and server (correctness). Optimistic delete, no spinner on fast calls. Semantic buttons/links, keyboard reachable. | Pass (justified) |
| VIII. Testing | Unit tests for both validators and the fragment parser, route tests with supertest, a repository test asserting the isolation filters (Prisma mocked, as `growth/service.test.ts`), component tests for the page and the list. All mocked, fast. One manual round trip (critical path). | Pass |
| IX. Performance | Index `(tenant_id, user_id, deleted_at, created_at)` serves the only list query. Explicit targets in Technical Context, measured on staging in T041 before `/ship`. | Pass |
| X. Security | Name sanitized before storing: both validators turn control characters into spaces and remove bidi formatting characters before trimming (cleaned, not refused, because RECS accepts any non-blank name; research R3); `d` is never touched; rendered as text (React escaping), never as markup; `d` validated against a strict alphabet before storage and before building the RECS link; `next` allow-listed (no open redirect); account deletion purges rows. | Pass |
| XI. Governance | No amendment needed. | Pass |

**Post-design re-check:** unchanged after Phase 1. One justified deviation: the known-slug list is
kept in two files (backend and frontend) because the two services build from separate root
directories on Railway; a drift test makes them one source in practice (research R1).

## Project Structure

### Documentation (this feature)

```text
.specify/specs/003-recs-import/
├── spec.md
├── plan.md                 # this file
├── research.md             # R1–R10 decisions
├── data-model.md           # recs_deals, slug list, signup source
├── quickstart.md           # run, test, round trip
├── contracts/
│   ├── recs-deals-api.md   # POST/GET/DELETE /api/v1/recs-deals
│   └── import-link.md      # the RECS-facing URLs (inbound /import, outbound Open in RECS)
├── checklists/requirements.md
└── tasks.md
```

### Source code (files touched)

```text
backend/
├── config/recs.json                                   # NEW known-slug list (authoritative)
├── Dockerfile                                         # + COPY config ./config (runtime stage)
├── prisma/schema.prisma                               # + model RecsDeal, relations on Tenant/User
├── prisma/migrations/<ts>_add_recs_deals/migration.sql # NEW table, indexes, FKs, RLS
├── scripts/delete-user.ts                             # + recsDeal purge
└── src/
    ├── main.ts                                        # + app.use('/api/v1/recs-deals', ...)
    └── modules/recs-deal/
        ├── routes.ts  service.ts  repository.ts  types.ts   # NEW
        ├── validation.ts + validation.test.ts                # NEW pure rules
        ├── routes.test.ts                                    # NEW supertest, repo mocked
        └── repository.test.ts                                # NEW isolation filters, Prisma mocked

frontend/
├── config/recs.json                                   # NEW copy of the slug list
├── config/recs.drift.test.ts                          # NEW: equals backend/config/recs.json; every slug has EN+FR label
├── lib/recs-import.ts + recs-import.test.ts           # NEW parse/validate fragment, stash/take, openInRecsUrl
├── lib/recs-deals-api.ts                              # NEW saveRecsDeal / listRecsDeals / deleteRecsDeal (data access only)
├── lib/next-path.ts + next-path.test.ts               # NEW allow-listed ?next=
├── lib/auth-context.tsx + auth-context.test.tsx       # reload on cross-tab token change
├── lib/signup-source.ts (+ test)                      # reads utm_source, else ref
├── app/import/page.tsx + page.test.tsx                # NEW public client page
├── app/login/page.tsx, app/register/page.tsx          # honour ?next=, carry it across their cross-links
├── components/hub/recs-deals.tsx + recs-deals.test.tsx # NEW hub section
├── app/(authenticated)/hub/page.tsx                   # mount section last
├── locales/en.json, locales/fr.json                   # import.*, hub.recs_deals.*, recs.calculator.*
└── .env.local.example                                 # comment: NEXT_PUBLIC_RECS_URL also builds Open in RECS

docs/deploy.md                                         # slug procedure, /import, retention
PRD_InvestorOS_Identity_Platform.md                    # Amendments section, §7 cross-reference
.specify/specs/001-identity-platform/contracts/api-v1.md # pointer to this feature's contract
```

**Structure decision:** existing modular monolith; one new module, same four-file shape as
`contact/`. Frontend follows the existing client-side auth pattern (`useAuth`, `api`).

## Phase outline (for /speckit-tasks)

- **A. Data and API:** schema + migration → slug config → validation (+ tests) → repository/service/routes (+ route tests) → mount → delete-user purge.
- **B. Import and return path:** `recs-import.ts` (+ tests) → `next-path.ts` (+ tests) → signup source `ref` → `/import` page (+ tests) → login/register `next` → locales.
- **C. Hub list:** `recs-deals.tsx` (+ tests) → mount on hub.
- **D. Docs and release:** PRD amendments, deploy.md, `.env.local.example`, api-v1 pointer, round trip against local RECS for all eight slugs, CHANGELOG and 0.5.0.0 via `/ship`.

Order constraints: A before C's integration; B's lib before the page; drift test as soon as both config files exist. Candidate tests (`Desktop/investoros/src/app/import/__tests__/`, `e2e/recs-import.spec.ts`) are read for cases, ported by hand, never edited there.

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Slug list in two files | Railway builds `backend/` and `frontend/` from separate root dirs; neither image can see the other | A slugs endpoint the page calls first adds a request and a loading state to the import page; a shared root file needs both Dockerfiles rebuilt around a repo-root context |
| Client components for `/import` and the hub list | Fragment, `sessionStorage` and the auth token are browser-only | Server rendering cannot see the fragment by design (that is the privacy property) |
