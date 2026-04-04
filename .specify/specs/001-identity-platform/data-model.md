# Data Model: InvestorOS Identity Platform

**Feature:** 001-identity-platform
**Date:** 2026-04-03
**Database:** PostgreSQL with Prisma ORM

---

## Entity Relationship Overview

```
tenants 1──1 users (MVP: 1:1, schema supports 1:many)
  users 1──* audits (5 types, versioned, draft support)
  users 1──* identity_versions (AI-synthesized, append-only)
  users 1──* strategies (linked to identity_version)
  users 1──* contacts
  users 1──* tasks
  users 1──* simulations

  identity_versions 1──* strategies
  strategies 1──1 action_plans
  action_plans 1──* action_items
  strategies 1──1 roadmaps
  roadmaps 1──* milestones
  strategies 1──1 micro_plans
  micro_plans 1──* micro_tasks

  simulations *──1 identity_versions (base version)

  prompt_templates (system-level, not tenant-scoped)
  activity_logs (cross-cutting, tenant-scoped)
  ai_call_logs (tenant-scoped, encrypted prompts)
```

---

## Entities

### tenants

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2, used in all external references |
| configuration | jsonb | default '{}' | Tenant-level settings |
| created_at | timestamp | not null, default now() | |
| deleted_at | timestamp | nullable | Soft delete (constitution IV) |

### users

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | References tenants.id |
| email | string | unique, not null | Login identifier |
| password_hash | string | not null | bcrypt hash |
| role | enum | not null, default 'investor' | Values: investor, admin |
| last_login_at | timestamp | nullable | |
| created_at | timestamp | not null, default now() | |
| updated_at | timestamp | not null | |
| deleted_at | timestamp | nullable | Soft delete |

**Indexes:** tenant_id, email (unique), public_id (unique)

### audits

Single table for all 5 audit types. Versioned with draft support.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | References tenants.id |
| user_id | int (FK) | not null, indexed | References users.id |
| audit_type | enum | not null | Values: financial, time, skills, risk, horizon |
| status | enum | not null, default 'not_started' | Values: not_started, in_progress, completed |
| version | int | not null, default 1 | Increments on each completion; 0 for initial draft |
| responses | jsonb | not null, default '{}' | All audit data points (partial or complete) |
| sub_score | int | nullable | 0-100, set on completion only |
| last_saved_at | timestamp | not null, default now() | Updated on every save (draft or complete) |
| completed_at | timestamp | nullable | Set when status transitions to completed |
| created_at | timestamp | not null, default now() | |

**Indexes:** (tenant_id, user_id, audit_type, version) unique composite, tenant_id, user_id
**State transitions:** not_started → in_progress (first save) → completed (all required fields + score generated)
**Versioning:** Completing an audit creates a new row with version+1. The current draft (in_progress) is always the latest row for (user_id, audit_type) with status != completed. Previous completed versions are preserved (append-only).

**Sensitive fields within `responses` JSON (encrypted at field level):**
- financial.primary_income
- financial.secondary_income
- financial.liquid_cash
- financial.retirement_accounts
- financial.existing_re_equity
- financial.other_investments
- financial.business_equity
- financial.total_monthly_debt
- financial.mortgage_rent
- financial.student_loans
- financial.auto_loans
- financial.credit_card_balances
- financial.credit_score_range
- financial.effective_tax_rate

### identity_versions

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | References tenants.id |
| user_id | int (FK) | not null, indexed | References users.id |
| version | int | not null | Auto-increments per user |
| archetype | string | not null | Selected from predefined set |
| readiness_score | int | not null | Composite 0-100 |
| sub_scores | jsonb | not null | {financial: n, time: n, skills: n, risk: n, horizon: n} |
| radar_data | jsonb | not null | {capital: n, time: n, skills: n, risk_tolerance: n, network: n, goal_clarity: n} |
| headline_insight | text | not null | AI-generated one-sentence summary |
| ai_insights | jsonb | not null | Full AI synthesis output (contradictions, feasibility, gaps, etc.) |
| audit_snapshot | jsonb | not null | References to audit versions used: {financial: v, time: v, ...} |
| user_rating | int | nullable, CHECK (1-5) | Post-synthesis feedback: "How well does this describe you?" |
| generated_at | timestamp | not null, default now() | |
| created_at | timestamp | not null, default now() | |

**Indexes:** (tenant_id, user_id, version) unique composite, tenant_id, user_id

### strategies

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| user_id | int (FK) | not null, indexed | |
| identity_version_id | int (FK) | not null, indexed | References identity_versions.id |
| name | string | not null | Strategy name (e.g., "BRRRR in Midwest Markets") |
| description | text | not null | Strategy description |
| fit_score | int | not null | 0-100 identity fit score |
| pros | jsonb | not null | Array of pro statements |
| cons | jsonb | not null | Array of con statements |
| rank | int | not null | 1-3 ordering |
| is_active | boolean | not null, default false | User's selected active strategy |
| created_at | timestamp | not null, default now() | |

**Indexes:** tenant_id, (tenant_id, user_id, identity_version_id)

### action_plans

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| strategy_id | int (FK) | unique, not null | 1:1 with strategy |
| created_at | timestamp | not null, default now() | |

### action_items

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| action_plan_id | int (FK) | not null, indexed | References action_plans.id |
| title | string | not null | |
| description | text | nullable | |
| sort_order | int | not null | Display ordering |
| is_completed | boolean | not null, default false | |
| completed_at | timestamp | nullable | |
| created_at | timestamp | not null, default now() | |

### roadmaps

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| strategy_id | int (FK) | unique, not null | 1:1 with strategy |
| created_at | timestamp | not null, default now() | |

### milestones

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| roadmap_id | int (FK) | not null, indexed | References roadmaps.id |
| title | string | not null | |
| description | text | nullable | |
| target_date | date | nullable | AI-suggested target |
| sort_order | int | not null | Timeline ordering |
| is_completed | boolean | not null, default false | |
| completed_at | timestamp | nullable | |
| created_at | timestamp | not null, default now() | |

### micro_plans

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| strategy_id | int (FK) | unique, not null | 1:1 with strategy |
| expires_at | timestamp | not null | 72 hours from creation |
| created_at | timestamp | not null, default now() | |

### micro_tasks

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| micro_plan_id | int (FK) | not null, indexed | References micro_plans.id |
| title | string | not null | |
| description | text | nullable | |
| estimated_minutes | int | nullable | AI-calibrated time estimate |
| sort_order | int | not null | Priority ordering |
| is_completed | boolean | not null, default false | |
| completed_at | timestamp | nullable | |
| created_at | timestamp | not null, default now() | |

### contacts

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| user_id | int (FK) | not null, indexed | |
| name | string | not null | |
| email | string | nullable | |
| phone | string | nullable | |
| role_type | enum | not null | Values: agent, lender, contractor, attorney, cpa, mentor, partner, seller, property_manager, other |
| notes | text | nullable | |
| strategy_relevance | jsonb | default '[]' | Array of strategy IDs this contact is relevant to |
| network_gap_filled | string | nullable | Which network gap this contact fills |
| last_contacted_at | timestamp | nullable | |
| created_at | timestamp | not null, default now() | |
| updated_at | timestamp | not null | |
| deleted_at | timestamp | nullable | Soft delete |

**Indexes:** tenant_id, (tenant_id, user_id), (tenant_id, role_type)

### tasks

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| user_id | int (FK) | not null, indexed | |
| source | enum | not null | Values: ai_generated, identity_gap, manual |
| title | string | not null | |
| description | text | nullable | |
| identity_impact_score | int | nullable | 0-100, set by AI for non-manual tasks |
| estimated_minutes | int | nullable | AI-calibrated |
| due_date | date | nullable | |
| is_completed | boolean | not null, default false | |
| completed_at | timestamp | nullable | |
| created_at | timestamp | not null, default now() | |
| updated_at | timestamp | not null | |
| deleted_at | timestamp | nullable | Soft delete (constitution IV) |

**Indexes:** tenant_id, (tenant_id, user_id, is_completed)

### simulations

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | |
| user_id | int (FK) | not null, indexed | |
| identity_version_id | int (FK) | not null, indexed | Base identity version |
| modified_parameters | jsonb | not null | What the user changed |
| result_delta | jsonb | not null | Score changes, archetype change, strategy changes |
| created_at | timestamp | not null, default now() | |

**Indexes:** tenant_id, (tenant_id, user_id), (tenant_id, user_id, created_at)
**Rate limiting:** Max 3 simulations per user per 24-hour rolling window. Enforced via query: `COUNT(*) WHERE user_id = ? AND created_at > NOW() - INTERVAL '24 hours'`

### prompt_templates

System-level table, NOT tenant-scoped.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| service_type | enum | not null | Values: identity_synthesis, strategy_generation, simulation, insight, scoring |
| version | int | not null | |
| template_content | text | not null | Prompt template with placeholders |
| output_schema | jsonb | nullable | Expected JSON output structure |
| is_active | boolean | not null, default false | Only one active per service_type |
| created_at | timestamp | not null, default now() | |
| updated_at | timestamp | not null | |

**Indexes:** (service_type, version) unique composite, (service_type, is_active) filtered where is_active=true

### activity_logs

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | bigint (PK) | auto-increment | Bigint for high volume |
| tenant_id | int (FK) | not null, indexed | |
| user_id | int (FK) | nullable, indexed | Null for system events |
| event_type | string | not null | e.g., audit.completed, identity.synthesized, strategy.generated |
| payload | jsonb | default '{}' | Event-specific data |
| created_at | timestamp | not null, default now() | |

**Indexes:** tenant_id, (tenant_id, event_type), created_at
**Note:** Append-only, no updates or deletes. Consider partitioning by created_at if volume warrants.

### password_reset_tokens

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | |
| user_id | int (FK) | not null, indexed | References users.id |
| token | string | unique, not null | Cryptographically random token (sent via email) |
| expires_at | timestamp | not null | Short-lived (e.g., 1 hour) |
| used_at | timestamp | nullable | Set when token is consumed; prevents reuse |
| created_at | timestamp | not null, default now() | |

**Indexes:** token (unique), user_id, expires_at

---

### ai_call_logs

Stores raw AI prompts and responses for debugging and prompt iteration.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | bigint (PK) | auto-increment | Bigint for high volume |
| tenant_id | int (FK) | not null, indexed | |
| user_id | int (FK) | not null, indexed | |
| service_type | enum | not null | Values: identity_synthesis, strategy_generation, simulation, insight, scoring |
| prompt_template_id | int (FK) | nullable | References prompt_templates.id |
| input_hash | string | not null | SHA-256 of full prompt (for dedup/search) |
| full_prompt | text | not null | Encrypted with AES-256-GCM (contains sensitive audit data) |
| full_response | text | not null | Raw AI response |
| model | string | not null | AI model used |
| tokens_used | int | nullable | Total token count |
| latency_ms | int | nullable | Request duration |
| success | boolean | not null | Whether the call succeeded |
| error_message | text | nullable | Error details if failed |
| created_at | timestamp | not null, default now() | |

**Indexes:** tenant_id, (tenant_id, service_type), created_at
**Retention:** 90 days recommended. Manual purge for now, scheduled task post-MVP.
**Note:** full_prompt is encrypted because it contains assembled audit data including sensitive financial fields. Same key versioning pattern as audit responses.

---

## Row-Level Security

All tenant-scoped tables enforce RLS policies:
```
CREATE POLICY tenant_isolation ON {table}
  USING (tenant_id = current_setting('app.current_tenant_id')::int);
```

Prisma middleware sets `app.current_tenant_id` at the start of each request from the authenticated user's JWT claims.

---

## Encryption Strategy

Sensitive fields within `audits.responses` JSON and `ai_call_logs.full_prompt` are encrypted/decrypted at the repository layer using AES-256-GCM with key versioning:
- Encryption happens before Prisma write
- Decryption happens after Prisma read
- Encryption keys stored in environment variables: `AUDIT_ENCRYPTION_KEY_V1`, `AUDIT_ENCRYPTION_KEY_V2`, etc.
- Current version tracked in `CURRENT_ENCRYPTION_KEY_VERSION` env var
- Each encrypted value stored as `v{N}:{iv}:{authTag}:{ciphertext}` (base64 encoded)
- Decrypt reads the version prefix, selects the matching key
- Encrypt always uses the latest version
- Key rotation: add new env var, update version. Old keys kept for reading. Bulk re-encryption script available as one-off migration tool.
