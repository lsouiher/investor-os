# Research: RECS Import

Decisions taken during `/speckit-plan` (2026-10-23). The owner's product decisions are in
`docs/recs-import-status.md` §4 and the spec's Clarifications; these are the technical ones.

## R1. Where the known-slug list lives

- **Decision:** `backend/config/recs.json` is authoritative. `frontend/config/recs.json` is a
  copy. A frontend test (`frontend/config/recs.drift.test.ts`) fails if the two differ and if any
  slug lacks an EN or FR label in the locale files. The backend reads its file once at start from
  `config/recs.json` relative to the working directory (the backend root in dev, in Jest and in
  the Docker image, `WORKDIR /app`) and **fails to start** if it is missing or malformed; the
  runtime stage of `backend/Dockerfile` gains `COPY config ./config`. Shape:
  `{ "calculators": [ { "slug": "multifamily" }, … ] }`. Labels are in the locale files, not here.
- **Rationale:** Railway builds the two services from separate root directories (`docs/deploy.md`),
  so neither image can read the other's files. The brand.md drift test is the precedent for a
  copy plus a test. Failing at start is easier to delete than a "disabled" code path and the
  health check catches it before traffic.
- **Alternatives:** a `GET /recs-deals/calculators` endpoint (one more request and a loading state
  on the page a stranger lands on); `import` of the JSON into TypeScript (blocked: `rootDir` is
  `src`); a "disabled if missing" mode (status doc R003 suggested it; rejected as a silent
  failure that RECS would see as broken Send buttons).

## R2. Parsing the fragment

- **Decision:** split `location.hash.slice(1)` on `&`, then each pair on the first `=`, by hand.
  `c` and `n` go through `decodeURIComponent` (a malformed `%` sequence means invalid); `d` is
  taken as the raw characters and only checked against `^[A-Za-z0-9_-]{1,8000}$`. Duplicate keys:
  first wins. Unknown keys: ignored.
- **Rationale:** `URLSearchParams` turns `+` into a space and percent-decodes every value; that is
  harmless for a valid `d` but it would hide a tampered one instead of rejecting it, and "never
  decoded" should be literal. The hand parser is about ten lines.
- **Alternatives:** `URLSearchParams` (above); a library (constitution II).

## R3. Name length

- **Decision:** trim, then count **code points** (`[...name].length`), 1 to 120. Column
  `varchar(120)`, which Postgres also counts in characters. Same function on both sides.
- **Rationale:** `string.length` counts UTF-16 units, so a 100-emoji name would be "200" in JS
  and 100 in Postgres. Counting code points makes the browser, the API and the column agree.
- **Alternatives:** `.length` (disagrees with the DB); grapheme clusters via `Intl.Segmenter`
  (closer to "what a person sees", but Postgres cannot enforce it; overkill).
- **Cleaning (added by /speckit-analyze, 2026-10-23):** before trimming, C0/C1 control characters
  become a space and bidi formatting characters (U+202A–U+202E, U+2066–U+2069) are removed, on
  both sides. Constitution X asks to sanitize before storing, and a U+202E can make one deal's
  name read as another's. Refusing such names was rejected: RECS's `text()` schema accepts any
  non-blank string (read at RECS `5463018`), so a refusal loses a deal RECS sent. The payload `d`
  carries RECS's own copy of the name, so reopening in RECS is unaffected.

## R4. Holding the deal across sign-in

- **Decision:** on arrival `/import` writes `{ c, name, d }` to `sessionStorage`
  (`investoros_recs_import`), records `?ref=` via `rememberSignupSource`, then
  `history.replaceState(null, "", "/import")` so the fragment and query leave the address bar.
  The page then renders from the stash. Save or Cancel clears it. A new fragment replaces the stash.
- **Rationale:** matches `signup-source.ts` (session-scoped, try/catch around storage) and the
  candidate's D-131. The server sees nothing until Save. Stripping the hash makes reload and
  share harmless (spec Scenario 1).
- **Alternatives:** `localStorage` (outlives the session, leaves deals on shared machines);
  carrying the deal in `?next=` (puts `d` in a URL our server receives, breaking the privacy
  property); a server-side pending-import row (same problem, plus a cleanup job).

## R5. Return path through sign-in and registration

- **Decision:** `frontend/lib/next-path.ts` exports `safeNextPath(value)`, returning the value only
  if it is in an allow-list (`["/import"]`), else `null`. `/login` pushes `safeNextPath(next) ??
  "/dashboard"`, `/register` pushes `safeNextPath(next) ?? "/hub"`; their "create an account" /
  "sign in" cross-links keep `?next=`. The `(authenticated)` layout's redirect is unchanged: `/import`
  is a public route outside that group, so the redirect never applies to it.
- **Rationale:** an allow-list is the smallest correct defence against open redirects
  (`//evil.com`, `/\evil.com`, encoded variants); one entry today, extendable.
- **Alternatives:** "any path starting with `/`" (the classic open-redirect bug); carrying `next`
  through the authenticated layout (not needed for this feature; spec FR-3's third bullet is
  satisfied because `/import` is public and links to login with `next` itself).

## R6. Signup source

- **Decision:** `rememberSignupSource` reads `utm_source`, else `ref`; same regex. `/import` calls it.
  The backend's `validateSignupSource` already accepts `recs`; a test pins it. The existing
  `npm run funnel` groups by source, so RECS arrivals appear with no report change.
- **Alternatives:** a separate `ref` column (one more field for the same fact).

## R7. API shape

- **Decision:** `POST /api/v1/recs-deals` → 201 `{ data: { id, c, name, created_at } }`;
  `GET /api/v1/recs-deals` → 200 `{ data: [ { id, c, name, d, created_at } ] }` newest first;
  `DELETE /api/v1/recs-deals/:id` → 204, 404 if not found, already deleted, or another user's.
  Errors `VALIDATION_ERROR` 400 (with `details[0].field`), `NOT_FOUND` 404. See
  [contracts/recs-deals-api.md](./contracts/recs-deals-api.md).
- **Rationale:** mirrors `contacts` (201 create, 204 delete, `publicId` as `id`). `d` is returned
  by the list because the hub builds the RECS link from it; there is no single-deal GET because
  nothing needs one.
- **Alternatives:** returning the RECS URL from the API (the RECS origin is a frontend build
  variable today; keep one place).

## R8. Tests and what is ported from the candidate

- **Decision:** backend `validation.test.ts` (pure) and `routes.test.ts` (supertest on an Express
  app with a fake `req.user`, repository mocked, as other tests mock Prisma). Frontend tests for
  the parser, `next-path`, signup source, the page (signed in, signed out, invalid) and the list
  (href exact, delete). Cases are read from the candidate's `src/app/import/__tests__/` and
  `e2e/recs-import.spec.ts` and rewritten for this stack; nothing is copied blindly and nothing
  in the candidate is edited. No Playwright here: the round trip is manual (quickstart §4).
- **Alternatives:** DB-backed integration tests (none exist in this repo; adding the harness is
  its own feature).

## R9. List size and pagination

- **Decision:** no pagination in v1; the list returns all live rows of the user. Revisit if any
  user passes 100 deals (the funnel query in quickstart §5 shows the max).
- **Rationale:** beta scale; constitution "when in doubt, do less".

## R10. Hub section visibility

- **Decision:** the hub fetches the list after the audit summary. With deals: always render them;
  "Open in RECS" only when `NEXT_PUBLIC_RECS_URL` is set. With no deals: an empty state pointing
  to the calculators when the variable is set, nothing otherwise. A failed fetch renders nothing
  and logs to the console (the hub's main job is the audits).
- **Rationale:** spec FR-5 and edge cases; reuses `RecsLink`'s rule that an unset URL renders nothing.
