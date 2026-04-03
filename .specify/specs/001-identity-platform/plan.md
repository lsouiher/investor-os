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
| Testing | Jest + Supertest + React Testing Library | Constitution VIII compliance |
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
   - Rate limiting middleware (express-rate-limit)
   - Error handling middleware (consistent error shape)
   - CUID2 ID generation utility
   - Field-level encryption/decryption utility (AES-256-GCM)

**Deliverable:** Running frontend + backend + database. User can register, login, and hit authenticated endpoints. Tenant isolation verified.

---

### Phase 2: Audit Engine (Weeks 3-8)

**Goal:** Build all 5 audits with dual input modes, save/resume, and sub-score generation.

**Modules:**
1. **Audit module** (backend/src/modules/audit/)
   - CRUD operations for all 5 audit types
   - Draft save/resume (in_progress status persisted)
   - Completion validation (all required fields per audit type)
   - Sub-score calculation on completion
   - Version management (append-only, new row per completion)
   - Field-level encryption for sensitive financial responses
   - Audit history endpoint

2. **Conversational audit endpoint** (backend/src/modules/audit/)
   - Prompt assembly for conversational mode per audit type
   - Anthropic Claude API integration (shared AI client)
   - Response parsing: extract structured data from conversation
   - Progress tracking (percentage complete)
   - Conversation state management

3. **AI client** (backend/src/shared/ai/)
   - Anthropic SDK wrapper
   - Prompt template loading from database
   - Modular prompt assembly (system + context + service block + output format)
   - Retry logic (stricter format on failure, max 2 retries)
   - Error handling (friendly error on exhausted retries)
   - Token usage logging

4. **Audit UI — Form mode** (frontend)
   - Financial Audit form (income, assets, liabilities, credit, tax sections)
   - Time Audit form
   - Skills & Experience form
   - Risk Profile form (includes scenario-based questions)
   - Horizon & Goals form (includes drag-rank for priorities)
   - Save draft on field blur / section completion
   - Resume from saved draft on page load
   - Mode switch toggle (conversational ↔ form)

5. **Audit UI — Conversational mode** (frontend)
   - Chat interface component (messages, quick-reply buttons)
   - Real-time data extraction display (what's been captured)
   - Progress indicator
   - Mode switch to form (pre-fills captured data)

6. **Identity Hub page** (frontend)
   - 5 audit cards showing status (Not Started / In Progress / Completed)
   - Sub-score display on completed audits
   - Progressive disclosure messaging (1-4 audits: encouragement; 5: full unlock)

**Build order:** Financial Audit first (highest data density, validates the full pattern), then Time, Skills, Risk, Horizon. Each audit is independently testable.

**Deliverable:** User can complete all 5 audits via form or conversational mode, save/resume, and see sub-scores.

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
   - Narrative comparison ("6 months ago you were X, now you're Y")

**Deliverable:** After completing 5 audits, user sees their full Identity Card with archetype, scores, radar chart, and headline insight.

---

### Phase 4: Strategy & Action (Weeks 8-11)

**Goal:** Build strategy generation, action plans, roadmaps, micro-plans, simulation, and Blueprint PDF.

**Modules:**
1. **Strategy module** (backend/src/modules/strategy/)
   - Strategy generation service (3 strategies with fit scores, pros/cons)
   - Action plan generation (ordered items linked to strategy)
   - Roadmap generation (milestones with target dates)
   - Micro-plan generation (72-hour tasks with time estimates)
   - Strategy activation (user selects active strategy)
   - Completion tracking for action items, milestones, micro-tasks
   - Re-evaluation trigger when identity score shifts > 10 points

2. **Simulation module** (backend/src/modules/simulation/)
   - Accept modified parameters, synthesize temporary identity
   - Compute delta (before/after scores, archetype, strategy changes)
   - Session-based rate limiting (max 3 per session)
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
- Conversational assessment latency optimization
- Prompt quality iteration based on test data
- Accessibility audit (semantic HTML, keyboard nav, color contrast — constitution VII)
- Mobile responsive layout
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

Run `/speckit-tasks` to generate the task breakdown from this plan.
