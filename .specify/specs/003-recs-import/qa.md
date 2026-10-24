# QA: RECS Import

## T037: round trip against a local RECS (2026-10-23)

**Setup.** RECS `~/projects/recs` at `d4153a4`, `pnpm dev` on :5173 with
`VITE_INVESTORSMAP_URL=http://localhost:3000` set in the shell only (no RECS file edited).
Investor OS branch `003-recs-import` (base `5c64c35` plus the uncommitted feature work), API on
:3001 against the local Postgres, web on :3000 with `NEXT_PUBLIC_RECS_URL=http://localhost:5173`.
Browser: gstack headless Chromium (Chrome/151.0.7922.34). Run by Claude Code, driven step by step.

**Method, per calculator.**
1. Clear RECS's localStorage/sessionStorage, open `/calculators/<slug>`, set the property name
   and change the first numeric input, capture the summary strip's text and a screenshot.
2. Read the "Send to InvestorsMap" link and open that exact URL (what the button opens in a new tab).
3. On `/import`: check the address bar is `/import` and the name and calculator label show; Save.
4. Hub: the deal is the top row of "Deals from your calculators"; its "Open in RECS" href must equal
   `http://localhost:5173/calculators/<slug>#d=<the d RECS sent>` exactly.
5. Clear RECS's storage again (so nothing can come from RECS's own saved state), open that href,
   capture the strip, compare its text byte for byte with step 1.
6. Delete (with confirmation) in the hub, reload: the row stays gone.

Quick Screen has no summary strip; its "Results" section was compared instead.

| Slug | /import shows name + label, bar clean | Saved, top of hub | Open in RECS href exact | Strip identical | Deleted, gone after reload |
|---|---|---|---|---|---|
| multifamily | PASS | PASS | PASS | PASS | PASS |
| quick-screen | PASS | PASS | PASS | PASS (Results section) | PASS |
| single-family | PASS | PASS | PASS | PASS | PASS |
| fix-and-flip | PASS | PASS | PASS | PASS | PASS |
| brrrr | PASS | PASS | PASS | PASS | PASS |
| wholesaling | PASS | PASS | PASS | PASS | PASS |
| subject-to | PASS | PASS | PASS | PASS | PASS |
| short-term-rental | PASS | PASS | PASS | PASS | PASS |

The edit is visible in each "before" strip, so a match cannot be RECS defaults on both sides. For
subject-to and quick-screen, where the edited field is not in the strip, the reopened page showed
the edited input (Market value 291507, Units 51) and the strip differs from RECS's defaults.

| Extra check | Result |
|---|---|
| Signed out → Send → "Create an account" (`/register?next=/import`) → back on `/import` with the same deal, signed-in view, Save | PASS |
| New account's `signup_source` | `recs` |
| Stored `d` equals the `d` in RECS's Send link (DB, all 8 slugs) | PASS |
| Name `Elm St & Co #12 🏠 100% "test"` shown on `/import` and in the hub, stored exactly | PASS |
| A request with no token gets 401 and the API keeps running (after the `auth.ts` fix) | PASS |

**Notes.** Headless Chromium has no emoji font, so 🏠 renders as a box in screenshots; the page
text and the stored name contain it. Evidence (strip text before/after, Send links, screenshots):
`.gstack/browse-reports/t037/` (not committed).

## T038 /qa (2026-10-23, after /review fixes, commit a7f3eb7)

Local, headless Chromium (gstack `$B`), web and API restarted on the reviewed code.

| Check | Result |
|---|---|
| Stale token on arrival → `/login?next=/import` with the deal held → sign in → back on `/import` with the same deal → Save | PASS |
| Wrong password on `/login?next=/import` shows "Invalid email or password." and keeps `?next` | PASS |
| Hub: Open in RECS link `<RECS>/calculators/<c>#d=<d>`, new tab, `noopener noreferrer`; Delete → confirm → row gone, survives reload | PASS |
| Signed out → Create an account → `/import` → Save; funnel `recs` row +1 | PASS |
| API: 4 concurrent DELETEs of one deal → one 204, three 404, no 500 | PASS |
| Per-user cap (after /cso): 500 live deals seeded → 501st POST 400 `limit`; `/import` shows the limit message and keeps the deal; after one delete, save → 201 | PASS |

Report: `.gstack/qa-reports/run-20261024T010331Z/` (not committed). Code review: `code-review.md`.
