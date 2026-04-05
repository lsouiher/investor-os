# API Contracts: InvestorOS v1

**Version:** v1
**Base path:** /api/v1
**Auth:** JWT Bearer token (except registration, login, health check, and shared identity)
**Content-Type:** application/json
**Error format:** Consistent across all endpoints (constitution V)

---

## Health Check

### GET /api/v1/health
Platform health status. **No auth required.**

**Response (200):**
```json
{
  "data": {
    "status": "ok",
    "checks": {
      "db": true,
      "ai": true,
      "encryption": true
    }
  }
}
```

Status values: `ok` (all checks pass), `degraded` (some checks fail), `down` (critical checks fail).

---

## Common Patterns

### Error Response Shape
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": []
  }
}
```

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMITED`, `AI_SERVICE_ERROR`, `INTERNAL_ERROR`

### Success Response Shape
```json
{
  "data": { ... }
}
```

### Pagination (where applicable)
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 42,
    "total_pages": 3
  }
}
```

### Public IDs
All resource identifiers in requests and responses use CUID2 public IDs, never internal integer IDs.

---

## Auth Service

### POST /api/v1/auth/register
Create a new account (auto-creates tenant).

**Request:**
```json
{
  "email": "investor@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "data": {
    "user": {
      "id": "clx1abc...",
      "email": "investor@example.com",
      "role": "investor"
    },
    "token": "eyJhbG..."
  }
}
```

### POST /api/v1/auth/login
**Request:**
```json
{
  "email": "investor@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "data": {
    "user": {
      "id": "clx1abc...",
      "email": "investor@example.com",
      "role": "investor"
    },
    "token": "eyJhbG..."
  }
}
```

### POST /api/v1/auth/forgot-password
**Request:**
```json
{ "email": "investor@example.com" }
```
**Response (200):**
```json
{ "data": { "message": "If an account exists, a reset email has been sent." } }
```

### POST /api/v1/auth/reset-password
**Request:**
```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword"
}
```
**Response (200):**
```json
{ "data": { "message": "Password has been reset." } }
```

### GET /api/v1/auth/me
Get current user profile. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "id": "clx1abc...",
    "email": "investor@example.com",
    "role": "investor",
    "created_at": "2026-04-03T10:00:00Z"
  }
}
```

---

## Audit Service

### GET /api/v1/audits
List all audits for the current user (latest version per type). **Auth required.**

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx2abc...",
      "audit_type": "financial",
      "status": "completed",
      "version": 2,
      "sub_score": 68,
      "last_saved_at": "2026-04-03T10:30:00Z",
      "completed_at": "2026-04-03T10:30:00Z"
    },
    {
      "id": "clx3abc...",
      "audit_type": "time",
      "status": "in_progress",
      "version": 1,
      "sub_score": null,
      "last_saved_at": "2026-04-03T10:45:00Z",
      "completed_at": null
    }
  ]
}
```

### GET /api/v1/audits/:auditType
Get the current audit for a specific type (latest version). **Auth required.**

**Path params:** `auditType` — one of: financial, time, skills, risk, horizon

**Response (200):**
```json
{
  "data": {
    "id": "clx2abc...",
    "audit_type": "financial",
    "status": "in_progress",
    "version": 1,
    "responses": {
      "income": { "primary_income": "100000-150000", "income_stability": "w2" },
      "assets": { "liquid_cash": "50000-100000" }
    },
    "sub_score": null,
    "last_saved_at": "2026-04-03T10:30:00Z"
  }
}
```

### PUT /api/v1/audits/:auditType
Save audit progress (draft or complete). **Auth required.**

**Request:**
```json
{
  "responses": {
    "income": { "primary_income": "100000-150000", "income_stability": "w2", "income_trend": "growing" },
    "assets": { "liquid_cash": "50000-100000", "retirement_accounts": "100000-250000" }
  },
  "complete": false
}
```

When `complete: true`, the server validates all required fields are present, generates the sub-score, and transitions status to "completed." A new versioned row is created.

**Response (200):**
```json
{
  "data": {
    "id": "clx2abc...",
    "audit_type": "financial",
    "status": "in_progress",
    "version": 1,
    "sub_score": null,
    "last_saved_at": "2026-04-03T10:35:00Z"
  }
}
```

### GET /api/v1/audits/:auditType/history
Get all completed versions for an audit type. **Auth required.**

**Response (200):**
```json
{
  "data": [
    { "id": "clx2abc...", "version": 2, "sub_score": 72, "completed_at": "2026-04-10T..." },
    { "id": "clx2xyz...", "version": 1, "sub_score": 68, "completed_at": "2026-04-03T..." }
  ]
}
```

*Conversational audit endpoint deferred to post-MVP (CEO plan 2026-04-03). Form-only for all audits at launch.*

---

## Identity Service

### GET /api/v1/identity
Get the current (latest) identity version. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "id": "clx4abc...",
    "version": 3,
    "archetype": "Cash Flow Hunter",
    "readiness_score": 72,
    "sub_scores": { "financial": 68, "time": 75, "skills": 60, "risk": 80, "horizon": 78 },
    "radar_data": { "capital": 65, "time": 75, "skills": 60, "risk_tolerance": 80, "network": 42, "goal_clarity": 78 },
    "headline_insight": "You're a high-income professional with strong analytical skills...",
    "ai_insights": { "contradictions": [], "feasibility": {}, "gaps": [] },
    "generated_at": "2026-04-03T11:00:00Z"
  }
}
```

Returns `404` if no audits are completed yet.

### GET /api/v1/identity/history
Get all identity versions with score trends. **Auth required.**

**Response (200):**
```json
{
  "data": [
    { "id": "clx4abc...", "version": 3, "archetype": "Cash Flow Hunter", "readiness_score": 72, "generated_at": "..." },
    { "id": "clx4xyz...", "version": 2, "archetype": "Conservative Builder", "readiness_score": 58, "generated_at": "..." }
  ]
}
```

### POST /api/v1/identity/synthesize
Manually trigger identity re-synthesis. **Auth required.** Normally triggered automatically after audit completion.

**Response (200):**
```json
{
  "data": {
    "id": "clx4new...",
    "version": 4,
    "archetype": "...",
    "readiness_score": 75,
    "...": "..."
  }
}
```

**Response (503) — AI failure after retries:**
```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "We couldn't generate your identity right now. Please try again.",
    "details": []
  }
}
```

### GET /api/v1/identity/share
Get a shareable link for the current identity. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "share_url": "/identity/clx4abc...?sig=hmac_signature_here"
  }
}
```

### GET /identity/:publicId (public route, not under /api/v1)
View a shared identity card. **No auth required.** Requires valid HMAC signature.

**Query params:** `sig` (HMAC-SHA256 signature, required)

**Response (200):** HTML page showing archetype, readiness score, and radar chart. No sensitive data.
**Response (404):** Invalid or missing signature.

### PUT /api/v1/identity/:identityId/rate
Submit post-synthesis feedback rating. **Auth required.**

**Request:**
```json
{ "rating": 4 }
```

**Response (200):**
```json
{ "data": { "id": "clx4abc...", "user_rating": 4 } }
```

---

## Strategy Service

### GET /api/v1/strategies
Get strategy recommendations for the current identity. **Auth required.**

**Response (200):**
```json
{
  "data": [
    {
      "id": "clx5abc...",
      "name": "BRRRR in Midwest Markets",
      "description": "Buy, Rehab, Rent, Refinance, Repeat...",
      "fit_score": 85,
      "pros": ["High cash-on-cash return potential", "Matches your analytical skills"],
      "cons": ["Requires contractor network you don't have yet"],
      "rank": 1,
      "is_active": true,
      "action_plan": { "id": "clx6abc...", "item_count": 12, "completed_count": 3 },
      "roadmap": { "id": "clx7abc...", "milestone_count": 8, "completed_count": 1 },
      "micro_plan": { "id": "clx8abc...", "task_count": 5, "completed_count": 2, "expires_at": "..." }
    }
  ]
}
```

### PUT /api/v1/strategies/:strategyId/activate
Set a strategy as the user's active strategy. **Auth required.**

**Response (200):**
```json
{ "data": { "id": "clx5abc...", "is_active": true } }
```

### GET /api/v1/strategies/:strategyId/action-plan
**Response (200):**
```json
{
  "data": {
    "id": "clx6abc...",
    "items": [
      { "id": "clx6i1...", "title": "Research lenders in target market", "sort_order": 1, "is_completed": false },
      { "id": "clx6i2...", "title": "Connect with 3 agents in target area", "sort_order": 2, "is_completed": true, "completed_at": "..." }
    ]
  }
}
```

### PUT /api/v1/action-items/:itemId
Update an action item (mark complete/incomplete). **Auth required.**

**Request:**
```json
{ "is_completed": true }
```

### GET /api/v1/strategies/:strategyId/roadmap
### GET /api/v1/strategies/:strategyId/micro-plan
Similar structure to action plan.

### PUT /api/v1/milestones/:milestoneId
### PUT /api/v1/micro-tasks/:taskId
Update completion status.

---

## Simulation Service

### POST /api/v1/simulations
Run a "What If" simulation. **Auth required.** Max 3 per 24-hour rolling window.

**Request:**
```json
{
  "modified_parameters": {
    "financial.liquid_cash": "100000-250000",
    "time.hours_available": 15
  }
}
```

**Response (200):**
```json
{
  "data": {
    "id": "clx9abc...",
    "base_identity": { "archetype": "Conservative Builder", "readiness_score": 58 },
    "simulated_identity": { "archetype": "Cash Flow Hunter", "readiness_score": 72 },
    "delta": {
      "readiness_score": "+14",
      "archetype_changed": true,
      "sub_score_changes": { "financial": "+18", "time": "+5" },
      "strategy_changes": "2 of 3 strategies would change"
    },
    "simulations_remaining": 2
  }
}
```

**Response (429) — limit reached:**
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "You've used all 3 simulations in the last 24 hours. Try again later.",
    "details": []
  }
}
```

---

## Contact Service

### GET /api/v1/contacts
List all contacts. **Auth required.**

**Query params:** `role_type` (filter), `page`, `per_page`

### POST /api/v1/contacts
Add a contact. **Auth required.**

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-0100",
  "role_type": "agent",
  "notes": "Specializes in multifamily in Dallas"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "clxAabc...",
    "name": "Jane Smith",
    "role_type": "agent",
    "network_gap_filled": "agent",
    "network_score_impact": { "before": 42, "after": 58 }
  }
}
```

### PUT /api/v1/contacts/:contactId
Update a contact. **Auth required.**

### DELETE /api/v1/contacts/:contactId
Soft-delete a contact. **Auth required.**

### GET /api/v1/contacts/network-score
Get current network completeness score and gaps. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "score": 58,
    "filled_roles": ["agent", "cpa"],
    "missing_roles": ["lender", "contractor", "attorney"],
    "alerts": [
      { "role": "contractor", "message": "Your active strategy requires a contractor relationship." }
    ]
  }
}
```

---

## Task Service

### GET /api/v1/tasks
List tasks ordered by identity impact. **Auth required.**

**Query params:** `is_completed` (filter), `source` (filter), `page`, `per_page`

### POST /api/v1/tasks
Create a manual task. **Auth required.**

**Request:**
```json
{
  "title": "Call agent about property on Elm St",
  "description": "Follow up on the listing she sent",
  "due_date": "2026-04-10"
}
```

### PUT /api/v1/tasks/:taskId
Update a task (mark complete, edit details). **Auth required.**

### DELETE /api/v1/tasks/:taskId
Soft-delete a manual task. **Auth required.** AI-generated tasks cannot be deleted.

---

## Blueprint Service

### POST /api/v1/blueprint/generate
Generate Investment Blueprint PDF. **Auth required.** Requires all 5 audits completed.

**Response (200):** Binary PDF file with `Content-Type: application/pdf`

**Response (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "All 5 audits must be completed to generate a blueprint.",
    "details": [{ "missing_audits": ["skills", "horizon"] }]
  }
}
```

---

## Dashboard Service

### GET /api/v1/dashboard
Aggregated dashboard data. **Auth required.**

**Response (200):**
```json
{
  "data": {
    "identity_snapshot": {
      "archetype": "Cash Flow Hunter",
      "readiness_score": 72,
      "radar_data": { "...": "..." },
      "score_trend_90d": [58, 62, 68, 72]
    },
    "active_strategy": {
      "id": "clx5abc...",
      "name": "BRRRR in Midwest Markets",
      "progress_percentage": 25
    },
    "priority_tasks": [
      { "id": "...", "title": "...", "identity_impact_score": 92, "estimated_minutes": 30 }
    ],
    "intelligence_feed": [
      { "type": "progress", "message": "You've completed 3 of 12 action plan items.", "created_at": "..." },
      { "type": "network_alert", "message": "You haven't spoken to your agent in 45 days.", "created_at": "..." }
    ],
    "audit_completion": {
      "completed": 5,
      "total": 5,
      "audits": { "financial": "completed", "time": "completed", "skills": "completed", "risk": "completed", "horizon": "completed" }
    }
  }
}
```

---

## Admin: Prompt Template Management

All admin endpoints require **Auth required + admin role.**

### GET /api/v1/admin/prompt-templates
List all prompt templates. **Admin only.**

**Query params:** `service_type` (filter)

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "service_type": "identity_synthesis",
      "version": 3,
      "is_active": true,
      "created_at": "2026-04-03T10:00:00Z",
      "updated_at": "2026-04-03T10:00:00Z"
    }
  ]
}
```

### GET /api/v1/admin/prompt-templates/:id
Get a single template with full content. **Admin only.**

**Response (200):**
```json
{
  "data": {
    "id": 1,
    "service_type": "identity_synthesis",
    "version": 3,
    "template_content": "You are an expert real estate investment advisor...",
    "output_schema": { "type": "object", "properties": {} },
    "is_active": true
  }
}
```

### POST /api/v1/admin/prompt-templates
Create a new template version. **Admin only.** Auto-increments version for the service_type.

**Request:**
```json
{
  "service_type": "identity_synthesis",
  "template_content": "Updated prompt template content...",
  "output_schema": { "type": "object", "properties": {} }
}
```

**Response (201):** New template (is_active defaults to false).

### PUT /api/v1/admin/prompt-templates/:id/activate
Set a template as the active version for its service_type (deactivates previous). **Admin only.**

**Response (200):**
```json
{ "data": { "id": 1, "service_type": "identity_synthesis", "version": 3, "is_active": true } }
```

---

## Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Auth (login, register) | 10 requests | 15 minutes |
| Auth (forgot-password) | 3 requests | 15 minutes |
| Audit conversational | 60 requests | 1 minute |
| Identity synthesis | 5 requests | 5 minutes |
| Strategy generation | 3 requests | 5 minutes |
| Simulation | 3 per user | 24-hour rolling window |
| Blueprint generation | 5 requests | 1 hour |
| All other endpoints | 100 requests | 1 minute |
