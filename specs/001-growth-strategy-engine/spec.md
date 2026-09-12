# Feature Specification: Growth Strategy Engine

**Feature:** Growth Strategy Engine
**Created:** 2026-04-04
**Status:** Draft
**Short Name:** growth-strategy-engine

---

## Overview

The Growth Strategy Engine expands InvestorOS from answering "What should I invest in?" to answering "How should I grow as an investor — across every dimension of my life that affects my investing success?" It introduces a four-path Growth Strategy as the new top-level AI output, wrapping the existing Investing Strategy inside a broader, multidimensional growth framework.

The existing Investing Strategy (acquisition strategies, action plan, roadmap, micro-plan) becomes one component of the **Portfolio Growth** path. Three additional AI-generated paths — **Income & Capital Growth**, **Skills & Knowledge Growth**, and **Time & Operations Growth** — address the full range of constraints that determine investing success: capital, competence, and capacity.

Paths unlock progressively as the user takes action, creating an engagement loop: act on your current plan, earn access to the next growth dimension, compound advantages across all four paths.

---

## Clarifications

### Session 2026-04-04

- Q: What does the user experience when AI path generation fails? → A: Immediate error with retry button, path reverts to previous status (matches V3 pattern — no partial or cached results shown)
- Q: Do markdown exports include sensitive financial data (income, credit, assets) or redact it? → A: Include full financial data with a one-time consent confirmation before the user's first export
- Q: What rate limiting applies to AI path generation and regeneration? → A: Per-path cooldown of 1 generation per path per hour; different paths can generate freely in parallel
- Q: What does the user see during the up-to-30-second path generation wait? → A: Non-blocking — path card shows "Generating..." state with indicator; user can navigate away; notification on completion

---

## Problem Statement

The current platform generates an investing strategy — a set of acquisition recommendations with an action plan. This answers one question well but ignores the surrounding constraints that determine whether a user can actually execute:

- **Capital constraint:** Most users' #1 blocker is insufficient investable capital. The platform offers no guidance on growing income, accelerating savings, or accessing funding channels beyond what the strategy assumes.
- **Skills constraint:** Users encounter skill gaps (underwriting, negotiation, construction knowledge) only after committing to a strategy, with no structured plan to close those gaps.
- **Time constraint:** Users overcommit to investing activities alongside full-time careers, leading to burnout, stalled progress, or poorly managed properties. No system helps them optimize time allocation as their portfolio grows.
- **Isolated strategy:** The investing strategy exists in a vacuum — it doesn't connect to the user's income trajectory, learning needs, or operational capacity.

Users who follow only an investing strategy will buy one property. Users who follow a Growth Strategy will build a portfolio, increase their income, sharpen their skills, and reclaim their time — compounding advantages across every dimension.

---

## Target Users

### Primary User: Investors with a Completed Identity

- Users who have completed all 5 audits and received their Investor Identity (archetype, readiness score, radar chart)
- Users who have an existing Investing Strategy and are ready for a deeper growth framework
- Range from first-time investors to intermediate investors scaling a small portfolio

### Secondary User: Returning Users with Existing Strategies

- Users who already have a V3 Investing Strategy and will be migrated into the Growth Strategy framework
- Their existing strategy data is preserved and repositioned within Portfolio Growth

### Tertiary User: Platform Administrators

- Monitor Growth Strategy adoption, unlock rates, path generation quality, and export usage
- Manage feature rollout phases

---

## User Scenarios & Testing

### Scenario 1: First Growth Strategy After Identity Completion

**Actor:** Investor who just completed all 5 audits and received their Identity
**Flow:**
1. After identity synthesis, the user is presented with their Growth Strategy dashboard showing four path cards
2. Portfolio Growth is immediately available and auto-generates (wrapping the existing Investing Strategy output plus a new Portfolio Scaling Plan)
3. The other three paths are visible but locked, each showing its name, a one-sentence description, unlock criteria, and a progress indicator toward unlocking
4. User reviews their Portfolio Growth path: acquisition strategies, scaling plan (Year 1/3/5/10 vision), reinvestment strategy, diversification plan, exit framework, financing evolution, and action items
5. User sees a 72-hour micro-plan tied to Portfolio Growth
6. User begins completing micro-plan tasks

**Acceptance Criteria:**
- Portfolio Growth generates automatically within 30 seconds of identity completion
- Portfolio Growth includes all existing Investing Strategy outputs (strategies with fit scores, action plan, roadmap, micro-plan) plus new scaling plan elements
- Three locked paths are visible with clear unlock criteria and progress indicators
- Overall Growth Strategy progress is displayed
- Cross-path insights section is visible (populated as paths unlock)

### Scenario 2: Progressive Path Unlocking (Organic)

**Actor:** Investor actively using their Growth Strategy
**Flow:**
1. User completes 2 or more micro-plan tasks from Portfolio Growth
2. Income & Capital Growth path unlocks — user sees a congratulatory notification and the path card changes from locked to available
3. User opens Income & Capital Growth and sees: capital acceleration plan, income growth roadmap, funding channel map (ranked by accessibility), professional transition plan (if applicable), and capital milestone targets tied to portfolio phases
4. User completes 1 action item from either Portfolio Growth or Income & Capital Growth
5. Skills & Knowledge Growth unlocks with the same celebration UX
6. User opens Skills path: skill gap analysis (ranked, linked to portfolio phases), learning roadmap, resource recommendations, network building plan, certification roadmap, mentorship strategy
7. After 14+ days of platform activity with 3 paths generated, Time & Operations Growth unlocks
8. User opens Time path: time audit reality check, time recapture plan, delegation roadmap, systems & tools plan, active-to-passive transition plan, burnout prevention

**Acceptance Criteria:**
- Path 2 unlocks when 2+ micro-plan tasks are completed from Portfolio Growth
- Path 3 unlocks when Paths 1 and 2 are both generated AND 1+ action item is completed from either
- Path 4 unlocks when 3 paths are generated AND user has been active 14+ days
- Each organic unlock triggers a celebratory notification and visible state change
- Later paths reference earlier paths: Income references Portfolio scaling phases, Skills references Portfolio action requirements, Time references all three paths
- Cross-path insights update as each new path is generated

### Scenario 3: Manual Early Unlock

**Actor:** Investor who wants a specific path before meeting organic unlock criteria
**Flow:**
1. User taps "Generate Now" on a locked path
2. System displays a confirmation: "This path is most valuable after [trigger context]. Generate now, or keep building toward it?"
3. User confirms
4. The path generates immediately, using whatever prior path data is available

**Acceptance Criteria:**
- Any locked path can be manually unlocked at any time
- Confirmation dialog clearly explains what the user may miss by unlocking early
- Manually unlocked paths still generate with full quality using available context
- Manual unlocks are tracked separately from organic unlocks in analytics

### Scenario 4: Cross-Path Intelligence

**Actor:** Investor with 2+ paths generated
**Flow:**
1. User views the Growth Strategy dashboard and sees the Cross-Path Insights panel
2. Insights show connections between paths: prerequisites ("Completing your HELOC application unlocks Phase 2 of Portfolio Plan"), enabling links ("Networking module in Skills accelerates deal sourcing"), constraints ("Budget for PM costs starting Month 18"), and conflicts with resolutions ("Freelance for capital vs. burnout risk — recommended 3-month limit")
3. Action items across all paths are ranked by cross-path priority
4. Dashboard shows a "Next Best Action" that considers all paths and cross-path dependencies

**Acceptance Criteria:**
- Cross-path links are categorized as prerequisite, enabling, constraint, or conflict
- Conflicts include AI-generated resolutions
- Action items from all unlocked paths are unified into a single priority-ranked list
- The "Next Best Action" reflects cross-path dependencies (e.g., a prerequisite from one path is prioritized if it unblocks progress in another)
- Cross-path insights update when new paths are generated or action items are completed

### Scenario 5: AI-Readable Identity & Strategy Export

**Actor:** Investor who wants to use their identity data in external AI tools
**Flow:**
1. User clicks "Export for AI" on the Growth Strategy dashboard
2. A zip archive downloads containing structured markdown files: an AI entry point file (investor-identity.md), full identity details, growth strategy overview, individual path files for each unlocked path, and a combined action plan
3. Each file has YAML frontmatter with type, tags, and timestamps for AI parseability
4. The AI entry point file contains a one-paragraph AI-generated summary, archetype, scores, strengths, gaps, active growth strategy status, financial snapshot, timeline, and usage instructions
5. User drops the entry point file into an external AI tool (e.g., Claude, ChatGPT, Obsidian) and receives context-aware advice aligned with their verified investor profile

**Acceptance Criteria:**
- Export generates a zip archive with all files for unlocked paths
- Locked paths are excluded from export
- Every file includes YAML frontmatter with type, tags, and ISO 8601 timestamps
- The AI entry point file contains a concise, AI-generated narrative summary
- Export always reflects current state (generated on-demand, not cached)
- If identity or any path has changed since last export, a staleness indicator appears: "Your identity has been updated since your last export. Download a fresh copy."
- Export completes within 15 seconds (including AI summary generation)

### Scenario 6: Updated Investment Blueprint PDF

**Actor:** Investor who wants a human-readable document of their full growth strategy
**Flow:**
1. User clicks "Download Blueprint PDF"
2. PDF includes: cover page, Investor DNA Profile (radar chart, archetype), Growth Strategy overview (all four paths, progress, highlights), detailed sections for each unlocked path, 72-hour quick start, combined action plan (all paths, priority-ordered), assumptions & disclaimers
3. Locked paths show a placeholder page: "This section will be added when you unlock [Path Name]. You're [X] away from unlocking it."

**Acceptance Criteria:**
- Blueprint PDF includes sections for all unlocked growth paths
- Locked paths show placeholder pages with unlock progress
- PDF generates within 10 seconds for a user with all 4 paths
- Combined action plan is priority-ordered across all paths
- PDF is branded and professionally formatted

### Scenario 7: Existing User Migration

**Actor:** User who already has a V3 Investing Strategy when the Growth Strategy feature is enabled
**Flow:**
1. Feature is enabled for the user's account
2. Existing strategy data is automatically wrapped into a Growth Strategy with Portfolio Growth as the first path
3. Existing action items and completion status are preserved
4. Unlock conditions are evaluated immediately — if the user has already completed 2+ micro-plan tasks, Income & Capital Growth unlocks automatically
5. User sees the new Growth Strategy dashboard with their existing strategy data intact

**Acceptance Criteria:**
- No data loss during migration — all existing strategy data, action items, and completion status are preserved
- Migration is idempotent (running twice does not create duplicates)
- Unlock conditions are evaluated post-migration (users may immediately unlock additional paths based on existing activity)
- Existing API consumers continue to work via backward-compatible endpoints
- Migration completes within 2 seconds per user

### Scenario 8: Growth Strategy Regeneration

**Actor:** Investor whose identity has significantly changed
**Flow:**
1. User re-takes one or more audits, and identity score changes by more than 10 points
2. System generates an insight notification: "Your investor identity has changed significantly. Your Growth Strategy may benefit from a refresh."
3. User chooses to regenerate a specific path or the entire Growth Strategy
4. New versions are generated; old versions are preserved
5. Cross-path links are recalculated for regenerated paths

**Acceptance Criteria:**
- A score change greater than 10 points triggers a regeneration suggestion
- Users can regenerate individual paths or the full strategy
- Old versions are preserved (never overwritten)
- Regenerated paths reflect updated identity data
- Cross-path links update to reflect regenerated content
- After 90 days without regeneration, a gentle prompt is shown for refresh

---

## Functional Requirements

### FR-01: Growth Strategy Creation
The system shall create a Growth Strategy for a user upon completion of their Investor Identity (all 5 audits + AI synthesis). The Growth Strategy contains four growth paths and serves as the new top-level AI output.

### FR-02: Four Growth Paths
The system shall support four distinct growth paths:
- **Portfolio Growth** — acquisition strategies, portfolio scaling plan, reinvestment strategy, diversification plan, exit framework, financing evolution
- **Income & Capital Growth** — capital acceleration, income growth roadmap, funding channel map, professional transition plan, capital milestone targets
- **Skills & Knowledge Growth** — skill gap analysis, learning roadmap, resource recommendations, network building plan, certification roadmap, mentorship strategy
- **Time & Operations Growth** — time reality check, time recapture plan, delegation roadmap, systems & tools plan, active-to-passive transition, burnout prevention

### FR-03: Portfolio Growth Wraps Existing Strategy
The Portfolio Growth path shall contain all existing Investing Strategy outputs (ranked acquisition strategies with fit scores, strategy-specific action plan, roadmap, 72-hour micro-plan) as a nested component, plus the new portfolio scaling plan elements. No existing strategy data is lost.

### FR-04: Progressive Path Unlocking
Paths shall unlock progressively based on user engagement:
- Path 1 (Portfolio Growth): Generates immediately after identity completion
- Path 2 (Income & Capital): Unlocks after 2+ micro-plan tasks completed from Portfolio Growth
- Path 3 (Skills & Knowledge): Unlocks after Paths 1+2 generated AND 1+ action item completed from either
- Path 4 (Time & Operations): Unlocks after 3 paths generated AND 14+ days of platform activity

### FR-05: Manual Early Unlock
Any locked path shall have a "Generate Now" option allowing the user to bypass organic unlock criteria. The system shall display a confirmation explaining what context may be missing, and generate the path immediately upon confirmation.

### FR-06: AI-Powered Path Generation
Each path shall be generated by AI using the user's full Investor Identity (all 5 audit results) plus:
- Prior generated paths as context (later paths receive earlier path outputs)
- User engagement data (completed action items, platform activity patterns)
- Path-specific instructions and output format requirements
- Cross-path linking instructions
- Guardrails (no financial guarantees, no legal/tax advice, realistic projections)

If generation fails, the system shall display a friendly error message with a manual retry button. The path reverts to its previous status (unlocked but not generated). No partial or cached results are shown. This is consistent with V3's AI failure handling pattern.

Generation and regeneration are rate-limited to 1 call per path per hour. Different paths may generate freely in parallel. If a user attempts to regenerate a path within the cooldown window, the system shall display the remaining wait time.

### FR-07: Cross-Path Dependencies
The system shall identify and display connections between paths:
- **Prerequisite** — action in one path is required before progress in another
- **Enabling** — action in one path accelerates progress in another
- **Constraint** — milestone in one path imposes a limit or cost on another
- **Conflict** — recommendations between paths contradict, with AI-generated resolution

### FR-08: Cross-Path Action Priority
Action items from all unlocked paths shall be unified into a single priority-ranked list. The system shall compute a "Next Best Action" that considers cross-path dependencies, urgency, and impact.

### FR-09: Growth Strategy Dashboard
The system shall provide a dashboard showing:
- Four path cards with status (locked/unlocked/generating/generated), progress percentage, and summaries
- Overall Growth Strategy progress
- Cross-path insights panel
- Next Best Action recommendation
- Export options (AI-readable markdown and Blueprint PDF)

Path generation is non-blocking: a path card in "generating" status shows a progress indicator while the user can freely navigate the platform. A notification appears when generation completes or fails.

### FR-10: Locked Path Visibility
Locked paths shall be visible to the user with: path name, one-sentence description, unlock criteria, progress toward unlocking, and a "Generate Now" button. Locked paths create anticipation without overwhelming.

### FR-11: Unlock Celebrations
Organic path unlocks shall be treated as achievements with a congratulatory notification, a visible state change on the dashboard, and an invitation to explore the newly available path.

### FR-12: AI-Readable Markdown Export
The system shall generate a zip archive of structured markdown files representing the user's identity and growth strategy. The export includes:
- AI entry point file with YAML frontmatter, narrative summary, scores, strengths, gaps, strategy status, and usage instructions
- Full identity detail file
- Growth strategy overview
- Individual files for each unlocked path
- Combined action plan sorted by priority
Only unlocked paths are included. Files follow standard markdown with YAML frontmatter, hierarchical tags, cross-references, and ISO 8601 dates. Exports include full unredacted financial data (income, credit tier, assets, funding amounts). Before the user's first export, the system shall display a one-time consent confirmation explaining that the downloaded files contain sensitive financial information.

### FR-13: Export Freshness Tracking
The system shall track export history and detect staleness. If the identity or any growth path has changed since the last export, a visual indicator shall prompt the user to download a fresh copy.

### FR-14: Updated Investment Blueprint PDF
The Blueprint PDF shall expand to include all unlocked growth paths, with sections for each path's key outputs, a combined priority-ordered action plan, and placeholder pages for locked paths showing unlock progress.

### FR-15: Existing User Data Migration
When the Growth Strategy feature is enabled for a user with an existing Investing Strategy, the system shall automatically migrate their data into the Growth Strategy framework, preserving all strategy outputs, action items, and completion status. Unlock conditions shall be evaluated immediately post-migration.

### FR-16: Feature Flag Gating
All Growth Strategy functionality shall be gated behind a feature flag. When disabled, existing V3 behavior is unchanged. When enabled, V3 strategy endpoints redirect to Growth Strategy equivalents.

### FR-17: Growth Strategy Regeneration
Users shall be able to regenerate individual paths or the entire strategy. Old versions are preserved. The system shall suggest regeneration when the identity score changes by more than 10 points, and gently prompt for refresh after 90 days.

### FR-18: Backward-Compatible V3 Endpoints
Existing V3 strategy endpoints shall continue to function when the feature flag is on, redirecting or proxying to the equivalent Growth Strategy endpoints. No breaking changes to existing integrations.

### FR-19: Path-Specific AI Insights
Each growth path shall generate contextually relevant, non-generic insights:
- Income & Capital: Identify non-obvious capital sources specific to the user's profile (e.g., self-directed IRA eligibility, HELOC potential, side income scaling)
- Skills & Knowledge: Connect skill development to specific portfolio milestones and timelines
- Time & Operations: Use behavioral data to reconcile stated vs. actual time investment

### FR-20: Tool Integration Placeholders
The Portfolio Growth path shall define integration slots for future tools (deal calculator, market research, deal sourcing, funding finder). These appear as contextual placeholders: "At this stage of your growth, a [tool] will be available here soon."

---

## Success Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| SC-01 | Users with a completed identity receive their Portfolio Growth path within 30 seconds | Time from identity completion to path display |
| SC-02 | More than 90% of users with a completed identity generate a Portfolio Growth path | Generation rate tracking |
| SC-03 | More than 50% of Portfolio Growth users organically unlock Income & Capital Growth | Organic unlock rate for Path 2 |
| SC-04 | More than 35% of Path 2 users organically unlock Skills & Knowledge Growth | Organic unlock rate for Path 3 |
| SC-05 | More than 25% of Path 3 users organically unlock Time & Operations Growth | Organic unlock rate for Path 4 |
| SC-06 | Less than 30% of total unlocks are manual (organic flow preferred) | Manual vs. organic unlock ratio |
| SC-07 | Users complete more than 3 action items across all paths within 30 days | Action item completion tracking |
| SC-08 | More than 20% of users with multiple paths engage with cross-path links | Cross-path link click tracking |
| SC-09 | More than 40% of users with 2+ paths download the Blueprint PDF | Blueprint download rate |
| SC-10 | More than 20% of users regenerate their strategy at least once | Regeneration rate tracking |
| SC-11 | More than 30% of users show overall progress improvement within 60 days | Progress score delta tracking |
| SC-12 | More than 15% of users with 2+ paths download the AI-readable markdown export at least once | Export adoption tracking |
| SC-13 | More than 30% of exporters download a second export within 30 days | Repeat export rate tracking |
| SC-14 | More than 50% of users notified of stale exports re-download | Stale export re-download rate |
| SC-15 | Growth Strategy overview page loads in under 2 seconds | Page load time measurement |
| SC-16 | Individual path detail pages load in under 1 second | Page load time measurement |
| SC-17 | Blueprint PDF generates in under 10 seconds for a 4-path user | PDF generation time |
| SC-18 | Markdown export generates in under 15 seconds including AI summary | Export generation time |
| SC-19 | Existing users are migrated without data loss or duplicate records | Migration validation and idempotency testing |
| SC-20 | V3 strategy endpoints continue to function when the feature flag is enabled | Backward compatibility verification |

---

## Key Entities

### Growth Strategy
The top-level container for a user's multi-path growth plan. One active growth strategy per user at a time. Links to the user's identity version at time of creation. Tracks overall progress as a composite of all path progress.

### Growth Path
An individual growth dimension within the strategy. Has a type (portfolio, income/capital, skills/knowledge, time/operations), a lifecycle status (locked → unlocked → generating → generated), AI-generated content, progress tracking, version history, and action items.

### Growth Path Action Item
A discrete, actionable task within a growth path. Has a title, description, timeframe, category, identity impact description, priority score, and completion status. Action items are tracked across paths for cross-path priority ranking.

### Cross-Path Link
A connection between items or milestones across different paths. Typed as prerequisite, enabling, constraint, or conflict. Generated by AI alongside each path. Conflicts include a resolution recommendation.

### Unlock Event
A record of when and how a path was unlocked. Tracks trigger type (organic, manual request, system), trigger details, and timestamp. Used for analytics on progressive engagement.

### Export History
A record of each export event. Tracks export type, files included, identity and strategy versions at time of export. Used to detect staleness and drive re-engagement.

---

## Scope

### In Scope
- Four growth paths with AI generation, progressive unlocking, and cross-path intelligence
- Growth Strategy dashboard with path cards, progress tracking, and cross-path insights
- Manual early unlock with confirmation flow
- AI-readable markdown export system with zip download
- Updated Investment Blueprint PDF with multi-path sections
- Data migration for existing V3 users
- Feature flag gating with backward-compatible V3 endpoints
- Strategy regeneration with version preservation
- Unlock celebration UX
- Tool integration placeholders in Portfolio Growth

### Out of Scope
- Sync infrastructure (auto-push to Obsidian, webhooks, MCP server) — separate future feature
- Actual tool integrations (deal calculator, market research, deal sourcing, funding finder) — placeholders only
- Additional growth paths beyond the four defined (wealth/tax, market intelligence, partnership) — future expansion
- Bidirectional sync with external AI tools
- Collaborative/team growth strategies
- Mobile-native application

---

## Dependencies

- **V3 Identity Platform (completed):** All 5 audits, identity synthesis, archetype assignment, readiness scoring, radar chart
- **V3 Investing Strategy Service:** Existing strategy generation, action plans, roadmaps, micro-plans
- **V3 Authentication & Tenancy:** JWT auth, RBAC, tenant isolation
- **V3 Activity Logging:** Event tracking for unlock trigger evaluation (task completions, logins, platform activity)
- **V3 Prompt Template System:** Versioned, hot-swappable AI prompt templates stored in the database
- **V3 Blueprint PDF Service:** Existing PDF generation via HTML templates

---

## Assumptions

- Users with a completed identity are the target audience; the Growth Strategy is not offered to users mid-audit
- The existing Investing Strategy output schema remains stable — Growth Strategy wraps it, does not modify it
- AI generation quality for later paths improves because earlier path context is available (progressive enrichment)
- Four paths is the right number for launch — additional paths can be added post-launch without structural changes
- The 14-day activity requirement for Time & Operations is calendar days with at least one platform interaction, not 14 days of continuous use
- Export files target AI consumption (structured markdown with frontmatter), not human reading (that's the Blueprint PDF)
- The AI summary in exports is a lightweight generation (~200 input + ~150 output tokens), not a full strategy call
- Manual unlock users accept reduced path quality due to missing context from earlier paths
- Platform behavioral data (login frequency, task completion rates) is available from the existing activity logging system
- Field-level encryption requirements from V3 apply to any sensitive financial data surfaced in Income & Capital Growth path outputs
