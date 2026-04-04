# API Contracts: Growth Strategy Engine

**Version:** v1 (additive to existing API)
**Base path:** /api/v1
**Auth:** JWT Bearer token (all endpoints require auth unless noted)
**Content-Type:** application/json
**Error/Success format:** Same as V1 (see api-v1.md Common Patterns)

---

## Growth Strategy Service

### GET /api/v1/growth-strategy

Get the current (active) growth strategy with all paths. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "id": "clxGS01...",
    "status": "active",
    "overall_progress": 35,
    "identity_version": {
      "id": "clx4abc...",
      "version": 3,
      "archetype": "Cash Flow Hunter",
      "readiness_score": 72
    },
    "paths": [
      {
        "id": "clxGP01...",
        "path_type": "portfolio",
        "status": "generated",
        "version": 1,
        "progress": 45,
        "summary": "BRRRR-focused portfolio scaling from 0 to 10 units over 5 years...",
        "unlocked_at": "2026-04-04T10:00:00Z",
        "unlock_type": "system",
        "generated_at": "2026-04-04T10:00:30Z",
        "action_item_count": 8,
        "completed_action_items": 3
      },
      {
        "id": "clxGP02...",
        "path_type": "income_capital",
        "status": "locked",
        "version": 1,
        "progress": 0,
        "summary": null,
        "unlocked_at": null,
        "unlock_type": null,
        "generated_at": null,
        "action_item_count": 0,
        "completed_action_items": 0,
        "unlock_criteria": "Complete 2+ micro-plan tasks from Portfolio Growth",
        "unlock_progress": "1 of 2 tasks completed"
      }
    ],
    "cross_path_insights": [],
    "next_best_action": null,
    "export_staleness": {
      "is_stale": false,
      "last_export_at": null,
      "changed_since_export": []
    },
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**Response (404):** No growth strategy exists (user hasn't completed identity).

---

### POST /api/v1/growth-strategy

Create a growth strategy. Called automatically after identity synthesis. **Auth required.**

Preconditions: User has a completed identity (all 5 audits + synthesis). Feature flag `growth_strategy_enabled` is on.

**Response (201):**
```json
{
  "data": {
    "id": "clxGS01...",
    "status": "active",
    "overall_progress": 0,
    "paths": [
      {
        "id": "clxGP01...",
        "path_type": "portfolio",
        "status": "generating",
        "version": 1
      },
      { "path_type": "income_capital", "status": "locked" },
      { "path_type": "skills_knowledge", "status": "locked" },
      { "path_type": "time_operations", "status": "locked" }
    ],
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

Portfolio Growth auto-triggers generation. Other paths start locked.

**Response (409):** Active growth strategy already exists.

---

## Growth Path Service

### GET /api/v1/growth-strategy/paths/:pathType

Get full detail for a specific growth path. **Auth required.**

**Path params:** `pathType` — one of: portfolio, income_capital, skills_knowledge, time_operations

**Response (200) — generated path:**
```json
{
  "data": {
    "id": "clxGP01...",
    "path_type": "portfolio",
    "status": "generated",
    "version": 1,
    "progress": 45,
    "summary": "BRRRR-focused portfolio scaling...",
    "content": {
      "scaling_plan": {
        "year_1_vision": "Acquire first rental property using BRRRR...",
        "year_3_vision": "Scale to 3-5 units...",
        "year_5_vision": "10 units with $8,000/mo cash flow...",
        "year_10_vision": "20+ units, transition to passive management..."
      },
      "reinvestment_strategy": "...",
      "diversification_plan": "...",
      "exit_framework": "...",
      "financing_evolution": "...",
      "tool_placeholders": [
        {
          "tool_name": "Deal Calculator",
          "stage": "Phase 1: First Acquisition",
          "message": "At this stage of your growth, a deal calculator will be available here soon."
        }
      ]
    },
    "action_items": [
      {
        "id": "clxAI01...",
        "title": "Research BRRRR-friendly markets within 2-hour drive",
        "description": "...",
        "timeframe": "1-2 weeks",
        "category": "research",
        "identity_impact": "Expands your market knowledge score",
        "priority_score": 92,
        "is_completed": false,
        "completed_at": null
      }
    ],
    "strategy": {
      "id": "clx5abc...",
      "name": "BRRRR in Midwest Markets",
      "fit_score": 85,
      "action_plan": { "item_count": 12, "completed_count": 3 },
      "roadmap": { "milestone_count": 8, "completed_count": 1 },
      "micro_plan": { "task_count": 5, "completed_count": 2, "expires_at": "..." }
    },
    "unlock_type": "system",
    "unlocked_at": "2026-04-04T10:00:00Z",
    "generated_at": "2026-04-04T10:00:30Z",
    "generation_cooldown_until": "2026-04-04T11:00:30Z"
  }
}
```

**Response (200) — locked path:**
```json
{
  "data": {
    "id": "clxGP02...",
    "path_type": "income_capital",
    "status": "locked",
    "version": 1,
    "progress": 0,
    "summary": null,
    "content": {},
    "action_items": [],
    "unlock_criteria": "Complete 2+ micro-plan tasks from Portfolio Growth",
    "unlock_progress": "1 of 2 tasks completed"
  }
}
```

---

### POST /api/v1/growth-strategy/paths/:pathType/generate

Generate (or regenerate) a growth path. **Auth required.**

For locked paths, this is the "Manual Early Unlock" flow (FR-05).
For generated paths, this is regeneration (FR-17).

Rate limited: 1 generation per path per hour.

**Request (manual unlock — optional confirmation):**
```json
{
  "confirm_early_unlock": true
}
```

**Response (202) — generation initiated:**
```json
{
  "data": {
    "id": "clxGP02...",
    "path_type": "income_capital",
    "status": "generating",
    "message": "Path generation started. Check status via GET /api/v1/growth-strategy/paths/income_capital"
  }
}
```

**Response (400) — locked path without confirmation:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "This path is most valuable after completing 2+ micro-plan tasks. Set confirm_early_unlock to true to generate now.",
    "details": [{ "unlock_criteria": "Complete 2+ micro-plan tasks from Portfolio Growth" }]
  }
}
```

**Response (429) — rate limited:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "This path was recently generated. Try again after 11:00 AM.",
    "details": [{ "cooldown_until": "2026-04-04T11:00:30Z" }]
  }
}
```

---

### GET /api/v1/growth-strategy/paths/:pathType/status

Lightweight status check for polling during generation. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "path_type": "income_capital",
    "status": "generating",
    "started_at": "2026-04-04T10:05:00Z"
  }
}
```

---

### PUT /api/v1/growth-strategy/paths/:pathType/action-items/:itemId

Update an action item (mark complete/incomplete). **Auth required.**

**Request:**
```json
{ "is_completed": true }
```

**Response (200):**
```json
{
  "data": {
    "id": "clxAI01...",
    "is_completed": true,
    "completed_at": "2026-04-04T12:00:00Z",
    "path_progress": 50,
    "overall_progress": 40,
    "unlocks_triggered": [
      {
        "path_type": "income_capital",
        "unlock_type": "organic",
        "message": "You've unlocked Income & Capital Growth!"
      }
    ]
  }
}
```

The response includes any unlock events triggered by this completion.

---

## Cross-Path Intelligence

### GET /api/v1/growth-strategy/cross-path-insights

Get cross-path links and unified action priority. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "links": [
      {
        "id": "clxCPL01...",
        "type": "prerequisite",
        "source_path_type": "income_capital",
        "source_description": "Complete HELOC application",
        "target_path_type": "portfolio",
        "target_description": "Phase 2 acquisition funding",
        "description": "Your HELOC approval unlocks the funding for your second property acquisition.",
        "resolution": null
      },
      {
        "id": "clxCPL02...",
        "type": "conflict",
        "source_path_type": "income_capital",
        "source_description": "Take on freelance consulting for capital",
        "target_path_type": "time_operations",
        "target_description": "Reduce work hours to prevent burnout",
        "description": "Freelancing for capital conflicts with your time recapture goals.",
        "resolution": "Limit freelancing to 3 months. The additional $15K accelerates your first down payment without creating a permanent time drain."
      }
    ],
    "priority_actions": [
      {
        "action_item_id": "clxAI01...",
        "path_type": "income_capital",
        "title": "Apply for HELOC",
        "priority_score": 95,
        "reason": "Prerequisite for Portfolio Phase 2",
        "cross_path_impact": ["Unblocks portfolio scaling", "Establishes credit relationship"]
      }
    ],
    "next_best_action": {
      "action_item_id": "clxAI01...",
      "path_type": "income_capital",
      "title": "Apply for HELOC",
      "reason": "This single action unblocks progress in 2 other growth paths.",
      "cross_path_impact": ["portfolio", "income_capital"]
    }
  }
}
```

---

## Export Service

### POST /api/v1/growth-strategy/export/markdown

Generate and download AI-readable markdown export as zip. **Auth required.**

First-time exports require consent confirmation.

**Request (first export):**
```json
{
  "consent_confirmed": true
}
```

**Response (200):** Binary zip file with `Content-Type: application/zip`, `Content-Disposition: attachment; filename="investoros-identity-export.zip"`

Zip contents:
```
investor-identity.md          (AI entry point with YAML frontmatter)
identity-detail.md            (full identity data)
growth-strategy-overview.md   (strategy overview)
paths/portfolio-growth.md     (if unlocked)
paths/income-capital-growth.md (if unlocked)
paths/skills-knowledge-growth.md (if unlocked)
paths/time-operations-growth.md (if unlocked)
action-plan.md                (combined priority-ordered actions)
```

**Response (400) — first export without consent:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "This export contains sensitive financial information. Set consent_confirmed to true to proceed.",
    "details": []
  }
}
```

**Response (400) — no identity:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Complete your investor identity before exporting.",
    "details": []
  }
}
```

---

### GET /api/v1/growth-strategy/export/status

Check export freshness. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "has_exported": true,
    "last_export_at": "2026-04-03T15:00:00Z",
    "last_export_type": "markdown",
    "is_stale": true,
    "changed_since_export": [
      "Identity updated (v3 → v4)",
      "Skills & Knowledge path regenerated (v1 → v2)"
    ]
  }
}
```

---

## Updated Blueprint Service

### POST /api/v1/blueprint/generate

**Updated behavior when feature flag is on:**

Generates expanded Blueprint PDF including Growth Strategy sections. **Auth required.**

**Response (200):** Binary PDF with expanded sections:
- Cover page
- Investor DNA Profile (radar chart, archetype)
- Growth Strategy overview (4 paths, progress, highlights)
- Detailed sections for each unlocked path
- Placeholder pages for locked paths with unlock progress
- 72-hour quick start
- Combined action plan (all paths, priority-ordered)
- Assumptions & disclaimers

When feature flag is off, behaves identically to V1.

---

## Dashboard Service (Updated)

### GET /api/v1/dashboard

**Updated response when feature flag is on:**

Adds `growth_strategy` field to existing dashboard response.

```json
{
  "data": {
    "identity_snapshot": { "...": "existing V1 fields" },
    "active_strategy": { "...": "existing V1 fields" },
    "priority_tasks": [ "...existing V1 fields" ],
    "intelligence_feed": [ "...existing V1 fields" ],
    "audit_completion": { "...": "existing V1 fields" },
    "growth_strategy": {
      "id": "clxGS01...",
      "overall_progress": 35,
      "paths": [
        { "path_type": "portfolio", "status": "generated", "progress": 45, "summary": "..." },
        { "path_type": "income_capital", "status": "locked", "unlock_progress": "1 of 2" },
        { "path_type": "skills_knowledge", "status": "locked", "unlock_progress": "..." },
        { "path_type": "time_operations", "status": "locked", "unlock_progress": "..." }
      ],
      "next_best_action": { "...": "..." },
      "export_is_stale": false,
      "unlocks_available": []
    }
  }
}
```

When feature flag is off, `growth_strategy` field is omitted.

---

## Admin Endpoints

### GET /api/v1/admin/growth-strategy/stats

Growth Strategy adoption and engagement metrics. **Admin only.**

**Response (200):**
```json
{
  "data": {
    "total_strategies_created": 150,
    "path_unlock_rates": {
      "portfolio": { "total": 150, "organic": 150, "manual": 0 },
      "income_capital": { "total": 95, "organic": 72, "manual": 23 },
      "skills_knowledge": { "total": 48, "organic": 35, "manual": 13 },
      "time_operations": { "total": 30, "organic": 22, "manual": 8 }
    },
    "export_stats": {
      "markdown_exports": 45,
      "pdf_exports": 89,
      "repeat_exporters": 18
    },
    "regeneration_count": 32,
    "avg_action_items_completed_30d": 4.2
  }
}
```

---

## Rate Limiting (Additive)

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Growth path generation | 1 per path | 1 hour |
| Markdown export | 5 requests | 1 hour |
| Growth strategy endpoints (read) | 100 requests | 1 minute |
| Path status polling | 60 requests | 1 minute |
