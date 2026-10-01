# Implementation Plan: French as a Full Second Language

**Feature:** 004-french-language
**Created:** 2026-09-30
**Spec:** [spec.md](./spec.md)
**Decisions:** [research.md](./research.md) · **Data:** [data-model.md](./data-model.md) · **API:** [contracts/api-changes.md](./contracts/api-changes.md) · **Run it:** [quickstart.md](./quickstart.md)

---

## Technical Context

### Stack (unchanged)

| Layer | Technology | Notes for this feature |
|-------|-----------|------------------------|
| Frontend | Next.js 16.2 (App Router), React 19, TypeScript | Middleware is named `proxy.ts` in Next 16; `cookies()` and `headers()` are async. Read `frontend/node_modules/next/dist/docs/` before writing code (`frontend/AGENTS.md`) |
| Backend | Express, TypeScript, modular monolith | New shared module `shared/i18n.ts`; `req.locale` |
| Database | PostgreSQL, Prisma | One enum, four columns, two append-only migrations |
| AI | Anthropic Claude API via `shared/ai/client.ts` | One French directive appended centrally; templates untouched |
| Queue | Bull + Redis | Workers read `users.locale` |
| PDF | Puppeteer + `blueprint/template.html` | Labels from the server dictionary |
| Email | Resend | Subject and body from the server dictionary |

**New dependencies: none.** Dates, numbers and plurals use `Intl`. The hard-coded-text guard uses `react/jsx-no-literals`, already installed through `eslint-config-next`.

### What exists (v0.4.1)

| Piece | Where | State |
|-------|-------|-------|
| i18n provider, `t()` with `{{param}}` interpolation, English fallback | `frontend/lib/i18n.tsx` | Client-only; language read from `localStorage` after mount |
| Dictionaries | `frontend/locales/en.json`, `fr.json` | 403 keys each, full parity |
| Toggle | `frontend/components/shared/language-toggle.tsx` | Mounted only in the desktop sidebar of `app/(authenticated)/layout.tsx` |
| Audit forms | `frontend/app/(authenticated)/audits/*/page.tsx`, `components/audit/audit-form-shell.tsx` | Literal English; answers stored as codes |
| Server language handling | — | None. No `locale` anywhere in `backend/` |
| AI calls | 8 call sites through `callClaudeWithRetry` | English system prompts, English templates in `prisma/seed.ts` |
| Server-written text | `AppError` (101 sites, 6 codes), `rate-limiter.ts`, `growth/service.ts`, `growth/export.ts`, `insight/service.ts`, `blueprint/`, `shared/email.ts` | English literals |

### Approach in one paragraph

Give the account a language and make the server aware of it on every request and in every background job (Sprint 1). Move the remaining interface text, the audits above all, into the dictionaries (Sprint 2). Append one French directive to every model call from a single place, keep the archetype's English name as its identifier, record the language of what was generated, and let users regenerate older content (Sprint 3). Render the email, the PDF, the export and the terms from a server-side dictionary (Sprint 4). Review, test, add a French landing address and report the funnel per language (Sprint 5). Market work waits behind its gate (Sprint 6).

---

## Constitution Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity first | Pass | Existing provider kept; one server dictionary file; one directive for eight AI call sites; no route restructuring |
| II. Dependencies | Pass | Zero new dependencies. `Accept-Language` parsing is ~10 lines instead of `negotiator` + `@formatjs/intl-localematcher` |
| III. Code structure | Pass | Co-located tests (`i18n.test.ts`, `language.test.ts`, `locale.test.ts`); no barrel files; presentation keeps its text in dictionaries |
| IV. Data and persistence | Pass | Append-only migrations; all new columns non-null with defaults; no index needed (documented in data-model.md) |
| V. APIs and server-side logic | Pass | Error and success shapes unchanged; language changes are written server-side through `PUT /auth/me`; the new endpoint sits behind auth and the per-user limiter |
| VI. Auth | Pass | `PUT /auth/me` updates only the caller's own row; the language is validated against an enum |
| VII. Frontend | Pass | The language is decided on the server for first paint; `<html lang>` is correct for assistive technology; no inline styles added |
| VIII. Testing | Pass | Parity and negotiation tests are pure and fast; the AI pipeline is verified against the mock |
| IX. Performance | Watch | Reading request headers in the root layout makes routes dynamic. Measure the landing page before and after Sprint 1 (T022) |
| X. Security | Pass | `?lang` and `locale` are whitelisted; user text is never translated or re-rendered differently; the directive is built from an enum, never from user input |
| XI. Governance | Justified below | Two new patterns |

**New patterns (XI).** (1) `frontend/proxy.ts`: the only way to know the language before the first byte of HTML; without it the page flashes English and declares the wrong language. (2) `backend/src/shared/i18n.ts`: the email, PDF and export are rendered on the server and cannot use the frontend dictionary; reusing the same module for error messages avoids a second mechanism.

---

## Build Sprints

Each sprint is one pull request into `master` through the usual cycle (implement → `/review` → `/qa` → `/ship`). English behavior is unchanged at every merge.

### Sprint 1: Foundation

**Covers:** FR-1.1 to FR-1.13 · **Size:** M · **Depends on:** nothing

**Backend**
- `Locale` enum and `users.locale` (migration `add_user_locale`).
- `shared/i18n.ts`: `Locale`, `isLocale`, `parseAcceptLanguage`, `t(locale, key, params)`, `en` and `fr` maps (few keys at this stage).
- `req.locale`: header middleware registered before `generalLimiter` in `main.ts`; `authenticate` selects `locale` and overrides it.
- Auth: `locale` accepted at registration, returned by register, login and `GET /auth/me`; new `PUT /auth/me`.

**Frontend**
- `lib/locale.ts`: supported languages, cookie name, negotiation. Shared by the proxy and the client.
- `proxy.ts`: resolves the language (`?lang` → cookie → `Accept-Language` → `en`), sets the `x-locale` request header, writes the cookie for explicit choices.
- `app/layout.tsx`: async; reads `x-locale`; sets `<html lang>`; `generateMetadata()` with `meta.title` / `meta.description`; passes `initialLocale` to the provider.
- `lib/i18n.tsx`: `initialLocale` prop replaces the `localStorage` effect; `setLocale` writes the cookie; plural selection through `Intl.PluralRules` (`.one` / `.other` keys); `formatDate`, `formatTime`, `formatNumber`, `formatPercent`.
- `lib/api-client.ts`: `Accept-Language` on every request.
- `lib/auth-context.tsx`: `user.locale`; registration sends the language; sign-in and `/auth/me` adopt the account's language; one-time adoption of the legacy `localStorage.locale`.
- `LanguageToggle`: persists to the account when signed in; mounted on the landing, sign-in, registration, forgot-password, reset-password and terms pages, and reachable on phones in the signed-in layout (the sidebar that holds it today is hidden below `md`).
- Dates: the three `toLocaleDateString()` / `toLocaleTimeString()` calls use the new helpers. Plural keys for the existing counted strings.

**Safeguards**
- `lib/i18n.test.ts`: key parity, placeholder parity, no empty values, plural selection, fallback.
- `react/jsx-no-literals` as a warning in `eslint.config.mjs`.

**Exit check:** the four "Done when" items of Sprint 1 in the spec, plus landing-page load time compared with `master`.

### Sprint 2: French interface, complete

**Covers:** FR-2.1 to FR-2.9 · **Size:** L · **Depends on:** Sprint 1

**Glossary first**
- `glossary.md` in this folder: every product concept, its French term, notes. The translations below follow it.

**Audits**
- `AuditFormShell` resolves labels by key convention (research R6); its own strings move to `audit.shell.*`.
- The five audit pages keep structure only. About 560 keys are added to both dictionaries: English moved verbatim, French written with the FR-2.3 wording (neutral term, US term as an example, amounts labeled as US dollars).

**Leftovers**
- Dashboard badges and labels, simulation labels, radar axes, `AUDIT_LABELS` in `lib/identity.ts`, `PathCard` screen-reader labels, growth path content headings (`growth_content.*` with a prettified fallback), fallback error strings in `ExportButton`, `blueprint-download` and `api-client`.

**Server messages**
- `AppError.localized(...)`; `errorHandler` renders with `req.locale`.
- User-visible errors move to keys (about 40 of the 101 sites): auth, audits, identity, strategies, simulations, growth, blueprint, export, contacts, tasks, AI failures in `retry.ts`. Admin and developer-facing ones stay as they are.
- Rate-limit messages become functions of the request.
- `lastSynthesisError` and simulation job errors keep the key and are rendered when read.
- System sentences through `t(req.locale, …)`: `UNLOCK_CRITERIA`, early-unlock and cooldown messages (relative duration), refresh suggestions, staleness reasons, the "get started" insight.

**Finish**
- French typography pass over `fr.json` (non-breaking spaces, guillemets, apostrophes).
- Layout check at 360 px on every screen in French.
- `react/jsx-no-literals` becomes an error (the terms page is exempt until Sprint 4).

**Exit check:** French walkthrough with no English in the interface; identical sub-scores for identical answers in both languages; lint and tests green.

### Sprint 3: French AI

**Covers:** FR-3.1 to FR-3.14 · **Size:** L · **Depends on:** Sprint 1 (independent of Sprint 2)

**Backend**
- Migration `add_generated_content_locale` (`identity_versions`, `strategies`, `growth_paths`).
- `shared/ai/language.ts`: `languageDirective(locale)` (research R7), with the glossary and the French archetype names.
- `AiCallOptions.locale` is required; `callClaude` appends the directive to the system prompt. All eight call sites pass the account's language, read by user id just before the call, so background and chained work need no extra plumbing.
- The language is saved with each identity version, strategy set and growth path, and returned by the API.
- `PUT /auth/me` clears the insight cache when the language changes.

**Frontend**
- `archetypeLabel(name, t)` in `lib/identity.ts`; used wherever an archetype is displayed (identity card, dashboard, history, growth page, simulation, landing example).
- A "generated in another language" notice with a regenerate action on the identity, strategies, strategy detail and growth path pages; the content container carries a `lang` attribute. Regeneration reuses re-synthesis and path regeneration, after a confirmation that states the consequences.

**Verification**
- `scripts/mock-anthropic.mjs` answers in French when the directive is present.
- `scripts/verify-locale.ts` (`npm run verify:fr`): full pipeline as a French user; every generated text field must pass `looksFrench`.
- Contract tests extended with French samples; unit tests for the directive.
- One run against the real API in French and one in English for three reference profiles; results and score differences recorded in `specs/004-french-language/verification.md`.

**Exit check:** the three "Done when" items of Sprint 3 in the spec.

### Sprint 4: French beyond the screen

**Covers:** FR-4.1 to FR-4.6 · **Size:** M · **Depends on:** Sprints 1 and 3

- **Email:** `sendPasswordResetEmail(to, token, locale)`; `forgotPassword` receives `req.locale`; the link carries `?lang=`.
- **Blueprint PDF:** `template.html` takes its labels and `lang` from the server dictionary; radar axes, path names, fit and progress labels, empty states and dates are localized; archetype shown by its display name; a note when the content was generated in another language.
- **Export:** headings, labels and statuses in `growth/export.ts` from the server dictionary. The three copies of the path-name map (`blueprint/service.ts`, `growth/service.ts`, `growth/export.ts`) collapse into dictionary keys.
- **Terms:** two content components selected by language in `app/terms/page.tsx`; the lint exemption is removed.
- **Disclaimers:** every English disclaimer has its French counterpart on screens, in the PDF and in the export.

**Exit check:** reset email, PDF, export and terms verified in both languages; accents render in the Docker image (Chromium with `fonts-liberation`).

### Sprint 5: Launch readiness

**Covers:** FR-5.1 to FR-5.8 · **Size:** M · **Depends on:** Sprints 2, 3, 4

- **Copy review:** a side-by-side sheet of every key added by this feature for the reviewer; corrections applied; glossary frozen.
- **AI review:** three reference profiles through every generation type in French, scored against the rubric of FR-5.2; score parity recorded (success criterion 6).
- **QA:** `/qa` on staging in French (all screens, phone and desktop, light and dark, email, PDF, export), then the English regression pass.
- **Discoverability:** shared landing component; `app/page.tsx` and `app/fr/page.tsx` as server wrappers with localized metadata and `alternates.languages`; `app/sitemap.ts`; the proxy maps `/fr` to French.
- **Measurement:** `scripts/funnel-report.ts` breaks the funnel and the identity rating down by `users.locale`.
- **Docs and release:** `CLAUDE.md`, `docs/ai-pipeline.md` (G14 closed), `docs/codebase-guide.md`, `api-v1.md` folded; changelog and version through `/ship`.

**Exit check:** the three "Done when" items of Sprint 5 in the spec.

### Sprint 6: Market fit (gated)

**Covers:** FR-6.1 to FR-6.9 · **Size:** L · **Depends on:** Sprints 1 to 5 and the gate decision

Direction only (research R15): `users.market`, a market question, per-market audit options and currency, `marketDirective(market)`, per-market rubric anchors, market vocabulary within French, disclaimers. To be planned in detail, possibly as feature 005, once the first market is chosen.

---

## Cross-Cutting

### Translation workflow
1. Claude drafts the French from the English source and the glossary.
2. The parity test and the lint rule catch anything missing or left hard-coded.
3. The founder reviews each batch (Sprint 2 audits are the large one) and signs off in Sprint 5.

### Who does what
| | Claude Code | Founder |
|--|-------------|---------|
| Code, tests, French drafts, mock runs | ✓ | |
| Glossary sign-off, copy review, AI sample review | | ✓ |
| Approval of real API spend (Sprints 3 and 5) | | ✓ |
| Legal review of the French terms | | ✓ (external) |
| Sprint 6 gate decision | | ✓ |

### Rollback
Every sprint is additive. If French AI output disappoints after Sprint 3, removing the directive call in `callClaude` returns French accounts to English output without touching data.

---

## Generated Artifacts

| File | Contents |
|------|----------|
| `spec.md` | Requirements by sprint, scenarios, success criteria |
| `research.md` | 15 decisions with rationale and alternatives |
| `data-model.md` | Enum, four columns, dictionary conventions |
| `contracts/api-changes.md` | API additions per sprint |
| `quickstart.md` | How to run and verify French locally |
| `tasks.md` | Tasks per sprint |
| `checklists/requirements.md` | Spec quality checklist |

## Next Steps

1. Done 2026-10-01: the founder confirmed the three scope defaults (see Clarifications in `spec.md`).
2. `/speckit-analyze` for a consistency pass across spec, plan and tasks.
3. Optional challenge: `/plan-eng-review` on this plan.
4. `/speckit-implement`, Sprint 1 (T001 to T024).
