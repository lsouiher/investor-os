# Growth Strategy Engine
## InvestorOS — Complete Feature Specification & Implementation Guide

**Version:** 1.0
**Date:** April 2026
**Status:** Draft for Review
**Depends On:** V3 Identity Platform (built), Five Audits, Identity Synthesis
**Replaces:** Strategy Generation Service (wraps it, does not delete it)

---

## Table of Contents

1. [Concept](#1-concept)
2. [The Four Growth Paths](#2-the-four-growth-paths)
3. [Progressive Unlocking System](#3-progressive-unlocking-system)
4. [Cross-Path Dependencies](#4-cross-path-dependencies)
5. [Growth Strategy Dashboard (UX)](#5-growth-strategy-dashboard-ux)
6. [AI Prompt Architecture](#6-ai-prompt-architecture)
7. [Identity & Strategy Export System](#7-identity--strategy-export-system)
8. [Investment Blueprint PDF (Updated)](#8-investment-blueprint-pdf-updated)
9. [Pre-Migration Audit](#9-pre-migration-audit)
10. [Database Migrations](#10-database-migrations)
11. [Backend Service Changes](#11-backend-service-changes)
12. [API Specification](#12-api-specification)
13. [Frontend Changes](#13-frontend-changes)
14. [Data Migration for Existing Users](#14-data-migration-for-existing-users)
15. [Feature Flag & Rollout Plan](#15-feature-flag--rollout-plan)
16. [Testing Plan](#16-testing-plan)
17. [Success Metrics](#17-success-metrics)
18. [Build Sequence](#18-build-sequence)
19. [Future Considerations](#19-future-considerations)

---

## 1. Concept

### What Is Changing

The current platform generates an **Investing Strategy** — a set of real estate acquisition strategies (BRRRR, house hacking, turnkey, etc.) with an action plan and roadmap. This answers: *"What should I invest in?"*

The Growth Strategy replaces this as the **top-level AI output**. It answers a fundamentally bigger question: ***"How should I grow as an investor — across every dimension of my life that affects my investing success?"***

The Investing Strategy doesn't disappear. It becomes a built-in component of the **Portfolio Growth** path — one of four growth paths that together form the complete Growth Strategy.

### Why This Matters

Real estate investing success is never just about picking the right strategy. It's about:
- Growing your capital base so you can do bigger and more deals
- Building skills so you can execute strategies you couldn't before
- Optimizing your time so investing doesn't consume your life
- Scaling a portfolio, not just acquiring a single property

A user who follows only an investing strategy will buy one property. A user who follows a Growth Strategy will build a portfolio, increase their income, sharpen their skills, and reclaim their time — compounding advantages across every dimension.

### Architectural Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                     GROWTH STRATEGY                          │
│                  (New Top-Level Output)                       │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │   PORTFOLIO      │  │  INCOME &        │                  │
│  │   GROWTH         │  │  CAPITAL GROWTH  │                  │
│  │                  │  │                  │                   │
│  │  ┌────────────┐  │  │  Earning power   │                  │
│  │  │ Investing  │  │  │  Capital accel.  │                  │
│  │  │ Strategy   │  │  │  Funding paths   │                  │
│  │  │ (existing) │  │  │  Career pivot    │                  │
│  │  └────────────┘  │  │  planning        │                  │
│  │  ┌────────────┐  │  └─────────────────┘                   │
│  │  │ Future:    │  │                                        │
│  │  │ Calculators│  │  ┌─────────────────┐                   │
│  │  │ Market AI  │  │  │  SKILLS &        │                  │
│  │  │ Deal tools │  │  │  KNOWLEDGE       │                  │
│  │  └────────────┘  │  │  GROWTH          │                  │
│  │  Portfolio scale  │  │                  │                  │
│  │  plan & targets   │  │  Learning plan   │                  │
│  └─────────────────┘  │  Network building  │                  │
│                        │  Certifications    │                  │
│  ┌─────────────────┐  │  Mentorship        │                  │
│  │  TIME &          │  └─────────────────┘                   │
│  │  OPERATIONS      │                                        │
│  │  GROWTH          │                                        │
│  │                  │                                        │
│  │  Time recapture  │                                        │
│  │  Delegation plan │                                        │
│  │  Systems/tools   │                                        │
│  │  Active→Passive  │                                        │
│  │  transition      │                                        │
│  └─────────────────┘                                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  EXPORT LAYER                                         │   │
│  │  Blueprint PDF │ AI-Ready Markdown │ Identity File    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Relationship to existing strategy | Wrapper — Growth Strategy is the new top-level output, existing investing strategy is nested inside Portfolio Growth | Preserves all V3 work; repositions it within a larger framework |
| Path generation model | Progressive — Portfolio Growth first, others unlock as user engages | Reduces overwhelm, drives engagement, manages AI costs, improves later path quality |
| Implementation approach | Build on top of V3, not from scratch | V3 identity engine, audits, auth, tenancy, logging, contacts all stay. Only one existing table is modified. |
| Export approach | Merge markdown export into this feature; defer sync infrastructure | Export is a rendering concern (small). Sync is a platform capability (large). |

---

## 2. The Four Growth Paths

Each path is a self-contained growth plan derived from the user's Investor Identity. Each has its own AI generation, roadmap, milestones, and action items. The AI is aware of all paths and creates cross-path dependencies where they exist.

---

### Path 1: Portfolio Growth (Unlocked First)

**Generates immediately after identity completion. This is the entry point.**

#### What It Covers

**A) Investing Strategy (Existing V3 Output — Now Nested Here)**
Everything the current strategy service produces lives inside this path:
- 1–3 recommended RE acquisition strategies ranked by identity fit
- Fit scores, pros/cons, capital requirements, risk level per strategy
- Strategy-specific action plan
- 72-hour micro-plan

This output is unchanged from V3. It is now labeled and positioned as the "acquisition strategy" component of Portfolio Growth.

**B) Portfolio Scaling Plan (New)**
Beyond the first deal, how does the portfolio grow over time?

| Element | Description | Derived From |
|---|---|---|
| Portfolio vision | Target portfolio composition at Year 1, 3, 5, 10 | Horizon Audit goals + Financial Audit capacity |
| Scaling sequence | Which deal types to pursue first, second, third as capital and experience grow | Skills Audit + Risk Profile progression |
| Reinvestment strategy | Cash flow reinvestment vs. distribution plan at each stage | Horizon Audit income vs. growth preference |
| Diversification plan | When and how to diversify across markets, property types, or strategies | Risk Profile + Financial Audit |
| Exit strategy framework | Hold durations, 1031 exchange triggers, liquidation scenarios | Horizon Audit exit preferences |
| Financing evolution | How the user's financing approach should evolve as portfolio grows (e.g., start conventional → move to DSCR → eventually commercial) | Financial Audit trajectory + Skills growth |

**C) Tool Integration Points (Future — Defined Now)**
The Portfolio Growth path defines clear integration slots where future features will attach:

| Future Tool | How It Connects to Portfolio Growth |
|---|---|
| Deal Calculator | Scores individual deals against the portfolio scaling plan |
| AI Market Research | Identifies markets that match the portfolio vision criteria |
| Deal Sourcing / Marketing | Generates deal flow for the next step in the scaling sequence |
| Funding Channel Finder | Matches the user's current financing evolution stage to available capital sources |

These tools don't exist yet. But the Portfolio Growth output references them as placeholders: "At this stage of your growth, you'll want to analyze deals in [target market] — a deal analysis tool will be available here soon." This creates anticipation and a natural feature discovery path.

#### Output Schema

```json
{
  "path": "portfolio_growth",
  "status": "generated",
  "generated_at": "timestamp",
  "identity_version_id": "string",

  "investing_strategy": {
    "strategies": [
      {
        "name": "string",
        "fit_score": "number (1-100)",
        "summary": "string",
        "pros": ["string"],
        "cons": ["string"],
        "capital_required": "string",
        "expected_timeline": "string",
        "risk_level": "string"
      }
    ],
    "action_plan": [
      {
        "step_number": "number",
        "title": "string",
        "description": "string",
        "timeframe": "string",
        "category": "string (financing | market_research | networking | acquisition | management)"
      }
    ],
    "roadmap": [
      {
        "milestone": "string",
        "target_date": "string (relative)",
        "description": "string",
        "dependencies": ["step_numbers"]
      }
    ],
    "micro_plan": [
      {
        "day": "number",
        "task": "string",
        "context": "string",
        "time_estimate_minutes": "number"
      }
    ]
  },

  "portfolio_scaling_plan": {
    "vision": {
      "year_1": {
        "target_units": "number",
        "target_property_types": ["string"],
        "estimated_portfolio_value": "string",
        "estimated_monthly_cash_flow": "string",
        "narrative": "string"
      },
      "year_3": { "...same structure" },
      "year_5": { "...same structure" },
      "year_10": { "...same structure" }
    },
    "scaling_sequence": [
      {
        "phase": "number",
        "phase_name": "string",
        "strategy": "string",
        "trigger": "string (what milestone signals readiness for this phase)",
        "estimated_timeline": "string",
        "capital_required": "string",
        "prerequisites": ["string"],
        "narrative": "string"
      }
    ],
    "reinvestment_plan": {
      "strategy": "string",
      "rationale": "string",
      "cash_flow_allocation": {
        "reinvest_percentage": "number",
        "distribute_percentage": "number",
        "reserve_percentage": "number"
      }
    },
    "diversification_plan": {
      "current_concentration_risk": "string",
      "diversification_triggers": ["string"],
      "recommended_diversification_moves": ["string"]
    },
    "exit_framework": {
      "default_hold_strategy": "string",
      "exit_triggers": ["string"],
      "tax_optimization_notes": ["string"]
    },
    "financing_evolution": [
      {
        "stage": "string",
        "financing_type": "string",
        "why_now": "string",
        "requirements": ["string"]
      }
    ]
  },

  "tool_integration_slots": [
    {
      "tool_name": "string",
      "relevance_context": "string",
      "available": false,
      "placeholder_message": "string"
    }
  ],

  "disclaimers": ["string"],
  "assumptions": ["string"]
}
```

---

### Path 2: Income & Capital Growth (Unlocks Second)

**Unlock trigger:** User completes at least 2 action items from the Portfolio Growth micro-plan OR explicitly requests this path.

#### Why It Unlocks Second
Portfolio Growth tells the user what to invest in and how the portfolio scales. But most users' #1 constraint is capital. Income & Capital Growth directly attacks that constraint. Once a user has started executing their portfolio plan (even small steps), they're primed to think about "how do I get more capital to do this faster?"

#### What It Covers

| Element | Description | Derived From |
|---|---|---|
| **Capital acceleration plan** | Specific tactics to grow investable capital faster: aggressive saving targets, asset reallocation, equity harvesting | Financial Audit (income, assets, liabilities) |
| **Income growth roadmap** | How to increase earning power over 1–3 years: raise/promotion positioning, side income streams, freelancing skills that complement RE | Skills Audit (professional background) + Time Audit (availability) |
| **Funding channel map** | All realistic capital sources ranked by accessibility: conventional loans, DSCR, hard money, private money, seller financing, partnerships, self-directed IRA, HELOCs | Financial Audit (credit, income, assets) + Risk Profile |
| **Professional transition plan** | For users who indicated interest in full-time RE: a staged transition plan from current career to full-time investor/operator | Horizon Audit (full-time interest flag) + Financial Audit (runway) |
| **Capital milestone targets** | Specific dollar targets tied to portfolio scaling phases: "To enter Phase 2, you need $X. Here are 3 ways to get there by [date]." | Cross-reference with Portfolio Growth scaling sequence |

#### Unique AI Behavior
The AI should identify non-obvious capital sources specific to the user's profile:
- "Your 401(k) balance suggests you could roll into a self-directed IRA and invest directly in RE."
- "Your equity in your primary residence could support a $80K HELOC — enough for a down payment without touching savings."
- "Your graphic design side income could scale to $2K/month with 5 additional hours/week. In 12 months, that's $24K in additional investment capital."

The insights should feel like a financial advisor noticing things the user missed — not generic "save more money" advice.

#### Output Schema

```json
{
  "path": "income_capital_growth",
  "status": "generated | locked",
  "unlock_trigger": "string",
  "generated_at": "timestamp",
  "identity_version_id": "string",

  "capital_acceleration": {
    "current_monthly_investable_surplus": "string",
    "target_monthly_investable_surplus": "string",
    "tactics": [
      {
        "tactic": "string",
        "estimated_monthly_impact": "string",
        "effort_level": "low | medium | high",
        "timeline_to_impact": "string",
        "narrative": "string"
      }
    ]
  },

  "income_growth_roadmap": {
    "current_income_assessment": "string",
    "growth_opportunities": [
      {
        "opportunity": "string",
        "income_impact": "string",
        "time_investment": "string",
        "alignment_with_re_goals": "string",
        "action_steps": ["string"]
      }
    ]
  },

  "funding_channels": [
    {
      "channel": "string",
      "accessibility_score": "number (1-100)",
      "estimated_capital_available": "string",
      "requirements": ["string"],
      "pros": ["string"],
      "cons": ["string"],
      "best_for_phase": "string",
      "action_to_access": "string"
    }
  ],

  "professional_transition": {
    "applicable": "boolean",
    "current_stage": "string",
    "transition_stages": [
      {
        "stage": "string",
        "trigger": "string",
        "financial_requirements": "string",
        "risk_mitigation": "string",
        "timeline": "string"
      }
    ]
  },

  "capital_milestones": [
    {
      "milestone": "string",
      "target_amount": "string",
      "target_date": "string",
      "linked_portfolio_phase": "string",
      "paths_to_reach": ["string"]
    }
  ],

  "action_items": [
    {
      "step_number": "number",
      "title": "string",
      "description": "string",
      "timeframe": "string",
      "category": "string (saving | earning | funding | transition)",
      "identity_impact": "string"
    }
  ]
}
```

---

### Path 3: Skills & Knowledge Growth (Unlocks Third)

**Unlock trigger:** User has generated Portfolio Growth AND Income & Capital Growth paths, AND has completed at least 1 action item from either path. OR user explicitly requests this path.

#### Why It Unlocks Third
By this point, the user has a portfolio plan and a capital plan. They're starting to encounter their own skill gaps in real terms: "I don't know how to analyze a deal," "I've never talked to a lender," "I don't understand rehab budgets." The Skills path meets them at their point of need.

#### What It Covers

| Element | Description | Derived From |
|---|---|---|
| **Skill gap analysis** | Ranked list of skills needed but missing, specific to active strategy and current portfolio phase | Skills Audit gaps × Portfolio Growth requirements |
| **Learning roadmap** | Sequenced learning plan tied to next action items, not a generic reading list | Skill gaps × Action plan sequence |
| **Resource recommendations** | Specific books, courses, YouTube channels, podcasts, communities matched to learning style and available time | Time Audit (hours) + Skills Audit (knowledge) |
| **Network building plan** | Steps to fill network gaps: where to find agents, lenders, contractors, mentors in target markets | Skills Audit (network gaps) + Portfolio Growth (target markets) |
| **Certification roadmap** | RE license, PM certification, contractor licensing — with ROI analysis for user's specific path | Skills Audit (current certs) + Portfolio Growth (strategy requirements) |
| **Mentorship strategy** | How to find, approach, and build a mentorship relationship | Identity archetype + Network gaps |

#### Unique AI Behavior
The AI should connect skill development directly to portfolio milestones:
- "Your portfolio plan has you acquiring a value-add property in Phase 2. You rated your construction knowledge as 'beginner.' Before Phase 2, you need to reach 'intermediate' — here's a 6-week plan."
- "You're 3 months from your first deal. Your biggest skill gap is underwriting. Spend the next 4 weeks on [specific learning path]."
- "Your network has no lender. This is your highest-impact gap right now. Here's how to find one in [your market] this week."

Skills growth should never feel like homework. It should feel like **removing the specific obstacles between you and your next deal.**

#### Output Schema

```json
{
  "path": "skills_knowledge_growth",
  "status": "generated | locked",
  "unlock_trigger": "string",
  "generated_at": "timestamp",
  "identity_version_id": "string",

  "skill_gap_analysis": [
    {
      "skill": "string",
      "current_level": "string (none | beginner | intermediate | advanced)",
      "required_level": "string",
      "urgency": "high | medium | low",
      "linked_to": "string (which portfolio phase or action item needs this)",
      "impact_if_not_addressed": "string"
    }
  ],

  "learning_roadmap": [
    {
      "phase": "number",
      "skill_focus": "string",
      "duration": "string",
      "weekly_time_commitment": "string",
      "resources": [
        {
          "type": "string (book | course | video | podcast | community | practice)",
          "title": "string",
          "author_or_source": "string",
          "estimated_time": "string",
          "why_this_resource": "string",
          "free_or_paid": "string"
        }
      ],
      "milestone": "string (what you can do after this phase)",
      "verification": "string (how you know you've learned this)"
    }
  ],

  "network_building_plan": {
    "current_network_score": "number",
    "target_network_score": "number",
    "gaps": [
      {
        "role": "string (agent | lender | contractor | attorney | CPA | mentor | investor peer)",
        "priority": "high | medium | low",
        "why_you_need_this": "string",
        "where_to_find": ["string"],
        "how_to_approach": "string",
        "what_to_ask": ["string"],
        "timeline": "string"
      }
    ]
  },

  "certification_roadmap": {
    "applicable": "boolean",
    "recommendations": [
      {
        "certification": "string",
        "roi_analysis": "string",
        "time_investment": "string",
        "cost": "string",
        "relevance_to_strategy": "string"
      }
    ]
  },

  "mentorship_strategy": {
    "has_mentor": "boolean",
    "recommendation": "string",
    "how_to_find": ["string"],
    "what_to_offer_in_return": "string",
    "ideal_mentor_profile": "string"
  },

  "action_items": [
    {
      "step_number": "number",
      "title": "string",
      "description": "string",
      "timeframe": "string",
      "category": "string (learning | networking | certification | mentorship)",
      "identity_impact": "string"
    }
  ]
}
```

---

### Path 4: Time & Operations Growth (Unlocks Last)

**Unlock trigger:** User has at least 3 paths generated AND has been active on the platform for 14+ days. OR user explicitly requests this path.

#### Why It Unlocks Last
Time optimization is an advanced concern. A brand-new investor doesn't need an operations strategy — they need to get their first deal done. But once a user has a portfolio plan, is growing capital, and is building skills, the next bottleneck is almost always time. This path arrives exactly when the user starts feeling the squeeze.

#### What It Covers

| Element | Description | Derived From |
|---|---|---|
| **Time audit reality check** | Reconciliation of stated time availability vs actual platform engagement patterns | Time Audit stated hours × Platform activity data |
| **Time recapture plan** | Specific areas where the user can reclaim hours: delegation, automation, low-value activities to cut | Time Audit (current allocation breakdown) |
| **Delegation roadmap** | What to delegate, when, and to whom — mapped to portfolio growth phases | Time Audit (management preference) × Portfolio Growth (scaling phases) |
| **Systems & tools plan** | Software, workflows, and processes to implement at each portfolio stage | Portfolio Growth (current and projected portfolio size) |
| **Active-to-passive transition** | Staged plan for reducing hands-on involvement over time | Time Audit (passive preference) × Horizon Audit (long-term goals) |
| **Burnout prevention** | Warning signals, boundaries, and when to slow down | Time Audit (runway, sustainability) × Risk Profile (stress response) |

#### Unique AI Behavior
The AI should use platform behavioral data (not just audit data) to generate insights:
- "You told us you have 5 hours/week, but your task completion rate suggests closer to 12 hours. This pace may not be sustainable."
- "At 4 units, you'll spend ~8 hours/month on management. At 8 units, that jumps to 18 — that's when you should hire a property manager."
- "Your portfolio plan has you in Phase 2 in 12 months. At that point, deal sourcing alone will take 6 hours/week. Let's identify what to delegate before then."

#### Output Schema

```json
{
  "path": "time_operations_growth",
  "status": "generated | locked",
  "unlock_trigger": "string",
  "generated_at": "timestamp",
  "identity_version_id": "string",

  "time_reality_check": {
    "stated_weekly_hours": "number",
    "estimated_actual_hours": "number",
    "source_of_estimate": "string (platform activity | self-reported | derived)",
    "assessment": "string (on track | overcommitting | underutilizing)",
    "narrative": "string"
  },

  "time_recapture_plan": {
    "total_reclaimable_hours_per_week": "string",
    "opportunities": [
      {
        "activity": "string",
        "current_hours_per_week": "string",
        "reclaimable_hours": "string",
        "method": "string (delegate | automate | eliminate | reduce)",
        "implementation_effort": "low | medium | high",
        "narrative": "string"
      }
    ]
  },

  "delegation_roadmap": [
    {
      "portfolio_phase": "string",
      "trigger": "string",
      "what_to_delegate": "string",
      "delegate_to": "string (property manager | VA | contractor | partner)",
      "estimated_cost": "string",
      "time_saved": "string",
      "how_to_find": "string",
      "how_to_manage": "string"
    }
  ],

  "systems_and_tools": [
    {
      "portfolio_phase": "string",
      "tool_or_system": "string",
      "purpose": "string",
      "time_savings": "string",
      "cost": "string",
      "implementation_time": "string"
    }
  ],

  "active_to_passive_transition": {
    "current_position": "string (fully active | mostly active | hybrid | mostly passive | fully passive)",
    "target_position": "string",
    "stages": [
      {
        "stage": "string",
        "description": "string",
        "trigger": "string",
        "what_changes": "string",
        "estimated_timeline": "string"
      }
    ]
  },

  "burnout_prevention": {
    "current_risk_level": "low | moderate | high",
    "risk_factors": ["string"],
    "boundaries_to_set": ["string"],
    "warning_signals": ["string"],
    "recovery_recommendations": "string"
  },

  "action_items": [
    {
      "step_number": "number",
      "title": "string",
      "description": "string",
      "timeframe": "string",
      "category": "string (recapture | delegate | automate | transition | prevention)",
      "identity_impact": "string"
    }
  ]
}
```

---

## 3. Progressive Unlocking System

### Unlock Flow

```
Identity Complete
      │
      ▼
┌─────────────────────────────────┐
│  PATH 1: Portfolio Growth       │ ← Immediate
│  (includes Investing Strategy)  │
└──────────────┬──────────────────┘
               │
               │  Trigger: 2+ micro-plan tasks completed
               │  OR user explicitly requests
               ▼
┌─────────────────────────────────┐
│  PATH 2: Income & Capital       │ ← Earned
│  Growth                         │
└──────────────┬──────────────────┘
               │
               │  Trigger: Paths 1+2 generated AND
               │  1+ action item completed from either
               │  OR user explicitly requests
               ▼
┌─────────────────────────────────┐
│  PATH 3: Skills & Knowledge     │ ← Earned
│  Growth                         │
└──────────────┬──────────────────┘
               │
               │  Trigger: 3 paths generated AND
               │  14+ days active on platform
               │  OR user explicitly requests
               ▼
┌─────────────────────────────────┐
│  PATH 4: Time & Operations      │ ← Earned
│  Growth                         │
└─────────────────────────────────┘
```

### Design Rules

**Locked paths are visible but not accessible.** The user sees all four paths from day one. Locked paths show the path name, a one-sentence description, the unlock criteria with progress indicators, and a visual lock icon.

**"OR user explicitly requests" is the escape hatch.** Any user who taps "Generate Now" on a locked path can unlock it early. The system confirms: "This path is most valuable after [trigger context]. Generate now, or keep building toward it?" If confirmed, generate immediately.

**Unlocking creates a moment.** Organic unlocks are treated as achievements: a brief congratulatory screen, a notification, and a visible change on the Growth Strategy page.

### Why Progressive, Not All-At-Once

| Reason | Detail |
|---|---|
| **Reduces overwhelm** | Four full growth plans at once is paralyzing. One at a time creates focus. |
| **Drives engagement** | Locked content creates curiosity. Earned unlocks create dopamine. Act → unlock → explore → act. |
| **Improves AI quality** | Later paths reference engagement with earlier paths. Skills path is better when it knows which Portfolio Growth actions were completed. |
| **Manages AI costs** | Four separate LLM calls spread over days/weeks vs one massive call on day one. |
| **Creates retention** | "I'm one task away from unlocking Income & Capital Growth." |

---

## 4. Cross-Path Dependencies

The four paths are not isolated silos. The AI creates explicit connections between paths.

### Dependency Types

| Type | Example |
|---|---|
| **Prerequisite** | "Step 4 of your Income Growth plan (secure a HELOC) is a prerequisite for Phase 2 of your Portfolio Scaling plan." |
| **Enabling** | "Completing the networking module in Skills Growth will accelerate deal sourcing in Portfolio Growth." |
| **Constraint** | "Your Time plan indicates hiring a PM at 6 units. Portfolio plan projects 6 units at Month 18. Budget for PM costs starting Month 18." |
| **Conflict** | "Income Growth suggests freelance work for extra capital. Time plan flags burnout risk. Recommendation: freelance for 3 months max, then reallocate hours." |

### Cross-Path Data Model

```json
{
  "cross_path_links": [
    {
      "link_type": "prerequisite | enabling | constraint | conflict",
      "source_path": "string",
      "source_item": "string (action item or milestone ID)",
      "target_path": "string",
      "target_item": "string",
      "description": "string",
      "resolution": "string (for conflicts only)"
    }
  ]
}
```

Links are generated alongside each path. When Path 2 is generated, the AI receives full Path 1 output as context. Path 3 receives Paths 1 and 2. Path 4 receives all three. Later paths are inherently more integrated.

---

## 5. Growth Strategy Dashboard (UX)

### Growth Strategy Overview Page

Replaces the current strategy results page as the primary post-identity experience.

```
┌──────────────────────────────────────────────────┐
│  YOUR GROWTH STRATEGY                             │
│  [Identity Card: Archetype + Score + Radar]       │
│                                                    │
│  Overall Growth Progress: ████████░░░░ 62%        │
│                                                    │
├──────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ 📈 Portfolio Growth  │  │ 💰 Income &      │   │
│  │ ████████████░░ 78%   │  │    Capital Growth │   │
│  │                      │  │ ████░░░░░░░ 35%  │   │
│  │ Active strategy:     │  │                   │   │
│  │ BRRRR in Midwest     │  │ Next milestone:   │   │
│  │                      │  │ Secure HELOC      │   │
│  │ Next action:         │  │                   │   │
│  │ Call 2 lenders       │  │ 3 action items    │   │
│  │                      │  │ remaining         │   │
│  │ [View Path →]        │  │ [View Path →]     │   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                    │
│  ┌──────────────────────┐  ┌──────────────────┐   │
│  │ 🎓 Skills &          │  │ ⏱️ Time &        │   │
│  │    Knowledge Growth  │  │    Operations     │   │
│  │ ██░░░░░░░░░░ 15%    │  │                   │   │
│  │                      │  │ 🔒 LOCKED         │   │
│  │ Top gap:             │  │                   │   │
│  │ Deal underwriting    │  │ Unlocks after 14  │   │
│  │                      │  │ days of activity   │   │
│  │ Currently learning:  │  │                   │   │
│  │ Rental analysis      │  │ ████░░░░ 8 days   │   │
│  │                      │  │ remaining         │   │
│  │ [View Path →]        │  │                   │   │
│  └──────────────────────┘  └──────────────────┘   │
│                                                    │
├──────────────────────────────────────────────────┤
│  CROSS-PATH INSIGHTS                              │
│                                                    │
│  ⚡ "Completing your HELOC application (Income     │
│     Path) will unlock Phase 2 of your Portfolio    │
│     Plan. This is your highest-impact action."     │
│                                                    │
│  ⚠️ "Your time commitment is trending above your   │
│     stated 5 hrs/week. Consider updating your      │
│     Time Audit."                                   │
│                                                    │
│  🎯 "You're 1 task away from unlocking Time &      │
│     Operations Growth."                            │
│                                                    │
│  📥 [Export for AI] [Download Blueprint PDF]       │
│                                                    │
└──────────────────────────────────────────────────┘
```

### Individual Path Page

Each path expands into a full-page view with path-specific progress and status, AI-generated narrative summary, milestones and roadmap (timeline view), action items (checklist, identity-ranked), cross-path links (connection badges on relevant items), and "What If" simulation (Portfolio Growth path; future consideration for others).

### Main Dashboard Updates

The main platform dashboard (Identity Command Center from V3) is updated when the feature flag is ON:
- **Identity Snapshot** stays the same
- **Active Focus** pulls the highest-priority action item across ALL unlocked paths
- **Intelligence Feed** includes cross-path insights and unlock progress
- **New: Growth Pulse** — "You're 62% through your Growth Strategy. Strongest: Portfolio. Opportunity: Skills."

---

## 6. AI Prompt Architecture

### Prompt Assembly Per Path

```
┌────────────────────────────────────────────────┐
│  SYSTEM PROMPT                                  │
│  "You are a senior real estate investment        │
│  growth advisor. You are generating the          │
│  [PATH NAME] component of the user's Growth      │
│  Strategy."                                      │
├────────────────────────────────────────────────┤
│  IDENTITY CONTEXT                               │
│  Full composite identity (all 5 audits)         │
├────────────────────────────────────────────────┤
│  PRIOR PATHS CONTEXT (if applicable)            │
│  Summarized output of previously generated       │
│  paths                                           │
├────────────────────────────────────────────────┤
│  ENGAGEMENT CONTEXT (if applicable)             │
│  Completed action items, platform activity       │
│  patterns                                        │
├────────────────────────────────────────────────┤
│  PATH-SPECIFIC INSTRUCTIONS                     │
│  Detailed instructions for this path's content   │
├────────────────────────────────────────────────┤
│  CROSS-PATH LINKING INSTRUCTIONS                │
│  "Identify prerequisite, enabling, constraint,   │
│  and conflict links to previously generated       │
│  paths."                                         │
├────────────────────────────────────────────────┤
│  OUTPUT FORMAT SPEC                             │
│  JSON schema for the specific path               │
├────────────────────────────────────────────────┤
│  GUARDRAILS                                     │
│  No financial guarantees, no legal/tax advice,   │
│  realistic projections, flag professional        │
│  consultation needs                              │
└────────────────────────────────────────────────┘
```

### Token Cost Estimates

| Path | Est. Input Tokens | Est. Output Tokens | Notes |
|---|---|---|---|
| Portfolio Growth | ~2,500 | ~2,000 | Largest output; includes existing strategy |
| Income & Capital | ~3,000 | ~1,500 | Path 1 summary as context |
| Skills & Knowledge | ~3,500 | ~1,500 | Paths 1-2 summary as context |
| Time & Operations | ~4,000 | ~1,200 | Paths 1-3 summary + engagement data |

Total across all 4 paths: ~13,000 input + ~6,200 output tokens. Spread across days/weeks due to progressive unlocking.

---

## 7. Identity & Strategy Export System

### Purpose

Enable users to export their Investor Identity and Growth Strategy as structured markdown files that any AI agent (Claude, OpenClaw, ChatGPT, etc.) can immediately use as context. The export creates a portable, AI-readable version of who this person is as an investor.

This is distinct from the Blueprint PDF (Section 8), which is formatted for human consumption. The export system is formatted for machine consumption with structured frontmatter, consistent tagging, and an AI entry point file.

### What Gets Exported

The export produces a zip archive (or individual file downloads) containing:

```
investor-export/
├── investor-identity.md          # AI entry point — the single most important file
├── identity-full.md              # Complete identity with all audit summaries
├── growth-strategy-overview.md   # Growth Strategy status and cross-path insights
├── paths/
│   ├── portfolio-growth.md       # Full Portfolio Growth path output
│   ├── income-capital.md         # Full Income & Capital path (if unlocked)
│   ├── skills-knowledge.md       # Full Skills & Knowledge path (if unlocked)
│   └── time-operations.md        # Full Time & Operations path (if unlocked)
└── action-plan.md                # Combined action items across all paths
```

### The `investor-identity.md` File (AI Entry Point)

This is the file the user drops into their Obsidian vault, their CLAUDE.md, or any AI memory system. It's designed to give any AI agent instant, complete context:

```markdown
---
type: investor-identity
version: {{identity_version}}
generated: {{timestamp}}
platform: InvestorOS
readiness_score: {{readiness_score}}
archetype: {{archetype_slug}}
sub_scores:
  capital: {{capital_score}}
  time: {{time_score}}
  skills: {{skills_score}}
  risk_appetite: {{risk_score}}
  network: {{network_score}}
  goal_clarity: {{goal_clarity_score}}
tags: [type/investor-identity, status/active, source/investoros]
---

# Investor Identity: {{user_name}}

## Who I Am As An Investor
{{ai_generated_one_paragraph_summary}}

## My Archetype: {{archetype_name}}
{{archetype_description}}

## My Numbers
- **Readiness Score:** {{readiness_score}}/100
- **Capital:** {{capital_score}} | **Time:** {{time_score}} | **Skills:** {{skills_score}}
- **Risk Appetite:** {{risk_score}} | **Network:** {{network_score}} | **Goal Clarity:** {{goal_clarity_score}}

## Key Strengths
{{#each strengths}}
- {{this}}
{{/each}}

## Critical Gaps
{{#each gaps}}
- {{this}}
{{/each}}

## Active Growth Strategy
- **Portfolio:** {{portfolio_strategy_name}} — {{portfolio_status}} ({{portfolio_progress}}%)
{{#if income_capital_unlocked}}
- **Income & Capital:** {{income_headline}} — {{income_status}} ({{income_progress}}%)
{{/if}}
{{#if skills_unlocked}}
- **Skills:** {{skills_headline}} — {{skills_status}} ({{skills_progress}}%)
{{/if}}
{{#if time_unlocked}}
- **Time & Ops:** {{time_headline}} — {{time_status}} ({{time_progress}}%)
{{/if}}

## What I Need Help With Right Now
{{ai_generated_top_gaps_and_next_actions}}

## Financial Snapshot
- Available capital: {{capital_range}}
- Income type: {{income_type}}
- Credit tier: {{credit_tier}}
- Financing paths available: {{financing_paths_list}}

## Timeline & Goals
- First deal target: {{first_deal_timeline}}
- Monthly cash flow goal: {{cash_flow_goal}}
- Investment horizon: {{horizon_years}} years
- Primary objective: {{primary_objective}}

## How To Use This File
This file was generated by InvestorOS and represents my verified investor profile.
Use it to give context-aware advice aligned with my actual financial situation,
risk tolerance, skills, time constraints, and goals. Updated: {{timestamp}}.
```

### Individual Path Export Files

Each unlocked growth path exports as a standalone markdown file with YAML frontmatter and structured content. Example structure for `paths/portfolio-growth.md`:

```markdown
---
type: growth-path
path: portfolio-growth
version: {{path_version}}
generated: {{timestamp}}
identity_version: {{identity_version}}
progress: {{progress_percentage}}
status: {{status}}
tags: [type/growth-path, path/portfolio, status/{{status}}, source/investoros]
---

# Portfolio Growth Path

## Active Investing Strategy
### {{strategy_1_name}} (Fit Score: {{fit_score}}/100)
{{strategy_summary}}

**Pros:** {{pros_list}}
**Cons:** {{cons_list}}
**Capital Required:** {{capital_required}}
**Timeline:** {{timeline}}

## Portfolio Scaling Plan
### Year 1 Vision
{{year_1_narrative}}
- Target units: {{year_1_units}}
- Estimated cash flow: {{year_1_cash_flow}}

### Year 3 Vision
{{year_3_narrative}}

### Year 5 Vision
{{year_5_narrative}}

## Scaling Sequence
{{#each scaling_phases}}
### Phase {{phase}}: {{phase_name}}
- **Strategy:** {{strategy}}
- **Trigger:** {{trigger}}
- **Capital Required:** {{capital_required}}
- **Prerequisites:** {{prerequisites_list}}
{{/each}}

## Financing Evolution
{{#each financing_stages}}
### Stage: {{stage}}
- **Type:** {{financing_type}}
- **Why now:** {{why_now}}
{{/each}}

## Action Items
{{#each action_items}}
- [{{#if completed}}x{{else}} {{/if}}] **{{title}}** ({{timeframe}}) — {{description}}
{{/each}}
```

Locked paths are not included in the export. Their absence implicitly communicates which paths haven't been unlocked yet.

### `action-plan.md` (Combined)

A single file with all action items across all unlocked paths, sorted by priority score. Formatted as a task list with path labels and categories. Designed to be imported into any task manager or daily note system.

### Export Freshness

Exports are generated on-demand when the user clicks "Export for AI." They are **not** cached or pre-generated. The export always reflects the current state of the identity and all growth paths, including action item completion status.

If the identity or any growth path has been regenerated since the last export, the export banner shows: "Your identity has been updated since your last export. Download a fresh copy."

### Formatting Rules

All exported markdown files follow these conventions for maximum AI compatibility:
- YAML frontmatter on every file with `type`, `tags`, `generated` timestamp
- Hierarchical tags using slash notation: `type/growth-path`, `path/portfolio`
- Wikilink-compatible cross-references between files: `[[investor-identity]]`
- Kebab-case filenames (lowercase, hyphens)
- No proprietary formatting — pure standard markdown
- Dates in ISO 8601 format: `2026-04-04`
- All monetary values include currency symbol
- Consistent heading hierarchy (H1 = file title, H2 = sections, H3 = subsections)

---

## 8. Investment Blueprint PDF (Updated)

The downloadable Blueprint PDF expands to include all unlocked growth paths:

1. **Cover Page** — User name, archetype, readiness score, date, branding
2. **Investor DNA Profile** — Radar chart, archetype description, strengths, gaps
3. **Growth Strategy Overview** — One-page summary of all four paths, progress, cross-path insight highlights
4. **Portfolio Growth** — Strategy cards + scaling plan + roadmap
5. **Income & Capital Growth** — Funding channels + capital milestones (if unlocked)
6. **Skills & Knowledge Growth** — Skill gaps + learning roadmap + network plan (if unlocked)
7. **Time & Operations Growth** — Delegation roadmap + transition plan (if unlocked)
8. **Your 72-Hour Quick Start** — Micro-plan, always tied to Portfolio Growth
9. **Full Action Plan (All Paths)** — Combined, sequenced, priority-ordered
10. **Assumptions & Disclaimers**
11. **Back Cover** — Branding + referral CTA

Locked paths show a placeholder page: "This section will be added when you unlock [Path Name]. You're [X] away from unlocking it."

---

## 9. Pre-Migration Audit

Before writing any migration code, verify these assumptions about the V3 state. If any fail, fix them first.

| # | Check | Expected State | If Not |
|---|---|---|---|
| 1 | Strategy output stored as structured JSON | `strategies` table has a JSON/JSONB column with parsed AI output matching V3 schema | **BLOCKER.** Refactor to structured JSON before proceeding. |
| 2 | Identity versioning working | `identity_versions` table has append-only records with id, user_id, archetype, readiness_score, sub_scores, radar_data, ai_insights, generated_at | Required for Growth Strategy identity version references. |
| 3 | Action items have completion tracking | Action plan items have `status` and `completed_at` fields | Required for unlock triggers. Add columns in Phase A if missing. |
| 4 | Activity logging captures task events | `activity_logs` table records assessment completions, task completions, logins | Required for unlock triggers (especially "14+ days active"). Extend logging if sparse. |
| 5 | Prompt templates stored in database | A `prompt_templates` table exists with versioned templates | Required for adding path-specific prompts without redeployment. Extract from code if hardcoded. |
| 6 | Micro-plan tasks have completion tracking | Micro-plan items have `completed` and `completed_at` fields | Required for Path 2 unlock trigger. |

---

## 10. Database Migrations

Execute in order. Each migration is a separate, reversible migration file. All new tables include tenant isolation (row-level security matching V3 patterns).

### Migration 01: `growth_strategies` Table

```sql
CREATE TABLE growth_strategies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    identity_version_id UUID NOT NULL REFERENCES identity_versions(id),
    overall_progress DECIMAL(5,2) DEFAULT 0.00,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_growth_strategies_user ON growth_strategies(user_id);
CREATE INDEX idx_growth_strategies_tenant ON growth_strategies(tenant_id);

ALTER TABLE growth_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY growth_strategies_tenant_isolation ON growth_strategies
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

One active growth strategy per user. Previous strategies are soft-archived (status = 'archived').

### Migration 02: `growth_paths` Table

```sql
CREATE TABLE growth_paths (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    growth_strategy_id  UUID NOT NULL REFERENCES growth_strategies(id) ON DELETE CASCADE,
    path_type           VARCHAR(30) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'locked',
    unlock_trigger      TEXT,
    unlocked_at         TIMESTAMP WITH TIME ZONE,
    generated_at        TIMESTAMP WITH TIME ZONE,
    identity_version_id UUID REFERENCES identity_versions(id),
    ai_output           JSONB,
    progress            DECIMAL(5,2) DEFAULT 0.00,
    version             INTEGER NOT NULL DEFAULT 1,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_path_type CHECK (
        path_type IN ('portfolio_growth', 'income_capital', 'skills_knowledge', 'time_operations')
    ),
    CONSTRAINT valid_status CHECK (
        status IN ('locked', 'unlocked', 'generating', 'generated', 'regenerating', 'error')
    )
);

CREATE INDEX idx_growth_paths_strategy ON growth_paths(growth_strategy_id);
CREATE INDEX idx_growth_paths_type ON growth_paths(path_type);
CREATE INDEX idx_growth_paths_status ON growth_paths(status);
```

Status lifecycle: `locked` → `unlocked` → `generating` → `generated` → `regenerating` → `generated`.

### Migration 03: `growth_path_action_items` Table

```sql
CREATE TABLE growth_path_action_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    growth_path_id  UUID NOT NULL REFERENCES growth_paths(id) ON DELETE CASCADE,
    step_number     INTEGER NOT NULL,
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    timeframe       VARCHAR(100),
    category        VARCHAR(50),
    identity_impact VARCHAR(255),
    priority_score  INTEGER DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_at    TIMESTAMP WITH TIME ZONE,
    skipped_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_action_status CHECK (
        status IN ('pending', 'in_progress', 'completed', 'skipped')
    )
);

CREATE INDEX idx_gp_action_items_path ON growth_path_action_items(growth_path_id);
CREATE INDEX idx_gp_action_items_status ON growth_path_action_items(status);
CREATE INDEX idx_gp_action_items_priority ON growth_path_action_items(priority_score DESC);
```

### Migration 04: `cross_path_links` Table

```sql
CREATE TABLE cross_path_links (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    growth_strategy_id  UUID NOT NULL REFERENCES growth_strategies(id) ON DELETE CASCADE,
    link_type           VARCHAR(20) NOT NULL,
    source_path_id      UUID NOT NULL REFERENCES growth_paths(id) ON DELETE CASCADE,
    source_item_id      UUID REFERENCES growth_path_action_items(id) ON DELETE SET NULL,
    target_path_id      UUID NOT NULL REFERENCES growth_paths(id) ON DELETE CASCADE,
    target_item_id      UUID REFERENCES growth_path_action_items(id) ON DELETE SET NULL,
    description         TEXT NOT NULL,
    resolution          TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_link_type CHECK (
        link_type IN ('prerequisite', 'enabling', 'constraint', 'conflict')
    )
);

CREATE INDEX idx_cross_path_links_strategy ON cross_path_links(growth_strategy_id);
CREATE INDEX idx_cross_path_links_source ON cross_path_links(source_path_id);
CREATE INDEX idx_cross_path_links_target ON cross_path_links(target_path_id);
```

### Migration 05: `unlock_events` Table

```sql
CREATE TABLE unlock_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    growth_path_id  UUID NOT NULL REFERENCES growth_paths(id) ON DELETE CASCADE,
    trigger_type    VARCHAR(20) NOT NULL,
    trigger_detail  JSONB,
    triggered_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_trigger_type CHECK (
        trigger_type IN ('organic', 'manual_request', 'system')
    )
);

CREATE INDEX idx_unlock_events_user ON unlock_events(user_id);
CREATE INDEX idx_unlock_events_path ON unlock_events(growth_path_id);
```

### Migration 06: `export_history` Table

```sql
CREATE TABLE export_history (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    export_type         VARCHAR(20) NOT NULL,
    identity_version_id UUID NOT NULL REFERENCES identity_versions(id),
    growth_strategy_id  UUID REFERENCES growth_strategies(id) ON DELETE SET NULL,
    file_manifest       JSONB,
    exported_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_export_type CHECK (
        export_type IN ('markdown_full', 'markdown_identity', 'markdown_strategy', 'blueprint_pdf')
    )
);

CREATE INDEX idx_export_history_user ON export_history(user_id);
```

Tracks every export event. `file_manifest` stores the list of files included and their identity/path versions so the system can detect staleness.

### Migration 07: Feature Flag

```sql
CREATE TABLE IF NOT EXISTS feature_flags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name   VARCHAR(100) NOT NULL UNIQUE,
    enabled     BOOLEAN NOT NULL DEFAULT false,
    tenant_scope UUID REFERENCES tenants(id) ON DELETE CASCADE,
    metadata    JSONB,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO feature_flags (flag_name, enabled, tenant_scope, metadata)
VALUES ('growth_strategy_enabled', false, NULL, '{"rollout_phase": "internal_testing"}');
```

If V3 already has a feature flag system, use it instead.

### Migration 08: Modify Existing `strategies` Table

```sql
ALTER TABLE strategies
    ADD COLUMN growth_path_id UUID REFERENCES growth_paths(id) ON DELETE SET NULL;

CREATE INDEX idx_strategies_growth_path ON strategies(growth_path_id);
```

This is the **only change to an existing V3 table.** Existing records have `growth_path_id = NULL` and continue to work unchanged.

### Migration 09: Prompt Template Records

```sql
INSERT INTO prompt_templates (service_type, version, template_content, active) VALUES
    ('portfolio_growth', 1, '{{PLACEHOLDER}}', true),
    ('income_capital_growth', 1, '{{PLACEHOLDER}}', true),
    ('skills_knowledge_growth', 1, '{{PLACEHOLDER}}', true),
    ('time_operations_growth', 1, '{{PLACEHOLDER}}', true),
    ('cross_path_linking', 1, '{{PLACEHOLDER}}', true),
    ('identity_export_summary', 1, '{{PLACEHOLDER}}', true);
```

The `identity_export_summary` template is used to generate the AI-written narrative sections in the export files (the one-paragraph summary, the "What I Need Help With" section, etc.).

---

## 11. Backend Service Changes

### New Services

| Service | Responsibility |
|---|---|
| **GrowthStrategyService** | Orchestrates Growth Strategy lifecycle: creation, path management, progress computation, regeneration |
| **GrowthPathService** | Manages individual path generation: prompt assembly, LLM call, response parsing, action item extraction |
| **UnlockService** | Evaluates unlock conditions, fires unlock events, manages the progressive unlock state machine |
| **CrossPathLinkService** | Generates and manages cross-path links, provides cross-path insight queries |
| **ActionItemPriorityService** | Computes cross-path priority scores, provides "next best action" queries |
| **ExportService** | Generates markdown files from identity and growth strategy data, assembles zip archive, tracks export history |

### Existing Services Modified

#### StrategyService

**When feature flag is ON:** No longer called directly by the API controller. GrowthPathService calls it internally when generating Portfolio Growth. Receives additional `growth_path_id` parameter. Prompt template reference switches from `strategy_generation` to `portfolio_growth`. Response parser extended to handle `portfolio_scaling_plan` and `tool_integration_slots`.

**When feature flag is OFF:** Unchanged V3 behavior.

```
// Pseudocode
async generate(identityVersionId, growthPathId = null) {
    const templateKey = growthPathId ? 'portfolio_growth' : 'strategy_generation';
    const template = await promptTemplateRepo.getActive(templateKey);
    const identity = await identityRepo.getVersion(identityVersionId);
    const prompt = assemblePrompt(template, identity);
    const llmResponse = await llmService.call(prompt);
    const parsed = parseResponse(llmResponse, templateKey);
    const strategy = await strategyRepo.create({
        ...parsed,
        identity_version_id: identityVersionId,
        growth_path_id: growthPathId
    });
    return strategy;
}
```

#### IdentitySynthesisService

After synthesis, check if the user has a Growth Strategy. If identity score delta > 10 points, generate an insight notification suggesting regeneration.

#### TaskService / ActionItemService

On task completion, notify UnlockService to evaluate unlock conditions.

#### LoggingService

New event types added (no changes to existing events):

| Event Type | Payload |
|---|---|
| `growth_strategy_created` | `{ growth_strategy_id, identity_version_id }` |
| `growth_path_unlocked` | `{ path_id, path_type, trigger_type, trigger_detail }` |
| `growth_path_generated` | `{ path_id, path_type, token_usage, response_time_ms }` |
| `growth_path_regenerated` | `{ path_id, path_type, previous_version, new_version }` |
| `cross_path_link_created` | `{ link_id, link_type, source_path, target_path }` |
| `export_generated` | `{ export_type, files_included, identity_version }` |

### UnlockService (Detail)

```
// Pseudocode

class UnlockService {

    async evaluateTriggers(userId, event) {
        const growthStrategy = await growthStrategyRepo.getActiveForUser(userId);
        if (!growthStrategy) return;

        const paths = await growthPathRepo.getForStrategy(growthStrategy.id);

        for (const path of paths) {
            if (path.status !== 'locked') continue;
            const shouldUnlock = await this.checkUnlockCondition(path, userId, event);
            if (shouldUnlock) {
                await this.unlockPath(path, userId, 'organic', event);
            }
        }
    }

    async checkUnlockCondition(path, userId, event) {
        switch (path.path_type) {

            case 'portfolio_growth':
                return true;  // Always unlocked on creation

            case 'income_capital':
                // 2+ micro-plan tasks completed from Portfolio Growth
                const portfolioPath = await growthPathRepo.getByType(
                    path.growth_strategy_id, 'portfolio_growth'
                );
                const completedMicroTasks = await actionItemRepo.countCompleted({
                    growthPathId: portfolioPath.id,
                    category: 'micro_plan'
                });
                return completedMicroTasks >= 2;

            case 'skills_knowledge':
                // Paths 1+2 generated AND 1+ action item completed from either
                const p1 = await growthPathRepo.getByType(path.growth_strategy_id, 'portfolio_growth');
                const p2 = await growthPathRepo.getByType(path.growth_strategy_id, 'income_capital');
                if (p1.status !== 'generated' || p2.status !== 'generated') return false;
                const completedFromEither = await actionItemRepo.countCompleted({
                    growthPathIds: [p1.id, p2.id]
                });
                return completedFromEither >= 1;

            case 'time_operations':
                // 3 paths generated AND 14+ days active
                const generatedPaths = await growthPathRepo.countByStatus(
                    path.growth_strategy_id, 'generated'
                );
                const daysSinceCreation = await this.getDaysActive(userId);
                return generatedPaths >= 3 && daysSinceCreation >= 14;

            default:
                return false;
        }
    }

    async manualUnlock(pathId, userId) {
        const path = await growthPathRepo.getById(pathId);
        if (path.status !== 'locked') throw new Error('Path is not locked');
        await this.unlockPath(path, userId, 'manual_request', { requested_at: new Date() });
    }

    async unlockPath(path, userId, triggerType, triggerDetail) {
        await growthPathRepo.update(path.id, {
            status: 'unlocked',
            unlock_trigger: JSON.stringify(triggerDetail),
            unlocked_at: new Date()
        });
        await unlockEventRepo.create({
            user_id: userId,
            tenant_id: path.tenant_id,
            growth_path_id: path.id,
            trigger_type: triggerType,
            trigger_detail: triggerDetail
        });
        await loggingService.log('growth_path_unlocked', {
            path_id: path.id, path_type: path.path_type, trigger_type: triggerType
        });
        await growthPathService.generatePath(path.id);
    }
}
```

### ExportService (Detail)

```
// Pseudocode

class ExportService {

    async generateMarkdownExport(userId, exportType = 'markdown_full') {
        const identity = await identityRepo.getCurrentVersion(userId);
        const growthStrategy = await growthStrategyRepo.getActiveForUser(userId);
        const paths = await growthPathRepo.getForStrategy(growthStrategy.id);
        const unlockedPaths = paths.filter(p => p.status === 'generated');

        const files = [];

        // Always generate the AI entry point file
        const summaryPrompt = await promptTemplateRepo.getActive('identity_export_summary');
        const aiSummary = await llmService.call(
            assembleExportPrompt(summaryPrompt, identity, growthStrategy, unlockedPaths)
        );

        files.push({
            filename: 'investor-identity.md',
            content: renderIdentityEntryPoint(identity, growthStrategy, unlockedPaths, aiSummary)
        });

        if (exportType === 'markdown_full' || exportType === 'markdown_identity') {
            files.push({
                filename: 'identity-full.md',
                content: renderFullIdentity(identity)
            });
        }

        if (exportType === 'markdown_full' || exportType === 'markdown_strategy') {
            files.push({
                filename: 'growth-strategy-overview.md',
                content: renderGrowthStrategyOverview(growthStrategy, paths)
            });

            for (const path of unlockedPaths) {
                files.push({
                    filename: `paths/${path.path_type.replace('_', '-')}.md`,
                    content: renderPathExport(path)
                });
            }

            const allActionItems = await actionItemRepo.getAllForStrategy(
                growthStrategy.id, { orderBy: 'priority_score DESC' }
            );
            files.push({
                filename: 'action-plan.md',
                content: renderCombinedActionPlan(allActionItems)
            });
        }

        // Track the export
        await exportHistoryRepo.create({
            user_id: userId,
            tenant_id: identity.tenant_id,
            export_type: exportType,
            identity_version_id: identity.id,
            growth_strategy_id: growthStrategy.id,
            file_manifest: files.map(f => f.filename)
        });

        await loggingService.log('export_generated', {
            export_type: exportType,
            files_included: files.length,
            identity_version: identity.id
        });

        return files;  // Controller zips and streams, or returns individual files
    }

    async isExportStale(userId) {
        const lastExport = await exportHistoryRepo.getLatest(userId);
        if (!lastExport) return true;

        const currentIdentity = await identityRepo.getCurrentVersion(userId);
        if (currentIdentity.id !== lastExport.identity_version_id) return true;

        const growthStrategy = await growthStrategyRepo.getActiveForUser(userId);
        const paths = await growthPathRepo.getForStrategy(growthStrategy.id);
        const latestGeneration = Math.max(...paths.map(p => p.generated_at || 0));
        if (latestGeneration > lastExport.exported_at) return true;

        return false;
    }
}
```

The AI-generated narrative sections in the export (`investor-identity.md` summary, "What I Need Help With" section) use a lightweight prompt that costs ~200 input + ~150 output tokens. This is a small, focused generation — not a full strategy call.

---

## 12. API Specification

All new endpoints are behind the `growth_strategy_enabled` feature flag. If flag is off, they return `404`.

### Growth Strategy Endpoints

```
POST   /api/v1/growth-strategy                           # Create growth strategy
GET    /api/v1/growth-strategy                           # Get active growth strategy with all paths
GET    /api/v1/growth-strategy/progress                  # Get overall progress summary
DELETE /api/v1/growth-strategy                           # Archive current growth strategy
```

### Growth Path Endpoints

```
GET    /api/v1/growth-strategy/paths                     # List all paths with status
GET    /api/v1/growth-strategy/paths/:pathType           # Get specific path detail + AI output
POST   /api/v1/growth-strategy/paths/:pathType/generate  # Manual unlock + generate
POST   /api/v1/growth-strategy/paths/:pathType/regenerate # Regenerate existing path
GET    /api/v1/growth-strategy/paths/:pathType/actions   # Action items for a path
```

### Action Item Endpoints (Cross-Path)

```
GET    /api/v1/growth-strategy/actions                   # All action items, priority-ranked
PATCH  /api/v1/growth-strategy/actions/:id               # Update status (complete, skip, etc.)
```

### Cross-Path Endpoints

```
GET    /api/v1/growth-strategy/links                     # All cross-path links
GET    /api/v1/growth-strategy/insights                  # AI-generated cross-path insights
```

### Export Endpoints

```
GET    /api/v1/export/markdown                           # Full markdown export (zip)
GET    /api/v1/export/markdown/identity                  # Identity-only markdown
GET    /api/v1/export/markdown/strategy                  # Strategy-only markdown
GET    /api/v1/export/markdown/stale                     # Check if export is stale
GET    /api/v1/export/blueprint                          # Blueprint PDF (updated)
```

### Modified V3 Endpoints

```
GET    /api/v1/strategy              # Flag ON: redirects to /growth-strategy/paths/portfolio_growth
GET    /api/v1/strategy/actions      # Flag ON: proxies to /growth-strategy/actions
PATCH  /api/v1/strategy/actions/:id  # Flag ON: proxies to /growth-strategy/actions/:id
```

### Response Format: Growth Strategy Overview

```json
{
    "id": "uuid",
    "identity_version_id": "uuid",
    "overall_progress": 42.5,
    "created_at": "timestamp",
    "export_stale": true,

    "paths": [
        {
            "path_type": "portfolio_growth",
            "status": "generated",
            "progress": 78.0,
            "generated_at": "timestamp",
            "version": 1,
            "summary": {
                "active_strategy": "BRRRR in Midwest markets",
                "next_action": "Call 2 investor-friendly lenders",
                "total_action_items": 14,
                "completed_action_items": 11
            }
        },
        {
            "path_type": "income_capital",
            "status": "generated",
            "progress": 35.0,
            "generated_at": "timestamp",
            "version": 1,
            "summary": {
                "next_milestone": "Secure HELOC — $80K available",
                "total_action_items": 9,
                "completed_action_items": 3
            }
        },
        {
            "path_type": "skills_knowledge",
            "status": "generated",
            "progress": 15.0,
            "generated_at": "timestamp",
            "version": 1,
            "summary": {
                "top_skill_gap": "Deal underwriting",
                "currently_learning": "Rental property analysis",
                "total_action_items": 11,
                "completed_action_items": 2
            }
        },
        {
            "path_type": "time_operations",
            "status": "locked",
            "progress": 0,
            "generated_at": null,
            "version": 0,
            "unlock_criteria": {
                "description": "Active on the platform for 14+ days with 3 paths generated",
                "conditions": [
                    { "condition": "3 paths generated", "met": true },
                    { "condition": "14+ days active", "met": false, "current": 8, "target": 14 }
                ]
            }
        }
    ],

    "cross_path_insights": [
        {
            "type": "prerequisite",
            "message": "Completing your HELOC application (Income Path) unlocks Phase 2 of your Portfolio Plan.",
            "source_path": "income_capital",
            "target_path": "portfolio_growth",
            "priority": "high"
        }
    ],

    "next_best_action": {
        "action_item_id": "uuid",
        "title": "Call 2 investor-friendly lenders in your target market",
        "path": "portfolio_growth",
        "identity_impact": "Improves Network score from 42 to 55",
        "estimated_time": "30 minutes"
    }
}
```

---

## 13. Frontend Changes

### Components Unchanged
Assessment Engine (both modes), Identity Card, Contact Manager, Authentication screens, Profile page.

### Components Reparented

| Component | V3 Location | Growth Strategy Location |
|---|---|---|
| Strategy Cards | Results page (top-level) | Portfolio Growth path view (nested) |
| Action Plan Checklist | Results page (top-level) | Portfolio Growth path view (nested) + cross-path view (aggregated) |
| Roadmap Timeline | Results page (top-level) | Portfolio Growth path view (nested) |
| 72-Hour Micro-Plan | Results page (top-level) | Portfolio Growth path view (nested) |
| Simulation Sliders | Results page (on strategy cards) | Portfolio Growth path view (on strategy cards) |

Wrap existing components in `PortfolioGrowthView`. Components don't change — their data source changes.

### New Components

| Component | Purpose |
|---|---|
| `GrowthStrategyOverview` | Four-path card grid with status, progress, summaries |
| `GrowthPathCard` | Individual path card with progress bar, status badge, summary, action button |
| `LockedPathCard` | Locked path variant with unlock criteria and progress indicators. "Generate Now" button. |
| `UnlockCelebration` | Modal on organic unlock. Congrats + "Explore" CTA. |
| `PathDetailView` | Full-page view per path. Portfolio uses reparented V3 components. |
| `IncomeCapitalView` | Income path layout: capital tactics, funding channel cards, milestones |
| `SkillsKnowledgeView` | Skills path layout: skill gap list, learning timeline, network plan, certs |
| `TimeOperationsView` | Time path layout: reality check, recapture plan, delegation roadmap, burnout indicators |
| `CrossPathInsightsPanel` | Renders cross-path links and insights. Used in overview and individual paths. |
| `GrowthPulse` | Single-line summary for dashboard |
| `CrossPathActionList` | Aggregated action items from all paths, priority-sorted |
| `ExportButton` | Dropdown with "Export for AI (Markdown)" and "Download Blueprint PDF." Shows stale indicator. |

### Routing

```
# V3 Routes (preserved, redirect when flag ON)
/strategy              → redirect to /growth
/strategy/actions      → redirect to /growth/actions

# New Routes
/growth                → GrowthStrategyOverview
/growth/portfolio      → PathDetailView (portfolio_growth)
/growth/income         → PathDetailView (income_capital)
/growth/skills         → PathDetailView (skills_knowledge)
/growth/time           → PathDetailView (time_operations)
/growth/actions        → CrossPathActionList
/growth/blueprint      → BlueprintDownloadPage
/growth/export         → ExportPage (markdown download options)
```

### Dashboard Modifications (Flag ON)

| Section | V3 | Growth Strategy |
|---|---|---|
| Identity Snapshot | Archetype + score + radar | Unchanged |
| Active Focus | Next 3 tasks from strategy | Next 3 tasks from cross-path priority ranking |
| Intelligence Feed | Identity insights | + cross-path insights + unlock progress |
| New: Growth Pulse | N/A | Overall progress + strongest/weakest path |
| New: Export Status | N/A | "Your AI export is outdated. Download fresh copy." (if stale) |

---

## 14. Data Migration for Existing Users

Run once when enabling the Growth Strategy for a tenant or globally.

### Migration Script

```
For each user with an existing strategy output:

1. Create growth_strategies record
   - user_id, tenant_id from user
   - identity_version_id from existing strategy
   - overall_progress = calculated from action item completion

2. Create growth_paths record for portfolio_growth
   - status = 'generated'
   - unlocked_at = existing strategy created_at
   - generated_at = existing strategy created_at
   - ai_output = existing strategy JSON wrapped:
     {
       "investing_strategy": { ...existing },
       "portfolio_scaling_plan": null,
       "tool_integration_slots": []
     }
   - progress = calculated from action item completion

3. Update existing strategy record
   - Set growth_path_id = new portfolio_growth path id

4. Create locked growth_paths for other 3 paths
   - income_capital, skills_knowledge, time_operations: status = 'locked'

5. Copy existing action items to growth_path_action_items
   - Preserve completion status and timestamps

6. Evaluate unlock conditions immediately
   - If 2+ micro-plan tasks completed → unlock income_capital
   - If 14+ days active → factor into time_operations check
   - Run UnlockService.evaluateTriggers()
```

### Safety Rules
- Transaction per user. Rollback on failure.
- Idempotent — check for existing growth_strategy before creating.
- Log all migration actions to activity_logs.
- Existing API responses continue to work via backward-compatible endpoints.

---

## 15. Feature Flag & Rollout Plan

### Rollout Phases

| Phase | Scope | Duration | Focus |
|---|---|---|---|
| Internal testing | Team tenant only | Week 9 | Data migration verification, endpoint testing, unlock flow |
| Beta | 10–20 selected tenants | Week 10 first half | Error rates, AI quality, unlock trigger accuracy, export format feedback |
| General availability | All tenants | Week 10 second half | Full data migration, metric monitoring |

### Rollback Plan

1. Set flag to OFF globally (instant)
2. All Growth Strategy routes return 404
3. Dashboard reverts to V3 behavior
4. Old /strategy endpoints resume serving V3 data
5. No data lost — growth_strategy tables are ignored

Rollback is instant and non-destructive.

---

## 16. Testing Plan

### Unit Tests

| Area | Key Cases |
|---|---|
| UnlockService | Each path's unlock condition: met/not met. Edge: exactly 2 tasks, exactly 14 days. Manual unlock. |
| GrowthPathService | Prompt assembly with 0, 1, 2, 3 prior paths as context. Response parsing per schema. Malformed output handling. |
| CrossPathLinkService | Link generation from AI output. Queries by path, item, type. |
| ActionItemPriorityService | Cross-path ranking. Priority recalculation on new path generation. |
| ExportService | Export with 1 path, 2 paths, 4 paths. Stale detection. AI summary generation. Markdown formatting validation. |
| Data Migration | User with complete strategy. Partial strategy. No strategy. Idempotency. |

### Integration Tests

| Flow | Steps |
|---|---|
| Full lifecycle | Create identity → Portfolio Growth → 2 micro tasks → Income unlocks → Generate → 1 action item → Skills unlocks → 14 days → Time unlocks |
| Manual unlock | All locked → "Generate Now" on Skills → Confirmation → Generates despite earlier paths locked |
| Feature flag | OFF: growth endpoints 404, V3 works. ON: growth works, V3 redirects |
| Data migration | V3 user with strategy → Run migration → Verify wrapper → Verify unlocks evaluate |
| Regeneration | Generate path → Identity change > 10 points → Regeneration prompt → New version preserved |
| Export full cycle | Complete identity + 2 paths → Export markdown → Verify all files present → Verify frontmatter → Verify staleness after regeneration |
| Export staleness | Export → Regenerate a path → Check stale endpoint → Confirm stale = true |

### Performance Targets

| Test | Target |
|---|---|
| Growth Strategy overview load | < 500ms |
| Individual path detail load | < 300ms |
| Path generation (AI + parsing + storage) | < 30 seconds |
| Cross-path action ranking (4 paths, ~50 items) | < 100ms |
| Data migration per user | < 2 seconds |
| Blueprint PDF generation (4 paths) | < 10 seconds |
| Markdown export generation (full) | < 5 seconds (excluding AI summary call) |
| AI summary for export | < 10 seconds |

---

## 17. Success Metrics

### Identity Engagement

| Metric | Target | Signal |
|---|---|---|
| Portfolio Growth generation rate | > 90% of users with complete identity | Entry point working |
| Path 2 organic unlock rate | > 50% of Path 1 users | Progressive system drives action |
| Path 3 organic unlock rate | > 35% of Path 2 users | Engagement ladder holds |
| Path 4 organic unlock rate | > 25% of Path 3 users | Deep engagement cohort exists |
| Manual unlock rate | < 30% of total unlocks | Progressive flow preferred |

### Strategy & Action

| Metric | Target | Signal |
|---|---|---|
| Action items completed across all paths | > 3 per user (30-day) | Users executing, not just reading |
| Cross-path link engagement | > 20% of users click a link | Users understand connections |
| Blueprint download with 2+ paths | > 40% of multi-path users | Multi-path value is tangible |
| Growth Strategy regeneration rate | > 20% regenerate at least once | Platform perceived as living |
| Overall progress improvement (60-day) | > 30% of users increase score | Users actually growing |

### Export

| Metric | Target | Signal |
|---|---|---|
| Markdown export adoption | > 15% of users with 2+ paths download at least once | Export feature is discoverable and valued |
| Repeat export rate | > 30% of exporters download a second time within 30 days | Users are integrating exports into their AI workflow |
| Export-to-Blueprint ratio | Track (no target) | Understand which format users prefer |
| Stale export re-download rate | > 50% of users notified of staleness re-download | Freshness indicator drives re-engagement |

---

## 18. Build Sequence

### Phase A — Foundation (Weeks 1–2)
Pre-migration audit. Fix blockers (strategy JSON format, missing tracking columns, prompt template extraction). Database migrations 01–09. Feature flag setup. Repository layer for all new tables.

### Phase B — Core Services & Portfolio Growth (Weeks 2–4)
GrowthStrategyService and GrowthPathService scaffolding. UnlockService with full unit tests. Modify StrategyService to support growth_path_id and portfolio_growth prompt template. Portfolio Growth path generation (extends existing strategy). New API endpoints with feature flag gating.

### Phase C — Progressive Unlock System (Weeks 3–4)
Unlock trigger evaluation, event tracking, manual unlock escape hatch, unlock celebration UX. Test with simulated user journeys.

### Phase D — Growth Paths 2, 3, 4 (Weeks 4–7)
Income & Capital Growth: prompt template, generation, parsing, path view.
Skills & Knowledge Growth: prompt template, generation, parsing, path view.
Time & Operations Growth: prompt template, generation, parsing, path view.
Cross-path link generation integrated into each path's generation flow.

### Phase E — Cross-Path Intelligence & Dashboard (Weeks 6–8)
CrossPathLinkService, ActionItemPriorityService. Dashboard updates: Growth Pulse, cross-path insights in intelligence feed, combined action item ranking.

### Phase F — Frontend: Growth Strategy Experience (Weeks 5–9)
GrowthStrategyOverview, PathCards, LockedPathCard, UnlockCelebration. Reparent V3 components into PortfolioGrowthView. Individual path detail views. Routing changes.

### Phase G — Export System (Weeks 7–9)
ExportService: markdown rendering templates for identity and each path type. AI summary prompt template. Zip archive assembly. Export staleness detection. ExportButton component with stale indicator. Export history tracking.

### Phase H — Updated Blueprint PDF (Weeks 8–9)
Expand PDF template to include all path sections. Handle locked path placeholders. Test with 1, 2, 3, and 4 paths.

### Phase I — Data Migration & Integration Testing (Weeks 9–10)
Data migration script for existing users. End-to-end testing of full progressive unlock journey. Prompt quality iteration. Performance testing. Security review.

### Phase J — Rollout (Weeks 10–11)
Internal testing → Beta (10–20 tenants) → General availability. Monitor metrics. Iterate on prompt quality and UX based on real usage.

**Total: ~11 weeks.** Phases overlap — prompt engineering for later paths happens in parallel with UI work for earlier paths. Export system is built in parallel with the later growth paths.

---

## 19. Future Considerations

### Sync Infrastructure (Separate Feature — Post-Launch)
- Auto-push exports to Obsidian vault on identity/strategy change
- Webhook system for external AI tool notifications
- MCP server endpoint for direct identity querying
- Bidirectional sync conflict resolution

### Tool Integration Framework (Post-Launch)
Portfolio Growth path defines integration slots. When future tools are built, they:
1. Register as available tools with the Growth Strategy service
2. Receive identity and active portfolio plan as context
3. Return results referencing portfolio scaling plan
4. Update Growth Strategy progress on tool milestone completion

### Additional Growth Paths (Post-Launch)
The four-path model is expandable. Future candidates:
- **Wealth & Tax Optimization** — Tax strategy, entity structuring, estate planning
- **Market Intelligence** — Ongoing market analysis tied to portfolio targets
- **Partnership & Syndication** — Collaborative investing path

The data model and unlock system support additional paths without structural changes.

### Regeneration & Evolution
| Trigger | Behavior |
|---|---|
| Identity score changes > 10 points | Suggest regeneration |
| User completes a portfolio scaling phase | Suggest update to reflect new position |
| User explicitly requests | Immediate. New version, old preserved. |
| 90 days since last generation | Gentle prompt for refresh |

Old versions are always preserved. The platform shows what changed between versions.

---

*This document is the single source of truth for the Growth Strategy Engine feature — what to build, why, and exactly how to implement it on top of V3.*
