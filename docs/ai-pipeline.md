# InvestorOS AI pipeline — how it works, where it is weak, how to improve prompts and evals

Companion to [`docs/codebase-guide.md`](codebase-guide.md). Everything here was read from the
code on `master` at `dea64c3` (v0.4.1.0, 2026-09-14); `file:line` references are to that commit.
Paths are relative to `backend/` unless they start with `frontend/`.

## 0. TL;DR

- **One model, one function.** Every call is a single-turn, no-tools request to
  `ANTHROPIC_MODEL` (default `claude-sonnet-5`) through `callClaude` in `src/shared/ai/client.ts`.
  Streaming, an 8 192-token output cap, a per-call deadline, SDK retries on 429/529, and an
  encrypted row in `ai_call_logs` for every attempt.
- **Prompts live in the database.** `prisma/seed.ts` upserts eight `prompt_templates`; services
  load the active one per `service_type` and fill `{{PLACEHOLDERS}}` with JSON.
- **Zod is the output contract.** Each module parses the JSON text and validates it with its own
  schema. The `output_schema` column is decoration. A schema/template mismatch has broken
  production twice (v0.3.0 and PR #8).
- **The "retry with stricter format" is dead code.** Parsing happens after the retry wrapper
  returns, so a malformed answer fails once (G1). Schema failures surface as a 500 (G2).
- **Scores are model-assessed, not computed.** Since v0.4.1 the model scores substance against a
  rubric in the synthesis prompt; the deterministic numbers are *completeness* and only a
  fallback. The fallback's weights differ from the rubric's (G9).
- **Archetype is free text.** The prompt lists eight archetypes; nothing validates the answer
  against them, and the mock returns one that is not on the list (G3).
- **No request waits on the model.** Dedup maps, fire-and-forget chains, an in-memory job map
  and Bull queues; the UI polls. Most failures are logged, few are shown.
- **Output is English-only** even though the UI has French (G14).
- **Quality has never been measured systematically.** "25/25" was a manual checklist; the one
  quantified prompt change was one real run of one profile. `ai_call_logs` has no reader and
  the identity rating is read only by the funnel script. §11 is the plan.

## 1. Layers

```
route ──► service ─────────────────────────────────────────────────────────► repository
             │  loadActiveTemplate(serviceType)      src/shared/ai/prompt-loader.ts:6
             │  assemblePrompt(template, {{VARS}})   src/shared/ai/prompt-loader.ts:22
             │  callClaudeWithRetry(options)         src/shared/ai/retry.ts:22   (see §3)
             │     └─ callClaude(options)            src/shared/ai/client.ts:111 (see §2)
             │           ├─ anthropic.messages.stream(...).finalMessage()
             │           ├─ AbortController deadline (timeoutMs)
             │           └─ prisma.aiCallLog.create (encrypted prompt + response)
             │  parseJsonResponse(text, ZodSchema)   src/shared/ai/retry.ts:64
             ▼
        module-specific merge (ids, fallbacks, cooldowns) ──► Prisma write ──► UI polls
```

Behind the SDK sits either the real API or `scripts/mock-anthropic.mjs` when
`ANTHROPIC_BASE_URL=http://localhost:3999`. The mock recognises each prompt by regex and replays
a canned JSON answer as server-sent events; it is the fixture source for
`src/shared/ai/schema-contract.test.ts`.

## 2. `callClaude` anatomy (`src/shared/ai/client.ts`)

| Line | What happens | Why it matters for prompt work |
|---|---|---|
| `:11` | `AI_MODEL = process.env.ANTHROPIC_MODEL \|\| 'claude-sonnet-5'` | Model swap is an env change; the eval (§11) should run both `claude-sonnet-5` ($2/$10 per MTok) and `claude-opus-5` ($5/$25) |
| `:13-23` | Lazy `Anthropic` client, optional `anthropic-workspace-id` header | Org-level keys need `ANTHROPIC_WORKSPACE_ID` |
| `:34-62` | `verifyAiCredentials()` — one `models.retrieve(AI_MODEL)` probe at startup | Feeds `/health.checks.ai`; a wrong model id is loud in the logs |
| `:69-88` | `noteAiOutcome()` — auth / permission / "credit balance" errors flip `ai` to false | Why an empty account shows up in `/health` and not only in request logs |
| `:92-93` | `DEFAULT_TIMEOUT_MS = 120_000`, `MAX_OUTPUT_TOKENS = 8192` | **8 192 includes thinking tokens.** Sonnet 5 runs adaptive thinking when no `thinking` param is sent, so a long think can push a big JSON past the cap → `stop_reason: max_tokens` → parse failure. Streaming is already on, so the cap can be raised (candidate P4) |
| `:111-115` | `fullPrompt = system + "\n\n" + user`, sha256 `inputHash` | The hash is the dedup key you would use to find identical prompts in `ai_call_logs` |
| `:122-146` | `messages.stream({ model, max_tokens, system, messages:[user] }, { signal, maxRetries: 2 })` + own `AbortController` | The SDK `timeout` only covers time-to-first-byte on a stream; the abort is the real budget. 429/529 get two backed-off retries inside that budget |
| `:150-156` | Warn when `stop_reason === 'max_tokens'` | Grep the logs for this line — it is the truncation counter you have today |
| `:158-172` | Concatenate `text` blocks; skip `thinking` / `redacted_thinking` | Thinking text is empty by default on Claude 5 (`display: "omitted"`) — nothing to store |
| `:174-185` | `tokensUsed = input + output`; info log with the split | **The DB row stores only the sum** (`tokensUsed`); the split exists only in pino output (candidate P10) |
| `:189-203` / `:210-224` | `ai_call_logs` row on success / failure, `fullPrompt` and `fullResponse` AES-encrypted | The eval dataset you already have — see §11 Tier C |

Not used anywhere: `temperature`/`top_p` (removed on Claude 5 anyway), `output_config.effort`,
prompt caching, tools, structured outputs (`output_config.format`), few-shot examples, a language
instruction. The SDK is pinned at `@anthropic-ai/sdk` 0.39.0 (`package.json:19`), which predates
the structured-outputs helper (`zodOutputFormat` / `messages.parse`) — an upgrade is the
prerequisite for candidate P11.

Tests: `client.test.ts` runs a local SSE server and proves delta assembly, usage reporting and the
abort of a stalled stream at the deadline.

## 3. The truth about `callClaudeWithRetry` (`src/shared/ai/retry.ts`)

The design (research.md, CLAUDE.md) says: "retry with stricter format on parse failure". The
code cannot do that:

```
callClaudeWithRetry(options)          retry.ts:22
  try { return await callClaude(options) }        ← returns raw TEXT; never parses
  catch (err) {
    if (!isFormatError(err)) → AppError('AI_SERVICE_ERROR', 503)   ← every API/timeout error
    else → callClaude(options + STRICTER_FORMAT_SUFFIX)            ← unreachable
  }
...
const parsed = parseJsonResponse(aiResult.content, Schema)   ← in every caller, AFTER the wrapper
```

`isFormatError` (`:16-20`) looks for a `ZodError` or `AI_PARSE_ERROR`, but `callClaude` only ever
throws SDK errors and the timeout error. Every caller parses afterwards
(`identity/service.ts:189`, `strategy/service.ts:155,261`, `simulation/service.ts:131`,
`insight/service.ts:148`, `growth/generation.ts:226,303`), so:

- a malformed or off-schema answer fails **once**, with no second attempt;
- `parseJsonResponse` throws `AI_PARSE_ERROR` (503) for non-JSON (`:79-83`) but re-throws the raw
  `ZodError` for schema failures (`:98`), which the error handler does not recognise → 500
  `INTERNAL_ERROR` if it ever reaches a route. In practice the callers run in the background and
  translate anything that is not an `AppError` into "We couldn't process your request right now"
  (`identity/service.ts:40-44`, `simulation/service.ts:60-65`), so the user sees a generic
  failure and the logs hold the Zod detail;
- the wrapper's real job today is converting SDK errors into a friendly 503.

Fixing this is candidate P2. Until then, remember that "the model returned bad JSON" and "the
model returned JSON we don't accept" are one-shot failures, and that the schema-contract test is
the only thing standing between a template edit and a silent production outage.

## 4. Templates (`prisma/seed.ts`)

- Eight `PromptServiceType` values (`prisma/schema.prisma:50-59`), each seeded at `version: 1,
  isActive: true` (`seed.ts:8-296`). The upsert key is `(serviceType, version)` (`:298-313`), so
  **editing v1 in place and re-seeding overwrites the live prompt** — hot-swap by design, and the
  reason to add a `version: 2` entry instead when you want a rollback path (§9).
- Loading: `loadActiveTemplate(serviceType)` = `findFirst({ serviceType, isActive: true })`
  (`prompt-loader.ts:6-20`). There is exactly one active row per type; nothing supports A/B.
- Assembly: `assemblePrompt(text, vars)` replaces every literal `{{KEY}}` (case-sensitive,
  split/join — values are never treated as regex) and warns on any leftover `{{[A-Z_]+}}`
  (`prompt-loader.ts:22-33`). The v0.3.0 bug was lowercase keys → the model received the literal
  placeholder text.
- `outputSchema` (`:55-58` etc.) is stored and returned by the admin API, but nothing validates
  against it (G5). The Zod schemas in the modules are the contract.
- `scoring` (`:188-202`) is seeded and never loaded; audit sub-scores come from
  `src/modules/audit/scoring.ts` (completeness). Its text still says "consider completeness",
  the opposite of the v0.4.1 rubric (G4).
- The system prompt is **not** in the template. Each service passes a one-sentence hard-coded
  `systemPrompt` and the assembled template as the user message (simulation inverts this — G7).
- Admin API (`src/modules/admin/routes.ts`, role `admin`, no UI): `GET /admin/prompt-templates
  [?service_type=]`, `GET /admin/prompt-templates/:id` (with content), `POST /admin/prompt-templates`
  `{ service_type, template_content, output_schema? }` → next version, inactive; `PUT
  /admin/prompt-templates/:id/activate` (transactional swap). `VALID_SERVICE_TYPES`
  (`admin/routes.ts:9`) lists only five types — `strategy_activation`,
  `growth_path_generation` and `cross_path_analysis` cannot be versioned through the API (G6).

### What each template asks for

| Type | Placeholders | Output shape the template promises | Notable instructions |
|---|---|---|---|
| `identity_synthesis` (`seed.ts:10-59`) | `AUDIT_DATA` | `archetype, readiness_score, sub_scores{5}, radar_data{6}, headline_insight, ai_insights{contradictions, feasibility, gaps, strengths, recommendations}` | 8 archetypes with one-line definitions (`:20-30`); substance rubric with dollar/hour/deal anchors per axis and readiness weights capital 25 / skills 20 / time 15 / network 15 / goal_clarity 15 / risk 10 (`:34-42`); "be conservative: a first-time investor with no team should land well below 60" |
| `strategy_generation` (`:60-92`) | `IDENTITY` | `strategies[{name, description, fit_score, pros[], cons[], rank}]` | "exactly 3", ranked by fit, 2–3 sentence description |
| `strategy_activation` (`:93-127`) | `STRATEGY_NAME, STRATEGY_DESCRIPTION, ARCHETYPE, READINESS_SCORE, SUB_SCORES, RADAR_DATA` | `action_plan.items[], roadmap.milestones[{target_date}], micro_plan.tasks[{estimated_minutes}]` | "72-hour micro-plan"; no count guidance |
| `simulation` (`:128-160`) | `CURRENT_IDENTITY, MODIFICATIONS` | `archetype, readiness_score, sub_scores{}, radar_data{}, headline_insight, strategy_changes` | asks for "score deltas" but the JSON shape has no delta field — the service computes deltas itself |
| `insight` (`:161-187`) | `CONTEXT` | `insights[{type, title, message, severity, action_url}]` | 2–5 insights; five types; `action_url` must be a relative path |
| `scoring` (`:188-202`) | `AUDIT_TYPE, RESPONSES` | `score, breakdown{}` | unused |
| `growth_path_generation` (`:203-241`) | `PATH_TYPE, IDENTITY, AUDIT_DATA, STRATEGY_CONTEXT, PRIOR_PATHS, PATH_SPECIFIC_INSTRUCTIONS, OUTPUT_FORMAT` | per path type; `content{}, action_items[], summary` | the path-specific block and JSON skeleton are injected from `growth/generation.ts:68-136`; skills/time paths are `'{}'` stubs |
| `cross_path_analysis` (`:242-295`) | `IDENTITY, PATHS` | `links[{type, source_*, target_*, description, resolution}], next_best_action{}` | four link types; "single Next Best Action" |

None of the templates carries the guardrails the PRD specified (no guarantees, no legal/tax
advice, flag professional consultation) — G15.

## 5. Per-service reference

### Table A — the call

| Service type | Trigger | Caller | System prompt | Zod schema | Timeout |
|---|---|---|---|---|---|
| `identity_synthesis` | 5th audit completes, a newer audit version, or `POST /identity/synthesize` | `identity/service.ts:157-189` | inline `:184` | `AiSynthesisResponseSchema` `identity/types.ts:37-65` | 180 s |
| `strategy_generation` | chained after synthesis; or `GET /strategies` with nothing stored for the current identity | `strategy/service.ts:127-155` | inline `:150` | `AiStrategyResponseSchema` `strategy/types.ts:76-87`, then "exactly 3" check `strategy/service.ts:157-163` | 180 s |
| `strategy_activation` | `PUT /strategies/:id/activate` (background) | `strategy/service.ts:239-261` | inline `:256` | `AiActivationResponseSchema` `strategy/types.ts:118-145` | 240 s |
| `simulation` | `POST /simulations` → in-memory job | `simulation/service.ts:107-131` | **the assembled template** (`:127`); user turn repeats the modifications (`:128`) | `SimulationResultSchema` `simulation/service.ts:17-24` | 120 s (default) |
| `insight` | dashboard load with cold/stale cache; warm-up after synthesis; invalidated on activation | `insight/service.ts:122-148` | inline `:144` | `InsightResponseSchema` `insight/service.ts:23-33` | 120 s (default) |
| `growth_path_generation` | Bull job: auto after synthesis when the tenant flag is on (`growth/service.ts:82-128`), or `POST /growth-strategy/paths/:type/generate` | `growth/generation.ts:189-226` | inline `:220` | `PathGenerationResponseSchema` `generation.ts:22-26` | 240 s |
| `cross_path_analysis` | Bull job after a path job when ≥2 paths are `generated` (`workers/growth-path-worker.ts:60-71`) | `growth/generation.ts:275-303` | inline `:298` | `CrossPathAnalysisResponseSchema` `generation.ts:52-55` | 120 s |
| export summary (logs as `insight`) | `POST /growth-strategy/export/markdown` | `growth/export.ts:437-464` | inline `:445`; **no template** (the insight template is loaded only for its id) | none — plain text, hard-coded fallback paragraph | 90 s |

### Table B — around the call

| Service type | Output stored in | UI + polling | Mock detector (`scripts/mock-anthropic.mjs:121-131`, first match wins) | Gaps |
|---|---|---|---|---|
| `identity_synthesis` | `identity_versions` (archetype, readiness_score, sub_scores, radar_data, headline_insight, ai_insights, audit_snapshot) | `frontend/app/(authenticated)/identity/page.tsx` polls `GET /identity/status` 80 × 3 s; error via `last_error` | `/readiness_score/` (checked last) | G1 G2 G3 G9 G14 G15 |
| `strategy_generation` | `strategies` × 3 | `strategies/page.tsx` polls the envelope's `generating` 80 × 3 s; a failure just regenerates on the next visit | `/"strategies"/` | G1 G10 |
| `strategy_activation` | `strategies.action_plan / roadmap / micro_plan` (+ generated ids, 72 h `expires_at`) | `strategies/[id]/page.tsx` re-fetches 100 × 3 s until `action_plan` exists, then stops silently | `/"micro_plan"/` | G1 |
| `simulation` | `simulations.result_delta` | `simulation/page.tsx` polls the job 90 × 2 s; `failed` → generic message; 3 per 24 h | `/strategy_changes/` | G1 G7 |
| `insight` | `users.insights_cache` (6 h TTL) | dashboard feed; never blocks; errors never shown | `/"insights"/` | G8 |
| `growth_path_generation` | `growth_paths.content / action_items / summary`, 1 h regeneration cooldown | `growth-strategy/page.tsx` refetches every 3 s while any path is `generating` (no cap); failure = path silently back to `unlocked` | `/scaling_plan\|capital_acceleration_plan\|growth path/i` | G1 G11 |
| `cross_path_analysis` | `growth_strategies.cross_path_links / next_best_action` | growth page (links + NBA) | `/next_best_action/` | G1 |
| export summary | first paragraph of the zip's entry file | download button | `/export document/i` | G8 |

### How each input is built

- **identity_synthesis** (`identity/service.ts:129-177`). `getCompletedAuditsForSynthesis`
  returns the latest completed version per audit type with the 14 financial fields **decrypted**
  (`audit/repository.ts:203-241`). The prompt receives `{ audits: [{type, version, subScore,
  responses}], completeness: { by_audit, overall, by_dimension } }` — the whole questionnaire,
  plus the deterministic numbers explicitly labelled as completeness so the model does not
  mistake them for readiness. Field names the model sees are the ones in
  `src/modules/audit/types.ts:1-158` (e.g. `assets.liquid_cash`, `availability.hours_per_week`,
  `network.lenders`, `scenarios.market_drop_20_response`). Values are free-form: validation only
  requires one non-empty field per section (`audit/validation.ts:14-43`), so "$45k", "45000" and
  "about forty-five thousand" all reach the model.
- **strategy_generation** (`strategy/service.ts:130-143`): the stored identity — archetype,
  readiness, sub-scores, radar, headline, `ai_insights`. No audit data, so the strategies can
  only be as specific as the insights the synthesis wrote.
- **strategy_activation** (`:242-249`): strategy name + description, archetype, readiness,
  sub-scores, radar. No insights, no audit data, no dates — `target_date`s are invented relative
  to nothing (the model has no "today").
- **simulation** (`simulation/service.ts:108-128`): current archetype + scores as the *system*
  prompt, and `{ "capital": 85 }`-style modifications (keys whitelisted in
  `simulation/routes.ts:11-24`, numbers 0–100 only) in both the system template and the user turn.
- **insight** (`insight/service.ts:123-137`): archetype, scores, the active strategy's name /
  fit / action plan / roadmap JSON, task counts (total, completed, overdue) and the contact roles
  covered. This is the only prompt that sees engagement data.
- **growth_path_generation** (`growth/generation.ts:146-212`): identity summary, audits as
  `{type, sub_score, version}` only (comment at `:151-152`: never send raw responses to the
  provider — note this is the opposite policy from synthesis), the active V1 strategy with its
  plans, previously generated paths for continuity, then the path-specific instruction block and
  the JSON skeleton.
- **cross_path_analysis** (`:276-291`): archetype + readiness, and every generated path's content,
  action items (with ids) and summary.
- **export summary** (`export.ts:445-446`): two sentences of context (archetype, readiness,
  version) and a request for one paragraph of plain text.

## 6. Score semantics — read before touching anything called "score"

Three different numbers share the words "sub-score", "readiness" and "radar":

1. **Completeness** (deterministic). `audit/scoring.ts:33-48` — share of non-empty fields per
   audit; `identity/radar.ts:77-94` — same idea per radar axis (network = how many of seven role
   categories have a count > 0); `identity/scoring.ts:32-39` — weighted average with weights
   financial 20 / time 15 / skills 20 / risk 20 / horizon 25 (`:20-26`). Anyone who fills in every
   field scores 100 here. These are stored on `audits.sub_score` and passed to the model
   labelled `completeness`.
2. **Substance** (model-assessed, v0.4.1, commit `096df18`). The synthesis prompt's rubric
   (`seed.ts:34-42`) defines anchors — capital: under $10k 0–20, $10–30k 20–40, $30–75k 40–60,
   $75–150k 60–80, over $150k 80–100; time by hours/week; skills by deals done; network by roles
   present; goal_clarity by specificity and realism — and readiness = capital 25 % + skills 20 %
   + time 15 % + network 15 % + goal_clarity 15 % + risk fit 10 %. The recorded effect on the
   smoke profile: readiness 100 → 56, capital 75, network 20, skills 38, same archetype twice.
3. **What gets stored** (`identity/service.ts:191-196`): `{ ...completeness, ...compact(model) }`
   per field, and `readiness_score = model ?? calculateReadinessScore(mergedSubScores)`. The Zod
   `score` preprocessor (`identity/types.ts:32-35`) coerces numeric strings, rounds, and turns
   anything outside 0–100 into `undefined` → that one field silently falls back to completeness.
   So a partially bad answer produces a *mixed* identity: substance on some axes, completeness on
   others, with nothing recording which was which.

Consequences:

- The fallback weights (1) and the rubric weights (2) disagree (G9). When the model omits
  `readiness_score`, the stored number is a completeness-weighted average of substance sub-scores.
- `sub_scores.skills` in the rubric means "skills and network together", while `radar.skills`
  and `radar.network` are separate — the prompt says so, the schema does not check consistency.
- Simulation's schema (`simulation/service.ts:17-24`) requires a numeric `readiness_score` and
  numeric maps with no coercion — stricter than synthesis, so the same model habit (a string
  number) fails there and passes here.
- `archetype` is `z.string().min(1).max(100)` (`identity/types.ts:38`). Nothing checks it is one
  of the eight, so "Analytical Cash Flow Builder" (the mock's answer) or "Cash-Flow Hunter" are
  stored verbatim and become the user's identity (G3). `archetypeChanged` in simulations and
  history compares strings.
- The insight, strategy and growth prompts consume the stored numbers without knowing whether
  they were substance or fallback.

## 7. Async behaviour and what the user sees on failure

| Surface | Mechanism | On model failure the user sees |
|---|---|---|
| Synthesis | dedup map + `lastSynthesisError` (`identity/service.ts:24-46`); `POST` returns 202; `GET /identity/status` → `{ generating, latest_version, last_error }` | the stored message ("We couldn't process…" or the `AppError` text) with a retry button; after 80 polls (4 min) the client shows `TIMEOUT` |
| Strategies | dedup map; `GET /strategies` starts generation when none exist and answers `generating: true` (`strategy/service.ts:72-90`) | nothing — an empty list that regenerates on the next visit; 80 polls then `TIMEOUT` |
| Activation plans | fire-and-forget (`strategy/service.ts:210`) | "plan pending" banner; polling stops silently after 100 × 3 s; plans stay `null` forever with no retry path except re-activating |
| Simulation | in-memory job (`simulation/service.ts:30-73`) | `failed` job → generic message (or the 429 text); job lost on restart |
| Insights | SWR cache (`insight/service.ts:60-96`) | stale feed or an empty one; never an error |
| Growth path | Bull job, `attempts: 1`; failure → `revertPathToUnlocked` (`workers/growth-path-worker.ts:72-83`); stuck rows swept after 5 min | the card goes from "generating" back to "generate" with no message (G11) |
| Cross-path | Bull job; failure logged only | no links / no next best action, no message |
| Export summary | try/catch with hard-coded fallback paragraph (`export.ts:459-462`) | a generic intro paragraph |

## 8. Known gaps and sharp edges

Numbered so §10 and §11 can point at them. "Effect" is what a user or you would notice.

| # | Gap | Where | Effect |
|---|---|---|---|
| G1 | Stricter-format retry is unreachable | `src/shared/ai/retry.ts:22-55` + every caller parsing after the wrapper | one malformed answer = one failed synthesis / strategy / plan / path; no second attempt |
| G2 | `ZodError` not mapped by the error handler | `retry.ts:98`, `src/shared/middleware/error-handler.ts:49-57` | schema failures become 500 / generic text; the useful `zodErrors` detail is only in the log line |
| G3 | Archetype not validated against the curated list | `identity/types.ts:38`; mock returns an off-list name (`scripts/mock-anthropic.mjs:25`) | drift and typos become identities; history/simulation "archetype changed" compares raw strings; the mock never exercises this |
| G4 | `scoring` template seeded, never loaded; text contradicts the rubric | `seed.ts:188-202`; `audit/scoring.ts` is what runs | confusing for anyone editing prompts; admin API lists it as a real type |
| G5 | `output_schema` stored, never enforced | `seed.ts` `outputSchema`, `prisma/schema.prisma:313` | a false sense of contract; Zod is the truth |
| G6 | Admin allowlist omits three types | `src/modules/admin/routes.ts:9` | `strategy_activation`, `growth_path_generation`, `cross_path_analysis` can only be versioned via seed or SQL |
| G7 | Simulation puts the template in `system` and repeats the modifications in the user turn | `simulation/service.ts:122-129` | works, but is the one prompt whose structure differs from the others; any shared system-prompt or caching change must special-case it |
| G8 | Export summary bypasses templates and logs under `insight` with the insight template id | `growth/export.ts:437-464` | insight metrics in `ai_call_logs` mix two prompts; the export prompt cannot be edited without a deploy |
| G9 | Readiness weights defined twice, differently | rubric `seed.ts:42` vs `identity/scoring.ts:20-26` | fallback readiness is computed with the wrong weights when the model omits `readiness_score` |
| G10 | Strategy schema accepts 1–5 strategies; "exactly 3" is enforced after parsing | `strategy/types.ts:86`, `strategy/service.ts:157-163` | a 4-strategy answer fails the whole generation instead of being trimmed or retried |
| G11 | Growth path failure is invisible | no `failed` value in `GrowthPathStatus` (`prisma/schema.prisma:68-73`); worker reverts to `unlocked` | user retries blindly; nothing to show them why |
| G12 | `ai_call_logs` has writers only; `tokens_used` is input+output summed; no `stop_reason`; no FK from `identity_versions` to its log row | `client.ts:174,189-224` | the richest quality dataset is unread; cost per call can't be split; joining a rating to its prompt needs a timestamp match |
| G13 | AI activity-log helpers never called | `src/modules/logging/service.ts:17,26,53,62` | `activity_logs` has no `identity.synthesized` / `strategy.generated` / `simulation.run` events |
| G14 | No language variable; locale never leaves the browser | `assemblePrompt` call sites; `frontend/lib/i18n.tsx` | French users get English identities, strategies and insights |
| G15 | No guardrails block in any template | `seed.ts` | nothing stops "guaranteed 12 % returns" or tax advice; PRD `:420-445` specified guardrails |
| G16 | Per-feature AI rate limiters defined, not applied | `src/shared/middleware/rate-limiter.ts:61-109` | a user can re-synthesize back-to-back (each run = 3–4 model calls) up to the 120/min brake |
| G17 | Spec and contract drift | `spec.md:194` (FR-3 "deterministic sub-scores"), `contracts/api-v1.md:302-327` (sync 200 synthesize; no `/identity/status`, `generating`, `/simulations/jobs/:id`, feedback text), GSE "< 30 s" targets, `plan.md:116-125` circuit breaker never built | anyone coding from the spec rebuilds v0.3 behaviour |
| G18 | Pinned SDK 0.39.0 predates structured outputs | `package.json:19` | P11 needs an upgrade first |
| G19 | No eval of any kind beyond the contract test; `spec.md:383`'s "3 sample profiles" never happened | — | §11 |

## 9. Changing a prompt safely

The loop that fits the code as it is today:

1. **Edit the text in `prisma/seed.ts`.** Prefer adding a new object (`version: 2, isActive: true`)
   and flipping the old one to `isActive: false` over editing v1 in place — the seed upserts both
   rows, so `npx prisma db seed` rolls forward and swapping the two booleans rolls back. Keep the
   JSON shape block in sync with the module's Zod schema; keep every `{{PLACEHOLDER}}` the caller
   passes (they are listed in §4's table — an extra placeholder in the template is a logged
   warning and literal `{{TEXT}}` in the prompt; a missing one is silently ignored).
2. **`cd backend && npx prisma db seed`** (upsert, safe to repeat). The running server picks it up
   on the next call — templates are loaded per call, not cached.
3. **Mock run.** `node scripts/mock-anthropic.mjs &` then start the backend with
   `ANTHROPIC_BASE_URL=http://localhost:3999 ANTHROPIC_API_KEY=sk-ant-mock`. This proves
   assembly and parsing, not quality. If you changed the JSON shape, update the canned answer in
   `mock-anthropic.mjs` and check the `detect()` regex (`:121-131`) still recognises your prompt —
   the detectors key off literal strings such as `"micro_plan"` and `readiness_score`.
4. **`npm test`** in `backend/`. `schema-contract.test.ts` must be updated with the new sample
   shape in the same commit; `prompt-loader.test.ts` covers placeholder casing.
5. **One real run** on a throwaway account (register, complete the five audits, watch
   `/identity/status`), then read the row: `SELECT service_type, success, tokens_used, latency_ms,
   error_message FROM ai_call_logs ORDER BY id DESC LIMIT 5` and decrypt `full_response` with
   `decryptField` if you need the text (it is AES-encrypted with `AUDIT_ENCRYPTION_KEY_V1`).
   Better: run the Tier B eval from §11 instead of one account.
6. **Deploy.** The `api` container runs the seed on start (`docs/deploy.md:93-97`), so the new
   version goes live with the image; there is no separate "publish prompt" step. To swap without
   a deploy, `POST /admin/prompt-templates` + `PUT /admin/prompt-templates/:id/activate` for the
   five allowed types, or `UPDATE prompt_templates SET is_active = ... WHERE service_type = ...`
   for the other three (G6) — **and mirror the change into `seed.ts` before the next deploy.**
   The seed only touches the versions listed in the file, but it re-asserts `is_active: true` on
   v1, so a DB-only v2 leaves you with *two* active rows, and `loadActiveTemplate` is a
   `findFirst` with no `orderBy` (`prompt-loader.ts:7-9`) — it will pick one arbitrarily.

Rules that follow from §2–§6:

- Never change a placeholder name without changing the call site — `assemblePrompt` is
  case-sensitive and warns instead of failing.
- Any new field the template promises must be optional or defaulted in the Zod schema until the
  eval says the model reliably returns it; any field the schema requires must be in the
  template's JSON block. Think of `AiSynthesisResponseSchema` (lenient, `.catch(undefined)`) as
  the model to copy, and `SimulationResultSchema` (strict) as the one that bites.
- Do not tune `timeoutMs` against the mock; the mock answers in milliseconds, the real model in
  tens of seconds (`CHANGELOG.md:7`).
- The system prompt is code, not data: a wording change there is a deploy, not a seed.

## 10. Prompt and pipeline improvement candidates

Prioritised for the two weeks before BPCON. "Verify" names the eval tier from §11 that proves
the change. P1–P4 are the ones that change what a beta user sees or what it costs.

| # | Pri | Change | Where | Verify |
|---|---|---|---|---|
| P1 | High | **Validate the archetype.** Export the eight names as a const, use `z.enum` (or normalise case/punctuation then check membership, with a documented fallback such as "retry once with `Choose exactly one of: …`"). Fix the mock's canned name so mock runs exercise it. Closes G3. | `identity/types.ts:38`, `seed.ts:20-30`, `scripts/mock-anthropic.mjs:25`, `schema-contract.test.ts` | A (contract test rejects an off-list name) + B (0 off-list across the set) |
| P2 | High | **Make the retry real.** Move parsing into the wrapper: `callClaudeWithRetry({ ...options, schema })` parses inside the `try`, so a `ZodError` / `AI_PARSE_ERROR` triggers the stricter second attempt; map `ZodError` to `AI_PARSE_ERROR` in the error handler. Closes G1, G2, halves the blast radius of G10. | `retry.ts:22-55`, six call sites, `error-handler.ts:36-57` | `retry.test.ts` with malformed-then-valid streams (extend the SSE harness from `client.test.ts`); C: parse-failure rate |
| P3 | High | **Guardrails block** as v2 of the synthesis, strategy, activation and growth templates: no return guarantees, no legal/tax advice, name when to consult a professional, say when data is too thin to judge, never invent facts about the user. Closes G15. | `seed.ts` (new `version: 2` objects) | B (regex for "guarantee", "will return", judge criterion) |
| P4 | High | **Output budget and effort.** Raise `MAX_OUTPUT_TOKENS` (8 192 includes adaptive-thinking tokens; the call already streams, so 16k–32k costs nothing unless used) and log `stop_reason` to the DB. Optionally set `output_config: { effort }` per service (`low` for insight and the export paragraph, default `high` for synthesis) once you have Tier C numbers. | `client.ts:93,126-137` | C: zero `max_tokens` stops; latency per type before/after |
| P5 | Med | Add the three missing types to `VALID_SERVICE_TYPES`. Closes G6. | `admin/routes.ts:9` | route test |
| P6 | Med | Un-invert simulation: short system prompt, assembled template as the user turn, modifications once. Closes G7. | `simulation/service.ts:122-129` | A (mock detector on `strategy_changes` still matches) + B |
| P7 | Med | One source of truth for readiness weights: export the rubric weights from a shared module, use them in `calculateReadinessScore`, and interpolate them into the template (`{{WEIGHTS}}`) so prompt and fallback cannot drift. Closes G9. | `identity/scoring.ts:20-26`, `seed.ts:42` | unit test + A |
| P8 | Med | `{{LANGUAGE}}` in every template ("Write all user-facing text in {{LANGUAGE}}"), a `locale` column on `users` or an `Accept-Language` header read in `authenticate`, passed by every call site. Closes G14. | templates, `frontend/lib/api-client.ts`, call sites | B with a French fixture; judge criterion "language matches" |
| P9 | Med | Give the export paragraph its own `export_summary` service type (append-only migration adding the enum value) and template. Closes G8. | `prisma/schema.prisma:50-59`, `growth/export.ts:437-464`, `seed.ts` | C: insight rows no longer mixed |
| P10 | Med | Store `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `stop_reason` and `template_version` on `ai_call_logs` (migration), and write `identity_versions.ai_call_log_id`. Closes most of G12. | `client.ts:189-224`, schema | C report becomes exact |
| P11 | Med | **Structured outputs** after upgrading `@anthropic-ai/sdk`: `output_config: { format: zodOutputFormat(Schema) }` makes the API return schema-valid JSON, removing fence-stripping and most of P2's second attempts. Check the helper's Zod 4 support and that it composes with `messages.stream()` in the version you land on. Closes G18. | `client.ts`, all schemas | A + B; C: parse failures → 0 |
| P12 | Med | Apply `synthesizerLimiter` / `strategyLimiter` or delete them. Closes G16. | `identity/routes.ts:41`, `rate-limiter.ts:61-92` | route test |
| P13 | Low | Strategy schema `.length(3)` with unique ranks 1..3, or trim to three and warn. Closes G10. | `strategy/types.ts:76-87` | A |
| P14 | Low | Prompt caching. Only worth it if the static prefix (rubric + archetypes + instructions) is moved into `system` **and** exceeds Sonnet 5's 1 024-token minimum, and traffic shares that prefix within the 5-minute TTL (true during the venue hour, false at 3 users/day). Cache reads cost ~0.1× input, writes 1.25×. | `client.ts`, `seed.ts` | C: `usage.cache_read_input_tokens` > 0 |
| P15 | Low | Few-shot examples in the synthesis template — one thin profile, one strong profile, with the expected scores. Wait for Tier C to show which profiles the model misjudges. | `seed.ts` | B |
| P16 | Low | Drop `output_schema` or generate it from Zod and assert equality in the contract test; deactivate `scoring`. Closes G4, G5. | `seed.ts`, `schema-contract.test.ts` | A |
| P17 | Low | Model experiment: run Tier B with `ANTHROPIC_MODEL=claude-opus-5` and compare quality, latency and cost against `claude-sonnet-5` before deciding what the campaign runs on. | env | B |
| P18 | Low | Wire `logIdentitySynthesized` / `logStrategyGenerated` / `logSimulationRun` so `activity_logs` can drive funnel metrics without touching `ai_call_logs`. Closes G13. | callers in identity/strategy/simulation services | funnel report |

Template-text ideas to test (all Tier B, all as v2 rows):

- **Synthesis**: ask for `evidence` per score ("one phrase quoting the audit value that set this
  band") — cheap self-consistency, and it makes the judge's job trivial. Ask for the archetype
  *and* the runner-up with a one-line reason; the UI can ignore the runner-up.
- **Strategies**: pass the two or three audit facts that matter most (market, capital, hours)
  rather than only the identity, so names stop being generic ("BRRRR in Midwest markets" for
  someone in Montréal). Require `fit_score` to be strictly descending.
- **Activation**: pass today's date; require `target_date` to be relative to it and `estimated_minutes`
  per micro-task to sum to under a few hours.
- **Insight**: pass the *previous* insights so the feed does not repeat itself every six hours.
- **Growth**: the `Growth_Strategy_Engine.md:293-299` behaviour spec ("a financial advisor
  noticing things the user missed — not generic 'save more money' advice") is a ready-made
  judge criterion; put a shortened version in the template too.

## 11. Evals — three tiers

An eval is three things: a set of inputs, a way to run the app on each, and a way to grade each
output. Build one flow at a time; **identity synthesis first**, because every other prompt
consumes its output and it is the only one with a rubric to check against. When you are ready
to build it, `/claude-api build-eval identity synthesis` in Claude Code runs a guided interview
(inputs sign-off, grading sign-off, runner, HTML report) and `/claude-api hillclimb` iterates a
template version against the result — the design below is what to feed it.

### Tier A — contract tests (exists)

`src/shared/ai/schema-contract.test.ts` proves each Zod schema accepts the JSON shape its
template asks for, using hand-written samples that mirror the mock. Keep it, extend it with
every template change (§9 step 4), and know its limit: it never sees model output. Both real-API
breakages so far (v0.3.0's three schema mismatches, PR #8's `null` item ids) were things the
model actually did that no sample anticipated. Tier B exists to catch that class.

### Tier B — golden-profile eval against the real API (recipe)

**Inputs.** A fixture is one investor: five audit `responses` objects shaped exactly like
`src/modules/audit/types.ts:1-158`, plus what a correct answer must satisfy. Keep them in
`backend/evals/fixtures/profiles/<id>.json`:

```json
{
  "id": "thin-first-timer",
  "description": "No deals, $8k cash, 3 h/week, no team, vague goals — must land low everywhere.",
  "tags": ["seed", "low-readiness"],
  "audits": {
    "financial": { "income": { "primary_income": "52000", "income_stability": "stable" },
                   "assets": { "liquid_cash": "8000", "retirement_accounts": "15000" },
                   "liabilities": { "total_monthly_debt": "900", "credit_card_balances": "4000" },
                   "credit": { "credit_score_range": "640-679" },
                   "tax": { "effective_tax_rate": "22" } },
    "time":      { "availability": { "hours_per_week": 3 }, "flexibility": { "remote_work": "no" },
                   "preferences": { "active_vs_passive": "passive" }, "runway": { "months_expenses_saved": 1 } },
    "skills":    { "re_experience": { "properties_owned": 0, "years_investing": 0 },
                   "professional": { "current_industry": "retail" }, "transferable": { "project_management": "no" },
                   "education": { "highest_degree": "high school" },
                   "network": { "agents": 0, "lenders": 0, "contractors": 0, "attorneys": 0, "cpas": 0, "mentors": 0, "partners": 0 } },
    "risk":      { "self_assessment": { "risk_tolerance_self_rating": 8 }, "scenarios": { "market_drop_20_response": "sell" },
                   "safety": { "emergency_fund_months": 1 }, "behavioral": { "sleep_test": "would worry" }, "comfort_zones": { "leverage_comfort": "high" } },
    "horizon":   { "objectives": { "goal_ranking": ["get rich"] }, "financial_targets": { "monthly_cashflow_target": 10000 },
                   "timeline": { "first_deal_timeline": "3 months" }, "lifestyle": { "involvement_level": "minimal" }, "constraints": {} }
  },
  "expected": {
    "archetype_in": ["Conservative Builder", "House Hacker"],
    "bands": { "capital": [0, 20], "time": [20, 40], "skills": [0, 20], "network": [0, 10], "goal_clarity": [0, 60] },
    "readiness_max": 40,
    "must_mention": ["reserves"],
    "contradiction_expected": true
  }
}
```

Bands are read off the rubric by hand for each fixture — that is the point: the fixture encodes
what the prompt *promises*, so a template change that breaks the promise fails the case. Six
seed profiles cover the space: thin first-timer, cash-rich passive professional, skilled-trades
operator, house-hacker with a small down payment, contradictory (high stated risk appetite, no
reserves, "sell on a 20 % drop"), and a near-empty profile (one field per section — the
validation minimum). A real eval needs 15–30; write the six, then vary them (market, capital,
hours, one field at a time) and, after the beta, replace the synthetic ones with **rewritten**
real profiles — audit responses are financial PII, so never copy a real user's data into the
repo; either rewrite each into a synthetic twin that keeps the shape and difficulty, or store
only ids and fetch from a local database copy at eval time.

**Runner.** Call the real entry point; do not rebuild the Claude call inside the eval, or you
measure a different program from the one users get. Two options, closest-to-production first:

1. *Black box over HTTP, zero app changes (do this first).* Against a **local** backend with the
   real key and a **local** database: per fixture, `POST /auth/register` an `eval+<id>@…` user,
   `PUT /audits/<type> { responses, complete: true }` five times (the fifth completion triggers
   synthesis), poll `GET /identity/status` until `generating` is false, then `GET /identity` and
   grade. The chained strategy and insight calls run too — that is free Tier B data for
   `strategy_generation` (grade it from `GET /strategies`); start the backend with
   `GROWTH_STRATEGY_DEFAULT_ENABLED=false` so growth jobs don't. A candidate template is tested
   by activating it in the local database (`POST` + `PUT …/activate`, or edit `seed.ts` and
   re-seed) — the local DB is the sandbox. Every call lands in local `ai_call_logs`, which is
   where latency and tokens come from. `npm run delete-user` cleans up, or reset the DB.
2. *In-process, after a small refactor (durable harness).* Extract
   `buildSynthesisVariables(audits)` from `identity/service.ts:158-177` and a
   `synthesizeFromAudits(audits, { template, tenantId, userId })` that runs the existing
   `assemblePrompt → callClaudeWithRetry → parseJsonResponse` chain without the database read.
   The eval calls that with fixtures, a template loaded from a file or by
   `(serviceType, version)`, and a dedicated eval tenant so its `ai_call_logs` rows are
   filterable. Faster, cheaper (no chained calls), and it exercises the exact assembly and
   parsing code — but it is new code, so it comes after the baseline exists.

Either way, the runner should: write one `results.jsonl` row per (case, rep) as it completes
(resume by skipping existing keys); save the full prompt and response per case under
`traces/`; record `model`, `usage` (from the response, never estimated), latency of the
successful call, `stop_reason`; put API errors, timeouts and unparseable answers in an
`errors.jsonl` sidecar with a failure class instead of scoring them 0; back off with jitter on
429; enforce a wall-clock ceiling per case; run ≥2 reps because the model is stochastic
(adaptive thinking is on by default). `/claude-api build-eval` ships a runner scaffold and a
report builder that already do this; results conventionally live in
`.claude/hillclimb/identity-synthesis/{baseline,v1,…}/` with `traces/` git-ignored.

**Grading, cheapest first.** Programmatic checks are the headline; each is its own metric so a
regression names itself:

| Check | identity_synthesis | strategy_generation | strategy_activation | insight | growth |
|---|---|---|---|---|---|
| parses + Zod accepts | ✔ | ✔ | ✔ | ✔ | ✔ |
| no `{{` in the prompt actually sent (assembly) | ✔ | ✔ | ✔ | ✔ | ✔ |
| `stop_reason == end_turn`, latency < 50 % of the timeout | ✔ | ✔ | ✔ | ✔ | ✔ |
| archetype ∈ the eight; ∈ `expected.archetype_in` when set | ✔ | | | | |
| every score present (no fallback used) and inside `expected.bands` | ✔ | | | | |
| `readiness_score ≤ expected.readiness_max`; readiness ≈ weighted sum of radar (±10) | ✔ | | | | |
| `contradictions` non-empty iff `expected.contradiction_expected` | ✔ | | | | |
| exactly 3, ranks {1,2,3}, distinct names, `fit_score` descending | | ✔ | | | |
| ≥3 action items, ≥2 milestones, 3–7 micro-tasks, minutes sum ≤ 480 | | | ✔ | | |
| 2–5 insights, `action_url` relative, types from the enum | | | | ✔ | |
| 5–10 action items, `priority_score` present, content keys match `OUTPUT_FORMATS` | | | | | ✔ |
| no "guarantee" / "guaranteed return" / "you will earn" phrasing | ✔ | ✔ | ✔ | ✔ | ✔ |
| set-level: archetype distribution across fixtures is not one label ≥ 60 % (mode collapse) | ✔ | | | | |

Then an **LLM judge** for the free text, one call per case with structured output, scoring
concrete claims rather than "quality 1–5": *cites at least two specific facts from the profile*;
*the headline is one sentence and names the binding constraint*; *each listed contradiction is
actually present in the audit data* (paste the audit alongside); *recommendations contain no
legal or tax advice and no return guarantees*; *score–text consistency* (text says "thin
network" ⇒ network band ≤ 35); for growth, the `Growth_Strategy_Engine.md:293-299` "not generic
advice" criterion. Judge with a different model from the one under test (`claude-opus-5` when
the app runs Sonnet 5); check the judge on a dozen cases you graded yourself first; feed it an
empty answer, "I don't know" and a confident wrong answer and confirm all three fail. For a v1 vs
v2 template comparison, prefer **pairwise**: freeze the baseline outputs on disk, show the judge
both answers with A/B randomised, allow `tie`.

**Before the first paid run**: push an oracle (a hand-written perfect answer) and a null (empty
JSON) through the grader and confirm ~100 % and ~0 %; then run a two-case pilot and read the
rows — `model`, `usage`, latency and the trace must all be present, or the full run will be
missing them too.

**Cost.** Derive it from the pilot's `usage`, not from a guess; the only numbers you have today
are `tokens_used` sums in local `ai_call_logs` from the real-API pass (P10 adds the split).
Order of magnitude to sanity-check the budget: at Sonnet 5 rates ($2 in / $10 out per MTok) a
synthesis of ~4k input and ~3k output (JSON + thinking) is ≈ $0.04, and the chained strategy
and insight calls roughly double it, so 20 profiles × 2 reps through option 1 is a few dollars
— fine on the $15 funded, not fine in a loop. A judge adds one call per case.

**What the number means.** With 20 cases × 2 reps the noise floor on a pass rate is about
±15 points (`1/√(n·reps)`), so a v2 that moves a metric by 5 points is invisible; ask for more
reps or more cases before believing small deltas, and compare per-check metrics, not one blended
score.

### Tier C — production signal (recipe)

`ai_call_logs` already holds every prompt and answer, encrypted, with model, tokens, latency and
success. Nothing reads it (G12). `backend/scripts/ai-log-report.ts`, run as
`npm run ai-report -- 7` and modelled on `scripts/funnel-report.ts`, should print for the last N
days:

1. Per `service_type`: calls, success rate, failure classes from `error_message` (timed out /
   parse / Zod / API), p50 and p95 `latency_ms` against the type's timeout, `tokens_used`
   p50/p95 and the implied spend.
2. For `identity_synthesis` rows: `decryptField(full_response)` → archetype histogram (flag
   anything outside the eight), readiness distribution (bunching at one value is a prompt
   problem), share of answers that omitted any score (fallback used), `stop_reason` once P10
   lands.
3. Join to `identity_versions` on `user_id` + nearest `generated_at` (no FK yet) to attach
   `user_rating` and `user_feedback`; print every rating ≤ 2 with its feedback and archetype, and
   the average rating per archetype.
4. Retention: `data-model.md:331-356` recommends 90 days and a manual purge; `delete-user`
   already blanks prompt/response on account deletion.

Weekly during the beta, read: success rate per type, parse/Zod failures (each one is a Tier B
case waiting to be written), p95 latency vs timeout, archetype histogram, the three
lowest-rated syntheses end to end (prompt, answer, feedback). Every real failure becomes a
fixture — rewritten, not copied.

### This week vs after the beta

**This week (before Email 1):** six fixtures; the option-1 runner with the deterministic checks
for synthesis and strategies; one baseline run on the active v1 templates and one on a v2 with
P1 + P3; the Tier C report so the first ten real users are visible. **After the beta produces
data:** the judge, pairwise comparisons, the in-process harness (option 2), fixtures derived
from real failures, P8 (French), P11 (structured outputs), P14–P17.

## 12. Pointers

**Spec drift to reconcile** (so the next person does not code from a stale document):
`spec.md:194` FR-3 says sub-scores are deterministic — since v0.4.1 they are model-assessed with
a deterministic fallback; `contracts/api-v1.md:302-327` documents `POST /identity/synthesize` as a
synchronous 200 and lacks `GET /identity/status`, `generating` on `GET /strategies`,
`POST /simulations` → job + `GET /simulations/jobs/:id`, and the `feedback` field on
`PUT /identity/:id/rate`; `Growth_Strategy_Engine.md:1827-1838` targets < 30 s per path against
measured 48–79 s; `.specify/…/plan.md:116-125` promised a circuit breaker and two retries that
were never built; `CLAUDE.md` still says "retry with stricter format on parse failure" and
"Prisma middleware auto-injects tenant_id" (see `src/shared/middleware/tenant-scope.ts`).

**Glossary.** *Audit* — one of five questionnaires; versioned on completion. *Identity /
identity version* — one synthesis result. *Archetype* — one of eight labels the prompt lists.
*Readiness* — 0–100, model-assessed since v0.4.1. *Radar* — six axes (capital, time, skills,
risk_tolerance, network, goal_clarity). *Sub-scores* — five per-audit scores (financial, time,
skills, risk, horizon). *Completeness* — share of fields answered; the fallback. *Strategy* —
one of three recommendations per identity version; *activation* adds the plans. *Micro-plan* —
72-hour task list. *Growth path* — portfolio / income_capital (AI) or skills_knowledge /
time_operations (stubs). *NBA* — next best action from cross-path analysis. *Template* — a
`prompt_templates` row; *placeholder* — `{{KEY}}` filled by `assemblePrompt`. *Mock* —
`scripts/mock-anthropic.mjs`. *Tier A/B/C* — §11.

**File index** (backend paths relative to `backend/`):
`src/shared/ai/client.ts` (the call) · `src/shared/ai/retry.ts` (wrapper + parser) ·
`src/shared/ai/prompt-loader.ts` (load + assemble) · `src/shared/ai/schema-contract.test.ts` ·
`prisma/seed.ts` (templates) · `scripts/mock-anthropic.mjs` · `src/modules/identity/service.ts`,
`types.ts`, `scoring.ts`, `radar.ts` · `src/modules/audit/types.ts`, `scoring.ts`,
`repository.ts` · `src/modules/strategy/service.ts`, `types.ts` · `src/modules/simulation/service.ts`,
`routes.ts` · `src/modules/insight/service.ts` · `src/modules/growth/generation.ts`, `service.ts`,
`export.ts` · `src/workers/growth-path-worker.ts` · `src/modules/admin/routes.ts` ·
`src/shared/middleware/error-handler.ts`, `rate-limiter.ts` · `src/shared/encryption/field-encryption.ts` ·
`scripts/funnel-report.ts`, `delete-user.ts` · `frontend/lib/api-client.ts` ·
`frontend/app/(authenticated)/identity/page.tsx`, `strategies/page.tsx`, `strategies/[id]/page.tsx`,
`simulation/page.tsx`, `dashboard/page.tsx`, `growth-strategy/page.tsx` ·
`frontend/components/shared/ai-error-state.tsx`.
