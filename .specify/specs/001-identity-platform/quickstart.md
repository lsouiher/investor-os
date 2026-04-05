# Quickstart: InvestorOS Identity Platform

**Feature:** 001-identity-platform
**Date:** 2026-04-03

---

## Prerequisites

- Node.js >= 20 LTS
- PostgreSQL >= 15
- npm or pnpm

---

## Project Structure

```
investorOS/
├── frontend/                  # Next.js App Router (TypeScript)
│   ├── app/                   # Pages and layouts
│   ├── components/            # Shared UI components
│   ├── lib/                   # Client utilities, API client
│   └── package.json
│
├── backend/                   # Express API (TypeScript)
│   ├── src/
│   │   ├── modules/           # Feature modules (auth, audit, identity, etc.)
│   │   │   └── {module}/
│   │   │       ├── routes.ts
│   │   │       ├── service.ts
│   │   │       ├── repository.ts
│   │   │       └── types.ts
│   │   ├── shared/            # Cross-cutting: middleware, encryption, AI client
│   │   └── main.ts            # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── migrations/        # Append-only migrations
│   └── package.json
│
├── .specify/                  # Spec-Kit artifacts (specs, plans, tasks)
└── docs/                      # Architecture decisions
```

---

## Setup

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env        # Fill in DATABASE_URL, JWT_SECRET, AUDIT_ENCRYPTION_KEY, ANTHROPIC_API_KEY
npx prisma migrate dev      # Run migrations
npx prisma db seed          # Seed prompt templates and archetype definitions
npm run dev                  # Starts Express on port 3001
```

### 2. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Fill in NEXT_PUBLIC_API_URL
npm run dev                         # Starts Next.js on port 3000
```

### 3. Database
```bash
# Local PostgreSQL
createdb investoros_dev

# Or Docker
docker run -d --name investoros-pg \
  -e POSTGRES_DB=investoros_dev \
  -e POSTGRES_PASSWORD=dev \
  -p 5432:5432 postgres:15
```

---

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://postgres:dev@localhost:5432/investoros_dev
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_EXPIRY=24h
AUDIT_ENCRYPTION_KEY=your-256-bit-hex-key
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

---

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (frontend or backend) |
| `npm test` | Run tests |
| `npm run lint` | Lint code |
| `npx prisma migrate dev` | Create and apply new migration |
| `npx prisma studio` | Visual database browser |
| `npx prisma generate` | Regenerate Prisma client after schema changes |

---

## Module Development Pattern

Each backend module follows this structure:

**routes.ts** — Express route definitions, input validation, calls service
**service.ts** — Business logic, orchestrates repository calls, no framework code
**repository.ts** — Prisma queries, encryption/decryption at this layer
**types.ts** — TypeScript interfaces for request/response shapes

Constitution rules:
- One concern per file (III)
- Test file co-located: `service.test.ts` next to `service.ts` (III)
- All writes server-side (V)
- Centralized auth middleware, not per-route (VI)

---

## Testing

```bash
# Unit tests (business logic in service files)
npm test -- --testPathPattern=service.test

# Integration tests (API routes with real DB)
npm test -- --testPathPattern=routes.test

# All tests
npm test
```

Tests must be fast (< 2 seconds each per constitution VIII). Mock external services (Anthropic API). Use a test database for integration tests.
