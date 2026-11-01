# Runbook — primary vs candidate, three cases by hand on Opus 5.5

One runbook for both Investor OS apps, merged on 2026-11-01 from the primary's protocol and the
candidate's runbook, then reconciled across the two repos' merged copies. The owner runs the same
three cases, as a user would, on both apps' staging deployments, with the generation model on
**Opus 5.5**, and fills one score sheet. That sheet is the evidence for the 2026-12-04 decision:
keep one repo, archive the other, port the good parts.

- **Primary:** `lsouiher/investor-os`, local `Projects/investorOS`. Staging per its `docs/deploy.md`.
- **Candidate:** `lsouiher/investoros-mvp`, local `Desktop/investoros`. Staging per its
  `docs/beta/staging.md`.
- The owner runs everything. No session in either repo starts a paid call; this file is the owner's
  go for this one run when they start it, not before. Nothing is built in either repo for it.

The same text lives in both repos (the primary's at `docs/evals/COMPARISON-PROTOCOL.md`, the
candidate's at `docs/evals/REPO-DECISION.md`); each repo's copy is updated by a session in that
repo, never from the other.

## 1. The three cases

| Case | Who | How the answers go in |
|---|---|---|
| **A** | Time-rich starter: 28, single, renting, salaried $72k, Cleveland; liquid $45k, deployable ≈ $25k, 12 h/week, no experience, risk 4/5, 17-year horizon. Source: the primary's `backend/fixtures/personas/A.json`. | Primary: dev fill panel. Candidate: typed by hand (see below) |
| **I** | Twin of A: same capacity (deployable ≈ $26.5k, 12 h/week, risk 4/5, 17 years), opposite preferences: fully passive, won't live in a rental, cash flow first, open to out of state. Source: the primary's `I.json`. | Primary: dev fill panel. Candidate: typed by hand |
| **OWN** | The owner, as themself. Not a fixture in either repo and must stay out of them. | Typed by hand on both apps, the real-user case |

Why A and I rather than A and D: the persona set calls A/I "the diagnostic pair": the two differ
only in preference answers that both apps ask. D (scaler with a losing rental) relies on the
candidate's portfolio module, which the primary has no equivalent screen for, so its inputs could
not be made to match. OWN is scaler-shaped already (one rental, buying multifamily), judged with
ground truth no fixture has. If time allows, D is an optional fourth case, with the mismatch noted.

**The same person into both apps: the primary's fixtures are the source.** The two repos' A and I
fixtures share a concept but not every answer: the candidate's A lives in Columbus and is
partnered; its I has ≈ $22.5k deployable and also plans to quit work in 3 years, a deliberate
tension the primary's I does not carry. Each app's fill panel fills its own fixtures, so the panels
would put two different people through the two apps. So:

- on the primary, fill A and I through its dev fill panel;
- on the candidate, type the primary's A and I by hand, reading the answers off the primary's
  fixture or its panel's filled pages (about ten minutes a case). Do not use the candidate's panel
  for A and I.
- Where the candidate asks a question the primary's fixture does not answer (or the reverse), write
  the answer given in the Notes column of §5 once, and give the same answer if it comes up again.

For OWN, write the answers once on a sheet on your machine, with your own predicted archetype,
primary strategy and exclusions written **before** generating, and type the same facts into both.
The sheet stays out of both repos.

## 2. Models

| Tier | Primary (`investor-os`) | Candidate (`investoros-mvp`) |
|---|---|---|
| Generation (identity, strategies, plan) | `ANTHROPIC_MODEL=claude-opus-5-5`, one model for every call (set on the staging api 2026-11-01; production stays on Sonnet 5.5) | `PRIMARY_MODEL=claude-opus-5-5`: Blueprint generation, repair, regeneration, identity and diff narratives (D-134: a verified alternative, no config edit) |
| Assistant / narration | no separate tier; the primary has no chat assistant (§4 says what stands in) | `CONVERSATIONAL_MODEL=claude-sonnet-5-5`, `UTILITY_MODEL=claude-haiku-5-5`; only the primary tier can switch |

So plan generation compares Opus 5.5 against Opus 5.5. Two differences to keep in mind when
reading the sheet:

- **The candidate's archetype and readiness scores are computed by code, not by the model**
  (`src/engine/`; the candidate's non-negotiable "numbers from code, words from the model"). The
  primary's archetype and readiness score are model-assessed against a rubric. A difference in
  archetype or scores between the apps is a difference in method, not in model.
- **Anything conversational** compares a feature the candidate has against stand-ins on the
  primary. It is scored, and the Notes column says so.

Known risk on the primary: `callClaude` sends `max_tokens: 8192` with no `thinking` parameter, so
Opus 5.5 runs adaptive thinking inside that cap (the primary's `docs/ai-pipeline.md`, candidate P4).
A generation that ends with `stop_reason: max_tokens` is a finding, recorded as such, not a reason
to edit the client mid-run.

Confirm both model ids before the first generation and write them on the sheet.

## 3. Setup on the day

### 3.0 Before anything else (owner, on the consoles)

1. **Anthropic console:** set a spend ceiling for the day and keep the usage page open. Opus 5.5 is
   $4 / $20 per million input / output tokens. Expect roughly $0.15–$0.30 per case on the primary
   (three to four calls) and up to about $2 per case on the candidate (its last measured Blueprint
   was $2.08 on a pricier tier, D-71). Six cases plus assistant turns should stay inside $20; raise
   the ceiling if you plan re-runs.
2. Both staging apps use their own databases. Nothing in this run touches either production.

### 3.1 Primary staging

Already configured (the primary's `docs/deploy.md` › Staging environment):

- web https://web-staging-9290.up.railway.app, api https://api-staging-cf02.up.railway.app
- api variables: `NODE_ENV=staging`, `ENABLE_DEV_SEED=true`, `ANTHROPIC_MODEL=claude-opus-5-5`,
  the production Anthropic key copied at duplication (check it is the one you fixed).
- The dev fill panel is in the staging web image (`NEXT_PUBLIC_ENABLE_DEV_SEED=true` at build).
- Checks: `GET /api/v1/health` answers `ai: true`; signed in, every `/audits/<type>` page shows the
  fill panel bottom-right with the persona dropdown.
- Growth strategy engine: panel-seeded tenants are created through the normal signup, so they get
  `GROWTH_STRATEGY_DEFAULT_ENABLED` (true on staging, copied from production). Leave it; it is part
  of what the user gets.

### 3.2 Candidate staging

Service `app`, project `investoros-mvp`, environment `staging`,
https://app-staging-a2d1.up.railway.app.

1. The candidate's dev fill panel (its PR #1, `ENABLE_DEV_SEED`) is **not needed** for this run: A
   and I are typed (§1). Leave it unset.
2. Railway variables on `app` in `staging`, pasted by hand:

| Variable | Value | Why |
|---|---|---|
| `ANTHROPIC_API_KEY` | your key | paste it yourself, never from `.env` by CLI |
| `PRIMARY_MODEL` | `claude-opus-5-5` | Blueprint generation, repair, regeneration, identity and diff narratives |
| `CONVERSATIONAL_MODEL` | `claude-sonnet-5-5` | assistant, judge, insight and what-if narration (any other id stops the call with a tier mismatch) |
| `UTILITY_MODEL` | `claude-haiku-5-5` | progress extraction; same rule |
| `GENERATION` | `on` | real Blueprints (`fake` replays persona A's stored plan) |
| `ASSISTANT` | `on` | real assistant turns |
| `INSIGHT_NARRATIVE`, `DIFF_NARRATIVE`, `SIMULATION_NARRATIVE` | `on` | the hub, version comparison and what-if sentences |

3. Deploy and check:

```bash
cd ~/investoros-sweep && git switch main && git pull -q
railway up --service app --ci
```

`railway up`, never `railway redeploy` (the candidate's CLAUDE.md › Lessons). Then: the boot log
reads `runner: GENERATION=on`, and `/api/health` answers 200.

## 4. The script — the same steps for every case, on both apps

A fresh account per case per app, plus-addressed so nothing carries between runs
(`you+a-prim@…`, `you+a-cand@…`, `you+i-prim@…`, …, `you+own-prim@…`, `you+own-cand@…`).
On the primary, plus-addressed accounts created through the panel carry `signup_source=persona-seed`
and are removed afterwards by `seed:clean`; the OWN account is a normal signup. Time each step with
a stopwatch or a note of the clock.

| Step | Candidate | Primary |
|---|---|---|
| 1. Sign up | New account, then the assessment | New account, then the audits |
| 2. Enter the profile | A, I, OWN: type every module (A and I from the primary's fixture, §1). Note minutes taken and anything confusing, wrong or missing. | A, I: pick the persona on any audit page, **Fill all audits** (or **Fill this page** on each of the five). OWN: type all five audits. Same notes. |
| 3. Summary | Read the archetype and the six readiness scores (computed by code, §2). **Confirm.** | Identity synthesis starts on completion of the fifth audit. Read the archetype, readiness score and the radar. |
| 4. Plan | Time from Confirm to a readable Blueprint. Read it as the person: do the 1–3 Deal Designs fit, does every exclusion have a reason and "what would change this", are the 90-day actions concrete, is every figure sane, does anything name a lender, a market fact or a universal ranking of strategies (it must not)? | Time from the fifth audit to strategies visible, then activate the top strategy and time the action plan (the plan only exists after activation). Read it the same way: do the strategies fit, are excluded approaches absent, are the action items concrete, is every figure sane, same guardrail questions. |
| 5. Hub / dashboard | Insight feed, actions list, progress. Tick one action. | Dashboard insights, tasks. Tick one task. |
| 6. Assistant | Four fixed prompts, typed word for word: (1) "Why is the first exclusion in my plan excluded, and what would change it?" (2) "What should I focus on in the next 30 days?" (3) "What if I had $50,000 more to invest?" (4) "I talked to a lender this week and got pre-approved." (should log progress, not advise) | No assistant. Stand-ins, scored in the same column with a note: (1) and (2) the strategy's own rationale and action plan text; (3) run a simulation with +$50,000 capital; (4) n/a. |
| 7. Review | Start a review or check-in if offered; note whether the Blueprint rebuilds and what changed. | Re-complete one audit with a changed answer and re-synthesize; note what changed in identity and strategies (identity history). |
| 8. Errors | Every error message, blank screen, wrong number or stuck spinner, with the step. | Same. |

**Capture per case, before scoring:** a screenshot of the identity / summary page and of the
strategy or Deal Design list, and the raw strategy names in their order (typed into the Notes or a
file next to the sheet). The swap test and any later re-reading work from these, not from memory.

Run all three cases in one app, then all three in the other, same day if possible. Prompt and config
versions do not change between the two halves. Do not retry a failed generation; record it.

**Swap test**, once A and I are done in one app: read A's plan as if you were I, and I's as if you
were A. Would either person notice they got the other's plan? One yes/no per app.

Costs and latencies come from the databases afterwards, not by hand. Note the account emails.

- Candidate: `generation_runs` (`cost_estimate_usd`, `latency_ms`, `validator_results`) per test
  account; shapes in its `docs/beta/metrics.sql`. A session can read them with a read-only query.
- Primary: `ai_call_logs` per user (`service_type`, `model`, `tokens_used`, `latency_ms`,
  `created_at`). `tokens_used` is the input+output sum; the split is in the api log line for each
  call (`railway logs --service api --environment staging`, "AI call completed"). Dollars from the
  split at the rates in `backend/config/ai-pricing.json`. Read through the staging Postgres TCP
  proxy (`docs/deploy.md`).

## 5. The score sheet — identical for both apps

One row per case per app. Yes/no checks first, then 1–5 scores (1 poor, 5 excellent), then hard
facts. The filled sheet goes to `docs/evals/results/comparison-<YYYY-MM-DD>/SCORECARD.md` in the
primary and to a new decision in the candidate's `docs/decisions.md`; both repos keep the same text.

**Sheet header**, written before the first case: the date; for the primary its master commit,
`ANTHROPIC_MODEL`, and the prompt template versions in `prompt_templates`; for the candidate its
main commit, the three tier model ids, and its `config_version`.

**Predictions are the primary fixtures', for both apps.** A and I are scored against the primary's
`predicted_primary` and `predicted_exclusions` (A: a house hack, local, self-managed; excludes
development, syndication, flips, wholesale, out of state. I: managed out-of-state rentals or a
partnership, explicitly not a house hack; excludes house hack, self-management, flips), written
before any generation and not edited after. OWN is scored against the owner's own sheet.

**Yes/no checks** (y/n per row; n/a where marked):

| Check | Yes means |
|---|---|
| Primary landed | The top strategy / Deal Design is in the predicted set. |
| Exclusions held | Nothing from the predicted-exclusions list is recommended anywhere in the strategies or the action plan. |
| Nothing nonsensical | No strategy the profile makes impossible (accreditation, capital, time, geography). |
| Differentiated | A vs I: the two plans differ visibly in strategy, geography and management stance. OWN: the plan is specific to the facts entered, not generic. |
| Owner would act (OWN) | Reading it as themself, the owner finds at least one step they would actually take next. n/a for A and I. |
| No manual retry | Every generation finished on the first attempt. |

**1–5 scores:** Assessment UX, Numbers right, Plan fits, Exclusions & actions, Guardrails held,
Assistant, Review, Would use it.

| Case | App | Primary landed | Exclusions held | Nothing nonsensical | Differentiated | Owner would act | No retry | Assessment UX | Numbers right | Plan fits | Exclusions & actions | Guardrails held | Assistant | Review | Would use it | Bugs (count) | Min to plan | Cost $ (from DB) | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | primary | | | | | n/a | | | | | | | | | | | | | |
| A | candidate | | | | | n/a | | | | | | | | | | | | | |
| I | primary | | | | | n/a | | | | | | | | | | | | | |
| I | candidate | | | | | n/a | | | | | | | | | | | | | |
| OWN | primary | | | | | | | | | | | | | | | | | | |
| OWN | candidate | | | | | | | | | | | | | | | | | | |

Swap test A/I — primary: <would notice / would not>. Candidate: <…>.

- **Numbers right:** A and I by the fixture's figures (capital, time, horizon carried through
  correctly); OWN by your own sense of your money. On the candidate the numbers are code's (§2).
- **Guardrails held:** 5 = no current market facts, no named lenders, offerings or sponsors, no
  universal ranking of strategies, no tactical how-to, disclaimers present; any breach caps it at 2.
- **Assistant:** on the primary, the stand-ins of §4 step 6, with "no assistant" in Notes.
- **Would use it:** your gut, the tiebreaker the others can't measure.

## 6. After the run

- Primary: `npm run seed:clean` against the staging database removes the persona-seed accounts;
  delete or keep the OWN account by hand. Optionally set `ANTHROPIC_MODEL` on the staging api back
  to `claude-sonnet-5-5`; with no one generating, nothing calls the model either way.
- Candidate: set `GENERATION=fake`, `ASSISTANT=fake`, the three narratives `off`, and `railway up`,
  so staging stops calling the model. Its test accounts stay until deleted by hand.

## 7. The decision

Per app: the yes/no counts (out of 16: five checks on A and on I, six on OWN, the swap test's yes/no
counted apart), the 1–5 averages, the two numbers, and three sentences of judgment the counts do
not capture. Then one paragraph naming the repo to keep and why, and the parts of the other worth
porting first. Disagreements between the counts and the judgment are allowed and should be stated,
not smoothed over. Recorded in both repos as in §5; archiving and porting are tasks of their own.

## Out of scope

- The automated harnesses (the primary's `npm run eval:personas`, the candidate's
  `npm run eval:plans` / `eval:swap`) are separate, later runs over all ten personas; they do not
  replace this and this does not replace them.
- No prompt, config or code change in either repo between the first generation and the verdict.
