# TODOS

## Design Debt

### TODO-D1: Create full DESIGN.md via /design-consultation
**What:** Establish a complete design system: component library, icon system, animation specs, full color palette, type scale, component documentation.
**Why:** The plan has minimum viable tokens (typeface, accent, spacing) but no component-level specs. Each new component risks visual inconsistency without a design system.
**Pros:** Consistent UI from day one. Faster implementation (no design decisions during coding). Shareable design language across team.
**Cons:** ~30 min of design consultation work before implementation starts.
**Context:** Design review (2026-04-03) added minimum tokens to plan.md. This TODO upgrades to a full system.
**Depends on:** Nothing. Can run anytime before or during Phase 1.

### TODO-D2: Generate visual mockups via /design-shotgun
**What:** Generate visual mockup variants for Dashboard, Identity Hub, Identity Card, Strategy page.
**Why:** Text descriptions and ASCII mockups capture decisions but implementers work faster from visual references.
**Pros:** Visual spec reduces implementation ambiguity. Catches design issues before code.
**Cons:** Requires OpenAI API key setup (~2 min).
**Context:** Design review (2026-04-03) could not generate mockups — OpenAI key not configured.
**Depends on:** OpenAI API key configured for gstack designer.

### TODO-D3: Blueprint PDF visual design
**What:** Design the Investment Blueprint PDF layout as a polished, shareable document.
**Why:** Users download and potentially share this with partners/lenders. A data dump in an HTML template does not represent the brand.
**Pros:** Professional deliverable that builds trust. Shareable artifact for investor networking.
**Cons:** Requires Identity Card component to be built first (SVG render for PDF).
**Context:** PDF content is specified in plan.md Phase 4. Visual design is not.
**Depends on:** Identity Card component (Phase 3). Address during Phase 4 implementation.

## RECS Import (003)

### TODO-R1: Run the T041 staging checks after deploy
**What:** On Railway staging with RECS pointed at it: SC-5 logs/HAR (no payload in logs or requests on load), SC-8 cross-account 404, SC-2 stopwatch, SC-6 funnel row for `recs`, p95 < 200 ms on POST/GET/DELETE ×100, `/benchmark` on `/import` < 1 s, hub GET size and time at 100 deals.
**Why:** These need the deployed stack; v0.5.0.0 shipped with T041 as a named open risk.
**Context:** `.specify/specs/003-recs-import/tasks.md` T041; record results in `qa.md`. Then tell the RECS owner that `VITE_INVESTORSMAP_URL` can move to this repo's origin.
**Effort:** S
**Priority:** P1
**Depends on:** Deploy of v0.5.0.0 to staging.

### TODO-R2: Hub list without payloads
**What:** `GET /recs-deals` returns every deal's payload (up to 8,000 characters each, 500 deals); list without `d` and fetch it on "Open in RECS", or paginate.
**Why:** Up to ~4 MB per hub load at the cap; one account can make the server send that 120 times a minute.
**Context:** `backend/src/modules/recs-deal/repository.ts` `listRecsDeals` (gstack-shortcut marker, decision D2 at T038). Decide with T041's hub size measurement.
**Effort:** S
**Priority:** P2
**Depends on:** TODO-R1 measurement.

### TODO-R3: Make row-level security effective
**What:** `set_config('app.current_tenant_id', ..., true)` runs outside a transaction, so the setting is gone before the next query; the app role bypasses RLS as table owner. Set it per transaction (or session) and force RLS, for every table, not only `recs_deals`.
**Why:** RLS is described as defense in depth but is not in effect; isolation rests on the repository filters alone.
**Context:** `backend/src/shared/middleware/tenant-context.ts`, migrations' `tenant_isolation` policies; noted in `.specify/specs/003-recs-import/security-review.md`.
**Effort:** M
**Priority:** P2
**Depends on:** None.

### TODO-R4: Error state when the API stays down
**What:** A non-401 `/auth/me` failure retries every 5 s forever and keeps `loading`, so `/import` is blank and the hub stays on its skeleton. After a few tries, show an error with a retry button (keep the token).
**Why:** During an outage users see nothing instead of a message.
**Context:** `frontend/lib/auth-context.tsx` `validate()` retry branch.
**Effort:** S
**Priority:** P2
**Depends on:** None.

### TODO-R5: Small RECS-import hardening
**What:** (1) Map every body-parser 4xx (`expose: true`) to its status instead of 500. (2) Treat more blank-rendering characters as invisible in deal names (U+2800, variation selectors, U+180B–180D, U+1D173–1D17A, U+FFFC), in both copies of the rules. (3) Resolve `config/recs.json` relative to the module, not the working directory. (4) Keep `?next=` when a stale token 401s on `/login`. (5) Purge soft-deleted `recs_deals` rows after a retention period. (6) Set `tokenRef` in `validate()` so a switch during page load still clears a held deal. (7) Decide whether a crafted import link's name needs an "unverified" hint and whether RECS's decoder is safe on hostile `d`.
**Why:** Low-severity findings from the v0.5.0.0 reviews, deferred to keep the ship within its review cycles.
**Context:** `/ship` invocation 4 adversarial and delta reviews, 2026-10-24.
**Effort:** M
**Priority:** P3
**Depends on:** None.

## Completed
