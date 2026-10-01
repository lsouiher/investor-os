# Feature Specification: French as a Full Second Language

**Feature:** French as a complete second language, from the first page to the last PDF
**Created:** 2026-09-30
**Status:** Draft
**Short Name:** french-language
**Branch:** `004-french-language`
**Builds on:** `002-ui-personalization`, Feature B (French toggle, shipped in v0.3.2)

---

## Overview

InvestorOS builds an investor's context once (five audits synthesized into an identity) and uses it as the input for an AI that recommends strategies, surfaces insights and plans the next steps. That idea is not specific to English-speaking investors. This feature makes French a complete second language so the platform can be put in front of French-speaking investors in Québec and the rest of Canada, France and other francophone countries, and hold up from the landing page to the downloaded blueprint.

A first French pass shipped in v0.3.2: a language toggle and translated labels on most screens. It stops short of the parts that matter most. The five audits are English only, and everything the AI writes (identity, strategies, plans, insights) is English whatever the toggle says. This specification starts from an inventory of what exists and closes the gaps in six sprints. Each sprint ends in something a French-speaking user can see and test.

Sprints 1 to 5 deliver the French **language**. Sprint 6 is the first step toward French-speaking **markets** (country, currency, local context) and sits behind a decision gate.

---

## Clarifications

### Session 2026-10-01

- Q: Do Sprints 1 to 5 include country, currency and local market context? → A: No. They deliver the French language on the existing US-market content; market work stays in Sprint 6, behind its gate (Assumptions 3 and 9)
- Q: What happens to content generated before a language switch? → A: It stays as generated, is marked with its language, and the user can regenerate it; nothing is translated automatically (Assumption 4)
- Q: One French or regional variants? → A: One international French with formal "vous"; Canadian and France vocabulary differ only in Sprint 6, through the market (Assumption 2)

---

## Where French Stands Today (v0.4.1)

| Area | Today | Gap |
|------|-------|-----|
| Interface labels on most screens | 403 texts, all present in both languages, consistent formal "vous" | None. This is the base to build on |
| Language switch | Inside the app only, in the desktop sidebar | Absent from the landing page, sign-in, registration, password reset and terms: a visitor cannot choose French before signing in. Unreachable on phones, where the sidebar is hidden |
| First visit | Always English | The browser's language is ignored |
| Remembering the choice | In the browser only | Not saved on the account, so it is lost on another device, and the server never learns it |
| First paint | The page loads in English, then flips to French | Visible flash; the browser tab title, link previews and the page's declared language stay English |
| The five audits | English only | About 25 sections, 95 questions and 420 answer choices, plus buttons and validation messages. This is the 20-minute core of the product |
| Leftover English on translated screens | About 20 texts | Dashboard badges, simulation labels, chart axes, growth path headings, screen-reader labels |
| Dates, numbers, plurals | Follow the device, not the chosen language; no plural handling | English dates inside a French interface; "1 jours restants" |
| AI-generated content | English only (recorded as gap G14 in `docs/ai-pipeline.md`) | Identity, strategies, action plan, roadmap, micro-plan, simulations, insights, growth paths, cross-path analysis, export summary |
| Messages from the server | English only | About 100 error, validation and rate-limit messages, many displayed as-is (sign-in, registration, password reset, contacts, growth paths, export, blueprint) |
| Sentences composed by the system | English only | Unlock criteria, early-unlock and cooldown messages, "get started" insight, refresh suggestions, reasons an export is out of date |
| Password reset email | English only | |
| Investment Blueprint PDF | English only | |
| Growth strategy export | English only | |
| Beta terms and privacy page | English only (deliberate for the BPCON beta) | |
| Market assumptions | United States only | Dollar brackets, W-2 / 1099, 401(k) / IRA, US credit score ranges, US tax filing statuses, "out of state", 1031 exchange; AI scoring anchors in US dollars; no notion of the investor's country |
| Safeguards | None | No automatic check for missing or hard-coded text; the no-cost AI test mode answers in English only |

New text to produce: roughly 700 strings plus the terms page.

---

## Problem Statement

A French-speaking investor who opens InvestorOS today meets English at every step that matters. They cannot pick French before signing in. If they find the toggle after registering, the menus turn French but the audits (where they spend their first twenty minutes) do not, and the identity, strategies and plan they came for arrive in English. The email that resets their password, the PDF they would show a partner or a lender, and the terms they agree to are English too.

The result is a product that looks half-translated, which is worse than one that is plainly English: it signals that French speakers are an afterthought. It also blocks the founder from testing the idea with French-speaking users.

---

## Target Users

### Primary: French-speaking real estate investors
- Aspiring and active investors who read and think in French: Québec and francophone Canada, France, Belgium, Switzerland, francophone Africa
- Includes francophones who invest in US markets (the content of Sprints 1 to 5 fits them as-is)

### Secondary: bilingual users and existing English users
- Bilingual users who switch between languages and expect nothing to break
- Existing English-language beta users, for whom nothing must change

### Operator
- The founder, who needs to demo in French, review French copy and AI output, and see French usage in the beta funnel

---

## User Scenarios & Testing

### Scenario 1: A first session entirely in French (P1)
**Actor:** French-speaking investor opening a shared link, browser set to French
**Sprints:** 1, 2, 3
**Flow:**
1. Opens the landing page: it is in French immediately, with no flash of English
2. Registers: the account remembers French
3. Reaches the Identity Hub and completes the five audits, all in French
4. Sees the Identity Card: archetype name, headline and insights in French
5. Sees three strategies in French and activates one: action plan, roadmap and 72-hour micro-plan in French
6. Returns to the dashboard: insights in French

**Acceptance Criteria:**
- From the landing page to the activated strategy, no English sentence appears in the interface or in generated content (English industry terms that francophones use, such as "cash-flow", excepted)
- The five audits take under 20 minutes, as in English
- Sub-scores for a given set of answers are identical whichever language the audits were completed in

### Scenario 2: The language follows the account (P1)
**Actor:** Registered French-language user on a second device set to English
**Sprints:** 1
**Flow:**
1. Opens the sign-in page on the new device: English (browser language)
2. Signs in: the app is in French without any action
3. Switches to English while signed in
4. Returns to the first device: the app is now in English there too

**Acceptance Criteria:**
- The account's language applies on every device after sign-in
- A change made while signed in is saved to the account

### Scenario 3: Switching language mid-journey (P1)
**Actor:** Bilingual user who started in English
**Sprints:** 1, 2, 3
**Flow:**
1. Has two audits completed in English and one in progress; switches to French
2. All previous answers are intact; continues the audit in French
3. Completes the remaining audits: the identity is generated in French
4. A second user already has an English identity and switches to French: the interface is French; the identity and strategies stay in English, marked "generated in English", with an option to regenerate them in French
5. After regenerating: identity and strategies are in French; in the history, the English version and the French version show the same archetype under the same name

**Acceptance Criteria:**
- No answer is lost or altered by a language switch, including in a form being filled
- Content generated earlier is never silently changed
- Regeneration happens only when the user asks for it and explains its consequences first
- An archetype is recognized as the same archetype in both languages

### Scenario 4: English users are unaffected (P1)
**Actor:** Existing English-language beta user
**Sprints:** all
**Flow:**
1. Signs in after each sprint is released
2. Uses the product as before

**Acceptance Criteria:**
- The interface, generated content, emails and documents remain in English and behave as before
- The language switch, now present on signed-out pages and on phones, is the only visible addition

### Scenario 5: A French link opens in French (P2)
**Actor:** Visitor following a link from a French email, post or QR code, browser set to English
**Sprints:** 1, 5
**Flow:**
1. Follows the link: the landing page is in French
2. Navigates to registration: still French
3. The link pasted into a messaging app shows a French title and description

**Acceptance Criteria:**
- A link can open the site directly in French whatever the browser's language
- The choice persists on that device across pages and visits

### Scenario 6: Password reset in French (P2)
**Actor:** French-language user who forgot their password
**Sprints:** 4
**Flow:**
1. Requests a reset from the French forgot-password page
2. Receives an email with a French subject and body
3. Follows the link: the reset page is in French

**Acceptance Criteria:**
- The email is in the language the person was using when they asked for it
- Error cases (expired link, too many attempts) are explained in French

### Scenario 7: Documents in French (P2)
**Actor:** French-language user with a complete identity and an active strategy
**Sprints:** 4
**Flow:**
1. Downloads the Investment Blueprint PDF: titles, chart labels, strategies, insights and footer are in French
2. Exports the growth strategy: headings, statuses and summary are in French
3. Opens the terms and privacy page: it is available in French

**Acceptance Criteria:**
- Every label in the documents is in the user's language; accents render correctly
- The disclaimer "not financial, legal or tax advice" appears in French wherever it appears in English

### Scenario 8: An investor in Québec gets Canadian context (P3, gated)
**Actor:** French-speaking investor who invests in Canada
**Sprints:** 6
**Flow:**
1. States that their market is Canada
2. Answers financial questions in Canadian dollars, with Canadian account types and credit ranges
3. Receives strategies and a plan that refer to financing, tax and legal instruments that exist in Canada

**Acceptance Criteria:**
- No instrument that exists only in another market is presented as available
- Amounts are in the market's currency throughout

### Edge Cases
- **Browser set to a third language** (Spanish, for example): English
- **Browser prefers English and lists French second**: English; the first supported preference wins
- **Regional French** (fr-CA, fr-FR, fr-BE, fr-CH): French
- **A translation is missing**: the English text shows for that item; a raw identifier or a blank never does
- **Free text typed in French while the interface is English**, or the reverse: understood by the AI; never translated or altered
- **Generation fails in French**: the same friendly error and retry as in English, in French
- **The user switches language while something is being generated**: that item finishes in the language it started in and is marked like any other item in another language
- **Long French labels on a small phone**: they wrap; nothing is cut off or overlaps
- **Names of people, places and companies, and anything the user typed**: never translated
- **A document that mixes content generated in two languages**: still produced; labels follow the current language and the content stays as generated
- **Shared device**: a choice made while signed out affects signed-out pages on that device only; signing in applies the account's language

---

## Functional Requirements

### Sprint Overview

| Sprint | Outcome a user can see | Size | Depends on | Needs from the founder |
|--------|------------------------|------|------------|------------------------|
| 1. Foundation | French from the first page; the choice follows the account | M | — | Nothing |
| 2. French interface, complete | No English sentence in the interface, audits included | L | 1 | Review of the audit translations; glossary sign-off |
| 3. French AI | Identity, strategies, plans and insights written in French | L | 1 | Approval of real AI spend for verification; review of sample outputs |
| 4. French beyond the screen | Email, PDF, export and terms in French | M | 1, 3 | Review of the French terms |
| 5. Launch readiness | Reviewed, tested, discoverable, measurable | M | 2, 3, 4 | Reviewer time; staging walkthrough |
| 6. Market fit (gated) | Country, currency and local context | L | 1 to 5 | The gate decision; which market first |

Sizes are rough estimates for a solo builder working with Claude Code: S is one working session, M one to two days, L two to four days. Sprints 2 and 3 are independent of each other once Sprint 1 is done.

### Sprint 1: Foundation — "the platform knows my language"

**Goal:** A French-speaking visitor gets French from the first page, the choice follows the account, and the server knows it. This sprint adds little new French text; it makes every later sprint possible.

- **FR-1.1 Supported languages.** English (default) and French. Any regional French maps to French.
- **FR-1.2 Language switch everywhere.** Available on every signed-out page (landing, sign-in, registration, forgot password, reset password, terms) and every signed-in page, on phone and desktop. Switching is instant, needs no reload and loses nothing in a form being filled.
- **FR-1.3 First visit.** The language is chosen from the browser's preferred languages (the first supported one wins); otherwise English.
- **FR-1.4 Link-forced language.** A link can open the site directly in a given language, for French emails, posts and QR codes. It counts as a choice made on that device.
- **FR-1.5 Remembered on the device.** A choice made while signed out persists on that device across pages and visits.
- **FR-1.6 Saved on the account.** The language in effect at registration is saved on the account. A signed-in user who switches language updates the account. Signing in on any device applies the account's language.
- **FR-1.7 Existing accounts.** Existing accounts stay in English. A French choice previously stored on a user's device is adopted by their account once, at the first sign-in after release.
- **FR-1.8 Right language at first paint.** No flash of the other language. On every page, the declared page language, the browser tab title and the page description match the displayed language.
- **FR-1.9 The server knows the language.** For every action: the account's language when signed in, the language of the page making the request when signed out. This includes work that runs later without the user present.
- **FR-1.10 Dates and numbers.** Dates, times, numbers and percentages follow the conventions of the chosen language, not of the device ("30 sept. 2026", "1 000,5", "68 %").
- **FR-1.11 Plurals.** Plural forms are correct in both languages, including the French singular for 0 and 1 ("1 jour restant").
- **FR-1.12 Fallback.** Text missing in French shows in English. A raw identifier or a blank is never shown.
- **FR-1.13 Safeguards.** Automatic checks, run with the tests: every text exists in both languages with the same placeholders, and user-facing text added outside the translation system fails the check.

**Done when:**
- With a browser set to French, a first visit to the landing, sign-in and registration pages shows French at first paint, tab title included
- An account registered in French opens in French after sign-in on a browser set to English
- A French link opens in French in a browser set to English, and the next page stays French
- An existing English-language user notices no change other than the language switch appearing on signed-out pages and on phones

### Sprint 2: French interface, complete — "no English sentence in the interface"

**Goal:** From the landing page to every screen, the interface is fully French. AI-written content is still English at the end of this sprint (Sprint 3).

- **FR-2.1 The five audits in French.** Titles, section names, every question, every answer choice, examples and placeholders, required-field messages, save and completion messages, navigation and progress.
- **FR-2.2 Answers are language-independent.** Switching language mid-audit keeps every selected answer. An audit completed in one language reads correctly in the other. Scoring is identical.
- **FR-2.3 Wording a francophone outside the United States can answer.** US-specific terms get neutral French wording, with the US term kept as an example where it helps (for instance "Salarié à revenu stable (W-2 aux États-Unis)"). Amounts are explicitly labeled as US dollars. What is stored does not change. This is a bridge until Sprint 6.
- **FR-2.4 Leftover English removed.** Dashboard, simulation, identity charts, score labels, growth path headings and badges, screen-reader labels, and the language switch itself.
- **FR-2.5 Server messages in the user's language.** Everything a user can see: sign-in, registration, password rules, reset, validation, not found, rate limits, generation failures, growth path availability and cooldowns, simulation limits, blueprint and export prerequisites.
- **FR-2.6 System-composed sentences in the user's language**, at the time they are displayed: unlock criteria and progress, early-unlock and cooldown messages, refresh suggestions, "get started" insight, reasons an export is out of date. Waiting times are expressed so they are correct in any time zone.
- **FR-2.7 Glossary and tone.** One French term per product concept, used everywhere (see Glossary below). Formal "vous". French typography: non-breaking space before `: ; ? ! %`, guillemets, typographic apostrophes.
- **FR-2.8 Layout holds.** No truncated, overlapping or clipped text in French, from a 360 px phone to desktop, in light and dark themes.
- **FR-2.9 Accessibility parity.** Screen-reader labels and announcements are in French when the interface is.

**Done when:**
- A French walkthrough of every screen (signed-out and signed-in, phone and desktop) finds no English text in the interface
- The same answers produce the same sub-scores in both languages
- The automatic safeguards from Sprint 1 pass with the audits included

### Sprint 3: French AI — "my identity and my plan, written in French"

**Goal:** Everything the AI writes for a French-language user is written in French, with the same substance as in English.

- **FR-3.1 Coverage.** All generated text is in the account's language at the time of generation: identity headline and insights (contradictions, feasibility, gaps, strengths, recommendations); strategies (names, descriptions, pros, cons); action plan, roadmap and 72-hour micro-plan; what-if simulation results; dashboard insights; growth paths (content, action items, summaries); cross-path connections and next best action; export summary.
- **FR-3.2 Background generation.** Generation that starts without the user present (automatic synthesis, chained strategies, queued growth paths) uses the account's language.
- **FR-3.3 Native French.** Written directly in French with the glossary, not translated word for word. English industry terms that francophones use may stay, explained in French on first use. French typography and number formats; amounts stated with their currency.
- **FR-3.4 Same substance.** Language changes neither the scoring rules, nor the archetype set, nor the strategy logic. For the same profile, scores in French and English differ by no more than ordinary run-to-run variation.
- **FR-3.5 Archetypes.** Each archetype in the curated set has an official French name. An archetype is the same archetype in both languages: the history and side-by-side comparison never show a difference caused by language. Archetype names display in the current interface language, including for older identities.
- **FR-3.6 Values the system interprets stay language-independent.** Insight type and severity, connection types, path types, statuses, scores, dates and in-app links. Their labels come from the interface.
- **FR-3.7 French input is understood.** Free-text answers, notes and task titles in French, or in a mix of languages, are interpreted correctly whichever interface language is active. User text is never translated or altered.
- **FR-3.8 Language recorded.** Each generated item records the language it was written in.
- **FR-3.9 Content generated in another language.** It stays as it is and is marked ("generated in English"). Where regeneration exists (identity with its strategies; growth paths), one action regenerates it in the current language, within existing limits and after stating the consequences (a new identity version; progress on the current plan stays with the previous version). Never automatic.
- **FR-3.10 Dashboard insights.** They refresh in the new language after a switch. Insights in the wrong language are not shown.
- **FR-3.11 Derived items.** Items created from generated content (tasks from a plan) are in that content's language.
- **FR-3.12 Announced to assistive technology.** Content in a language other than the interface's is announced as such.
- **FR-3.13 Failures.** Failure handling, waiting states and limits behave identically in both languages.
- **FR-3.14 Verification.** The end-to-end AI verification (the 25 checks used for v0.4.1) passes in French in the no-cost test mode and against the real AI service, with one more check: every generated text field is in French.

**Done when:**
- A French-language user who completes the five audits receives identity, strategies, plan, insights and a growth path entirely in French
- An English identity re-synthesized in French for an unchanged profile shows the same archetype, under the same name, in both versions of the history
- The verification passes 25 of 25 in French in both modes, and English still passes

### Sprint 4: French beyond the screen — "what I receive and download is in French"

**Goal:** Everything that leaves the app is in the user's language.

- **FR-4.1 Password reset email.** Subject and body in the language the person was using when they asked for it. The reset page follows.
- **FR-4.2 Investment Blueprint PDF.** In the user's language: title, section headings, chart labels, fit and progress labels, growth section, empty states, footer, dates. Accents render correctly and the document declares its language.
- **FR-4.3 Growth strategy export.** In the user's language: headings, labels, statuses and summary.
- **FR-4.4 Mixed-language documents.** A document that includes content generated in another language is still produced: labels follow the current language, content stays as generated, and a short note says so.
- **FR-4.5 Terms and privacy in French.** Same substance and effective date as the English page, reachable from the same places. Each version links to the other.
- **FR-4.6 Disclaimers.** "Not financial, legal or tax advice" appears in French wherever it appears in English: screens, PDF, export.

**Done when:**
- A French-language user receives a French reset email, downloads a French blueprint and a French export, and can read the terms in French
- An English-language user receives all four in English, unchanged

### Sprint 5: Launch readiness — "reviewed, tested, discoverable, measurable"

**Goal:** French is good enough to put in front of strangers, and its use can be measured.

- **FR-5.1 Copy review.** A fluent French speaker reviews all interface text, the email, the documents and the terms. Corrections are applied and the glossary is final.
- **FR-5.2 AI output review.** At least three reference profiles are run through every generation type in French and reviewed against a short rubric: natural French, glossary respected, no English leftovers, numbers and currency correct, same substance as English.
- **FR-5.3 French walkthrough on staging.** Every screen, phone and desktop, light and dark, signed-out and signed-in, plus the email, the PDF and the export.
- **FR-5.4 English regression.** The English experience is unchanged.
- **FR-5.5 Discoverability.** The French landing page has its own address that search engines can index, declared as the French alternate of the English page. Link previews show a French title and description.
- **FR-5.6 Measurement.** The beta funnel can be reported per language (signups, completed audits, identities, activated strategies), and identity ratings can be compared per language.
- **FR-5.7 Documentation.** Project documentation no longer states that output is English only. Known limits are documented: US market content, what regeneration does.
- **FR-5.8 Release.** Version and changelog updated; French declared available.

**Done when:**
- The reviewer signs off with no blocking language issue open
- The French and English walkthroughs both pass on staging
- The funnel report shows French and English signups separately

### Sprint 6: Market fit for francophone investors (gated)

**Decision gate:** Start only after Sprints 1 to 5 have shipped and conversations with French-speaking users show which market to serve first. This sprint may become its own feature.

**Goal:** The experience makes sense for someone investing in Canada or France, not only for a French speaker investing in the United States.

- **FR-6.1 The investor's market.** Asked once (United States, Canada, France, Other) and changeable later. Existing users are in the United States market.
- **FR-6.2 Currency follows the market.** US dollars, Canadian dollars or euros in monetary questions, answer brackets and generated amounts.
- **FR-6.3 Market-specific questions adapt.** Employment status, retirement and savings accounts, credit standing (score ranges where a score exists; a different question where it does not), tax situation, geographic comfort, exit options.
- **FR-6.4 The AI knows the market.** Recommendations use financing, tax and legal instruments that exist in the investor's market. Instruments from another market are not presented as available.
- **FR-6.5 Comparable scores.** Scoring anchors adapt to the market and its currency so that readiness scores mean the same thing across markets.
- **FR-6.6 Vocabulary follows the market.** Within French, Canadian and French terms differ (hypothèque / prêt immobilier, mise de fonds / apport, REER and CELI / PEA and assurance-vie).
- **FR-6.7 Other markets.** General guidance, marked as not specific to the investor's market.
- **FR-6.8 Disclaimers.** Market-related content is general information; rules vary by jurisdiction; check with a local licensed professional.
- **FR-6.9 Independent of language.** An English-language user in Canada gets the Canadian market too.

**Done when:**
- A Québec profile and a France profile each receive strategies and a plan with no instrument that exists only in the United States, in the right currency, rated relevant by a reviewer who knows that market

---

## Glossary (starting point)

Terms already in use in the French interface. Sprint 2 extends and freezes this list; Sprint 3 gives it to the AI.

| English | French |
|---------|--------|
| Investor Identity | Identité investisseur |
| Identity Hub | Hub Identité |
| Archetype | Archétype |
| Readiness (score) | Préparation |
| Audit (Financial, Time, Risk Profile…) | Audit (financier, temps), Profil de risque… |
| Strategy / Fit | Stratégie / Correspondance |
| Action Plan | Plan d'action |
| Roadmap | Feuille de route |
| 72-Hour Micro-Plan | Micro-plan de 72 heures |
| Milestones | Jalons |
| What-If Simulation | Simulation « Et si » |
| Growth Strategy / Growth Path | Stratégie de croissance / Parcours de croissance |
| Next Best Action | Prochaine meilleure action |
| Dashboard / Tasks / Contacts | Tableau de bord / Tâches / Contacts |
| Investment Blueprint | Blueprint (term to confirm in Sprint 2) |

---

## Success Criteria

| # | Criterion | Target | Measurement Method |
|---|-----------|--------|-------------------|
| 1 | Interface text available in French | 100%; no English text found in a full French walkthrough | Automatic parity check plus the Sprint 5 walkthrough |
| 2 | French at first paint for a French-language browser | 100% of signed-out pages, no visible flash | Walkthrough with a browser set to French, cold load |
| 3 | Language persistence across devices | 100% of sign-ins apply the account's language | Sign in on a second device set to the other language |
| 4 | Generated content in the user's language | 100% of generated text fields for a French-language user | Language check in the verification run |
| 5 | End-to-end AI verification in French | 25 of 25, in the no-cost mode and against the real AI service | Same checklist as v0.4.1, run in French |
| 6 | Score parity between languages | Median readiness difference of 5 points or less across 5 reference profiles (to be calibrated against English run-to-run variation) | Run each reference profile in both languages |
| 7 | Time to complete the five audits in French | Under 20 minutes | Elapsed time, first audit start to fifth completion |
| 8 | French users finish all five audits once they start | Within 10 percentage points of English users | Funnel report per language |
| 9 | Identity rating by French-language users | Average within 0.3 of English users on the 1 to 5 scale | Existing identity rating, compared per language |
| 10 | Emails and documents in the user's language | 100% (reset email, blueprint PDF, export, terms) | Sprint 4 acceptance run in both languages |
| 11 | Layout integrity in French | No truncated or overlapping text at 360 px width on any screen | Sprint 5 walkthrough |
| 12 | English experience unchanged | No regression: existing tests pass and the English walkthrough matches the pre-feature behavior | Test suite plus English walkthrough |
| 13 | Copy accepted by the reviewer | No blocking language issue open at release | Reviewer sign-off |
| 14 | French usage is measurable | Signups, completions and ratings reportable per language | Funnel report |
| 15 | Market relevance (Sprint 6 only) | No US-only instrument in output for Canada and France profiles; relevance rated 4 of 5 or better | Review by someone who knows the market |

---

## Key Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| Language preference (account) | The language a user has chosen; applies everywhere the user signs in and to anything generated or sent for them | English or French; set at registration, changed by the user |
| Language preference (device) | The language shown on signed-out pages of a device | From an explicit choice, a link, or the browser's preference |
| Interface text | Every label, message and sentence the product displays, in both languages | Identifier, English text, French text, placeholders |
| Glossary | The agreed French term for each product concept | English term, French term, notes |
| Archetype | A member of the curated archetype set | Language-independent identity, English name, French name |
| Generated item | Identity version, strategy set, growth path | The language it was written in |
| Market (Sprint 6) | Where the investor invests | Country, currency |

---

## Scope Boundaries

### In Scope
- French for every user-facing surface: interface, audits, generated content, server messages, password reset email, blueprint PDF, export, terms
- Language detection, selection, persistence on the account and at first paint
- Date, number and plural handling per language
- Safeguards against missing or hard-coded text, and a French verification of the AI pipeline
- Review, walkthroughs, discoverability of the French landing page and per-language measurement
- Sprint 6, behind its gate: market, currency and local context for Canada and France

### Out of Scope
- Languages other than English and French
- Translating anything the user typed
- Automatic translation of content generated earlier (the user regenerates instead)
- Full market localization: strategy playbooks validated by local professionals, local tax and legal rules, local listings or data sources, pricing and payments in local currencies
- Compliance programs for new jurisdictions (GDPR, Québec's Law 25 and Charter of the French Language, French consumer law). Flagged under Dependencies
- Admin screens, operational scripts, logs and internal documentation: these stay in English
- Marketing email campaigns and support replies
- Conversational audit mode (not built yet); when it is, it follows the same language rules
- Regional French variants as separate languages (Canadian and French vocabulary differ only in Sprint 6, through the market)
- Right-to-left languages; a domain per country

---

## Dependencies

- **A fluent French reviewer** for copy and AI output. Assumed to be the founder, who already owns the landing page copy in both languages.
- **Real AI spend** for the French verification runs in Sprints 3 and 5. Small, but real.
- **Legal review of the French terms** before any paid or actively marketed launch in Québec or France, including which language version prevails.
- **Privacy and language-law obligations** in new jurisdictions before actively marketing there. Financial data of EU and Québec residents would be processed, which carries obligations this feature does not address.
- **Existing behavior this feature relies on:** hot-swappable prompt templates, generation limits and cooldowns, the identity rating, the funnel report.

---

## Assumptions

1. **Two languages only.** Nothing is built for a third.
2. **One French.** International French, formal "vous", understandable in Québec and in France. Regional vocabulary arrives only with the market in Sprint 6.
3. **Sprints 1 to 5 keep the US market content.** In French, amounts are labeled as US dollars and US-specific terms are worded so a francophone elsewhere can answer.
4. **Earlier content is not translated automatically.** Regeneration is explicit, because it creates a new identity version and may move scores.
5. **Existing accounts default to English.** A French choice stored on a device before this feature is adopted once.
6. **Same rules in both languages.** One scoring rubric and one archetype set; only the output language differs.
7. **Accepted English terms stay.** "Cash-flow", "BRRRR", "house hacking" and similar are kept where francophone investors use them, with a French explanation on first use.
8. **English is the reference version of the terms during the beta**, pending the legal review listed under Dependencies.
9. **Sprint 6 is gated.** It starts only after a decision informed by French-speaking users, and may be split into its own feature.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI French is correct but unnatural, or drifts from the glossary | French users rate their identity lower | Glossary given to the AI; reviewer rubric in Sprint 5; ratings compared per language |
| Scores differ between languages for the same profile | The readiness score loses meaning | Parity check on reference profiles (criterion 6) before release |
| About 700 new strings introduce errors or inconsistent terms | Looks half-translated again | Glossary first; automatic parity check; fluent review before release |
| Mixed-language states confuse users who switch mid-journey | Support burden, lost trust | Clear marking and a single regenerate action; consequences stated up front |
| Deciding the language at first paint slows the landing page | Lower conversion on phones | Measure before and after; keep the landing page within its current load time |
| Marketing to Québec or EU residents before the legal dependencies are met | Regulatory exposure | Dependencies section; no active marketing in those jurisdictions until reviewed |
| Market localization creeps into the language sprints | Sprints 1 to 5 slip | Sprint 6 gate; FR-2.3 is the only market-related item before it |
