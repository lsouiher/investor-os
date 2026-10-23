# Brand and UI system — Investor OS and RECS

v0.3, 2026-10-22 (v0.1 approved by Leo on the mockups; v0.2 adds §1's signature pairing; v0.3 lifts three light-mode pairs to their bars: `ink-muted` `#4B5563`, `on-accent` `#1A1A2E` with `accent-hover` `#F59E0B` so the hovered button keeps its text, and charts drawn on `surface` only, RECS's Q-37). One look for the whole ecosystem. Investor OS's current theme (`frontend/app/globals.css`) is the starting point; this document is the source of truth from here on, and both repos' token files are derived from it. Values below are hex so they paste into either repo's Tailwind `@theme`.

## 1. Feel

Dark navy and warm amber. Dense, numeric, calm: a tool a professional opens every day, not a landing page. Square corners on controls, soft corners on cards. Numbers are the hero: tabular figures, right-aligned, generous row height. Colour is spent on status and the one primary action per screen, never on decoration.

**The signature is bright amber on dark navy** (`#F59E0B` on `#1A1A2E`). It is what makes a screen read as "ours", so every screen shows it at least once in both modes: the header bar and, in RECS, the summary strip sit on `surface-inverse` even in light mode, with the amber mark, the active-route line and the primary button on them. Light mode is a white page under a navy band, not a white page with amber sprinkled on it.

## 2. Colour

Every text colour below reaches 4.5:1 on the surface it is meant for. **Amber `#D97706` on white is 3.4:1, so it is never used for small text in light mode**; light-mode links and amber text use `accent-text`. On `surface-inverse` the accent is always the bright `#F59E0B` (7.2:1 on navy), whichever mode the page is in.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | `#FAFAFA` | `#0F0F17` | page |
| `surface` | `#FFFFFF` | `#1A1A2E` | cards, panels, table bodies |
| `surface-subtle` | `#F3F4F6` | `#151525` | table heads, input wells, hover |
| `surface-inverse` | `#1A1A2E` | `#0F0F17` | header bar, footer, summary strip |
| `border` | `#E5E7EB` | `#2D2D44` | card and table borders |
| `border-muted` | `#F3F4F6` | `#1F1F35` | row dividers |
| `ink` | `#171717` | `#E5E7EB` | body text |
| `ink-strong` | `#111827` | `#F9FAFB` | headings, key figures |
| `ink-muted` | `#4B5563` | `#9CA3AF` | labels, captions (6.9:1 on `surface-subtle` in light mode) |
| `ink-on-inverse` | `#F9FAFB` | `#F9FAFB` | text on `surface-inverse` |
| `ink-muted-on-inverse` | `#A1A1B5` | `#A1A1B5` | labels on `surface-inverse` (6.9:1 on navy) |
| `accent` | `#D97706` | `#F59E0B` | primary button fill, focus ring, active tab, chart series 1 |
| `accent-on-inverse` | `#F59E0B` | `#F59E0B` | the mark, active-route line and amber figures on `surface-inverse` |
| `accent-hover` | `#F59E0B` | `#D97706` | primary button hover (`on-accent` on it: 7.9:1 light, 5.4:1 dark) |
| `accent-text` | `#B45309` | `#FBBF24` | links, amber text, selected labels |
| `on-accent` | `#1A1A2E` | `#1A1A2E` | text on an accent fill: navy on amber in both modes (5.4:1 light, 7.9:1 dark); white on `#D97706` is 3.2:1 |
| `ok` | `#047857` | `#34D399` | pass, positive cash flow |
| `warn` | `#B45309` | `#FBBF24` | watch, benchmark miss |
| `danger` | `#B91C1C` | `#F87171` | fail, negative |
| `info` | `#475569` | `#94A3B8` | neutral notes (slate, not blue: blue is not in the palette) |

Status is never the only signal: pair with the word or an icon (RECS AC-9 stays).

Charts, in layout order: `chart-1` = `accent`, `chart-2` = `#334155` light / `#CBD5E1` dark (slate), `chart-3` = `ok`. Charts are drawn on `surface` only, never on `surface-subtle` (light `accent` on it is 2.9:1); each series reaches 3:1 on `surface`; a legend names every series.

## 3. Type

Geist Sans for text, Geist Mono for figures where alignment matters (tables, summary strip, inputs). Both are SIL Open Font Licence; **RECS self-hosts the woff2 files** (its SP-1 forbids runtime fetches), Investor OS may keep `next/font`. Fallback stack: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Token | Size / line | Use |
| --- | --- | --- |
| `xs` | 12 / 16 | table captions, footnotes |
| `sm` | 14 / 20 | table cells, labels, nav |
| `base` | 16 / 24 | body, inputs |
| `lg` | 18 / 28 | section titles |
| `xl` | 20 / 28 | page title |
| `2xl` | 24 / 32 | hero figure in the summary strip |
| `3xl` | 30 / 36 | home headline |

Weights: 400 body, 500 labels and nav, 600 headings and key figures. No 700. Figures always `font-variant-numeric: tabular-nums`.

## 4. Shape and space

- Spacing unit 4px. Card padding 16 (compact) or 24. Table cell 12 × 8.
- Radius: controls and buttons **0**, inputs **4**, cards and dialogs **8**, pills **999**.
- Borders 1px, no shadows except dialogs (`0 10px 30px rgb(0 0 0 / .25)`).
- Focus: 2px `accent` outline, 2px offset, on everything focusable.
- Max content width 1200 (Investor OS) / RECS keeps its `page` 1024 and `wide` 1440 containers; same gutters, 16 on phone, 24 from 768.

## 5. Components

- **Header bar**: `surface-inverse` in both modes, 56 high. Wordmark left in `ink-on-inverse` 600 with the amber mark; nav right in `sm` 500; the primary action (Sign in, or the account menu) last. 2px `accent-on-inverse` line under the active route.
- **Wordmarks**: text only for now. "Investor OS" and "RECS" set in Geist 600, letter-spacing −0.01em, with a 10px `accent-on-inverse` square before the name as the shared mark. Secondary line in `ink-muted`: "Real Estate Creative Systems".
- **Primary button**: `accent` fill, `on-accent` text, radius 0, 36 high, `sm` 500. One per view. **Secondary**: 1px `border`, `ink` text, transparent. **Ghost**: text only, `accent-text`.
- **Summary strip (RECS)**: a band on `surface-inverse` under the page title, in both modes; each item a `xs` uppercase label in `ink-muted-on-inverse` over a `2xl` mono figure in `ink-on-inverse`; status colour on the figure only when the deal check has a verdict for it; the amber of the band is the mark and the active item, not every figure.
- **Section (RECS)**: a card on `surface`, title `lg` 600 with the collapse chevron, 24 padding; tables inside are edge-to-edge in the card.
- **Tables**: head `surface-subtle`, `sm` 500 `ink-muted`; body rows 36 high divided by `border-muted`, no stripes; figures mono right-aligned; the row the user hovers gets `surface-subtle`.
- **Deal check**: status dot 10px + word in the status colour; row otherwise plain.
- **Inputs**: 36 high, radius 4, 1px `border`, `surface` fill, unit suffix in `ink-muted`; invalid = `danger` border + message under, never a red fill.
- **Warnings beside a number**: a small `warn` triangle with a tooltip, never a banner (RECS I8).
- **Dark mode**: `.dark` on `<html>`, follows `prefers-color-scheme` by default, a toggle in the header remembered per browser. Print is always light, and the printout keeps no inverse band: the strip prints as the plain two-column list it prints as today.

## 6. Voice

Short, plain, numeric. Labels are nouns ("Cash needed"), buttons are verbs ("Save deal"). No exclamation marks, no marketing adjectives inside the tools.

## 7. Open

- A logo mark beyond the amber square.
- Whether Investor OS adopts the `accent-text` rule for its light-mode links (today it uses `#D97706` text in places, which fails AA).
- Whether dark should be the default when the browser states no preference. Not decided; the signature pairing shows in both modes either way.
