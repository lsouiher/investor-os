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
