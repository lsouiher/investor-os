# InvestorOS codebase guide

A map of the repository for someone who needs to change it. It deliberately does not repeat
`CLAUDE.md` (commands, conventions, status) or the spec-kit artifacts under
`.specify/specs/001-identity-platform/` (API contract, data model, research decisions) — it
points at them. The AI pipeline, which is most of what makes this product work, has its own
document: **[`docs/ai-pipeline.md`](ai-pipeline.md)**. Read this file first, then that one.

Snapshot: written against `master` at `dea64c3` (v0.4.1.0, 2026-09-14). Line numbers in
`file:line` references were correct on that commit; treat them as "near here" afterwards.

## How to read this

| You have | Read |
|---|---|
| 15 minutes and want the mental model | §1 The product, §3 One request, §4 The lifecycle chain, §8 Async patterns |
| A prompt or model-output problem to fix | §4, then all of `ai-pipeline.md` |
| A launch-prep task (deploy, ops, cost) | §10 Runbook, `docs/deploy.md`, `docs/designs/bpcon-beta-launch.md` |
| A new endpoint or page to build | §3, §5 Module map, §6 Data model, §7 Frontend map, §9 Conventions |

## 1. The product in one paragraph

An investor answers five audits (financial, time, skills, risk, horizon). When all five are
complete the backend asks Claude to synthesize an **identity**: an archetype from a curated list
of eight, a readiness score, six radar axes and a headline insight. The identity drives three
ranked **strategies**; activating one produces an action plan, a roadmap and a 72-hour
micro-plan. A **what-if simulation** lets the user move a score slider and see how identity and
strategies would change. A **Growth Strategy Engine** (feature-flagged per tenant) adds longer
"growth paths" (portfolio, income & capital; two more are stubs) generated on a job queue, with
cross-path links and a "next best action". Around this sit a small CRM (contacts by role), tasks,
a dashboard with an AI "intelligence feed", a PDF blueprint and a markdown export. Everything is
single-tenant per user for now (1:1 user–tenant).

## 2. Repo map

```
investorOS/
├── backend/                 Express + Prisma modular monolith (TypeScript, ESM)
│   ├── src/main.ts          app assembly: middleware order, health, routes, worker boot
│   ├── src/modules/<m>/     one folder per domain: routes.ts, service.ts, repository.ts, types.ts
│   ├── src/shared/          ai/ (Claude client), encryption/, middleware/, db.ts, email.ts, logger.ts
│   ├── src/workers/         Bull workers (growth path generation) — run in the API process
│   ├── prisma/schema.prisma tables + enums; prisma/migrations/ (append-only); prisma/seed.ts = PROMPT TEMPLATES
│   └── scripts/             mock-anthropic.mjs (zero-cost AI), funnel-report.ts, delete-user.ts
├── frontend/                Next.js App Router (TypeScript), app/(authenticated)/<route>/page.tsx
│   ├── lib/api-client.ts    the only HTTP layer (api.get/post/put/del, getEnvelope, poll)
│   ├── components/          audit/ contacts/ growth/ hub/ identity/ shared/ strategy/
│   └── locales/{en,fr}.json UI strings (AI output itself is English-only — see ai-pipeline.md)
├── docs/                    deploy.md, designs/bpcon-beta-launch.md, this guide, ai-pipeline.md, recs-import-status.md
├── .specify/specs/001-identity-platform/   spec, plan, tasks, research, data-model, contracts/api-v1.md
├── .specify/specs/003-recs-import/         same set for the RECS import (contracts/recs-deals-api.md, import-link.md)
├── specs/001-growth-strategy-engine/       same set for the growth engine (contracts/api-v2.md)
├── CLAUDE.md                commands, key patterns, status — the operational cheat sheet
├── PRD_InvestorOS_Identity_Platform.md, Growth_Strategy_Engine.md   product intent (long)
└── CHANGELOG.md, VERSION    v0.4.1.0
```

Sizes: backend `src/` is ~10k lines across 75 files; frontend `app/`+`components/`+`lib/` is ~9k
lines. The AI layer proper (`backend/src/shared/ai/`) is 650 lines including tests.

## 3. One request, end to end

`backend/src/main.ts` assembles the app in this order (`main.ts:32-97`):

1. `helmet()` → `cors()` (origins from `CORS_ORIGIN`) → `express.json({ limit: '50kb' })`
2. `requestLogger` → `generalLimiter` (IP brake, 600/min)
3. `snakeCaseResponse` on `/api/v1` — every JSON body is converted to snake_case at `res.json`,
   so services may build camelCase objects (`shared/middleware/snake-case-response.ts`)
4. `GET /api/v1/health` (no auth) — `{ status: ok|degraded|down, checks: { db, ai, encryption, redis } }`;
   `ai` comes from the startup credential probe and is overridden by real call outcomes
5. `/api/v1/auth` public routes
6. `authenticate` (JWT) → `userLimiter` (120/min per user) → `setTenantContext` (AsyncLocalStorage +
   `SET app.current_tenant_id` for Postgres RLS)
7. Module routers: admin, audits, identity, strategies, simulations, blueprint, contacts, tasks,
   dashboard, growth-strategy, recs-deals
8. `errorHandler` last — `AppError` → `{ error: { code, message, details } }` with the status from
   `ERROR_STATUS_MAP`; a body the JSON parser refused → 400 (invalid JSON) or 413 (over 50 kb)
   `VALIDATION_ERROR`, not logged; anything else → 500 `INTERNAL_ERROR`
   (`shared/middleware/error-handler.ts:36-73`)

Inside a module the shape is always `routes.ts` (parse `req.body` in snake_case, call service,
`res.json({ data })`) → `service.ts` (business rules, cross-module calls by direct import) →
`repository.ts` (Prisma, every query carries `tenantId`). Public IDs are CUID2 strings
(`publicId` column); integer PKs never leave the process.

## 4. The lifecycle chain

```
PUT /audits/:type {complete:true}
   └─ audit/service.saveAudit ──► calculateSubScore (completeness %) ──► autoTriggerSynthesis
                                                                            │ (all 5 complete, or a newer audit version)
POST /identity/synthesize (202) ─────────────────────────────────────────────┤
                                                                            ▼
                                  identity/service.synthesizeIdentity  [dedup map per user]
                                     • decrypt audits, build completeness numbers
                                     • CLAUDE CALL identity_synthesis (≈35–45 s real)
                                     • new identity_versions row (append-only)
                                     └─ fire-and-forget: generateStrategies ─► CLAUDE CALL strategy_generation
                                                         refreshInsights    ─► CLAUDE CALL insight (cached 6 h)
                                                         maybeCreateGrowthStrategy ─► Bull job ─► CLAUDE CALL growth_path_generation
                                                                                              └─► (≥2 paths) CLAUDE CALL cross_path_analysis
PUT /strategies/:id/activate ──► generateDetailedPlans (async) ─► CLAUDE CALL strategy_activation ─► action_plan/roadmap/micro_plan JSONB
POST /simulations (job) ──────► runSimulation ─► CLAUDE CALL simulation ─► simulations row; GET /simulations/jobs/:id
GET /dashboard ───────────────► aggregates + cached insights (never waits on the model)
POST /blueprint/generate ─────► Puppeteer PDF from stored data (no model call)
POST /growth-strategy/export/markdown ─► zip; one small CLAUDE CALL for the intro paragraph
```

Every model call in that diagram goes through one function, `callClaude` in
`backend/src/shared/ai/client.ts`, and is logged to `ai_call_logs`. `ai-pipeline.md` §5 has a
per-call reference.

## 5. Backend module map

Each module lives in `backend/src/modules/<name>/`. "AI" marks modules that call the model.

- **auth** — register/login/forgot/reset (`routes.ts`), JWT + bcrypt (`service.ts`), per-IP and
  per-email limiters from `shared/middleware/rate-limiter.ts`, reset emails through Resend
  (`shared/email.ts`, logs instead of sending when `RESEND_API_KEY` is unset). Signup source
  capture for the beta funnel.
- **audit** — the five questionnaires. `types.ts` is the schema of every audit section and field
  (this is what the synthesis prompt sees); `validation.ts` requires ≥1 non-empty field per
  section to complete; `scoring.ts` computes a *completeness* sub-score; `repository.ts`
  encrypts the 14 sensitive financial fields on write and decrypts on read; `service.ts` fires
  `autoTriggerSynthesis`. Append-only: completing creates a new version row.
- **identity** (AI) — synthesis orchestration and status (`service.ts`), the Zod schema for the
  model's answer (`types.ts`), deterministic fallbacks (`scoring.ts`, `radar.ts`), version
  comparison narrative for the history page (`comparison.ts`), 1–5 rating + free-text feedback.
- **strategy** (AI) — three recommendations per identity version, activation, detailed plans as
  JSONB with generated item ids, completion toggles (which also call growth `evaluateUnlocks`),
  `needs_refresh` flag when readiness moves >10 points (flag is set but no UI renders it).
- **simulation** (AI) — what-if runs, 3 per user per 24 h, in-memory job map polled by the client,
  slider variables seeded from the identity; `routes.ts` whitelists parameter keys (0–100 numbers
  only) as prompt-injection defence.
- **insight** (AI) — the dashboard's intelligence feed; no routes of its own. Per-user cache on
  `users.insights_cache` with a 6 h TTL, stale-while-revalidate, invalidated on activation.
- **growth** (AI) — Growth Strategy Engine: `service.ts` (create, unlock rules, cooldowns,
  regeneration, stale-generating cleanup), `generation.ts` (the two model calls and their Zod
  schemas, path-specific instructions), `export.ts` (markdown zip + AI intro paragraph),
  `migration.ts` (admin backfill), `routes.ts` (incl. `/admin/stats`). Jobs run in
  `backend/src/workers/growth-path-worker.ts` (Bull on Redis, two queues, no auto-retry).
  Gated by the tenant feature flag `growth_strategy_enabled` (`shared/middleware/featureFlag.ts`
  returns 404 when off).
- **dashboard** — one `GET /dashboard` that fans out to identity, score history, active strategy,
  top tasks, audit completion, cached insights and the growth summary. Never awaits a model call.
- **contact** — CRM contacts with a `ContactRoleType` (agent, lender, contractor, attorney, cpa,
  mentor, partner, seller, property_manager, other). Role coverage feeds the insight prompt.
- **task** — tasks with `source` = `ai_generated | identity_gap | manual`; the active strategy's
  action items are merged into the list view; completion triggers growth unlock evaluation.
- **blueprint** — HTML template (`template.html`) → Puppeteer → PDF. Pure rendering of stored data.
- **recs-deal** — deals sent from RECS calculators (v0.5.0.0, `.specify/specs/003-recs-import/`):
  `POST/GET/DELETE /recs-deals`, the payload `d` stored opaque and never decoded, `validation.ts`
  checks the slug against `backend/config/recs.json` (the API will not start without that file),
  at most 500 live deals per user, soft delete blanks `name` and `d`.
- **logging** — `activity_logs` helpers. Only `audit.completed`, `contact.added`, `task.completed`
  are wired; the AI-related helpers exist but have no callers (`logging/service.ts:17-62`).
- **admin** — prompt-template list/create/activate (role `admin`); no UI. See `ai-pipeline.md` §4.
- **shared/** — `ai/` (client, retry, prompt loader, schema contract test), `encryption/`
  (AES-256-GCM, versioned keys), `middleware/` (auth, rbac, rate limiters, tenant context,
  snake_case, error handler, feature flag), `db.ts`, `email.ts`, `logger.ts` (pino),
  `utils/id.ts` (CUID2).

## 6. Data model essentials

Full column lists: `.specify/specs/001-identity-platform/data-model.md` and
`backend/prisma/schema.prisma` (16 models since v0.5.0.0 added `recs_deals`, whose columns are in
`.specify/specs/003-recs-import/data-model.md`; `schema.prisma:93-487`). What matters for reasoning
about behaviour:

- **Append-only versioning.** `audits` (one row per completed version per type; drafts are
  `in_progress`), `identity_versions` (one row per synthesis, with `audit_snapshot` recording
  which audit versions it used), `growth_paths` (`version` + `is_current`). Nothing user-owned
  is hard-deleted; `deleted_at` soft deletes.
- **JSONB plans.** `strategies.action_plan / roadmap / micro_plan`, `growth_paths.content /
  action_items`, `growth_strategies.cross_path_links` hold model output plus server-generated
  item ids and completion flags. Toggling completion rewrites the JSON in place.
- **Encryption.** `field-encryption.ts:55-70` lists the 14 financial fields encrypted at rest
  (`v{n}:{iv}:{tag}:{data}`); `ai_call_logs.full_prompt / full_response` are encrypted whole.
- **Tenant scoping.** Every repository query includes `tenantId`; Postgres RLS is the backstop
  (`shared/middleware/tenant-scope.ts` explains why there is no Prisma middleware — Prisma v6
  removed `$use`; CLAUDE.md's "Prisma middleware auto-injects tenant_id" is out of date).
- **Prompt infrastructure.** `prompt_templates` (`service_type`, `version`, `template_content`,
  `output_schema`, `is_active`; unique on type+version) and `ai_call_logs` (every call, success
  or failure, with hash, tokens, latency, model, template id).
- **Feedback.** `identity_versions.user_rating` (1–5) and `user_feedback` (text, added v0.4.0).
  `users.insights_cache / insights_generated_at` hold the dashboard feed.

## 7. Frontend map

`frontend/lib/api-client.ts` is the entire HTTP layer: `api.get/post/put/del` unwrap `{ data }`,
`api.getEnvelope` keeps sibling fields (used for `generating` on `GET /strategies`), and
`poll(fetchOnce, done, { intervalMs, maxAttempts })` throws `ApiError("TIMEOUT")` after the cap
(`api-client.ts:136-148`). A 401 (except from `/auth/login`, a wrong password) clears the token
and redirects to `/login` (`/login?next=/import` from `/import`), unless another tab has stored a
newer token, which it leaves alone. `lib/auth-context.tsx` reloads the page when another tab signs in or out, and a tab whose
session ended elsewhere first forgets its held RECS deal and signup source. Two components
bypass it with raw `fetch` for binary downloads: `components/strategy/blueprint-download.tsx`
and `components/growth/ExportButton.tsx`.

| Route (`app/(authenticated)/…`) | Backend endpoints | Model output shown / waiting behaviour |
|---|---|---|
| `hub/` | `GET /audits`, `GET/DELETE /recs-deals` | none; "synthesis ready" button after 5 audits; "Deals from your calculators" last |
| `/import` (public, `app/import/`) | `POST /recs-deals` | none; reads the RECS deal from the URL fragment, holds it in `sessionStorage` across sign-in |
| `audits/<type>/` | `GET/PUT /audits/:type` | none; completion redirects to hub |
| `identity/` | `POST /identity/synthesize`, `GET /identity/status`, `GET /identity`, `PUT /identity/:id/rate` | archetype, score, radar, headline, insights; polls status 80×3 s; rating + feedback box |
| `identity/history/` | `GET /identity/history` | version list with deltas |
| `strategies/` | `GET /strategies` (envelope), `PUT /strategies/:id/activate` | 3 strategies; polls while `generating` 80×3 s |
| `strategies/[id]/` | `GET /strategies/:id`, `PUT …/action-items/:id` (also milestones, micro-tasks) | plans; own `setInterval` 100×3 s until `action_plan` exists, then stops silently |
| `simulation/` | `GET /simulations/config`, `POST /simulations`, `GET /simulations/jobs/:id` | delta view; polls job 90×2 s |
| `dashboard/` | `GET /dashboard` | intelligence feed, next best action; no polling |
| `growth-strategy/` | `GET/POST /growth-strategy`, `POST …/paths/:type/generate`, `GET …/paths/:type/status` | path cards, cross-path links, NBA; 3 s interval while any path is generating (no cap) |
| `growth-strategy/[pathType]/` | `GET …/paths/:type`, `PUT …/action-items/:id` | path content + action items |
| `contacts/`, `tasks/` | `/contacts`, `/tasks` | none |

Shared UI for model states: `components/shared/ai-error-state.tsx` (`AiErrorState`
critical/medium/low with optional retry) and `components/shared/loading-states.tsx`
(`SpinnerOverlay`, `SkeletonCard`). Theme and locale live in `lib/theme.tsx` and `lib/i18n.tsx`;
the locale is stored in `localStorage` and **never sent to the backend**, so all model output is
English regardless of the FR toggle.

Frontend tests: co-located `*.test.ts(x)` files next to the code they cover (Jest + React Testing
Library).

## 8. Four async patterns

Real model calls take 30–180 s (`CHANGELOG.md:7`), longer than phones and proxies keep an idle
HTTP request open, so no request waits on the model. Four mechanisms, all in-process:

1. **Dedup map** — `identity/service.ts:24` (`synthesisInProgress`) and `strategy/service.ts:23`
   (`generationInProgress`): a `Map<userId, Promise>`; a second caller joins the in-flight promise
   instead of paying for a second call. `lastSynthesisError` remembers the last failure so
   `GET /identity/status` can distinguish "still working" from "gave up".
2. **Fire-and-forget chains** — after synthesis, strategies / insights / growth hooks start with
   `.catch(log)` (`identity/service.ts:219-239`); after activation, `generateDetailedPlans`
   (`strategy/service.ts:210`). Failures are logged, never shown; the UI relies on polling.
3. **In-memory job map** — simulations (`simulation/service.ts:30-73`): `startSimulation`
   returns a job id, `GET /simulations/jobs/:id` reports `running|done|failed`; 30-minute TTL,
   lost on restart ("run it again").
4. **Bull queues on Redis** — growth paths (`workers/growth-path-worker.ts`): concurrency 5,
   `attempts: 1`, 5-minute job timeout; a failed job reverts the path to `unlocked` (there is no
   `failed` status), and `cleanupStaleGenerating` sweeps rows stuck in `generating` >5 min on the
   next `GET /growth-strategy` (`growth/routes.ts:83`).

Consequence for anyone touching these: state lives in the API process. Two API replicas would
double-synthesize and lose simulation jobs; the growth queue is the only mechanism that survives
a restart.

## 9. Conventions and sharp edges

- **snake_case everywhere at the HTTP boundary.** Read `req.body.role_type`; never rely on a
  camelCase key arriving. Responses are normalized by middleware.
- **Prompt placeholders are literal and case-sensitive** (`{{AUDIT_DATA}}`). A mismatch is a
  warning in the logs, not an error, and the model receives the literal `{{...}}` text.
- **Zod is the real output contract.** The `output_schema` column on `prompt_templates` is
  stored but never enforced; the Zod schema in each module is what accepts or rejects a response.
  `shared/ai/schema-contract.test.ts` guards template ↔ schema agreement.
- **Deterministic scores are completeness, not readiness** — see `ai-pipeline.md` §6 before
  touching anything called "score".
- **Per-feature AI rate limiters are defined but unused.** `synthesizerLimiter` (5/5 min),
  `strategyLimiter` (3/5 min) and `blueprintLimiter` in `shared/middleware/rate-limiter.ts:61-109`
  are not applied to any route; only the dedup maps and the 120/min user brake bound model spend.
- **WSL + OneDrive.** File watchers get no events on `/mnt/c`: restart `npm run dev` after edits or
  the server keeps serving stale code. LF is enforced by `.gitattributes`. Postgres is on 5433.
- **`npx prisma generate` after schema edits**, or TypeScript reports phantom errors.
- **Seeding is an upsert on (service_type, version).** Re-running `npx prisma db seed` after
  editing a v1 template overwrites the live prompt — that is the intended hot-swap path, and also
  the reason to bump versions for anything you might want to roll back.

## 10. Runbook

Commands are in `CLAUDE.md` (infra, backend, frontend, mock server). Environment variables that
matter for the AI side (`backend/.env.example`):

| Variable | Meaning |
|---|---|
| `ANTHROPIC_API_KEY` | workspace-scoped key; org-level keys also need `ANTHROPIC_WORKSPACE_ID` |
| `ANTHROPIC_MODEL` | default `claude-sonnet-5`; the `.env.example` comment suggests `claude-opus-5` for quality |
| `ANTHROPIC_BASE_URL` | **undocumented in `.env.example`** — point it at `http://localhost:3999` to use `scripts/mock-anthropic.mjs` |
| `MOCK_AI_PORT` | mock server port (default 3999) |
| `GROWTH_STRATEGY_DEFAULT_ENABLED` | growth engine on for new tenants (existing: `UPDATE tenants SET feature_flags = '{"growth_strategy_enabled": true}'`) |
| `REDIS_URL` | growth worker queue; without it the worker logs a warning and growth generation never runs |

Health: `GET /api/v1/health` → 200 only when db, ai, encryption and redis are all true;
`ai:false` after startup means bad key / wrong workspace / unknown model (reasons in the logs);
`ai` flips to false at runtime on auth, permission or "credit balance" errors and back to true on
the next successful call (`shared/ai/client.ts:69-88`).

Ops scripts from `backend/`: `npm run funnel -- 7` (signup funnel per source, plus identity
ratings and free-text feedback for the last 7 days), `npm run delete-user -- <email>` (erase
audits, blank `ai_call_logs` prompt/response, scrub and soft-delete saved RECS deals, deactivate). There is no reader for `ai_call_logs`
beyond that scrubber — `ai-pipeline.md` §11 proposes one.

Reading logs: pino JSON on stdout. AI calls log `AI call completed` with `serviceType`,
`latencyMs`, `inputTokens`, `outputTokens`, `stopReason`; failures log the reason and, for
account-level refusals, a one-line diagnosis (`client.ts:69-88`).
