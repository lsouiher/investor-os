# Tasks: French as a Full Second Language

**Feature:** 004-french-language
**Generated:** 2026-09-30
**Total Tasks:** 97 (87 in Sprints 1 to 5, 10 in the gated Sprint 6)
**User Stories:** 8 (from spec.md scenarios)
**Inputs:** [spec.md](./spec.md) · [plan.md](./plan.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/api-changes.md](./contracts/api-changes.md)

Phases are the six sprints of the spec. Each sprint is one pull request into `master` and ends with an exit check. `[P]` marks a task that touches no file another open task in the same sprint touches. `[USn]` names the scenario a task serves; tasks without a label serve all of them.

Two rules apply to every task:
- Read the relevant guide in `frontend/node_modules/next/dist/docs/` before changing frontend code (`frontend/AGENTS.md`).
- Tasks that add text edit both `frontend/locales/en.json` and `frontend/locales/fr.json` (or both maps in `backend/src/shared/i18n.ts`). Those files are shared, so such tasks are never `[P]`.

---

## User Story Mapping

| Story | Spec Scenario | Priority | Sprints |
|-------|---------------|----------|---------|
| US1 | A first session entirely in French | P1 | 1, 2, 3 |
| US2 | The language follows the account | P1 | 1 |
| US3 | Switching language mid-journey | P1 | 1, 2, 3 |
| US4 | English users are unaffected | P1 | all |
| US5 | A French link opens in French | P2 | 1, 5 |
| US6 | Password reset in French | P2 | 4 |
| US7 | Documents in French | P2 | 4 |
| US8 | An investor in Québec gets Canadian context | P3 (gated) | 6 |

---

## Sprint 1: Foundation

**Goal:** French from the first page; the choice follows the account; the server knows the language.
**Requirements:** FR-1.1 to FR-1.13 · **Size:** M · **Depends on:** nothing

### Backend

- [X] T001 Add `enum Locale { en fr }` and `locale Locale @default(en)` to `User` in `backend/prisma/schema.prisma`; create the append-only migration with `npx prisma migrate dev --name add_user_locale` (Postgres on port 5433), then `npx prisma generate`
- [X] T002 [P] Create `backend/src/shared/i18n.ts`: `Locale` type, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `isLocale()`, `parseAcceptLanguage(header)` (honors q-values; any `fr-*` resolves to `fr`; unsupported resolves to `en`), an `en` map, an `fr` map typed `Record<keyof typeof en, string>`, and `t(locale, key, params)` with `{{param}}` interpolation
- [X] T003 [P] Create `backend/src/shared/i18n.test.ts`: header parsing (`fr-CA`, `en-US,fr;q=0.8`, `fr;q=0.9,en;q=0.8`, `es`, missing header), interpolation, and identical `{{placeholders}}` for every key in both maps
- [X] T004 Create `backend/src/shared/middleware/locale.ts` (sets `req.locale` from `Accept-Language`; declares `locale: Locale` on the Express `Request`) and register it before `generalLimiter` in `backend/src/main.ts`; in `backend/src/shared/middleware/auth.ts` add `locale` to the user select and set `req.locale = user.locale`
- [X] T005 [US2] Carry the language through registration and the profile: `validateLocale()` and `locale` in `validateRegisterInput` in `backend/src/modules/auth/validation.ts`; a `locale` parameter on `createUserWithTenant` in `backend/src/modules/auth/repository.ts`; `locale` on `AuthResponse.user` and `UserProfile` in `backend/src/modules/auth/types.ts`; `register` (falling back to `req.locale` when the body has none), `login` and `getProfile` return it in `backend/src/modules/auth/service.ts` and `backend/src/modules/auth/routes.ts`
- [X] T006 [US2] Add `PUT /auth/me` in `backend/src/modules/auth/routes.ts` behind `authenticate` and `userLimiter`: body `{ locale }`, 400 `VALIDATION_ERROR` when missing or invalid, response identical to `GET /auth/me`; add `updateProfile()` in `backend/src/modules/auth/service.ts` and `updateUserLocale()` in `backend/src/modules/auth/repository.ts`
- [X] T007 [P] [US2] Extend `backend/src/modules/auth/validation.test.ts`: `validateLocale` accepts `en` and `fr` and rejects anything else; registration without `locale` still validates

### Frontend

- [X] T008 [P] Create `frontend/lib/locale.ts` with no React imports so the proxy can use it: `LOCALES`, `Locale`, `DEFAULT_LOCALE`, `LOCALE_COOKIE`, `isLocale()`, `negotiateLocale(acceptLanguage)`, `writeLocaleCookie(locale)` (one year, `path=/`, `SameSite=Lax`)
- [X] T009 [P] Create `frontend/lib/locale.test.ts` with the same negotiation cases as T003
- [X] T010 [US1] Create `frontend/proxy.ts` (read `frontend/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` first): resolve the language in the order `?lang` → `locale` cookie → `Accept-Language` → `en`; forward it as an `x-locale` request header; set the cookie only when `?lang` is present and valid; the matcher skips `_next`, `favicon` and paths with a file extension
- [X] T011 [US1] Make `frontend/app/layout.tsx` an async server layout: read `x-locale` with `headers()`, set `<html lang>`, pass `initialLocale` to `I18nProvider`, and replace the static `metadata` export with `generateMetadata()` using new `meta.title` and `meta.description` keys in `frontend/locales/en.json` and `frontend/locales/fr.json`
- [X] T012 Update `frontend/lib/i18n.tsx`: an `initialLocale` prop replaces the `localStorage` effect; `setLocale` writes the cookie and `document.documentElement.lang`; `t()` selects `<key>.one` or `<key>.other` through `Intl.PluralRules` when called with `count`; `useTranslation()` also returns `formatDate`, `formatTime`, `formatNumber`, `formatPercent` (tags `fr` and `en-US`); export a non-hook `translate(locale, key, params)` for code outside React
- [X] T013 [P] Send `Accept-Language` (read from `document.documentElement.lang`) in `request()` and `requestEnvelope()` in `frontend/lib/api-client.ts`
- [X] T014 [US2] Update `frontend/lib/auth-context.tsx`: `locale` on `User`; `register` sends the current language; after `login`, `register` and `GET /auth/me`, adopt `user.locale` on the device without writing back; adopt a legacy `localStorage.locale` of `fr` once through `PUT /auth/me`, then remove the key
- [X] T015 [US2] Update `frontend/components/shared/language-toggle.tsx`: after `setLocale`, call `PUT /auth/me` when a token exists (a failure is silent); give the label the `lang` of the language it names
- [X] T016 [US1] Mount `LanguageToggle` next to `ThemeToggle` in `frontend/app/page.tsx`, `frontend/app/login/page.tsx`, `frontend/app/register/page.tsx`, `frontend/app/forgot-password/page.tsx` and `frontend/app/reset-password/page.tsx`, and add it to `frontend/app/terms/page.tsx`
- [X] T017 [US1] Make the switch reachable on phones in `frontend/app/(authenticated)/layout.tsx`: the sidebar footer holding the language switch, the theme switch and sign-out is hidden below `md`; add a compact `md:hidden` header strip with the three
- [X] T018 [P] Replace `toLocaleDateString()` and `toLocaleTimeString()` with `formatDate` and `formatTime` in `frontend/app/(authenticated)/growth-strategy/[pathType]/page.tsx` and `frontend/app/(authenticated)/identity/history/page.tsx`
- [X] T019 Convert counted texts to `.one` / `.other` keys in `frontend/locales/en.json` and `frontend/locales/fr.json` and pass `count` at the call sites: `strategy.countdown.days` (absorbing `strategy.countdown.one_day`) in `frontend/app/(authenticated)/strategies/[id]/page.tsx`, and `contacts.subtitle` in `frontend/app/(authenticated)/contacts/page.tsx`

### Safeguards and exit

- [X] T020 [P] Create `frontend/lib/i18n.test.ts`: identical key sets in both dictionaries, identical `{{placeholders}}` per key, no empty value, every `.one` key has its `.other`, French selects the singular for 0 and 1, and a key missing in French returns the English text
- [X] T021 [P] Enable `react/jsx-no-literals` as a warning in `frontend/eslint.config.mjs` (`noStrings: true`, `ignoreProps: true`, allowing punctuation and the brand name). The linter already fails on `master`: 5 errors and 11 warnings on 2026-10-01 (`npx eslint app components lib`), among them `react-hooks/set-state-in-effect` in `lib/i18n.tsx` and `lib/theme.tsx`. Record the full list as the baseline in `specs/004-french-language/verification.md`; T012 removes the effect behind the `lib/i18n.tsx` error, and the sprint exit checks compare against the baseline for the rest
- [X] T022 [US4] Measure the landing page with a production build (`npm run build && npm start`) on `master` and on this branch (time to first byte and full load, three runs each) and record both in `specs/004-french-language/verification.md`
- [X] T023 [P] Fold the Sprint 1 section of `.specify/specs/004-french-language/contracts/api-changes.md` into `.specify/specs/001-identity-platform/contracts/api-v1.md`
- [X] T024 Run the Sprint 1 exit check: the four "Done when" items of Sprint 1 in `spec.md`, `npm test` in `backend/` and `frontend/`, `npm run lint` in `frontend/`; record the result in `specs/004-french-language/verification.md`

**Exit check:** a browser set to French gets French at first paint on the landing, sign-in and registration pages, tab title included · an account registered in French opens in French after sign-in from a browser set to English · `/?lang=fr` opens in French in an English browser and the next page stays French · an existing English user sees no change except the new switch.

---

## Sprint 2: French Interface, Complete

**Goal:** No English sentence in the interface, audits included. AI-written content is still English when this sprint ends.
**Requirements:** FR-2.1 to FR-2.9 · **Size:** L · **Depends on:** Sprint 1

### Glossary

- [ ] T025 Create `.specify/specs/004-french-language/glossary.md`: every product concept with its French term and usage notes, starting from the Glossary in `spec.md`, the terms already in `frontend/locales/fr.json`, the audit vocabulary (financing, credit, tax, property types) and the eight archetype names from `research.md` R8. Founder sign-off before T027
  - Status 2026-10-01: glossary written and applied to the Sprint 2 drafts. **Open: founder sign-off** (eight choices listed at the top of the glossary)

### Audits

- [X] T026 [US1] Refactor `frontend/components/audit/audit-form-shell.tsx` to resolve text by key convention (`audit.<type>.section.<id>`, `audit.<type>.field.<name>.label`, `.placeholder`, `audit.<type>.option.<name>.<value>`); `AuditSection` and `AuditField` keep ids, types, option values and `required` only; move the shell's own strings ("Section 2 of 5", "Select...", "Back", "Next: …", "Complete Audit", "Saving...", "… is required", the mode button) to `audit.shell.*` keys in `frontend/locales/en.json` and `frontend/locales/fr.json`; the title uses the existing `audit.<type>.name`
- [X] T027 [US1] Financial audit: reduce `frontend/app/(authenticated)/audits/financial/page.tsx` to structure, add its keys (5 sections, 20 questions, about 100 options) to `frontend/locales/en.json` verbatim and to `frontend/locales/fr.json` with the FR-2.3 wording (neutral term, US term as an example, amounts labeled as US dollars); use the existing `audit.error.save_failed` and `audit.error.complete_failed` keys for the page's two error banners
- [X] T028 [US1] Time audit: same treatment for `frontend/app/(authenticated)/audits/time/page.tsx` (5 sections, 15 questions, about 65 options)
- [X] T029 [US1] Skills audit: same treatment for `frontend/app/(authenticated)/audits/skills/page.tsx` (5 sections, 25 questions, about 85 options, 4 placeholders)
- [X] T030 [US1] Risk audit: same treatment for `frontend/app/(authenticated)/audits/risk/page.tsx` (5 sections, 17 questions, about 80 options)
- [X] T031 [US1] Horizon audit: same treatment for `frontend/app/(authenticated)/audits/horizon/page.tsx` (5 sections, 18 questions, about 85 options, 2 placeholders)
- [X] T032 [P] [US3] Create `frontend/components/audit/audit-form-shell.test.tsx`: French labels and options render; switching language mid-form keeps every selected value; the required-field message is localized; the values sent to `onSave` are the option codes, unchanged

### Leftover English on translated screens

- [X] T033 [US1] Move the remaining literals to dictionary keys in `frontend/app/(authenticated)/dashboard/page.tsx` ("Next best action", "Your last export is out of date.", "Locked", "Generating…", "Plan generating…") and `frontend/app/(authenticated)/simulation/page.tsx` ("Readiness", "Strategies:", `SUB_SCORE_LABELS`)
- [X] T034 [US1] Localize chart and score labels: `ALL_AXES` in `frontend/components/identity/radar-chart.tsx`; `AUDIT_LABELS` and `toSubScoreList` in `frontend/lib/identity.ts` (take `t`), with its callers and `frontend/lib/identity.test.ts`
- [X] T035 [US1] Localize growth screens: the five `aria-label`s in `frontend/components/growth/PathCard.tsx`; content headings in `frontend/app/(authenticated)/growth-strategy/[pathType]/page.tsx` (replace `key.replace(/_/g, " ")` with `growth_content.<key>` keys and a prettified fallback); the "completing earlier paths" fallback in `frontend/app/(authenticated)/growth-strategy/page.tsx`
- [X] T036 [US1] Localize strings outside React with `translate()`: "Session expired", the polling timeout and the non-JSON message in `frontend/lib/api-client.ts`; the fallback errors in `frontend/components/growth/ExportButton.tsx` and `frontend/components/strategy/blueprint-download.tsx`

### Messages from the server

- [X] T037 Add `AppError.localized(code, key, params?, statusCode?, details?)` in `backend/src/shared/middleware/error-handler.ts` (English text stays in `message` for logs); `errorHandler` renders the key with `req.locale`, including the generic 500 message; extend `backend/src/shared/middleware/error-handler.test.ts` for both languages
- [X] T038 Make the rate-limit messages functions of the request in `backend/src/shared/middleware/rate-limiter.ts` (express-rate-limit 7 accepts a function for `message`), with their keys in `backend/src/shared/i18n.ts`
- [X] T039 [US1] Move user-visible auth errors to keys: `backend/src/modules/auth/validation.ts` (including `details[].message`), `backend/src/modules/auth/service.ts`, `backend/src/shared/middleware/auth.ts`, and the two `data.message` strings in `backend/src/modules/auth/routes.ts`
- [X] T040 [US1] Move user-visible errors to keys in `backend/src/modules/audit/` (service, routes, validation), `backend/src/modules/identity/service.ts`, `backend/src/modules/strategy/service.ts`, `backend/src/modules/simulation/service.ts`, `backend/src/modules/blueprint/service.ts`, `backend/src/modules/contact/service.ts`, `backend/src/modules/task/service.ts` and the two AI failure messages in `backend/src/shared/ai/retry.ts`. Leave `backend/src/modules/admin/` and developer-facing messages in English
- [X] T041 [US1] Localize growth messages and system sentences: errors in `backend/src/modules/growth/routes.ts` and `backend/src/modules/growth/service.ts`; `UNLOCK_CRITERIA`, the early-unlock message and `formatPathName` rendered with the request's language; the two cooldown messages as a relative duration instead of `toLocaleTimeString()`; refresh suggestions served by `backend/src/modules/dashboard/routes.ts`; staleness reasons in `backend/src/modules/growth/export.ts`
- [X] T042 [US1] Render deferred errors when they are read: store the key and parameters in `lastSynthesisError` in `backend/src/modules/identity/service.ts` and in the simulation job state behind `GET /simulations/jobs/:jobId` in `backend/src/modules/simulation/routes.ts`; translate with the language of the request that reads them
- [X] T043 [US1] Give `getStartedInsight` and `getInsights` a language parameter in `backend/src/modules/insight/service.ts` and pass `req.locale` from `backend/src/modules/dashboard/routes.ts`

### Finish

- [X] T044 Add a typography test to `frontend/lib/i18n.test.ts` for French values (non-breaking space before `: ; ? ! %` and inside guillemets; typographic apostrophe) and fix `frontend/locales/fr.json` until it passes (about 25 spaces and 12 apostrophes today)
- [ ] T045 Generate `specs/004-french-language/copy-review-sprint2.md`, a side-by-side English and French table of every key added in this sprint; apply the founder's corrections to `frontend/locales/fr.json`, `backend/src/shared/i18n.ts` and `glossary.md`
  - Status 2026-10-01: sheet generated (627 interface texts, 88 server messages, 9 changed texts). **Open: the founder's corrections**, to apply once given
- [X] T046 [US1] Check every screen in French at 360 px wide and at desktop width, in light and dark themes; fix truncated, overlapping or clipped text in the affected components
- [X] T047 Turn `react/jsx-no-literals` into an error in `frontend/eslint.config.mjs` with a single exemption for `frontend/app/terms/page.tsx`, and fix what remains
- [X] T048 Fold the Sprint 2 section of `contracts/api-changes.md` into `.specify/specs/001-identity-platform/contracts/api-v1.md` and run the Sprint 2 exit check; record it in `specs/004-french-language/verification.md`

**Exit check:** a French walkthrough of every screen (signed-out and signed-in, phone and desktop) finds no English in the interface · identical answers produce identical sub-scores in both languages · tests and lint pass with the audits included.

---

## Sprint 3: French AI

**Goal:** Everything the AI writes for a French-language user is written in French, with the same substance as in English.
**Requirements:** FR-3.1 to FR-3.14 · **Size:** L · **Depends on:** Sprint 1 (independent of Sprint 2)

### Backend

- [ ] T049 Add `locale Locale @default(en)` to `IdentityVersion`, `Strategy` and `GrowthPath` in `backend/prisma/schema.prisma`; create the migration with `npx prisma migrate dev --name add_generated_content_locale`; `npx prisma generate`
- [ ] T050 [P] Create `backend/src/shared/ai/language.ts`: `languageDirective(locale)` returns an empty string for `en`; for `fr`, a block that requires natural French for every human-readable string value, lists what stays exactly as specified (JSON keys, enumerated values, `action_url`, ISO dates, the `archetype` value copied from the English list), carries the glossary and the French archetype names for prose, and sets typography and currency rules (`research.md` R7 and R8)
- [ ] T051 [P] Create `backend/src/shared/ai/language.test.ts`: empty for `en`; the French directive names every archetype and every protected field; snapshot of the block
- [ ] T052 Make `locale` a required field of `AiCallOptions` in `backend/src/shared/ai/client.ts` and append `languageDirective(options.locale)` to the system prompt in `callClaude`; update `backend/src/shared/ai/client.test.ts` and `backend/src/shared/ai/retry.test.ts`
- [ ] T053 [US1] Add `getUserLocale(userId)` to `backend/src/modules/auth/repository.ts` and pass `locale` at the eight call sites: `backend/src/modules/identity/service.ts`, `backend/src/modules/strategy/service.ts` (generation and activation), `backend/src/modules/simulation/service.ts`, `backend/src/modules/insight/service.ts`, `backend/src/modules/growth/generation.ts` (path and cross-path), `backend/src/modules/growth/export.ts` (summary)
- [ ] T054 [US3] Save and return the language of each identity: `createIdentityVersion` in `backend/src/modules/identity/repository.ts`; `locale` in `IdentitySummary` and `IdentityDetail` in `backend/src/modules/identity/types.ts` and in the three mappers of `backend/src/modules/identity/service.ts`; the identity block of `backend/src/modules/dashboard/routes.ts`
- [ ] T055 [US3] Save and return the language of strategies: `createStrategies` in `backend/src/modules/strategy/repository.ts`; `locale` in the response types of `backend/src/modules/strategy/types.ts` and the mappers of `backend/src/modules/strategy/service.ts`
- [ ] T056 [US3] Save and return the language of growth paths: `updatePathGenerated` in `backend/src/modules/growth/repository.ts`; `locale` in `GrowthPathSummary` and `GrowthPathDetail` in `backend/src/modules/growth/types.ts` and their mappers in `backend/src/modules/growth/service.ts`
- [ ] T057 [US3] When `PUT /auth/me` changes the language, clear `insightsCache` and `insightsGeneratedAt` in the same update in `backend/src/modules/auth/repository.ts`, so no insight in the previous language is served

### Frontend

- [ ] T058 [US1] Add `archetypeLabel(name, t)` to `frontend/lib/identity.ts` (slug lookup of `archetype.<slug>`, the stored name as fallback) with eight `archetype.*` keys in `frontend/locales/en.json` and `frontend/locales/fr.json`; use it in `frontend/components/identity/identity-card.tsx`, `frontend/app/(authenticated)/dashboard/page.tsx`, `frontend/app/(authenticated)/identity/history/page.tsx`, `frontend/app/(authenticated)/growth-strategy/page.tsx`, `frontend/app/(authenticated)/simulation/page.tsx` and the example card in `frontend/app/page.tsx`; extend `frontend/lib/identity.test.ts`
- [ ] T059 [US3] Create `frontend/components/shared/generated-language-notice.tsx` (shown when an item's `locale` differs from the interface language: "generated in English", one regenerate action, a confirmation stating the consequences) and mount it in `frontend/app/(authenticated)/identity/page.tsx`, where the action runs the existing re-synthesis; set `lang` on the content container
- [ ] T060 [US3] Mount the notice in `frontend/app/(authenticated)/strategies/page.tsx` and `frontend/app/(authenticated)/strategies/[id]/page.tsx` (the action leads to re-synthesis) and in `frontend/app/(authenticated)/growth-strategy/[pathType]/page.tsx` (the action runs the existing regeneration and respects its cooldown); set `lang` on the content containers

### Verification

- [ ] T061 Make `backend/scripts/mock-anthropic.mjs` answer in French when the system prompt contains the French directive: French versions of all canned responses (identity, strategies, activation, simulation, insights, both growth paths, cross-path analysis, export summary), with the archetype left in English
- [ ] T062 Create `backend/scripts/verify-locale.ts` and the `verify:fr` script in `backend/package.json`: register a French user, complete the five audits with the free-text answers written in French, wait for the identity and strategies, activate one, list the tasks derived from the plan, read insights, run a simulation, generate a growth path; fail if any generated text field (derived tasks included) does not pass a stop-word check (`looksFrench`) or if the archetype is not one of the eight identifiers; a `--real` flag targets the real API
- [ ] T063 [P] Add French-shaped samples (accents, guillemets, non-breaking spaces) to `backend/src/shared/ai/schema-contract.test.ts` for every schema
- [ ] T064 Run `npm run verify:fr -- --real` and the English equivalent for three reference profiles (beginner with little capital; one rental and a full-time job; high capital and little time). **Needs the founder's go-ahead: real API spend.** Record durations, the 25 checks and the score differences between languages in `specs/004-french-language/verification.md`
- [ ] T065 [P] Update `docs/ai-pipeline.md`: G14 closed, P8 replaced by the central directive, the language of generated items documented
- [ ] T066 Fold the Sprint 3 section of `contracts/api-changes.md` into `.specify/specs/001-identity-platform/contracts/api-v1.md` and run the Sprint 3 exit check; record it in `specs/004-french-language/verification.md`

**Exit check:** a French-language user who completes the five audits receives identity, strategies, plan, insights and a growth path in French · an English identity re-synthesized in French for an unchanged profile shows the same archetype under the same name in the history · `verify:fr` passes against the mock and the real API, and the English pipeline still passes.

---

## Sprint 4: French Beyond the Screen

**Goal:** Everything that leaves the app is in the user's language.
**Requirements:** FR-4.1 to FR-4.6 · **Size:** M · **Depends on:** Sprints 1 and 3

- [ ] T067 [US6] Password reset email in the request's language: `sendPasswordResetEmail(to, token, locale)` in `backend/src/shared/email.ts` with subject and body keys in `backend/src/shared/i18n.ts` and `?lang=<locale>` on the reset link; `forgotPassword(email, locale)` in `backend/src/modules/auth/service.ts`; pass `req.locale` from `backend/src/modules/auth/routes.ts`
- [ ] T068 [P] [US6] Create `backend/src/shared/email.test.ts`: subject, body and link for `en` and `fr`, with the Resend client mocked
- [ ] T069 [US7] Blueprint PDF in the account's language: replace the literals in `backend/src/modules/blueprint/template.html` with label placeholders and a `lang` placeholder; in `backend/src/modules/blueprint/service.ts` resolve the language with `getUserLocale`, fill the labels from `backend/src/shared/i18n.ts`, localize the radar axis labels, the fit and progress labels, the empty states, the footer and the date, and show the archetype by its display name
- [ ] T070 [US7] Growth export in the account's language: headings, labels and statuses in `backend/src/modules/growth/export.ts` from `backend/src/shared/i18n.ts`; replace the three copies of the path-name map (`backend/src/modules/blueprint/service.ts`, `backend/src/modules/growth/service.ts`, `backend/src/modules/growth/export.ts`) with `path.<type>` keys; keep file names ASCII
- [ ] T071 [US7] Mixed-language documents: when an identity, strategy or path was generated in another language, add a one-line note to the PDF (`backend/src/modules/blueprint/service.ts`) and to the export entry point (`backend/src/modules/growth/export.ts`); the content itself is left as generated
- [ ] T072 [US7] Terms in both languages: move the current content to `frontend/components/terms/terms-en.tsx`, write `frontend/components/terms/terms-fr.tsx` with the same sections and effective date, select by language in `frontend/app/terms/page.tsx` (the language switch mounted in T016 is the link between the two versions), and remove the lint exemption added in T047
- [ ] T073 [US7] List every place the English product shows "not financial, legal or tax advice" (screens, PDF, export) and confirm each has its French counterpart; add the missing keys to `frontend/locales/fr.json` or `backend/src/shared/i18n.ts`
- [ ] T074 [P] [US7] Create `backend/src/modules/blueprint/service.test.ts` for the HTML assembly (no browser): French labels, radar axis names and `lang="fr"` for a French account; English output unchanged for an English account
- [ ] T075 [US7] Build the backend image from `backend/Dockerfile`, generate a French blueprint inside it and confirm that accents, guillemets and non-breaking spaces render with the installed fonts; record a sample in `specs/004-french-language/verification.md`
- [ ] T076 Founder review of `frontend/components/terms/terms-fr.tsx`; note in `specs/004-french-language/verification.md` that a legal review is still required before a paid or marketed launch in Québec or France
- [ ] T077 Run the Sprint 4 exit check in both languages (reset email, PDF, export, terms) and record it in `specs/004-french-language/verification.md`

**Exit check:** a French-language user receives a French reset email, downloads a French blueprint and export, and reads the terms in French · an English-language user receives all four in English, unchanged.

---

## Sprint 5: Launch Readiness

**Goal:** Reviewed, tested, discoverable, measurable.
**Requirements:** FR-5.1 to FR-5.8 · **Size:** M · **Depends on:** Sprints 2, 3 and 4

- [ ] T078 Generate `specs/004-french-language/copy-review.md` (every key added by this feature, English and French side by side, plus the email, PDF and export labels); apply the reviewer's corrections; freeze `.specify/specs/004-french-language/glossary.md` and align `backend/src/shared/ai/language.ts` with it
- [ ] T079 Review French AI output for the three reference profiles across every generation type against the FR-5.2 rubric (natural French, glossary respected, no English leftovers, numbers and currency correct, same substance as English); record ratings, score parity (success criterion 6) and any directive changes in `specs/004-french-language/ai-review.md`
- [ ] T080 [US5] Give the French landing page its own address: move the client landing to `frontend/components/landing/landing-page.tsx`; make `frontend/app/page.tsx` and a new `frontend/app/fr/page.tsx` server components that export localized metadata (title, description, Open Graph) with `alternates.languages` for `/` and `/fr`
- [ ] T081 [US5] Map `/fr` to French in `frontend/proxy.ts` and add `frontend/app/sitemap.ts` listing both addresses with their language alternates
- [ ] T082 Break the funnel and the identity rating down by `users.locale` in `backend/scripts/funnel-report.ts`
- [ ] T083 [US1] Run `/qa` on staging in French: every screen, phone and desktop, light and dark, signed-out and signed-in, plus the reset email, the PDF and the export; fix what it finds
- [ ] T084 [US4] Run the English regression pass on staging: the same walkthrough in English and both test suites; anything that differs from the pre-feature behavior is a bug
- [ ] T085 [P] Update the documentation: language handling under Key Patterns in `CLAUDE.md`; `docs/codebase-guide.md` (the locale is no longer browser-only); `docs/ai-pipeline.md`; fold the remaining sections of `contracts/api-changes.md` into `.specify/specs/001-identity-platform/contracts/api-v1.md`; list the known limits (US market content; what regeneration does)
- [ ] T086 Release through `/ship`: `VERSION` and `CHANGELOG.md`
- [ ] T087 Run the Sprint 5 exit check and collect the reviewer's sign-off in `specs/004-french-language/verification.md`

**Exit check:** the reviewer signs off with no blocking language issue open · the French and English walkthroughs pass on staging · the funnel report shows French and English signups separately.

---

## Sprint 6: Market Fit for Francophone Investors (GATED)

**Do not start before the gate decision.** Sprints 1 to 5 must have shipped, and conversations with French-speaking users must show which market to serve first. These tasks are deliberately coarse; they are refined (or moved to a feature 005) when the gate opens.

**Goal:** The experience makes sense for someone investing in Canada or France.
**Requirements:** FR-6.1 to FR-6.9 · **Size:** L · **Depends on:** Sprints 1 to 5 and the gate

- [ ] T088 [US8] Record the gate decision (first market, evidence from users) under a Clarifications section in `.specify/specs/004-french-language/spec.md`, and refine T089 to T097 accordingly
- [ ] T089 [US8] Add `enum Market { us ca fr other }` and `market Market @default(us)` to `User` in `backend/prisma/schema.prisma` with a migration; carry `market` through `backend/src/modules/auth/` (register, `GET` and `PUT /auth/me`)
- [ ] T090 [US8] Ask for the market once, at registration in `frontend/app/register/page.tsx` or at the start of the financial audit, and let the user change it later
- [ ] T091 [US8] Currency follows the market: per-market labels for the monetary brackets of the financial, horizon and risk audits in `frontend/locales/en.json` and `frontend/locales/fr.json`, resolved by `frontend/components/audit/audit-form-shell.tsx`
- [ ] T092 [US8] Market-specific questions: option sets per market for employment status, retirement and savings accounts, credit standing, tax situation, geographic comfort and exit options in the five pages under `frontend/app/(authenticated)/audits/`, with matching rules in `backend/src/modules/audit/validation.ts` and `backend/src/modules/audit/scoring.ts`
- [ ] T093 [US8] Add `marketDirective(market)` next to the language directive in `backend/src/shared/ai/language.ts` (instruments that exist in the market, the ones that do not, the currency; for `other`, general guidance marked as not market-specific) and apply it in `backend/src/shared/ai/client.ts`
- [ ] T094 [US8] Per-market capital anchors and examples: new versions of the `identity_synthesis` and `strategy_generation` templates in `backend/prisma/seed.ts`, kept in line with `backend/src/shared/ai/schema-contract.test.ts`
- [ ] T095 [US8] Market vocabulary within French (Canada and France) in `backend/src/shared/ai/language.ts` and in the affected keys of `frontend/locales/fr.json`
- [ ] T096 [US8] Market-aware disclaimers on screens, in `backend/src/modules/blueprint/template.html` and in `backend/src/modules/growth/export.ts`
- [ ] T097 [US8] Verify with a Québec profile and a France profile: no instrument that exists only in the United States, the right currency, relevance rated by someone who knows the market; record in `specs/004-french-language/verification.md`

**Exit check:** both profiles receive strategies and a plan that fit their market, in the right currency.

---

## Dependencies

```
Sprint 1 ──┬── Sprint 2 ──┐
           │              ├── Sprint 5 ── (gate) ── Sprint 6
           └── Sprint 3 ──┤
                 └── Sprint 4 ──┘
```

- **Sprint 1 blocks everything.** T001 → T004 → T005 → T006. T008 → T010 → T011. T012 → T014 → T015 → T016, T017. T012 → T018, T019, T020.
- **Sprint 2:** T025 → T027 to T031. T026 → T027 to T031 → T032. T037 → T038 to T043. T044 and T047 come last.
- **Sprint 3:** T049 → T054, T055, T056. T050 → T052 → T053. T053 → T061 → T062 → T064. T054 to T056 → T059, T060.
- **Sprint 4:** T053 (`getUserLocale`) → T069, T070. T047 → T072.
- **Sprint 5:** T080 → T081. T083 and T084 come after every other task of Sprints 2 to 4.
- **Sprints 2 and 3 are independent of each other** and can run in either order, or side by side.

## Parallel Opportunities

| Sprint | Tasks that can run together |
|--------|------------------------------|
| 1 | T002 + T003 (backend dictionary and its test) alongside T008 + T009 (frontend negotiation and its test); then T013, T018, T020, T021, T023 |
| 2 | T032 alongside the server track T037 to T043; the dictionary-editing tasks (T026 to T031, T033 to T036) run one after another |
| 3 | T050 + T051 alongside T049; T063 and T065 at any time |
| 4 | T068 and T074 alongside the tasks they test |
| 5 | T085 alongside T080 to T082 |

## Implementation Strategy

### First demo
**Sprint 1** alone is demoable: open the site with a French browser or a `?lang=fr` link, register, and find French on another device.

### First complete French session
**Sprints 1 + 2 + 3** deliver Scenario 1: landing page to activated strategy with no English. This is the version to put in front of the first French-speaking testers.

### Incremental delivery order
1. **Sprint 1:** the platform knows the language
2. **Sprint 2:** the interface is fully French, audits included
3. **Sprint 3:** the AI writes in French
4. **Sprint 4:** email, PDF, export and terms in French
5. **Sprint 5:** review, QA, French landing address, funnel per language, release
6. **Gate**, then **Sprint 6:** market fit, or a separate feature

### What needs the founder
| When | What |
|------|------|
| Before Sprint 2 translations (T025) | Glossary sign-off, including the eight French archetype names |
| End of Sprint 2 (T045) | Review of the audit translations |
| Sprint 3 (T064) | Go-ahead for real API spend |
| Sprint 4 (T076) | Review of the French terms; legal review still to arrange |
| Sprint 5 (T078, T079, T087) | Copy sign-off, AI sample review, release sign-off |
| After Sprint 5 (T088) | The Sprint 6 gate decision |
