# Tasks: Growth Strategy Engine

**Feature:** 001-growth-strategy-engine
**Generated:** 2026-04-04
**Total Tasks:** 78
**Status:** Ready for implementation

---

## Phase 1: Setup

**Goal:** Database schema, dependencies, project scaffolding.

- [ ] T001 Add new enums (GrowthPathType, GrowthPathStatus, GrowthStrategyStatus, UnlockType, ExportType) and extend PromptServiceType enum with growth_path_generation and cross_path_analysis in `backend/prisma/schema.prisma`
- [ ] T002 [P] Add GrowthStrategy model with relations to Tenant, User, IdentityVersion in `backend/prisma/schema.prisma` per data-model.md growth_strategies spec
- [ ] T003 [P] Add GrowthPath model with relations to GrowthStrategy, Strategy (optional FK for Portfolio) in `backend/prisma/schema.prisma` per data-model.md growth_paths spec
- [ ] T004 [P] Add ExportHistory model with relations to Tenant, User in `backend/prisma/schema.prisma` per data-model.md export_history spec
- [ ] T005 Add featureFlags Json column (default '{}') to Tenant model in `backend/prisma/schema.prisma`
- [ ] T006 Create and apply Prisma migration named add_growth_strategy_engine via `npx prisma migrate dev`
- [ ] T007 [P] Add growth_path_generation and cross_path_analysis prompt template seeds to `backend/prisma/seed.ts`
- [ ] T008 [P] Install archiver and @types/archiver dependencies in `backend/`

---

## Phase 2: Foundation

**Goal:** Growth module skeleton, feature flag middleware, shared types and repository.
**Prerequisite:** Phase 1 complete.

- [ ] T009 Create growth module TypeScript types (GrowthPathType, GrowthPathStatus, content schemas per path type, action item shape, cross-path link shape, unlock event shape) in `backend/src/modules/growth/types.ts`
- [ ] T010 [P] Create feature flag middleware requireFeatureFlag(flag) that reads tenants.featureFlags and returns 404 when flag is off in `backend/src/shared/middleware/featureFlag.ts`
- [ ] T011 Create growth repository with CRUD operations for growth_strategies, growth_paths, and export_history tables (including tenant-scoped queries) in `backend/src/modules/growth/repository.ts`
- [ ] T012 Create growth module route file and register it in Express app with feature flag middleware in `backend/src/modules/growth/routes.ts` and `backend/src/main.ts`

---

## Phase 3: US1 — First Growth Strategy After Identity Completion

**Goal:** User completes identity synthesis and receives a Growth Strategy with auto-generated Portfolio Growth path.
**Prerequisite:** Phase 2 complete.
**Test criteria:** After identity synthesis with feature flag on, GET /api/v1/growth-strategy returns a strategy with Portfolio Growth in "generated" status and 3 locked paths.

- [ ] T013 [US1] Implement createGrowthStrategy service function that creates a strategy row linked to current identity version plus 4 growth path rows (Portfolio unlocked, others locked) in `backend/src/modules/growth/service.ts`
- [ ] T014 [US1] Implement getGrowthStrategy service function that returns strategy with all paths, unlock criteria text, unlock progress, and action item counts in `backend/src/modules/growth/service.ts`
- [ ] T015 [US1] Implement getGrowthPath service function that returns full path detail including content, action items, and linked V1 strategy data for Portfolio type in `backend/src/modules/growth/service.ts`
- [ ] T016 [P] [US1] Implement path generation prompt assembly: load growth_path_generation template, inject identity context, audit data, path-type-specific instructions, prior path outputs, and output format requirements in `backend/src/modules/growth/generation.ts`
- [ ] T017 [US1] Implement Portfolio Growth auto-generation: call AI with strategy context, parse scaling plan + reinvestment + diversification + exit + financing + tool placeholders + action items, store on growth_paths row, set status to generated in `backend/src/modules/growth/generation.ts`
- [ ] T018 [US1] Implement POST /api/v1/growth-strategy endpoint with feature flag gate, identity completion validation, duplicate check (409 if exists), calls createGrowthStrategy + triggers Portfolio generation in `backend/src/modules/growth/routes.ts`
- [ ] T019 [P] [US1] Implement GET /api/v1/growth-strategy endpoint with feature flag gate, returns full strategy or 404 in `backend/src/modules/growth/routes.ts`
- [ ] T020 [P] [US1] Implement GET /api/v1/growth-strategy/paths/:pathType endpoint with feature flag gate and path type validation in `backend/src/modules/growth/routes.ts`
- [ ] T021 [US1] Hook growth strategy auto-creation into identity synthesis: after successful synthesis with feature flag on, call createGrowthStrategy if no active strategy exists in `backend/src/modules/identity/service.ts`
- [ ] T022 [P] [US1] Create Growth Strategy dashboard page with four path cards grid (2x2 desktop, 1-col mobile), overall progress indicator, and export buttons in `frontend/src/app/growth-strategy/page.tsx`
- [ ] T023 [P] [US1] Create PathCard component with 4 visual states (locked/unlocked/generating/generated), progress bar, summary text, unlock criteria, and action buttons in `frontend/src/components/growth/PathCard.tsx`
- [ ] T024 [US1] Create path detail page with dynamic routing, content rendering, and action items list in `frontend/src/app/growth-strategy/[pathType]/page.tsx`
- [ ] T025 [US1] Create Portfolio Growth detail view that embeds V1 strategy data (action plan, roadmap, micro-plan) alongside new scaling plan content in `frontend/src/app/growth-strategy/[pathType]/page.tsx`

---

## Phase 4: US2 — Progressive Path Unlocking

**Goal:** Paths unlock organically as the user completes tasks and engages with the platform.
**Prerequisite:** Phase 3 (US1) complete.
**Test criteria:** Completing 2+ micro-plan tasks unlocks Path 2. Completing 1+ action item from Path 1 or 2 (with both generated) unlocks Path 3. 14+ days activity with 3 paths unlocks Path 4.

- [ ] T026 [US2] Implement evaluateUnlocks function that checks all 4 unlock conditions — Path 2: 2+ completed tasks in V1 `strategies.micro_plan.tasks[]` JSONB (NOT growth path action items); Path 3: Paths 1+2 generated AND 1+ action item completed from either growth path's `action_items` JSONB; Path 4: 3 paths generated AND 14 calendar days elapsed since account creation with ≥1 activity_log entry — in `backend/src/modules/growth/service.ts`
- [ ] T027 [US2] Hook unlock evaluation into V1 action item completion, micro-task completion, and login events by calling evaluateUnlocks and logging to activity_logs in `backend/src/modules/growth/service.ts`
- [ ] T028 [US2] Implement path generation for Income & Capital (capital acceleration, funding map, income roadmap, milestones — must identify user-specific capital sources per FR-19), Skills & Knowledge (skill gaps linked to portfolio milestones per FR-19, learning roadmap, resources, certifications, mentorship), and Time & Operations (time reality check must reconcile stated vs actual hours per FR-19, recapture plan, delegation, systems, burnout prevention) in `backend/src/modules/growth/generation.ts`
- [ ] T029 [US2] Implement POST /api/v1/growth-strategy/paths/:pathType/generate endpoint: validate path is unlocked or generated, check rate limit, set status to generating, trigger AI generation, return 202 in `backend/src/modules/growth/routes.ts`
- [ ] T030 [P] [US2] Implement GET /api/v1/growth-strategy/paths/:pathType/status lightweight polling endpoint returning status and started_at in `backend/src/modules/growth/routes.ts`
- [ ] T031 [US2] Implement path generation rate limiting: check generation_cooldown_until column, set to now+1hour after generation, return 429 with cooldown_until when within window in `backend/src/modules/growth/service.ts`
- [ ] T032 [P] [US2] Create unlock celebration notification component: toast with path name, confetti icon, border pulse animation (2 cycles, 400ms), respects prefers-reduced-motion in `frontend/src/components/growth/UnlockCelebration.tsx`
- [ ] T033 [US2] Implement path generation polling and unlock notification UI: poll GET /growth-strategy every 30s on dashboard to detect organic unlocks (compare path statuses with previous response), poll GET status endpoint every 3s during active generation, show animated indicator on path card, trigger UnlockCelebration on newly unlocked paths in `frontend/src/app/growth-strategy/page.tsx`
- [ ] T034 [US2] Create Income & Capital, Skills & Knowledge, and Time & Operations path detail views with path-specific content rendering in `frontend/src/app/growth-strategy/[pathType]/page.tsx`

---

## Phase 5: US3 — Manual Early Unlock

**Goal:** Users can bypass organic unlock criteria to generate any path immediately.
**Prerequisite:** Phase 4 (US2) complete.
**Test criteria:** Sending POST generate with confirm_early_unlock:true on a locked path sets unlock_type to manual and starts generation. Without confirmation, returns 400 with unlock criteria.

- [ ] T035 [US3] Implement manual early unlock flow: if path is locked and confirm_early_unlock is true, set unlock_type to manual, set unlocked_at, log to activity_logs, then start generation in `backend/src/modules/growth/service.ts`
- [ ] T036 [US3] Add confirm_early_unlock validation to generate endpoint: if path is locked and field is missing/false, return 400 with unlock criteria message in `backend/src/modules/growth/routes.ts`
- [ ] T037 [US3] Create manual unlock confirmation dialog with explanation of what context may be missing, confirm/cancel buttons in `frontend/src/components/growth/ManualUnlockDialog.tsx`

---

## Phase 6: US4 — Cross-Path Intelligence

**Goal:** AI identifies connections between paths. Action items ranked across all paths. Next Best Action computed.
**Prerequisite:** Phase 4 (US2) complete.
**Test criteria:** With 2+ paths generated, GET cross-path-insights returns typed links (prerequisite, enabling, constraint, conflict). Conflicts include resolutions. Action items are priority-ranked across paths. Next best action reflects cross-path dependencies.

- [ ] T038 [US4] Implement cross-path analysis prompt assembly: load cross_path_analysis template, inject all generated paths' content and action items, request typed links and next best action in `backend/src/modules/growth/generation.ts`
- [ ] T039 [US4] Implement cross-path link generation triggered after each path generation: call AI, parse links into cross_path_links JSONB on growth_strategies, categorize as prerequisite/enabling/constraint/conflict in `backend/src/modules/growth/generation.ts`
- [ ] T040 [US4] Implement cross-path action priority ranking: collect action items from all generated paths, boost prerequisite items by +20, compute next best action (highest-ranked item unblocking most dependencies), store on growth_strategies.next_best_action in `backend/src/modules/growth/service.ts`
- [ ] T041 [US4] Implement progress tracking: path progress as (completed/total action items)*100, overall strategy progress as weighted average of generated paths, update on every action item change in `backend/src/modules/growth/service.ts`
- [ ] T042 [US4] Implement PUT /api/v1/growth-strategy/paths/:pathType/action-items/:itemId endpoint: update is_completed in JSONB, recalculate progress, evaluate unlocks, return updated item + progress + any triggered unlocks in `backend/src/modules/growth/routes.ts`
- [ ] T043 [P] [US4] Implement GET /api/v1/growth-strategy/cross-path-insights endpoint returning links, priority-ranked actions, and next best action in `backend/src/modules/growth/routes.ts`
- [ ] T044 [P] [US4] Create cross-path insights panel component: collapsible, link type icons (arrow=prerequisite, bolt=enabling, shield=constraint, warning=conflict), amber highlight for conflicts in `frontend/src/components/growth/CrossPathInsights.tsx`
- [ ] T045 [P] [US4] Create next best action card component: accent-bordered card with action title, originating path, reason, cross-path impact badges in `frontend/src/components/growth/NextBestAction.tsx`
- [ ] T046 [US4] Create action item completion UI: checkbox toggles in path detail view with optimistic update, show unlock feedback inline when completion triggers an unlock in `frontend/src/app/growth-strategy/[pathType]/page.tsx`

---

## Phase 7: US5 — AI-Readable Markdown Export

**Goal:** Users download a zip of structured markdown files for use in external AI tools.
**Prerequisite:** Phase 3 (US1) complete.
**Test criteria:** POST export/markdown returns a valid zip containing investor-identity.md with YAML frontmatter, one file per generated path, combined action plan. First export requires consent_confirmed:true. GET export/status detects staleness after identity or path changes.

- [ ] T047 [US5] Implement markdown file renderers: renderEntryPoint (YAML frontmatter + narrative), renderIdentityDetail, renderStrategyOverview, renderPathFile (per path type, must decrypt encrypted Income & Capital path content via AES-256-GCM utility before rendering), renderActionPlan (priority-ordered across paths) in `backend/src/modules/growth/export.ts`
- [ ] T048 [US5] Implement AI summary generation for export entry point: lightweight prompt (~200 input + ~150 output tokens) producing one-paragraph identity narrative in `backend/src/modules/growth/export.ts`
- [ ] T049 [US5] Implement zip assembly with archiver: create in-memory zip, add all rendered markdown files, pipe to Express response with Content-Type application/zip in `backend/src/modules/growth/export.ts`
- [ ] T050 [US5] Implement POST /api/v1/growth-strategy/export/markdown endpoint: validate identity exists, check consent, generate zip, record to export_history, stream response in `backend/src/modules/growth/routes.ts`
- [ ] T051 [US5] Implement export consent tracking: check export_history for prior consent, require consent_confirmed:true on first export, return 400 with explanation if missing in `backend/src/modules/growth/service.ts`
- [ ] T052 [US5] Implement export freshness detection: compare current identity version and path versions against last export_history record, return changed items list in `backend/src/modules/growth/export.ts`
- [ ] T053 [P] [US5] Implement GET /api/v1/growth-strategy/export/status endpoint returning has_exported, last_export_at, is_stale, changed_since_export in `backend/src/modules/growth/routes.ts`
- [ ] T054 [US5] Create export button with first-time consent dialog explaining sensitive financial data inclusion in `frontend/src/components/growth/ExportButton.tsx`
- [ ] T055 [P] [US5] Create export staleness banner component: full-width amber banner below header with "Download fresh copy" link in `frontend/src/components/growth/StalenessAlert.tsx`

---

## Phase 8: US6 — Updated Investment Blueprint PDF

**Goal:** Blueprint PDF expands to include growth path sections with placeholder pages for locked paths.
**Prerequisite:** Phase 3 (US1) complete.
**Test criteria:** POST blueprint/generate with feature flag on produces PDF with Growth Strategy overview, sections for each unlocked path, placeholder pages for locked paths, and combined action plan. Without feature flag, PDF is identical to V1.

- [ ] T056 [US6] Extend Blueprint HTML template with Growth Strategy overview section (4 path summary cards, overall progress) in `backend/src/modules/blueprint/template.html`
- [ ] T057 [US6] Add conditional growth strategy rendering to Blueprint service: include growth sections only when feature flag is on, assemble path content for each generated path in `backend/src/modules/blueprint/service.ts`
- [ ] T058 [P] [US6] Add locked path placeholder pages to Blueprint template: path name, "This section will be added when you unlock [Path Name]", unlock progress indicator in `backend/src/modules/blueprint/template.html`
- [ ] T059 [US6] Add combined cross-path action plan section to Blueprint template: priority-ordered action items across all paths with path labels in `backend/src/modules/blueprint/template.html`
- [ ] T060 [US6] Update frontend Blueprint download button to show growth strategy content indicator when feature flag is on in `frontend/src/components/blueprint/DownloadButton.tsx`

---

## Phase 9: US7 — Existing User Migration

**Goal:** Users with existing V1 strategies are seamlessly migrated into the Growth Strategy framework.
**Prerequisite:** Phase 3 (US1) complete.
**Test criteria:** After migration, existing users see Growth Strategy dashboard with Portfolio Growth referencing their V1 strategy. All V1 data preserved. Migration is idempotent. Unlock conditions evaluated post-migration. V1 endpoints unaffected.

- [ ] T061 [US7] Implement migrateUserToGrowthStrategy function: create growth_strategy + 4 paths, link Portfolio Growth to existing active V1 strategy, set Portfolio status to generated with placeholder scaling plan content in `backend/src/modules/growth/migration.ts`
- [ ] T062 [US7] Implement migration idempotency: check if growth_strategy already exists for user before creating, skip if present, return migration status in `backend/src/modules/growth/migration.ts`
- [ ] T063 [US7] Implement post-migration unlock evaluation: after creating growth strategy, evaluate unlock conditions based on existing completed micro-tasks and activity history in `backend/src/modules/growth/migration.ts`
- [ ] T064 [US7] Implement POST /api/v1/admin/growth-strategy/migrate admin endpoint: accept optional user_id filter, run migration for all or specific users, return count of migrated/skipped users in `backend/src/modules/growth/routes.ts`
- [ ] T065 [US7] Verify V1 strategy endpoints (GET /api/v1/strategies, GET /api/v1/strategies/:id/action-plan, etc.) return identical responses with feature flag on and off

---

## Phase 10: US8 — Growth Strategy Regeneration

**Goal:** Users regenerate individual paths or full strategy after identity changes. Old versions preserved.
**Prerequisite:** Phase 4 (US2) complete.
**Test criteria:** Regenerating a path creates a new growth_paths row with version+1 (append-only), sets previous row is_current=false, old content preserved in old row. Cross-path links recalculated. Identity score delta >10 triggers regeneration suggestion. 90-day-old paths trigger refresh prompt.

- [ ] T066 [US8] Implement individual path regeneration: create new growth_paths row with version+1 and is_current=true, set previous row is_current=false (append-only per constitution IV), regenerate via existing generation flow, recalculate cross-path links in `backend/src/modules/growth/service.ts`
- [ ] T067 [US8] Implement full strategy regeneration: regenerate all generated paths sequentially, recalculate all cross-path links after completion in `backend/src/modules/growth/service.ts`
- [ ] T068 [US8] Implement identity score delta detection: compare new identity readiness_score with growth strategy's identity version score, flag if delta > 10 points in `backend/src/modules/growth/service.ts`
- [ ] T069 [US8] Hook regeneration suggestion into identity synthesis: after new identity version with score delta > 10, create insight notification "Your Growth Strategy may benefit from a refresh" in `backend/src/modules/identity/service.ts`
- [ ] T070 [US8] Implement 90-day refresh prompt: on dashboard load, check if any path's generated_at is older than 90 days, include refresh suggestion in response in `backend/src/modules/growth/service.ts`
- [ ] T071 [US8] Create regeneration UI: regenerate button on path detail page (with rate limit status), regeneration suggestion banner on dashboard, full strategy regeneration option in `frontend/src/app/growth-strategy/page.tsx`

---

## Phase 11: Polish & Cross-Cutting Concerns

**Goal:** Admin analytics, dashboard integration, security hardening, accessibility, performance.
**Prerequisite:** All user story phases complete.

- [ ] T072 Implement GET /api/v1/admin/growth-strategy/stats endpoint returning strategy creation count, per-path unlock rates (organic vs manual), export stats, regeneration count, avg action items completed in `backend/src/modules/growth/routes.ts`
- [ ] T073 Add growth_strategy summary field to GET /api/v1/dashboard response: paths overview with current statuses, next best action, export staleness, and newly_unlocked array (paths unlocked since the user's last dashboard fetch, based on unlocked_at vs user's last_login_at) — conditionally included when feature flag on — in `backend/src/modules/growth/service.ts`
- [ ] T074 Add Growth Strategy summary card to frontend dashboard page showing path cards mini-view and next best action when feature flag is on in `frontend/src/app/dashboard/page.tsx`
- [ ] T075 Implement field-level encryption for sensitive financial data in Income & Capital path content (funding amounts, income targets, capital milestones) using existing AES-256-GCM utility in `backend/src/modules/growth/repository.ts`
- [ ] T076 Add PostgreSQL RLS policies for growth_strategies, growth_paths, and export_history tables using tenant_isolation pattern in new Prisma migration
- [ ] T077 Accessibility audit on growth strategy pages: 44px touch targets, ARIA landmarks, keyboard navigation on path cards, prefers-reduced-motion for celebrations, ARIA live regions for progress updates
- [ ] T078 Performance verification: dashboard load <2s, path detail <1s, path generation <30s, markdown export <15s, Blueprint PDF <10s for 4-path user

---

## Dependencies

```
Phase 1 (Setup)
  └─► Phase 2 (Foundation)
        └─► Phase 3 (US1: Growth Strategy Creation)
              ├─► Phase 4 (US2: Progressive Unlocking)
              │     ├─► Phase 5 (US3: Manual Early Unlock)
              │     ├─► Phase 6 (US4: Cross-Path Intelligence)
              │     └─► Phase 10 (US8: Regeneration)
              ├─► Phase 7 (US5: Markdown Export)
              ├─► Phase 8 (US6: Blueprint PDF)
              └─► Phase 9 (US7: Migration)
                    └─► Phase 11 (Polish)
```

**Independent story groups after US1:**
- Group A: US2 → US3, US4, US8 (unlocking chain)
- Group B: US5 (export — independent of unlocking)
- Group C: US6 (blueprint — independent of unlocking)
- Group D: US7 (migration — independent of unlocking)

---

## Parallel Execution Opportunities

### Within Phase 1 (Setup)
T002, T003, T004 can run in parallel (independent model definitions).
T007, T008 can run in parallel (independent setup tasks).

### Within Phase 3 (US1)
T016 (prompt assembly) parallel with T019, T020 (GET endpoints).
T022, T023 (frontend components) parallel with each other.

### Within Phase 4 (US2)
T030 (status endpoint) parallel with T032 (celebration component).

### Within Phase 6 (US4)
T043, T044, T045 can run in parallel (independent endpoint and components).

### Within Phase 7 (US5)
T053 (status endpoint) parallel with T055 (staleness banner).

### Cross-Phase Parallelism
After US1 complete: US5 (Phase 7), US6 (Phase 8), US7 (Phase 9) can run in parallel with US2 (Phase 4).

---

## Implementation Strategy

**MVP (minimum shippable):** Phases 1-3 (US1 only)
- User gets Growth Strategy with auto-generated Portfolio Growth after identity synthesis
- 3 locked paths visible with unlock criteria
- Validates the full generation pipeline end-to-end

**Increment 2:** Add Phases 4-5 (US2 + US3)
- Progressive unlocking activated
- All 4 paths generatable
- Core engagement loop complete

**Increment 3:** Add Phase 6 (US4)
- Cross-path intelligence
- Action item management across paths
- Full Growth Strategy experience

**Increment 4:** Add Phases 7-10 (US5-US8) in parallel
- Export, Blueprint, Migration, Regeneration
- All spec scenarios covered

**Increment 5:** Phase 11 (Polish)
- Admin analytics, security hardening, performance verification

---

## Task Count Summary

| Phase | Scope | Tasks |
|-------|-------|-------|
| Phase 1 | Setup | 8 |
| Phase 2 | Foundation | 4 |
| Phase 3 | US1: Growth Strategy Creation | 13 |
| Phase 4 | US2: Progressive Unlocking | 9 |
| Phase 5 | US3: Manual Early Unlock | 3 |
| Phase 6 | US4: Cross-Path Intelligence | 9 |
| Phase 7 | US5: Markdown Export | 9 |
| Phase 8 | US6: Blueprint PDF | 5 |
| Phase 9 | US7: Migration | 5 |
| Phase 10 | US8: Regeneration | 6 |
| Phase 11 | Polish | 7 |
| **Total** | | **78** |
