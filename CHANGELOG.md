# Changelog

All notable changes to InvestorOS will be documented in this file.

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
