# Product Requirements Document — V3
## InvestorOS: The Identity-Centric Real Estate Investment Platform

**Version:** 3.0 PRD
**Date:** April 2026
**Status:** Draft for Review
**Evolution:** V1 (Tool) → V2 (Experience) → V3 (Platform)

---

## The V3 Insight

V1 asked: "How do we generate a strategy for an investor?"
V2 asked: "How do we make the strategy feel personal and actionable?"
V3 asks: **"What if the investor's identity IS the product — and everything else orbits it?"**

The realization: a Financial Audit + Time Audit + Skills Inventory + Risk Profile + Investment Horizon doesn't just produce a strategy. It produces something far more valuable: a **verified, multidimensional investor identity** — one that is quantified, AI-enhanced, and evolves over time.

A strategy is a document you read once. An identity is something you live inside every day.

**The platform is the product. The identity is the platform.**

---

## 1. Product Definition

### What InvestorOS Is

InvestorOS is a **living investor intelligence platform** that constructs, maintains, and activates a real estate investor's professional identity through structured audits, AI-powered insights, and identity-aware CRM tools.

Every feature on the platform either **builds the identity**, **enriches the identity**, or **activates the identity**.

### What InvestorOS Is NOT

- A generic CRM with an assessment bolted on
- A strategy report generator
- A property listing aggregator
- A deal calculator (though one could attach later)

### The Identity Model

The Investor Identity is a structured, versioned, AI-enhanced profile composed of five audits. It is the single source of truth that powers every feature on the platform.

```
┌─────────────────────────────────────────────────────────┐
│                   INVESTOR IDENTITY                      │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ FINANCIAL│ │   TIME   │ │  SKILLS  │                │
│  │  AUDIT   │ │  AUDIT   │ │ INVENTORY│                │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘                │
│       │             │            │                       │
│  ┌────┴─────┐ ┌────┴─────┐                              │
│  │   RISK   │ │ HORIZON &│                              │
│  │ PROFILE  │ │  GOALS   │                              │
│  └────┬─────┘ └────┬─────┘                              │
│       │             │                                    │
│       └──────┬──────┘                                    │
│              ▼                                           │
│     ┌─────────────────┐                                  │
│     │  AI SYNTHESIS   │                                  │
│     │  Archetype +    │                                  │
│     │  Readiness +    │                                  │
│     │  Strategy Map   │                                  │
│     └────────┬────────┘                                  │
│              ▼                                           │
│     ┌─────────────────┐                                  │
│     │ LIVING IDENTITY │ ← Updates with every interaction │
│     └─────────────────┘                                  │
│                                                          │
│  Feeds into: CRM │ Strategy │ Roadmap │ Network │ Deals │
└─────────────────────────────────────────────────────────┘
```

---

## 2. The Five Audits (Identity Foundation)

Each audit is a self-contained module. Together, they form the investor's complete profile. Each audit can be taken independently and updated at any time. The AI synthesizes across all five to produce insights that no single audit could generate.

---

### Audit 1: Financial Audit

**Purpose:** Establish a verified picture of the user's financial capacity, constraints, and financing options.

**Why it matters for identity:** Your finances determine which doors are open to you *right now*. Two investors with the same goals but different financial profiles are fundamentally different investors.

#### Data Points

| Category | Data Point | Input Type | Identity Impact |
|---|---|---|---|
| **Income** | Primary income (annual) | Range bracket | Determines DTI and loan eligibility |
| | Secondary/side income | Currency input | Impacts qualifying income for loans |
| | Income stability (W-2 vs 1099 vs business) | Single-select | Affects underwriting path |
| | Income trend (growing/stable/declining) | Single-select | Shapes timeline aggressiveness |
| **Assets** | Liquid cash/savings | Currency range | Immediate deployment capacity |
| | Retirement accounts (401k/IRA) | Currency range | Self-directed IRA opportunity |
| | Existing RE equity | Currency range | HELOC/cash-out refi potential |
| | Other investments (stocks, crypto, etc.) | Currency range | Reallocation potential |
| | Business equity | Currency range | Collateral and leverage options |
| **Liabilities** | Total monthly debt payments | Currency input | DTI calculation |
| | Mortgage/rent payment | Currency input | House hack savings potential |
| | Student loans | Currency input | IBR/forgiveness intersection |
| | Auto loans/leases | Currency input | Quick payoff opportunity |
| | Credit card balances | Currency input | Priority paydown indicator |
| **Credit** | Credit score range | Bracket selector | Loan product eligibility |
| | Credit history length | Bracket selector | Underwriting factor |
| | Recent hard inquiries | Numeric | Rate shopping awareness |
| **Tax** | Filing status | Single-select | Depreciation and write-off impact |
| | Effective tax rate range | Bracket | RE tax benefit quantification |
| | Does an accountant handle taxes | Yes/No | Professional network indicator |

#### AI-Derived Financial Insights (Generated, Not Collected)
- Estimated debt-to-income ratio
- Financing paths available (conventional, FHA, DSCR, hard money, private, seller financing)
- Maximum estimated purchase power
- Recommended reserves (6-month buffer calculation)
- Financial readiness score (0–100 sub-score)
- Top financial strength and top financial constraint

---

### Audit 2: Time Audit

**Purpose:** Quantify the user's actual available time and determine how time-intensive their strategy can realistically be.

**Why it matters for identity:** Time is the most lied-about variable in real estate. Someone who says "I want passive income" but has 25 free hours/week is a different investor than someone with 3 hours/week. The Time Audit forces honest accounting.

#### Data Points

| Category | Data Point | Input Type | Identity Impact |
|---|---|---|---|
| **Availability** | Work hours per week (primary job) | Slider | Remaining capacity |
| | Commute hours per week | Slider | Hidden time cost |
| | Family/caregiving hours per week | Slider | Non-negotiable commitments |
| | Current side projects or businesses | Text + hours | Competing priorities |
| | Hours realistically available for RE per week | Derived + confirmed | True capacity |
| **Flexibility** | Can you take calls during work hours? | Yes/Sometimes/No | Deal responsiveness |
| | Can you visit properties on weekdays? | Yes/Sometimes/No | Market access |
| | Travel flexibility for out-of-state deals | Yes/Limited/No | Geographic range |
| | Seasonal availability changes | Yes/No + detail | Timing windows |
| **Preference** | Hands-on involvement preference | Slider: fully passive → fully active | Strategy filter |
| | Willing to learn new skills (time investment) | Yes/Some/No | Growth trajectory |
| | Management preference | Self-manage / hybrid / fully outsource | Operational model |
| **Runway** | How long can you sustain this time commitment? | Bracket (months/years) | Burnout risk |
| | What would change your availability? | Multi-select (job change, kids, move) | Future state planning |

#### AI-Derived Time Insights
- Realistic time allocation per week (adjusted for optimism bias)
- Strategy compatibility filter (eliminates strategies requiring more time than available)
- Time investment efficiency score (best return on time for this profile)
- Burnout risk assessment
- Time readiness score (0–100 sub-score)

---

### Audit 3: Skills & Experience Inventory

**Purpose:** Map the user's existing skills, professional background, and real estate experience to identify advantages, transferable skills, and critical gaps.

**Why it matters for identity:** A contractor with no RE experience has a massive hidden advantage in value-add strategies. A marketing executive might be perfect for creative deal sourcing. Skills aren't just a background check — they're a **strategic weapon** the AI can deploy.

#### Data Points

| Category | Data Point | Input Type | Identity Impact |
|---|---|---|---|
| **RE Experience** | Number of RE deals closed | Numeric | Calibrates complexity level |
| | Types of deals done | Multi-select | Strategy experience map |
| | Current RE holdings | Structured (property count, type, value) | Portfolio baseline |
| | Biggest RE success | Optional free text | Confidence and pattern indicator |
| | Biggest RE failure or lesson | Optional free text | Risk awareness calibration |
| **Professional** | Current profession/industry | Select + text | Transferable skill mapping |
| | Years in current field | Numeric | Depth of expertise |
| | Management experience | Yes/No + scale | Team leadership readiness |
| | Negotiation frequency in job | Scale | Deal-making aptitude |
| | Analytical/financial skills in job | Scale | Underwriting capability |
| **Transferable Skills** | Construction/renovation knowledge | Scale (none → expert) | Value-add feasibility |
| | Sales/marketing ability | Scale | Deal sourcing capability |
| | Legal/contract familiarity | Scale | Risk management aptitude |
| | Accounting/bookkeeping | Scale | Self-management capability |
| | Project management | Scale | Rehab/development readiness |
| | Technology/data skills | Scale | Analysis and automation edge |
| **Education** | RE-specific education/courses completed | Multi-select + text | Knowledge baseline |
| | Licenses or certifications | Multi-select | Credential advantages |
| | Currently learning (books, podcasts, courses) | Text | Trajectory and commitment |
| **Network** | Do you know a RE agent? | Yes (quality rating) / No | Network gap #1 |
| | Do you know a lender? | Yes (quality rating) / No | Network gap #2 |
| | Do you know a contractor? | Yes (quality rating) / No | Network gap #3 |
| | Do you know a RE attorney? | Yes (quality rating) / No | Network gap #4 |
| | Do you know a CPA with RE experience? | Yes (quality rating) / No | Network gap #5 |
| | Do you know other active investors? | Yes (how many) / No | Mentorship and deal flow |
| | Do you have a mentor? | Yes / No | Guidance availability |

#### AI-Derived Skills Insights
- Transferable skill advantage map (which RE strategies your professional skills amplify)
- Critical skill gaps ranked by impact on recommended strategy
- Network completeness score (how ready is your team)
- Experience calibration (beginner/intermediate/advanced, verified against actual data, not self-report)
- Skills readiness score (0–100 sub-score)
- Hidden advantages: "Your project management background gives you a 2x advantage in managing rehab timelines vs. the average beginner investor"

---

### Audit 4: Risk Profile

**Purpose:** Go beyond "conservative/moderate/aggressive" to build a nuanced, multi-axis risk profile that reflects how the user actually processes risk — not just what they say.

**Why it matters for identity:** Self-reported risk tolerance is unreliable. Someone who says "aggressive" might panic at their first vacancy. The Risk Audit uses scenario-based questions and behavioral indicators to build an honest risk map.

#### Data Points

| Category | Data Point | Input Type | Identity Impact |
|---|---|---|---|
| **Self-Assessment** | How would you describe your risk tolerance? | Scale: very conservative → very aggressive | Baseline (but not trusted alone) |
| | Have you ever lost money on an investment? How did you react? | Multi-select behavioral | Revealed preference vs stated preference |
| **Scenario Questions** | Your rental is vacant for 3 months. What do you do? | Multi-choice scenario | Stress response under cash flow pressure |
| | A property needs $30K in unexpected repairs. How do you feel? | Multi-choice scenario | Capital shock tolerance |
| | Market values drop 15% one year after your purchase. What do you do? | Multi-choice scenario | Paper loss tolerance |
| | You find a deal that needs a decision in 48 hours. Do you move? | Multi-choice scenario | Decision speed under pressure |
| | A partner proposes a deal outside your target market. What do you do? | Multi-choice scenario | Flexibility vs discipline |
| **Financial Safety** | Emergency fund (months of expenses) | Bracket | Safety net depth |
| | Other income sources if primary job is lost | Yes/No + detail | Downside protection |
| | Dependents | Numeric | Responsibility factor |
| | Insurance coverage quality | Self-assessed scale | Risk mitigation awareness |
| **Behavioral Indicators** | How do you react to stock market drops? | Multi-choice | Portfolio behavior proxy |
| | Do you check investments daily/weekly/monthly/rarely? | Single-select | Anxiety and engagement level |
| | Have you ever made a panic financial decision you regretted? | Yes/No + optional detail | Self-awareness indicator |
| **Comfort Zones** | Maximum comfortable leverage (LTV) | Bracket selector | Debt comfort |
| | Maximum amount you'd risk on a single deal | Currency input | Concentration risk tolerance |
| | Comfortable with out-of-state investing? | Yes/Maybe/No | Control need assessment |
| | Comfortable with partners/syndications? | Yes/Maybe/No | Trust and control preference |

#### AI-Derived Risk Insights
- **Stated vs Revealed Risk Gap:** "You describe yourself as aggressive, but your scenario responses suggest moderate risk tolerance. This isn't a problem — it means we should match you with strategies that feel bold but have built-in safety nets."
- True risk profile (adjusted from self-report using behavioral indicators)
- Risk capacity vs risk tolerance distinction (can afford risk vs. willing to take risk)
- Strategy-specific risk alignment (which strategies match your actual risk DNA)
- Risk readiness score (0–100 sub-score)

---

### Audit 5: Horizon & Goals

**Purpose:** Define what the user is actually building toward — not in vague terms, but in specific, quantified outcomes across multiple time horizons.

**Why it matters for identity:** Goals without timelines are dreams. This audit forces specificity and reveals contradictions the AI can address (e.g., wanting $10K/month cash flow in 2 years on $50K capital with 5 hours/week — the AI should flag this with empathy and a realistic alternative).

#### Data Points

| Category | Data Point | Input Type | Identity Impact |
|---|---|---|---|
| **Primary Objective** | Rank your investment priorities | Drag-rank: Cash flow, Appreciation, Tax benefits, Equity building, Retirement, Legacy/generational wealth, Exit primary job | Strategy weighting |
| **Financial Targets** | Monthly passive income goal | Currency input | Cash flow strategy driver |
| | Net worth goal from RE | Currency input | Wealth building target |
| | Target number of properties/units | Numeric or "no specific target" | Portfolio scale vision |
| | Annual return expectation | Percentage range | Expectation calibration |
| **Timeline** | When do you want first deal closed? | Bracket (months) | Urgency and pacing |
| | When do you want to be "financially free"? | Bracket (years) | Long-term horizon |
| | Retirement age target | Numeric | Retirement integration |
| | Exit strategy preference | Multi-select: hold forever, sell at peak, 1031 exchange, legacy transfer | End-game clarity |
| **Lifestyle** | Would you relocate for a deal? | Yes/Maybe/No | Geographic flexibility |
| | Would you house hack? | Yes/Maybe/No | Owner-occupant strategies |
| | Interested in full-time RE career? | Yes/Maybe/No | Professional transition path |
| | Family/spouse alignment on RE investing | Fully aligned / Supportive / Neutral / Resistant | Execution risk factor |
| **Constraints** | Geographic restrictions | Multi-select or text | Market filtering |
| | Property type exclusions | Multi-select | Strategy filtering |
| | Ethical/values constraints | Optional text | Strategy filtering |
| | Deal-breakers | Optional text | Hard boundary definition |

#### AI-Derived Goals Insights
- Goal feasibility analysis: "Based on your capital, time, and risk profile, your $10K/month cash flow target is achievable in 5–7 years, not 2. Here's why, and here's the accelerated path."
- Contradiction detection: "You ranked cash flow #1 but your risk profile suggests you'd be uncomfortable with the leverage required for high cash flow. Let's find the balance."
- Milestone mapping: AI generates specific milestones tied to the user's actual numbers
- Horizon readiness score (0–100 sub-score)

---

## 3. The Composite Identity (AI Synthesis Layer)

After all five audits are complete (or as each is completed), the AI synthesizes the data into the **Composite Investor Identity:**

### Identity Card
- **Investor Archetype** (from predefined set, AI-selected, with nuanced description)
- **Overall Readiness Score** (weighted composite of 5 sub-scores, 0–100)
- **Radar Chart** (6 axes: Capital, Time, Skills, Risk Tolerance, Network, Goal Clarity)
- **Headline Insight** (one-sentence AI-generated summary): "You're a high-income professional with strong analytical skills, moderate capital, and limited time — perfectly positioned for turnkey or BRRRR investing in emerging Midwest markets."

### Identity Depth Layers
| Layer | What It Contains | How It's Used |
|---|---|---|
| **Surface** | Archetype, score, radar chart | Dashboard, sharing, quick reference |
| **Strategic** | Strategy recommendations, fit scores, pros/cons | Strategy exploration and selection |
| **Tactical** | 72-hour micro-plan, full action plan, roadmap | Execution guidance |
| **Analytical** | Contradictions, feasibility checks, gaps | Self-awareness and course correction |
| **Evolutionary** | Score trends, audit history, milestone tracking | Long-term engagement and progress |

### Identity Versioning
Every time a user updates any audit or retakes an assessment, a new version of their identity is created. Previous versions are preserved. The platform can show:
- Score progression over time
- Radar chart evolution
- Strategy shifts as the identity changed
- "6 months ago you were a Conservative Builder. Now you're a Cash Flow Hunter. Here's what changed."

---

## 4. Identity-Aware CRM (The Platform Layer)

This is where V3 diverges most from V1/V2. The CRM isn't a separate module bolted onto the strategy engine. **The CRM is powered by the identity.** Every CRM feature is filtered, sorted, prioritized, and contextualized through the lens of who the user is as an investor.

### 4.1 Contact Management → Identity-Contextualized Network

**V1 CRM:** A list of contacts with names, emails, and tags.
**V3 CRM:** A network map where every contact is positioned relative to your investor identity.

#### How Contacts Relate to Identity
When a user adds a contact, the system asks (or AI suggests):
- **Role in your investment journey:** Agent, Lender, Contractor, Attorney, CPA, Mentor, Partner, Seller, Property Manager, Other
- **Relevant to which strategy:** Auto-tagged based on the user's active strategies
- **Network gap filled:** "You had no lender in your network. Adding this contact improves your Network score from 42 to 58."

#### AI-Powered Contact Features
- **Network Gap Alerts:** "Your active strategy requires a contractor relationship. You don't have one yet. Would you like tips on finding one in [your market]?"
- **Contact Relevance Scoring:** As the user's identity evolves, contacts are re-scored. A contact tagged as "commercial lender" becomes more relevant if the user's strategy shifts toward commercial properties.
- **Relationship Health Tracking:** Simple "last contacted" tracking with AI nudges: "You haven't spoken to your agent in 45 days. Active deal flow requires monthly check-ins."

### 4.2 Deal Pipeline → Identity-Scored Opportunities

**Traditional CRM:** Deals tracked through stages (lead → prospect → offer → close).
**V3 CRM:** Every deal is scored against the user's identity before it even enters the pipeline.

#### Identity-Deal Fit Score
When a user adds a potential deal (manually or via future integrations), the system evaluates:
- Does this property type match the identity's strategy?
- Is the price within the identity's financial capacity?
- Is the location within the identity's geographic preference?
- Does the time commitment match the identity's time audit?
- Does the risk level match the identity's risk profile?

**Result:** A 0–100 **Identity Fit Score** per deal, with a breakdown: "This deal scores 78. Strong fit on price and location. Moderate risk flag: rehab timeline may exceed your available hours. Network gap: you'll need a contractor for this one."

#### Why This Matters
Most CRM deal pipelines treat all deals equally. The user has to mentally filter "is this right for me?" on every deal. Identity-scoring does that automatically. The user's pipeline is pre-prioritized by who they actually are.

### 4.3 Task Management → Identity-Driven Action System

**Traditional CRM:** A to-do list.
**V3 CRM:** Tasks are generated, prioritized, and contextualized by the identity and its associated strategy.

#### Task Sources
1. **AI-generated tasks** from the action plan and 72-hour micro-plan
2. **Identity gap tasks:** "Your Network score is 42. Here are 3 tasks to improve it."
3. **Deal-specific tasks:** Once a deal is in the pipeline, tasks are generated based on deal stage and identity fit
4. **User-created tasks** (manual, as in any CRM)

#### AI Task Intelligence
- Tasks are ordered by **identity impact** (which task moves the needle most on your readiness score or strategy progress?)
- Due date suggestions based on the user's roadmap timeline
- Time estimates calibrated to the user's time audit ("This task takes most people 2 hours, but given your analytical background, likely 45 minutes for you")

### 4.4 Dashboard → Identity Command Center

The dashboard is not a collection of widgets. It's a **single-screen answer to "Where am I and what should I do next?"**

#### Dashboard Sections

**Top: Identity Snapshot**
- Archetype badge + Readiness Score (prominent, always visible)
- Mini radar chart
- Score trend sparkline (last 90 days)

**Middle: Active Focus**
- Currently active strategy (with progress indicator)
- Next 3 priority tasks (identity-ranked)
- Deal pipeline summary (if deals exist) with top-scored deal highlighted

**Bottom: Intelligence Feed**
- AI-generated insights based on identity changes: "Your credit score improved — you now qualify for conventional financing. This unlocks 3 new strategies."
- Network health alerts
- Milestone progress updates
- "What if" prompts: "You're 2 months ahead of your roadmap. Want to explore accelerating your timeline?"

---

## 5. Platform Intelligence (AI Services Architecture)

### 5.1 Identity Synthesis Service
- **Trigger:** Any audit completion or update
- **Input:** All current audit data
- **Output:** Updated composite identity (archetype, scores, radar, insights)
- **Frequency:** Real-time on audit change

### 5.2 Strategy Generation Service
- **Trigger:** Identity synthesis completion (when sufficient audit data exists)
- **Input:** Composite identity
- **Output:** Strategy recommendations, action plan, roadmap, micro-plan
- **Frequency:** On-demand or when identity changes significantly (score shift > 10 points)

### 5.3 Simulation Service
- **Trigger:** User adjusts a variable on the strategy page
- **Input:** Current identity + modified parameter(s)
- **Output:** Delta strategy showing what changes and why
- **Frequency:** On-demand, rate-limited (3 per session)

### 5.4 Identity Insight Engine
- **Trigger:** Continuous background process on identity data
- **Input:** Full identity history, CRM data, task completion data
- **Output:** Proactive insights, nudges, contradiction alerts, milestone updates
- **Examples:**
  - "You've completed 8 of 12 action plan items. You're 2 weeks ahead of schedule."
  - "Your time audit says 5 hours/week, but your task completion suggests you're investing 12+ hours. Consider updating your Time Audit — it may unlock more active strategies."
  - "You added 3 contacts this month. Your Network score improved from 42 to 67."

### 5.5 Deal Scoring Service
- **Trigger:** Deal added to pipeline
- **Input:** Deal parameters + user's composite identity
- **Output:** Identity Fit Score + breakdown + gap alerts
- **Frequency:** On deal creation or identity update

### Prompt Architecture (All Services)

All AI services use a **modular prompt assembly** pattern:

```
┌────────────────────────────────────┐
│         SYSTEM PROMPT              │
│  Role definition + output schema   │
│  + guardrails + disclaimers        │
├────────────────────────────────────┤
│         IDENTITY CONTEXT           │
│  Serialized composite identity     │
│  (all 5 audits, summarized)        │
├────────────────────────────────────┤
│         SERVICE-SPECIFIC BLOCK     │
│  Strategy: "Generate strategies"   │
│  Simulation: "Show delta for X"    │
│  Scoring: "Score this deal"        │
│  Insight: "Analyze this pattern"   │
├────────────────────────────────────┤
│         OUTPUT FORMAT SPEC         │
│  JSON schema for structured parse  │
└────────────────────────────────────┘
```

Prompts are stored as **versioned templates** — editable without redeployment. This enables rapid prompt iteration based on output quality feedback.

---

## 6. Data Model (Core Entities)

```
tenants
  └── users
        ├── audits
        │     ├── financial_audits (versioned)
        │     ├── time_audits (versioned)
        │     ├── skills_audits (versioned)
        │     ├── risk_audits (versioned)
        │     └── horizon_audits (versioned)
        │
        ├── identity_versions
        │     ├── archetype
        │     ├── readiness_score
        │     ├── sub_scores (JSON)
        │     ├── radar_data (JSON)
        │     ├── ai_insights (JSON)
        │     └── generated_at
        │
        ├── strategies
        │     ├── strategy_recommendations (JSON)
        │     ├── action_plans
        │     │     └── action_items (with completion tracking)
        │     ├── roadmaps
        │     │     └── milestones (with progress tracking)
        │     └── micro_plans
        │           └── micro_tasks (72-hour items)
        │
        ├── contacts
        │     ├── role_type
        │     ├── strategy_relevance (derived)
        │     ├── network_gap_filled (derived)
        │     └── last_contacted
        │
        ├── deals
        │     ├── property_details
        │     ├── identity_fit_score (derived)
        │     ├── fit_breakdown (JSON)
        │     ├── pipeline_stage
        │     └── tasks
        │
        ├── tasks
        │     ├── source (ai_generated | identity_gap | deal | manual)
        │     ├── identity_impact_score
        │     └── completion_tracking
        │
        └── simulations
              ├── base_identity_version_id
              ├── modified_parameters (JSON)
              └── result_delta (JSON)

activity_logs (cross-cutting)
  ├── event_type
  ├── user_id / tenant_id
  ├── payload
  └── timestamp

prompt_templates (system-level)
  ├── service_type
  ├── version
  ├── template_content
  └── active (boolean)
```

---

## 7. MVP Scope — The Identity-First Build

### What's In MVP

| Feature | Why It's In | Identity Relationship |
|---|---|---|
| All 5 Audits (conversational + form modes) | The audits ARE the identity | Builds identity |
| AI Identity Synthesis (archetype, score, radar) | The core value proposition | IS the identity |
| Strategy Generation (3 strategies + action plan + roadmap + micro-plan) | Activates the identity into a plan | Activates identity |
| "What If" Simulation (3 per session) | Exploration deepens identity understanding | Enriches identity |
| Investment Blueprint PDF | Tangibility and shareability | Exports identity |
| Identity Dashboard (snapshot + tasks + intelligence feed) | Daily engagement surface | Reflects identity |
| Identity Versioning & History | Progress tracking drives retention | Evolves identity |
| Contact Management (identity-contextualized) | First CRM feature, identity-aware | Activates identity |
| Authentication + Multi-Tenancy + JWT + RBAC | Security and SaaS foundation | Protects identity |
| Database Logging + Engagement Tracking | Operational intelligence | Observes identity |

### What's Post-MVP

| Feature | Why It Waits | When It Makes Sense |
|---|---|---|
| Deal Pipeline with Identity Scoring | Needs contacts + strategy to be useful | V3.1 — after users have active strategies |
| Identity-Driven Task System | Start with AI-generated tasks only; full system later | V3.1 — when users are executing plans |
| Notification System (email + in-app) | Identity insights need a delivery channel | V3.2 — when there are events to notify about |
| Market Data Integration | Enrich strategy with live data | V3.2 — when strategy engine is validated |
| Community / Investor Matching | Match by archetype and market | V3.3 — needs critical mass |
| Team / Partner Collaboration | Shared identities, joint strategies | V3.3 — enterprise/team feature |
| Payment / Subscription | Monetize after engagement is proven | V3.2 — when retention metrics validate |
| Mobile Native App | Responsive web first | V3.4 — when daily usage patterns demand it |
| Property Deal Analyzer | Calculator layered on identity | V3.2 — high value but separate module |

---

## 8. User Journey (MVP)

### First Session: Identity Construction (15–20 minutes)

```
Landing Page → "Build Your Investor Identity" CTA →
  Sign Up (email/password) →
  Identity Hub (empty state: 5 audits shown as cards, all "Not Started") →
  
  User taps Financial Audit →
    Conversational AI walkthrough (or speed-mode form) →
    ~4 min → Financial sub-score revealed →
  
  User taps Time Audit →
    Conversational AI walkthrough →
    ~2 min → Time sub-score revealed →
  
  [Continue for Skills, Risk, Horizon...] →
  
  All 5 Complete → AI Synthesis Triggered →
  
  Identity Card Reveal (archetype + score + radar + headline insight) →
  Strategy Recommendations (3 cards with fit scores) →
  72-Hour Micro-Plan →
  Full Action Plan + Roadmap →
  
  "Download Your Investment Blueprint" CTA →
  Dashboard (now populated with identity, tasks, insights)
```

### Progressive Disclosure Option
Users don't HAVE to complete all 5 audits in one session. The platform shows partial identity after each audit with increasing clarity:

- **1 audit complete:** "We're getting to know you. Complete more audits for sharper insights."
- **2–3 audits complete:** Partial radar chart. "We can see your financial and time profile. Add Skills and Risk for strategy recommendations."
- **4 audits complete:** "Almost there. Your Horizon audit will unlock your full Investor Identity and personalized strategy."
- **5 audits complete:** Full identity synthesis, strategy generation, everything unlocked.

This reduces first-session friction while incentivizing full completion.

### Return Sessions: Identity Activation (5–10 minutes)

```
Login → Dashboard →
  Identity Snapshot (score, archetype, trend) →
  Today's Priority Tasks (3 items, identity-ranked) →
  Intelligence Feed (new insights since last visit) →
  
  Optional: Update an audit → Identity re-synthesized → New version created →
  Optional: Explore "What If" simulation →
  Optional: Add a contact → Network score updates →
  Optional: Download updated Blueprint
```

### Long-Term: Identity Evolution (Monthly)

```
Monthly prompt (email or in-app): "It's been 30 days. Has anything changed?" →
  Quick audit update flow (only changed fields) →
  New identity version →
  Strategy re-evaluation if score shifted > 10 points →
  Progress comparison: "Last month vs this month" →
  Milestone check-in: "You planned to have a lender by now. Did you?"
```

---

## 9. Technical Architecture

### Frontend
- **Framework:** React / Next.js
- **State Management:** React Context + server persistence per audit phase
- **Key Components:**
  - Conversational Assessment Engine (chat UI + quick-reply buttons + state machine)
  - Form-Mode Assessment (fallback, same data model)
  - Identity Card Component (archetype badge, score gauge, radar chart)
  - Strategy Cards with Simulation Sliders
  - Roadmap Timeline (interactive, milestone-based)
  - Dashboard Shell (identity snapshot + task list + intelligence feed)
  - Contact Manager (identity-contextualized list view)
  - Blueprint PDF trigger (server-side generation, client-side download)

### Backend
- **Pattern:** Modular monolith (microservices-ready). Clean service boundaries with shared database for MVP. Split into true microservices when scale demands.
- **Architecture:** Unit of Work + Repository Pattern. Each service has its own repository layer.
- **API:** RESTful with JWT authentication. Versioned endpoints (v1/).

#### Service Map

| Service | Responsibility | Identity Relationship |
|---|---|---|
| **Auth Service** | Registration, login, JWT, RBAC, tenant management | Protects |
| **Audit Service** | CRUD for all 5 audits, validation, versioning | Builds |
| **Identity Service** | Synthesis, scoring, archetype assignment, versioning | IS |
| **Strategy Service** | Prompt assembly, LLM calls, response parsing, caching | Activates |
| **Simulation Service** | Delta prompts, comparison logic | Enriches |
| **Contact Service** | CRUD, identity-contextualized scoring, gap analysis | Extends |
| **Task Service** | AI-generated + manual tasks, identity-impact ranking | Drives |
| **Blueprint Service** | PDF generation (HTML template → server-side render) | Exports |
| **Insight Engine** | Background analysis, nudge generation, contradiction detection | Evolves |
| **Logging Service** | Activity tracking, engagement metrics, audit trail | Observes |

### Database
- **Primary:** PostgreSQL
- **Tenant Isolation:** Tenant ID on all tables + row-level security
- **Versioning:** Audit and identity tables use append-only versioning (new rows, not updates)
- **JSON Columns:** Used for flexible/evolving data (AI outputs, radar scores, insights)

### AI Integration
- **Provider:** Anthropic Claude API
- **Prompt Templates:** Stored in database, versioned, hot-swappable
- **Rate Management:** Queue-based processing for strategy generation; synchronous for simulation (with timeout)
- **Cost Controls:** Cache identical assessment profiles; limit simulations; monitor token usage per user
- **Fallback:** Retry with stricter format prompt on parse failure; graceful error UX on sustained failure

---

## 10. Success Metrics

### Identity Engagement Metrics

| Metric | Target | Signal |
|---|---|---|
| Audit completion rate (all 5) | > 60% of users who start audit 1 | Assessment UX is working |
| Average audits per first session | ≥ 3 | Progressive disclosure is motivating |
| Time to full identity | < 20 min | Audits aren't too long |
| Identity score improvement (30-day) | > 20% of users improve score | Users are acting on plans |
| Audit update rate (30-day) | > 25% update at least 1 audit | Identity is perceived as living |

### Strategy & Action Metrics

| Metric | Target | Signal |
|---|---|---|
| Strategy generation success rate | > 95% | AI pipeline is reliable |
| 72-hour micro-plan task completion | > 50% complete ≥ 1 task | Micro-plan drives action |
| Action plan engagement (30-day) | > 40% complete ≥ 3 items | Users are executing |
| Simulation usage | > 35% of users try ≥ 1 | "What if" is compelling |
| Blueprint download rate | > 55% of users with full identity | Tangibility resonates |

### Platform & CRM Metrics

| Metric | Target | Signal |
|---|---|---|
| Contacts added (30-day) | > 40% of active users add ≥ 1 | CRM is being used |
| Dashboard return rate (7-day) | > 45% | Daily engagement surface works |
| Session duration (return visits) | > 4 min average | Platform has depth |
| Net Promoter Score | > 50 | Users would recommend |

---

## 11. Build Sequence

### Phase 1 — Foundation (Weeks 1–3)
Project scaffolding, PostgreSQL schema (with versioning), auth service (JWT + RBAC), tenant isolation, logging infrastructure, API skeleton. Deploy "hello world" end-to-end.

### Phase 2 — Audit Engine (Weeks 3–8)
Build all 5 audits — both conversational and form modes. Start with Financial and Time (highest data density), then Skills, Risk, Horizon. Each audit is independently testable. Implement progressive disclosure logic (partial identity states). This is the longest phase because the audits ARE the product.

### Phase 3 — Identity Synthesis (Weeks 6–9)
Build the Identity Service: prompt assembly, LLM call for synthesis, response parsing, archetype assignment, scoring algorithm, radar chart data generation. Test with real audit data from Phase 2. Iterate on prompt quality aggressively — this is the make-or-break moment.

### Phase 4 — Strategy & Action (Weeks 8–11)
Strategy Generation Service: expanded prompt, 3-strategy output, action plan, roadmap, micro-plan. Simulation Service: delta prompts, diff display. Blueprint PDF: HTML template, server-side rendering, download flow.

### Phase 5 — Dashboard & CRM (Weeks 10–13)
Dashboard: identity snapshot, priority tasks, intelligence feed. Contact Manager: identity-contextualized CRUD, network gap scoring. Task list: AI-generated tasks from action plan, manual task creation.

### Phase 6 — Results Experience & Polish (Weeks 12–14)
Wire everything together. Identity Card reveal UX. Strategy cards with simulation. Roadmap timeline. End-to-end flow testing. Prompt quality iteration. Performance optimization (conversational assessment latency).

### Phase 7 — QA, Security & Soft Launch (Weeks 14–16)
Security review (financial data handling, tenant isolation verification). Load testing on AI pipeline. UAT with 20–30 real users. Prompt refinement based on real identity data. Iterate.

**Total: ~16 weeks to a differentiated, identity-centric MVP.**

---

## 12. The Strategic Moat

Here's why the identity-first approach creates a defensible product:

**1. Data Compounding:** Every interaction makes the identity richer. After 6 months, a user's identity represents dozens of data points, multiple versions, and a history of decisions. Switching costs are enormous — not because of lock-in, but because of accumulated self-knowledge.

**2. AI Quality Flywheel:** More identities → better prompt patterns → better AI output → more users → more identities. The prompt templates improve as we see which identity configurations produce the best strategies.

**3. Network Effects (Post-MVP):** When you can match investors by archetype, market, and complementary skills, the platform becomes a network, not just a tool. "You're a Cash Flow Hunter in Dallas with contractor skills. Here are 3 Wealth Architects in Dallas who need a partner with your profile."

**4. CRM Lock-In Through Relevance:** Every CRM feature is filtered through the identity. Contacts aren't just contacts — they're positioned in the user's investment journey. Deals aren't just deals — they're scored against who the user actually is. No generic CRM can replicate this without rebuilding the identity engine.

**5. The Identity Becomes a Credential.** Long-term, a verified Investor Identity — backed by financial audits, demonstrated knowledge, and tracked progress — could become something users present to lenders, partners, and sellers. "Here's my InvestorOS profile" becomes the investor equivalent of a LinkedIn profile. That's the endgame.

---

*V3 doesn't just build a better tool. It builds a platform that knows you better than you know yourself as an investor — and gets smarter every time you use it.*
