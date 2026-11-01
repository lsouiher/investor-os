# Runbook — primary vs candidate, three cases by hand on Opus 5.5

One runbook for both Investor OS apps, merged on 2026-11-01 from the primary's protocol and the
candidate's runbook (its `docs/evals/…` runbook, §1–§6). The owner runs the same three cases, as a
user would, on both apps' staging deployments, with the primary model tier on **Opus 5.5**, and
fills one score sheet. That sheet is the evidence for the 2026-12-04 decision: keep one repo,
archive the other, port the good parts.

- **Primary:** `lsouiher/investor-os`, local `Projects/investorOS`. Staging per `docs/deploy.md`.
- **Candidate:** `lsouiher/investoros-mvp`, local `Desktop/investoros`. Staging per its `docs/beta/staging.md`.
- The owner runs everything. No session in either repo starts a paid call; this file is the owner's
  go for this one run when they start it, not before. Nothing is built in the candidate for it.

The same text lives in both repos; the candidate's copy is updated by a session there, never from here.

## 1. The three cases

| Case | Who | How the answers go in |
|---|---|---|
| **A** | Time-rich starter: 28, salaried, renting, no deals, ~12 h/week, ~$25k to deploy. Primary fixture `backend/fixtures/personas/A.json`; candidate `docs/evals/personas/A.json`. | Dev fill panel on both apps |
| **I** | Twin of A: identical capacity, different preferences (fully passive, out of state, cash flow first). `I.json` in both repos. | Dev fill panel on both apps |
| **OWN** | The owner, as themself. Not a fixture in either repo and must stay out of them. | Typed by hand on both apps, the real-user case |

Why A and I rather than the candidate's A and D: the persona set calls A/I "the diagnostic pair",
and it is the one test that is exactly fair on both apps, since the two fixtures differ only in
preference answers that both apps ask. D (scaler with a losing rental) relies on the candidate's
portfolio module, which the primary has no equivalent screen for, so its inputs could not be made
to match; and OWN already is a scaler-shaped profile (one rental, buying multifamily), judged with
ground truth no fixture has. If time allows, D is the optional fourth case, with the mismatch noted.

**Same answers into both apps.** A and I go in through each app's dev fill panel, so the inputs
match by construction (both panels were built from the same ten personas; the primary's fixtures
use its audit pages' own field vocabulary). Where one app asks a question the other does not, write
how it was answered in the Notes column of §5. For OWN, write the answers once on a sheet on your
machine, with your own predicted archetype and primary strategy written **before** generating, and
type the same facts into both. The sheet stays out of both repos.

## 2. Models

| Tier | Primary (`investor-os`) | Candidate (`investoros-mvp`) |
|---|---|---|
| Generation (identity, strategies, plan) | `ANTHROPIC_MODEL=claude-opus-5-5`, one model for every call (set on the staging api 2026-11-01; production stays on Sonnet 5.5) | `PRIMARY_MODEL=claude-opus-5-5` (D-134: a verified alternative, no config edit) |
| Assistant / narration | no separate tier; the primary has no chat assistant (see §4 for what stands in) | `CONVERSATIONAL_MODEL=claude-sonnet-5-5`, `UTILITY_MODEL=claude-haiku-5-5`; only the primary tier can switch |

So generation compares Opus 5.5 against Opus 5.5. Anything conversational compares a feature the
candidate has against one the primary does not; it is scored, but the Notes column says so.

Known risk on the primary: `callClaude` sends `max_tokens: 8192` with no `thinking` parameter, so
Opus 5.5 runs adaptive thinking inside that cap (`docs/ai-pipeline.md`, candidate P4). A generation
that ends with `stop_reason: max_tokens` is a finding, recorded as such, not a reason to edit the
client mid-run.

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

Already configured (`docs/deploy.md` › Staging environment):

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

1. Merge its PR #1 (the dev fill panel) first; otherwise A and I must be typed there.
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
| `ENABLE_DEV_SEED` | `true` | the fill panel; staging only, never production (D-135) |

3. Deploy and check:

```bash
cd ~/investoros-sweep && git switch main && git pull -q
railway up --service app --ci
```

`railway up`, never `railway redeploy` (its CLAUDE.md › Lessons). Then: the boot log reads
`runner: GENERATION=on`; `/api/health` answers 200; signed in, `/assess/about` shows the dashed
"Dev fill · staging and local only" panel bottom-right.

## 4. The script — the same steps for every case, on both apps

A fresh account per case per app, plus-addressed so nothing carries between runs
(`you+a-prim@…`, `you+a-cand@…`, `you+i-prim@…`, …, `you+own-prim@…`, `you+own-cand@…`).
On the primary, plus-addressed accounts created through the panel carry `signup_source=persona-seed`
and are removed afterwards by `seed:clean`; the OWN account is a normal signup. Time each step with
a stopwatch or a note of the clock.

| Step | Candidate | Primary |
|---|---|---|
| 1. Sign up | New account, then the assessment | New account, then the audits |
| 2. Enter the profile | A, I: pick the persona in the panel, **Fill all modules**. OWN: type. Note minutes taken and anything confusing, wrong or missing. | A, I: pick the persona on any audit page, **Fill all audits** (or **Fill this page** on each of the five). OWN: type all five audits. Same notes. |
| 3. Summary | Read the archetype and the six readiness scores; compare A and I against the fixture's `expected`. **Confirm.** | Identity synthesis starts on completion of the fifth audit. Read the archetype, readiness score and the radar; compare A and I against the fixture's `predicted_primary` / `predicted_exclusions` and the assertions in its `must_include` / `must_exclude`. |
| 4. Plan | Time from Confirm to a readable Blueprint. Read it as the person: do the 1–3 Deal Designs fit, does every exclusion have a reason and "what would change this", are the 90-day actions concrete, is every figure sane, does anything name a lender, a market fact or a universal ranking of strategies (it must not)? | Time from the fifth audit to strategies visible, then activate the top strategy and time the action plan. Read it the same way: do the strategies fit, are excluded approaches absent, are the action items concrete, is every figure sane, same guardrail questions. |
| 5. Hub / dashboard | Insight feed, actions list, progress. Tick one action. | Dashboard insights, tasks. Tick one task. |
| 6. Assistant | Four fixed prompts, typed word for word: (1) "Why is the first exclusion in my plan excluded, and what would change it?" (2) "What should I focus on in the next 30 days?" (3) "What if I had $50,000 more to invest?" (4) "I talked to a lender this week and got pre-approved." (should log progress, not advise) | No assistant. Stand-ins, scored in the same column with a note: (1) and (2) the strategy's own rationale and action plan text; (3) run a simulation with +$50,000 capital; (4) n/a. |
| 7. Review | Start a review or check-in if offered; note whether the Blueprint rebuilds and what changed. | Re-complete one audit with a changed answer and re-synthesize; note what changed in identity and strategies (identity history). |
| 8. Errors | Every error message, blank screen, wrong number or stuck spinner, with the step. | Same. |

Run all three cases in one app, then all three in the other, same day if possible. Prompt and config
versions do not change between the two halves. Do not retry a failed generation; record it.

**Swap test**, once A and I are done in one app: read A's plan as if you were I, and I's as if you
were A. Would either person notice they got the other's plan? One yes/no per app.

Costs and latencies come from the databases afterwards, not by hand. Note the account emails.

- Candidate: `generation_runs` (`cost_estimate_usd`, `latency_ms`, `validator_results`) per test
  account; shapes in its `docs/beta/metrics.sql`.
- Primary: `ai_call_logs` per user (`service_type`, `model`, `tokens_used`, `latency_ms`,
  `created_at`). `tokens_used` is the input+output sum; the split is in the api log line for each
  call (`railway logs --service api --environment staging`, "AI call completed"). Dollars from the
  split at the rates in `backend/config/ai-pricing.json`. Read through the staging Postgres TCP
  proxy (`docs/deploy.md`).

## 5. The score sheet — identical for both apps

Score 1 (poor) to 5 (excellent); hard facts and yes/no checks in their own columns. One row per case
per app. The filled sheet goes to `docs/evals/results/comparison-<YYYY-MM-DD>/SCORECARD.md` in the
primary and to a new decision in the candidate's `docs/decisions.md`; both repos keep the same text.

| Case | App | Primary landed (y/n) | Exclusions held (y/n) | Assessment UX | Numbers right | Plan fits | Exclusions & actions | Guardrails held | Assistant | Review | Bugs (count) | Min to plan | Cost $ (from DB) | Would use it | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | primary | | | | | | | | | | | | | | |
| A | candidate | | | | | | | | | | | | | | |
| I | primary | | | | | | | | | | | | | | |
| I | candidate | | | | | | | | | | | | | | |
| OWN | primary | | | | | | | | | | | | | | |
| OWN | candidate | | | | | | | | | | | | | | |

Swap test A/I — primary: <would notice / would not>. Candidate: <…>.

- **Primary landed / Exclusions held:** A and I against the fixture's predictions, written before any
  generation and not edited after; OWN against the owner's own sheet.
- **Numbers right:** A and I against the fixture; OWN by your own sense of your money.
- **Guardrails held:** 5 = no market facts, no named lenders or offerings, no universal ranking,
  disclaimers present; any breach caps it at 2.
- **Assistant:** on the primary, the stand-ins of §4 step 6, with "no assistant" in Notes.
- **Would use it:** your gut, the tiebreaker the others can't measure.

## 6. After the run

- Primary: `npm run seed:clean` against the staging database removes the persona-seed accounts; delete
  or keep the OWN account by hand. Optionally set `ANTHROPIC_MODEL` on the staging api back to
  `claude-sonnet-5-5`; with no one generating, nothing calls the model either way.
- Candidate: set `GENERATION=fake`, `ASSISTANT=fake`, the three narratives `off`, remove
  `ENABLE_DEV_SEED`, and `railway up`, so staging stops spending and stops showing the panel.

## 7. The decision

Per app: the yes/no counts, the 1–5 averages, the two numbers, and three sentences of judgment the
counts do not capture. Then one paragraph naming the repo to keep and why, and the parts of the
other worth porting first. Disagreements between the counts and the judgment are allowed and
should be stated, not smoothed over. Recorded in both repos as in §5; archiving and porting are
tasks of their own.

## Out of scope

- The automated harnesses (`npm run eval:personas` here, `npm run eval:plans` / `eval:swap` there)
  are separate, later runs over all ten personas; they do not replace this and this does not
  replace them.
- No prompt, config or code change in either repo between the first generation and the verdict.
