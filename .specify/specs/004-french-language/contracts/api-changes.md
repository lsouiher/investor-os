# API Contract Changes: French as a Full Second Language

**Feature:** 004-french-language
**Base contract:** `.specify/specs/001-identity-platform/contracts/api-v1.md`
**Date:** 2026-09-30

Additive only. No endpoint is removed, no field is renamed, no error code changes. Every body and response stays snake_case. When each sprint ships, its changes are folded into `api-v1.md`.

---

## Common: how the server picks the language

| Caller | Language used |
|--------|---------------|
| Authenticated request | `users.locale` of the authenticated user |
| Unauthenticated request | `Accept-Language` header (the supported language with the highest q-value, header order on ties), else `en` |
| Background work for a user | `users.locale` |

The web client sends `Accept-Language: en` or `Accept-Language: fr` on every request. Supported values: `en`, `fr`; a regional tag such as `fr-CA` resolves to `fr`. Anything else resolves to `en`.

### Error responses (Sprint 2)

Shape unchanged:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [] } }
```

- `code`: unchanged, language-independent.
- `message` and any `details[].message`: written in the request's language for every error a user can meet in the product. Admin-only and developer-facing messages stay in English.
- Rate-limit responses (`RATE_LIMITED`, 429) follow the same rule.

---

## Sprint 1

### POST /api/v1/auth/register

Request adds an optional field:

```json
{ "email": "…", "password": "…", "signup_source": "bpcon", "locale": "fr" }
```

- `locale`: `"en"` or `"fr"`. Missing or invalid: the request's language is used.

Response adds `locale` to `user`:

```json
{ "data": { "user": { "id": "…", "email": "…", "role": "investor", "locale": "fr" }, "token": "…" } }
```

### POST /api/v1/auth/login

Response adds `user.locale`, as above. The client adopts it on the device.

### GET /api/v1/auth/me

Response adds `locale`:

```json
{ "data": { "id": "…", "email": "…", "role": "investor", "locale": "fr", "created_at": "…" } }
```

### PUT /api/v1/auth/me (new)

Updates the authenticated user's own preferences.

- **Auth:** required. **Rate limit:** the per-user brake applied to all authenticated routes (120/min).
- **Request:**

```json
{ "locale": "fr" }
```

- **200:** same body as `GET /auth/me`.
- **400 `VALIDATION_ERROR`:** `locale` missing or not one of `en`, `fr`.
- **Side effect (Sprint 3):** clears the user's cached dashboard insights so they regenerate in the new language.

---

## Sprint 2

No new fields. Messages and system-composed strings in existing responses follow the request's language:

| Endpoint | Field |
|----------|-------|
| All endpoints | `error.message`, `error.details[].message` |
| `GET /identity/status` | `last_error` (rendered when read) |
| `GET /simulations/jobs/:jobId` | `error.message` |
| `GET /growth-strategy`, `GET /growth-strategy/paths/:pathType` | `unlock_criteria`, `unlock_progress`, `export_staleness.changed_since_export[]` |
| `PUT /growth-strategy/paths/:pathType/action-items/:itemId` | `unlocks_triggered[].message` |
| `GET /growth-strategy/export/status` | `changed_since_export[]` |
| `POST /growth-strategy/paths/:pathType/generate` | Early-unlock and cooldown messages. Cooldowns are expressed as a relative duration |
| `GET /dashboard` | `growth_strategy.refresh_suggestions[]`, the "get started" insight |
| `POST /auth/forgot-password`, `POST /auth/reset-password` | `data.message` |

---

## Sprint 3

Generated items expose the language they were written in. Values: `"en"` or `"fr"`.

| Endpoint | New field |
|----------|-----------|
| `GET /identity`, `GET /identity/history[]`, `POST /identity/synthesize` | `locale` |
| `GET /strategies[]`, `GET /strategies/:strategyId` | `locale` |
| `GET /growth-strategy` → `paths[]`, `GET /growth-strategy/paths/:pathType` | `locale` |
| `GET /dashboard` → `identity` | `locale` |

Unchanged and language-independent in every response: `archetype` (the English name is the identifier; the client maps it to a display name), `type`, `severity`, `path_type`, `status`, `action_url`, scores, ids, dates.

Generation endpoints take no language parameter. They always use the account's language:

`PUT /audits/:auditType` (completion triggers synthesis), `POST /identity/synthesize`, `GET /strategies` (on-demand generation), `PUT /strategies/:strategyId/activate`, `POST /simulations`, `GET /dashboard` (insights), `POST /growth-strategy/paths/:pathType/generate`.

---

## Sprint 4

| Endpoint | Change |
|----------|--------|
| `POST /auth/forgot-password` | The email is written in the request's language. The reset link carries `?lang=<locale>` so the reset page opens in the same language |
| `POST /blueprint/generate` | The PDF is produced in the account's language |
| `POST /growth-strategy/export/markdown` | The export is produced in the account's language. File names stay ASCII |

No request or response fields change.

---

## Sprint 6 (gated; direction only)

- `market` (`"us"` \| `"ca"` \| `"fr"` \| `"other"`) on `POST /auth/register` (optional), `GET /auth/me` and `PUT /auth/me`.
- To be specified when the gate opens.

---

## Web client conventions (not API)

| Mechanism | Purpose |
|-----------|---------|
| `locale` cookie (`en` \| `fr`, one year, `SameSite=Lax`, readable by scripts) | The device's explicit choice. Read by `proxy.ts` and the root layout |
| `?lang=en` \| `?lang=fr` on any page URL | Opens the site in that language and stores the choice on the device |
| `/fr` (Sprint 5) | French landing page with its own address for search engines |
