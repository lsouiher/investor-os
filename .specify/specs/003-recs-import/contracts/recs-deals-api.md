# API Contract: /api/v1/recs-deals

Mounted after `authenticate, userLimiter, setTenantContext` (per-user brake 120/min, global IP
brake 600/min before it). All responses snake_case. Errors use the standard shape
`{ "error": { "code", "message", "details" } }`. Missing or invalid token: 401 as every
authenticated route.

## POST /api/v1/recs-deals

Save a deal sent from RECS.

Request:

```json
{ "c": "multifamily", "name": "Elm St 12-plex", "d": "N4IgLgpgdg5g..." }
```

| Field | Rule |
|---|---|
| `c` | required string, in `config/recs.json` |
| `name` | required string; control characters become spaces and bidi formatting characters are removed, then trimmed; 1–120 code points. The cleaned name is what is stored and returned |
| `d` | required string; `^[A-Za-z0-9_-]{1,8000}$`; stored exactly as received |

201:

```json
{ "data": { "id": "clx3k9…", "c": "multifamily", "name": "Elm St 12-plex", "created_at": "2026-12-05T10:00:00.000Z" } }
```

400 `VALIDATION_ERROR`, `details: [ { "field": "c" | "name" | "d" } ]`. One error per request,
first failing field in the order `c`, `name`, `d`. The message never echoes `d`.

No dedup: the same body twice gives two rows and two ids.

400 `VALIDATION_ERROR`, `details: [ { "field": "limit" } ]` when the caller already has 500 live deals
(checked after the field rules; count then insert, so concurrent saves may pass it by a few).

## GET /api/v1/recs-deals

The caller's live deals, newest first. No pagination in v1.

200:

```json
{ "data": [ { "id": "clx3k9…", "c": "multifamily", "name": "Elm St 12-plex", "d": "N4IgLgpgdg5g...", "created_at": "2026-12-05T10:00:00.000Z" } ] }
```

`d` is byte-for-byte what POST received. Empty list: `{ "data": [] }`.

## DELETE /api/v1/recs-deals/:id

Soft delete one of the caller's deals. `:id` is the public id.

204, no body.
404 `NOT_FOUND` if the id does not exist, is already deleted, or belongs to another user or
tenant (indistinguishable on purpose).

## Tests that pin this contract (`backend/src/modules/recs-deal/routes.test.ts`)

Happy POST → 201 with the four fields; unknown slug → 400 `c`; name of spaces → 400 `name`;
121-code-point name → 400, 120 emoji → 201; name `"Elm\tSt\u202E"` → 201 with name `"Elm St"`; 8,001-char `d` → 400; `d` containing `+`, `/`, `=`
or a space → 400; GET returns the stored `d` equal to the sent one; GET excludes deleted; DELETE
another user's id → 404; DELETE twice → 204 then 404; snake_case keys (`created_at`).
