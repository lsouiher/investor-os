# Data Model: Growth Strategy Engine

**Feature:** 001-growth-strategy-engine
**Date:** 2026-04-04
**Database:** PostgreSQL with Prisma ORM
**Extends:** V1 Identity Platform data model (12 existing tables unchanged)

---

## Entity Relationship Overview

```
(existing) users 1──* growth_strategies (1 active at a time)
  growth_strategies 1──* growth_paths (4 paths per strategy)
  growth_strategies *──1 identity_versions (linked to identity at creation)
  growth_paths ?──1 strategies (Portfolio Growth references active V1 strategy)
  users 1──* export_history

(existing tables unchanged: tenants, users, audits, identity_versions,
 strategies, contacts, tasks, simulations, prompt_templates,
 activity_logs, password_reset_tokens, ai_call_logs)
```

---

## New Tables (3)

### growth_strategies

Top-level container for a user's multi-path growth plan. One active strategy per user at a time.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | References tenants.id |
| user_id | int (FK) | not null, indexed | References users.id |
| identity_version_id | int (FK) | not null, indexed | Identity version at creation time |
| status | enum | not null, default 'active' | Values: active, superseded |
| overall_progress | int | not null, default 0 | 0-100, composite of all path progress |
| cross_path_links | jsonb | not null, default '[]' | Array of cross-path link objects (see schema below) |
| next_best_action | jsonb | nullable | Computed next best action across all paths |
| created_at | timestamp | not null, default now() | |
| updated_at | timestamp | not null | |

**Indexes:** tenant_id, (tenant_id, user_id), (tenant_id, user_id, status)

**cross_path_links JSONB schema:**
```json
[
  {
    "id": "cuid2",
    "type": "prerequisite|enabling|constraint|conflict",
    "source_path_type": "portfolio|income_capital|skills_knowledge|time_operations",
    "source_item_id": "cuid2",
    "source_description": "string",
    "target_path_type": "portfolio|income_capital|skills_knowledge|time_operations",
    "target_item_id": "cuid2",
    "target_description": "string",
    "description": "string",
    "resolution": "string|null (only for conflict type)"
  }
]
```

**next_best_action JSONB schema:**
```json
{
  "action_item_id": "cuid2",
  "path_type": "portfolio|income_capital|skills_knowledge|time_operations",
  "title": "string",
  "reason": "string",
  "cross_path_impact": ["string"]
}
```

---

### growth_paths

Individual growth dimension within a strategy. Four types, each with independent lifecycle.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | References tenants.id |
| user_id | int (FK) | not null, indexed | References users.id |
| growth_strategy_id | int (FK) | not null, indexed | References growth_strategies.id |
| path_type | enum | not null | Values: portfolio, income_capital, skills_knowledge, time_operations |
| status | enum | not null, default 'locked' | Values: locked, unlocked, generating, generated |
| version | int | not null, default 1 | Increments on regeneration (new row created, append-only) |
| is_current | boolean | not null, default true | Only one current row per (growth_strategy_id, path_type) |
| strategy_id | int (FK) | nullable, indexed | References strategies.id (Portfolio Growth only) |
| content | jsonb | not null, default '{}' | Path-type-specific AI-generated content (see schemas below) |
| action_items | jsonb | not null, default '[]' | Array of action item objects |
| progress | int | not null, default 0 | 0-100, based on action item completion |
| summary | text | nullable | Short AI-generated summary for dashboard card |
| unlock_type | enum | nullable | Values: organic, manual, system. Null while locked |
| unlocked_at | timestamp | nullable | When the path was unlocked |
| unlock_trigger | jsonb | nullable | Details about what triggered the unlock |
| generated_at | timestamp | nullable | Last successful generation time |
| generation_cooldown_until | timestamp | nullable | Rate limit: next allowed generation time |
| created_at | timestamp | not null, default now() | |
| updated_at | timestamp | not null | |

**Indexes:** tenant_id, (tenant_id, growth_strategy_id), (tenant_id, user_id), (tenant_id, growth_strategy_id, path_type, version) unique composite, (tenant_id, growth_strategy_id, path_type, is_current) filtered where is_current=true

**Versioning (append-only, per FR-17 and constitution IV):**
- Regeneration creates a new row with version+1 and is_current=true. The previous row's is_current is set to false.
- Old versions are never deleted or overwritten — content is preserved in the old row.
- Queries for current paths filter by is_current=true.
- Unlock metadata (unlock_type, unlocked_at, unlock_trigger) is copied from the previous version on regeneration.

**action_items JSONB schema:**
```json
[
  {
    "id": "cuid2",
    "title": "string",
    "description": "string",
    "timeframe": "string (e.g., '72 hours', '1-2 weeks', '1-3 months')",
    "category": "string",
    "identity_impact": "string",
    "priority_score": 85,
    "is_completed": false,
    "completed_at": null
  }
]
```

**State transitions:**
- locked → unlocked (organic trigger or manual request)
- unlocked → generating (path generation initiated)
- generating → generated (AI generation completes)
- generating → unlocked (AI generation fails — revert)
- generated → generating (regeneration initiated)

---

#### Content JSONB Schemas by Path Type

**Portfolio Growth (`path_type: portfolio`):**
```json
{
  "scaling_plan": {
    "year_1_vision": "string",
    "year_3_vision": "string",
    "year_5_vision": "string",
    "year_10_vision": "string"
  },
  "reinvestment_strategy": "string",
  "diversification_plan": "string",
  "exit_framework": "string",
  "financing_evolution": "string",
  "tool_placeholders": [
    {
      "tool_name": "string",
      "stage": "string",
      "message": "At this stage of your growth, a [tool] will be available here soon."
    }
  ]
}
```
Note: Existing strategy data (acquisition strategies, action plan, roadmap, micro-plan) is accessed via the `strategy_id` FK, not duplicated here.

**Income & Capital Growth (`path_type: income_capital`):**
```json
{
  "capital_acceleration_plan": "string",
  "income_growth_roadmap": "string",
  "funding_channel_map": [
    { "channel": "string", "accessibility_rank": 1, "description": "string", "requirements": "string" }
  ],
  "professional_transition_plan": "string|null",
  "capital_milestone_targets": [
    { "milestone": "string", "target_amount": "string", "timeline": "string", "portfolio_phase_link": "string" }
  ]
}
```
Note: Sensitive financial data in this content (funding amounts, income targets) follows the same field-level encryption pattern as audit responses — encrypted at the repository layer before Prisma write.

**Skills & Knowledge Growth (`path_type: skills_knowledge`):**
```json
{
  "skill_gap_analysis": [
    { "skill": "string", "current_level": "string", "target_level": "string", "priority_rank": 1, "portfolio_phase_link": "string" }
  ],
  "learning_roadmap": "string",
  "resource_recommendations": [
    { "type": "book|course|community|tool", "name": "string", "url": "string|null", "relevance": "string" }
  ],
  "network_building_plan": "string",
  "certification_roadmap": "string|null",
  "mentorship_strategy": "string"
}
```

**Time & Operations Growth (`path_type: time_operations`):**
```json
{
  "time_audit_reality_check": { "stated_hours": "number", "estimated_actual_hours": "number", "gap_analysis": "string" },
  "time_recapture_plan": "string",
  "delegation_roadmap": "string",
  "systems_and_tools_plan": "string",
  "active_to_passive_transition": "string",
  "burnout_prevention": "string"
}
```

---

### export_history

Records each export event for freshness tracking.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | int (PK) | auto-increment | Internal only |
| public_id | string | unique, not null | CUID2 |
| tenant_id | int (FK) | not null, indexed | References tenants.id |
| user_id | int (FK) | not null, indexed | References users.id |
| export_type | enum | not null | Values: markdown, pdf |
| identity_version | int | not null | Identity version at export time |
| path_versions | jsonb | not null | {portfolio: 1, income_capital: 2, ...} — versions of included paths |
| paths_included | jsonb | not null | Array of path types that were included |
| consent_given | boolean | not null, default false | Whether export consent was confirmed |
| created_at | timestamp | not null, default now() | |

**Indexes:** tenant_id, (tenant_id, user_id), (tenant_id, user_id, export_type, created_at)

---

## Modified Tables (2)

### tenants (add column)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| feature_flags | jsonb | not null, default '{}' | Feature flag storage |

**feature_flags JSONB schema:**
```json
{
  "growth_strategy_enabled": false
}
```

### prompt_templates (extend enum)

Add new values to `PromptServiceType` enum:
- `growth_path_generation` — generates individual growth path content
- `cross_path_analysis` — generates cross-path links and next best action

---

## New Enums

### GrowthPathType
Values: `portfolio`, `income_capital`, `skills_knowledge`, `time_operations`

### GrowthPathStatus
Values: `locked`, `unlocked`, `generating`, `generated`

### GrowthStrategyStatus
Values: `active`, `superseded`

### UnlockType
Values: `organic`, `manual`, `system`

### ExportType
Values: `markdown`, `pdf`

---

## Encryption Strategy

Sensitive financial data within `growth_paths.content` JSONB (specifically in `income_capital` path type: funding amounts, income targets, capital milestones) follows the same field-level encryption pattern as `audits.responses`:
- Encrypted at repository layer before Prisma write
- Decrypted after Prisma read
- Same key versioning: `v{N}:{iv}:{authTag}:{ciphertext}`
- Same encryption keys (`AUDIT_ENCRYPTION_KEY_V*`)

---

## Row-Level Security

New tables (`growth_strategies`, `growth_paths`, `export_history`) follow the same RLS pattern as existing tables:
```sql
CREATE POLICY tenant_isolation ON {table}
  USING (tenant_id = current_setting('app.current_tenant_id')::int);
```

---

## Table Count

Total: 15 tables (12 existing + 3 new: growth_strategies, growth_paths, export_history)
