# Task — persona fixtures and an eval harness for the PRIMARY repo

Read this file, then `CLAUDE.md` (confirm `git remote -v` says `lsouiher/investor-os`),
`docs/test-personas.md` in full, `docs/ai-pipeline.md` (Tables A and B, "How each input is built"),
`backend/src/modules/audit/{types,validation,scoring,routes,service}.ts`, the identity and strategy
modules, `backend/src/shared/ai/client.ts`, `scripts/mock-anthropic.mjs`, `prisma/seed.ts`, and the
frontend audit pages.

Branch `dev/persona-harness`. Plan first and wait for approval. Do not merge, do not deploy.
**No real model call in this task**: everything runs against `scripts/mock-anthropic.mjs`
(`ANTHROPIC_BASE_URL=http://localhost:3999`) until the owner starts the live run himself.

## Why

This repo and the candidate (`lsouiher/investoros-mvp`) are evaluated on the same ten personas
before 2026-12-04. The candidate already has them as fixtures A–J with an eval harness that stores
every run with model, tokens, cost and latency and checks each plan against per-persona
`must_include` / `must_exclude` rules. This repo has the same ten people only as prose in
`docs/test-personas.md`. This task gives it the matching tooling so the owner can run both apps on
identical inputs and compare the outputs persona by persona. Build dev tooling only; no product
change.

## 1. Fixtures — `backend/fixtures/personas/{A..J}.json`

Use the candidate's letters, not the doc's numbers, so results line up across repos:
A = 1 Time-rich starter · B = 2 Capital-rich time-poor · C = 3 Skilled capital-poor ·
D = 5 Scaler · E = 4 Passive high earner · F = 6 Conservative short horizon ·
G = 7 Aggressive young high earner · H = 8 Conflicted · I = 9 Twin of A · J = 10 Expensive local market.

Each fixture holds the complete response payload for all five audits, mapped onto this app's real
field names and value types (most responses here are strings inside nested objects — map every
figure onto the bracket or string this app expects, preserving the semantics: a persona with $25k
deployable must land in the bracket that means $25k), plus `label`, `summary`, `predicted_primary`,
`predicted_exclusions` and `tests` copied from the doc, and `must_include` / `must_exclude` as
plain-language assertions over the generated output (see §3). Validate every fixture through the
same validation the audit endpoints use, and add a Jest test that fails if a fixture would be
rejected. Keep I a true twin of A on every capacity input.

## 2. Seeding

- `npm run seed:persona -- A` (backend): creates a fresh user with a generated plus-addressed email
  (`persona+a@…`), completes all five audits from the fixture through the same service path a real
  user's submission takes, prints credentials and user id. `npm run seed:personas` does all ten.
- `--generate`: also runs identity synthesis and strategy generation and waits for both; `--activate`
  additionally activates the first strategy (the activation call is the third paid call — keep it
  opt-in). Seeded users are identifiable and `npm run seed:clean` removes them all.
- A dev-only in-app fill panel on every audit page (persona dropdown, "Fill this page", "Fill all
  audits", a visible list of what was filled), through the same state and validation path as
  typing. Gate the panel, its routes and the CLI on `ENABLE_DEV_SEED=true`, checked server-side on
  every route, and on nothing else: the Railway deployment the owner tests on runs with
  `NODE_ENV=production`, so an `NODE_ENV` gate would lock him out of the only environment he uses.
  The flag is documented as never-set-in-the-real-production-variables; the panel is excluded from
  the bundle when the flag is off at build time. Tell the owner which files enforce this.

## 3. Harness — `npm run eval:personas -- [--n 1] [--persona A,I] [--dry] [--yes]`

- For each persona × n: seed, synthesize, generate strategies, (optionally) activate the first;
  store the raw outputs under `docs/evals/results/<model>/<timestamp>/raw/<persona>-<run>.json`
  (gitignored) and a committed summary beside it: per run, the model id, input/output tokens, cost
  (price table in one config file, by model id), latency per call, and the assertion results.
- Assertions are the fixture's `must_include` / `must_exclude`, written for THIS app's output: the
  three strategy names and descriptions, the archetype, the readiness score and sub-scores, and
  (when activated) the action plan. Keep them as simple, auditable checks — a strategy whose name
  or description matches a given pattern is present / absent; an archetype equals / is one of; a
  score is within a band. No model-graded judge in this task.
- `--dry` replays stored raw outputs through the assertions with no model call. The harness prints
  the estimated cost and refuses to run without `--yes`.
- Before the first real run, print the model id in use (`ANTHROPIC_MODEL`) and allow
  `--model <id>` to override it for that run only, recorded in the summary.
- Add one result file the owner reads: `docs/evals/results/<model>/<timestamp>/SUMMARY.md` — a
  ten-row table (persona, archetype, readiness, the three strategy names, which assertions passed,
  cost) — so the candidate's summary and this one can be read side by side.

## Acceptance

- `npm test` (backend) passes with the fixture-validity test included.
- Against the mock server: `npm run seed:personas -- --generate` completes for all ten;
  `npm run eval:personas -- --n 1 --yes` produces the summary and `--dry` replays it.
- Nothing above is reachable with `NODE_ENV=production`, and `npm run seed:clean` leaves no persona
  user behind.

Report: what you built, how to run each part, which fields you had to invent values for, anything in
`test-personas.md` that did not map cleanly onto the audit schema, and the estimated cost of one
live `eval:personas -- --n 1` and `--n 3` at the configured model's prices.
