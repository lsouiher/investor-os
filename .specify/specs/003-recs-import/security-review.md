# Security review: 003-recs-import (T038, /cso)

2026-10-23 · gstack-cso 3.0.0, daily static mode, `--code --diff --base master` · run `1792803977095-175c7385484c1173`
(report kept in `~/.gstack/security/cso/…/report.md`, 30 days). Commits `7dc35b3`, `a7f3eb7`.

**Status: partial** (all planned domains assessed; declared gaps below). **No findings at medium or above.**
The one low finding is **fixed** on this branch (owner decision, T038): 500 live deals per user, see below.

| ID | Severity | Confidence | Location | Finding |
|---|---|---|---|---|
| 89b18400 | LOW | medium | `backend/src/modules/recs-deal/service.ts:6` | No per-user cap on stored deals: one free account can add ~8 KB rows at the 120/min user brake (~1.4 GB/day), only time-bounded. Same pattern pre-exists in contacts and tasks. **Fixed:** `createRecsDeal` refuses the 501st live deal (400, field `limit`); `/import` shows "You have 500 saved deals…" (EN/FR). Tests in `routes.test.ts`, `repository.test.ts`, `page.test.tsx`; live: 501st POST → 400, after one delete → 201. Contacts and tasks keep the pre-existing pattern (follow-up). |

## Invariants checked (held)

- **Open redirect:** `safeNextPath` is an exact match on `["/import"]`; `/login` and `/register` and the new `loginUrl` (401 redirect) all go through it.
- **XSS:** the deal name renders as React text on `/import` and in the hub. The "Open in RECS" href = env base + slug from the config allow-list + `d` matching `^[A-Za-z0-9_-]{1,8000}$`, so no `javascript:` URL and no fragment injection. `rel="noopener noreferrer"`.
- **Pre-save disclosure:** the deal is read from the fragment and held in sessionStorage; nothing is sent before Save. Validation messages never echo `d`.
- **Isolation:** list and delete filter `publicId`/`userId`/`tenantId`/`deletedAt`; another user's id → 404, indistinguishable. Delete is one atomic `updateMany`.
- **Fail-safe:** async `authenticate` and `setTenantContext` now route errors to `next(err)` (no process crash).
- **Erasure:** `delete-user` sets `name='deleted'`, `d=''`, `deletedAt`.

## Declared gaps

- RLS on `recs_deals` is defense in depth only (`set_config(..., true)` outside a transaction, policy not forced): isolation rests on the repository filters, as for every other table. Not a finding.
- No scanners (daily static mode); deployed Railway configuration not in the snapshot.
