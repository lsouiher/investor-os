# Code review: 003-recs-import (T038, /review)

2026-10-23, against `spec.md` acceptance criteria. Base `master` (merge base `72cbcc8`), all changes
uncommitted on `003-recs-import`. Core pass, an independent adversarial pass, gate scan, then one
re-review after fixes (converged, zero new findings).

**Result: clean, 0 unresolved.** 1 critical and 4 informational found, all fixed; 1 gate flag kept.

## Fixed

| Severity | Where | Problem | Fix | Test |
|---|---|---|---|---|
| CRITICAL | `frontend/lib/api-client.ts` | Any 401 hard-redirected to plain `/login`. A returning user with a token over 24 h old arriving on `/import` was sent to sign-in without `?next=/import`, then to the dashboard: the held deal was stranded (SC-3). A wrong password on `/login` did the same, so the error never showed (pre-existing on master) | A 401 from `/auth/login` is shown as the form error; other 401s go to `loginUrl(pathname)`, which carries `?next=` for allow-listed pages | `lib/api-client.test.ts` (failed before the fix) |
| INFO | `backend/src/shared/middleware/tenant-context.ts` | Async middleware: a rejected `set_config` call (DB blip) was an unhandled rejection that stops the API, the same bug as `auth.ts` | try/catch → `next(err)` | `tenant-context.test.ts` (failed before the fix) |
| INFO | `backend/src/modules/recs-deal/repository.ts`, `service.ts` | Delete was lookup-then-update: two deletes at once both passed the lookup, the second update threw P2025 → 500, and the hub revived a deleted row | One `updateMany` where `{ publicId, userId, tenantId, deletedAt: null }`; count 0 → 404. `findRecsDealByPublicId` removed | `repository.test.ts`, `routes.test.ts`; live probe: 4 concurrent deletes → one 204, three 404 |
| INFO | `frontend/components/hub/recs-deals.tsx` | A failed optimistic delete restored the whole earlier list, reviving a row deleted meanwhile | Restore only the failed row | existing hub tests |
| INFO | `recs-import.ts`, `validation.ts` | Bidi range written as invisible literal characters | `‪-‮⁦-⁩` escapes, same behavior | existing U+202E tests |

## Gate scan

`listed=13 eligible=1`: RH-16 on `frontend/lib/recs-import.ts` (new file, catches around
sessionStorage and `decodeURIComponent`). Kept: they implement FR-2 "nothing to import" and the
session-only hold, covered by `recs-import.test.ts`.

## Noted, not changed

- RLS on `recs_deals` is defense-in-depth only: `set_config(..., true)` outside a transaction and
  an unforced policy mean the repository filters (`userId` + `tenantId` + `deletedAt`) carry
  isolation, as for every other table (same pattern as earlier migrations).
- After a sign-in in another tab, `/import` may show the old email until `/auth/me` returns
  (sub-second); Save already uses the new token.
- `tasks.md` T025/T039 describe the earlier `findRecsDealByPublicId` design; left as the record of
  what was planned.

## Verification

Backend 159/159, frontend 208/208, `tsc --noEmit` clean in both. Live smoke against the local API:
no-token 401 with the process alive, POST 201 with `"Elm\tSt‮"` stored as `"Elm St"`, GET
returns `d` unchanged, DELETE 204 then 404, wrong password 401 with its message, `d` with `+` → 400
on field `d`.
