# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

InvestorOS — an identity-centric real estate investment platform. Constructs a multidimensional investor identity through 5 structured audits (Financial, Time, Skills, Risk, Horizon), AI-synthesizes it into an archetype + readiness score, and activates it through personalized strategies, action plans, and an identity-aware CRM.

**Status:** Pre-implementation. Specification and planning artifacts are complete. No application code exists yet.

## Architecture (Planned)

- **Frontend:** Next.js (App Router, TypeScript) in `frontend/`
- **Backend:** Express (TypeScript) modular monolith in `backend/`
- **ORM:** Prisma with PostgreSQL
- **AI:** Anthropic Claude API for identity synthesis, strategy generation, conversational audits, simulations, and insights
- **Auth:** JWT (jsonwebtoken + bcrypt), centralized middleware, RBAC (investor/admin)
- **PDF:** Puppeteer (HTML template to PDF for Investment Blueprint)

Backend follows a modular monolith pattern with 10 service modules in `backend/src/modules/` (auth, audit, identity, strategy, simulation, contact, task, blueprint, insight, logging, admin). Each module has: `routes.ts`, `service.ts`, `repository.ts`, `types.ts`. Modules communicate via direct service function calls.

## Constitution

The project constitution at `.specify/memory/constitution.md` is **the law** — it supersedes all other conventions. Key mandates:

- Simplicity first: prefer fewer files, tables, dependencies. No speculative architecture.
- Soft deletes for user-owned data. Never expose internal IDs (use CUID2). Append-only migrations.
- All writes server-side. Rate limiting on all public endpoints. Consistent error response shape.
- Centralized authorization. Server-side rendering by default. Co-located tests.
- Field-level encryption (AES-256-GCM) for sensitive financial data (income, credit score, debt, tax rate).
- Row-level security + Prisma middleware for tenant isolation (1:1 user-tenant for MVP).

## Specification Artifacts

All spec-kit artifacts live in `.specify/specs/001-identity-platform/`:

| File | Contents |
|------|----------|
| `spec.md` | Feature spec: 16 FRs, 7 user scenarios, 14 success criteria |
| `plan.md` | Implementation plan: 7 build phases, module breakdown |
| `tasks.md` | 110 tasks (T001-T110) organized by phase and user story |
| `research.md` | 15 technology decisions with rationale |
| `data-model.md` | 17 PostgreSQL tables with field definitions, indexes, RLS strategy |
| `contracts/api-v1.md` | Full REST API contracts: all endpoints, request/response shapes, rate limits |
| `quickstart.md` | Setup instructions and development patterns |

## Development Workflow (Spec-Kit + GStack)

Defined in `Principal_Dev_Framework.md`. The cycle is:

1. **Define** — `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-analyze`
2. **Challenge** — `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`
3. **Build + Ship** — Per task: implement → `/review` → `/qa` → `/cso` → `/ship` → `/retro`

## Commands (Once Scaffolded)

```bash
# Backend
cd backend && npm install
cp .env.example .env            # DATABASE_URL, JWT_SECRET, AUDIT_ENCRYPTION_KEY, ANTHROPIC_API_KEY
npx prisma migrate dev          # Apply migrations
npx prisma db seed              # Seed archetypes + prompt templates
npm run dev                     # Express on :3001
npm test                        # Jest + Supertest

# Frontend
cd frontend && npm install
cp .env.local.example .env.local  # NEXT_PUBLIC_API_URL
npm run dev                       # Next.js on :3000
npm test                          # Jest + React Testing Library

# Database
docker compose up -d              # PostgreSQL 15 via Docker
npx prisma studio                 # Visual DB browser
```

## Key Patterns

- **Error shape:** `{ error: { code, message, details } }` — consistent across all endpoints
- **Success shape:** `{ data: { ... } }` with optional `pagination` object
- **Public IDs:** CUID2 everywhere in URLs/responses; internal integer PKs never exposed
- **Audit versioning:** Append-only rows. Draft = in_progress status. Completing creates new versioned row.
- **Identity versioning:** New row per AI synthesis. References audit versions used via `audit_snapshot` JSON.
- **AI pipeline:** Prompt templates stored in DB (versioned, hot-swappable). Assembly: system prompt + identity context + service block + output format. Retry with stricter format on parse failure; friendly error with retry button on sustained failure.
- **Tenant isolation:** Prisma middleware auto-injects `tenant_id` filter. PostgreSQL RLS as defense-in-depth.

## spec-kit + gstack

Spec-Kit for definition, GStack for delivery.

### Workflow
1. Define: /speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks → /speckit.analyze
2. Challenge: Point /plan-ceo-review and /plan-eng-review at spec artifacts
3. Build per task: implement → /review → /qa → /cso (if applicable) → /ship
4. Reflect: /retro
5. After /ship: save review outputs to specs/<feature>/ and update spec if needed

### Artifacts
- Specs: .specify/specs/<branch>/
- Constitution: .specify/memory/constitution.md
- Review files: specs/<feature>/*.md (product-review, engineering-review, code-review, etc.)

### GStack skills
/office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark,
/browse, /qa, /qa-only, /design-review, /cso, /retro, /investigate,
/document-release, /codex, /autoplan, /careful, /freeze, /guard, /unfreeze

### Handoff convention
When running GStack review/QA skills, always provide spec context:
"Review this against the acceptance criteria in .specify/specs/<branch>/spec.md"
