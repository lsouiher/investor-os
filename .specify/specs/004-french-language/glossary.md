# Glossary: French as a Full Second Language

**Feature:** 004-french-language
**Created:** 2026-10-01 (Sprint 2, T025)
**Status:** Draft, awaiting founder sign-off. Frozen in Sprint 5 (T078).
**Used by:** `frontend/locales/fr.json`, `backend/src/shared/i18n.ts`, and from Sprint 3 the AI directive in `backend/src/shared/ai/language.ts`.

One French term per product concept, used everywhere (FR-2.7). When a translation needs a word that is listed here, it uses the listed word. When a new concept appears, it is added here first.

---

## To confirm at sign-off

These are the choices that were open or inconsistent before this sprint. Each has a recommendation, already applied in the Sprint 2 drafts. Changing one later is a search-and-replace.

| # | Question | Recommendation | Alternative |
|---|----------|----------------|-------------|
| 1 | Investment Blueprint (left open in `spec.md`) | Keep **Blueprint** as a product name: « Blueprint d’investissement » in full, « le blueprint » in running text | « Plan directeur d’investissement » |
| 2 | The eight archetype names (drafts from `research.md` R8) | As listed under Archetypes below | See the notes in that table |
| 3 | Email: the interface mixed « e-mail » (labels) and « courriel » (password reset) | **courriel** everywhere: standard in Québec, official and understood in France | « e-mail » (more common in France, an anglicism in Québec) |
| 4 | Fit: the interface mixed « correspondance », « adéquation » and « compatibilité » | **correspondance** everywhere, as in the `spec.md` glossary | « adéquation » |
| 5 | Credit score | **cote de crédit**, as on the landing page, with « score de crédit » as the explanation where the question is asked | « score de crédit » as the main term |
| 6 | Finishing an audit or a task | Keep **compléter / complété** (already used on about 15 screens). The last button of an audit reads « Terminer l’audit » | « terminer / terminé » everywhere (more natural in France) |
| 7 | Insight | Keep **insight** (already in the interface; used as-is in French business language) | « constat », « analyse » |
| 8 | Net worth and equity | **patrimoine net** (net worth) and **valeur nette immobilière** (real estate equity) | « valeur nette » for both (Québec usage) |

---

## Rules

### Tone
- Formal « vous », never « tu ».
- Sentence case: only the first word and proper nouns take a capital (« Tableau de bord », « Stratégie de croissance »). Product names that are capitalized in English keep one capital in French (« Hub Identité », « Blueprint »).
- Short, direct sentences. No word-for-word calques (« Something went wrong » is « Une erreur est survenue », not « Quelque chose s’est mal passé »).
- One international French (spec Assumption 2). Where Québec and France use different words, the entry below picks the one understood in both, and says so. Market vocabulary arrives with Sprint 6.

### Typography
- Non-breaking space (U+00A0) before `:` `;` `?` `!` `%`, and inside guillemets: « Et si ».
- Guillemets « » for quotations, not "…".
- Typographic apostrophe ’ (U+2019), not '.
- Automatic check: `frontend/lib/i18n.test.ts` (T044).

### Numbers, amounts and durations
- Thousands separated by a non-breaking space, decimal comma: 25 000 ; 1 000,5.
- Sprints 1 to 5 keep US dollars, named explicitly (FR-2.3, research R13): **25 000 $ US**. Ranges: « 25 000 $ à 50 000 $ US ». Bounds: « Moins de 25 000 $ US », « Plus de 500 000 $ US ».
- Percentages: « 15 % à 22 % ».
- Ranges of numbers use « à », not a hyphen: « 2 à 5 ans », « 20 à 30 heures ».
- Hours: « heures » in full in sentences, « h » in compact labels (« 12 h restantes »).

### US-specific terms (FR-2.3)
A neutral French wording that a francophone outside the United States can answer, with the US term as an example in parentheses when it helps. What is stored does not change.

| English | French wording |
|---------|----------------|
| W-2 Employee (stable) | Salarié à revenu stable (W-2 aux États-Unis) |
| Contract / 1099 | Contractuel ou pigiste (1099 aux États-Unis) |
| Retirement Accounts (401k, IRA, etc.) | Comptes de retraite (401(k) ou IRA aux États-Unis, par exemple) |
| Credit Score Range | Cote de crédit (score de crédit, échelle américaine de 300 à 850) |
| Filing Status | Situation de déclaration fiscale |
| Married Filing Jointly / Separately | Marié(e), déclaration conjointe / déclarations séparées |
| Head of Household | Chef de famille (« Head of Household » aux États-Unis) |
| CPA or tax professional | comptable ou fiscaliste (CPA aux États-Unis) |
| out of state | hors de votre État ou de votre région |
| Within my state | Dans mon État (ou ma province, ma région) |
| Open to any US market | Tout marché aux États-Unis |
| 1031 exchange | Échange 1031 (report d’impôt aux États-Unis) |
| Section 8 | logement subventionné (Section 8 aux États-Unis) |
| HOA | association de copropriétaires (HOA) |
| LTV | ratio prêt-valeur (LTV) |

---

## Product concepts

| English | French | Notes |
|---------|--------|-------|
| Investor Identity | Identité investisseur | As a label or title. In a sentence: « votre identité d’investisseur » |
| Identity Hub | Hub Identité | |
| Identity Card | Carte d’identité | « carte d’identité investisseur » when the context needs it |
| Identity History | Historique d’identité | |
| Archetype | Archétype | Names below |
| Readiness, readiness score | Préparation, score de préparation | |
| Sub-score | Sous-score | |
| Audit | Audit | |
| Financial Audit | Audit financier | Short label on charts: « Finances » |
| Time Audit | Audit temps | Short label: « Temps » |
| Skills & Experience | Compétences et expérience | Short label: « Compétences » |
| Risk Profile | Profil de risque | Short label: « Risque » |
| Horizon & Goals | Horizon et objectifs | Short label: « Horizon » |
| Section (of an audit) | Section | |
| Synthesis, to synthesize | Synthèse, synthétiser | « Re-synthétiser » for the action that produces a new version |
| Strategy | Stratégie | |
| Fit, fit score | Correspondance | « 82 % de correspondance » |
| Top Match | Meilleure correspondance | |
| Pros / Cons | Avantages / Inconvénients | |
| To activate (a strategy) | Activer | |
| Action Plan | Plan d’action | |
| Action item | Élément d’action | « action » in short messages |
| Roadmap | Feuille de route | |
| Milestone | Jalon | |
| 72-Hour Micro-Plan | Micro-plan de 72 heures | |
| Micro-task | Micro-tâche | |
| What-If Simulation | Simulation « Et si » | |
| Growth Strategy | Stratégie de croissance | |
| Growth Path | Parcours de croissance | « parcours » alone once the context is set |
| Growth Score | Score de croissance | |
| Portfolio Growth (path) | Croissance du portefeuille | |
| Income & Capital (path) | Revenus et capital | |
| Skills & Knowledge (path) | Compétences et connaissances | |
| Time & Operations (path) | Temps et opérations | |
| Scaling Vision | Vision de croissance | |
| Cross-Path Connections | Connexions inter-parcours | |
| Next Best Action | Prochaine meilleure action | |
| To unlock / locked / unlocked | Débloquer / verrouillé / débloqué | |
| To generate / regenerate | Générer / régénérer | « Génération… » for the waiting state |
| Coming Soon | Bientôt disponible | |
| Dashboard | Tableau de bord | |
| Intelligence Feed | Fil d’intelligence | |
| Insight | Insight | Sign-off item 7 |
| Tasks | Tâches | |
| Priority, impact (high, medium, low) | Priorité, impact (élevé, moyen, faible) | |
| Contacts | Contacts | |
| Network | Réseau | |
| Investment Blueprint | Blueprint | Sign-off item 1 |
| Export | Export | « exporter », « un export à jour » |
| Out of date (export) | Plus à jour | |
| Beta | Bêta | |
| Feedback | Commentaire | « Envoyer un commentaire » |
| Terms & privacy | Conditions et confidentialité | |
| Sign in / log in | Se connecter, connexion | |
| Log out | Déconnexion | |
| Account | Compte | |
| Email | Courriel | Sign-off item 3 |
| Password | Mot de passe | |
| Reset (password) | Réinitialiser, réinitialisation | |
| Session expired | Session expirée | |
| Required (field) | Obligatoire | « Ce champ est obligatoire » |
| Save | Enregistrer | « Enregistrement… » for the waiting state; « sauvegarde » for saved progress |
| Complete (audit, task) | Compléter, complété | Sign-off item 6 |
| Language switch | Passer en français / Switch to English | Each label is written in the language it names |

### Radar axes and score labels

| English | French |
|---------|--------|
| Capital | Capital |
| Time | Temps |
| Skills | Compétences |
| Risk | Risque |
| Network | Réseau |
| Goals | Objectifs |
| Financial / Horizon (sub-scores) | Finances / Horizon |

---

## Archetypes

The stored value is always the English name (research R8). French names are display names. They enter the interface in Sprint 3 (T058); they are listed here for sign-off (item 2).

| Identifier (stored) | French display name | Notes |
|---|---|---|
| Cash Flow Hunter | Chasseur de cash-flow | « cash-flow » is an accepted English term |
| Conservative Builder | Bâtisseur prudent | |
| Wealth Architect | Architecte de patrimoine | |
| Value-Add Operator | Opérateur à valeur ajoutée | Alternative: « Créateur de valeur » |
| House Hacker | Propriétaire-occupant investisseur | Alternative: keep « House hacker », an accepted English term |
| Passive Capital Partner | Partenaire financier passif | |
| Skilled Trades Investor | Investisseur de métier | Alternative: « Investisseur-artisan » |
| Portfolio Scaler | Bâtisseur de portefeuille | Shares « Bâtisseur » with Conservative Builder. Alternative: « Développeur de portefeuille » |

Names are masculine by default, as French job titles are in a list. Feminine forms are not generated in Sprints 1 to 5.

---

## Real estate and finance vocabulary

Used in the audits, and later by the AI. « QC » and « FR » mark the word each market would use on its own; the chosen term is understood in both.

### General

| English | French | Notes |
|---------|--------|-------|
| Real estate (RE) | Immobilier | « en immobilier », « investissement immobilier » |
| Investor | Investisseur | |
| Property | Bien | « bien immobilier » on first use; « propriété » is avoided (it also means ownership) |
| Rental property | Bien locatif | |
| Primary residence | Résidence principale | |
| Unit / door | Logement / porte | « porte » is kept on the landing page, as investor slang |
| Deal | Transaction | « occasion » for a deal being offered (« une excellente occasion ») |
| To close a deal | Conclure une transaction | |
| Market | Marché | |
| Holdings, portfolio | Portefeuille | |
| Cash flow | Cash-flow | Accepted English term (Assumption 7). Explained once as « revenu net mensuel » where there is room |
| Passive income | Revenu passif | |
| Appreciation | Plus-value | « plus-value à long terme » |
| Return (on investment) | Rendement | |
| Net worth | Patrimoine net | Sign-off item 8 |
| Equity (in a property) | Valeur nette immobilière | Explained as « valeur de vos biens moins les prêts » |
| Wealth | Patrimoine | |
| Generational wealth, legacy | Patrimoine familial à transmettre | |
| Financial freedom | Liberté financière | |
| Exit strategy | Stratégie de sortie | |
| Heirs | Héritiers | |
| Lump sum | Capital versé en une fois | |
| Self-employed | Travailleur indépendant | QC: « travailleur autonome » |
| Weekend | Week-end | « fin de semaine » is avoided: in France it means the end of the working week |
| Podcast | Podcast | QC: « balado » |

### Property types and strategies

| English | French | Notes |
|---------|--------|-------|
| Single-family home | Maison unifamiliale | As on the landing page. FR: « maison individuelle » |
| Multi-family | Immeuble multilogement | QC: « plex », « multilogement ». FR: « immeuble de rapport » |
| Small multi-family (2-4 units) | Petit multilogement (2 à 4 logements) | |
| Large multi-family (5+ units) | Grand multilogement (5 logements et plus) | |
| Commercial | Immobilier commercial | |
| Mixed-use | Usage mixte | |
| Land / development | Terrain, promotion | |
| Fix and flip | Achat-revente (flip) | |
| House hacking | House hacking | Accepted English term, explained as « habiter une partie de son bien locatif » |
| BRRRR | BRRRR | Accepted English term |
| Wholesaling | Wholesaling | Accepted English term |
| Turnkey | Clé en main | |
| Renovation, repair | Rénovation, réparation | |
| Structural work | Travaux de structure | |
| Flood zone | Zone inondable | |
| Vacancy, vacant | Inoccupation, inoccupé | |
| Rent | Loyer | |
| Eviction | Expulsion | |
| Property management | Gestion locative | |

### Financing, credit and tax

| English | French | Notes |
|---------|--------|-------|
| Income | Revenu, revenus | |
| Assets | Actifs | |
| Liabilities | Passifs | |
| Liquid cash | Liquidités | |
| Savings / checking | Épargne / compte courant | |
| Debt | Dette | |
| Monthly debt payments | Remboursements mensuels de dettes | |
| Mortgage | Prêt hypothécaire | QC: « hypothèque ». FR: « prêt immobilier » |
| Down payment | Mise de fonds | FR: « apport ». Not used in the audits |
| Student loan / auto loan | Prêt étudiant / prêt auto | |
| Credit card balance | Solde de carte de crédit | |
| Credit score | Cote de crédit | Sign-off item 5 |
| Credit history | Historique de crédit | |
| Hard inquiry | Demande de crédit | « demandes de crédit récentes » |
| Leverage | Effet de levier | |
| Reserves, emergency fund | Réserves, fonds d’urgence | |
| Insurance coverage | Couverture d’assurance | |
| Lender | Prêteur | |
| Tax | Impôt, fiscalité | « Fiscalité » as a section title |
| Effective tax rate | Taux d’imposition effectif | |
| Tax benefits and deductions | Avantages fiscaux et déductions | |
| Retirement | Retraite | |
| Stocks, bonds, crypto | Actions, obligations, cryptomonnaies | |
| Stock market | Bourse | |
| Dollar-cost averaging | Achats programmés | |
| Business equity | Parts dans une entreprise | |
| Dependents | Personnes à charge | |

### People

| English | French | Notes |
|---------|--------|-------|
| Real estate agent | Agent immobilier | QC: « courtier immobilier » |
| Contractor | Entrepreneur | « entrepreneur en rénovation » when ambiguous |
| Real estate attorney | Avocat en immobilier | In Québec and France a « notaire » handles most sales; the word arrives with the market in Sprint 6 |
| CPA | Comptable | |
| Property manager | Gestionnaire immobilier | |
| Mentor | Mentor | |
| Partner (investment) | Partenaire | « conjoint(e) » for a spouse or life partner |
| Seller | Vendeur | |
| Licensed professional | Professionnel agréé | |

---

## English terms that stay

Kept where francophone investors use them (Assumption 7), explained in French on first use where there is room: cash-flow, BRRRR, house hacking, wholesaling, flip, blueprint, insight, bêta (gallicized).

## Never translated

The brand name InvestorOS, BPCON, names of people, places and companies, and anything the user typed.
