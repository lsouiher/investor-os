# Changelog

All notable changes to InvestorOS will be documented in this file.

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
