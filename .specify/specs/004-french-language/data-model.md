# Data Model Changes: French as a Full Second Language

**Feature:** 004-french-language
**Date:** 2026-09-30
**Base:** `backend/prisma/schema.prisma` at v0.4.1 (see `001-identity-platform/data-model.md` for the full model)

All changes are additive. Migrations are append-only (constitution IV). No existing column changes type, and no row needs a backfill beyond column defaults.

---

## New enum

```prisma
enum Locale {
  en
  fr
}
```

## Sprint 1 — the account's language

| Table | Column | Type | Null | Default | Notes |
|-------|--------|------|------|---------|-------|
| `users` | `locale` | `Locale` | No | `en` | The language the user chose. Applies to the interface after sign-in and to everything generated or sent for the user. Set at registration, changed through `PUT /auth/me` |

- Existing rows take the default, which matches what every existing user has received so far.
- No index: the column is never a filter on a hot path. The funnel report groups a small table by it.
- Not sensitive: no field-level encryption.
- Row-level security is unaffected (no new table, no policy change).

Migration: `add_user_locale` (creates the enum and the column).

## Sprint 3 — the language of generated items

| Table | Column | Type | Null | Default | Notes |
|-------|--------|------|------|---------|-------|
| `identity_versions` | `locale` | `Locale` | No | `en` | Language the synthesis was written in |
| `strategies` | `locale` | `Locale` | No | `en` | Language the strategy (and its plan) was written in |
| `growth_paths` | `locale` | `Locale` | No | `en` | Language of the current generated content; rewritten on regeneration |

- Existing rows take `en`, which is true: nothing has been generated in French before this feature.
- Written once at generation time from `users.locale`. Never updated by a language switch.
- `strategies.locale` is set when the three strategies are generated. The plan produced at activation uses the account's language at that moment; if the user switched in between, the plan can differ from the strategy's recorded language. This is accepted (spec edge case: items finish in the language they started in).

Migration: `add_generated_content_locale`.

### What is deliberately not stored

| Item | Why |
|------|-----|
| A language on `simulations` | Results are shown once, right after they are produced |
| A language on `users.insights_cache` | The cache is cleared when `users.locale` changes, so it is always in the account's language |
| The archetype's French name | `identity_versions.archetype` keeps the English name as the identifier; display names live in the dictionaries (research R8) |
| Translated audit answers | Answers are stored as codes (`"under-25000"`, `"w2"`), independent of language |
| A device language | Lives in the `locale` cookie in the browser |

## Sprint 6 — the investor's market (gated; direction only)

```prisma
enum Market {
  us
  ca
  fr
  other
}
```

| Table | Column | Type | Null | Default | Notes |
|-------|--------|------|------|---------|-------|
| `users` | `market` | `Market` | No | `us` | Where the investor invests. Drives currency, market-specific audit options and the AI's market context |

To be confirmed when the gate opens. Nothing in Sprints 1 to 5 depends on it.

---

## Language resolution (state, not storage)

```
Signed out:   ?lang= parameter  →  locale cookie  →  browser Accept-Language  →  en
Registration: the language in effect is saved to users.locale
Signed in:    users.locale  (the device cookie is updated to match)
Switch while signed in:  cookie + users.locale updated; insights cache cleared
Background work:         users.locale read by user id
```

## Dictionaries (files, not tables)

| File | Contents | Parity guard |
|------|----------|--------------|
| `frontend/locales/en.json`, `fr.json` | Interface text. Flat keys, dot notation. Plural variants use `.one` / `.other` suffixes | `frontend/lib/i18n.test.ts` |
| `backend/src/shared/i18n.ts` | Text the server writes: errors, rate limits, system sentences, email, PDF, export | The `fr` map is typed against the keys of `en`; placeholders checked in `i18n.test.ts` |
| `backend/src/shared/ai/language.ts` | The French directive for the model: rules, glossary, archetype names | `language.test.ts` |
| `.specify/specs/004-french-language/glossary.md` | The agreed term for each product concept; source for the two dictionaries and the directive | Reviewed by hand (Sprint 2, final in Sprint 5) |

### Key conventions added

| Pattern | Example | Used by |
|---------|---------|---------|
| `audit.<type>.section.<sectionId>` | `audit.financial.section.income` | `AuditFormShell` |
| `audit.<type>.field.<name>.label` / `.placeholder` | `audit.skills.field.current_learning.placeholder` | `AuditFormShell` |
| `audit.<type>.option.<name>.<value>` | `audit.financial.option.primary_income.under-25000` | `AuditFormShell` |
| `audit.shell.*` | `audit.shell.section_of`, `audit.shell.required` | `AuditFormShell` |
| `archetype.<slug>` | `archetype.cash_flow_hunter` | `archetypeLabel()` in `frontend/lib/identity.ts` |
| `growth_content.<key>` | `growth_content.reinvestment_strategy` | Growth path detail page |
| `meta.*` | `meta.title`, `meta.description` | Root layout metadata |
| `<key>.one` / `<key>.other` | `strategy.countdown.days.one` | `t()` with a `count` parameter |
