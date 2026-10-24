# Tasks: RECS Import

**Feature:** 003-recs-import
**Generated:** 2026-10-23
**Total Tasks:** 41 (T039–T041 added by /speckit-analyze remediation; numbered after T038 so existing references stay valid)
**Inputs:** [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)
**Gate:** lifted by the owner on 2026-10-23; start now. Never edit the candidate repo (spec Gate line).
**Tests:** included. The constitution (VIII) requires co-located tests and the spec's success criteria 1, 4, 8 and 9 are verified by them. Write each story's tests first and see them fail.
**Ported cases:** read the candidate's `Desktop/investoros/src/app/import/__tests__/` and `e2e/recs-import.spec.ts` for cases; never edit that repo.

Supersedes the provisional R001–R019 list in `docs/recs-import-status.md` §3 (mapping in the last section).

---

## User Story Mapping

| Story | Spec scenario | Priority | Phase |
|-------|---------------|----------|-------|
| US1 | Signed-in investor saves a deal | P1 | 3 |
| US2 | New visitor signs up and keeps the deal | P1 | 4 |
| US3 | Finding, reopening and deleting a saved deal | P1 | 5 |
| US4 | Invalid or empty import link | P2 | 6 |
| US5 | French-speaking investor | P2 | 7 |

---

## Phase 1: Setup

**Goal:** the slug list exists in both services and ships in the backend image.

- [X] T001 Create `backend/config/recs.json` with `{ "calculators": [ { "slug": … } ] }` for the eight slugs in data-model.md order: multifamily, quick-screen, single-family, fix-and-flip, brrrr, wholesaling, subject-to, short-term-rental (no labels; add a top-level `"_about"` string naming RECS §10.8 and the add-a-slug procedure in quickstart §5)
- [X] T002 [P] Create `frontend/config/recs.json` as a byte-identical copy of `backend/config/recs.json`
- [X] T003 [P] Add `COPY config ./config` to the runtime stage of `backend/Dockerfile` (next to `COPY scripts ./scripts`)

---

## Phase 2: Foundational (blocks every story)

**Goal:** table, validation rules on both sides, and the fragment parser. No user-visible change yet.

- [X] T004 Add `model RecsDeal` exactly as in data-model.md to `backend/prisma/schema.prisma`, plus `recsDeals RecsDeal[]` back-relations on `Tenant` and `User`
- [X] T005 Create migration `backend/prisma/migrations/<UTC timestamp>_add_recs_deals/migration.sql` with `npx prisma migrate dev --create-only --name add_recs_deals`, then append the RLS block (`ENABLE ROW LEVEL SECURITY` + policy `tenant_isolation` on `"recs_deals"`) copied in style from `20260404200000_add_growth_strategy_engine/migration.sql`; run `npx prisma generate`
- [X] T006 [P] Write `backend/src/modules/recs-deal/validation.test.ts`: valid deal passes and returns the trimmed name; unknown slug → field `c`; non-string fields; name of spaces → `name`; 120 emoji passes, 121 code points fails; `d` of 8,000 passes, 8,001 fails; `d` with `+`, `/`, `=`, space, `%` fails → `d`; name `"Elm\tSt\u202E"` passes and returns `"Elm St"`; a name made only of control and bidi characters fails → `name`; an emoji ZWJ sequence passes unchanged; first failing field order is `c`, `name`, `d`; `d` returned unchanged
- [X] T007 Implement `backend/src/modules/recs-deal/validation.ts`: `loadKnownSlugs(path = 'config/recs.json')` (reads with `fs.readFileSync` relative to `process.cwd()`, throws a clear error if missing or if `calculators` is not a non-empty array of `{ slug: /^[a-z0-9-]{1,64}$/ }`), `KNOWN_SLUGS` loaded once at module load, and `validateRecsDeal(body)` returning `{ c, name, d }` or throwing `AppError('VALIDATION_ERROR', message, 400, [{ field }])` (`details` is an array in `error-handler.ts`); length by `[...name].length`; for the name, replace `/[\u0000-\u001F\u007F-\u009F]/g` with a space and remove `/[\u202A-\u202E\u2066-\u2069]/g`, then trim, then count (constitution X; clean, never refuse: RECS's `text()` schema accepts any non-blank string, so refusing would lose a deal RECS sent); `d` against `/^[A-Za-z0-9_-]{1,8000}$/`; message never includes `d`
- [X] T008 [P] Create `backend/src/modules/recs-deal/types.ts` with `RecsDealInput { c; name; d }` and `RecsDealView { id; c; name; d; createdAt }`
- [X] T009 [P] Write `frontend/lib/recs-import.test.ts`: `parseImportFragment` on `#c=multifamily&n=Elm%20St&d=abc_-` → object; leading `#` optional; names with `&`, `#`, `%`, quotes, emoji, Arabic, encoded by `encodeURIComponent`, round-trip exactly; `d` taken raw (a `%41` in `d` is rejected, not decoded); malformed `%E0%A4` in `n` → null; missing key → null; duplicate key → first wins; unknown slug, oversize `d`, 121-code-point name → null; `n=Elm%09St%E2%80%AE` → name `Elm St`; `openInRecsUrl("https://recs.example/", "brrrr", "abc")` → `https://recs.example/calculators/brrrr#d=abc`, and returns null when the base is empty; `stashImport`/`readImport`/`clearImport` round-trip through `sessionStorage` and survive a throwing `sessionStorage`
- [X] T010 Implement `frontend/lib/recs-import.ts`: hand parser (research R2), the same three rules as T007 (including the same name cleaning, before trimming) with the slug list imported from `@/config/recs.json`, `isKnownSlug`, `stashImport`/`readImport`/`clearImport` on key `investoros_recs_import` (try/catch like `lib/signup-source.ts`), `openInRecsUrl(base, c, d)`
- [X] T011 [P] Create `frontend/config/recs.drift.test.ts`: reads `../backend/config/recs.json` with `fs` and asserts deep equality with `frontend/config/recs.json` (labels are asserted by T014 and T034, so this test passes from the start)

**Checkpoint:** `cd backend && npx jest src/modules/recs-deal` and `cd frontend && npx jest lib/recs-import` pass, and so does `npx jest config/recs.drift`.

---

## Phase 3: US1, signed-in investor saves a deal (P1) 🎯 MVP

**Goal:** a signed-in user opens a RECS link, sees name and calculator, presses Save, and the deal is stored.
**Independent test:** sign in, open the quickstart §3 link, Save; `SELECT c, name, d FROM recs_deals ORDER BY id DESC LIMIT 1` shows the sent values with `d` identical; address bar shows `/import`; reload shows nothing to import.

- [X] T012 [P] [US1] Write `backend/src/modules/recs-deal/routes.test.ts` (supertest; build an Express app with `express.json()`, a stub that sets `req.user = { userId: 1, tenantId: 1 }`, `snakeCaseResponse`, the router, `errorHandler`; mock `./repository.js`): POST happy path → 201 `{ data: { id, c, name, created_at } }` with the trimmed name; each invalid case from contracts/recs-deals-api.md → 400 `VALIDATION_ERROR` with `details[0].field`; repository receives `d` unchanged; two identical POSTs → two create calls (no dedup)
- [X] T013 [US1] Implement `createRecsDeal(tenantId, userId, input)` in `backend/src/modules/recs-deal/repository.ts` (`generatePublicId()` from `shared/utils/id.js`), `createRecsDeal(userId, tenantId, input)` in `service.ts` returning `{ id: publicId, c, name, createdAt }` as ISO, and `POST /` in `routes.ts` calling `validateRecsDeal(req.body)` (mirror `contact/routes.ts` try/next style); mount `app.use('/api/v1/recs-deals', recsDealRoutes)` in `backend/src/main.ts` after `/api/v1/growth-strategy`
- [X] T014 [P] [US1] Add EN strings to `frontend/locales/en.json`: `recs.calculator.<slug>` for the eight slugs (labels in data-model.md), `import.title` ("A deal from your calculator"), `import.from` ("From {{calculator}}"), `import.signed_in_as` ("Saving to {{email}}"), `import.save`, `import.saving`, `import.cancel`, `import.saved` ("Saved. You'll find it in your hub."), `import.go_to_hub`, `import.error` (generic save failure with retry); in the same change, extend `frontend/config/recs.drift.test.ts` to assert every slug has a `recs.calculator.<slug>` key in `en.json`
- [X] T015 [P] [US1] Write `frontend/app/import/page.test.tsx` (mock `useAuth`, `@/lib/recs-deals-api`, `next/navigation`; set `window.location.hash` and spy on `history.replaceState`): signed in with a valid fragment → shows name and calculator label, never the payload; `replaceState` called with `/import`; Save calls `saveRecsDeal({ c, name, d })` exactly and shows the saved state with a hub link; Cancel posts nothing and clears the stash; reload with empty hash but a stash present → still offers Save; after Save the stash is empty
- [X] T016 [US1] Implement `frontend/app/import/page.tsx` (`"use client"`, comment citing research R4 for why it is a client component): on mount, if `location.hash` parses → `stashImport`; `rememberSignupSource(location.search)`; `history.replaceState(null, "", "/import")`; render from `readImport()`; signed-in view with name (text node, never `dangerouslySetInnerHTML`), calculator label via `t("recs.calculator." + c)`, `import.signed_in_as` with the user's email, Save (`saveRecsDeal` from a NEW `frontend/lib/recs-deals-api.ts` holding only `api.post("/recs-deals", …)`; the page never imports `api` (constitution III); then `clearImport`, show saved state) and Cancel (`clearImport`, `router.push("/hub")`); wrap in the same `SiteHeader` shell as `app/login/page.tsx`; style with existing tokens only

**Checkpoint:** US1 independent test passes; `npx jest src/modules/recs-deal app/import` green.

---

## Phase 4: US2, new visitor signs up and keeps the deal (P1)

**Goal:** a signed-out visitor sees the deal first, signs in or registers, returns to `/import`, saves; the account's signup source is `recs`.
**Independent test:** signed out, open the quickstart §3 link → name shown → Create an account → back on `/import` with the same deal → Save; `SELECT signup_source FROM users ORDER BY id DESC LIMIT 1` → `recs`.

- [X] T017 [P] [US2] Write `frontend/lib/next-path.test.ts`: `/import` allowed; `null`, `""`, `/dashboard`, `//evil.com`, `/\\evil.com`, `https://evil.com`, `/import?x=1`, `%2Fimport`, `/import/../admin` → null
- [X] T018 [P] [US2] Implement `frontend/lib/next-path.ts`: `const ALLOWED_NEXT = ["/import"]`; `safeNextPath(value: string | null): string | null` by exact match
- [X] T019 [P] [US2] Extend `frontend/lib/signup-source.ts`: read `utm_source`, else `ref`, same regex and storage; update the header comment; create the co-located `frontend/lib/signup-source.test.ts` (none exists yet) with (`?ref=recs` → `recs`; `utm_source` wins over `ref`; invalid `ref` ignored)
- [X] T020 [P] [US2] Add a case to `backend/src/modules/auth/validation.test.ts` pinning `signup_source: "recs"` as accepted by `validateRegisterInput`
- [X] T021 [US2] Honour `?next=` in `frontend/app/login/page.tsx` (`useSearchParams`; after `login` → `router.push(safeNextPath(next) ?? "/dashboard")`; the "create an account" link becomes `/register?next=/import` when `next` is valid) and in `frontend/app/register/page.tsx` (`router.push(safeNextPath(next) ?? "/hub")`; the "sign in" link carries `next`); wrap the `useSearchParams` consumer in `<Suspense>` if the Next build requires it for these pages
- [X] T022 [P] [US2] Add EN strings: `import.signed_out_hint` ("Sign in or create a free account to keep this deal."), `import.sign_in` ("Sign in to save"), `import.create_account` ("Create an account") in `frontend/locales/en.json`
- [X] T040 [P] [US2] In `frontend/lib/auth-context.tsx`, listen for the `storage` event on key `token` (removed in cleanup): a new or changed token re-runs the `/auth/me` validation from the mount effect (extract it to one function), a removed token clears `user` and `token`. Write `frontend/lib/auth-context.test.tsx` for both cases. Covers the spec edge case "signs in in another tab and returns" (Simplified at /ship, 2026-10-24: any token change from another tab now reloads the page, after forgetting the held deal when this tab's session ended (a sign-out, or any sign-in over it); the per-account revalidation kept surfacing new races.)
- [X] T023 [US2] Add the signed-out view to `frontend/app/import/page.tsx`: same name and label, then links to `/login?next=/import` and `/register?next=/import`; while `useAuth().loading` render nothing instead of flashing the signed-out view; extend `frontend/app/import/page.test.tsx` with signed-out cases (links carry `next`, no POST), the stash surviving an unmount/remount (navigation through `/login`), `?ref=recs` stored as the signup source, and the signed-out view switching to the signed-in view (with Save) when `useAuth` changes without a remount

**Checkpoint:** US2 independent test passes; `npx jest lib/next-path lib/signup-source lib/auth-context app/import` green.

---

## Phase 5: US3, finding, reopening and deleting a saved deal (P1)

**Goal:** the hub lists saved deals last with name, calculator, date, Open in RECS and delete.
**Independent test:** with two saved deals, `/hub` shows both newest first below the audit cards; Open in RECS's href equals `<NEXT_PUBLIC_RECS_URL>/calculators/<c>#d=<stored d>`; delete one → gone, and gone after reload; a second account sees neither.

- [X] T039 [P] [US3] Write `backend/src/modules/recs-deal/repository.test.ts` (mock `../../shared/db.js` as `growth/service.test.ts` does): `listRecsDeals` queries with `where` containing `tenantId`, `userId` and `deletedAt: null`, ordered `createdAt desc`; `findRecsDealByPublicId` `where` contains `publicId`, `userId`, `tenantId` and `deletedAt: null`; `softDeleteRecsDeal` sets `deletedAt` and filters by `tenantId`; `createRecsDeal` passes `d` unchanged. This is what pins SC-8; the route tests in T024 only see a mocked repository
- [X] T024 [P] [US3] Extend `backend/src/modules/recs-deal/routes.test.ts`: GET returns `{ data: [ { id, c, name, d, created_at } ] }` in repository order with `d` equal to what was stored; DELETE of a found id → 204 and the repository soft-delete called with the internal id and tenant; DELETE of an id the repository does not find (absent, deleted, other user) → 404 `NOT_FOUND`
- [X] T025 [US3] Implement in `backend/src/modules/recs-deal/repository.ts`: `listRecsDeals(userId, tenantId)` (`deletedAt: null`, `orderBy: { createdAt: 'desc' }`), `findRecsDealByPublicId(publicId, userId, tenantId)` (filters `userId` and `deletedAt: null` too, so another user's id or an already-deleted one is not found), `softDeleteRecsDeal(id, tenantId)`; in `service.ts`: `listRecsDeals` mapping to `RecsDealView`, `deleteRecsDeal` throwing `AppError('NOT_FOUND', 'Deal not found.', 404)`; in `routes.ts`: `GET /` and `DELETE /:dealId` → 204
- [X] T026 [P] [US3] Add a `recsDeal.updateMany({ where, data: { name: 'deleted', d: '', deletedAt: now } })` step inside the transaction of `backend/scripts/delete-user.ts` and its count to the printed summary
- [X] T027 [P] [US3] Add EN strings: `hub.recs_deals.title` ("Deals from your calculators"), `hub.recs_deals.saved_on` ("Saved {{date}}"), `hub.recs_deals.open` ("Open in RECS"), `hub.recs_deals.delete`, `hub.recs_deals.confirm_delete` ("Delete this deal?"), `hub.recs_deals.empty` ("Send a deal from a calculator and it will appear here."), `hub.recs_deals.empty_link` ("Open the calculators") in `frontend/locales/en.json`
- [X] T028 [P] [US3] Write `frontend/components/hub/recs-deals.test.tsx` (mock `@/lib/recs-deals-api`; set and unset `process.env.NEXT_PUBLIC_RECS_URL`): renders rows newest first with name, label, date; Open in RECS href is exact and byte-for-byte for a `d` with `-` and `_`, `target="_blank"`, `rel="noopener noreferrer"`; no Open link when the variable is unset; delete asks to confirm, then calls `deleteRecsDeal(<id>)` and removes the row (optimistic, restored on error); empty list → empty state with calculators link when the variable is set, nothing when unset; fetch failure → renders nothing
- [X] T029 [US3] Add `listRecsDeals()` and `deleteRecsDeal(id)` to `frontend/lib/recs-deals-api.ts`, then implement `frontend/components/hub/recs-deals.tsx` (client component, never imports `api`): call `listRecsDeals` on mount; section with `<h2>`, a list of rows, date via `toLocaleDateString(locale)`, Open link built with `openInRecsUrl`, inline confirm on delete (two buttons, keyboard reachable); empty state links with `RecsLink`
- [X] T030 [US3] Mount `<RecsDeals />` last in `frontend/app/(authenticated)/hub/page.tsx`, below the audit cards and any disclosure message

**Checkpoint:** `cd backend && npx jest src/modules/recs-deal` and `cd frontend && npx jest components/hub config/recs.drift` green; US1–US3 together are the full hand-off; the quickstart §3 walkthrough passes end to end.

---

## Phase 6: US4, invalid or empty import link (P2)

**Goal:** a missing or bad deal never errors and never saves.
**Independent test:** open `/import`, `/import#c=nope&n=x&d=a`, `/import#c=brrrr&n=x&d=a+b` → each shows "nothing to import" with a link; no request to `/recs-deals`.

- [X] T031 [P] [US4] Add EN strings `import.nothing_title` ("Nothing to import"), `import.nothing_body` ("This link has no deal we can read. Send it again from the calculator."), `import.nothing_link_hub` ("Go to your hub"), `import.nothing_link_home` ("Go to the home page") in `frontend/locales/en.json`
- [X] T032 [US4] Add the nothing-to-import view to `frontend/app/import/page.tsx` (shown when neither the fragment nor the stash yields a deal; links to `/hub` when signed in, `/` when signed out; an invalid fragment does not overwrite a valid existing stash) and the cases from the independent test plus a server 400 on Save (shows `import.error`, keeps the stash) to `frontend/app/import/page.test.tsx`

---

## Phase 7: US5, French-speaking investor (P2)

**Goal:** every new string exists in French; the deal name is never translated.
**Independent test:** switch to FR; `/import` and the hub section show French text and the name as sent.

- [X] T033 [US5] Add every `import.*`, `hub.recs_deals.*` and `recs.calculator.*` key from T014, T022, T027, T031 to `frontend/locales/fr.json` (calculator labels from data-model.md; tutoiement/vouvoiement as the existing FR file does)
- [X] T034 [US5] Extend `frontend/config/recs.drift.test.ts` to require every slug's label in `fr.json` too, and to assert that every `import.*` and `hub.recs_deals.*` key in `en.json` exists in `fr.json`

---

## Phase 8: Polish and cross-cutting

- [X] T035 [P] Add an "Amendments" section at the end of `PRD_InvestorOS_Identity_Platform.md` with row 1 (date of merge; "RECS hand-off: deals sent from RECS calculators are stored as opaque payloads and listed in the hub; the contract is RECS `docs/spec.md` §10.8 (FR-10.8.1, FR-10.8.2, DM-7) and D-108; Investor OS never decodes the payload (RECS calls this app InvestorsMap); spec `.specify/specs/003-recs-import/`"), and a note on §7's "Property Deal Analyzer" row that calculators live in RECS and arrive through this hand-off
- [X] T036 [P] Update `docs/deploy.md` (the `NEXT_PUBLIC_RECS_URL` row also builds "Open in RECS"; `backend/config/recs.json` ships in the image and the API will not start without it; the add-a-slug procedure from quickstart §5; `/import` in the route list; retention: `recs_deals` kept until the user deletes or the account is deleted, no scheduled purge), the comment on `NEXT_PUBLIC_RECS_URL` in `frontend/.env.local.example`, a pointer to `contracts/recs-deals-api.md` in `.specify/specs/001-identity-platform/contracts/api-v1.md`, and `recs-deal` in the module list in `CLAUDE.md`
- [X] T037 Run the full suites (`cd backend && npm test`, `cd frontend && npm test`, `npx tsc --noEmit` in both, `npm run build` in frontend), then the quickstart §4 round trip against a local RECS for all eight slugs (Send → Save → hub → Open in RECS shows the identical summary strip → delete); record each slug's result, the browser and the RECS commit in `.specify/specs/003-recs-import/qa.md`; mark the row of `docs/recs-import-status.md` §2 for each built item
- [ ] T041 On staging after T037, run the checks no unit test can make and record each one, with its method and result, as a row of `qa.md`: (SC-5) during the signed-out → register → Save walkthrough, capture the backend and frontend service logs (`railway logs`) and the browser's network panel (HAR export) and confirm the `d` string appears in no request before the POST; (SC-8) with two accounts, account B gets 404 on GET-then-DELETE of account A's deal id and does not see it in its list; (SC-2) seconds from arrival to the saved state for a signed-in user, by stopwatch, three runs; (SC-6) `npm run funnel -- 1` from `backend/` lists `recs` after a test signup; (IX, API) with a fresh test user, 100 sequential `curl -s -o /dev/null -w '%{http_code} %{time_total}\n'` calls per endpoint, in this order: POST ×100 (which creates the deals), GET ×100 (so the list holds 100 deals), DELETE ×100 on the ids the POSTs returned; `sleep 0.6` between calls so the user stays under the per-user brake (120/min), and the run is void if any call returns 429; p95 = the 95th of the sorted times, target < 200 ms (client-measured, so it includes network: a miss within network latency of the target is recorded, not failed, and explained); (IX, page) `/benchmark` on a cold `/import` load, target Save clickable < 1 s; (IX, hub) size and time of `GET /recs-deals` and the hub load with 100 deals (the list returns every payload; added at T038, decide pagination or dropping `d` from the list from this number). A missed target is fixed before T038
- [X] T038 Ship via `/review` → `/qa` → `/cso` (new public route, redirect handling, user content rendering) → `/ship` (CHANGELOG entry, version 0.5.0.0), then tell the owner that RECS's `VITE_INVESTORSMAP_URL` can move to this repo's origin (a RECS-side change, not made from here)

---

## Dependencies

```text
Setup T001 → T002, T003
Foundational: T004 → T005;  T006 → T007;  T009 → T010;  T001+T002 → T011
US1: T005+T007+T008 → T013 (after T012);  T010+T014 → T016 (after T015)
US2: T016 + T040 → T023;  T018 → T021;  T017 → T018;  T019, T020, T022, T040 independent
US3: T013 → T025 (same files, after T024 and T039);  T010+T027 → T029 (after T028) → T030;  T026 after T004/T005
US4: T016 → T032
US5: T014+T022+T027+T031 → T033 → T034
Polish: T035, T036 any time; T037 after all stories; T041 after T037; T038 last
```

Story order: US1 → US2 → US3 are all P1 and together make the hand-off usable; US3's backend
(T024–T026) can run in parallel with US2. US4 and US5 depend only on the page and the strings.

## Parallel examples

- **Foundational:** T006, T008, T009, T011 at once (four different files), then T007 and T010.
- **US1:** T012, T014, T015 together; then T013 and T016 in parallel (backend vs frontend).
- **US2:** T017, T019, T020, T022, T040 together; then T018 → T021; T023 last.
- **US3:** T024, T039, T026, T027, T028 together; then T025 and T029 in parallel; T030 last.
- **Polish:** T035 and T036 alongside any story.

## Implementation strategy

1. **MVP = Phases 1–3 (US1).** A signed-in user can save a deal and the row is correct. Demo by hand-built link.
2. **+ US2** makes it work for strangers from RECS (the conversion case). Do not set RECS's
   `VITE_INVESTORSMAP_URL` to this origin before US2 and US3 ship.
3. **+ US3** completes the round trip: run T037's RECS check here, not later.
4. **US4, US5, Polish** before release; all of them are small.

## Mapping from the status doc's provisional plan

R001–R002 → T004–T005; R003 → T001–T003, T011; R004 → T007–T008, T013, T025; R005 → T026;
R006 → T006, T012, T024, T039; R007 → T036; R008 → T009–T010; R009 → T016, T023, T032; R010 → T017–T018,
T021, T040; R011 → T019–T020; R012 → T014, T022, T027, T031, T033; R013 → T028–T029; R014 → T030;
R015 → T028; R016 → T035; R017 → T036; R018 → T037, T041; R019 → T038.
