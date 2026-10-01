# Verification: French as a Full Second Language

**Feature:** 004-french-language
**Spec:** `.specify/specs/004-french-language/spec.md` · **Tasks:** `.specify/specs/004-french-language/tasks.md`

One section per sprint. Each records what was measured, how, and the decisions taken while building.

---

## Sprint 1: Foundation (T001 to T024)

**Date:** 2026-10-01 · **Branch:** `004-french-language` · **Compared with:** `master` at `8ff751f`

### Result

| Exit criterion (spec, Sprint 1 "Done when") | Result |
|---|---|
| Browser set to French: landing, sign-in and registration are French at first paint, tab title included | Pass |
| An account registered in French opens in French after sign-in on a browser set to English | Pass |
| A French link (`/?lang=fr`) opens in French in a browser set to English, and the next page stays French | Pass |
| An existing English-language user notices no change other than the language switch on signed-out pages and on phones | Pass |
| `npm test` in `backend/` | Pass: 14 suites, 136 tests |
| `npm test` in `frontend/` | Pass: 4 suites, 30 tests |
| `npm run lint` in `frontend/` | No new error; one baseline error removed. Still exits 1 because of 4 errors that exist on `master` (see Lint) |
| Landing-page load time compared with `master` (T022) | Time to first byte +6 to +9 ms; full load unchanged within noise (see Landing page) |

### How the exit check was run

Production build of the branch (`npm run build && npm start`, port 3000), the API on port 3001 with the mock AI server, Postgres and Redis from `docker compose`. A script drove headless Chrome (Puppeteer) with the browser language set to `fr-CA` or `en-US`, a fresh profile per scenario. From the first byte of each page it recorded every value taken by `<html lang>`, the tab title and the first heading, so a flash of the other language would show as a second value. 31 of 31 checks passed.

| # | Check | Observed |
|---|---|---|
| 1 | French browser, first visit to `/`, `/login`, `/register` | `lang`, title and heading have one value each, the French one, from the first paint. No `locale` cookie is written (the language is a guess, not a choice). No console or hydration error |
| 2 | Register from the French page | `users.locale = fr`; every API call carries `Accept-Language: fr`; the device cookie becomes `locale=fr`. With one contact the page reads "Votre réseau immobilier (1 contact)" |
| 3 | Second device, English browser | Sign-in page in English. After sign-in the app is French with no action, cookie `locale=fr`, and a reload is French at first paint. Switching to English is instant, updates the tab title, and `GET /auth/me` returns `en`. Back on the French browser, sign-in applies English |
| 4 | `/?lang=fr` in an English browser | French at first paint, cookie written for one year. Client navigation to `/register` stays French. A later full load of `/login` is French at first paint |
| 5 | English browser | `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/terms` are English and show the switch ("FR", labeled "Passer en français", `lang="fr"`). An English registration gives `users.locale = en`. At 360 px wide the sidebar is hidden and the header strip holds the switch, the theme control and sign-out (40 px touch targets), with no horizontal overflow; switching there works and is saved |
| 6 | Device with `localStorage.locale = "fr"` left by v0.3.2, English account | At sign-in the account becomes `fr`, the interface follows, and the key is removed |
| 7 | Switch while typing in a form, with an expired token in the browser | The typed value is kept, the page turns French without a reload, and the visitor stays on the page |

Server-rendered HTML was also checked with `curl` for each resolution rule:

| Request | `<html lang>` and title |
|---|---|
| `Accept-Language: fr-CA,fr;q=0.9,en;q=0.8` on `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/terms` | `fr`, French title and description, title inside `<head>` |
| `Accept-Language: en-US` · `es-ES` · `en-US,fr;q=0.8` · no header | `en` |
| `/?lang=fr` with `Accept-Language: en-US` | `fr`; `Set-Cookie: locale=fr; Path=/; Max-Age=31536000; SameSite=lax` |
| Cookie `locale=fr` with `Accept-Language: en-US` | `fr` |
| `/?lang=en` with cookie `locale=fr` | `en` (the link wins over the cookie) |
| `/?lang=xx` | `en`, no cookie written |
| Forged request header `x-locale: fr` with `Accept-Language: en-US` | `en` (the proxy overwrites the header) |
| Cookie `locale=zz` with `Accept-Language: fr` | `fr` (an invalid cookie is ignored) |

API, checked with `curl` against the running server:

| Call | Result |
|---|---|
| `POST /auth/register` with `Accept-Language: fr-CA,…`, no `locale` in the body | `user.locale = "fr"` |
| `POST /auth/register` with `"locale": "fr"` and `Accept-Language: en-US` | `user.locale = "fr"` (the body wins) |
| `POST /auth/register` with `"locale": "xx"` and `Accept-Language: es` | `user.locale = "en"` (invalid value ignored, request language used) |
| `POST /auth/login`, `GET /auth/me` | Both return `locale` |
| `PUT /auth/me {"locale":"en"}` | 200, same body as `GET /auth/me` with the new value |
| `PUT /auth/me {"locale":"es"}` and `{}` | 400 `VALIDATION_ERROR`, `details[0].field = "locale"`, message in the account's language |
| `PUT /auth/me` without a token | 401 `UNAUTHORIZED` |

Migration `20261001045642_add_user_locale` applied to the local database: the 21 existing accounts took `en`.

### Landing page: `master` against this branch (T022)

Both trees were copied to the Linux filesystem (the repository sits on `/mnt/c`, where file access is too slow to measure anything), built with `npm run build` and served with `npm start` on the same machine. Headless Chrome, a fresh profile for each run (cold cache), one unmeasured warm-up run, then three runs. Time to first byte is `responseStart − requestStart`; full load is the `load` event.

| Build | Browser language | Time to first byte (3 runs) | Full load (3 runs) | Mean |
|---|---|---|---|---|
| `master` | English | 8.2 · 6.0 · 11.0 ms | 203 · 201 · 210 ms | 8.4 ms · 205 ms |
| Branch | English | 12.2 · 18.4 · 12.6 ms | 169 · 184 · 162 ms | 14.4 ms · 172 ms |
| Branch | French | 11.3 · 11.0 · 13.7 ms | 155 · 177 · 176 ms | 12.0 ms · 169 ms |

A second pass gave means of 4.6 ms and 265 ms for `master`, 16.0 ms and 279 ms for the branch: the full-load figure moves by more between passes than between builds. The server alone, with `curl` over 20 requests: median 3.4 ms for `master`, 12.7 ms for the branch. The HTML grew from 20,802 to 21,282 bytes (5.6 to 6.5 kB compressed).

Reading:

- The landing page was a prerendered file on `master`. It is now rendered for each request, because the root layout reads the language from the request. That costs about 9 ms of server time locally. Full load is unchanged within noise.
- The response header changed from `Cache-Control: s-maxage=31536000` to `private, no-cache, no-store`. `docs/deploy.md` describes no CDN or cache in front of the frontend, so nothing should change today; a CDN added later could no longer cache the pages. This is the cost recorded in research R2.
- Every route is now dynamic (`ƒ` in the build output), as the plan expected. The pages fetch their data in the browser, so the server work per page is the same small render.

Within the constitution's performance principle (IX): no action needed. Measure again on staging in Sprint 5, where network latency dominates.

### Lint (T021)

**Baseline on `master`, 2026-10-01** (`npx eslint app components lib`, same result with `npm run lint`): 16 problems, 5 errors and 11 warnings.

| Severity | Rule | Location |
|---|---|---|
| error | `react-hooks/set-state-in-effect` | `lib/i18n.tsx:39` |
| error | `react-hooks/set-state-in-effect` | `lib/theme.tsx:39` |
| error | `react-hooks/set-state-in-effect` | `lib/auth-context.tsx:40` |
| error | `react-hooks/set-state-in-effect` | `app/(authenticated)/hub/page.tsx:96` |
| error | `react-hooks/set-state-in-effect` | `components/audit/audit-form-shell.tsx:46` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/contacts/page.tsx:89` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/dashboard/page.tsx:127` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/growth-strategy/[pathType]/page.tsx:96` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/growth-strategy/page.tsx:132` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/identity/history/page.tsx:54` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/identity/page.tsx:122` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/simulation/page.tsx:135` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/strategies/[id]/page.tsx:124` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/strategies/page.tsx:58` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `app/(authenticated)/tasks/page.tsx:66` |
| warning | `react-hooks/exhaustive-deps` (missing `t`) | `components/growth/ExportButton.tsx:82` |

**After Sprint 1** (`npm run lint`): 58 problems, 4 errors and 54 warnings.

- Errors: the `lib/i18n.tsx` one is gone (T012 removed the effect). The other four are the baseline ones, untouched (`lib/auth-context.tsx` is now line 81, same statement).
- Warnings: the same 11, plus 43 from the new `react/jsx-no-literals` rule. None of the 43 comes from code written in this sprint.

| File | Hard-coded texts flagged |
|---|---|
| `app/terms/page.tsx` | 19 (English by design until Sprint 4, T072) |
| `components/audit/audit-form-shell.tsx` | 9 (T026) |
| `app/(authenticated)/dashboard/page.tsx` | 5 (T033) |
| `app/(authenticated)/identity/history/page.tsx` | 3 (the version prefix "v") |
| `app/(authenticated)/hub/page.tsx` | 2 ("min") |
| `app/(authenticated)/growth-strategy/[pathType]/page.tsx` | 1 ("% fit") |
| `app/(authenticated)/identity/page.tsx` | 1 |
| `app/(authenticated)/strategies/[id]/page.tsx` | 1 ("min") |
| `app/page.tsx` | 1 (the initial "L" in the founder block) |
| `components/identity/radar-chart.tsx` | 1 (T034) |

The rule does not look inside attributes (`ignoreProps`), so `aria-label` and `title` literals are not counted here; T035 covers the known ones.

### Decisions taken during implementation

Each is the recommended option, applied. None changes the spec.

| # | Decision | Why |
|---|---|---|
| 1 | The dictionary lookup and the formatters live in a new `frontend/lib/translate.ts`. `lib/i18n.tsx` re-exports `translate` and binds everything to the current language | The root layout needs to translate the tab title on the server, and a server component cannot call a function exported from a `"use client"` module. T012 asked for `translate` in `lib/i18n.tsx`; it is still importable from there for client code |
| 2 | `formatDate` and `formatTime` default to the numeric style that `toLocaleDateString()` and `toLocaleTimeString()` used: "9/30/2026" and "3:45:12 PM" in English, "30/09/2026" and "15:45:12" in French | Keeps English identical to today (Scenario 4). The spec's example "30 sept. 2026" is the medium style, available as `formatDate(d, { dateStyle: "medium" })`. Changing the default for both languages is a two-line edit in `lib/translate.ts` if the founder prefers it |
| 3 | English dates now follow `en-US` on every device. A browser set to British English used to show "30/09/2026" and now shows "9/30/2026" | FR-1.10 and T012: formats follow the chosen language (tags `fr` and `en-US`), not the device |
| 4 | T018 also converted `components/strategy/roadmap-timeline.tsx` | A fourth `toLocaleDateString()` call the task did not list; FR-1.10 covers it |
| 5 | T019 also converted `strategy.countdown.hours` to `.one` / `.other` | "1 h restantes" was wrong in French (FR-1.11). English reads the same in both variants |
| 6 | `formatPercent` takes the 0 to 100 scale the app stores (68 gives "68 %"), not a fraction | Scores and fit values are stored as 0 to 100 everywhere |
| 7 | The switch saves to the account with a new `stayOnUnauthorized` option of the API client | Without it, switching language on the landing page with an expired token would send the visitor to `/login` |
| 8 | The legacy `localStorage.locale` is adopted at sign-in and on an authenticated load, not at registration. If saving to the account fails, the key is kept and retried at the next sign-in | FR-1.7 concerns existing accounts. A new account takes the language of the page it was created from (FR-1.6) |
| 9 | Switching language also updates the tab title | FR-1.8: the title must match the displayed language, and the switch does not reload the page |
| 10 | The `locale` cookie is written only for an explicit choice: a `?lang=` link, the switch, or sign-in (the account's language). A language guessed from the browser is not stored | So the guess keeps following the browser if its settings change (FR-1.3, FR-1.5) |
| 11 | The server dictionary starts with the two messages of the new `locale` validation, rendered in the request's language through `validateLocale(value, lang)` | Gives `backend/src/shared/i18n.ts` real content to test from the first sprint. T039 moves this call to `AppError.localized` with the other auth errors |
| 12 | `react/jsx-no-literals` allows the brand name and these strings: `# % ( ) * . / : ~ -- /100 "/ 100" · × › → &larr; 🔒` | T021: punctuation and the brand name. Short texts such as "v", "min" and "L" stay flagged for Sprint 2 to settle |
| 13 | The phone header strip scrolls with the page instead of staying fixed | Keeps the full height for content on small phones; the bottom tab bar is already fixed |
| 14 | The terms page got the switch but its content stays English | T016 mounts the switch; the French terms are Sprint 4 (T072) |
| 15 | Outside a provider (tests), `useTranslation()` now returns English text instead of raw keys | FR-1.12: a raw identifier is never shown |

### One change outside the task list

`backend/src/shared/middleware/auth.ts`: `authenticate` now passes its failures to the error handler with `next(err)`.

On `master`, `authenticate` is an `async` function that throws. Express 4 does not catch a rejected promise from middleware, so any request to an authenticated route with a missing, malformed or expired token ended the Node process with an unhandled rejection (seen during this check: an unauthenticated `PUT /auth/me` stopped the dev server; `GET /auth/me` on `master` has the same code path). In production this means a restart of the API each time a session expires, and the loss of any generation in flight. The Sprint 1 flows depend on a clean 401 (expired session while switching language), so the fix is included here: a small wrapper around the existing checks, with a new co-located test (`auth.test.ts`, 5 cases). Worth confirming against the Railway restart history.

### Known limits after Sprint 1

- French is still partial: the audits, the remaining literals, server messages and everything the AI writes are English until Sprints 2 and 3. Sprint 1 only makes the platform know the language.
- A language switch made in the fraction of a second while `GET /auth/me` is still loading can be overwritten by the account's language when that call returns.
- After a switch without reload, the page description (`<meta name="description">`) keeps the previous language until the next page load. The tab title and `<html lang>` update at once.
- If saving a switch to the account fails (network), the device shows the new language until the next page load, which applies the account's language again.
- Test accounts created by this check in the local database: emails starting with `s1-` at `example.test`.
