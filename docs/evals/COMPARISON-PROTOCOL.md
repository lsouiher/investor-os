# Primary vs candidate — three-case comparison on Opus 5.5

The owner runs three investor profiles by hand through both Investor OS apps, on their staging
environments, against the real model, and records one scorecard. This is the evidence for the
2026-12-04 decision (keep one repo, archive the other, port the good parts). It is a manual run
on purpose: the question is what a real user gets, not what the harness measures.

The candidate repo is writing its own runbook for the same exercise; the two are to be combined
into one document once both exist. Until then this file is the primary's half.

## The three cases

| Case | Who | Source | Why this one |
|---|---|---|---|
| A | Time-rich starter (28, Cleveland, $45k liquid, 12 h/wk, no experience) | fixture `backend/fixtures/personas/A.json` | Low-capital entry. The predicted primary is a house hack; "save more money first" is the failure. |
| I | Twin of A: identical capacity, different preferences (fully passive, out-of-state, cash-flow first) | fixture `I.json` | The diagnostic pair. If A and I get interchangeable plans, the app is not reading preferences. |
| L | The owner's own profile | typed by hand, like a real user | The one case with a ground truth the owner can judge from lived experience. Not in the fixtures and must stay out of them. |

Two from the list, one real. Cases A and I go in through the dev fill panel (identical inputs in both
apps, by construction). Case L is typed into each app's forms the way a new user would; before
starting, write the answers once on paper so both apps receive the same facts, and keep that sheet
with the results (it does not go in the repo).

## Model

`claude-opus-5-5` on both apps, every call. On the primary that is one variable on the staging api,
`ANTHROPIC_MODEL=claude-opus-5-5` (set 2026-11-01; production stays on `claude-sonnet-5-5`). The
candidate selects it through its `primary` tier (`PRIMARY_MODEL`). Confirm both before the first
generation and write the ids on the scorecard.

Known risk on the primary: `callClaude` sends `max_tokens: 8192` with no `thinking` parameter, so
Opus 5.5 runs adaptive thinking inside that cap (`docs/ai-pipeline.md`, candidate P4). A synthesis
that ends with `stop_reason: max_tokens` is a finding, recorded as such; it is not a reason to edit
the client mid-run.

## Where

Primary: staging only, never production (`docs/deploy.md` › Staging environment).

- web https://web-staging-9290.up.railway.app, api https://api-staging-cf02.up.railway.app
- The dev fill panel is in the staging web image; the persona routes are mounted on the staging api.
- Seeded accounts carry `signup_source = persona-seed`; `npm run seed:clean` against the staging
  database removes them afterwards (`DATABASE_URL` through the Postgres TCP proxy, see deploy.md).
  The owner's own account (case L) is a normal signup and is deleted by hand, or kept.

Candidate: its own staging, per its runbook.

## Procedure, per case, per app

1. Fresh account. Note the time.
2. Enter the profile (panel for A and I, by hand for L). Complete every audit the app has.
3. Trigger generation and wait for everything the app produces on its own: identity / archetype,
   readiness or equivalent score, strategies, action plan. Do not retry a failed call; record it.
4. Capture: screenshots of the identity page and the strategy list; the raw strategy names and their
   order; wall time from "generate" to "all content visible"; tokens and cost from the app's own call
   log (primary: `ai_call_logs`, model + `tokens_used`; the harness cost table in
   `backend/config/ai-pricing.json` gives dollars).
5. Score the sheet below immediately, before the next case.
6. Swap test, after A and I are done in one app: read A's plan as if you were I, and I's as if you were
   A. Would either notice? That is one yes/no per app.

Run all three cases in one app, then all three in the other, same day if possible. Prompt and config
versions do not change between the two halves.

## Scorecard

One row per case per app; the sheet lives at `docs/evals/results/comparison-<YYYY-MM-DD>/SCORECARD.md`
(template below, copy it). Predictions for A and I are the fixtures' `predicted_primary` and
`predicted_exclusions`, written before any generation and not edited after. For L the owner writes
the prediction on the paper sheet first.

| Check | Pass means |
|---|---|
| Primary landed | The top strategy is in the predicted set. |
| Exclusions held | Nothing from the predicted-exclusions list appears anywhere in the strategies or action plan. |
| Nothing nonsensical | No strategy that the profile makes impossible (accreditation, capital, time, geography). |
| Differentiated | For A vs I: the two plans are visibly different in strategy, geography, management stance. For L: the plan is specific to the facts entered, not generic. |
| Owner would act on it (L only) | The owner, reading it as themselves, finds at least one step they would actually take next. |
| Completed without manual retry | Every generation finished on the first attempt. |
| Wall time | Minutes from generate to all content visible (number, not pass/fail). |
| Cost | Dollars for the case, from the app's call log (number). |

Verdict per app: count of passes over the six pass/fail checks across the three cases (max 18), the
two numbers, and three sentences of judgment that the counts do not capture. Then one paragraph
naming the repo to keep and why. Disagreements between the count and the judgment are allowed and
should be stated, not smoothed over.

## Scorecard template

```markdown
# Comparison <date> — Opus 5.5, staging, by hand

Primary: investor-os @ <commit>, model <id>, prompt templates <versions from prompt_templates>
Candidate: investoros-mvp @ <commit>, model <id>, config_version <…>

| Case | App | Primary landed | Exclusions held | Nothing nonsensical | Differentiated | Owner would act (L) | No retry | Wall time | Cost |
|---|---|---|---|---|---|---|---|---|---|
| A | primary | | | | | n/a | | | |
| A | candidate | | | | | n/a | | | |
| I | primary | | | | | n/a | | | |
| I | candidate | | | | | n/a | | | |
| L | primary | | | | | | | | |
| L | candidate | | | | | | | | |

Swap test A/I — primary: <would notice / would not>. Candidate: <…>.

Totals — primary: <n>/18. Candidate: <n>/18.

Judgment — primary: <three sentences>.
Judgment — candidate: <three sentences>.

Verdict: <keep X, archive Y, because …>. Parts of Y worth porting: <…>.
```

## Out of scope

- The automated harness (`npm run eval:personas`) is a separate, later run over all ten personas; it
  does not replace this and this does not replace it.
- No prompt, config or code change in either repo between the first generation and the verdict.
- Nothing is built in the candidate for this; its runbook is documentation.
