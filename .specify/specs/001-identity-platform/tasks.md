# Tasks: InvestorOS Identity Platform

**Feature:** 001-identity-platform
**Generated:** 2026-04-03
**Total Tasks:** 109
**User Stories:** 7 (from spec.md scenarios)

---

## User Story Mapping

| Story | Spec Scenario | Priority | Phase |
|-------|--------------|----------|-------|
| US1 | First-Time Identity Construction | P1 | 3-4 |
| US2 | Progressive Identity Disclosure | P1 | 4 |
| US3 | Identity Evolution via Audit Update | P2 | 5 |
| US4 | "What If" Simulation | P2 | 6 |
| US5 | Identity-Contextualized Contact Management | P2 | 7 |
| US6 | Dashboard Return Visit | P2 | 8 |
| US7 | Multi-Tenant Isolation | P1 | 2 |

---

## Phase 1: Setup

**Goal:** Initialize project structure, dependencies, and configuration.

- [x] T001 Initialize Next.js frontend app with TypeScript and App Router in `frontend/`
- [x] T002 [P] Initialize Express backend app with TypeScript in `backend/`
- [x] T003 [P] Configure Prisma ORM with PostgreSQL connection in `backend/prisma/schema.prisma`
- [x] T004 [P] Set up ESLint and Prettier with shared config in root `package.json` and `.eslintrc.json`
- [x] T005 [P] Create `.env.example` for backend with DATABASE_URL, JWT_SECRET, JWT_EXPIRY, AUDIT_ENCRYPTION_KEY, ANTHROPIC_API_KEY, PORT, NODE_ENV in `backend/.env.example`
- [x] T006 [P] Create `.env.local.example` for frontend with NEXT_PUBLIC_API_URL in `frontend/.env.local.example`
- [x] T007 [P] Configure Jest with TypeScript for backend in `backend/jest.config.ts`
- [x] T008 [P] Configure Jest with React Testing Library for frontend in `frontend/jest.config.ts`
- [x] T009 Create Docker Compose file with PostgreSQL 15 service in `docker-compose.yml`
- [x] T010 Create `.gitignore` with node_modules, .env, .next, dist entries in root `.gitignore`

---

## Phase 2: Foundation

**Goal:** Database schema, auth, tenant isolation, logging, and shared infrastructure. Blocks all user stories.

### Database Schema

- [x] T011 Define Prisma schema with all 16 tables per data-model.md including tenants, users, audits, identity_versions, strategies, action_plans, action_items, roadmaps, milestones, micro_plans, micro_tasks, contacts, tasks, simulations, prompt_templates, activity_logs, sessions in `backend/prisma/schema.prisma`
- [x] T012 Create initial Prisma migration and apply to dev database via `npx prisma migrate dev`
- [x] T013 Create SQL migration for PostgreSQL Row-Level Security policies on all tenant-scoped tables in `backend/prisma/migrations/` (manual SQL migration)
- [x] T014 Create seed script for predefined investor archetypes (at least 8 archetypes with names and descriptions) in `backend/prisma/seed.ts`
- [x] T015 [P] Create seed script for initial prompt templates (identity_synthesis, strategy_generation, simulation, insight, scoring service types) in `backend/prisma/seed.ts`

### Shared Infrastructure

- [x] T016 Implement CUID2 public ID generation utility in `backend/src/shared/utils/id.ts`
- [x] T017 [P] Implement field-level AES-256-GCM encryption/decryption utility using Node.js crypto module in `backend/src/shared/encryption/field-encryption.ts`
- [x] T018 [P] Implement consistent error response middleware with error codes (VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, AI_SERVICE_ERROR, INTERNAL_ERROR) and standard shape `{error: {code, message, details}}` in `backend/src/shared/middleware/error-handler.ts`
- [x] T019 [P] Implement rate limiting middleware using express-rate-limit with per-endpoint-group configuration per contracts/api-v1.md rate limits in `backend/src/shared/middleware/rate-limiter.ts`
- [x] T020 [P] Configure Pino structured JSON logger in `backend/src/shared/logger.ts`
- [x] T021 [P] Implement request logging middleware that logs method, path, status, and duration in `backend/src/shared/middleware/request-logger.ts`

### Auth Module

- [x] T022 Implement user registration service with auto-tenant creation (1:1), password hashing with bcrypt, and CUID2 public ID generation in `backend/src/modules/auth/service.ts`
- [x] T023 Implement user login service with password verification and JWT token generation using jsonwebtoken in `backend/src/modules/auth/service.ts`
- [x] T024 Implement JWT verification middleware that extracts user and tenant from token in `backend/src/shared/middleware/auth.ts`
- [x] T025 [P] Implement RBAC middleware supporting investor and admin roles in `backend/src/shared/middleware/rbac.ts`
- [x] T026 Implement password reset flow: token generation, email sending (Nodemailer/Resend), token validation, and password update in `backend/src/modules/auth/service.ts`
- [x] T027 Implement auth routes: POST /register, POST /login, GET /me, POST /forgot-password, POST /reset-password per api-v1.md contracts in `backend/src/modules/auth/routes.ts`
- [x] T028 Implement auth input validation: email format, password minimum length/strength, required fields in `backend/src/modules/auth/validation.ts`
- [x] T029 Implement auth repository for user CRUD, tenant creation, and password_reset_tokens CRUD (create token, find valid token by value, mark as used) in `backend/src/modules/auth/repository.ts`

### Tenant Isolation

- [x] T030 [US7] Implement Prisma middleware that automatically injects tenant_id filter on all find/findMany/update/delete queries based on current request context in `backend/src/shared/middleware/tenant-scope.ts`
- [x] T031 [US7] Implement tenant context setter that extracts tenant_id from authenticated JWT and sets PostgreSQL session variable `app.current_tenant_id` for RLS in `backend/src/shared/middleware/tenant-context.ts`

### Logging Module

- [x] T032 Implement activity log repository with append-only write (no update, no delete) supporting all event types in `backend/src/modules/logging/repository.ts`
- [x] T033 [P] Implement activity log service with helper methods for each event type (audit.completed, identity.synthesized, strategy.generated, etc.) in `backend/src/modules/logging/service.ts`

### Admin: Prompt Template Management

- [x] T034 Implement admin prompt template routes (admin role required): GET /admin/prompt-templates (list), GET /admin/prompt-templates/:id (detail with content), POST /admin/prompt-templates (create new version), PUT /admin/prompt-templates/:id/activate (set active, deactivate previous) per api-v1.md in `backend/src/modules/admin/routes.ts`
- [x] T035 [P] Implement prompt template repository: list by service_type, get by id, create with auto-version-increment, activate (deactivate previous active for same service_type) in `backend/src/modules/admin/repository.ts`

### Express App Assembly

- [x] T036 Create Express app entry point: register all middleware (cors, json parsing, request logging, rate limiting, error handler), mount all module routes under /api/v1, start server in `backend/src/main.ts`

### Frontend Foundation

- [x] T037 Create root layout with metadata, fonts, and global styles in `frontend/app/layout.tsx`
- [x] T038 [P] Create API client utility with JWT token management (storage, auto-attach to headers, refresh/logout on 401) in `frontend/lib/api-client.ts`
- [x] T039 [P] Create auth context provider with login, register, logout, and current user state in `frontend/lib/auth-context.tsx`
- [x] T040 Create landing page with "Build Your Investor Identity" CTA in `frontend/app/page.tsx`
- [x] T041 [P] Create registration page with email/password form, client-side validation, and API integration in `frontend/app/register/page.tsx`
- [x] T042 [P] Create login page with email/password form and API integration in `frontend/app/login/page.tsx`
- [x] T043 Create authenticated layout wrapper that redirects to login if no token, shows nav bar with user info in `frontend/app/(authenticated)/layout.tsx`

---

## Phase 3: Audit Engine — Backend (US1)

**Goal:** All 5 audits with CRUD, save/resume, scoring, and conversational mode.
**Independent test:** User can save/resume audit drafts and complete audits via API; sub-scores are returned.

### AI Client (Shared)

- [x] T044 [US1] Implement Anthropic Claude API client wrapper with SDK initialization, prompt assembly (system + context + service block + output format), and token usage logging in `backend/src/shared/ai/client.ts`
- [x] T045 [P] [US1] Implement AI retry logic: on parse failure retry once with stricter format instructions, on second failure return structured error in `backend/src/shared/ai/retry.ts`
- [x] T046 [P] [US1] Implement prompt template loader that reads active template by service_type from prompt_templates table in `backend/src/shared/ai/prompt-loader.ts`

### Audit Module — Backend

- [x] T047 [US1] Define TypeScript types for all 5 audit response schemas (financial, time, skills, risk, horizon) with all data points from spec FR-2 in `backend/src/modules/audit/types.ts`
- [x] T048 [US1] Implement audit repository with: create draft, save progress (upsert responses), complete audit (new versioned row), get current by type, get history by type, with field-level encryption on sensitive financial fields in `backend/src/modules/audit/repository.ts`
- [x] T049 [US1] Implement audit service with: start audit (create not_started→in_progress), save draft (persist partial responses), complete audit (validate required fields, calculate sub-score, create versioned row), get audit summary (all 5 types with status/scores) in `backend/src/modules/audit/service.ts`
- [x] T050 [US1] Implement sub-score calculation (0-100) for each audit type based on completeness and quality of responses in `backend/src/modules/audit/scoring.ts`
- [x] T051 [US1] Implement audit completion validation: define required fields per audit type, validate all required fields present before allowing completion in `backend/src/modules/audit/validation.ts`
- [x] T052 [US1] Implement conversational audit service: assemble prompt with audit type context, send to Claude API, parse extracted data points from response, track conversation progress percentage in `backend/src/modules/audit/conversation-service.ts`
- [x] T053 [US1] Implement audit routes: GET /audits, GET /audits/:auditType, PUT /audits/:auditType (save/complete), GET /audits/:auditType/history, POST /audits/:auditType/converse per api-v1.md in `backend/src/modules/audit/routes.ts`

---

## Phase 4: Audit Engine — Frontend & Identity Hub (US1, US2)

**Goal:** Form mode, conversational mode, Identity Hub with progressive disclosure.
**Independent test:** User can complete all 5 audits via UI (form or chat), see sub-scores, and receive progressive disclosure messaging.

### Audit UI — Form Mode

- [x] T054 [US1] Create reusable audit form shell component with section navigation, save draft on blur, submit on complete, and mode toggle (form↔conversational) in `frontend/components/audit/audit-form-shell.tsx`
- [x] T055 [US1] Create Financial Audit form with sections: Income (brackets, stability, trend), Assets (5 fields), Liabilities (5 fields), Credit (3 fields), Tax (3 fields) in `frontend/app/(authenticated)/audits/financial/page.tsx`
- [x] T056 [P] [US1] Create Time Audit form with sections: Availability (5 fields), Flexibility (4 fields), Preference (3 fields), Runway (2 fields) in `frontend/app/(authenticated)/audits/time/page.tsx`
- [x] T057 [P] [US1] Create Skills & Experience form with sections: RE Experience (5 fields), Professional (5 fields), Transferable Skills (6 fields), Education (3 fields), Network (7 fields) in `frontend/app/(authenticated)/audits/skills/page.tsx`
- [x] T058 [P] [US1] Create Risk Profile form with sections: Self-Assessment (2 fields), Scenarios (5 multi-choice), Financial Safety (4 fields), Behavioral (3 fields), Comfort Zones (4 fields) in `frontend/app/(authenticated)/audits/risk/page.tsx`
- [x] T059 [P] [US1] Create Horizon & Goals form with sections: Primary Objective (drag-rank), Financial Targets (4 fields), Timeline (4 fields), Lifestyle (4 fields), Constraints (4 fields) in `frontend/app/(authenticated)/audits/horizon/page.tsx`

### Audit UI — Conversational Mode

- [x] T060 [US1] Create chat interface component with message bubbles, quick-reply buttons, typing indicator, and scroll-to-bottom in `frontend/components/audit/chat-interface.tsx`
- [x] T061 [US1] Create conversational audit page that wraps chat interface with real-time data extraction sidebar showing captured fields, progress bar, and mode switch button in `frontend/components/audit/conversational-audit.tsx`

### Identity Hub

- [x] T062 [US2] Create Identity Hub page with 5 audit cards showing status (Not Started/In Progress/Completed), sub-scores on completed cards, and progressive disclosure messaging based on completion count in `frontend/app/(authenticated)/hub/page.tsx`
- [x] T063 [US2] Implement progressive disclosure messaging logic: 1 audit ("Getting to know you..."), 2-3 ("Partial profile, add more for sharper insights"), 4 ("Almost there, one more for full identity"), 5 ("Full identity unlocked") in `frontend/components/hub/disclosure-messages.tsx`

---

## Phase 5: Identity Synthesis (US1, US3)

**Goal:** AI synthesis pipeline, archetype assignment, versioning, and Identity Card UI.
**Independent test:** After completing 5 audits, user sees Identity Card. After updating an audit, a new identity version is created.

### Identity Module — Backend

- [x] T064 [US1] Implement identity synthesis service: gather all completed audit data, assemble identity synthesis prompt with archetype list, call Claude API, parse archetype + scores + radar + insights from response in `backend/src/modules/identity/service.ts`
- [x] T065 [US1] Implement readiness score calculation: weighted composite of 5 sub-scores (0-100), with configurable weights in `backend/src/modules/identity/scoring.ts`
- [x] T066 [US1] Implement radar chart data generation: map audit data to 6 axes (Capital, Time, Skills, Risk Tolerance, Network, Goal Clarity) with 0-100 values in `backend/src/modules/identity/radar.ts`
- [x] T067 [US1] Implement identity repository: create version (append-only), get latest, get history, get by version ID, with audit_snapshot tracking which audit versions were used in `backend/src/modules/identity/repository.ts`
- [x] T068 [US3] Implement auto-synthesis trigger: after audit completion or update, check if identity should be re-synthesized, create new identity version in `backend/src/modules/identity/service.ts` (extend existing)
- [x] T069 [US3] Implement identity version comparison: compute score delta between two versions, detect archetype changes, generate narrative comparison text in `backend/src/modules/identity/comparison.ts`
- [x] T070 [US1] Implement identity routes: GET /identity, GET /identity/history, POST /identity/synthesize per api-v1.md in `backend/src/modules/identity/routes.ts`

### Identity UI — Frontend

- [x] T071 [US1] Create radar chart component (6-axis spider/radar chart) using SVG in `frontend/components/identity/radar-chart.tsx`
- [x] T072 [US1] Create Identity Card component with archetype badge, readiness score gauge (0-100), radar chart, and headline insight text in `frontend/components/identity/identity-card.tsx`
- [x] T073 [US1] Create Identity Card reveal page shown after first full synthesis with animation in `frontend/app/(authenticated)/identity/page.tsx`
- [x] T074 [US3] Create score progression sparkline component (90-day trend line) in `frontend/components/identity/score-sparkline.tsx`
- [x] T075 [US3] Create identity history page with version timeline, side-by-side radar comparison, score diffs, and narrative comparison in `frontend/app/(authenticated)/identity/history/page.tsx`

---

## Phase 6: Strategy, Simulation & Blueprint (US1, US4)

**Goal:** Strategy generation with action plans, "What If" simulation, and Blueprint PDF.
**Independent test:** User with full identity sees 3 strategies; can run simulations; can download PDF.

### Strategy Module — Backend

- [x] T076 [US1] Implement strategy generation service: assemble prompt with full identity context, call Claude API, parse 3 strategies with fit scores, pros, cons, action plans, roadmap milestones, and 72-hour micro-tasks in `backend/src/modules/strategy/service.ts`
- [x] T077 [US1] Implement strategy repository: create strategies with nested action_plans/action_items, roadmaps/milestones, micro_plans/micro_tasks; get by user; activate strategy in `backend/src/modules/strategy/repository.ts`
- [x] T078 [US1] Implement completion tracking for action items, milestones, and micro-tasks (update is_completed + completed_at) in `backend/src/modules/strategy/service.ts` (extend)
- [x] T079 [US1] Implement strategy re-evaluation trigger: when new identity version has readiness_score delta > 10 from previous, flag strategies for re-generation in `backend/src/modules/strategy/service.ts` (extend)
- [x] T080 [US1] Implement strategy routes: GET /strategies, PUT /strategies/:id/activate, GET /strategies/:id/action-plan, GET /strategies/:id/roadmap, GET /strategies/:id/micro-plan, PUT /action-items/:id, PUT /milestones/:id, PUT /micro-tasks/:id per api-v1.md in `backend/src/modules/strategy/routes.ts`

### Simulation Module — Backend

- [x] T081 [US4] Implement simulation service: accept modified parameters, create temporary identity synthesis with modified audit data, compute delta (score changes, archetype change, strategy implications), store result in `backend/src/modules/simulation/service.ts`
- [x] T082 [US4] Implement session-based rate limiting: track simulation count per session (max 3), return simulations_remaining in response in `backend/src/modules/simulation/service.ts` (extend)
- [x] T083 [US4] Implement simulation repository: create simulation record, get by session in `backend/src/modules/simulation/repository.ts`
- [x] T084 [US4] Implement simulation routes: POST /simulations per api-v1.md (returns delta + remaining count, 429 on limit) in `backend/src/modules/simulation/routes.ts`

### Blueprint Module — Backend

- [x] T085 [US1] Create HTML/CSS template for Investment Blueprint PDF with identity card (archetype, score, radar chart as SVG), strategy recommendations, action plan, roadmap, and key insights in `backend/src/modules/blueprint/template.html`
- [x] T086 [US1] Implement blueprint service: assemble data from identity + strategy modules, render HTML template, convert to PDF via Puppeteer in `backend/src/modules/blueprint/service.ts`
- [x] T087 [US1] Implement blueprint route: POST /blueprint/generate returning binary PDF with content-type application/pdf, 400 if audits incomplete per api-v1.md in `backend/src/modules/blueprint/routes.ts`

### Strategy & Simulation UI — Frontend

- [x] T088 [US1] Create strategy recommendation cards page showing 3 strategies with fit scores, pros/cons, and activate button in `frontend/app/(authenticated)/strategies/page.tsx`
- [x] T089 [US1] Create strategy detail page with tabbed view: action plan checklist, roadmap timeline, micro-plan card (72h countdown) in `frontend/app/(authenticated)/strategies/[id]/page.tsx`
- [x] T090 [US1] Create roadmap timeline component with interactive milestones (click to mark complete) in `frontend/components/strategy/roadmap-timeline.tsx`
- [x] T091 [US4] Create "What If" simulation interface with variable adjustment sliders/inputs and before/after comparison view showing score deltas, archetype change, and remaining simulation count in `frontend/app/(authenticated)/simulation/page.tsx`
- [x] T092 [US1] Create Blueprint download button component that triggers PDF generation and shows loading/download state in `frontend/components/strategy/blueprint-download.tsx`

---

## Phase 7: Dashboard & CRM (US5, US6)

**Goal:** Dashboard with identity snapshot, tasks, insights; contact management with network scoring.
**Independent test:** User sees populated dashboard on login; can manage contacts with network score updates.

### Contact Module — Backend

- [x] T091 [US5] Implement contact service: CRUD with soft delete, role type assignment, network completeness score calculation (percentage of key roles filled), network gap detection (roles required by active strategy but missing), relevance recalculation on identity change in `backend/src/modules/contact/service.ts`
- [x] T092 [US5] Implement contact repository: create, update, soft-delete, list with filters (role_type), get network score and gaps in `backend/src/modules/contact/repository.ts`
- [x] T093 [US5] Implement contact routes: GET /contacts, POST /contacts, PUT /contacts/:id, DELETE /contacts/:id, GET /contacts/network-score per api-v1.md in `backend/src/modules/contact/routes.ts`

### Task Module — Backend

- [x] T094 [US6] Implement task service: create AI-generated tasks from action plans and identity gaps, create manual tasks, calculate identity impact score, order by impact, time estimate calibration from skills audit in `backend/src/modules/task/service.ts`
- [x] T095 [US6] Implement task routes: GET /tasks, POST /tasks, PUT /tasks/:id, DELETE /tasks/:id per api-v1.md in `backend/src/modules/task/routes.ts`

### Insight Engine — Backend

- [x] T096 [US6] Implement insight engine service: generate progress insights (action plan completion), contradiction detection (stated time vs. engagement), score change explanations, milestone check-ins, network health alerts (contact last-contacted > 30 days) in `backend/src/modules/insight/service.ts`

### Dashboard — Backend

- [x] T097 [US6] Implement dashboard aggregation route: GET /dashboard returning identity snapshot (archetype, score, radar, 90d trend), active strategy with progress %, top 3 priority tasks, intelligence feed, audit completion status per api-v1.md in `backend/src/modules/dashboard/routes.ts`

### Dashboard UI — Frontend

- [x] T098 [US6] Create dashboard page with: top section (identity snapshot — archetype badge, readiness score, mini radar chart, sparkline), middle section (active strategy progress bar, 3 priority tasks with inline completion), bottom section (intelligence feed — scrollable insights list) in `frontend/app/(authenticated)/dashboard/page.tsx`

### Contact Manager UI — Frontend

- [x] T099 [US5] Create contact list page with role type filter tabs, add contact button, network score display with gap indicators, and "last contacted" color-coded badges in `frontend/app/(authenticated)/contacts/page.tsx`
- [x] T100 [US5] Create add/edit contact form modal with fields: name, email, phone, role_type dropdown, notes; shows network score impact preview on save in `frontend/components/contacts/contact-form.tsx`

---

## Phase 8: Polish & Cross-Cutting

**Goal:** End-to-end integration, accessibility, performance, error states.

- [x] T101 Wire end-to-end navigation flow: landing → register → hub → audits → identity reveal → strategies → dashboard with proper redirects and protected routes in `frontend/app/(authenticated)/layout.tsx`
- [x] T102 [P] Implement AI error state UI: friendly error message with retry button for all AI-dependent pages (identity, strategy, simulation, conversational audit) in `frontend/components/shared/ai-error-state.tsx`
- [x] T103 [P] Implement empty state UI for dashboard (no audits), strategies (no identity), and contacts (no contacts) in `frontend/components/shared/empty-states.tsx`
- [x] T104 [P] Accessibility audit and fixes: semantic HTML elements, keyboard navigation for all interactive elements, aria labels on charts and badges, sufficient color contrast in all components
- [x] T105 [P] Mobile responsive layout for all pages: audit forms, identity card, strategy cards, dashboard, contact list in all page files under `frontend/app/`
- [x] T106 Implement loading states only for visibly slow operations: AI synthesis, strategy generation, PDF generation, simulation — using skeleton/spinner components in `frontend/components/shared/loading-states.tsx`
- [x] T107 [P] Add activity logging calls to all services: log audit.completed, identity.synthesized, strategy.generated, contact.added, task.completed, simulation.run, blueprint.downloaded events via logging service
- [x] T108 [P] Implement form validation on both client (immediate feedback) and server (correctness) for all forms: registration, login, audit forms, contact forms, task creation per constitution VII

---

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundation) → All subsequent phases

Phase 2 (Foundation):
  T011-T015 (Schema) → T022-T029 (Auth) → T034 (App assembly)
  T016-T021 (Shared infra) can parallel with Schema
  T030-T031 (Tenant isolation) depends on T011 (Schema) + T024 (JWT middleware)
  T035-T041 (Frontend foundation) can parallel with Backend foundation

Phase 3 (Audit Backend) depends on Phase 2
Phase 4 (Audit Frontend + Hub) depends on Phase 3

Phase 5 (Identity Synthesis) depends on Phase 3 (needs audit data)
  US3 (Identity Evolution) depends on US1 (Identity Card)

Phase 6 (Strategy + Simulation) depends on Phase 5
  US4 (Simulation) depends on US1 (Identity + Strategy)

Phase 7 (Dashboard + CRM) depends on Phase 5 + Phase 6
  US5 (Contacts) needs strategies for relevance scoring
  US6 (Dashboard) needs identity, strategies, tasks, insights

Phase 8 (Polish) depends on all previous phases
```

---

## Parallel Execution Opportunities

### Within Phase 2:
- T016-T021 (shared infra) run parallel to T011-T015 (schema)
- T035-T041 (frontend foundation) run parallel to T022-T034 (backend)

### Within Phase 4 (Audit Frontend):
- T053 (Financial), T054 (Time), T055 (Skills), T056 (Risk), T057 (Horizon) — all 5 audit forms are independent

### Within Phase 5:
- T063 (scoring), T064 (radar) run parallel
- T069 (radar chart), T070 (identity card), T072 (sparkline) — frontend components are independent

### Within Phase 6:
- T079-T082 (simulation backend) parallel to T083-T085 (blueprint backend)
- T089 (simulation UI) parallel to T090 (blueprint UI)

### Within Phase 7:
- T091-T093 (contact backend) parallel to T094-T096 (task + insight backend)
- T098 (dashboard UI) parallel to T099-T100 (contact UI) after backend routes ready

### Within Phase 8:
- T102, T103, T104, T105, T107, T108 are all independent

---

## Implementation Strategy

### MVP Scope (Recommended)
**Phases 1-6** deliver the core identity construction flow (US1):
- Register → Complete 5 audits → See Identity Card → View 3 strategies → Download Blueprint

This is the minimum viable product that demonstrates the core value proposition.

### Incremental Delivery Order
1. **Phases 1-2:** Runnable app with auth (deploy "hello world")
2. **Phase 3:** Audits work via API (backend testable independently)
3. **Phase 4:** Full audit UI (first user-facing milestone)
4. **Phase 5:** Identity synthesis (core "wow" moment — the Identity Card reveal)
5. **Phase 6:** Strategies + simulation + PDF (full first-session experience)
6. **Phase 7:** Dashboard + CRM (daily engagement surface)
7. **Phase 8:** Polish (production readiness)

Each phase produces a testable, demonstrable increment.
