# Test Personas & Seeding Harness (v0.5 app)

Ten synthetic investor profiles for evaluating strategy quality, demoing to other people,
and regression-checking after prompt changes. All figures are invented; no real person's
data appears here.

This repo has no persona fixtures and no eval harness today — only `prisma/seed.ts`.
The prompt at the end builds one against this app's five audits
(`backend/src/modules/audit/types.ts`: financial, time, skills, risk, horizon & goals).

**Important:** the values below are **semantic**. This app stores most audit responses as
strings inside nested objects (`assets.liquid_cash`, `credit.credit_score_range`), so each
figure must be mapped onto whatever bracket or string this app expects. The semantics must
survive the mapping — a persona with $25k deployable must land in the bracket that means $25k.

---

## Using this as an eval, not a demo

1. **Predict first.** Each persona has a predicted primary strategy and predicted exclusions, written before any generation. Don't edit them after seeing output.
2. **Generate**, then score three things: did the primary land in the predicted set; did the predicted exclusions actually get excluded; did anything appear that should have been ruled out.
3. **Swap test.** Take persona 1's plan, imagine handing it to persona 9. Would they notice? Do this for the twin pair and two random pairs.
4. **Record** one row per run: persona, date, prompt version, primary strategy, pass/fail.

The failure that matters most is not a wrong strategy — it's ten personas getting plans that read the same.

---

## The personas

### 1 — Time-rich starter
28, renting, salaried $72k, single, Cleveland.
**Financial:** liquid $45k · retirement $8k · no property · monthly debt $250 · credit 740+ · W-2 stable · income trend growing.
**Time:** 12 h/wk · no weekday daytime · schedule predictable · active-leaning.
**Skills:** all low except networking; no properties owned; 0 years investing; network thin.
**Risk:** self-rating 4 · scenarios lean tolerant · emergency fund 6 months.
**Horizon/goals:** 17 years · target ~$6,200/mo · reserve 6 months → **deployable ≈ $25k**.
**Predicted primary:** house hack — owner-occupied 2–4 unit, FHA or low-down, self-managed, local, B/C+.
**Predicted exclusions:** development, syndication (not accredited), flips, wholesale, out-of-state.
**Tests:** low-capital entry. Failure looks like "save more money first."

### 2 — Capital-rich, time-poor
52, engineer $180k, married, two kids in college, retiring in ~10 years.
**Financial:** liquid $120k · brokerage $300k · retirement $600k · home equity $250k · credit 740+.
**Time:** 4 h/wk · no weekday daytime · availability trending down.
**Skills:** financial analysis high · negotiation medium · contractor management low · network: CPA and attorney only.
**Risk:** self-rating 2 · scenarios conservative · emergency fund 6 months · needs liquidity.
**Horizon/goals:** 10 years · $9,000/mo · $2,000/mo consulting continuing → **deployable ≈ $375k**.
**Predicted primary:** professionally managed stabilized rentals, multiple doors, conventional or DSCR, B class; possibly private lending for a slice.
**Predicted exclusions:** flips, BRRRR, heavy rehab, self-management, development.
**Tests:** does high capital override a low time budget and a low risk cap? It must not.

### 3 — Skilled, capital-poor
35, licensed contractor, self-employed ~$95k variable.
**Financial:** liquid $18k · no brokerage · credit 680–739 · income variable.
**Time:** 22 h/wk · **weekday daytime flexible**.
**Skills:** contractor management high · project management high · financial analysis low · network: contractors strong, no lenders or agents.
**Risk:** self-rating 3 · emergency fund 3 months.
**Horizon/goals:** 15 years · $7,000/mo · build equity first → **deployable ≈ $6k**.
**Predicted primary:** skill-for-equity joint venture — a capital partner funds, he contributes construction and project management; BRRRR or heavy value-add.
**Predicted exclusions:** anything requiring large solo capital, passive LP, turnkey, all-cash.
**Tests:** **no dead ends.** If the plan says he lacks the capital to start, that is a hard failure.

### 4 — Passive high earner, accredited
45, physician $400k, married, two young children.
**Financial:** liquid $200k · brokerage $400k · retirement $800k · credit 740+ · **accredited**.
**Time:** 3 h/wk · no weekday daytime.
**Skills:** all low; no real estate network beyond CPA and attorney.
**Risk:** self-rating 3 · emergency fund 6 months.
**Horizon/goals:** 12 years · $15,000/mo → **deployable ≈ $278k** · wants fully passive.
**Predicted primary:** passive LP / syndication, private lending, turnkey with full management; a diversified allocation rather than one deal.
**Predicted exclusions:** house hack, BRRRR, flips, self-management, wholesale.
**Tests:** accreditation opening LP options, and involvement preference dominating despite large capital.

### 5 — Scaler with a misaligned portfolio
41, operations manager, owns three doors.
**Portfolio:** C-class SFH (value $135k, debt $88k, rent $1,250, expenses $900, self-managed, 6 h/mo, misaligned) · B-class duplex (value $310k, debt $195k, rent $2,900, expenses $1,600, hybrid, fits) · out-of-state SFH (value $240k, debt $170k, rent $1,950, expenses $1,350, full PM, fits).
**Financial:** liquid $60k · credit 740+. **Time:** commitment 8 h/wk, **currently spending ~14**.
**Skills:** tenant management medium · deal analysis medium · construction low.
**Risk:** self-rating 3. **Horizon/goals:** 12 years · $8,000/mo → **deployable ≈ $23k**.
**Predicted primary:** portfolio review before acquisition — sell or refinance the C-class, change its management, redeploy; then a B-class acquisition.
**Predicted exclusions:** new heavy-rehab projects while over-allocated on time.
**Tests:** does portfolio management engage, and does 14-vs-8 hours get flagged?

### 6 — Conservative, short horizon
60, teacher, retiring in five years with a pension.
**Financial:** liquid $90k · brokerage $180k · credit 740+ · no debt.
**Time:** 10 h/wk · weekday daytime some.
**Skills:** low across the board, networking medium.
**Risk:** self-rating 1 · scenarios conservative · emergency fund 9 months · needs liquidity.
**Horizon/goals:** **5 years** · $3,000/mo supplemental → **deployable ≈ $155k**.
**Predicted primary:** low-leverage or all-cash stabilized rental, professionally managed, or private lending — with an explicit horizon caution.
**Predicted exclusions:** flips, BRRRR, development, heavy leverage, appreciation-dependent plays.
**Tests:** does a five-year horizon produce a stated warning rather than an optimistic plan?

### 7 — Aggressive young high earner
32, tech sales $210k plus variable, single, remote.
**Financial:** liquid $85k · brokerage $95k · credit 740+ · income trend growing.
**Time:** 15 h/wk · **weekday daytime some**.
**Skills:** negotiation high · networking high · financial analysis medium · contractor management low.
**Risk:** self-rating 5 · scenarios tolerant · emergency fund 6 months.
**Horizon/goals:** 20 years · **$20,000/mo** → **deployable ≈ $151k**.
**Predicted primary:** a sequenced multi-phase plan with triggers — value-add or BRRRR first, scaling into larger multifamily; short-term rental plausible as secondary.
**Predicted exclusions:** turnkey as primary, passive LP as primary, all-cash.
**Tests:** does the engine sequence several designs rather than naming one?

### 8 — The conflicted profile
38, married, two young children, wants out of his job in three years.
**Financial:** liquid $22k · monthly surplus ~$600 · credit 680–739.
**Time:** 5 h/wk · availability trending down.
**Skills:** all low, no network.
**Risk:** **self-rating 5, but every scenario answer conservative** — the mismatch is the point. Emergency fund 6 months.
**Horizon/goals:** **3 years** · $6,500/mo → **deployable ≈ 0 after reserves**.
**Predicted primary:** a realistic first step anyway — no dead ends — *plus explicit pushback*: a quantified statement that three years isn't reachable on these inputs, the real timeline, and the levers that move it.
**Predicted exclusions:** any plan endorsing the three-year timeline.
**Tests:** **tension detection.** A cheerful plan explaining how to reach financial independence in three years on $600/month is worse than a boring plan.

### 9 — Twin of 1 ← the diagnostic pair
29, renting, salaried $75k, single. Capacity deliberately near-identical to persona 1.
**Financial / Time / Skills / Risk:** match persona 1 within a few thousand dollars and one point — **deployable ≈ $26.5k**, 12 h/wk, same skill shape, self-rating 4, horizon 17 years.
**The differences, all in preferences:** fully passive (`active_vs_passive` at the passive end) · **will not live in a property she rents out** · prioritizes cash flow over appreciation · wants to go part-time in five years · **willing to invest out of state**.
**Predicted primary:** out-of-state professionally managed rentals, or a partnership — explicitly **not** a house hack.
**Predicted exclusions:** house hack, self-management, flips.
**Tests:** the product thesis. If 1 and 9 receive the same plan, the audits are being used and the preferences are being ignored. **Run this pair after every prompt change.**

### 10 — Expensive local market
30, marketing manager $95k, high-cost metro, wants to stay local.
**Financial:** liquid $70k · credit 740+. **Time:** 10 h/wk.
**Skills:** financial analysis medium, rest low.
**Risk:** self-rating 3. **Horizon/goals:** 15 years · $7,500/mo · **local only** → **deployable ≈ $35k**.
**Predicted primary:** the gap named explicitly, plus a substitution — house hack to make local work, a partner, or revisiting the local-only constraint.
**Predicted exclusions:** a local purchase at this budget with no mention of the gap.
**Tests:** geographic constraint against capital. Silence is the failure.

---

## Coverage

| Dimension | Span |
|---|---|
| Deployable capital | ~0 (8) · $6k (3) · $23k (5) · $25–27k (1, 9) · $35k (10) · $151k (7) · $155k (6) · $278k (4) · $375k (2) |
| Weekly time | 3h (4) · 4h (2) · 5h (8) · 10h (6, 10) · 12h (1, 9) · 15h (7) · 22h (3) |
| Risk self-rating | 1 (6) · 2 (2) · 3 (3, 4, 5, 10) · 4 (1, 9) · 5 (7, 8) |
| Stage | Starters: 1, 3, 4, 6, 7, 8, 9, 10 · Scaler: 5 |
| Accredited | 4 only |
| Special | 8 tensions · 9 twin pair · 3 substitution · 6 short horizon · 10 geography |

---

## Claude Code prompt — build the harness

> Read docs/test-personas.md in full, then backend/src/modules/audit (types.ts, validation.ts,
> scoring.ts, routes.ts, service.ts), the identity and strategy modules, and the frontend audit
> pages. Build a development-only persona harness on a branch `dev/persona-harness`; do not
> deploy it and do not merge until I have tested it.
>
> **1. Fixtures.** Create `backend/fixtures/personas/01.json` through `10.json`. Each holds the
> complete response payload for all five audits, mapped onto this app's actual field names and
> value types — most audit responses here are strings inside nested objects, so every figure in
> the document must be mapped onto the bracket or string this app expects, preserving the
> semantics. Each fixture also carries `label`, `summary`, `predicted_primary`,
> `predicted_exclusions` and `tests`, copied from the document. Validate every fixture against
> the same validation the audit endpoints use, and add a test that fails if a fixture would be
> rejected — fixtures must never drift from the real field set.
>
> **2. In-app fill panel.** A dev-only floating panel on every audit page: a persona dropdown
> showing label and summary, a "Fill this page" button that populates every field on the current
> audit from the selected persona, a "Fill all audits" button, and a visible list of what was
> just filled, field by field, so I can narrate it while someone watches. Filling must go through
> the same state and validation path a real user's typing does. Persist the selected persona
> across pages in session storage.
>
> **3. CLI.** `npm run seed:persona -- 03` creates a fresh user with a generated email, completes
> all five audits from the fixture, and prints the credentials and user id. `npm run seed:personas`
> does all ten. A `--generate` flag also triggers identity synthesis and strategy generation and
> waits for both.
>
> **Safety — I will check this first.** The panel, routes and CLI must be unreachable in
> production: gate on `NODE_ENV !== 'production'` **and** an explicit `ENABLE_DEV_SEED=true`,
> checked server-side on every route, not only in the UI. Exclude the panel from the production
> bundle rather than hiding it. Seeded users must be identifiable and `npm run seed:clean` must
> remove them all. Tell me which files enforce this.
>
> Plan first and wait for approval. When done: what you built, how to run each part, which fields
> you had to invent values for, and anything in the personas that didn't map cleanly.
