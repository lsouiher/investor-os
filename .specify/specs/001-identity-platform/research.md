# Research: InvestorOS Identity Platform

**Feature:** 001-identity-platform
**Date:** 2026-04-03

---

## Technical Context

### Resolved Decisions

#### 1. Frontend Framework
- **Decision:** Next.js with App Router (TypeScript)
- **Rationale:** PRD Section 9 specifies "React / Next.js." Next.js provides server-side rendering (constitution VII: "Render on the server by default"), file-based routing, built-in API routes for BFF patterns, and integrated deployment. App Router is the current standard.
- **Alternatives considered:** Plain React + Vite (no SSR), Remix (less ecosystem maturity)

#### 2. Backend Framework
- **Decision:** Node.js with Express (TypeScript)
- **Rationale:** PRD specifies RESTful API with JWT. Express is the simplest mature framework that satisfies the modular monolith pattern (constitution I: "simplest option that works"). TypeScript shared with frontend reduces context-switching. The Unit of Work + Repository Pattern specified in the PRD is straightforward to implement with Express + a service layer.
- **Alternatives considered:** Nest.js (more opinionated, heavier — violates "simplicity first"), Fastify (less ecosystem, fewer middleware options), Python/FastAPI (language split with frontend)

#### 3. ORM / Database Access
- **Decision:** Prisma ORM
- **Rationale:** Provides type-safe database access, built-in migrations (constitution IV: "migrations are append-only"), first-class JSON column support (needed for AI outputs, radar data, insights), and excellent PostgreSQL support including row-level security setup. Repository Pattern maps cleanly onto Prisma's client.
- **Alternatives considered:** TypeORM (more complex, less type safety), Knex (query builder only, more boilerplate), Drizzle (newer, smaller ecosystem)

#### 4. Database
- **Decision:** PostgreSQL
- **Rationale:** Explicitly specified in PRD Section 9. Supports row-level security for tenant isolation, JSONB columns for flexible AI output storage, and append-only versioning patterns.
- **Alternatives considered:** None — PRD is explicit.

#### 5. AI Provider
- **Decision:** Anthropic Claude API
- **Rationale:** Explicitly specified in PRD Section 9. Strong structured output capabilities for archetype assignment, strategy generation, and insight synthesis.
- **Alternatives considered:** None — PRD is explicit.

#### 6. Authentication
- **Decision:** JWT with custom middleware (jsonwebtoken library)
- **Rationale:** PRD specifies JWT authentication. Custom middleware is simpler than Passport.js for a single auth strategy (email/password). Centralized auth guard per constitution VI ("Authorization is centralized").
- **Alternatives considered:** Passport.js (overkill for single strategy), Auth0/Clerk (external dependency, constitution II: "justify before adding")

#### 7. PDF Generation
- **Decision:** Puppeteer (headless browser rendering)
- **Rationale:** PRD specifies "HTML template → server-side render" for Blueprint PDF. Puppeteer renders HTML/CSS to PDF with full fidelity — supports radar charts, styled identity cards, and complex layouts. Simpler than building a PDF from primitives.
- **Alternatives considered:** PDFKit (low-level, difficult for complex layouts), React-PDF (limited styling), wkhtmltopdf (deprecated)

#### 8. Testing Framework
- **Decision:** Jest + Supertest + React Testing Library
- **Rationale:** Jest is the standard for TypeScript projects. Supertest for API integration tests. React Testing Library for component tests. Constitution VIII: "Three test types, used proportionally" — unit, integration, e2e.
- **Alternatives considered:** Vitest (newer, less integration tooling), Playwright (for e2e only)

#### 9. Password Hashing
- **Decision:** bcrypt
- **Rationale:** Industry standard for password hashing. No reason to deviate. Simple API.
- **Alternatives considered:** Argon2 (stronger but heavier dependency), scrypt (less common in Node.js ecosystem)

#### 10. Field-Level Encryption
- **Decision:** Node.js crypto module (AES-256-GCM)
- **Rationale:** Constitution II: "Never add a library to solve a problem that can be solved with 20 lines of code." Node.js built-in crypto handles AES-256-GCM encryption/decryption. Encryption keys stored in environment variables (constitution X: "Secrets MUST never touch version control").
- **Alternatives considered:** @aws-sdk/client-kms (external dependency, not needed for MVP), node-forge (unnecessary wrapper)

#### 11. Logging
- **Decision:** Pino (structured JSON logging)
- **Rationale:** Fastest Node.js logger, structured JSON output for easy parsing. Minimal dependency footprint. Pairs with any log aggregation service.
- **Alternatives considered:** Winston (heavier, more features than needed), console.log (not structured, not production-ready)

#### 12. Rate Limiting
- **Decision:** express-rate-limit middleware
- **Rationale:** Constitution V: "Rate limiting is mandatory on all public endpoints." Simple in-memory rate limiter sufficient for MVP; can swap to Redis-backed in production.
- **Alternatives considered:** Custom implementation (unnecessary work), bottleneck (more complex than needed)

#### 13. ID Generation (Public-Facing)
- **Decision:** CUID2 for public-facing IDs
- **Rationale:** Constitution IV: "Never expose internal identifiers in public-facing URLs or APIs. Use opaque, non-sequential identifiers." CUID2 is collision-resistant, non-sequential, URL-safe, and lightweight.
- **Alternatives considered:** UUID v4 (longer, less URL-friendly), nanoid (less collision resistance at short lengths), ULID (sortable — exposes timing)

#### 14. State Management (Frontend)
- **Decision:** React Context + server state via SWR or React Query
- **Rationale:** PRD specifies "React Context + server persistence per audit phase." React Context for local UI state, SWR/React Query for server data caching and revalidation. No Redux — constitution I: "simplest option that works."
- **Alternatives considered:** Redux Toolkit (overkill for this scope), Zustand (unnecessary additional dependency)

#### 15. Email Service (Password Reset)
- **Decision:** Resend (or Nodemailer with SMTP)
- **Rationale:** Minimal dependency for transactional emails. Only used for password reset in MVP. Resend has simple API; Nodemailer is zero-dependency alternative if SMTP is available.
- **Alternatives considered:** SendGrid (heavier SDK), AWS SES (requires AWS infrastructure)

---

## Architecture Decisions

### Monolith Structure
The PRD specifies "Modular monolith (microservices-ready)." The backend will be structured as a single deployable with clean service boundaries:

```
backend/src/
├── modules/
│   ├── auth/          (Auth Service)
│   ├── audit/         (Audit Service)
│   ├── identity/      (Identity Service)
│   ├── strategy/      (Strategy Service)
│   ├── simulation/    (Simulation Service)
│   ├── contact/       (Contact Service)
│   ├── task/          (Task Service)
│   ├── blueprint/     (Blueprint Service)
│   ├── insight/       (Insight Engine)
│   └── logging/       (Logging Service)
├── shared/
│   ├── middleware/     (auth, rate-limit, error-handler, tenant-scope)
│   ├── encryption/    (field-level encryption utils)
│   └── ai/            (prompt assembly, LLM client, retry logic)
└── main.ts
```

Each module contains: `routes.ts`, `service.ts`, `repository.ts`, `types.ts`. Modules communicate through service-layer function calls (not HTTP), keeping the monolith simple while maintaining clean boundaries.

### Tenant Isolation Strategy
- Tenant ID column on every data table
- Prisma middleware automatically injects tenant filter on all queries
- Row-level security (RLS) as a defense-in-depth layer at the PostgreSQL level
- 1:1 user-tenant mapping for MVP; tenant table exists for future team expansion

### AI Pipeline Architecture
- Prompt templates stored in `prompt_templates` table (versioned, hot-swappable)
- Modular prompt assembly: system prompt + identity context + service block + output format
- Retry strategy: on parse failure, retry once with stricter format instructions; on sustained failure, return friendly error with retry button
- Queue-based processing for strategy generation (async); synchronous for simulation (with 30s timeout)

### Versioning Strategy
- Audit data: append-only rows. Each audit submission creates a new version row. Draft state stored as version 0 (in_progress status).
- Identity: new row per synthesis. References the audit versions it was synthesized from.
- Strategies: new row per generation. References the identity version that produced it.
