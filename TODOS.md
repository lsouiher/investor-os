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

## QA Findings (deferred)

### TODO-Q1: Mount the synthesis, strategy and blueprint rate limiters (medium, security/cost)
**What:** `synthesizerLimiter`, `strategyLimiter` and `blueprintLimiter` in `backend/src/shared/middleware/rate-limiter.ts` are defined but never applied to a route.
**Repro:** As one user, `POST /api/v1/identity/synthesize` seven times within 5 minutes; every call answers 202 (expected 429 after 5).
**Context:** Found by /qa on 004-french-language, 2026-10-01. Unmounted since 873ee5f. Concurrent calls join the in-flight one, so the exposure is repeated sequential model calls, capped only by the 120/min per-user brake.

### TODO-Q2: French bottom nav labels wrap at phone width (low, visual)
**What:** At 360 px in French, "Tableau de bord" and "Hub Identité" wrap to two lines; the other labels take one. Nothing is clipped.
**Repro:** Sign in with a French account, set the viewport to 360×780, look at the fixed bottom nav.
**Context:** Found by /qa, 2026-10-01. Shorter labels for the nav only, or a smaller font at this width, would fix it.

### TODO-Q3: Console error on every page before the first identity (low, console)
**What:** `GET /api/v1/identity` answers 404 until the first synthesis, and the browser logs it as an error on each signed-in page.
**Repro:** Register, open any signed-in page, check the console.
**Context:** Found by /qa, 2026-10-01. Pre-existing. Answering `200 { data: null }`, or not fetching before the audits are complete, would remove the noise.
