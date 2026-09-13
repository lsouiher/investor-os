# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

InvestorOS — an identity-centric real estate investment platform. Constructs a multidimensional investor identity through 5 structured audits (Financial, Time, Skills, Risk, Horizon), AI-synthesizes it into an archetype + readiness score, and activates it through personalized strategies, action plans, and an identity-aware CRM.

**Status:** Implemented and running locally. `master` is v0.3.3.0: identity platform (v0.1),
Growth Strategy Engine (v0.2), the integration fixes that make the AI pipeline and every page
actually work (v0.3.0), dark mode (v0.3.1), French i18n (v0.3.2) and real-API hardening —
streaming calls with production-sized timeouts (v0.3.3). The AI pipeline is verified end-to-end
against the mock server; the configured workspace key authenticates, but the Anthropic account
has no credits, so the real-API run is still pending (`/health` reports `ai:false` with the reason
in the backend log once a call is refused).

## Architecture

- **Frontend:** Next.js (App Router, TypeScript) in `frontend/`
- **Backend:** Express (TypeScript) modular monolith in `backend/`
- **ORM:** Prisma with PostgreSQL
- **AI:** Anthropic Claude API for identity synthesis, strategy generation, conversational audits, simulations, and insights
- **Auth:** JWT (jsonwebtoken + bcrypt), centralized middleware, RBAC (investor/admin)
- **PDF:** Puppeteer (HTML template to PDF for Investment Blueprint)

Backend follows a modular monolith pattern with service modules in `backend/src/modules/` (auth, audit, identity, strategy, simulation, contact, task, blueprint, insight, logging, admin, dashboard, growth). Each module has: `routes.ts`, `service.ts`, `repository.ts`, `types.ts`. Modules communicate via direct service function calls. Growth path generation runs on Bull workers (`backend/src/workers/`) backed by Redis.

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

## Commands

```bash
# Infra (Postgres on host port 5433 — 5432 collides with other projects on this machine — and Redis)
docker compose up -d

# Backend
cd backend && npm install
cp .env.example .env            # DATABASE_URL, JWT_SECRET, AUDIT_ENCRYPTION_KEY_V1, ANTHROPIC_API_KEY (+ ANTHROPIC_WORKSPACE_ID for org-level keys), REDIS_URL
npx prisma generate             # Regenerate the client after schema changes (stale client = phantom TS errors)
npx prisma migrate deploy       # Apply migrations
npx prisma db seed              # Upsert prompt templates (safe to re-run after editing prisma/seed.ts)
npm run dev                     # Express on :3001 — GET /api/v1/health probes DB, Redis and the Anthropic key
npm test                        # Jest (unit + contract tests)

# Frontend
cd frontend && npm install
cp .env.local.example .env.local  # NEXT_PUBLIC_API_URL includes the /api/v1 prefix
npm run dev                       # Next.js on :3000
npm test                          # Jest + React Testing Library

# Run the whole AI pipeline with no API key / no cost (deterministic canned responses)
node backend/scripts/mock-anthropic.mjs &                       # :3999
ANTHROPIC_BASE_URL=http://localhost:3999 ANTHROPIC_API_KEY=sk-ant-mock npm run dev   # from backend/
```

The Growth Strategy Engine is gated per tenant: `UPDATE tenants SET feature_flags = '{"growth_strategy_enabled": true}'`.

**WSL note:** the repo lives on `/mnt/c` (OneDrive). File watchers do not get change events there, so
`tsx watch` and Next.js HMR will serve stale code — restart the dev server after edits, or move the
checkout to the Linux filesystem. `.gitattributes` enforces LF so OneDrive's CRLF rewrites don't dirty the tree.

## Key Patterns

- **Error shape:** `{ error: { code, message, details } }` — consistent across all endpoints
- **Success shape:** `{ data: { ... } }` with optional `pagination` object
- **Key casing:** every JSON response is snake_case (contract `api-v1.md`). Services may build camelCase objects; `snakeCaseResponse` middleware normalizes at `res.json`. Request bodies are snake_case too — read `req.body.role_type`, never `req.body.roleType`.
- **Prompt templates are the interface:** placeholder names are case-sensitive (`{{AUDIT_DATA}}`), the JSON output format in the template must match the module's Zod schema (guarded by `shared/ai/schema-contract.test.ts`), and `assemblePrompt` warns on any placeholder left unfilled.
- **Public IDs:** CUID2 everywhere in URLs/responses; internal integer PKs never exposed
- **Audit versioning:** Append-only rows. Draft = in_progress status. Completing creates new versioned row.
- **Identity versioning:** New row per AI synthesis. References audit versions used via `audit_snapshot` JSON.
- **AI pipeline:** Prompt templates stored in DB (versioned, hot-swappable). Assembly: system prompt + identity context + service block + output format. Retry with stricter format on parse failure; friendly error with retry button on sustained failure. Every call streams and `callClaude` enforces the total budget itself; per-call `timeoutMs` values are sized for real generation (2–4 min) — the mock answers instantly, so never tune them against it. Concurrent synthesis/strategy generation for one user joins the in-flight call.
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

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
