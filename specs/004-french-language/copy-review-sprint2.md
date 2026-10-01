# Copy Review, Sprint 2: French as a Full Second Language

**Feature:** 004-french-language · **Task:** T045 · **Generated:** 2026-10-01 from `frontend/locales/{en,fr}.json` and `backend/src/shared/i18n.ts`
**Glossary:** `.specify/specs/004-french-language/glossary.md` (draft, sign-off pending)

Every text added in Sprint 2, English and French side by side, for the founder's review. Corrections go into `frontend/locales/fr.json`, `backend/src/shared/i18n.ts` and the glossary; this file is regenerated, not edited.

**How to review.** Read the French column as a user would. Mark anything that is wrong, unnatural, or that a francophone outside the United States could not answer. The eight choices listed at the top of the glossary decide many rows at once (« courriel », « correspondance », « cote de crédit », « compléter », …): settle those first.

**What is checked automatically**, so it does not need a human eye: every key exists in both languages with the same `{{placeholders}}`; no empty text; non-breaking spaces before `: ; ? ! %`, inside « » and inside amounts; typographic apostrophes.

**Not in this sheet:** texts that existed before this sprint (the 407 keys of v0.4.1) unless Sprint 2 changed them (last section); the terms page (Sprint 4); anything the AI writes (Sprint 3).

| Part | Texts |
|------|-------|
| Audit form (shared) | 10 |
| Financial audit | 126 |
| Time audit | 86 |
| Skills audit | 120 |
| Risk audit | 101 |
| Horizon audit | 112 |
| Other screens | 72 |
| Server messages | 88 |
| Existing French texts changed | see the last section |

---

## 1. Audit form (shared)

| Key | English | French |
|-----|---------|--------|
| `audit.shell.section_of` | Section {{current}} of {{total}} | Section {{current}} sur {{total}} |
| `audit.shell.mode.form` | Form mode | Mode formulaire |
| `audit.shell.mode.conversational` | Chat mode | Mode conversation |
| `audit.shell.mode.coming_soon` | Conversational mode coming soon | Le mode conversation arrive bientôt |
| `audit.shell.select` | Select... | Sélectionner... |
| `audit.shell.required` | {{field}} is required | Champ obligatoire : {{field}} |
| `audit.shell.back` | Back | Retour |
| `audit.shell.next` | Next: {{section}} | Suivant : {{section}} |
| `audit.shell.saving` | Saving... | Enregistrement... |
| `audit.shell.complete` | Complete Audit | Terminer l’audit |

## 2. Financial Audit / Audit financier

**Sections**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.section.income` | Income | Revenus |
| `audit.financial.section.assets` | Assets | Actifs |
| `audit.financial.section.liabilities` | Liabilities | Passifs |
| `audit.financial.section.credit` | Credit | Crédit |
| `audit.financial.section.tax` | Tax | Fiscalité |

**Primary Annual Income**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.primary_income.label` | Primary Annual Income | Revenu annuel principal |
| `audit.financial.option.primary_income.under-25000` | Under $25,000 | Moins de 25 000 $ US |
| `audit.financial.option.primary_income.25000-50000` | $25,000 - $50,000 | 25 000 $ à 50 000 $ US |
| `audit.financial.option.primary_income.50000-75000` | $50,000 - $75,000 | 50 000 $ à 75 000 $ US |
| `audit.financial.option.primary_income.75000-100000` | $75,000 - $100,000 | 75 000 $ à 100 000 $ US |
| `audit.financial.option.primary_income.100000-150000` | $100,000 - $150,000 | 100 000 $ à 150 000 $ US |
| `audit.financial.option.primary_income.150000-250000` | $150,000 - $250,000 | 150 000 $ à 250 000 $ US |
| `audit.financial.option.primary_income.250000-500000` | $250,000 - $500,000 | 250 000 $ à 500 000 $ US |
| `audit.financial.option.primary_income.over-500000` | Over $500,000 | Plus de 500 000 $ US |

**Secondary / Side Income (Annual)**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.secondary_income.label` | Secondary / Side Income (Annual) | Revenu secondaire ou d’appoint (annuel) |
| `audit.financial.option.secondary_income.none` | None | Aucun |
| `audit.financial.option.secondary_income.under-10000` | Under $10,000 | Moins de 10 000 $ US |
| `audit.financial.option.secondary_income.10000-25000` | $10,000 - $25,000 | 10 000 $ à 25 000 $ US |
| `audit.financial.option.secondary_income.25000-50000` | $25,000 - $50,000 | 25 000 $ à 50 000 $ US |
| `audit.financial.option.secondary_income.over-50000` | Over $50,000 | Plus de 50 000 $ US |

**Income Stability**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.income_stability.label` | Income Stability | Stabilité des revenus |
| `audit.financial.option.income_stability.w2` | W-2 Employee (stable) | Salarié à revenu stable (W-2 aux États-Unis) |
| `audit.financial.option.income_stability.self-employed-stable` | Self-employed (stable) | Travailleur indépendant (revenu stable) |
| `audit.financial.option.income_stability.self-employed-variable` | Self-employed (variable) | Travailleur indépendant (revenu variable) |
| `audit.financial.option.income_stability.contract-1099` | Contract / 1099 | Contractuel ou pigiste (1099 aux États-Unis) |
| `audit.financial.option.income_stability.commission-based` | Commission-based | À la commission |
| `audit.financial.option.income_stability.seasonal` | Seasonal | Saisonnier |

**Income Trend (last 2 years)**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.income_trend.label` | Income Trend (last 2 years) | Évolution des revenus (2 dernières années) |
| `audit.financial.option.income_trend.growing` | Growing significantly | En forte hausse |
| `audit.financial.option.income_trend.stable` | Stable | Stable |
| `audit.financial.option.income_trend.declining` | Declining | En baisse |
| `audit.financial.option.income_trend.volatile` | Volatile / unpredictable | Variable ou imprévisible |

**Liquid Cash (savings, checking)**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.liquid_cash.label` | Liquid Cash (savings, checking) | Liquidités (épargne, compte courant) |
| `audit.financial.option.liquid_cash.under-5000` | Under $5,000 | Moins de 5 000 $ US |
| `audit.financial.option.liquid_cash.5000-15000` | $5,000 - $15,000 | 5 000 $ à 15 000 $ US |
| `audit.financial.option.liquid_cash.15000-50000` | $15,000 - $50,000 | 15 000 $ à 50 000 $ US |
| `audit.financial.option.liquid_cash.50000-100000` | $50,000 - $100,000 | 50 000 $ à 100 000 $ US |
| `audit.financial.option.liquid_cash.100000-250000` | $100,000 - $250,000 | 100 000 $ à 250 000 $ US |
| `audit.financial.option.liquid_cash.over-250000` | Over $250,000 | Plus de 250 000 $ US |

**Retirement Accounts (401k, IRA, etc.)**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.retirement_accounts.label` | Retirement Accounts (401k, IRA, etc.) | Comptes de retraite (401(k) ou IRA aux États-Unis, par exemple) |
| `audit.financial.option.retirement_accounts.none` | None | Aucun |
| `audit.financial.option.retirement_accounts.under-25000` | Under $25,000 | Moins de 25 000 $ US |
| `audit.financial.option.retirement_accounts.25000-100000` | $25,000 - $100,000 | 25 000 $ à 100 000 $ US |
| `audit.financial.option.retirement_accounts.100000-250000` | $100,000 - $250,000 | 100 000 $ à 250 000 $ US |
| `audit.financial.option.retirement_accounts.250000-500000` | $250,000 - $500,000 | 250 000 $ à 500 000 $ US |
| `audit.financial.option.retirement_accounts.over-500000` | Over $500,000 | Plus de 500 000 $ US |

**Existing Real Estate Equity**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.existing_re_equity.label` | Existing Real Estate Equity | Valeur nette immobilière actuelle (valeur de vos biens moins les prêts) |
| `audit.financial.option.existing_re_equity.none` | None | Aucune |
| `audit.financial.option.existing_re_equity.under-50000` | Under $50,000 | Moins de 50 000 $ US |
| `audit.financial.option.existing_re_equity.50000-150000` | $50,000 - $150,000 | 50 000 $ à 150 000 $ US |
| `audit.financial.option.existing_re_equity.150000-500000` | $150,000 - $500,000 | 150 000 $ à 500 000 $ US |
| `audit.financial.option.existing_re_equity.over-500000` | Over $500,000 | Plus de 500 000 $ US |

**Other Investments (stocks, bonds, crypto)**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.other_investments.label` | Other Investments (stocks, bonds, crypto) | Autres placements (actions, obligations, cryptomonnaies) |
| `audit.financial.option.other_investments.none` | None | Aucun |
| `audit.financial.option.other_investments.under-25000` | Under $25,000 | Moins de 25 000 $ US |
| `audit.financial.option.other_investments.25000-100000` | $25,000 - $100,000 | 25 000 $ à 100 000 $ US |
| `audit.financial.option.other_investments.100000-250000` | $100,000 - $250,000 | 100 000 $ à 250 000 $ US |
| `audit.financial.option.other_investments.over-250000` | Over $250,000 | Plus de 250 000 $ US |

**Business Equity**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.business_equity.label` | Business Equity | Parts dans une entreprise |
| `audit.financial.option.business_equity.none` | None / Not applicable | Aucune / sans objet |
| `audit.financial.option.business_equity.under-50000` | Under $50,000 | Moins de 50 000 $ US |
| `audit.financial.option.business_equity.50000-250000` | $50,000 - $250,000 | 50 000 $ à 250 000 $ US |
| `audit.financial.option.business_equity.over-250000` | Over $250,000 | Plus de 250 000 $ US |

**Total Monthly Debt Payments**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.total_monthly_debt.label` | Total Monthly Debt Payments | Total des remboursements mensuels de dettes |
| `audit.financial.option.total_monthly_debt.under-500` | Under $500 | Moins de 500 $ US |
| `audit.financial.option.total_monthly_debt.500-1000` | $500 - $1,000 | 500 $ à 1 000 $ US |
| `audit.financial.option.total_monthly_debt.1000-2500` | $1,000 - $2,500 | 1 000 $ à 2 500 $ US |
| `audit.financial.option.total_monthly_debt.2500-5000` | $2,500 - $5,000 | 2 500 $ à 5 000 $ US |
| `audit.financial.option.total_monthly_debt.over-5000` | Over $5,000 | Plus de 5 000 $ US |

**Monthly Mortgage / Rent**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.mortgage_rent.label` | Monthly Mortgage / Rent | Prêt hypothécaire ou loyer mensuel |
| `audit.financial.option.mortgage_rent.under-500` | Under $500 | Moins de 500 $ US |
| `audit.financial.option.mortgage_rent.500-1500` | $500 - $1,500 | 500 $ à 1 500 $ US |
| `audit.financial.option.mortgage_rent.1500-3000` | $1,500 - $3,000 | 1 500 $ à 3 000 $ US |
| `audit.financial.option.mortgage_rent.3000-5000` | $3,000 - $5,000 | 3 000 $ à 5 000 $ US |
| `audit.financial.option.mortgage_rent.over-5000` | Over $5,000 | Plus de 5 000 $ US |

**Student Loan Balance**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.student_loans.label` | Student Loan Balance | Solde des prêts étudiants |
| `audit.financial.option.student_loans.none` | None | Aucun |
| `audit.financial.option.student_loans.under-25000` | Under $25,000 | Moins de 25 000 $ US |
| `audit.financial.option.student_loans.25000-50000` | $25,000 - $50,000 | 25 000 $ à 50 000 $ US |
| `audit.financial.option.student_loans.50000-100000` | $50,000 - $100,000 | 50 000 $ à 100 000 $ US |
| `audit.financial.option.student_loans.over-100000` | Over $100,000 | Plus de 100 000 $ US |

**Auto Loan Balance**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.auto_loans.label` | Auto Loan Balance | Solde des prêts auto |
| `audit.financial.option.auto_loans.none` | None | Aucun |
| `audit.financial.option.auto_loans.under-10000` | Under $10,000 | Moins de 10 000 $ US |
| `audit.financial.option.auto_loans.10000-25000` | $10,000 - $25,000 | 10 000 $ à 25 000 $ US |
| `audit.financial.option.auto_loans.25000-50000` | $25,000 - $50,000 | 25 000 $ à 50 000 $ US |
| `audit.financial.option.auto_loans.over-50000` | Over $50,000 | Plus de 50 000 $ US |

**Credit Card Balances**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.credit_card_balances.label` | Credit Card Balances | Soldes de cartes de crédit |
| `audit.financial.option.credit_card_balances.none` | None / paid in full monthly | Aucun / payé en entier chaque mois |
| `audit.financial.option.credit_card_balances.under-5000` | Under $5,000 | Moins de 5 000 $ US |
| `audit.financial.option.credit_card_balances.5000-15000` | $5,000 - $15,000 | 5 000 $ à 15 000 $ US |
| `audit.financial.option.credit_card_balances.15000-30000` | $15,000 - $30,000 | 15 000 $ à 30 000 $ US |
| `audit.financial.option.credit_card_balances.over-30000` | Over $30,000 | Plus de 30 000 $ US |

**Credit Score Range**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.credit_score_range.label` | Credit Score Range | Cote de crédit (score de crédit, échelle américaine de 300 à 850) |
| `audit.financial.option.credit_score_range.below-580` | Below 580 (Poor) | Moins de 580 (faible) |
| `audit.financial.option.credit_score_range.580-669` | 580-669 (Fair) | 580 à 669 (passable) |
| `audit.financial.option.credit_score_range.670-739` | 670-739 (Good) | 670 à 739 (bonne) |
| `audit.financial.option.credit_score_range.740-799` | 740-799 (Very Good) | 740 à 799 (très bonne) |
| `audit.financial.option.credit_score_range.800-plus` | 800+ (Excellent) | 800 et plus (excellente) |
| `audit.financial.option.credit_score_range.unknown` | I don't know | Je ne sais pas |

**Credit History Length**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.credit_history_length.label` | Credit History Length | Ancienneté de l’historique de crédit |
| `audit.financial.option.credit_history_length.under-2` | Under 2 years | Moins de 2 ans |
| `audit.financial.option.credit_history_length.2-5` | 2-5 years | 2 à 5 ans |
| `audit.financial.option.credit_history_length.5-10` | 5-10 years | 5 à 10 ans |
| `audit.financial.option.credit_history_length.over-10` | Over 10 years | Plus de 10 ans |

**Recent Hard Inquiries (last 12 months)**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.recent_inquiries.label` | Recent Hard Inquiries (last 12 months) | Demandes de crédit récentes (12 derniers mois) |
| `audit.financial.option.recent_inquiries.0` | None | Aucune |
| `audit.financial.option.recent_inquiries.1-2` | 1-2 | 1 à 2 |
| `audit.financial.option.recent_inquiries.3-5` | 3-5 | 3 à 5 |
| `audit.financial.option.recent_inquiries.over-5` | More than 5 | Plus de 5 |

**Filing Status**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.filing_status.label` | Filing Status | Situation de déclaration fiscale |
| `audit.financial.option.filing_status.single` | Single | Célibataire |
| `audit.financial.option.filing_status.married-joint` | Married Filing Jointly | Marié(e), déclaration conjointe |
| `audit.financial.option.filing_status.married-separate` | Married Filing Separately | Marié(e), déclarations séparées |
| `audit.financial.option.filing_status.head-of-household` | Head of Household | Chef de famille (« Head of Household » aux États-Unis) |

**Estimated Effective Tax Rate**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.effective_tax_rate.label` | Estimated Effective Tax Rate | Taux d’imposition effectif estimé |
| `audit.financial.option.effective_tax_rate.under-15` | Under 15% | Moins de 15 % |
| `audit.financial.option.effective_tax_rate.15-22` | 15% - 22% | 15 % à 22 % |
| `audit.financial.option.effective_tax_rate.22-32` | 22% - 32% | 22 % à 32 % |
| `audit.financial.option.effective_tax_rate.32-37` | 32% - 37% | 32 % à 37 % |
| `audit.financial.option.effective_tax_rate.over-37` | Over 37% | Plus de 37 % |
| `audit.financial.option.effective_tax_rate.unknown` | Not sure | Je ne sais pas |

**Do you work with a CPA or tax professional?**

| Key | English | French |
|-----|---------|--------|
| `audit.financial.field.has_accountant.label` | Do you work with a CPA or tax professional? | Travaillez-vous avec un comptable ou un fiscaliste (CPA aux États-Unis) ? |
| `audit.financial.option.has_accountant.yes` | Yes | Oui |
| `audit.financial.option.has_accountant.no` | No | Non |
| `audit.financial.option.has_accountant.planning-to` | Planning to | C’est prévu |

## 3. Time Audit / Audit temps

**Sections**

| Key | English | French |
|-----|---------|--------|
| `audit.time.section.work` | Work Schedule | Horaire de travail |
| `audit.time.section.availability` | RE Availability | Disponibilité pour l’immobilier |
| `audit.time.section.flexibility` | Flexibility | Flexibilité |
| `audit.time.section.preferences` | Involvement Preferences | Préférences d’implication |
| `audit.time.section.runway` | Time Runway | Durée de l’engagement |

**Hours worked per week (primary job)**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.work_hours_per_week.label` | Hours worked per week (primary job) | Heures travaillées par semaine (emploi principal) |
| `audit.time.option.work_hours_per_week.under-20` | Under 20 hours | Moins de 20 heures |
| `audit.time.option.work_hours_per_week.20-30` | 20-30 hours | 20 à 30 heures |
| `audit.time.option.work_hours_per_week.30-40` | 30-40 hours | 30 à 40 heures |
| `audit.time.option.work_hours_per_week.40-50` | 40-50 hours | 40 à 50 heures |
| `audit.time.option.work_hours_per_week.50-60` | 50-60 hours | 50 à 60 heures |
| `audit.time.option.work_hours_per_week.over-60` | Over 60 hours | Plus de 60 heures |

**Weekly commute time**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.commute_hours_per_week.label` | Weekly commute time | Temps de trajet hebdomadaire |
| `audit.time.option.commute_hours_per_week.0` | None (remote) | Aucun (télétravail) |
| `audit.time.option.commute_hours_per_week.under-3` | Under 3 hours | Moins de 3 heures |
| `audit.time.option.commute_hours_per_week.3-7` | 3-7 hours | 3 à 7 heures |
| `audit.time.option.commute_hours_per_week.7-10` | 7-10 hours | 7 à 10 heures |
| `audit.time.option.commute_hours_per_week.over-10` | Over 10 hours | Plus de 10 heures |

**Weekly caregiving responsibilities**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.caregiving_hours.label` | Weekly caregiving responsibilities | Temps hebdomadaire consacré aux proches (enfants, parents à charge) |
| `audit.time.option.caregiving_hours.none` | None | Aucun |
| `audit.time.option.caregiving_hours.under-5` | Under 5 hours | Moins de 5 heures |
| `audit.time.option.caregiving_hours.5-15` | 5-15 hours | 5 à 15 heures |
| `audit.time.option.caregiving_hours.15-30` | 15-30 hours | 15 à 30 heures |
| `audit.time.option.caregiving_hours.over-30` | Over 30 hours | Plus de 30 heures |

**Weekly hours on side projects / hobbies**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.side_projects_hours.label` | Weekly hours on side projects / hobbies | Heures hebdomadaires consacrées à des projets personnels ou à des loisirs |
| `audit.time.option.side_projects_hours.none` | None | Aucune |
| `audit.time.option.side_projects_hours.under-5` | Under 5 hours | Moins de 5 heures |
| `audit.time.option.side_projects_hours.5-10` | 5-10 hours | 5 à 10 heures |
| `audit.time.option.side_projects_hours.10-20` | 10-20 hours | 10 à 20 heures |
| `audit.time.option.side_projects_hours.over-20` | Over 20 hours | Plus de 20 heures |

**Hours per week you can dedicate to real estate**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.re_hours_per_week.label` | Hours per week you can dedicate to real estate | Heures par semaine que vous pouvez consacrer à l’immobilier |
| `audit.time.option.re_hours_per_week.under-2` | Under 2 hours | Moins de 2 heures |
| `audit.time.option.re_hours_per_week.2-5` | 2-5 hours | 2 à 5 heures |
| `audit.time.option.re_hours_per_week.5-10` | 5-10 hours | 5 à 10 heures |
| `audit.time.option.re_hours_per_week.10-20` | 10-20 hours | 10 à 20 heures |
| `audit.time.option.re_hours_per_week.20-30` | 20-30 hours | 20 à 30 heures |
| `audit.time.option.re_hours_per_week.over-30` | Over 30 hours (full-time) | Plus de 30 heures (temps plein) |

**When are you most available for RE activities?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.best_times.label` | When are you most available for RE activities? | Quand êtes-vous le plus disponible pour vos activités immobilières ? |
| `audit.time.option.best_times.weekday-mornings` | Weekday mornings | En semaine, le matin |
| `audit.time.option.best_times.weekday-evenings` | Weekday evenings | En semaine, le soir |
| `audit.time.option.best_times.weekends` | Weekends | Le week-end |
| `audit.time.option.best_times.flexible` | Flexible schedule | Horaire flexible |

**Can you take RE-related calls during work hours?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.calls_during_work.label` | Can you take RE-related calls during work hours? | Pouvez-vous prendre des appels liés à l’immobilier pendant vos heures de travail ? |
| `audit.time.option.calls_during_work.yes` | Yes, easily | Oui, facilement |
| `audit.time.option.calls_during_work.sometimes` | Sometimes, with notice | Parfois, avec préavis |
| `audit.time.option.calls_during_work.rarely` | Rarely | Rarement |
| `audit.time.option.calls_during_work.no` | No | Non |

**Can you visit properties on weekdays?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.weekday_property_visits.label` | Can you visit properties on weekdays? | Pouvez-vous visiter des biens en semaine ? |
| `audit.time.option.weekday_property_visits.yes` | Yes | Oui |
| `audit.time.option.weekday_property_visits.with-notice` | With advance notice | Avec préavis |
| `audit.time.option.weekday_property_visits.half-days-only` | Half days only | Par demi-journées seulement |
| `audit.time.option.weekday_property_visits.no` | No, weekends only | Non, le week-end seulement |

**Willingness to travel for RE opportunities**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.travel_willingness.label` | Willingness to travel for RE opportunities | Disposition à vous déplacer pour des occasions immobilières |
| `audit.time.option.travel_willingness.local-only` | Local only (under 1 hour) | Local seulement (moins d’une heure) |
| `audit.time.option.travel_willingness.regional` | Regional (1-3 hours) | Régional (1 à 3 heures) |
| `audit.time.option.travel_willingness.national` | National (willing to fly) | National (y compris en avion) |
| `audit.time.option.travel_willingness.no-travel` | Not willing to travel | Aucun déplacement |

**Does your availability change seasonally?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.seasonal_changes.label` | Does your availability change seasonally? | Votre disponibilité varie-t-elle selon les saisons ? |
| `audit.time.option.seasonal_changes.no` | No, consistent year-round | Non, stable toute l’année |
| `audit.time.option.seasonal_changes.summer-more` | More available in summer | Plus disponible en été |
| `audit.time.option.seasonal_changes.winter-more` | More available in winter | Plus disponible en hiver |
| `audit.time.option.seasonal_changes.varies` | Varies significantly | Varie beaucoup |

**How hands-on do you want to be?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.hands_on_preference.label` | How hands-on do you want to be? | Quel degré d’implication directe souhaitez-vous ? |
| `audit.time.option.hands_on_preference.very-hands-on` | Very hands-on (do it myself) | Très élevé (je fais tout moi-même) |
| `audit.time.option.hands_on_preference.moderate` | Moderate (manage contractors) | Modéré (je gère des entrepreneurs) |
| `audit.time.option.hands_on_preference.minimal` | Minimal (delegate everything) | Minimal (je délègue tout) |
| `audit.time.option.hands_on_preference.purely-passive` | Purely passive | Purement passif |

**Willingness to learn new RE skills**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.willingness_to_learn.label` | Willingness to learn new RE skills | Disposition à acquérir de nouvelles compétences en immobilier |
| `audit.time.option.willingness_to_learn.very-willing` | Very willing (courses, books, mentors) | Très élevée (cours, livres, mentors) |
| `audit.time.option.willingness_to_learn.somewhat` | Somewhat (learn as I go) | Moyenne (j’apprends en chemin) |
| `audit.time.option.willingness_to_learn.minimal` | Minimal (want a turnkey system) | Minimale (je veux un système clé en main) |

**Preferred management approach**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.management_style.label` | Preferred management approach | Approche de gestion préférée |
| `audit.time.option.management_style.self-manage` | Self-manage everything | Tout gérer moi-même |
| `audit.time.option.management_style.hybrid` | Hybrid (self-manage some, hire for rest) | Hybride (je gère une partie, je délègue le reste) |
| `audit.time.option.management_style.fully-managed` | Hire property management | Confier la gestion locative à un professionnel |

**How long can you sustain this time commitment?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.sustainability.label` | How long can you sustain this time commitment? | Combien de temps pouvez-vous maintenir cet engagement de temps ? |
| `audit.time.option.sustainability.under-3-months` | Under 3 months | Moins de 3 mois |
| `audit.time.option.sustainability.3-6-months` | 3-6 months | 3 à 6 mois |
| `audit.time.option.sustainability.6-12-months` | 6-12 months | 6 à 12 mois |
| `audit.time.option.sustainability.1-3-years` | 1-3 years | 1 à 3 ans |
| `audit.time.option.sustainability.indefinitely` | Indefinitely | Indéfiniment |

**Any expected changes to your availability?**

| Key | English | French |
|-----|---------|--------|
| `audit.time.field.future_changes.label` | Any expected changes to your availability? | Prévoyez-vous des changements à votre disponibilité ? |
| `audit.time.option.future_changes.no-changes` | No changes expected | Aucun changement prévu |
| `audit.time.option.future_changes.more-time` | Expect to have more time soon | Je devrais bientôt avoir plus de temps |
| `audit.time.option.future_changes.less-time` | Expect to have less time soon | Je devrais bientôt avoir moins de temps |
| `audit.time.option.future_changes.uncertain` | Uncertain | Incertain |

## 4. Skills & Experience / Compétences et expérience

**Sections**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.section.re_experience` | Real Estate Experience | Expérience en immobilier |
| `audit.skills.section.professional` | Professional Background | Parcours professionnel |
| `audit.skills.section.transferable` | Transferable Skills | Compétences transférables |
| `audit.skills.section.education` | RE Education | Formation en immobilier |
| `audit.skills.section.network` | Network | Réseau |

**Number of RE deals closed**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.deals_closed.label` | Number of RE deals closed | Nombre de transactions immobilières conclues |
| `audit.skills.option.deals_closed.0` | None | Aucune |
| `audit.skills.option.deals_closed.1-2` | 1-2 deals | 1 à 2 transactions |
| `audit.skills.option.deals_closed.3-5` | 3-5 deals | 3 à 5 transactions |
| `audit.skills.option.deals_closed.6-10` | 6-10 deals | 6 à 10 transactions |
| `audit.skills.option.deals_closed.over-10` | More than 10 deals | Plus de 10 transactions |

**Types of deals (if any)**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.deal_types.label` | Types of deals (if any) | Types de transactions (le cas échéant) |
| `audit.skills.option.deal_types.none` | No experience | Aucune expérience |
| `audit.skills.option.deal_types.primary-residence` | Primary residence only | Résidence principale seulement |
| `audit.skills.option.deal_types.single-family-rental` | Single family rental | Maison unifamiliale locative |
| `audit.skills.option.deal_types.multi-family` | Multi-family | Immeuble multilogement |
| `audit.skills.option.deal_types.commercial` | Commercial | Immobilier commercial |
| `audit.skills.option.deal_types.flip` | Fix and flip | Achat-revente (flip) |
| `audit.skills.option.deal_types.mixed` | Multiple types | Plusieurs types |

**Current RE holdings**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.current_holdings.label` | Current RE holdings | Biens immobiliers détenus actuellement |
| `audit.skills.option.current_holdings.none` | None | Aucun |
| `audit.skills.option.current_holdings.primary-only` | Primary residence only | Résidence principale seulement |
| `audit.skills.option.current_holdings.1-rental` | 1 rental property | 1 bien locatif |
| `audit.skills.option.current_holdings.2-4-rentals` | 2-4 rental properties | 2 à 4 biens locatifs |
| `audit.skills.option.current_holdings.5-plus` | 5+ properties | 5 biens et plus |

**Biggest RE success (if any)**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.biggest_success.label` | Biggest RE success (if any) | Plus grande réussite en immobilier (le cas échéant) |
| `audit.skills.field.biggest_success.placeholder` | Briefly describe your most successful RE experience... | Décrivez brièvement votre expérience immobilière la plus réussie... |

**Biggest RE lesson / failure (if any)**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.biggest_failure.label` | Biggest RE lesson / failure (if any) | Plus grande leçon ou plus grand échec en immobilier (le cas échéant) |
| `audit.skills.field.biggest_failure.placeholder` | Briefly describe a RE setback or lesson learned... | Décrivez brièvement un revers ou une leçon tirée en immobilier... |

**Current profession / industry**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.profession.label` | Current profession / industry | Profession ou secteur d’activité actuel |
| `audit.skills.field.profession.placeholder` | e.g., Software Engineer, Nurse, Sales Manager | p. ex. ingénieur logiciel, infirmière, directeur des ventes |

**Years of professional experience**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.years_experience.label` | Years of professional experience | Années d’expérience professionnelle |
| `audit.skills.option.years_experience.under-2` | Under 2 years | Moins de 2 ans |
| `audit.skills.option.years_experience.2-5` | 2-5 years | 2 à 5 ans |
| `audit.skills.option.years_experience.5-10` | 5-10 years | 5 à 10 ans |
| `audit.skills.option.years_experience.10-20` | 10-20 years | 10 à 20 ans |
| `audit.skills.option.years_experience.over-20` | Over 20 years | Plus de 20 ans |

**Management / leadership experience**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.management_experience.label` | Management / leadership experience | Expérience de gestion ou de leadership |
| `audit.skills.option.management_experience.none` | None | Aucune |
| `audit.skills.option.management_experience.small-team` | Small team (1-5 people) | Petite équipe (1 à 5 personnes) |
| `audit.skills.option.management_experience.medium-team` | Medium team (6-20 people) | Équipe moyenne (6 à 20 personnes) |
| `audit.skills.option.management_experience.large-team` | Large team (20+ people) | Grande équipe (plus de 20 personnes) |
| `audit.skills.option.management_experience.executive` | Executive / C-level | Cadre dirigeant / direction générale |

**Negotiation skill level**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.negotiation_skill.label` | Negotiation skill level | Niveau en négociation |
| `audit.skills.option.negotiation_skill.beginner` | Beginner | Débutant |
| `audit.skills.option.negotiation_skill.intermediate` | Intermediate | Intermédiaire |
| `audit.skills.option.negotiation_skill.advanced` | Advanced | Avancé |
| `audit.skills.option.negotiation_skill.expert` | Expert (professional negotiator) | Expert (négociateur professionnel) |

**Analytical / financial analysis skill**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.analytical_skill.label` | Analytical / financial analysis skill | Compétences en analyse financière |
| `audit.skills.option.analytical_skill.beginner` | Beginner (basic math) | Débutant (calculs de base) |
| `audit.skills.option.analytical_skill.intermediate` | Intermediate (spreadsheets) | Intermédiaire (tableurs) |
| `audit.skills.option.analytical_skill.advanced` | Advanced (financial modeling) | Avancé (modélisation financière) |
| `audit.skills.option.analytical_skill.expert` | Expert (professional analyst) | Expert (analyste professionnel) |

**Construction / renovation knowledge**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.construction_knowledge.label` | Construction / renovation knowledge | Connaissances en construction et en rénovation |
| `audit.skills.option.construction_knowledge.none` | None | Aucune |
| `audit.skills.option.construction_knowledge.basic-diy` | Basic DIY | Bricolage de base |
| `audit.skills.option.construction_knowledge.moderate` | Moderate (can manage projects) | Moyennes (capable de gérer des chantiers) |
| `audit.skills.option.construction_knowledge.professional` | Professional level | Niveau professionnel |

**Sales / marketing experience**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.sales_marketing.label` | Sales / marketing experience | Expérience en vente et en marketing |
| `audit.skills.option.sales_marketing.none` | None | Aucune |
| `audit.skills.option.sales_marketing.some` | Some experience | Une certaine expérience |
| `audit.skills.option.sales_marketing.professional` | Professional background | Expérience professionnelle |

**Legal / contracts knowledge**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.legal_knowledge.label` | Legal / contracts knowledge | Connaissances juridiques et contractuelles |
| `audit.skills.option.legal_knowledge.none` | None | Aucune |
| `audit.skills.option.legal_knowledge.basic` | Basic (can read a contract) | De base (capable de lire un contrat) |
| `audit.skills.option.legal_knowledge.moderate` | Moderate (comfortable negotiating terms) | Moyennes (à l’aise pour négocier des clauses) |
| `audit.skills.option.legal_knowledge.professional` | Legal professional | Juriste de profession |

**Accounting / bookkeeping knowledge**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.accounting_knowledge.label` | Accounting / bookkeeping knowledge | Connaissances en comptabilité et en tenue de livres |
| `audit.skills.option.accounting_knowledge.none` | None | Aucune |
| `audit.skills.option.accounting_knowledge.basic` | Basic (personal finances) | De base (finances personnelles) |
| `audit.skills.option.accounting_knowledge.moderate` | Moderate (business bookkeeping) | Moyennes (comptabilité d’entreprise) |
| `audit.skills.option.accounting_knowledge.professional` | Accounting professional | Comptable de profession |

**Project management experience**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.project_management.label` | Project management experience | Expérience en gestion de projet |
| `audit.skills.option.project_management.none` | None | Aucune |
| `audit.skills.option.project_management.informal` | Informal experience | Expérience informelle |
| `audit.skills.option.project_management.formal` | Formal PM training / certification | Formation ou certification en gestion de projet |
| `audit.skills.option.project_management.professional` | Professional project manager | Gestionnaire de projet de profession |

**Technology comfort level**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.technology_comfort.label` | Technology comfort level | Aisance avec la technologie |
| `audit.skills.option.technology_comfort.basic` | Basic (email, web browsing) | De base (courriel, navigation web) |
| `audit.skills.option.technology_comfort.moderate` | Moderate (spreadsheets, apps) | Moyenne (tableurs, applications) |
| `audit.skills.option.technology_comfort.advanced` | Advanced (automation, data tools) | Avancée (automatisation, outils de données) |
| `audit.skills.option.technology_comfort.expert` | Tech professional | Professionnel des technologies |

**RE-related courses / training completed**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.courses_completed.label` | RE-related courses / training completed | Cours ou formations suivis en immobilier |
| `audit.skills.option.courses_completed.none` | None | Aucun |
| `audit.skills.option.courses_completed.online-courses` | Online courses / YouTube | Cours en ligne / YouTube |
| `audit.skills.option.courses_completed.books-podcasts` | Books and podcasts | Livres et podcasts |
| `audit.skills.option.courses_completed.formal-course` | Formal RE course / bootcamp | Formation structurée en immobilier (cours, bootcamp) |
| `audit.skills.option.courses_completed.multiple` | Multiple courses and programs | Plusieurs cours et programmes |

**RE-related licenses or certifications**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.licenses.label` | RE-related licenses or certifications | Permis ou certifications liés à l’immobilier |
| `audit.skills.option.licenses.none` | None | Aucun |
| `audit.skills.option.licenses.re-license` | Real estate license | Permis d’agent ou de courtier immobilier |
| `audit.skills.option.licenses.contractor-license` | Contractor license | Licence d’entrepreneur en construction |
| `audit.skills.option.licenses.other` | Other relevant license | Autre permis pertinent |
| `audit.skills.option.licenses.multiple` | Multiple licenses | Plusieurs permis |

**Currently learning about**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.current_learning.label` | Currently learning about | Ce que vous apprenez en ce moment |
| `audit.skills.field.current_learning.placeholder` | e.g., BRRRR strategy, wholesaling, commercial analysis... | p. ex. stratégie BRRRR, wholesaling, analyse d’immobilier commercial... |

**Do you have a real estate agent?**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.has_agent.label` | Do you have a real estate agent? | Avez-vous un agent immobilier ? |
| `audit.skills.option.has_agent.yes` | Yes | Oui |
| `audit.skills.option.has_agent.no` | No | Non |
| `audit.skills.option.has_agent.looking` | Looking for one | J’en cherche un |

**Do you have a lender relationship?**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.has_lender.label` | Do you have a lender relationship? | Avez-vous une relation établie avec un prêteur ? |
| `audit.skills.option.has_lender.yes` | Yes | Oui |
| `audit.skills.option.has_lender.no` | No | Non |
| `audit.skills.option.has_lender.looking` | Looking for one | J’en cherche un |

**Do you have a trusted contractor?**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.has_contractor.label` | Do you have a trusted contractor? | Avez-vous un entrepreneur de confiance ? |
| `audit.skills.option.has_contractor.yes` | Yes | Oui |
| `audit.skills.option.has_contractor.no` | No | Non |
| `audit.skills.option.has_contractor.looking` | Looking for one | J’en cherche un |

**Do you have a real estate attorney?**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.has_attorney.label` | Do you have a real estate attorney? | Avez-vous un avocat en immobilier ? |
| `audit.skills.option.has_attorney.yes` | Yes | Oui |
| `audit.skills.option.has_attorney.no` | No | Non |
| `audit.skills.option.has_attorney.looking` | Looking for one | J’en cherche un |

**Do you have a CPA familiar with RE?**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.has_cpa.label` | Do you have a CPA familiar with RE? | Avez-vous un comptable qui connaît l’immobilier (CPA aux États-Unis) ? |
| `audit.skills.option.has_cpa.yes` | Yes | Oui |
| `audit.skills.option.has_cpa.no` | No | Non |
| `audit.skills.option.has_cpa.looking` | Looking for one | J’en cherche un |

**Do you have an RE mentor or experienced investor contact?**

| Key | English | French |
|-----|---------|--------|
| `audit.skills.field.has_mentor.label` | Do you have an RE mentor or experienced investor contact? | Avez-vous un mentor ou un contact investisseur expérimenté en immobilier ? |
| `audit.skills.option.has_mentor.yes` | Yes | Oui |
| `audit.skills.option.has_mentor.no` | No | Non |
| `audit.skills.option.has_mentor.looking` | Looking for one | J’en cherche un |

## 5. Risk Profile / Profil de risque

**Sections**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.section.self_assessment` | Self-Assessment | Auto-évaluation |
| `audit.risk.section.scenarios` | Scenario-Based Questions | Mises en situation |
| `audit.risk.section.safety` | Financial Safety | Sécurité financière |
| `audit.risk.section.behavioral` | Behavioral Indicators | Indicateurs comportementaux |
| `audit.risk.section.comfort_zones` | Comfort Zones | Zones de confort |

**How would you describe your overall risk tolerance?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.risk_tolerance_self.label` | How would you describe your overall risk tolerance? | Comment décririez-vous votre tolérance globale au risque ? |
| `audit.risk.option.risk_tolerance_self.very-conservative` | Very conservative - preserve capital above all | Très prudente : préserver le capital avant tout |
| `audit.risk.option.risk_tolerance_self.conservative` | Conservative - some risk for moderate returns | Prudente : un peu de risque pour un rendement modéré |
| `audit.risk.option.risk_tolerance_self.moderate` | Moderate - balanced risk and reward | Modérée : équilibre entre risque et rendement |
| `audit.risk.option.risk_tolerance_self.aggressive` | Aggressive - higher risk for higher returns | Dynamique : plus de risque pour plus de rendement |
| `audit.risk.option.risk_tolerance_self.very-aggressive` | Very aggressive - maximum growth potential | Très dynamique : potentiel de croissance maximal |

**Your rental is vacant for 3 months. How do you respond?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.vacancy_scenario.label` | Your rental is vacant for 3 months. How do you respond? | Votre bien locatif reste inoccupé pendant 3 mois. Comment réagissez-vous ? |
| `audit.risk.option.vacancy_scenario.panic-sell` | Panic - consider selling | Panique : j’envisage de vendre |
| `audit.risk.option.vacancy_scenario.stressed-lower-rent` | Stressed - significantly lower rent | Stress : je baisse fortement le loyer |
| `audit.risk.option.vacancy_scenario.concerned-adjust` | Concerned - review pricing, make adjustments | Inquiétude : je revois le prix et j’ajuste |
| `audit.risk.option.vacancy_scenario.expected-reserves` | Expected - use reserves, stay the course | C’était prévu : j’utilise mes réserves et je garde le cap |
| `audit.risk.option.vacancy_scenario.opportunity` | Opportunity - use downtime for improvements | Occasion : j’en profite pour faire des améliorations |

**You face a $15,000 unexpected repair. How do you handle it?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.unexpected_repair.label` | You face a $15,000 unexpected repair. How do you handle it? | Vous faites face à une réparation imprévue de 15 000 $ US. Comment la gérez-vous ? |
| `audit.risk.option.unexpected_repair.devastating` | Devastating - can't afford it | Catastrophique : je n’en ai pas les moyens |
| `audit.risk.option.unexpected_repair.major-stress` | Major stress - would have to borrow | Stress majeur : je devrais emprunter |
| `audit.risk.option.unexpected_repair.uncomfortable` | Uncomfortable - doable from savings | Inconfortable : faisable avec mon épargne |
| `audit.risk.option.unexpected_repair.manageable` | Manageable - that's what reserves are for | Gérable : les réserves servent à cela |
| `audit.risk.option.unexpected_repair.no-issue` | No issue - well-prepared for this | Aucun problème : c’est bien prévu |

**Property values drop 20% in your market. What do you do?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.market_drop.label` | Property values drop 20% in your market. What do you do? | La valeur des biens baisse de 20 % dans votre marché. Que faites-vous ? |
| `audit.risk.option.market_drop.sell-immediately` | Sell immediately to cut losses | Je vends tout de suite pour limiter les pertes |
| `audit.risk.option.market_drop.worried-hold` | Very worried but hold | Grande inquiétude, mais je conserve |
| `audit.risk.option.market_drop.concerned-hold` | Concerned but hold - focus on cash flow | Inquiétude, mais je conserve et je me concentre sur le cash-flow |
| `audit.risk.option.market_drop.unfazed` | Unfazed - long-term investor | Aucune inquiétude : j’investis à long terme |
| `audit.risk.option.market_drop.buy-more` | Excited - buy more at a discount | Enthousiasme : j’achète davantage au rabais |

**A great deal needs a decision in 48 hours. How do you respond?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.time_pressure.label` | A great deal needs a decision in 48 hours. How do you respond? | Une excellente occasion exige une décision en 48 heures. Comment réagissez-vous ? |
| `audit.risk.option.time_pressure.pass-always` | Always pass - need more time | Je passe toujours mon tour : il me faut plus de temps |
| `audit.risk.option.time_pressure.uncomfortable` | Very uncomfortable but might act | Très inconfortable, mais je pourrais agir |
| `audit.risk.option.time_pressure.cautious-analysis` | Do rapid analysis, decide if numbers work | Analyse rapide, puis décision si les chiffres tiennent |
| `audit.risk.option.time_pressure.comfortable` | Comfortable - have a decision framework ready | À l’aise : j’ai déjà une grille de décision |
| `audit.risk.option.time_pressure.thrive` | Thrive under pressure - ready to act fast | La pression me stimule : j’agis vite |

**Someone proposes a deal outside your experience. What do you do?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.out_of_scope.label` | Someone proposes a deal outside your experience. What do you do? | Quelqu’un vous propose une transaction hors de votre champ d’expérience. Que faites-vous ? |
| `audit.risk.option.out_of_scope.hard-pass` | Hard pass - stick to what I know | Refus net : je m’en tiens à ce que je connais |
| `audit.risk.option.out_of_scope.unlikely` | Unlikely - would need a lot of convincing | Peu probable : il faudrait beaucoup me convaincre |
| `audit.risk.option.out_of_scope.research-first` | Research it thoroughly first | Je me renseigne à fond d’abord |
| `audit.risk.option.out_of_scope.open-with-mentor` | Open to it with a mentor's guidance | Pourquoi pas, avec l’accompagnement d’un mentor |
| `audit.risk.option.out_of_scope.excited` | Excited to learn something new | Enthousiaste à l’idée d’apprendre quelque chose de nouveau |

**Emergency fund (months of expenses covered)**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.emergency_fund.label` | Emergency fund (months of expenses covered) | Fonds d’urgence (mois de dépenses couverts) |
| `audit.risk.option.emergency_fund.none` | No emergency fund | Aucun fonds d’urgence |
| `audit.risk.option.emergency_fund.under-3` | Under 3 months | Moins de 3 mois |
| `audit.risk.option.emergency_fund.3-6` | 3-6 months | 3 à 6 mois |
| `audit.risk.option.emergency_fund.6-12` | 6-12 months | 6 à 12 mois |
| `audit.risk.option.emergency_fund.over-12` | Over 12 months | Plus de 12 mois |

**Do you have backup income sources?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.backup_income.label` | Do you have backup income sources? | Avez-vous des sources de revenus de secours ? |
| `audit.risk.option.backup_income.no` | No - single income source | Non : une seule source de revenus |
| `audit.risk.option.backup_income.spouse-partner` | Yes - spouse/partner income | Oui : revenu du conjoint ou de la conjointe |
| `audit.risk.option.backup_income.side-income` | Yes - side income/business | Oui : revenu d’appoint ou entreprise |
| `audit.risk.option.backup_income.multiple` | Yes - multiple backup sources | Oui : plusieurs sources de secours |

**Number of financial dependents**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.dependents.label` | Number of financial dependents | Nombre de personnes à charge |
| `audit.risk.option.dependents.0` | None | Aucune |
| `audit.risk.option.dependents.1` | 1 | 1 |
| `audit.risk.option.dependents.2-3` | 2-3 | 2 à 3 |
| `audit.risk.option.dependents.4-plus` | 4 or more | 4 ou plus |

**Insurance coverage level**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.insurance_coverage.label` | Insurance coverage level | Niveau de couverture d’assurance |
| `audit.risk.option.insurance_coverage.minimal` | Minimal / basic | Minimale / de base |
| `audit.risk.option.insurance_coverage.moderate` | Moderate coverage | Couverture moyenne |
| `audit.risk.option.insurance_coverage.comprehensive` | Comprehensive coverage | Couverture complète |
| `audit.risk.option.insurance_coverage.unsure` | Not sure | Je ne sais pas |

**When the stock market drops 10%, what do you typically do?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.stock_market_reaction.label` | When the stock market drops 10%, what do you typically do? | Quand la Bourse chute de 10 %, que faites-vous habituellement ? |
| `audit.risk.option.stock_market_reaction.sell-everything` | Sell everything | Je vends tout |
| `audit.risk.option.stock_market_reaction.sell-some` | Sell some to reduce exposure | J’en vends une partie pour réduire mon exposition |
| `audit.risk.option.stock_market_reaction.do-nothing` | Do nothing - wait it out | Rien : j’attends que ça passe |
| `audit.risk.option.stock_market_reaction.buy-more` | Buy more (dollar-cost average) | J’achète davantage (achats programmés) |
| `audit.risk.option.stock_market_reaction.no-investments` | N/A - no stock investments | Sans objet : aucun placement en Bourse |

**How often do you check your investments?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.check_frequency.label` | How often do you check your investments? | À quelle fréquence consultez-vous vos placements ? |
| `audit.risk.option.check_frequency.multiple-daily` | Multiple times a day | Plusieurs fois par jour |
| `audit.risk.option.check_frequency.daily` | Daily | Chaque jour |
| `audit.risk.option.check_frequency.weekly` | Weekly | Chaque semaine |
| `audit.risk.option.check_frequency.monthly` | Monthly | Chaque mois |
| `audit.risk.option.check_frequency.quarterly` | Quarterly or less | Chaque trimestre ou moins souvent |

**Have you ever made a financial decision you regretted due to panic?**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.panic_decisions.label` | Have you ever made a financial decision you regretted due to panic? | Avez-vous déjà pris, sous le coup de la panique, une décision financière que vous avez regrettée ? |
| `audit.risk.option.panic_decisions.yes-multiple` | Yes, multiple times | Oui, plusieurs fois |
| `audit.risk.option.panic_decisions.yes-once` | Yes, once | Oui, une fois |
| `audit.risk.option.panic_decisions.almost` | Almost, but caught myself | Presque, mais j’ai su m’arrêter à temps |
| `audit.risk.option.panic_decisions.no` | No, never | Non, jamais |

**Comfort with using leverage (debt) for investments**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.leverage_comfort.label` | Comfort with using leverage (debt) for investments | Aisance avec l’effet de levier (dette) pour investir |
| `audit.risk.option.leverage_comfort.no-debt` | No debt ever - cash only | Aucune dette : comptant seulement |
| `audit.risk.option.leverage_comfort.minimal` | Minimal leverage (under 50% LTV) | Levier minimal (ratio prêt-valeur, ou LTV, inférieur à 50 %) |
| `audit.risk.option.leverage_comfort.moderate` | Moderate leverage (50-75% LTV) | Levier modéré (LTV de 50 % à 75 %) |
| `audit.risk.option.leverage_comfort.aggressive` | Aggressive leverage (75-90% LTV) | Levier élevé (LTV de 75 % à 90 %) |
| `audit.risk.option.leverage_comfort.maximum` | Maximum leverage available | Levier maximal disponible |

**Maximum percentage of net worth in a single deal**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.single_deal_risk.label` | Maximum percentage of net worth in a single deal | Part maximale de votre patrimoine net dans une seule transaction |
| `audit.risk.option.single_deal_risk.under-10` | Under 10% | Moins de 10 % |
| `audit.risk.option.single_deal_risk.10-25` | 10-25% | 10 % à 25 % |
| `audit.risk.option.single_deal_risk.25-50` | 25-50% | 25 % à 50 % |
| `audit.risk.option.single_deal_risk.50-75` | 50-75% | 50 % à 75 % |
| `audit.risk.option.single_deal_risk.over-75` | Over 75% (all-in) | Plus de 75 % (tout miser) |

**Comfort investing out of state**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.out_of_state.label` | Comfort investing out of state | Aisance à investir hors de votre État ou de votre région |
| `audit.risk.option.out_of_state.no` | No - local only | Non : local seulement |
| `audit.risk.option.out_of_state.maybe` | Maybe - with the right team | Peut-être : avec la bonne équipe |
| `audit.risk.option.out_of_state.yes` | Yes - open to it | Oui : sans problème |
| `audit.risk.option.out_of_state.prefer` | Prefer out-of-state markets | Je préfère les marchés hors de ma région |

**Comfort working with investment partners**

| Key | English | French |
|-----|---------|--------|
| `audit.risk.field.partners.label` | Comfort working with investment partners | Aisance à travailler avec des partenaires d’investissement |
| `audit.risk.option.partners.solo-only` | Solo only | En solo seulement |
| `audit.risk.option.partners.family-only` | Family / close friends only | Famille et amis proches seulement |
| `audit.risk.option.partners.open` | Open to partners with aligned goals | Oui, avec des partenaires qui partagent mes objectifs |
| `audit.risk.option.partners.prefer` | Prefer partnerships | Je préfère les partenariats |

## 6. Horizon & Goals / Horizon et objectifs

**Sections**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.section.objectives` | Primary Objectives | Objectifs principaux |
| `audit.horizon.section.financial_targets` | Financial Targets | Cibles financières |
| `audit.horizon.section.timeline` | Timeline | Calendrier |
| `audit.horizon.section.lifestyle` | Lifestyle Preferences | Préférences de style de vie |
| `audit.horizon.section.constraints` | Constraints | Contraintes |

**What is your #1 reason for investing in real estate?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.primary_objective.label` | What is your #1 reason for investing in real estate? | Quelle est votre première raison d’investir en immobilier ? |
| `audit.horizon.option.primary_objective.cash-flow` | Monthly cash flow / passive income | Cash-flow mensuel / revenu passif |
| `audit.horizon.option.primary_objective.appreciation` | Long-term appreciation / wealth building | Plus-value à long terme / constitution d’un patrimoine |
| `audit.horizon.option.primary_objective.tax-benefits` | Tax benefits and deductions | Avantages fiscaux et déductions |
| `audit.horizon.option.primary_objective.retirement` | Retirement income replacement | Revenu de remplacement à la retraite |
| `audit.horizon.option.primary_objective.financial-freedom` | Financial freedom / quit day job | Liberté financière / quitter mon emploi |
| `audit.horizon.option.primary_objective.legacy` | Build a legacy / generational wealth | Bâtir un patrimoine familial à transmettre |
| `audit.horizon.option.primary_objective.diversification` | Portfolio diversification | Diversification du portefeuille |

**What is your secondary goal?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.secondary_objective.label` | What is your secondary goal? | Quel est votre objectif secondaire ? |
| `audit.horizon.option.secondary_objective.cash-flow` | Monthly cash flow / passive income | Cash-flow mensuel / revenu passif |
| `audit.horizon.option.secondary_objective.appreciation` | Long-term appreciation / wealth building | Plus-value à long terme / constitution d’un patrimoine |
| `audit.horizon.option.secondary_objective.tax-benefits` | Tax benefits and deductions | Avantages fiscaux et déductions |
| `audit.horizon.option.secondary_objective.retirement` | Retirement income replacement | Revenu de remplacement à la retraite |
| `audit.horizon.option.secondary_objective.financial-freedom` | Financial freedom / quit day job | Liberté financière / quitter mon emploi |
| `audit.horizon.option.secondary_objective.legacy` | Build a legacy / generational wealth | Bâtir un patrimoine familial à transmettre |
| `audit.horizon.option.secondary_objective.diversification` | Portfolio diversification | Diversification du portefeuille |

**Monthly passive income goal from RE**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.passive_income_goal.label` | Monthly passive income goal from RE | Objectif de revenu passif mensuel tiré de l’immobilier |
| `audit.horizon.option.passive_income_goal.under-1000` | Under $1,000/month | Moins de 1 000 $ US par mois |
| `audit.horizon.option.passive_income_goal.1000-3000` | $1,000 - $3,000/month | 1 000 $ à 3 000 $ US par mois |
| `audit.horizon.option.passive_income_goal.3000-5000` | $3,000 - $5,000/month | 3 000 $ à 5 000 $ US par mois |
| `audit.horizon.option.passive_income_goal.5000-10000` | $5,000 - $10,000/month | 5 000 $ à 10 000 $ US par mois |
| `audit.horizon.option.passive_income_goal.10000-25000` | $10,000 - $25,000/month | 10 000 $ à 25 000 $ US par mois |
| `audit.horizon.option.passive_income_goal.over-25000` | Over $25,000/month | Plus de 25 000 $ US par mois |

**Net worth goal from RE (total equity)**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.net_worth_goal.label` | Net worth goal from RE (total equity) | Objectif de patrimoine net tiré de l’immobilier (valeur nette totale) |
| `audit.horizon.option.net_worth_goal.under-250000` | Under $250,000 | Moins de 250 000 $ US |
| `audit.horizon.option.net_worth_goal.250000-500000` | $250,000 - $500,000 | 250 000 $ à 500 000 $ US |
| `audit.horizon.option.net_worth_goal.500000-1m` | $500,000 - $1M | 500 000 $ à 1 million $ US |
| `audit.horizon.option.net_worth_goal.1m-5m` | $1M - $5M | 1 à 5 millions $ US |
| `audit.horizon.option.net_worth_goal.over-5m` | Over $5M | Plus de 5 millions $ US |

**Target number of properties**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.property_count_goal.label` | Target number of properties | Nombre de biens visé |
| `audit.horizon.option.property_count_goal.1` | 1 property | 1 bien |
| `audit.horizon.option.property_count_goal.2-5` | 2-5 properties | 2 à 5 biens |
| `audit.horizon.option.property_count_goal.5-10` | 5-10 properties | 5 à 10 biens |
| `audit.horizon.option.property_count_goal.10-25` | 10-25 properties | 10 à 25 biens |
| `audit.horizon.option.property_count_goal.over-25` | Over 25 properties | Plus de 25 biens |
| `audit.horizon.option.property_count_goal.no-specific` | No specific target | Pas de cible précise |

**Expected annual return on investment**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.return_expectations.label` | Expected annual return on investment | Rendement annuel attendu sur l’investissement |
| `audit.horizon.option.return_expectations.under-5` | Under 5% (conservative) | Moins de 5 % (prudent) |
| `audit.horizon.option.return_expectations.5-8` | 5-8% (moderate) | 5 % à 8 % (modéré) |
| `audit.horizon.option.return_expectations.8-12` | 8-12% (above average) | 8 % à 12 % (supérieur à la moyenne) |
| `audit.horizon.option.return_expectations.12-20` | 12-20% (aggressive) | 12 % à 20 % (dynamique) |
| `audit.horizon.option.return_expectations.over-20` | Over 20% (very aggressive) | Plus de 20 % (très dynamique) |

**When do you want to close your first (or next) deal?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.first_deal_timeline.label` | When do you want to close your first (or next) deal? | Quand voulez-vous conclure votre première (ou prochaine) transaction ? |
| `audit.horizon.option.first_deal_timeline.under-3-months` | Within 3 months | D’ici 3 mois |
| `audit.horizon.option.first_deal_timeline.3-6-months` | 3-6 months | 3 à 6 mois |
| `audit.horizon.option.first_deal_timeline.6-12-months` | 6-12 months | 6 à 12 mois |
| `audit.horizon.option.first_deal_timeline.1-2-years` | 1-2 years | 1 à 2 ans |
| `audit.horizon.option.first_deal_timeline.over-2-years` | Over 2 years | Plus de 2 ans |

**Timeline to financial freedom through RE**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.financial_freedom_timeline.label` | Timeline to financial freedom through RE | Délai pour atteindre la liberté financière grâce à l’immobilier |
| `audit.horizon.option.financial_freedom_timeline.under-3-years` | Under 3 years | Moins de 3 ans |
| `audit.horizon.option.financial_freedom_timeline.3-5-years` | 3-5 years | 3 à 5 ans |
| `audit.horizon.option.financial_freedom_timeline.5-10-years` | 5-10 years | 5 à 10 ans |
| `audit.horizon.option.financial_freedom_timeline.10-20-years` | 10-20 years | 10 à 20 ans |
| `audit.horizon.option.financial_freedom_timeline.over-20-years` | Over 20 years | Plus de 20 ans |
| `audit.horizon.option.financial_freedom_timeline.not-a-goal` | Not a specific goal | Ce n’est pas un objectif précis |

**Planned retirement age**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.retirement_timeline.label` | Planned retirement age | Âge prévu de la retraite |
| `audit.horizon.option.retirement_timeline.under-40` | Before 40 | Avant 40 ans |
| `audit.horizon.option.retirement_timeline.40-50` | 40-50 | 40 à 50 ans |
| `audit.horizon.option.retirement_timeline.50-60` | 50-60 | 50 à 60 ans |
| `audit.horizon.option.retirement_timeline.60-65` | 60-65 | 60 à 65 ans |
| `audit.horizon.option.retirement_timeline.over-65` | 65+ | 65 ans et plus |
| `audit.horizon.option.retirement_timeline.no-plan` | No specific plan | Pas de plan précis |

**Long-term exit strategy preference**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.exit_strategy.label` | Long-term exit strategy preference | Stratégie de sortie préférée à long terme |
| `audit.horizon.option.exit_strategy.hold-forever` | Hold forever - pass to heirs | Conserver indéfiniment : transmettre aux héritiers |
| `audit.horizon.option.exit_strategy.sell-at-peak` | Sell at market peak | Vendre au sommet du marché |
| `audit.horizon.option.exit_strategy.1031-exchange` | 1031 exchange into larger properties | Échange 1031 vers des biens plus importants (report d’impôt aux États-Unis) |
| `audit.horizon.option.exit_strategy.sell-at-retirement` | Sell at retirement for lump sum | Vendre à la retraite pour toucher un capital |
| `audit.horizon.option.exit_strategy.no-plan` | Haven't thought about it yet | Je n’y ai pas encore réfléchi |

**Willing to relocate for a better RE market?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.relocation_willingness.label` | Willing to relocate for a better RE market? | Envisagez-vous de déménager pour un meilleur marché immobilier ? |
| `audit.horizon.option.relocation_willingness.no` | No - staying where I am | Non : je reste où je suis |
| `audit.horizon.option.relocation_willingness.maybe` | Maybe - for the right opportunity | Peut-être : pour la bonne occasion |
| `audit.horizon.option.relocation_willingness.yes` | Yes - open to relocating | Oui : c’est envisageable |
| `audit.horizon.option.relocation_willingness.already-flexible` | Already location-flexible | Mon lieu de vie est déjà flexible |

**Open to house hacking (living in your investment)?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.house_hacking.label` | Open to house hacking (living in your investment)? | Le house hacking (habiter une partie de votre bien locatif) vous intéresse-t-il ? |
| `audit.horizon.option.house_hacking.yes` | Yes - great way to start | Oui : excellente façon de commencer |
| `audit.horizon.option.house_hacking.maybe` | Maybe - depends on the property | Peut-être : selon le bien |
| `audit.horizon.option.house_hacking.no` | No - want separate investments | Non : je veux des investissements séparés de mon logement |
| `audit.horizon.option.house_hacking.already-doing` | Already doing this | Je le fais déjà |

**Goal to transition to full-time RE?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.full_time_re.label` | Goal to transition to full-time RE? | Souhaitez-vous faire de l’immobilier votre activité à temps plein ? |
| `audit.horizon.option.full_time_re.yes-soon` | Yes - as soon as possible | Oui : dès que possible |
| `audit.horizon.option.full_time_re.yes-eventually` | Yes - eventually | Oui : à terme |
| `audit.horizon.option.full_time_re.no` | No - keep it as a side investment | Non : cela reste un investissement d’appoint |
| `audit.horizon.option.full_time_re.undecided` | Undecided | Je n’ai pas décidé |

**Is your family/partner aligned with your RE goals?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.family_alignment.label` | Is your family/partner aligned with your RE goals? | Votre entourage (famille, conjoint ou conjointe) adhère-t-il à vos objectifs immobiliers ? |
| `audit.horizon.option.family_alignment.fully-aligned` | Fully aligned and supportive | Adhésion et soutien complets |
| `audit.horizon.option.family_alignment.mostly-supportive` | Mostly supportive | Plutôt favorable |
| `audit.horizon.option.family_alignment.neutral` | Neutral / indifferent | Neutre / indifférent |
| `audit.horizon.option.family_alignment.skeptical` | Skeptical but not opposed | Sceptique, sans s’y opposer |
| `audit.horizon.option.family_alignment.opposed` | Opposed | Opposé |
| `audit.horizon.option.family_alignment.not-applicable` | Not applicable (single) | Sans objet (célibataire) |

**Geographic preferences or constraints**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.geographic_constraints.label` | Geographic preferences or constraints | Préférences ou contraintes géographiques |
| `audit.horizon.option.geographic_constraints.local-only` | Local market only | Marché local seulement |
| `audit.horizon.option.geographic_constraints.state-only` | Within my state | Dans mon État (ou ma province, ma région) |
| `audit.horizon.option.geographic_constraints.regional` | Regional (neighboring states) | Régional (États ou régions voisins) |
| `audit.horizon.option.geographic_constraints.national` | Open to any US market | Tout marché aux États-Unis |

**Property type preference**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.property_type_preference.label` | Property type preference | Type de bien préféré |
| `audit.horizon.option.property_type_preference.single-family` | Single family homes | Maisons unifamiliales |
| `audit.horizon.option.property_type_preference.small-multi` | Small multi-family (2-4 units) | Petit multilogement (2 à 4 logements) |
| `audit.horizon.option.property_type_preference.large-multi` | Large multi-family (5+ units) | Grand multilogement (5 logements et plus) |
| `audit.horizon.option.property_type_preference.commercial` | Commercial properties | Immobilier commercial |
| `audit.horizon.option.property_type_preference.mixed-use` | Mixed-use | Usage mixte |
| `audit.horizon.option.property_type_preference.land` | Land / development | Terrain / promotion |
| `audit.horizon.option.property_type_preference.open` | Open to anything | Tous les types |

**Any ethical or personal constraints?**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.ethical_constraints.label` | Any ethical or personal constraints? | Avez-vous des contraintes éthiques ou personnelles ? |
| `audit.horizon.field.ethical_constraints.placeholder` | e.g., no Section 8, no evictions, eco-friendly only, specific neighborhoods to avoid... | p. ex. pas de logement subventionné (Section 8 aux États-Unis), pas d’expulsions, écologique seulement, certains quartiers à éviter... |

**Absolute deal-breakers**

| Key | English | French |
|-----|---------|--------|
| `audit.horizon.field.deal_breakers.label` | Absolute deal-breakers | Critères rédhibitoires |
| `audit.horizon.field.deal_breakers.placeholder` | e.g., no properties requiring structural work, no flood zones, no HOAs... | p. ex. pas de travaux de structure, pas de zone inondable, pas d’association de copropriétaires (HOA)... |

## 7. Other screens

**Dashboard**

| Key | English | French |
|-----|---------|--------|
| `dashboard.plan_generating` | Plan generating… | Plan en cours de génération… |
| `dashboard.view_paths` | View Paths | Voir les parcours |
| `dashboard.export_stale` | Your last export is out of date. | Votre dernier export n’est plus à jour. |
| `dashboard.take_action` | Take action → | Agir → |
| `dashboard.insight_type.progress` | progress | progression |
| `dashboard.insight_type.contradiction` | contradiction | contradiction |
| `dashboard.insight_type.score_change` | score change | évolution du score |
| `dashboard.insight_type.milestone` | milestone | jalon |
| `dashboard.insight_type.network_alert` | network alert | alerte réseau |

**Identity: sub-scores and radar axes**

| Key | English | French |
|-----|---------|--------|
| `identity.sub_score.financial` | Financial | Finances |
| `identity.sub_score.time` | Time | Temps |
| `identity.sub_score.skills` | Skills | Compétences |
| `identity.sub_score.risk` | Risk | Risque |
| `identity.sub_score.horizon` | Horizon | Horizon |
| `identity.axis.capital` | Capital | Capital |
| `identity.axis.time` | Time | Temps |
| `identity.axis.skills` | Skills | Compétences |
| `identity.axis.risk_tolerance` | Risk | Risque |
| `identity.axis.network` | Network | Réseau |
| `identity.axis.goal_clarity` | Goals | Objectifs |
| `identity.radar_empty` | No data available | Aucune donnée disponible |

**Simulation**

| Key | English | French |
|-----|---------|--------|
| `simulation.strategy_changes` | Strategies: {{changes}} | Stratégies : {{changes}} |
| `simulation.variable.financial` | Financial readiness | Préparation financière |
| `simulation.variable.time` | Time availability | Disponibilité en temps |
| `simulation.variable.skills` | Skills & experience | Compétences et expérience |
| `simulation.variable.risk` | Risk profile | Profil de risque |
| `simulation.variable.horizon` | Goal horizon | Horizon des objectifs |
| `simulation.variable.capital` | Capital | Capital |
| `simulation.variable.network` | Network | Réseau |

**Growth strategy and growth paths**

| Key | English | French |
|-----|---------|--------|
| `growth.path.locked` | Locked | Verrouillé |
| `growth.path.generating_short` | Generating… | Génération… |
| `growth.path.aria.coming_soon` | {{name}} - Coming Soon | {{name}} : bientôt disponible |
| `growth.path.aria.progress` | {{name}} - {{progress}}% complete | {{name}} : complété à {{progress}} % |
| `growth.path.aria.generating` | {{name}} - Generating | {{name}} : génération en cours |
| `growth.path.aria.ready` | {{name}} - Ready to generate | {{name}} : prêt à générer |
| `growth.path.aria.locked` | {{name}} - Locked | {{name}} : verrouillé |
| `growth.link_type.prerequisite` | prerequisite | prérequis |
| `growth.link_type.enabling` | enabling | levier |
| `growth.link_type.constraint` | constraint | contrainte |
| `growth.link_type.conflict` | conflict | conflit |
| `growth.unlock.criteria_fallback` | completing earlier paths | avoir complété les parcours précédents |
| `growth_content.reinvestment_strategy` | Reinvestment strategy | Stratégie de réinvestissement |
| `growth_content.diversification_plan` | Diversification plan | Plan de diversification |
| `growth_content.exit_framework` | Exit framework | Cadre de sortie |
| `growth_content.financing_evolution` | Financing evolution | Évolution du financement |
| `growth_content.tool_placeholders` | Tool placeholders | Outils à venir |
| `growth_content.capital_acceleration_plan` | Capital acceleration plan | Plan d’accélération du capital |
| `growth_content.income_growth_roadmap` | Income growth roadmap | Feuille de route de croissance des revenus |
| `growth_content.funding_channel_map` | Funding channel map | Carte des sources de financement |
| `growth_content.professional_transition_plan` | Professional transition plan | Plan de transition professionnelle |
| `growth_content.capital_milestone_targets` | Capital milestone targets | Jalons de capital visés |
| `growth_content.skill_gap_analysis` | Skill gap analysis | Analyse des lacunes de compétences |
| `growth_content.learning_roadmap` | Learning roadmap | Feuille de route d’apprentissage |
| `growth_content.resource_recommendations` | Resource recommendations | Ressources recommandées |
| `growth_content.network_building_plan` | Network building plan | Plan de développement du réseau |
| `growth_content.certification_roadmap` | Certification roadmap | Feuille de route de certification |
| `growth_content.mentorship_strategy` | Mentorship strategy | Stratégie de mentorat |
| `growth_content.time_recapture_plan` | Time recapture plan | Plan de récupération du temps |
| `growth_content.delegation_roadmap` | Delegation roadmap | Feuille de route de délégation |
| `growth_content.systems_and_tools_plan` | Systems and tools plan | Plan de systèmes et d’outils |
| `growth_content.active_to_passive_transition` | Active to passive transition | Transition de l’actif vers le passif |
| `growth_content.burnout_prevention` | Burnout prevention | Prévention de l’épuisement |
| `growth_content.title` | Title | Titre |
| `growth_content.description` | Description | Description |

**Errors composed in the browser, export and blueprint**

| Key | English | French |
|-----|---------|--------|
| `error.session_expired` | Session expired | Session expirée |
| `error.timeout` | This is taking longer than expected. Please try again. | L’opération prend plus de temps que prévu. Veuillez réessayer. |
| `error.unexpected_response` | Server returned an unexpected response ({{status}}) | Le serveur a renvoyé une réponse inattendue ({{status}}) |
| `export.error.failed_status` | Export failed ({{status}}) | Échec de l’export ({{status}}) |
| `blueprint.error_status` | Failed to generate blueprint ({{status}}) | Échec de la génération du blueprint ({{status}}) |

**Short labels**

| Key | English | French |
|-----|---------|--------|
| `common.minutes_approx` | ~{{count}} min | ~{{count}} min |
| `common.version_short` | v{{version}} | v{{version}} |
| `landing.built_initial` | L | L |

## 8. Server messages

From `backend/src/shared/i18n.ts`. These reach the screen as error banners, rate-limit messages, unlock criteria, cooldowns and the first dashboard insight. The English column is what the API returned before this sprint, unchanged except for the two cooldown messages (a duration instead of a clock time).

**error**

| Key | English | French |
|-----|---------|--------|
| `error.internal` | An unexpected error occurred. | Une erreur inattendue est survenue. |

**rate_limit**

| Key | English | French |
|-----|---------|--------|
| `rate_limit.general` | Too many requests. Please try again later. | Trop de requêtes. Veuillez réessayer plus tard. |
| `rate_limit.login` | Too many login attempts. Please try again later. | Trop de tentatives de connexion. Veuillez réessayer plus tard. |
| `rate_limit.forgot_password` | Too many password reset requests. Please try again later. | Trop de demandes de réinitialisation du mot de passe. Veuillez réessayer plus tard. |
| `rate_limit.reset_password` | Too many password reset attempts. Please try again later. | Trop de tentatives de réinitialisation du mot de passe. Veuillez réessayer plus tard. |
| `rate_limit.synthesis` | Too many synthesis requests. Please try again later. | Trop de demandes de synthèse. Veuillez réessayer plus tard. |
| `rate_limit.strategy` | Too many strategy generation requests. Please try again later. | Trop de demandes de génération de stratégies. Veuillez réessayer plus tard. |
| `rate_limit.blueprint` | Too many blueprint requests. Please try again later. | Trop de demandes de blueprint. Veuillez réessayer plus tard. |

**validation**

| Key | English | French |
|-----|---------|--------|
| `validation.locale_invalid` | Invalid language. | Langue non valide. |
| `validation.locale_options` | Must be one of: {{locales}}. | Doit être l’une des valeurs suivantes : {{locales}}. |

**auth**

| Key | English | French |
|-----|---------|--------|
| `auth.required` | Authentication required. | Authentification requise. |
| `auth.token_payload_invalid` | Invalid token payload. | Session non valide. |
| `auth.token_invalidated` | Token has been invalidated. Please log in again. | Votre session n’est plus valide. Veuillez vous reconnecter. |
| `auth.token_invalid` | Invalid or expired token. | Session non valide ou expirée. |
| `auth.user_not_found` | User not found. | Utilisateur introuvable. |
| `auth.email_invalid` | Invalid email format. | Format de courriel non valide. |
| `auth.email_invalid_detail` | Must be a valid email address. | Doit être une adresse courriel valide. |
| `auth.password_too_short` | Password too short. | Mot de passe trop court. |
| `auth.password_min_detail` | Must be at least {{min}} characters. | Doit contenir au moins {{min}} caractères. |
| `auth.password_too_long` | Password too long. | Mot de passe trop long. |
| `auth.password_max_detail` | Must be at most {{max}} characters. | Doit contenir au plus {{max}} caractères. |
| `auth.reset_token_required` | Reset token is required. | Le lien de réinitialisation est incomplet. |
| `auth.reset_token_invalid` | Invalid or expired reset token. | Lien de réinitialisation non valide ou expiré. |
| `auth.email_taken` | Email already registered. | Ce courriel est déjà associé à un compte. |
| `auth.invalid_credentials` | Invalid email or password. | Courriel ou mot de passe incorrect. |
| `auth.forgot_password_sent` | If an account exists, a reset email has been sent. | Si un compte existe, un courriel de réinitialisation a été envoyé. |
| `auth.password_reset_done` | Password has been reset. | Le mot de passe a été réinitialisé. |

**audit**

| Key | English | French |
|-----|---------|--------|
| `audit.sections_incomplete` | All required sections must have at least one field completed. | Chaque section obligatoire doit contenir au moins une réponse. |
| `audit.type.financial` | financial | finances |
| `audit.type.time` | time | temps |
| `audit.type.skills` | skills | compétences |
| `audit.type.risk` | risk | risque |
| `audit.type.horizon` | horizon | horizon |

**identity**

| Key | English | French |
|-----|---------|--------|
| `identity.not_found` | No identity found. Complete your audits first. | Aucune identité trouvée. Complétez d’abord vos audits. |
| `identity.audit_required` | At least one audit must be completed before identity synthesis. | Au moins un audit doit être complété avant la synthèse de l’identité. |
| `identity.rating_range` | Rating must be an integer between 1 and 5. | La note doit être un nombre entier de 1 à 5. |
| `identity.feedback_too_long` | Feedback must be at most 2000 characters. | Le commentaire ne doit pas dépasser 2 000 caractères. |
| `identity.version_not_found` | Identity version not found. | Version d’identité introuvable. |

**strategy**

| Key | English | French |
|-----|---------|--------|
| `strategy.identity_required` | Identity must be synthesized before generating strategies. | L’identité doit être synthétisée avant de générer des stratégies. |
| `strategy.ai_wrong_count` | AI did not return exactly 3 strategies. Please try again. | L’IA n’a pas renvoyé exactement 3 stratégies. Veuillez réessayer. |
| `strategy.not_found` | Strategy not found. | Stratégie introuvable. |
| `strategy.forbidden` | You do not have access to this strategy. | Vous n’avez pas accès à cette stratégie. |
| `strategy.action_item_not_found` | action-item not found. | Élément d’action introuvable. |
| `strategy.milestone_not_found` | milestone not found. | Jalon introuvable. |
| `strategy.micro_task_not_found` | micro-task not found. | Micro-tâche introuvable. |

**simulation**

| Key | English | French |
|-----|---------|--------|
| `simulation.daily_limit` | Maximum {{max}} simulations per 24 hours. Please try again later. | Maximum de {{max}} simulations par période de 24 heures. Veuillez réessayer plus tard. |
| `simulation.identity_required` | No identity profile found. Complete all 5 audits and synthesize your identity first. | Aucun profil d’identité trouvé. Complétez d’abord les 5 audits et synthétisez votre identité. |
| `simulation.config_identity_required` | No identity profile found. Complete your audits first. | Aucun profil d’identité trouvé. Complétez d’abord vos audits. |
| `simulation.job_not_found` | Simulation not found. Please run it again. | Simulation introuvable. Veuillez la relancer. |

**blueprint**

| Key | English | French |
|-----|---------|--------|
| `blueprint.audits_required` | All 5 audits must be completed before generating a blueprint. Missing: {{missing}}. | Les 5 audits doivent être complétés avant de générer un blueprint. Il manque : {{missing}}. |
| `blueprint.identity_required` | No identity profile found. Synthesize your identity before generating a blueprint. | Aucun profil d’identité trouvé. Synthétisez votre identité avant de générer un blueprint. |

**contact**

| Key | English | French |
|-----|---------|--------|
| `contact.not_found` | Contact not found. | Contact introuvable. |
| `contact.name_required` | name is required. | Le nom est obligatoire. |

**task**

| Key | English | French |
|-----|---------|--------|
| `task.not_found` | Task not found. | Tâche introuvable. |
| `task.title_required` | title is required. | Le titre est obligatoire. |

**ai**

| Key | English | French |
|-----|---------|--------|
| `ai.unavailable` | We couldn't process your request right now. Please try again. | Nous n’avons pas pu traiter votre demande pour le moment. Veuillez réessayer. |
| `ai.parse_failed` | Failed to parse AI response as JSON. Please try again. | La réponse de l’IA n’a pas pu être lue. Veuillez réessayer. |

**path**

| Key | English | French |
|-----|---------|--------|
| `path.portfolio` | Portfolio Growth | Croissance du portefeuille |
| `path.income_capital` | Income & Capital | Revenus et capital |
| `path.skills_knowledge` | Skills & Knowledge | Compétences et connaissances |
| `path.time_operations` | Time & Operations | Temps et opérations |

**growth**

| Key | English | French |
|-----|---------|--------|
| `growth.identity_required` | Complete your investor identity before creating a growth strategy. | Complétez votre identité d’investisseur avant de créer une stratégie de croissance. |
| `growth.already_exists` | Active growth strategy already exists. | Une stratégie de croissance active existe déjà. |
| `growth.not_found` | No growth strategy found. | Aucune stratégie de croissance trouvée. |
| `growth.not_found_identity_first` | No growth strategy found. Complete your investor identity first. | Aucune stratégie de croissance trouvée. Complétez d’abord votre identité d’investisseur. |
| `growth.no_active_strategy` | No active growth strategy found. | Aucune stratégie de croissance active. |
| `growth.path_not_found` | Growth path not found. | Parcours de croissance introuvable. |
| `growth.path_not_generated` | Growth path not found or not yet generated. | Parcours de croissance introuvable ou pas encore généré. |
| `growth.path_already_generating` | This path is already being generated. | Ce parcours est déjà en cours de génération. |
| `growth.path_must_be_generated` | Path must be generated before it can be regenerated. | Le parcours doit être généré avant de pouvoir être régénéré. |
| `growth.coming_soon_generate` | {{path}} is coming soon and not yet available for generation. | {{path}} : bientôt disponible. Ce parcours ne peut pas encore être généré. |
| `growth.coming_soon_regenerate` | {{path}} is coming soon and cannot be regenerated. | {{path}} : bientôt disponible. Ce parcours ne peut pas être régénéré. |
| `growth.generation_unavailable` | Generation service temporarily unavailable. Please try again. | Le service de génération est temporairement indisponible. Veuillez réessayer. |
| `growth.unlock_criteria.income_capital` | Complete 2+ micro-plan tasks from Portfolio Growth | Compléter au moins 2 tâches du micro-plan de Croissance du portefeuille |
| `growth.unlock_criteria.coming_soon` | Coming soon — this path will be available in a future update | Bientôt disponible : ce parcours arrivera dans une prochaine mise à jour |
| `growth.unlock_criteria.default` | meeting unlock criteria | Remplir les critères de déblocage |
| `growth.early_unlock` | This path is most valuable after {{criteria}}. Set confirm_early_unlock to true to generate now. | Ce parcours est plus utile après l’étape suivante : {{criteria}}. Confirmez le déblocage anticipé pour le générer maintenant. |
| `growth.cooldown_generate` | This path was recently generated. Try again in {{minutes}} min. | Ce parcours vient d’être généré. Réessayez dans {{minutes}} min. |
| `growth.cooldown_regenerate` | Regeneration available in {{minutes}} min. | Régénération possible dans {{minutes}} min. |
| `growth.unlocked` | You've unlocked {{path}}! | Vous avez débloqué {{path}} ! |
| `growth.staleness.identity_updated` | Identity updated (v{{from}} → v{{to}}) | Identité mise à jour (v{{from}} → v{{to}}) |
| `growth.staleness.path_regenerated` | {{path}} path regenerated (v{{from}} → v{{to}}) | {{path}} : parcours régénéré (v{{from}} → v{{to}}) |

**export**

| Key | English | French |
|-----|---------|--------|
| `export.identity_required` | Complete your investor identity before exporting. | Complétez votre identité d’investisseur avant d’exporter. |
| `export.consent_required` | Export consent is required. This export may include sensitive financial data. | Votre consentement est requis pour exporter. Cet export peut contenir des données financières sensibles. |
| `export.staleness.identity_updated` | Identity updated (v{{from}} -> v{{to}}) | Identité mise à jour (v{{from}} → v{{to}}) |
| `export.staleness.path_regenerated` | {{path}} regenerated (v{{from}} -> v{{to}}) | {{path}} : parcours régénéré (v{{from}} → v{{to}}) |

**insight**

| Key | English | French |
|-----|---------|--------|
| `insight.get_started.title` | Get Started | Pour commencer |
| `insight.get_started.message` | Complete all 5 audits to unlock your investor identity and personalized insights. | Complétez les 5 audits pour débloquer votre identité d’investisseur et des insights personnalisés. |

## 9. Existing French texts changed

Glossary alignment (one term per concept, FR-2.7). English is unchanged for these keys.

| Key | Before | Now |
|-----|--------|-----|
| `landing.step.strategy.description` | Trois stratégies classées par compatibilité. Activez-en une pour un plan d'action, une feuille de route datée et un micro-plan de 72 heures. | Trois stratégies classées par correspondance. Activez-en une pour un plan d’action, une feuille de route datée et un micro-plan de 72 heures. |
| `auth.login.email_label` | E-mail | Courriel |
| `auth.validation.invalid_email` | Veuillez entrer une adresse e-mail valide. | Veuillez entrer une adresse courriel valide. |
| `strategies.subtitle` | Stratégies d’investissement personnalisées classées par adéquation | Stratégies d’investissement personnalisées classées par correspondance |
| `contacts.form.email_label` | E-mail | Courriel |
| `contacts.form.email_placeholder` | email@exemple.com | courriel@exemple.com |
| `growth_path.complete` | % complété |  % complété |
| `growth_path.fit` | % adéquation |  % de correspondance |
| `growth_path.regeneration_after` | Regénération disponible après {{time}} | Régénération disponible après {{time}} |

Typography only (non-breaking spaces, typographic apostrophes; the words are unchanged): 31 texts.
