# Research & Decisions: French as a Full Second Language

**Feature:** 004-french-language
**Date:** 2026-09-30
**Inputs:** `spec.md`, the constitution, `docs/ai-pipeline.md` (G14 / P8), the code on `master` at v0.4.1, and the Next.js 16 guides shipped in `frontend/node_modules/next/dist/docs/` (internationalization, proxy, cookies).

Each decision lists what was chosen, why, and what was set aside.

---

## R1. Keep the custom i18n provider

- **Decision:** Extend `frontend/lib/i18n.tsx` (65 lines today). No i18n library.
- **Rationale:** Constitution II. What is missing (server-provided initial language, plurals, date and number formatting) is covered by `Intl.PluralRules`, `Intl.DateTimeFormat` and `Intl.NumberFormat`, which ship with the platform. The 403 existing keys and every `t()` call stay as they are.
- **Alternatives:** `next-intl` (the Next.js guide lists it). It would bring routing conventions this app does not use and a migration of every call site, for no capability we need.

## R2. Language at first paint: cookie + `proxy.ts` + server-rendered root layout

- **Decision:** A `locale` cookie holds the device's explicit choice. `frontend/proxy.ts` (Next.js 16's name for middleware) resolves the language for each page request in this order: `?lang=` parameter, cookie, `Accept-Language`, English. It passes the result to the app in an `x-locale` request header and writes the cookie only for explicit choices. The root layout reads the header, sets `<html lang>`, localizes the metadata and gives `I18nProvider` its initial language, so the server renders the right language and nothing flips after load.
- **Rationale:** Smallest change that removes the flash and fixes the tab title and declared language (FR-1.8). No URL changes for the signed-in app.
- **Cost:** Reading request headers in the root layout makes every route dynamically rendered. Pages already fetch their data in the browser, so the server work per request is small. The landing page's load time is measured before and after (constitution IX).
- **Alternatives:**
  - `app/[lang]/…` route segments (the guide's recommended pattern): static rendering per language and clean URLs, but it moves every route and every link. Rejected for the app; a single `/fr` landing address is added in Sprint 5 for search engines (R11).
  - An inline script like the theme script: it can set a class before paint, but it cannot swap rendered text.

## R3. The account owns the language; the device covers signed-out pages

- **Decision:** `users.locale` (`en` | `fr`, not null, default `en`). Signed in: the account's language applies. Signed out: cookie, then browser, then English. Registration saves the language in effect. A switch made while signed in updates the account (`PUT /auth/me`). On sign-in the client adopts the account's language.
- **Legacy:** v0.3.2 stored the choice in `localStorage.locale`. On the first authenticated load after release, a legacy value of `fr` is written to the account once, then the key is removed.
- **Rationale:** One rule that can be explained in a sentence, no nullable column, and no way for one person's signed-out choice on a shared device to change another person's account.
- **Alternatives:** "Most recent explicit choice wins, even one made while signed out" (pushes a pending choice to the account at sign-in). Slightly friendlier in one case, but it needs an extra flag and can change the wrong account on a shared device.

## R4. How the server learns the language

- **Decision:** `req.locale`. A small middleware sets it from the `Accept-Language` header, which the API client now sends with the interface language. `authenticate` already loads the user on every request; it adds `locale` to its select and overrides `req.locale`. Background work (chained strategies, insight warm-up, Bull workers) reads `users.locale` by user id.
- **Rationale:** No extra query, and one source of truth for anything generated or sent on the user's behalf.
- **Alternatives:** A language claim in the JWT (stale after a switch until the token is reissued). A `locale` field in every request body (easy to forget; useless for background jobs).

## R5. One server-side dictionary for everything the server writes

- **Decision:** `backend/src/shared/i18n.ts`: an `en` map, an `fr` map typed as `Record<keyof typeof en, string>` (the compiler enforces key parity), `t(locale, key, params)`, and the `Accept-Language` parser. It serves error messages, rate-limit messages, system-composed sentences, the email, the PDF and the export.
- **Errors:** `AppError.localized(code, key, params?, status?, details?)` keeps the English text in `message` for logs and carries the key; `errorHandler` renders it with `req.locale`. Error codes and the response shape do not change, so the frontend keeps displaying `error.message` as it does today. Admin-only and developer-facing messages stay in English.
- **Rationale:** The email, PDF and export are rendered on the server, so a server dictionary is needed anyway. Reusing it for errors avoids adding ~40 granular error codes and a second mapping layer in the frontend.
- **Alternatives:** Granular error codes translated in the frontend (keeps all text in one place, but touches the API contract and every error site, and does not help the email, PDF or export). Sharing the frontend JSON with the backend (couples two separately built images).

## R6. Audit forms: labels by key convention

- **Decision:** The five audit pages keep only structure (section ids, field names, types, option values, `required`). `AuditFormShell` resolves labels by convention: `audit.<type>.section.<id>`, `audit.<type>.field.<name>.label`, `audit.<type>.field.<name>.placeholder`, `audit.<type>.option.<name>.<value>`, plus `audit.shell.*`. English values are the current literals, moved verbatim.
- **Rationale:** About 560 strings move without inventing 560 hand-written `t()` calls, and a missing key is caught by the parity test. Stored answers are already codes (`"under-25000"`, `"w2"`), so nothing changes in the database, the validation or the scoring.
- **Alternatives:** Serving audit definitions from the backend per language (a new endpoint and a new source of truth for no gain).

## R7. AI language: one directive, applied centrally

- **Decision:** `AiCallOptions` gains a required `locale`. `callClaude` appends `languageDirective(locale)` to the system prompt: nothing for English, and for French a block that (1) requires every human-readable string value to be written in natural French, (2) lists what must stay exactly as specified (JSON keys, enumerated values, `action_url`, ISO dates, the `archetype` value), (3) carries the glossary and the French archetype names for use in prose, and (4) sets typography and currency rules. The directive lives in `backend/src/shared/ai/language.ts`. Prompt templates are not edited.
- **Rationale:** Eight call sites go through one function. A required option means the compiler finds any call site that forgets the language. English prompts are byte-for-byte unchanged, so the v0.4.1 verification of English still holds. One rubric and one archetype list serve both languages, which is what keeps scores comparable (FR-3.4).
- **Departure from `docs/ai-pipeline.md` P8,** which proposed a `{{LANGUAGE}}` placeholder in every template: that needs eight template edits and seven `assemblePrompt` changes, and an admin editing a template can drop the placeholder silently. The directive is not hot-swappable; changing it needs a deploy. Accepted.
- **Alternatives:** Separate French templates (two rubrics to keep in sync; scores drift). Translating English output after generation (a second model call per generation and translated-sounding French).

## R8. Archetypes: the English name is the identifier

- **Decision:** The model returns the archetype exactly as listed in English, in both languages. That value is stored as today. Display names come from dictionaries: `archetype.<slug>` in the frontend, the same eight names in the server dictionary for the PDF, the export and the AI directive. An archetype outside the list displays as returned.
- **Rationale:** No schema change, no data migration, and the history's side-by-side comparison keeps working because the stored value never depends on language (FR-3.5).
- **Note:** `backend/src/modules/identity/comparison.ts` composes an English narrative, but no route serves it. It is left alone.
- **Draft French names** (to be confirmed by the reviewer in Sprint 2):

  | Identifier (stored) | French display name |
  |---|---|
  | Cash Flow Hunter | Chasseur de cash-flow |
  | Conservative Builder | Bâtisseur prudent |
  | Wealth Architect | Architecte de patrimoine |
  | Value-Add Operator | Opérateur à valeur ajoutée |
  | House Hacker | Propriétaire-occupant investisseur |
  | Passive Capital Partner | Partenaire financier passif |
  | Skilled Trades Investor | Investisseur de métier |
  | Portfolio Scaler | Bâtisseur de portefeuille |

- **Alternatives:** A new `archetype_key` column with a backfill (more moving parts for the same result).

## R9. Content generated earlier: mark it, let the user regenerate

- **Decision:** `locale` columns on `identity_versions`, `strategies` and `growth_paths` (not null, default `en`, which is true of every existing row). When an item's language differs from the interface, the page shows a notice and one action that reuses the existing regeneration flows: re-synthesis (which chains new strategies) and growth path regeneration (with its cooldown). The content container carries a `lang` attribute for assistive technology. Dashboard insights are short-lived: the cache is cleared when the account's language changes.
- **Rationale:** Regeneration already exists, with limits. Nothing is rewritten behind the user's back, and scores never move because someone changed a setting.
- **Alternatives:** Translating stored content in place (keeps plan progress, but needs per-language storage or overwrites append-only history). Regenerating automatically on switch (surprise changes and AI cost).

## R10. Verification in French

- **Decision:** The mock server returns French canned responses when the system prompt contains the French directive. A script, `backend/scripts/verify-locale.ts`, walks the pipeline as a French user (register, five audits, identity, strategies, activation, insights, simulation, growth path) and checks every generated text field with a small stop-word heuristic (`looksFrench`). It runs against the mock for free and against the real API on demand.
- **Rationale:** The v0.4.1 "25/25" was a manual checklist. FR-3.14 needs something repeatable, and "is this French" is cheap to automate.
- **Alternatives:** A language-detection library (a dependency for a 20-line heuristic). An LLM judge (cost and nondeterminism for a yes/no question).

## R11. A French address for the landing page (Sprint 5)

- **Decision:** `app/page.tsx` and a new `app/fr/page.tsx` become thin server components that export localized metadata with `alternates.languages` (hreflang) and render one shared client landing component. The proxy treats `/fr` as French. A sitemap lists both addresses.
- **Rationale:** Crawlers send no cookie and usually no French `Accept-Language`, so a language chosen per request is invisible to them. One extra route covers the only page that needs to be found by search.
- **Alternatives:** Full `[lang]` routing (see R2). A separate French domain (out of scope).

## R12. Guarding against hard-coded text

- **Decision:** Enable `react/jsx-no-literals` in `frontend/eslint.config.mjs`; the rule ships with `eslint-plugin-react`, already installed through `eslint-config-next`. It starts as a warning in Sprint 1 and becomes an error at the end of Sprint 2. A Jest test checks dictionary parity: same keys, same placeholders, no empty values.
- **Rationale:** No new dependency; the same `npm run lint` and `npm test` the project already runs.

## R13. Formatting conventions

- **Decision:** `Intl` with the tag `fr` for French and `en-US` for English, driven by the interface language. Sprints 1 to 5 keep US dollars; French labels write amounts the French way and name the currency ("25 000 $ US"). Region-specific formatting (`fr-CA`, `fr-FR`) arrives with the market in Sprint 6.
- **Server times:** `toLocaleTimeString()` in `growth/service.ts` formats in the server's time zone. Cooldown messages switch to a relative duration ("in 12 minutes"), which is correct in any zone.

## R14. Terms page in two languages

- **Decision:** Two content components, one per language, selected by the interface language in `app/terms/page.tsx`.
- **Rationale:** A page of legal prose is easier to review side by side as two documents than as 60 dictionary keys.

## R15. Sprint 6 (market) — direction only

- **Decision:** Not designed in detail until the gate opens. Expected shape: `users.market` (`us` | `ca` | `fr` | `other`, default `us`), per-market variants for the affected audit options and labels, a `marketDirective(market)` next to the language directive, and per-market capital anchors in the synthesis rubric.
- **Rationale:** Constitution I: no speculative architecture. Nothing in Sprints 1 to 5 blocks this shape.
