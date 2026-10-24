# Data Model: RECS Import

## recs_deals (new)

RECS DM-7 (`id`, `user_id`, `c`, `name`, `d`, `created_at`, `deleted_at`) plus this repo's
`public_id` and `tenant_id`.

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | `serial` PK | no | internal, never exposed |
| `public_id` | `text` unique | no | CUID2, the `id` in every response and URL |
| `tenant_id` | `int` FK → `tenants.id` | no | RLS key |
| `user_id` | `int` FK → `users.id` | no | owner |
| `c` | `varchar(64)` | no | calculator slug, in `config/recs.json` at write time |
| `name` | `varchar(120)` | no | trimmed, 1–120 code points |
| `d` | `text` | no | opaque base64url, 1–8,000 chars, stored and returned byte for byte |
| `created_at` | `timestamp(3)` default now | no | "date saved" shown in the hub |
| `deleted_at` | `timestamp(3)` | **yes** | soft delete; null = live (documented nullable) |

No `updated_at`: rows are never edited (constitution I; spec scope excludes renaming).

**Indexes:** `(tenant_id)`; `(tenant_id, user_id, deleted_at, created_at)` for the list query;
`public_id` unique. FKs `ON DELETE RESTRICT ON UPDATE CASCADE`, as the other tables.

**RLS:** `ENABLE ROW LEVEL SECURITY` and policy `tenant_isolation` `USING ("tenant_id" =
current_setting('app.current_tenant_id')::int)`, as in `20260404200000_add_growth_strategy_engine`.

**Prisma:**

```prisma
model RecsDeal {
  id        Int       @id @default(autoincrement())
  publicId  String    @unique @map("public_id")
  tenantId  Int       @map("tenant_id")
  userId    Int       @map("user_id")
  c         String    @db.VarChar(64)  // RECS calculator slug (DM-7)
  name      String    @db.VarChar(120)
  d         String    // Opaque RECS payload: never decoded (RECS D-108 (3))
  createdAt DateTime  @default(now()) @map("created_at")
  deletedAt DateTime? @map("deleted_at") // Soft delete

  tenant Tenant @relation(fields: [tenantId], references: [id])
  user   User   @relation(fields: [userId], references: [id])

  @@index([tenantId])
  @@index([tenantId, userId, deletedAt, createdAt])
  @@map("recs_deals")
}
```

**Lifecycle:** `live` (deleted_at null) → `deleted` (deleted_at set, by the user or by account
deletion). No other states. No dedup: identical sends are separate rows.

**Account deletion** (`backend/scripts/delete-user.ts`, inside the existing transaction):
`tx.recsDeal.updateMany({ where, data: { name: 'deleted', d: '', deletedAt: now } })`, and the
count is added to the script's summary. (`d: ''` is outside the API's validation range on purpose:
the API never writes it, only the purge.)

**Retention:** kept until the user deletes them or the account goes. No scheduled purge in v1.

## Validation rules (identical in `backend/src/modules/recs-deal/validation.ts` and `frontend/lib/recs-import.ts`)

| Field | Rule | Error `details.field` |
|---|---|---|
| `c` | string, in the known-slug list | `c` |
| `name` | string; C0/C1 control characters and U+2028/U+2029 replaced by a space and invisible characters removed (bidi formatting, direction marks, zero-width space, BOM and the rest of spec FR-2's list, as widened at T038), before trimming; trimmed; 1–120 code points and not only U+200C/U+200D | `name` |
| `d` | string; `^[A-Za-z0-9_-]{1,8000}$` | `d` |

## Known calculator list (new config)

`backend/config/recs.json` (authoritative), `frontend/config/recs.json` (copy, drift-tested):

```json
{
  "calculators": [
    { "slug": "multifamily" }, { "slug": "quick-screen" }, { "slug": "single-family" },
    { "slug": "fix-and-flip" }, { "slug": "brrrr" }, { "slug": "wholesaling" },
    { "slug": "subject-to" }, { "slug": "short-term-rental" }
  ]
}
```

Labels: `recs.calculator.<slug>` in `frontend/locales/{en,fr}.json`. Proposed EN (from RECS's
calculator names, shortened): Multifamily, Quick Screen, Single-Family Rental, Fix and Flip,
BRRRR, Wholesaling, Subject-To, Short-Term Rental. FR: Multilogement, Analyse rapide, Location
unifamiliale, Achat-revente, BRRRR, Wholesaling, Subject-To, Location courte durée (to be checked
against RECS's own FR labels when it has them).

## users.signup_source (existing)

Gains the value `recs`. No schema change.

## Session-held import (browser only, not persisted server-side)

`sessionStorage["investoros_recs_import"] = JSON { c, name, d }`, already validated. Written on
arrival, removed on Save or Cancel, on sign-out, and when this tab's session ends in another tab
(a sign-out or any sign-in over it, `frontend/lib/auth-context.tsx`); gone when the tab closes.
