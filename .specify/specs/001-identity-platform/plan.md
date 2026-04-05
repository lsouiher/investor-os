# Implementation Plan: InvestorOS Identity Platform

**Feature:** 001-identity-platform
**Date:** 2026-04-03
**Status:** Ready for task generation

---

## Technical Context

### Stack
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js (App Router, TypeScript) | SSR by default (constitution VII), file-based routing |
| Backend | Express (TypeScript) | Simplest mature REST framework (constitution I) |
| ORM | Prisma | Type-safe, built-in migrations, JSON column support |
| Database | PostgreSQL 15+ | PRD-specified, RLS support, JSONB |
| AI | Anthropic Claude API | PRD-specified |
| Auth | JWT (jsonwebtoken + bcrypt) | PRD-specified, custom middleware (constitution VI) |
| PDF | Puppeteer | HTML→PDF rendering for Blueprint |
| Testing | Jest + Supertest + React Testing Library + Playwright | Constitution VIII compliance (unit + integration + e2e) |
| Email | Resend | Transactional email (password reset). Simple API, generous free tier |
| Logging | Pino | Structured JSON, minimal footprint |
| IDs | CUID2 | Non-sequential public IDs (constitution IV) |
| Encryption | Node.js crypto (AES-256-GCM) | Field-level for sensitive data, no extra dependency |

### Architecture Pattern
Modular monolith with 10 service modules, each containing routes → service → repository layers. Modules communicate through direct service function calls. Clean boundaries allow future extraction to microservices.

---

## Constitution Compliance Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity | PASS | Express over Nest.js; single table for audits; no speculative abstractions |
| II. Dependencies | PASS | Each dependency justified in research.md; crypto uses built-in Node.js |
| III. Code structure | PASS | One concern per file; modules separated by domain; tests co-located |
| IV. Data | PASS | Soft deletes on user data; CUID2 public IDs; append-only migrations; FKs indexed |
| V. APIs | PASS | All writes server-side; consistent error shape; rate limiting on all public endpoints |
| VI. Auth | PASS | Centralized auth middleware; RBAC with investor/admin roles; server-verified JWT |
| VII. Frontend | PASS | Next.js SSR by default; form validation client + server |
| VIII. Testing | PASS | Jest with co-located tests; unit + integration + e2e pattern |
| IX. Performance | PASS | Targets defined in contracts (rate limits); CDN for static assets |
| X. Security | PASS | Secrets in env vars; field-level encryption; user input sanitized; HTTPS |
| XI. Governance | PASS | All complexity justified in research.md |

---

## Build Phases

### Phase 1: Foundation (Weeks 1-3)

**Goal:** Scaffold both apps, database schema, auth, tenant isolation, logging. Deploy "hello world" end-to-end.

**Modules:**
1. **Project scaffolding**
   - Initialize Next.js frontend with TypeScript
   - Initialize Express backend with TypeScript
   - Configure Prisma with PostgreSQL
   - Set up shared linting (ESLint) and formatting (Prettier)
   - Create .env.example files

2. **Database schema (Prisma)**
   - All tables per data-model.md
   - Row-level security policies
   - Seed script for prompt templates and archetype definitions
   - Initial migration

3. **Auth module** (backend/src/modules/auth/)
   - Registration (auto-creates tenant, 1:1)
   - Login (returns JWT)
   - JWT verification middleware
   - RBAC middleware (investor, admin roles)
   - Password reset (token generation, email, reset)
   - Input validation (email format, password strength)

4. **Tenant isolation** (backend/src/shared/middleware/)
   - Prisma middleware to inject tenant_id filter on all queries
   - PostgreSQL RLS policies as defense-in-depth

5. **Logging module** (backend/src/modules/logging/)
   - Activity log repository (append-only writes)
   - Pino logger configuration
   - Request logging middleware

6. **Shared infrastructure**
   - CORS middleware (cors package, origin whitelist from CORS_ORIGIN env var)
   - Rate limiting middleware (express-rate-limit, in-memory for MVP)
   - Error handling middleware (consistent error shape)
   - CUID2 ID generation utility
   - Field-level encryption/decryption utility (AES-256-GCM) — encrypts specific JSON paths within JSONB columns at the repository layer before Prisma write; decrypts after read. Mixed plaintext/encrypted values in JSONB. Key version prefix: `v{N}:iv:authTag:ciphertext`. Must throw clear `KeyVersionNotFound` error if version prefix doesn't match any known key.
   - Health check endpoint (GET /api/v1/health) — first endpoint deployed, verifies DB + AI + encryption
   - Email service: Resend for transactional emails (password reset only for MVP). Add RESEND_API_KEY to .env.example.

**Testing:** Jest + Supertest (API integration), React Testing Library (components), Playwright (E2E for critical flows). E2E tests written per phase, not deferred to Phase 6.

**Deliverable:** Running frontend + backend + database. User can register, login, and hit authenticated endpoints. Tenant isolation verified. Health check returns ok.

---

### Phase 2: Audit Engine (Weeks 3-8)

**Goal:** Build all 5 audits with form-based input, save/resume, and sub-score generation.

**Modules:**
1. **Audit module** (backend/src/modules/audit/)
   - CRUD operations for all 5 audit types
   - Draft save/resume (in_progress status persisted)
   - Completion validation (all required fields per audit type)
   - Rules-based sub-score calculation on completion (deterministic formulas, not AI)
   - Version management (append-only, new row per completion)
   - Field-level encryption for sensitive financial responses (with key versioning)
   - Audit history endpoint

2. **AI client** (backend/src/shared/ai/)
   - Anthropic SDK wrapper
   - Prompt template loading from database
   - Modular prompt assembly (system + context + service block + output format)
   - XML-delimited user content in prompts (prompt injection defense)
   - Retry logic (stricter format on failure, max 2 retries)
   - Circuit breaker (open after 5 failures in 60s, half-open after 30s)
   - Error handling (friendly error on exhausted retries or open circuit)
   - Token usage logging
   - AI prompt/response audit logging (ai_call_logs table)

3. **Audit UI — Form mode** (frontend)
   - Financial Audit form (income, assets, liabilities, credit, tax sections)
   - Time Audit form
   - Skills & Experience form
   - Risk Profile form (includes scenario-based questions)
   - Horizon & Goals form (includes drag-rank for priorities)
   - Save draft on field blur / section completion
   - Resume from saved draft on page load

4. **Identity Hub page** (frontend)
   - 5 audit cards showing status (Not Started / In Progress / Completed)
   - Sub-score display on completed audits
   - Progressive disclosure messaging (1-4 audits: encouragement; 5: full unlock)
   - Guided audit ordering: "Recommended" badge on suggested next audit (Time → Skills → Horizon → Risk → Financial)
   - First-time onboarding modal recommending Time Audit as starting point

**Build order:** Financial Audit first (highest data density, validates the full pattern), then Time, Skills, Risk, Horizon. Each audit is independently testable.

**Deliverable:** User can complete all 5 audits via form mode, save/resume, and see sub-scores. Conversational mode deferred to post-MVP.

---

### Phase 3: Identity Synthesis (Weeks 6-9)

**Goal:** Build the AI synthesis pipeline that converts audit data into a composite investor identity.

**Modules:**
1. **Identity module** (backend/src/modules/identity/)
   - Synthesis service: assembles all audit data, calls LLM, parses response
   - Archetype assignment (selects from predefined curated set)
   - Readiness score calculation (weighted composite of 5 sub-scores)
   - Radar chart data generation (6 axes)
   - Headline insight generation
   - Full AI insights (contradictions, feasibility, gaps)
   - Version management (append-only, references audit versions used)
   - Auto-trigger on audit completion/update
   - History endpoint (score progression, version comparison)

2. **Archetype configuration**
   - Seed data: predefined archetype set with descriptions
   - Stored in database, loadable by prompt templates
   - Expandable via config without code changes

3. **Identity UI** (frontend)
   - Identity Card component (archetype badge, score gauge, radar chart)
   - Identity Card reveal animation (after first full synthesis)
   - Score progression sparkline (90-day trend)
   - Radar chart component (6-axis)
   - Version history view (timeline of identity changes)
   - Version comparison view (side-by-side radar charts, score diffs)
   - Post-synthesis feedback prompt (1-5 rating: "How well does this describe you?")
   - Shareable identity card page (public URL with HMAC-signed token)

**Deliverable:** After completing 5 audits, user sees their full Identity Card with archetype, scores, radar chart, and headline insight.

---

### Phase 4: Strategy & Action (Weeks 8-11)

**Goal:** Build strategy generation, action plans, roadmaps, micro-plans, simulation, and Blueprint PDF.

**Modules:**
1. **Strategy module** (backend/src/modules/strategy/)
   - Strategy generation service — chained prompt pattern:
     - Call 1: Generate 3 strategies with fit scores, pros/cons, descriptions (stored immediately)
     - Call 2 (on activation): Generate action plan, roadmap, micro-plan for the chosen strategy only
   - Strategy activation (user selects active strategy, triggers Call 2)
   - Completion tracking for action items, milestones, micro-tasks
   - Re-evaluation: when identity score shifts > 10 points, flag active strategies with needs_refresh. User-initiated regeneration via banner prompt.

2. **Simulation module** (backend/src/modules/simulation/)
   - Accept modified parameters, synthesize temporary identity
   - Compute delta (before/after scores, archetype, strategy changes)
   - Rate limiting: max 3 per 24-hour rolling window per user (query-based, no sessions table)
   - Result storage for history

3. **Blueprint module** (backend/src/modules/blueprint/)
   - HTML template for Investment Blueprint
   - Puppeteer rendering to PDF
   - Content assembly: identity card, strategies, action plan, roadmap, insights
   - Radar chart rendered as SVG in template

4. **Strategy UI** (frontend)
   - Strategy recommendation cards (3 cards with fit scores, pros/cons)
   - Strategy detail view (action plan, roadmap, micro-plan)
   - Action plan checklist with completion tracking
   - Roadmap timeline component (interactive milestones)
   - Micro-plan card (72-hour countdown, task checklist)
   - "What If" simulation interface (variable sliders, before/after view)
   - Simulation remaining counter (X of 3)
   - Blueprint download button and generation status

**Deliverable:** User can view strategies, track action items, run simulations, and download Blueprint PDF.

---

### Phase 5: Dashboard & CRM (Weeks 10-13)

**Goal:** Build the daily engagement surface — dashboard and contact management.

**Modules:**
1. **Dashboard endpoint** (backend: aggregated data from multiple modules)
   - Identity snapshot (current archetype, score, radar, trend)
   - Active strategy with progress percentage
   - Top 3 priority tasks (ranked by identity impact)
   - Intelligence feed (recent insights, alerts)
   - Audit completion status

2. **Contact module** (backend/src/modules/contact/)
   - CRUD with soft delete
   - Role type assignment
   - Strategy relevance auto-tagging (based on active strategy)
   - Network completeness score calculation
   - Network gap detection (missing roles required by strategy)
   - Relationship health tracking (days since last contacted)
   - Contact relevance recalculation on identity change

3. **Task module** (backend/src/modules/task/)
   - AI-generated task creation (from action plans, identity gaps)
   - Manual task creation
   - Identity impact scoring
   - Time estimate calibration based on skills audit
   - Completion tracking
   - Priority ordering by identity impact

4. **Insight engine** (backend/src/modules/insight/)
   - Progress analysis (action plan completion rate, pace)
   - Contradiction detection (stated time vs. actual engagement)
   - Score change explanations
   - Milestone check-ins
   - Network health alerts (contact last-contacted thresholds)
   - Insight generation on identity change, task completion, login

5. **Dashboard UI** (frontend)
   - Identity snapshot section (badge, score, mini radar, sparkline)
   - Active strategy progress bar
   - Priority task list (3 items, complete inline)
   - Intelligence feed (scrollable, chronological)
   - Quick links to audits, strategy, contacts

6. **Contact Manager UI** (frontend)
   - Contact list (filterable by role type)
   - Add/edit contact form
   - Network score display with gap indicators
   - "Last contacted" badges with color coding
   - Network gap alerts

**Deliverable:** Full dashboard experience. User lands on dashboard, sees identity, tasks, insights, and can manage contacts.

---

### Phase 6: Polish & Integration (Weeks 12-14)

**Goal:** Wire everything together, end-to-end flow testing, prompt quality iteration.

**Work:**
- End-to-end user flow testing (registration → audits → identity → strategy → dashboard)
- Identity Card reveal UX polish
- Strategy cards with simulation slider interaction polish
- Roadmap timeline interactivity
- AI synthesis latency optimization
- Prompt quality iteration based on test data
- Accessibility audit (verify compliance with baseline specs in Design Specifications section)
- Responsive layout verification (verify compliance with breakpoints in Design Specifications section)
- Error state UX for all AI failure paths
- Loading states only for visibly slow operations (constitution VII)

---

### Phase 7: QA, Security & Soft Launch (Weeks 14-16)

**Work:**
- Security review: tenant isolation verification, field encryption validation, JWT security, input sanitization
- Rate limiting verification on all endpoints
- Load testing on AI pipeline (concurrent synthesis/strategy requests)
- Performance profiling (audit save latency, dashboard load time, PDF generation time)
- Dependency audit for vulnerabilities (constitution X)
- UAT with 20-30 real users
- Prompt refinement based on real identity data
- Bug fixes and iteration

---

## Design Specifications (Cross-Cutting)

Added by /plan-design-review on 2026-04-03. These decisions apply across all phases. No DESIGN.md exists yet — run /design-consultation to establish a full design system.

### Design Constraints (Minimum Viable Tokens)

| Token | Value | Usage |
|-------|-------|-------|
| Typography | Geist (or Plus Jakarta Sans) | 400 body, 500 labels, 600 headings, 700 emphasis |
| Accent color | Amber/Gold #D97706 | Scores, CTAs, active states |
| Spacing grid | 4px base | 4, 8, 12, 16, 24, 32, 48, 64 |
| Max content width | 1200px centered | All main content areas |
| Light surface | #FAFAFA bg, #FFFFFF cards | Default app background |
| Dark surface | #1A1A2E | Identity Card only |
| Border radius | 4px default, 8px cards, 0px buttons | — |
| Shadows | None by default | Use 1px borders for separation |

**Score color tiers (always paired with text label for a11y):**
- 0-39: #DC2626 (red) + "Needs work"
- 40-69: #D97706 (amber) + "Developing"
- 70-100: #059669 (emerald) + "Strong"

### Navigation

- **Desktop:** Left sidebar (240px) — logo, nav items (Dashboard, Identity Hub, Strategy, Contacts, Tasks), compact identity score badge in footer
- **Mobile:** Bottom tab bar — Dashboard, Identity, Strategy, Contacts, More (overflow for Tasks + Settings)

### Responsive Breakpoints

| Viewport | Width | Layout |
|----------|-------|--------|
| Mobile | < 640px | Bottom tab nav, single column, stacked components |
| Tablet | 640-1024px | Sidebar collapsed, 2 columns where appropriate |
| Desktop | > 1024px | Full sidebar nav, multi-column layouts |

Key responsive rules:
- Identity Card: scales proportionally, min 320px wide
- Radar chart: min 200px diameter for readability
- Dashboard: single column on mobile, score ring above radar (stacked)
- Audit stepper: remains vertical on all viewports (no change needed)

### Accessibility Baseline

- 44px minimum touch targets on all interactive elements
- WCAG AA contrast: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: all interactive elements focusable with visible focus indicators
- ARIA landmarks: main, nav, aside, complementary on all pages
- Skip-to-content link on every page
- Every form input has a visible label (no placeholder-only inputs)
- Score colors never used alone — always paired with text tier label

### Dashboard (Phase 5)

**Information hierarchy (score-first):**
1. **Primary anchor:** Readiness score as large ring/gauge (center-left)
2. **Secondary:** Archetype name below score ("Cash Flow Hunter")
3. **Supporting context:** 6-axis radar chart (right of score), 90-day sparkline below
4. **Middle section:** Active strategy card with progress bar + 3 priority tasks with inline completion toggles
5. **Bottom section:** AI intelligence feed (chronological insight entries)

**Empty state (new user, no identity):**
- Single full-width CTA panel: "Your investor identity starts here."
- Subtext: "Complete 5 short audits to discover your archetype, readiness score, and personalized investment strategies."
- Stats: "~20 minutes | 5 audits | 1 identity"
- Primary CTA: "Build Your Investor Identity" → Identity Hub

### Identity Hub (Phase 2)

**Layout: Vertical progress stepper** (NOT a 5-card grid)
- Each audit is a step with status indicator: check (completed), arrow (current/recommended), dot (not started)
- Recommended next audit is expanded: description, estimated time, question count, "Start" CTA
- Completed audits show sub-score inline
- Progress bar at bottom: "X of 5 complete"
- Footer message: "Complete all 5 to unlock your Identity Card"
- Recommended audit ordering: Time → Skills → Horizon → Risk → Financial

### Audit Forms (Phase 2)

**Layout: Paginated wizard**
- One section per page (3-6 fields per page)
- Progress bar at top: "Section X of Y"
- Back/Next buttons at bottom, Next button shows next section name
- Auto-save on page transition (in addition to field blur)
- Users can jump back to any completed section
- Each section has a clear heading and optional helper text

**Post-completion: Escalating micro-rewards**
- After audit 1: sub-score + 1-axis radar + "Your time profile is mapped. 4 more to go."
- After audit 2: sub-score + 2-axis radar + "Your profile is taking shape."
- After audit 3: sub-score + 3-axis radar + "Your archetype is emerging..."
- After audit 4: sub-score + 4-axis radar + "One more audit to unlock your full identity and personalized strategies."
- After audit 5: → synthesis loading sequence → Identity Card reveal

### Identity Card (Phase 3)

**Self-contained premium badge component:**
- Dark background (#1A1A2E), fixed 16:9 aspect ratio
- Archetype name as title (top, large, accent color)
- Score ring center-left (animated fill, color by tier)
- 6-axis radar chart to the right (filled with accent color)
- Headline insight as body text
- Sub-scores row at bottom: "Cap 82 | Time 65 | Skill 71 | Risk 78 | Net 42 | Goals 88"
- Used consistently across: dashboard widget, share page, PDF embed, version history

**First-time reveal animation (synthesis moment only):**
1. Card starts face-down (dark, blurred)
2. Card flips to reveal archetype name (large, dramatic)
3. Score ring fills from 0 to actual score (animated)
4. Radar chart axes extend outward
5. Headline insight fades in
6. Total duration: 3-4 seconds. CSS keyframes + requestAnimationFrame.
7. Only plays on first synthesis — subsequent visits show card immediately.

### AI Synthesis Loading (Phase 3)

**Full-screen animated sequence (NOT a spinner):**
- 5 audit icons animate sequentially: "analyzed" → "analyzing..." → "waiting"
- Cycling progress messages: "Analyzing your financial profile...", "Mapping your risk tolerance against your investment horizon..."
- Progress bar fills as each audit is processed
- Sequence ends → Identity Card reveal animation begins

### AI Error States (All Phases)

Error severity matches emotional weight:
- **Synthesis failure (critical):** Full-screen compassionate message. "We hit a snag analyzing your profile. Your audit data is safe. This usually resolves in a moment." Large retry button. "If this keeps happening, our team is on it."
- **Strategy generation failure (medium):** Section-level inline banner. "[!] Strategy generation unavailable right now. [Retry]"
- **Insight generation failure (low):** Subtle inline indicator within the intelligence feed. No modal, no banner.
- **Universal:** Never show technical error details to users.

### Strategy Recommendations (Phase 4)

**Layout: Ranked list with primary focus** (NOT 3 equal cards)
- Top strategy gets expanded detail section: fit score, description, pros/cons visible, "Activate This Strategy" CTA
- Strategies #2 and #3 are compact rows: name, fit score, one-line description, "View details" expand toggle
- Clear visual hierarchy: this is the recommendation, these are alternatives

### "What If" Simulation (Phase 4)

**Layout: Split-screen with live delta**
- Left: current identity (radar chart + readiness score)
- Center: labeled sliders for adjustable variables (savings, income, hours/week, risk comfort, etc.)
- Right: simulated identity (radar morphs as sliders move, score updates in real-time)
- "Remaining simulations" counter prominently displayed top-right (e.g., "2 of 3 remaining today")
- "Run Full Simulation" button generates detailed results (archetype change, strategy impact)
- On mobile: stacked vertically (current → sliders → simulated)

### Empty States (All Screens)

Every empty screen shows ONE primary action, not placeholder grids:
- **Dashboard:** "Build your identity" CTA → Identity Hub
- **Strategy:** "Complete all 5 audits to unlock personalized strategies" → Identity Hub
- **Contacts:** "Add your first contact" with suggested role types (Agent, Lender, Mentor)
- **Tasks:** "Tasks appear after you activate a strategy" → Strategy page
- **Intelligence feed:** "Insights generate as your identity evolves"
- **Simulation:** "Complete your identity to run simulations" → Identity Hub

---

## Engineering Amendments (Run 2)

Added by /plan-eng-review (run 2) on 2026-04-03. Resolves 6 unresolved items from run 1.

### Data Model Changes

1. **Collapse 6 strategy sub-tables to JSONB.** Remove action_plans, action_items, roadmaps, milestones, micro_plans, micro_tasks tables. Replace with 3 JSONB columns on strategies table:
   - `action_plan jsonb` — `{items: [{id, title, description, sort_order, is_completed, completed_at}]}`
   - `roadmap jsonb` — `{milestones: [{id, title, description, target_date, sort_order, is_completed, completed_at}]}`
   - `micro_plan jsonb` — `{expires_at, tasks: [{id, title, description, estimated_minutes, sort_order, is_completed, completed_at}]}`
   - Item IDs within JSONB are CUID2 (generated at write time)
   - Completion tracking: PUT endpoint updates JSONB column
   - This reduces the data model from 18 tables to 12

2. **Add `needs_refresh boolean NOT NULL DEFAULT false` to strategies table.** Set to true when identity score shifts >10 points. User-initiated regeneration resets to false.

3. **Add `identity_reveal_seen_at timestamp nullable` to users table.** Set on first identity card reveal animation. Prevents replay on subsequent visits across all devices.

4. **Table count correction:** Data model has 12 tables (after JSONB collapse): tenants, users, audits, identity_versions, strategies, contacts, tasks, simulations, prompt_templates, activity_logs, password_reset_tokens, ai_call_logs.

### Architecture Decisions

5. **Synchronous AI calls with timeouts (no async queue for MVP).** Identity synthesis: 15s timeout. Strategy generation (Call 2): 30s timeout. Simulation: 15s timeout. Insight generation: 10s timeout. On timeout, return AI_SERVICE_ERROR. Design review's loading states and error banners handle the UX.

6. **Encrypted JSONB approach:** Repository layer encrypts specific JSON paths (financial.primary_income, etc.) before Prisma write. Stored as `v{N}:iv:authTag:ciphertext` strings within the JSONB structure. Mixed plaintext + encrypted values. Decryption at repository layer after read. Queries against encrypted fields are not supported (not needed).

7. **CORS:** cors middleware with CORS_ORIGIN env var whitelist. Added to Phase 1 shared infrastructure.

8. **Email:** Resend for transactional emails. RESEND_API_KEY in .env.example. Password reset only for MVP.

9. **Health endpoint:** GET /api/v1/health as first deployed endpoint. Verifies DB, AI service reachability, encryption key presence.

10. **E2E testing:** Playwright added to testing stack. E2E tests for 4 critical user flows written alongside each phase, not deferred.

### Performance Notes

11. **Dashboard query optimization:** Dashboard endpoint should use Prisma batch queries or a single optimized query with includes, not 5 separate service calls.

12. **Partial radar chart rendering:** Frontend radar chart component must handle 1-5 axes gracefully (not all 6 populated until all audits complete). Use null/undefined axes, not zero.

### Cleanup Required (before implementation)

13. **tasks.md:** Remove or mark as `[DEFERRED]` all conversational audit tasks (T052 and related). Update task count.
14. **spec.md FR-3:** Update to reflect form-only MVP (remove conversational mode requirement).
15. **Table count:** Align CLAUDE.md ("17 tables") and tasks.md T011 ("16 tables") to actual count of 12 tables.
16. **research.md:** Remove "Queue-based processing for strategy generation (async)" — replaced with synchronous + timeout.

---

## Generated Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Research decisions | `.specify/specs/001-identity-platform/research.md` | Complete |
| Data model | `.specify/specs/001-identity-platform/data-model.md` | Complete |
| API contracts | `.specify/specs/001-identity-platform/contracts/api-v1.md` | Complete |
| Quickstart guide | `.specify/specs/001-identity-platform/quickstart.md` | Complete |
| Implementation plan | `.specify/specs/001-identity-platform/plan.md` | Complete |

---

## Next Steps

1. Clean up tasks.md, spec.md, CLAUDE.md per "Cleanup Required" in Engineering Amendments
2. Run `/design-consultation` to establish full DESIGN.md before implementation
3. Set up OpenAI API key, then run `/design-shotgun` for visual mockups of key screens
4. Begin Phase 1 implementation

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAN | 5 proposals, 5 accepted, 3 deferred |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 2 | CLEAN | 6 prior unresolved resolved, 16 amendments, 4 cleanup items |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | ISSUES_OPEN | score: 3/10 → 7/10, 16 decisions made |
| Outside Voice | eng review subagent | Independent challenge | 1 | ISSUES_FOUND | 13 findings, 4 cross-model tensions resolved |

**UNRESOLVED:** 4 cleanup items (tasks.md, spec.md FR-3, table count alignment, research.md async ref) + 5 design items deferred (full DESIGN.md, visual mockups, PDF layout, feed card design, version comparison layout)
**VERDICT:** CEO CLEARED. ENG CLEARED (run 2, all issues resolved, 4 cleanup items for implementation start). DESIGN REVIEWED (3→7/10).
