# Feature Specification: RECS Import

**Feature:** Deals sent from RECS calculators are saved to the investor's account and listed in the hub
**Created:** 2026-10-23
**Status:** Draft
**Short Name:** recs-import
**Branch:** `003-recs-import`
**Gate:** Lifted by the owner on 2026-10-23: build now, in this repo, ahead of the 2026-12-04 repo decision. The original gate (no implementation before that date, and only if this repo is kept) is waived for this feature only. The candidate repo already has its own build and gets nothing new; no change is made there (CLAUDE.md "Two repos, one product name").

---

## Overview

RECS is a sibling product: a set of free real estate calculators. An investor who works a deal in a RECS calculator can press "Send to InvestorsMap". This feature is the receiving side of that hand-off. The investor lands on this app, sees which deal is arriving, signs in or creates an account if needed without losing the deal, saves it with one click, and later finds it in the hub, from where it can be reopened in RECS exactly as it was sent, or deleted.

**Names.** RECS's documents and its button call this app "InvestorsMap"; this repo's product name is "Investor OS" (`docs/brand.md`). This spec writes "InvestorsMap" only when quoting RECS (the button label "Send to InvestorsMap", RECS's `VITE_INVESTORSMAP_URL`); every string this app shows says Investor OS.

The app is a safe keeper of the deal, not a reader of it. The deal's contents travel as an opaque payload that this app validates for shape and size, stores, and hands back unchanged. It never interprets the numbers inside.

**Contract.** The hand-off is defined by RECS, not by this repo: RECS `docs/spec.md` §10.8 (FR-10.8.1, FR-10.8.2, DM-7) and RECS `docs/decisions.md` D-108 (2), read-only. Where this spec and that contract differ, the contract wins and this spec is corrected. `docs/recs-import-status.md` §2 maps the contract item by item.

---

## Clarifications

### Session 2026-10-23 (decisions recorded in `docs/recs-import-status.md` §4, taken by the owner)

- Q: Where does the list of received deals live? → A: In the hub, as the last section, below the five audit cards. Not on the dashboard.
- Q: What does a signed-out visitor see on arrival? → A: The deal's name and calculator first, with "Sign in to save" and "Create an account"; after authentication they return to the same page and save with one click.
- Q: Is a deal sent twice deduplicated? → A: No. Every send that is saved adds a row.
- Q: How are saved deals purged? → A: Only through account deletion, with the rest of the user's data. No time-based purge in this version.
- Q: Which calculators are accepted? → A: All eight calculators registered in RECS from the start: `multifamily`, `quick-screen`, `single-family`, `fix-and-flip`, `brrrr`, `wholesaling`, `subject-to`, `short-term-rental`.
- Q: Does the deal's content ever reach this app's server before the user saves? → A: No. The deal arrives in the part of the link that browsers do not send to servers; it is held in the visitor's browser session across sign-in and is sent to the server only when the user presses Save.

---

## Problem Statement

RECS users who want to keep a deal have nowhere to keep it: RECS has no accounts by design. Investor OS has accounts and an investor identity but no calculators. The hand-off joins the two without a shared login, database or API: the deal travels in a link, and this app stores it for the investor. Without the receiving side, RECS's "Send" button stays hidden (RECS shows it only once a receiving app lists the calculator), and every RECS user who would have become an InvestorsMap user is lost at the moment of highest intent.

---

## Target Users

- **RECS user, new to Investor OS:** has just run a deal in a calculator, has no account here. The deal's name is the reason to sign up.
- **Existing Investor OS investor:** uses RECS for analysis and wants their deals kept next to their identity and plans.

---

## User Scenarios & Testing

### Scenario 1: Signed-in investor saves a deal (P1)
**Actor:** Investor already signed in to Investor OS
**Flow:**
1. In a RECS calculator, the investor presses "Send to InvestorsMap"
2. The browser opens this app's import page with the deal in the link
3. The page shows the deal's name and the calculator it came from, with "Save" and "Cancel"
4. The investor presses Save
5. A confirmation appears with a way to go to the hub

**Acceptance Criteria:**
- The deal's name and calculator label are shown before anything is saved
- One press of Save stores the deal; Cancel stores nothing
- After saving, the address bar no longer contains the deal, so a reload or a copied link does not save it again

### Scenario 2: New visitor signs up and keeps the deal (P1)
**Actor:** RECS user with no Investor OS account
**Flow:**
1. The visitor arrives on the import page from RECS
2. The page shows the deal's name and calculator, with "Sign in to save" and "Create an account"
3. The visitor creates an account
4. Registration returns them to the import page, which still shows the same deal
5. The visitor presses Save

**Acceptance Criteria:**
- The deal name is visible before any account is requested
- The deal survives the trip through registration or sign-in in the same browser session
- The new account is attributed to RECS as its signup source
- If the visitor abandons sign-up and closes the tab, nothing about the deal remains on the server

### Scenario 3: Finding, reopening and deleting a saved deal (P1)
**Actor:** Investor with at least one saved deal
**Flow:**
1. The investor opens the hub
2. Below the audit cards, a section "Deals from your calculators" lists each saved deal, newest first, with its name, calculator and date saved
3. The investor presses "Open in RECS" on one deal; RECS opens in a new tab on that calculator with the deal loaded
4. Back in the hub, the investor deletes another deal after confirming

**Acceptance Criteria:**
- A deal reopened from the list shows in RECS the identical summary strip it showed when it was sent (RECS acceptance for this hand-off)
- A deleted deal disappears from the list at once and does not come back on reload
- Another user's deals never appear and cannot be opened or deleted

### Scenario 4: Invalid or empty import link (P2)
**Actor:** Anyone opening the import page with a missing, truncated, tampered or oversized deal
**Flow:**
1. The visitor opens the import page with no deal, or with a deal that fails validation
2. The page says there is nothing to import and links to the hub (or the landing page if signed out)

**Acceptance Criteria:**
- Nothing is saved and no error page or stack trace is shown
- The same rules reject the deal on the server if the page is bypassed

### Scenario 5: French-speaking investor (P2)
**Actor:** Investor using the app in French
**Acceptance Criteria:**
- Every string on the import page and in the hub section is available in English and French
- The deal's own name is shown as received (after FR-2's cleaning), untranslated

### Edge Cases
- The deal name contains `&`, `#`, `%`, quotes, emoji or non-Latin characters: it is shown and stored exactly, and reopening the deal in RECS still works
- The name is all spaces, or longer than 120 characters after trimming: rejected
- The name contains a control character (for example a tab) or a bidirectional formatting character (for example U+202E): the control character becomes a space and the formatting character is removed before the name is shown or stored; the deal is accepted, and reopening it in RECS shows RECS's own name unchanged (it is inside `d`)
- The calculator is not in the known list (a new RECS calculator not yet registered here, or a typo): rejected with "nothing to import"
- The payload is longer than 8,000 characters, or contains characters outside the URL-safe base64 alphabet (for example `+`, `/`, `=` or spaces): rejected
- The same deal is sent twice: two rows
- The visitor is signed in as a different account than expected: the deal is saved to whichever account is signed in when Save is pressed; the page shows which account that is
- The visitor opens the import link, signs in in another tab, and returns: the page reflects the signed-in state before offering Save
- The RECS address is not configured in this deployment: see FR-5 (no "Open in RECS"; an empty section is hidden)
- The visitor uses "Forgot your password?" while a deal is held: the reset link opens a new tab, and the held deal belongs to the first tab only, so it is not carried through the reset; the visitor sends it again from RECS (known limit, accepted at T038)
- A link elsewhere carries `?ref=<other site>`: it is not a signup source; only `ref=recs` is (T038)
- Sign-out forgets a held deal and the signup source, so the next person to sign in on a shared device is not offered it (T038). So does any new sign-in over that session in another tab (another account, or the same one again: tabs see only the token); every other tab of that browser reloads (T040)
- The session expires and another tab notices first: that tab removes the token, which every other tab treats as a sign-out, so a deal held there is forgotten and is sent again from RECS (known limit, accepted at T038)
- Account deletion: every saved deal of the user is scrubbed (name set to `deleted`, payload emptied) and soft-deleted with the rest of their data, as the account-deletion script does for every user table (FR-7)

---

## Functional Requirements

### FR-1: Receiving a deal
- The app provides a public import page at `/import`. RECS links to it as `<origin>/import?ref=recs#c=<slug>&n=<name>&d=<payload>` (RECS FR-10.8.2); this address shape is fixed by the contract
- The page reads the deal only from the part of the link after `#`, which is never sent to this app's server on page load
- On arrival the page holds the deal in the visitor's browser session and removes it from the address bar
- The deal name and the calculator's display label are shown before any save; the payload is shown to no one

### FR-2: Validation (same rules in the browser and on the server)
- Calculator (`c`): must be one of the known calculators listed in a configuration file maintained in this repo, initially the eight in the Clarifications
- Name (`n`): URL-decoded; control characters (Unicode C0/C1) replaced by a space and bidirectional formatting characters (U+202A–U+202E, U+2066–U+2069) removed, since they could make one deal's name pass for another's (constitution X, sanitize before storing); then trimmed; 1 to 120 code points. RECS's name input accepts any non-blank text (RECS `packages/calculators/src/schema-helpers.ts` `text()`, D-112 (1), read at RECS `5463018`), so the name is cleaned, never refused for these characters: a refusal would lose a deal RECS sent. Only the name is cleaned; the payload `d`, which is what reopens in RECS, is untouched. Widened at ship (T038, review): line separators U+2028/U+2029 also become a space, and these invisible characters are also removed: direction marks (U+200E, U+200F, U+061C), soft hyphen U+00AD, grapheme joiner U+034F, zero-width space U+200B, word joiners U+2060–U+2064, deprecated format characters U+206A–U+206F, U+180E, interlinear annotation marks U+FFF9–U+FFFB, BOM U+FEFF, tag characters U+E0000–U+E007F and the blank Hangul fillers U+115F, U+1160, U+3164, U+FFA0, and lone UTF-16 surrogates (not text; the database driver may refuse them); the joiners U+200C/U+200D are kept (emoji sequences and several scripts need them) but a name made only of them is blank
- Payload (`d`): 1 to 8,000 characters, URL-safe base64 alphabet only (`A–Z a–z 0–9 - _`)
- The payload is never decoded, decompressed, parsed or altered. It is stored and returned byte for byte
- A deal failing any rule is not saved; the user sees "nothing to import"; the server answers with the app's standard error shape

### FR-3: Keeping the deal across sign-in and sign-up
- "Sign in to save" and "Create an account" send the visitor to sign-in or registration with a return path to `/import`
- Sign-in and registration honour that return path; only same-site relative paths from an allow-list are accepted (no open redirect)
- `/import` is the only accepted return path; the existing redirect from protected pages to sign-in is unchanged by this feature
- The held deal lives only for the browser session and is cleared once saved or cancelled

### FR-4: Saving
- Save is one action for a signed-in user and stores calculator, name, payload, owner and time saved
- No deduplication: each save creates a new record
- At most 500 live (not deleted) deals per user; a save beyond that is refused with a message pointing to the hub, and the held deal stays so it can be saved after deleting some (added at T038 from the security review, `security-review.md`)
- Saving, listing and deleting require authentication and are subject to the per-user rate limit that protects other authenticated actions

### FR-5: Hub list "Deals from your calculators"
- The hub shows the section last, below the audit cards
- Each row: name, calculator label, date saved, "Open in RECS", Delete
- Newest first; deleted deals excluded
- "Open in RECS" opens, in a new tab, `<RECS address>/calculators/<c>#d=<d>` where `<RECS address>` is the configured RECS URL already used by the "Calculators" link and `<d>` is the stored payload unchanged; when no RECS address is configured the rows are listed without it
- Delete asks for confirmation, then removes the row from the list (a soft delete, FR-7)
- With no deals, the section shows a short empty state that points to the calculators when the RECS address is configured, and is hidden otherwise

### FR-6: Attribution
- Arrival with `?ref=recs` is recorded as the signup source `recs` for an account created in that session, and appears in the existing beta funnel report

### FR-7: Data protection and retention
- Saved deals belong to one user and one tenant, are isolated by the same tenant-isolation rules as all user data, and are referred to externally only by a non-guessable public identifier
- Deletion by the user is a soft delete; the row keeps its owner and dates but its name becomes `deleted` and its payload is emptied, as account erasure does (added at T038: the per-user cap counts live deals, so a deleted row must not keep its payload)
- Account deletion leaves no readable deal: every saved deal of the user is scrubbed (name set to `deleted`, payload emptied) and soft-deleted with the rest of their data, as the account-deletion script does for every user table
- No time-based purge in this version; the retention statement in the deployment guide says so

### FR-8: Documentation
- The PRD gains an "Amendments" section whose first row names RECS `docs/spec.md` §10.8 and D-108 as the contract for this hand-off; the PRD's "Property Deal Analyzer" row notes that calculators live in RECS and arrive through this hand-off
- The deployment guide documents the known-calculator list and the procedure for adding a calculator (add it here and deploy first, then RECS turns on Send for it), the `/import` route, and the retention rule

---

## Success Criteria

| # | Criterion | Target | Measurement Method |
|---|-----------|--------|-------------------|
| 1 | Round trip fidelity: a deal sent from RECS, saved, then opened from the hub shows the identical summary strip in RECS | 100% of tested deals, all eight calculators | Manual round trip against a RECS build, one deal per calculator, plus an automated check that the stored payload equals the sent one |
| 2 | A signed-in investor saves an arriving deal | One action, under 10 seconds from arrival | Timed walkthrough |
| 3 | A new visitor creates an account and saves the deal without re-sending it from RECS | 100% of attempts in the same browser session | Walkthrough of sign-up and sign-in paths |
| 4 | Invalid deals rejected | 100% rejected and none stored, for: a name blank or over 120 code points after cleaning and trimming; an unknown calculator; a payload over 8,000 characters or outside the base64url alphabet; a missing or badly encoded key | Automated tests on both browser and server rules |
| 5 | The deal's content never reaches the server before Save | 0 server requests carrying the payload before Save | Inspection of request logs during the walkthroughs |
| 6 | RECS arrivals are countable | Signups from RECS appear as their own source in the funnel report | Run the funnel report after a test signup |
| 7 | Conversion from arrival to saved deal (post-launch) | Tracked; baseline set after first 30 days | Saved deals per arrival, from funnel data |
| 8 | Isolation | No user can list, open or delete another user's deal | Automated cross-user tests |
| 9 | Bilingual | 100% of new strings present in English and French | Locale completeness test |

---

## Key Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| RECS Deal | A deal sent from a RECS calculator and saved by a user (RECS DM-7) | public id, owner (user, tenant), calculator slug, name, opaque payload, saved at, deleted at |
| Known calculator list | Configuration naming the calculator slugs this app accepts | slug, display label (EN/FR) |
| Signup source | Existing account attribute; gains the value `recs` | — |

---

## Scope Boundaries

### In Scope
- The import page, return path through sign-in and registration, one-click save
- Server-side storage, listing and soft deletion of deals, with validation
- The hub section with "Open in RECS" and delete
- `recs` as a signup source
- EN and FR strings
- PRD amendment and deployment guide update
- Account-deletion purge

### Out of Scope
- Computing on, displaying or decoding deal contents (RECS FR-10.8.3, P2; needs RECS's engine package and this app's deal pipeline)
- Any shared cookie, shared database, single sign-on or API that RECS calls (forbidden by RECS D-105 and D-264)
- Deduplication of repeated sends
- Time-based purge of deleted rows
- Editing a deal's name in this app
- Moving the list to a deal pipeline (revisit when PRD V3.1 exists)
- Any change to RECS or to the candidate repo

---

## Dependencies

- RECS `docs/spec.md` §10.8 and `docs/decisions.md` D-108, read-only, as the contract
- A RECS build reachable at the configured RECS address, for the round-trip acceptance check
- The existing configured RECS address used by the "Calculators" link (already built and documented)
- The existing signup-source capture and beta funnel report (v0.4.0)
- The existing account-deletion script
- None on the 2026-12-04 repo decision (gate lifted, see Gate)

---

## Assumptions

- The concrete shapes named by the feature request are inputs to `/speckit-plan`, not open questions: a `recs_deals` table (CUID2 public id, tenant id, soft delete, row-level security, append-only migration); `POST`, `GET` and `DELETE /api/v1/recs-deals` behind authentication and the per-user brake; the known-calculator list in `config/recs.json`; the RECS address from `NEXT_PUBLIC_RECS_URL`
- "Under 120 characters" in the contract is read as "1 to 120 after trimming", matching the owner's decision; RECS caps its own names below that
- "Under 8,000 characters" is read as "at most 8,000"; RECS caps payloads at 7,997 (RECS D-112 (2)), so every RECS-produced deal is accepted
- The calculator's display label is maintained in this app's locale files; an unknown slug never reaches display because it is rejected
- The session-scoped hold means a deal does not survive closing the browser or switching browsers mid-sign-up; the visitor sends it again from RECS. This is accepted as the privacy trade-off (candidate D-131)
- The candidate repo's decisions D-130 to D-132 made the same choices; its tests (`src/app/import/`, `e2e/recs-import.spec.ts`) may be ported, read-only
- The release is a minor version (new table, new public route)
