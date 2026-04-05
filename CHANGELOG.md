# Changelog

All notable changes to InvestorOS will be documented in this file.

## [0.3.1.0] - 2026-09-12

Dark mode with system preference detection and persistent theme toggle. (Originally built as 0.2.1.0 in April; rebased onto the v0.3 pages.)

### Added

- **Dark mode** with three-mode toggle (light, dark, system) and FOUC prevention via inline script
- **Custom ThemeProvider** context with localStorage persistence and real-time system preference tracking
- **7 new semantic color tokens** (border, border-muted, surface-subtle, foreground-strong, foreground-secondary, foreground-tertiary) for theme-aware styling
- **Dark color palette** with `color-scheme` CSS property for native UI element theming (scrollbars, selects, autofill)

### Changed

- Migrated hardcoded Tailwind gray/white color classes to semantic tokens across all page and component files
- Converted inline hex colors in SVG charts (radar, sparkline, gauge) to CSS variable references
- Added `dark:` variant overrides for colored badges (amber, red, emerald, blue status pills)

## [0.3.0.0] - 2026-09-12

Integration release: the first version where the AI pipeline and every page work end-to-end. Verified with a full API smoke test (24/24) and a browser walk-through against a local mock of the Anthropic API.

### Fixed

- **AI prompts received no data.** Every v1 service passed lowercase placeholder names to templates that use `{{UPPERCASE}}`, so Claude saw literal `{{AUDIT_DATA}}`. Services now supply the exact placeholder names; `assemblePrompt` warns when any placeholder is left unfilled
- **Three Zod schemas rejected their own template's output** (identity expected `insights` not `ai_insights`; simulation expected camelCase; insight expected fields the template never asked for). Identity synthesis could never succeed. Schemas now match the templates, guarded by a contract test
- **Strategies were never generated.** FR-6 chains generation to synthesis; `GET /strategies` also self-heals for the current identity
- **API responses were camelCase; the frontend (and contract) are snake_case.** A single `res.json` middleware normalizes every response; contact, task and simulation routes read snake_case request keys. Before this, no page past the audits could render data
- **Frontend called routes that did not exist** (`/simulation/config`, `/simulation/run`, `/identity/feedback`, `GET /strategies/:id`, `POST …/activate`). Pages now use the real endpoints; the backend gained `GET /strategies/:id` and `GET /simulations/config`
- **Identity dead-end:** when synthesis had not run (or failed), the hub, dashboard and identity page looped the user back to "complete your audits" with no way to synthesize. The identity page now offers a Synthesize button
- **Growth page never rendered** ExportButton, StalenessAlert, CrossPathInsights, ManualUnlockDialog or UnlockCelebration — export was unreachable and early-unlock used a raw `confirm()`. All wired in; the export URL no longer doubles `/api/v1`; identities that predate the feature flag get a "Create My Growth Strategy" button
- **Audit scoring ignored three sections** (`preferences`, `safety`, `objectives`) after an earlier rename left `scoring.ts` on the old keys
- **Deprecated model** `claude-sonnet-4-20250514` replaced by `ANTHROPIC_MODEL` (default `claude-sonnet-5`); AI calls use the SDK timeout instead of a `Promise.race` that left requests running
- `/health` reported `ai: true` whenever the key was merely set; it now reflects a startup credential probe and logs loudly on an invalid key
- Dashboard: consumes the real payload, gains the growth-strategy card, sparkline from `score_history`, and priority tasks; the active strategy's action items now appear as tasks on the dashboard and Tasks page
- Sidebar shows the readiness score; radar chart labels no longer clip; tasks page keeps "Add Task" reachable when empty; contacts expose the full role enum and auto-detect the network gap a new contact fills
- Postgres moved to host port 5433 (5432 collided with another project); `.gitattributes` enforces LF

### Added

- `backend/scripts/mock-anthropic.mjs` — local mock of the Messages API returning schema-valid JSON per prompt type, for zero-cost development and smoke tests
- Tests: AI schema/template contracts, prompt assembly, snake_case middleware, growth unlock rules, first frontend tests (jest-dom setup was never registered)

## [0.2.0.0] - 2026-04-05

Growth Strategy Engine: multi-path growth planning that activates after identity synthesis.

### Added

- **Growth Strategy Engine** with 4 growth paths (Portfolio, Income & Capital, Skills & Knowledge, Time & Operations) created automatically after identity synthesis
- **AI path generation** via Bull/Redis async job queue with 30s timeout, stalled job recovery, and 1-generation-per-path-per-hour rate limiting
- **Progressive path unlocking** based on user engagement (micro-task completions, action item progress, platform activity duration)
- **Manual early unlock** option with confirmation dialog for users who want to skip organic unlock criteria
- **Cross-path intelligence** that identifies prerequisite, enabling, constraint, and conflict connections between paths with AI-generated conflict resolutions
- **Next Best Action** computation ranking action items across all paths by cross-path dependency impact
- **AI-readable markdown export** as zip with YAML frontmatter, identity narrative, path-specific files, and priority-ordered action plan
- **Export consent flow** requiring explicit confirmation for first-time exports containing sensitive financial data
- **Export freshness detection** comparing current identity/path versions against last export snapshot
- **Blueprint PDF extension** with conditional growth strategy sections, path summary cards, and locked path placeholders
- **V1 user migration** service for seamless upgrade of existing investors into the Growth Strategy framework
- **Growth strategy regeneration** with append-only versioning (old versions preserved per constitution IV)
- **Identity score delta detection** suggesting strategy refresh when readiness score changes by 10+ points
- **Feature flag gating** via tenant-level `feature_flags` JSONB column, all endpoints return 404 when flag is off
- **Admin stats endpoint** with per-path unlock rates, export counts, and regeneration metrics (tenant-scoped)
- **Dashboard integration** with growth strategy summary card, next best action, and export staleness indicator
- **Stale generation cleanup** reverting paths stuck in 'generating' for 5+ minutes on dashboard load
- **Zod validation schemas** on all AI response parsing (PathGenerationResponse, CrossPathAnalysisResponse)
- **Partial unique index** preventing duplicate active strategies per user and duplicate current paths per type
- **9 frontend components**: PathCard (5 states), Growth Strategy dashboard, path detail with action item checkboxes, CrossPathInsights, NextBestAction, UnlockCelebration, ManualUnlockDialog, ExportButton, StalenessAlert

### Changed

- Extended Prisma schema with 5 new enums, 3 new models (GrowthStrategy, GrowthPath, ExportHistory), and featureFlags on Tenant
- Added Redis service to docker-compose.yml and REDIS_URL to .env.example
- Identity synthesis now auto-creates growth strategy when feature flag is on (fire-and-forget)
- V1 strategy service now evaluates growth path unlocks after task completions
- Blueprint service conditionally renders growth strategy sections based on feature flag
- Dashboard response includes growth_strategy summary when feature flag is on
- Health endpoint checks Redis connectivity alongside DB, AI, and encryption

## [0.1.0.0] - 2026-04-04

Initial implementation of the InvestorOS identity platform.

### Added

- **5 structured audits** (Financial, Time, Skills, Risk, Horizon) with form-based completion, section validation, and deterministic sub-score calculation
- **AI-powered identity synthesis** that combines audit data into an investor archetype, weighted readiness score (0-100), radar chart, and headline insight
- **3 personalized strategies** generated per identity with action plans, roadmaps, and 30-day micro-plans
- **"What If" simulation engine** that lets you adjust variables and see how your identity score shifts, with per-user attempt limits
- **Investment Blueprint PDF** generated from your identity and active strategy via Puppeteer HTML-to-PDF
- **Identity-aware dashboard** with snapshot card, task feed, and AI intelligence insights
- **Contact CRM** with role-based categorization, network gap scoring, and strategy relevance tagging
- **JWT authentication** with bcrypt password hashing, password reset flow, and RBAC (investor/admin roles)
- **Field-level encryption** (AES-256-GCM) with key versioning for sensitive financial data (income, credit score, debt, tax rate)
- **Tenant isolation** via Prisma middleware auto-injecting tenant_id filters with PostgreSQL RLS as defense-in-depth
- **Consistent API shape** with `{ data }` / `{ error: { code, message, details } }` across all endpoints
- **Rate limiting** on all public endpoints with configurable windows

### Fixed

- Identity and simulation pages now show empty state instead of error when no identity exists
- Race condition in identity version creation (now uses serializable transaction)
- Race condition in strategy activation (now atomic deactivate-then-activate)
- LLM-generated insight URLs restricted to relative paths (prevents `javascript:` injection)
- User input removed from error messages in contact routes (defense-in-depth)
