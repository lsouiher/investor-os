# Persona eval — claude-sonnet-5

Run: 2026-10-30T12:09:29.768Z · n=1 · activate=false · base URL: http://localhost:3999
Assertions: 22/49 passed (0 skipped, action-plan checks need --activate) · rows with a failure: 10/10 · cost $0.1040

> **Mock run.** The mock server answers every persona with the same identity and strategies, so content assertions fail by design; this run proves the plumbing, not the prompts.

| Persona | Run | Archetype | Readiness | Strategy 1 | Strategy 2 | Strategy 3 | Assertions | Cost |
|---|---|---|---|---|---|---|---|---|
| A — Time-rich starter | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 3/5 ✗ | $0.0103 |
| B — Capital-rich, time-poor | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 2/5 ✗ | $0.0104 |
| C — Skilled, capital-poor | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 2/5 ✗ | $0.0104 |
| D — Scaler with a misaligned portfolio | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 3/5 ✗ | $0.0106 |
| E — Passive high earner, accredited | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 2/5 ✗ | $0.0104 |
| F — Conservative, short horizon | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 1/5 ✗ | $0.0104 |
| G — Aggressive young high earner | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 3/4 ✗ | $0.0104 |
| H — The conflicted profile | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 2/6 ✗ | $0.0104 |
| I — Twin of A | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 1/4 ✗ | $0.0104 |
| J — Expensive local market | 1 | Analytical Cash Flow Builder | 74 | House Hack a Small Multifamily | Turnkey Cash Flow Rentals | BRRRR Light | 3/5 ✗ | $0.0104 |

## Failed assertions

- **A** run 1 — must include: archetype ∈ {House Hacker | Cash Flow Hunter | Conservative Builder}: got "Analytical Cash Flow Builder"
- **A** run 1 — must include: readiness within [25, 65]: got 74
- **B** run 1 — must include: archetype ∈ {Passive Capital Partner | Wealth Architect | Conservative Builder | Cash Flow Hunter}: got "Analytical Cash Flow Builder"
- **B** run 1 — must include: sub_score:time within [0, 45]: got 62
- **B** run 1 — must exclude: strategy ~ /\bflip|BRRRR|heavy rehab|gut rehab|self.?manag|develop/i: found in "BRRRR Light Cosmetic rehabs with refinance to recycle capital."
- **C** run 1 — must include: archetype ∈ {Skilled Trades Investor | Value-Add Operator}: got "Analytical Cash Flow Builder"
- **C** run 1 — must include: readiness within [20, 60]: got 74
- **C** run 1 — must exclude: strategy ~ /turnkey|limited partner|\bLP\b|syndicat|all.?cash/i: found in "Turnkey Cash Flow Rentals Buy stabilized rentals in cash-flow markets."
- **D** run 1 — must include: archetype ∈ {Portfolio Scaler | Cash Flow Hunter | Value-Add Operator | Wealth Architect}: got "Analytical Cash Flow Builder"
- **D** run 1 — must include: insights ~ /14 hours|fourteen|over.?(allocated|committed|budget)|more (time|hours) than/i: no match in 1
- **E** run 1 — must include: archetype ∈ {Passive Capital Partner}: got "Analytical Cash Flow Builder"
- **E** run 1 — must include: sub_score:time within [0, 40]: got 62
- **E** run 1 — must exclude: strategy ~ /house.?hack|BRRRR|\bflip|self.?manag|wholesal/i: found in "BRRRR Light Cosmetic rehabs with refinance to recycle capital."
- **F** run 1 — must include: archetype ∈ {Conservative Builder | Cash Flow Hunter | Passive Capital Partner}: got "Analytical Cash Flow Builder"
- **F** run 1 — must include: readiness within [30, 70]: got 74
- **F** run 1 — must include: insights ~ /five.?year|5.?year|short (time )?horizon|horizon/i: no match in 1
- **F** run 1 — must exclude: strategy ~ /\bflip|BRRRR|develop|high.?leverage|maximum leverage/i: found in "BRRRR Light Cosmetic rehabs with refinance to recycle capital."
- **G** run 1 — must include: archetype ∈ {Value-Add Operator | Portfolio Scaler | Wealth Architect}: got "Analytical Cash Flow Builder"
- **H** run 1 — must include: contradictions ~ /risk|aggressive|conservative|three.?year|3.?year|timeline/i: no match in 1
- **H** run 1 — must include: insights ~ /three.?year|3.?year|not (reachable|realistic|feasible|achievable)|unrealistic|longer than/i: no match in 1
- **H** run 1 — must include: archetype ∈ {Conservative Builder | House Hacker | Cash Flow Hunter}: got "Analytical Cash Flow Builder"
- **H** run 1 — must include: readiness within [5, 40]: got 74
- **I** run 1 — must include: archetype ∈ {Cash Flow Hunter | Passive Capital Partner | Conservative Builder}: got "Analytical Cash Flow Builder"
- **I** run 1 — must include: readiness within [25, 65]: got 74
- **I** run 1 — must exclude: strategy ~ /house.?hack|owner.?occup|live in one|self.?manag|\bflip/i: found in "House Hack a Small Multifamily Buy a 2-4 unit, live in one, rent the rest."
- **J** run 1 — must include: archetype ∈ {House Hacker | Cash Flow Hunter | Conservative Builder | Wealth Architect}: got "Analytical Cash Flow Builder"
- **J** run 1 — must include: readiness within [25, 65]: got 74

## Calls

| Persona | Run | Call | In | Out | Latency | Cost | Stop |
|---|---|---|---|---|---|---|---|
| A | 1 | identity_synthesis | 2329 | 177 | 0.0 s | $0.0064 | end_turn |
| A | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| A | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| B | 1 | identity_synthesis | 2358 | 177 | 0.0 s | $0.0065 | end_turn |
| B | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| B | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| C | 1 | identity_synthesis | 2368 | 177 | 0.0 s | $0.0065 | end_turn |
| C | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| C | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| D | 1 | identity_synthesis | 2472 | 177 | 0.0 s | $0.0067 | end_turn |
| D | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| D | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| E | 1 | identity_synthesis | 2345 | 177 | 0.0 s | $0.0065 | end_turn |
| E | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| E | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| F | 1 | identity_synthesis | 2356 | 177 | 0.0 s | $0.0065 | end_turn |
| F | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| F | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| G | 1 | identity_synthesis | 2337 | 177 | 0.0 s | $0.0064 | end_turn |
| G | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| G | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| H | 1 | identity_synthesis | 2351 | 177 | 0.0 s | $0.0065 | end_turn |
| H | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| H | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| I | 1 | identity_synthesis | 2351 | 177 | 0.0 s | $0.0065 | end_turn |
| I | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| I | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
| J | 1 | identity_synthesis | 2353 | 177 | 0.0 s | $0.0065 | end_turn |
| J | 1 | strategy_generation | 435 | 155 | 0.0 s | $0.0024 | end_turn |
| J | 1 | insight | 305 | 88 | 0.0 s | $0.0015 | end_turn |
