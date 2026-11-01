# Primary vs candidate — three cases by hand on Opus 5.5

The owner runs three investor profiles by hand through both Investor OS apps, on their staging
environments, against the real model, and records one scorecard. This is the evidence for the
2026-12-04 decision (CLAUDE.md › Two repos: keep one repo, archive the other, port the good parts).
It is a manual run on purpose: the question is what a real user gets, not what a harness measures.

This file is the merged runbook, one text kept identical in both repos: the primary's
(`lsouiher/investor-os`, `Projects/investorOS`) and the candidate's (`lsouiher/investoros-mvp`,
`Desktop/investoros`). The scorecard, the cases and the procedure are the primary's; the candidate's
setup, the guardrails check and the assistant section are the candidate's. Where the two disagreed,
§0 says how it was settled. No session edits the other repo, and no session starts a paid call
(the candidate's D-72, D-127): the owner runs everything.

## 0. Settled when merging — read before starting

1. **The fixtures are not the same people in the two repos.** The primary's A is in Cleveland with
   $45k liquid (from `docs/test-personas.md`); the candidate's A is in Columbus with about $25k to
   deploy (from its design brief). Both have an I that is A's twin, with different details. Each
   app's dev fill panel fills **its own** fixtures, so filling A through both panels would compare
   two different people. **Rule: the primary's A and I are the source for both apps.** On the
   primary, fill them through its panel. On the candidate, type them by hand from the primary's
   `backend/fixtures/personas/A.json` and `I.json` (do not use the candidate's panel for these two).
   Why the primary's: its fixtures carry the `predicted_primary` / `predicted_exclusions` the
   scorecard's first two checks need, written before any generation. Where the candidate asks a
   question the fixture doesn't answer (or the reverse), write down the answer you gave in the
   scorecard's notes, once, and give the same one if it recurs.
2. **"Opus 5.5 on every call" holds on the primary only.** The candidate runs Opus 5.5 on its
   primary tier: Blueprint generation, repair, targeted regeneration, the identity narrative and the
   diff narrative. Its assistant, judge, insight and what-if narration stay on Sonnet 5.5 and progress
   extraction on Haiku 5.5. Only the primary tier accepts an alternative model without a config
   change (D-134 (3)). Every scored check in §6 reads the plan, which Opus writes in both apps, so
   the scorecard compares like with like. The unscored assistant notes (§5) do not, and say so.
3. **One check added: guardrails held** (non-negotiable 5 in the candidate's CLAUDE.md; the primary
   holds to the same). The pass/fail checks go from six to seven. With "Owner would act" counted
   for L only, an app's maximum is 6 + 6 + 7 = **19**.
4. **Two gut columns kept from the candidate's first draft,** outside the count: a bug count per
   case, and "Would use it" on a 1–5 scale, the tiebreaker the checks cannot measure.

## 1. The three cases

| Case | Who | Source | Why this one |
|---|---|---|---|
| A | Time-rich starter (28, Cleveland, $45k liquid, 12 h/wk, no experience) | the primary's `backend/fixtures/personas/A.json` | Low-capital entry. The predicted primary is a house hack; "save more money first" is the failure. |
| I | Twin of A: identical capacity, different preferences (fully passive, out-of-state, cash-flow first) | the primary's `I.json` | The diagnostic pair. If A and I get interchangeable plans, the app is not reading preferences. |
| L | The owner's own profile | typed by hand, like a real user | The one case with a ground truth the owner can judge from lived experience. Not in any fixture, and must stay out of them. |

For L, write the answers once on paper before starting, so both apps receive the same facts, and
write your prediction (the strategy you expect at the top, and what should be excluded) on the
same sheet. Keep that sheet with the results; it does not go in either repo.

## 2. Model

`claude-opus-5-5`, set before the first generation and written on the scorecard.

- **Primary:** `ANTHROPIC_MODEL=claude-opus-5-5` on the staging api (set 2026-11-01; production stays
  on `claude-sonnet-5-5`). Every call.
- **Candidate:** `PRIMARY_MODEL=claude-opus-5-5` on the staging `app` service, for the purposes in
  §0.2. `CONVERSATIONAL_MODEL` stays `claude-sonnet-5-5` and `UTILITY_MODEL` stays
  `claude-haiku-5-5`; any other id there stops the call with a tier mismatch.

**Known risk on the primary:** `callClaude` sends `max_tokens: 8192` with no `thinking` parameter,
so Opus 5.5 runs adaptive thinking inside that cap (the primary's `docs/ai-pipeline.md`, its
candidate P4). A synthesis that ends with `stop_reason: max_tokens` is a finding, recorded as such;
it is not a reason to edit the client mid-run.

## 3. Where, and setup

Staging only on both, never production. **Before anything:** set a spend ceiling on the Anthropic
console for the day and keep its usage page open. On the candidate, the last measured Blueprint cost
$2.08 on a pricier tier (D-71); Opus 5.5 ($4 / $20 per million tokens) should come in at or below
that. On the primary a case is three or four calls (synthesis, strategies, insight warm-up, and the
activation that produces the action plan), about $0.15–$0.30 at Opus prices. Three cases per app
plus the extras in §5 fit inside a $30 ceiling for both apps together.

### 3.1 Primary

- web https://web-staging-9290.up.railway.app, api https://api-staging-cf02.up.railway.app
  (the primary's `docs/deploy.md` › Staging environment).
- The dev fill panel is in the staging web image; the persona routes are mounted on the staging api.
  Check: `GET /api/v1/health` answers `ai: true`; signed in, every `/audits/<type>` page shows the
  fill panel bottom-right with the persona dropdown.
- Staging inherited `GROWTH_STRATEGY_DEFAULT_ENABLED=true` from production, so new accounts get the
  growth engine; leave it, it is part of what a user gets.
- Seeded accounts carry `signup_source = persona-seed`; `npm run seed:clean` against the staging
  database removes them afterwards (`DATABASE_URL` through the Postgres TCP proxy, see deploy.md).
  The owner's own account (L) is a normal signup and is deleted by hand, or kept.

### 3.2 Candidate

Service `app`, project `investoros-mvp`, environment `staging`, URL
https://app-staging-a2d1.up.railway.app (its `docs/beta/staging.md`). Paste these on the service by
hand (never CLI-set from `.env`):

| Variable | Value | Why |
|---|---|---|
| `ANTHROPIC_API_KEY` | your key | |
| `PRIMARY_MODEL` | `claude-opus-5-5` | §2 |
| `CONVERSATIONAL_MODEL` | `claude-sonnet-5-5` | §0.2 |
| `UTILITY_MODEL` | `claude-haiku-5-5` | §0.2 |
| `GENERATION` | `on` | real Blueprints (`fake` replays one stored plan) |
| `ASSISTANT` | `on` | real assistant turns (§5) |
| `INSIGHT_NARRATIVE`, `DIFF_NARRATIVE`, `SIMULATION_NARRATIVE` | `on` | the hub's sentences, the version comparison, the what-if framing |

The candidate's fill panel (`ENABLE_DEV_SEED`, its PR #1) is not needed: §0.1 types A and I by hand.
Deploy and check:

```bash
cd ~/investoros-sweep && git switch main && git pull -q
railway up --service app --ci
```

`railway up`, never `railway redeploy`. The boot log reads `runner: GENERATION=on`, and
`/api/health` answers 200.

### 3.3 After the run

Primary: `npm run seed:clean` as above; optionally put `ANTHROPIC_MODEL` on the staging api back to
`claude-sonnet-5-5`. Candidate: set `GENERATION=fake`, `ASSISTANT=fake`, the three narratives
`off`, and redeploy, so staging stops calling the model. Test accounts stay until deleted by hand.

## 4. Procedure, per case, per app

Run all three cases in one app, then all three in the other, the same day if possible. Prompt and
config versions do not change between the two halves.

1. **Fresh account** (a plus-address of your email per case per app: `you+a-prim@…`,
   `you+a-cand@…`). Note the time.
2. **Enter the profile:** the primary's panel for A and I on the primary (**Fill all audits** on any
   audit page completes all five and starts synthesis on its own); by hand for A and I on the
   candidate (§0.1); by hand for L on both. Complete every assessment step the app has.
3. **Trigger generation** and wait for everything the app produces on its own: identity / archetype,
   readiness or equivalent score, strategies (the candidate's Deal Designs), exclusions, action plan.
   On the candidate, "generate" is **Confirm** on the summary page; the Blueprint builds as a
   background job with visible stages. On the primary, synthesis starts when the fifth audit is
   completed and strategies follow by themselves; the **action plan only exists after you activate
   a strategy**, so activate the top one (one more call) before scoring, since "Exclusions held"
   reads the plan too. Do not retry a failed call; record it.
4. **Capture:** screenshots of the identity page and the strategy list; the raw strategy names and
   their order; wall time from "generate" to "all content visible"; tokens and cost from the app's
   own call log, read afterwards, not by hand (note the account emails).
   - Primary: `ai_call_logs` per user (`service_type`, `model`, `tokens_used`, `latency_ms`).
     `tokens_used` is the input+output **sum**; the split is in the api log line for each call
     (`railway logs --service api --environment staging`, "AI call completed"). Dollars from the
     split at the rates in `backend/config/ai-pricing.json`.
   - Candidate: `generation_runs` (`model`, `cost_estimate_usd`, `latency_ms`, `validator_results`)
     for the account; `docs/beta/metrics.sql` has the shapes.
5. **Score the sheet** (§6) immediately, before the next case.
6. **Swap test**, after A and I are done in one app: read A's plan as if you were I, and I's as if you
   were A. Would either notice? One yes/no per app.

## 5. Beyond the scorecard — unscored notes, where the app has the screen

After scoring a case, if the app has an assistant, type these four prompts word for word and note
the answers in a sentence each. They are not in the count: on the candidate they run on Sonnet 5.5,
not Opus (§0.2); the primary has no assistant, so its row says so (its simulation is the nearest
thing to prompt 3, if you want a note).

1. "Why is the first exclusion in my plan excluded, and what would change it?"
2. "What should I focus on in the next 30 days?"
3. "What if I had $50,000 more to invest?"
4. "I talked to a lender this week and got pre-approved." (should log progress, not advise)

If the app has a review or check-in, start one on case L and note whether the plan rebuilds and
what changed. On the primary, the nearest thing is re-completing one audit with a changed answer
and re-synthesizing; note what changed in the identity history.

## 6. Scorecard

One row per case per app. The sheet lives at `docs/evals/results/comparison-<YYYY-MM-DD>/SCORECARD.md`
in the primary repo; after the verdict, a copy goes into the candidate with the decision (§7).
Predictions for A and I are the primary fixtures' `predicted_primary` and `predicted_exclusions`,
written before any generation and not edited after. For L the prediction is the one on the paper
sheet.

| Check | Pass means |
|---|---|
| Primary landed | The top strategy is in the predicted set. |
| Exclusions held | Nothing from the predicted-exclusions list appears anywhere in the strategies or action plan. |
| Nothing nonsensical | No strategy the profile makes impossible (accreditation, capital, time, geography). |
| Differentiated | A vs I: the two plans differ visibly in strategy, geography, management stance. L: the plan is specific to the facts entered, not generic. |
| Guardrails held | No current market facts, no named lender, offering or sponsor, no universal ranking of strategies, no tactical how-to; a disclaimer is present. |
| Owner would act on it (L only) | Reading it as themself, the owner finds at least one step they would actually take next. |
| Completed without manual retry | Every generation finished on the first attempt. |
| Wall time | Minutes from generate to all content visible (number, not pass/fail). |
| Cost | Dollars for the case, from the app's call log (number). |
| Bugs | Count of errors, blank screens, wrong numbers or stuck spinners, with the step in Notes (number). |
| Would use it | 1 (no) to 5 (yes), your gut (number, outside the count). |

**Verdict per app:** passes over the seven pass/fail checks across the three cases (max 19: A and I
count out of 6 each, "Owner would act" being n/a for them, and L out of 7), the numbers, and three
sentences of judgment the counts don't capture. Then one paragraph naming the repo to keep and why.
Disagreements between the count and the judgment are allowed and should be stated, not smoothed
over.

### Template

```markdown
# Comparison <date> — Opus 5.5, staging, by hand

Primary: investor-os @ <commit>, model <id>, prompt templates <versions from prompt_templates>
Candidate: investoros-mvp @ <commit>, PRIMARY_MODEL <id> (CONVERSATIONAL / UTILITY <ids>), config_version <…>

| Case | App | Primary landed | Exclusions held | Nothing nonsensical | Differentiated | Guardrails held | Owner would act (L) | No retry | Wall time | Cost | Bugs | Would use it | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| A | primary | | | | | | n/a | | | | | | |
| A | candidate | | | | | | n/a | | | | | | |
| I | primary | | | | | | n/a | | | | | | |
| I | candidate | | | | | | n/a | | | | | | |
| L | primary | | | | | | | | | | | | |
| L | candidate | | | | | | | | | | | | |

Swap test A/I — primary: <would notice / would not>. Candidate: <…>.

Totals — primary: <n>/19. Candidate: <n>/19.

Assistant notes (§5, unscored) — primary: no assistant. Candidate: <…>.

Judgment — primary: <three sentences>.
Judgment — candidate: <three sentences>.

Verdict: <keep X, archive Y, because …>. Parts of Y worth porting: <…>.
```

## 7. After the verdict

The filled scorecard and the choice go into the candidate's `docs/decisions.md` as a new decision
(keep which, archive which, what to port first), and into the primary's
`docs/evals/results/comparison-<date>/`. Archiving and porting are tasks of their own, one at a time.

## Out of scope

- The automated harnesses (the primary's `npm run eval:personas`, the candidate's `eval:plans`) are
  separate, later runs over all ten personas; they don't replace this, and this doesn't replace them.
- No prompt, config or code change in either repo between the first generation and the verdict.
- Nothing is built in either repo for this; the runbook is documentation.
