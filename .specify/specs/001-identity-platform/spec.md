# Feature Specification: InvestorOS Identity Platform

**Feature:** Identity-Centric Real Estate Investment Platform
**Created:** 2026-04-03
**Status:** Draft
**Short Name:** identity-platform

---

## Overview

InvestorOS is a living investor intelligence platform that constructs, maintains, and activates a real estate investor's professional identity through structured audits, AI-powered insights, and identity-aware CRM tools. The platform's core premise is that a verified, multidimensional investor identity — built from five structured audits — becomes the foundation that powers every feature: strategy recommendations, action plans, contact management, and deal evaluation.

Every feature on the platform either **builds the identity**, **enriches the identity**, or **activates the identity**.

---

## Clarifications

### Session 2026-04-03

- Q: What is the tenant-user relationship model for MVP? → A: 1:1 — each user is automatically assigned their own tenant on registration (simplest MVP model, team-ready schema for future expansion)
- Q: Can users save partial audit progress and resume later? → A: Yes — audits support save & resume with partial progress persisted across sessions
- Q: What is the data protection posture for sensitive financial data? → A: Field-level encryption for sensitive financial fields (income, credit score, debt amounts, tax rate) plus database-level encryption at rest
- Q: What does the user see when AI services fail after retries? → A: Friendly error message with a manual retry button; no partial or cached results are shown
- Q: How are investor archetypes defined? → A: Fixed curated set — AI selects from a predefined list of archetypes, expandable via configuration (prompt template updates) without code changes

---

## Problem Statement

Real estate investors lack a unified system that understands who they are as investors. Existing tools treat all investors the same — generic CRMs, one-size-fits-all strategy advice, and disconnected calculators. Investors must mentally filter every opportunity, contact, and decision through their own self-knowledge, which is often incomplete, unstructured, and biased by optimism.

There is no platform that:
- Quantifies an investor's complete profile across finances, time, skills, risk tolerance, and goals
- Uses that profile to automatically personalize every recommendation and prioritize every action
- Evolves the profile over time as circumstances change
- Turns self-knowledge into a living, actionable identity rather than a static report

---

## Target Users

### Primary User: Aspiring and Active Real Estate Investors
- Individuals exploring or actively engaged in real estate investing
- Range from complete beginners to intermediate investors with a few deals
- Employed professionals looking to build wealth through real estate alongside their primary career
- Seeking personalized guidance rather than generic advice

### Secondary User: Platform Administrators
- Manage tenant configurations and platform operations
- Monitor engagement metrics and AI output quality

---

## User Scenarios & Testing

### Scenario 1: First-Time Identity Construction
**Actor:** New investor signing up for the first time
**Flow:**
1. User arrives at landing page and clicks "Build Your Investor Identity"
2. User creates an account with email and password
3. User sees the Identity Hub with 5 audit cards, all showing "Not Started"
4. User selects the Financial Audit
5. User completes the audit through the form-based input mode
6. After completion (~4 min), the Financial sub-score is revealed
7. User continues with remaining audits (Time, Skills, Risk, Horizon)
8. After all 5 audits are complete, AI synthesis is triggered
9. User sees their Identity Card: archetype, readiness score, radar chart, headline insight
10. User receives 3 strategy recommendations with fit scores
11. User views their 72-hour micro-plan, full action plan, and roadmap
12. User downloads their Investment Blueprint PDF

**Acceptance Criteria:**
- All 5 audits are completable in under 20 minutes total
- Each audit produces a sub-score (0-100) immediately upon completion
- AI synthesis generates archetype, composite score, radar chart, and headline insight after all audits complete
- 3 strategy recommendations are generated with fit scores and pros/cons
- A 72-hour micro-plan with actionable tasks is generated
- Investment Blueprint PDF is downloadable

### Scenario 2: Progressive Identity Disclosure
**Actor:** New investor who completes only some audits in first session
**Flow:**
1. User completes 2 of 5 audits and stops
2. Platform shows a partial identity with available sub-scores
3. User sees a partial radar chart with messaging: "Complete more audits for sharper insights"
4. On return visit, user completes remaining audits
5. Full identity synthesis occurs when all 5 are done

**Acceptance Criteria:**
- Platform functions meaningfully with partial audit completion (1-4 audits)
- Messaging clearly communicates what additional audits will unlock
- At 4 audits complete, message indicates strategy recommendations require the final audit
- At 5 audits, full synthesis and strategy generation is triggered

### Scenario 3: Identity Evolution via Audit Update
**Actor:** Returning investor whose circumstances have changed
**Flow:**
1. User logs in and views their dashboard with current identity snapshot
2. User navigates to their Financial Audit and updates income and savings fields
3. A new version of the identity is created (previous version preserved)
4. AI re-synthesizes the composite identity with updated scores
5. If the score shift exceeds 10 points, strategy recommendations are re-evaluated
6. User can view score progression and compare current vs. previous identity versions

**Acceptance Criteria:**
- Audit updates create a new versioned record (append-only, no overwrites)
- Identity re-synthesis occurs automatically after any audit update
- Score progression is visible over time
- Radar chart evolution shows changes between versions
- Strategy re-evaluation triggers when composite score shifts more than 10 points

### Scenario 4: "What If" Simulation
**Actor:** Investor exploring how changes would affect their strategy
**Flow:**
1. User is viewing their strategy recommendations
2. User adjusts a variable (e.g., "What if I had $50K more in savings?")
3. System shows a delta view: what changes in their identity, scores, and strategy recommendations
4. User can run up to 3 simulations per session

**Acceptance Criteria:**
- Simulation shows clear before/after comparison
- Changes to identity scores, archetype, and strategy recommendations are displayed
- Users are limited to 3 simulations per session with clear indication of remaining simulations
- Simulations do not permanently alter the user's identity

### Scenario 5: Identity-Contextualized Contact Management
**Actor:** Investor building their professional network
**Flow:**
1. User adds a new contact (e.g., a real estate agent)
2. System prompts for or AI suggests: role type, strategy relevance, and which network gap this fills
3. User's Network score updates in real time (e.g., "42 to 58")
4. Dashboard shows network gap alerts: "Your strategy requires a contractor. You don't have one yet."
5. As user's identity evolves, contact relevance scores are recalculated

**Acceptance Criteria:**
- Contacts can be added with role type (Agent, Lender, Contractor, Attorney, CPA, Mentor, Partner, Seller, Property Manager, Other)
- Adding a contact updates the Network completeness score
- Network gap alerts surface on the dashboard when the active strategy requires a missing role
- Contact relevance is recalculated when the user's identity changes

### Scenario 6: Dashboard Return Visit
**Actor:** Returning investor checking daily progress
**Flow:**
1. User logs in and lands on the dashboard
2. Top section shows: archetype badge, readiness score, mini radar chart, 90-day trend sparkline
3. Middle section shows: active strategy with progress indicator, next 3 priority tasks (identity-ranked)
4. Bottom section shows: AI-generated insights since last visit, network health alerts, milestone progress
5. User completes a task; task list refreshes with the next highest-priority item

**Acceptance Criteria:**
- Dashboard loads with a complete identity snapshot
- Priority tasks are ranked by identity impact (which task moves the needle most)
- Intelligence feed shows new insights since the user's last visit
- Completing a task refreshes the task list automatically

### Scenario 7: Multi-Tenant Isolation
**Actor:** Two investors on the same platform
**Flow:**
1. User A and User B both have accounts
2. User A's audit data, identity, contacts, and strategies are completely invisible to User B
3. No cross-tenant data leakage occurs in any feature

**Acceptance Criteria:**
- All data queries are scoped by tenant/user
- No user can access, view, or infer another user's data
- Row-level security enforces tenant isolation at the data layer

---

## Functional Requirements

### FR-1: User Registration and Authentication
- Users can register with email and password
- Users can log in and receive a secure session token
- Role-based access control supports at minimum: investor (standard user) and admin roles
- Sessions expire after a configurable period of inactivity
- Password reset functionality is available

### FR-2: Five-Audit System
- **Financial Audit**: Collects income (brackets, stability, trend), assets (liquid, retirement, RE equity, other investments, business equity), liabilities (monthly debts, mortgage, student loans, auto loans, credit cards), credit (score range, history length, inquiries), and tax information (filing status, tax rate, accountant)
- **Time Audit**: Collects work hours, commute, caregiving, side projects, RE availability, flexibility (calls during work, weekday property visits, travel, seasonal changes), preferences (hands-on involvement, willingness to learn, management style), and runway (sustainability, future changes)
- **Skills & Experience Inventory**: Collects RE experience (deals closed, types, holdings, successes, failures), professional background (profession, years, management, negotiation, analytical skills), transferable skills (construction, sales, legal, accounting, project management, technology), education (courses, licenses, current learning), and network contacts (agent, lender, contractor, attorney, CPA, other investors, mentor)
- **Risk Profile**: Collects self-assessment, scenario-based behavioral questions (vacancy, unexpected repairs, market drops, time-pressured decisions, out-of-scope proposals), financial safety indicators (emergency fund, backup income, dependents, insurance), behavioral indicators (stock market reaction, check frequency, panic decisions), and comfort zones (leverage, single-deal risk, out-of-state, partners)
- **Horizon & Goals**: Collects primary objective ranking, financial targets (passive income goal, net worth goal, property count, return expectations), timeline (first deal, financial freedom, retirement, exit strategy), lifestyle preferences (relocation, house hacking, full-time RE, family alignment), and constraints (geographic, property type, ethical, deal-breakers)

### FR-3: Form-Based Audit Input and Persistence
- Each audit uses a form-based input mode (traditional form inputs with structured sections)
- Conversational AI walkthrough mode is deferred to post-MVP (CEO plan decision 2026-04-03)
- Partial audit progress is automatically saved and persists across sessions
- Users can resume an in-progress audit from where they left off
- Each audit has a lifecycle: Not Started → In Progress (draft saved) → Completed (sub-score generated)
- Sub-scores are calculated using deterministic rules-based formulas (not AI), ensuring consistent, testable scoring

### FR-4: AI Identity Synthesis
- After any audit completion or update, the system synthesizes all available audit data
- Synthesis produces: Investor Archetype (selected from a fixed, curated predefined set), Overall Readiness Score (weighted composite of 5 sub-scores, 0-100), Radar Chart data (6 axes: Capital, Time, Skills, Risk Tolerance, Network, Goal Clarity), and a one-sentence Headline Insight
- The archetype set is managed via configuration and expandable through prompt template updates without code changes
- When AI synthesis fails after retries, the user sees a friendly error message with a manual retry button; no partial or cached results are displayed
- Identity has depth layers: Surface (archetype, score, radar), Strategic (strategy recommendations, fit scores), Tactical (micro-plan, action plan, roadmap), Analytical (contradictions, feasibility checks, gaps), and Evolutionary (score trends, history, milestone tracking)

### FR-5: Identity Versioning
- Every audit update or re-assessment creates a new identity version
- Previous versions are preserved and accessible
- The platform displays score progression over time, radar chart evolution, strategy shifts between versions, and narrative comparisons (e.g., "6 months ago you were a Conservative Builder. Now you're a Cash Flow Hunter.")

### FR-6: Strategy Generation (Chained)
- When sufficient audit data exists (all 5 audits complete), the system generates 3 strategy recommendations with fit scores, pros/cons, and descriptions (AI Call 1)
- When a user activates a strategy, the system generates the detailed plan: action plan with trackable items, milestone-based roadmap, and 72-hour micro-plan (AI Call 2, only for the activated strategy)
- Non-activated strategies show fit scores, pros/cons, and description only (no detailed plans generated)
- When identity score shifts by more than 10 points, active strategies are flagged as needing refresh (user-initiated regeneration via banner prompt, not automatic)

### FR-7: "What If" Simulation
- Users can adjust identity variables to see how changes affect their scores and strategy recommendations
- Simulations show a delta view (before vs. after) with clear explanations of what changed and why
- Users are limited to 3 simulations per session
- Simulations do not alter the user's actual identity

### FR-8: Investment Blueprint PDF
- Users with a complete identity can generate and download a PDF document
- The PDF contains: identity card (archetype, score, radar chart), strategy recommendations, action plan, roadmap, and key insights
- The PDF is generated on the server and delivered for client-side download

### FR-9: Identity Dashboard
- **Top section**: Archetype badge, readiness score (prominent), mini radar chart, 90-day score trend sparkline
- **Middle section**: Currently active strategy with progress indicator, next 3 priority tasks (ranked by identity impact), deal pipeline summary with top-scored deal (post-MVP)
- **Bottom section**: AI-generated intelligence feed (insights based on identity changes, network health alerts, milestone progress, "what if" prompts)

### FR-10: Identity-Contextualized Contact Management
- Users can add, edit, and remove contacts
- Each contact has: name, contact information, role type (Agent, Lender, Contractor, Attorney, CPA, Mentor, Partner, Seller, Property Manager, Other), strategy relevance (auto-tagged), network gap filled indicator, and last contacted date
- Adding or removing contacts updates the user's Network completeness score
- Network gap alerts surface when the active strategy requires a role the user's network lacks
- Contact relevance scores recalculate when the user's identity evolves
- Relationship health tracking with nudges based on "last contacted" date

### FR-11: AI-Generated Tasks
- Tasks are generated from the action plan and 72-hour micro-plan
- Identity gap tasks are generated (e.g., "Your Network score is 42. Here are 3 tasks to improve it.")
- Tasks are ordered by identity impact (which task most improves readiness score or strategy progress)
- Tasks include AI-calibrated time estimates based on the user's skills profile
- Users can also create manual tasks

### FR-12: AI Insight Engine
- Continuously analyzes identity data, CRM data, and task completion data
- Generates proactive insights: progress updates, contradiction detection (e.g., stated time vs. actual engagement), score change explanations, and milestone check-ins
- Insights are surfaced in the dashboard intelligence feed

### FR-13: Multi-Tenancy and Data Isolation
- Each user is automatically assigned their own tenant upon registration (1:1 model for MVP)
- All data is scoped by tenant
- Row-level security ensures no cross-tenant data access
- Tenant ID is present on all data records
- The tenant abstraction supports future expansion to multi-user tenants (teams) without schema migration

### FR-14: Sensitive Data Protection
- Sensitive financial fields (income, credit score, debt amounts, tax rate) are encrypted at the field level before storage
- Database-level encryption at rest is enabled for all data
- Data in transit is protected via HTTPS
- Encryption keys are managed server-side and never exposed to clients

### FR-15: Activity Logging
- All significant user actions are logged: audit completions, identity syntheses, strategy generations, contact additions, task completions, simulation runs, blueprint downloads
- Logs include event type, user/tenant ID, payload, and timestamp
- Engagement metrics are tracked for platform health monitoring

### FR-16: AI Prompt Management
- AI prompts are stored as versioned templates
- Templates can be updated without redeploying the application
- All AI services use a modular prompt assembly pattern (system prompt + identity context + service-specific block + output format)
- Failed AI responses trigger a retry with stricter formatting instructions; if retries are exhausted, a friendly error with a manual retry button is displayed (no partial or cached results)

---

## Success Criteria

| # | Criterion | Target | Measurement Method |
|---|-----------|--------|-------------------|
| 1 | Users who start the first audit complete all 5 audits | > 60% completion rate | Track audit starts vs. all-5 completions |
| 2 | Average number of audits completed in first session | >= 3 audits | Measure audits completed before first session ends |
| 3 | Time to complete all 5 audits | < 20 minutes | Measure elapsed time from first audit start to fifth audit completion |
| 4 | Users improve their readiness score within 30 days | > 20% of users | Compare readiness scores at day 1 vs. day 30 |
| 5 | Users update at least 1 audit within 30 days | > 25% of active users | Track audit update events within 30-day windows |
| 6 | AI successfully generates strategies when all audits are complete | > 95% success rate | Track strategy generation attempts vs. successful outputs |
| 7 | Users complete at least 1 task from their 72-hour micro-plan | > 50% of users with a micro-plan | Track task completions within 72 hours of plan generation |
| 8 | Users engage with their action plan within 30 days | > 40% complete >= 3 action items | Track action item completions per user |
| 9 | Users try at least 1 "What If" simulation | > 35% of users with a full identity | Track simulation usage |
| 10 | Users download their Investment Blueprint PDF | > 55% of users with a full identity | Track blueprint download events |
| 11 | Active users add at least 1 contact within 30 days | > 40% | Track contact creation events |
| 12 | Users return to the dashboard within 7 days | > 45% return rate | Track unique dashboard visits within 7-day windows |
| 13 | Average session duration for return visits | > 4 minutes | Measure session length for non-first visits |
| 14 | Net Promoter Score | > 50 | Survey-based measurement |

---

## Key Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| **User** | An investor using the platform | Email, password (hashed), role, tenant association |
| **Tenant** | Organizational unit for data isolation (1:1 with user for MVP) | Tenant ID, configuration, auto-created on user registration |
| **Audit** | An assessment (5 types, versioned) with draft support | Type (financial/time/skills/risk/horizon), status (not_started/in_progress/completed), version, responses (partial or complete), sub-score, last saved date, completed date |
| **Investor Identity** | AI-synthesized composite profile | Archetype, readiness score, sub-scores, radar data, AI insights, version, generated date |
| **Strategy** | AI-generated investment strategy recommendation | Fit score, description, pros/cons, associated identity version |
| **Action Plan** | Ordered list of strategic actions | Items with completion tracking, linked to strategy |
| **Roadmap** | Timeline of milestones | Milestones with target dates and progress tracking |
| **Micro-Plan** | 72-hour immediate action items | Tasks with time estimates and priority |
| **Contact** | A person in the investor's professional network | Name, contact info, role type, strategy relevance, network gap filled, last contacted |
| **Task** | An action item for the investor | Source (AI-generated/identity-gap/deal/manual), identity impact score, completion status |
| **Simulation** | A "What If" scenario exploration | Base identity version, modified parameters, result delta |
| **Activity Log** | Record of platform events | Event type, user/tenant ID, payload, timestamp |
| **Prompt Template** | Versioned AI prompt configuration | Service type, version, template content, active flag |

---

## Scope Boundaries

### In Scope (MVP)
- All 5 audits with form-based input mode (conversational mode deferred to post-MVP)
- AI identity synthesis (archetype, scores, radar chart, insights)
- Strategy generation (3 strategies with chained detail generation on activation)
- "What If" simulation (3 per 24-hour rolling window)
- Shareable identity card (public URL with HMAC-signed token)
- Post-synthesis feedback prompt (1-5 rating)
- Health check endpoint
- AI prompt/response audit logging
- Guided audit ordering in onboarding
- Investment Blueprint PDF generation and download
- Identity dashboard (snapshot, tasks, intelligence feed)
- Identity versioning and history
- Contact management (identity-contextualized)
- User authentication with role-based access control
- Multi-tenancy with data isolation
- Activity logging and engagement tracking
- AI prompt template management

### Out of Scope (Post-MVP)
- Conversational AI audit walkthrough mode (deferred from MVP per CEO plan 2026-04-03)
- Identity version narrative comparison ("6 months ago you were X, now you're Y")
- Deal pipeline with identity scoring (V3.1)
- Full identity-driven task system beyond AI-generated tasks (V3.1)
- Notification system — email and in-app (V3.2)
- Market data integration (V3.2)
- Payment and subscription management (V3.2)
- Property deal analyzer/calculator (V3.2)
- Community and investor matching by archetype (V3.3)
- Team and partner collaboration (V3.3)
- Native mobile application (V3.4)

---

## Dependencies

- An AI/LLM provider capable of generating nuanced investor archetypes, strategy recommendations, and natural language insights from structured audit data
- A PDF generation capability for the Investment Blueprint
- Email delivery service for password reset functionality

---

## Assumptions

- Users are comfortable sharing detailed financial information through a web platform with appropriate security measures in place
- 5 audits totaling approximately 80+ data points can be completed in under 20 minutes using form-based input (this target was originally calibrated for conversational mode and may need re-validation)
- Industry-standard session-based authentication with role-based access, combined with field-level encryption for sensitive financial data, is sufficient for MVP security needs
- Append-only versioning for audits and identities is the appropriate data retention approach (no deletion of historical versions)
- Each user operates within their own auto-created tenant for MVP; the schema supports future multi-user tenants without migration
- The AI provider can produce consistent, high-quality outputs for archetype assignment, strategy generation, and insight generation with well-crafted prompt templates
- 3 simulations per 24-hour rolling window is a reasonable rate limit that balances user exploration with cost management
- A fixed, curated set of investor archetypes (managed via configuration) can meaningfully categorize the diversity of real estate investor profiles; the AI selects from this set rather than generating labels dynamically
- Contact management at MVP scope is limited to manual entry; automated contact discovery or import is post-MVP
- The platform targets English-speaking users in the US real estate market for MVP

---

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Users abandon audit flow before completing all 5 | Incomplete identities reduce platform value | Medium | Progressive disclosure shows increasing value with each audit; partial identity still provides useful insights |
| AI generates inconsistent or low-quality archetypes and strategies | Core value proposition undermined | Medium | Versioned prompt templates enable rapid iteration; retry logic with stricter formatting on failure |
| Users distrust sharing sensitive financial data | Low registration and audit completion | Medium | Clear privacy messaging; data isolation guarantees; no third-party data sharing |
| AI output quality untested with real data | Core value proposition may not be compelling | High | Prototype AI synthesis prompt with 3 sample profiles before implementation; post-synthesis feedback rating tracks quality |
| Simulation rate limit (3/session) frustrates power users | Negative user sentiment | Low | Monitor simulation usage patterns; adjust limit based on data post-launch |
| Identity versioning creates large data volumes over time | Storage and query performance concerns | Low | Append-only model is standard; archival strategy for old versions can be designed post-MVP |
