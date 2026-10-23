# Brand notes: Investor OS on brand.md

Working notes on carrying `docs/brand.md` (v0.3, copied unchanged from RECS) into Investor OS,
branch `brand/brand-md-v03`. brand.md stays the source of truth and nothing here changes it.
The items under "Proposed for v0.4" are for the next brand.md revision, which gets made in
RECS first.

`frontend/app/globals.contrast.test.ts` holds the two in step: it fails if a `globals.css`
value drifts from brand.md §2, or if a pair §2 names drops below its contrast bar.

## 1. What was mapped

### Tokens (`frontend/app/globals.css`)

| brand.md | Investor OS variable | Light | Dark | Change |
| --- | --- | --- | --- | --- |
| `background` | `--background` | `#FAFAFA` | `#0F0F17` | none |
| `surface` | `--surface-card` | `#FFFFFF` | `#1A1A2E` | none |
| `surface-subtle` | `--surface-subtle` | `#F3F4F6` | `#151525` | light was `#F9FAFB` |
| `surface-inverse` | `--surface-dark` | `#1A1A2E` | `#0F0F17` | none |
| `border` | `--border` | `#E5E7EB` | `#2D2D44` | none |
| `border-muted` | `--border-muted` | `#F3F4F6` | `#1F1F35` | none |
| `ink` | `--foreground` | `#171717` | `#E5E7EB` | none |
| `ink-strong` | `--foreground-strong` | `#111827` | `#F9FAFB` | none |
| `ink-muted` | `--foreground-muted` | `#4B5563` | `#9CA3AF` | none (v0.3 commit) |
| `ink-on-inverse` | `--ink-on-inverse` | `#F9FAFB` | `#F9FAFB` | new |
| `ink-muted-on-inverse` | `--ink-muted-on-inverse` | `#A1A1B5` | `#A1A1B5` | new |
| `accent` | `--accent` | `#D97706` | `#F59E0B` | none (v0.3 commit) |
| `accent-on-inverse` | `--accent-on-inverse` | `#F59E0B` | `#F59E0B` | new |
| `accent-hover` | `--accent-hover` | `#F59E0B` | `#D97706` | none (v0.3 commit) |
| `accent-text` | `--accent-text` | `#B45309` | `#FBBF24` | new |
| `on-accent` | `--on-accent` | `#1A1A2E` | `#1A1A2E` | none (v0.3 commit) |
| `ok` / `warn` / `danger` / `info` | same names | §2 values | §2 values | new |
| `chart-1..3` | `--chart-1..3` | accent / `#334155` / ok | accent / `#CBD5E1` / ok | new |

Each has a Tailwind `@theme` colour (`text-accent-text`, `bg-surface-dark`, `text-ok`...).
Radii follow §4: `--radius-button` 0, `--radius-default` 4 (inputs), `--radius-card` 8, and a
new `--radius-pill` 999.

Kept, not in brand.md: `--foreground-secondary` (same as `ink-muted` in light, `#D1D5DB`
dark), `--foreground-tertiary` (see v0.4 below). Added, not in brand.md: the tints and the
status-on-inverse pair in §2 below. `--score-red/amber/emerald` are gone; their users now take
`danger`/`accent`/`ok`, or the on-inverse pair on the identity card.

### Classes

| Before | After |
| --- | --- |
| `text-accent`, `text-amber-600/700/800/900`, `style={{ color: "#D97706" }}` on text | `text-accent-text`; the paired `dark:text-amber-200/300/400` dropped |
| `text-accent` / `text-amber-600` at 24px+ (landing score, simulation figure) | `text-accent` (3:1 bar) |
| `hover:text-amber-700`, `hover:text-accent-hover` on those links | `hover:underline`, or nothing when already underlined |
| SVG icons and the checkbox in `text-amber-600` | `text-accent` (graphics, 3:1) |
| `bg-amber-50/100` + `dark:bg-amber-950` / `dark:bg-amber-900/30`, incl. `hover:` | `bg-accent-tint` |
| `bg-amber-500/600` (progress fills) | `bg-accent` |
| `border-amber-100/200` + `dark:border-amber-700/800` (callouts) | `border-accent/30` |
| `border-amber-300/400/600`, `hover:border-amber-400`, `border-t-/border-l-amber-*` | `border-accent` (same prefixes) |
| `focus:ring-amber-500`, `focus:border-amber-500` | `focus:ring-accent`, `focus:border-accent` |
| `accent-amber-600` (range input), `from-amber-600/10` | `accent-accent`, `from-accent/10` |
| `text-foreground-tertiary` on readable text (51 places) | `text-foreground-muted` |
| primary buttons `rounded`/`rounded-md`/`rounded-lg`; text inputs `rounded-lg` | `rounded-none`; `rounded` (4px) |
| `text-red-500/600/700` (+ `dark:text-red-300/400`), `text-score-red` | `text-danger` |
| `text-emerald-500/600/700` (+ `dark:text-emerald-300/400`) | `text-ok` |
| `bg-red-50/100` + `dark:bg-red-900/950`, `bg-score-red/10` (error banners, badges) | `bg-danger-tint` |
| `bg-emerald-50/100` + `dark:bg-emerald-900/30` (success badges) | `bg-ok-tint` |
| `bg-blue-50/100` + `text-blue-*` (info badges, prerequisite tag) | `bg-info-tint text-info` (brand.md: slate, not blue) |
| `border-red-200` + `dark:border-red-700`; `border-emerald-200` + `dark:border-emerald-700` | `border-danger/30`; `border-ok/30` |
| `border-red-400/600` (invalid field), `border-emerald-500` (done step) | `border-danger`, `border-ok` |
| completed checkbox `border-emerald-500 bg-emerald-500 text-white` | `border-ok bg-ok text-surface-card` (white on light `ok` 5.5:1, navy on dark `ok` 8.9:1; white on emerald-500 was 2.5:1) |
| `bg-emerald-200/300` + `dark:bg-emerald-800` (progress connectors) | `bg-ok/40`, `bg-ok` |
| dashboard `ScoreGauge` hex `#dc2626/#d97706/#059669`, track `#e5e7eb` | `var(--danger)`/`var(--chart-1)`/`var(--ok)`, `var(--border)` |
| growth path stripes `border-l-emerald/blue/purple-500`, fallback `border-l-gray-400` | `border-l-chart-3`/`chart-2`/`info`, fallback `border-l-border` (portfolio stays `chart-1`) |
| export consent confirm `bg-gray-900 text-white` | the primary button (`bg-accent text-on-accent`, square) |
| identity card `to-purple-900/10` gradient, `text-white` score | `to-transparent`, `text-ink-on-inverse` |

`grep -rnoE '[a-z:]*amber-[0-9]+' frontend/app frontend/components` returns nothing, and
neither does the same grep for `red|emerald|gray|blue|purple|green|yellow`.

## 2. Changes beyond brand.md's letter

- **`--accent-tint`** (`#FFFBEB` light, `#2A2418` dark): brand.md has no tinted background,
  and Investor OS uses one for amber callouts and badges. `accent-text` on it is 4.8:1 and
  9.2:1. Callout borders use `border-accent/30`, not a new token.
- **Status tints**, the same idea for the other three status colours: `--ok-tint`
  (`#ECFDF5` / `#172A24`), `--danger-tint` (`#FEF2F2` / `#2E1A1E`), `--info-tint`
  (`#F1F5F9` / `#1E2433`). Each status colour reads 4.5:1 on its own tint in both modes
  (ok 5.2 / 7.8, danger 5.9 / 5.9, info 6.9 / 6.0); the contrast test asserts it.
- **Status on `surface-inverse`**: `--ok-on-inverse` `#34D399` and `--danger-on-inverse`
  `#F87171`, the same in both modes (brand.md's dark `ok`/`danger`), for scores on the navy
  identity card: 8.9:1 and 6.2:1 on navy. See the v0.4 item below.
- **The sidebar is the header bar on its side.** §5 describes a horizontal header with a line
  *under* the active route. Investor OS's signed-in shell has a left sidebar on desktop and a
  bottom tab bar on phones. Both are on `surface-inverse` now. The active line sits on the
  sidebar's left edge and the tab bar's top edge (2px `accent-on-inverse`, with
  `aria-current="page"`). Phones also get a 56px header band with the wordmark, since they
  had no brand surface before.
- **Signed-out pages share one band.** Landing, login, register, both password pages and
  terms render `SiteHeader` (`components/shared/site-header.tsx`): wordmark linking home,
  Calculators, the theme toggle, plus the landing page's log-in link. The auth card drops its
  own wordmark. `Wordmark` keeps a light variant (square in `accent`, since
  `accent-on-inverse` on white is 2.1:1) but nothing renders it now.
- **Chart on navy.** The identity card draws the radar chart on `surface-inverse`, so
  "charts on `surface` only" was not quite true. Its axis labels were
  `fill-foreground-secondary`, which is 2.3:1 on navy in light mode. `RadarChart` takes
  `inverse` for that card: series `accent-on-inverse`, labels `ink-muted-on-inverse`. All
  other radar and sparkline uses sit on `surface-card`. Both charts draw with `var(--chart-1)`.
- **Score thresholds.** The five score-colour helpers now read `danger` / `accent-text`
  (same value as `warn`) / `ok`. On the identity card they read `danger-on-inverse` /
  `accent-on-inverse` / `ok-on-inverse`, for the ring and the sub-score figures.
- **Path stripes.** The growth path cards had a colour per path (emerald, blue, purple).
  brand.md spends colour on status, not decoration, and has no blue or purple; the stripes
  now take the chart series in layout order and then `info`. The path name and icon always
  sit beside the stripe.
- **Disabled controls keep `foreground-tertiary`.** These are the two `cursor-not-allowed`
  states in the audit form. WCAG 1.4.3 exempts inactive components.
- **Dead hovers.** `text-foreground-muted hover:text-foreground-secondary` changed nothing in
  light mode, because both are `#4B5563`. These hovers now go to `foreground-strong`.
- **Calculators link.** It opens RECS in a new tab, and it appears in the sidebar nav, the
  phone header band and the signed-out header band. The frontend has no `.env.example`, so
  `NEXT_PUBLIC_RECS_URL` is documented in `frontend/.env.local.example`, the frontend
  Dockerfile's build args and `docs/deploy.md`.

Left as they were (follow-ups, not regressions):

- Other radii: secondary buttons and some badges still use `rounded-md`/`rounded-lg`, and the
  identity card uses `rounded-xl`.
- Code comments, the backend `package.json` description and the Dockerfile headers still say
  "InvestorOS"; every string a user sees (page title, copy, locales, the PDF blueprint, the
  growth export and the reset email) says "Investor OS".

## 3. Proposed for v0.4

### `foreground-tertiary`: never readable text

Investor OS has a fourth text grey that brand.md does not name: `--foreground-tertiary`.
It is `#9CA3AF` in light (2.5:1 on white, 2.4:1 on the page) and `#6B7280` in dark (3.5:1 on
`surface`). It was used for 51 pieces of readable text: section headings, dates, empty-state
messages, disclaimers, completed (struck-through) items and the sidebar footer links.

**Chosen fix:** move readable text to `ink-muted` (`--foreground-muted`, 7.6:1 light and
6.7:1 dark on `surface`) instead of raising the token. brand.md has three text greys. A fourth
one that passed 4.5:1 on `surface-subtle` would land within a few points of `ink-muted`, so it
would not read as a separate step anyway. The token stays, documented in `globals.css` for
placeholders, disabled controls and decorative fills (status dots) only.

**Proposal:** add `ink-faint` to §2 with that restricted use, so both products name the same
grey for placeholders and disabled states and nobody reaches for it for text:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `ink-faint` | `#9CA3AF` | `#6B7280` | placeholders, disabled controls, decorative dots; never readable text |

### Dark default, and the dark band

Investor OS follows `prefers-color-scheme` and goes light when the browser states no
preference (§7's open question). Settling this needs a related fix first. In dark mode,
`surface-inverse` (`#0F0F17`) is the same value as `background` (`#0F0F17`), so the header
band and sidebar disappear into the page (seen on the landing page). The signature pairing
then only shows through the amber mark and the active line.

**Proposal:**

- Give dark `surface-inverse` a value of its own, or require a 1px `border` under the band in
  dark mode.
- Keep "follow the system, light when unstated". Light mode now carries the pairing at full
  strength (a white page under a navy band), so a dark default would gain nothing.

### Logo

The mark is the 10px amber square, rendered in CSS (`components/shared/wordmark.tsx`). The
favicon is still the create-next-app default.

**Proposal:** formalise the square plus wordmark as an SVG in both repos, and ship an amber
square on navy as the favicon and app icon. Leave anything beyond the square open until there
is a reason to spend on it.

### Smaller corrections to §2's text

- `ink-muted-on-inverse` on navy is 6.7:1, not 6.9:1.
- `#D97706` on white is 3.2:1, not 3.4:1.
- `accent-on-inverse` on navy is 7.9:1, not 7.2:1.

The tokens all pass. Only the quoted ratios are off.

### Two additions

- **Status colours on `surface-inverse`.** Investor OS needs them on the identity card, and
  RECS will need them on the summary strip ("status colour on the figure"). The light
  `danger` (`#B91C1C`) is about 2.6:1 on navy. Proposal: `ok-on-inverse` `#34D399` and
  `danger-on-inverse` `#F87171` (the dark-mode values, as Investor OS now ships them), and
  `accent-on-inverse` for watch/warn. Also name the tints (`ok-tint`, `danger-tint`,
  `info-tint`, `accent-tint`) in §2.
- **§7, the link rule:** Investor OS has now adopted `accent-text` for light-mode links and
  amber text, so this item can close.

## 4. Contrast, before and after

"Before" is master at `ee30d87` (brand.md v0.3's first three values already applied); "after"
is this branch. Values are WCAG contrast ratios; ✗ marks a pair under its bar; "—" means the
token did not exist.

### Pairs brand.md §2 names (asserted by the test)

| Pair | Bar | Light before | Light after | Dark before | Dark after |
| --- | --- | --- | --- | --- | --- |
| `ink` on `background` | 4.5 | 17.2 | 17.2 | 15.4 | 15.4 |
| `ink` on `surface` | 4.5 | 17.9 | 17.9 | 13.8 | 13.8 |
| `ink` on `surface-subtle` | 4.5 | 17.2 | 16.3 | 14.5 | 14.5 |
| `ink-strong` on `background` | 4.5 | 17.0 | 17.0 | 18.3 | 18.3 |
| `ink-strong` on `surface` | 4.5 | 17.7 | 17.7 | 16.3 | 16.3 |
| `ink-strong` on `surface-subtle` | 4.5 | 17.0 | 16.1 | 17.2 | 17.2 |
| `ink-muted` on `background` | 4.5 | 7.2 | 7.2 | 7.5 | 7.5 |
| `ink-muted` on `surface` | 4.5 | 7.6 | 7.6 | 6.7 | 6.7 |
| `ink-muted` on `surface-subtle` | 4.5 | 7.2 | 6.9 | 7.1 | 7.1 |
| `accent-text` on `background` | 4.5 | — | 4.8 | — | 11.4 |
| `accent-text` on `surface` | 4.5 | — | 5.0 | — | 10.2 |
| `ink-on-inverse` on `surface-inverse` | 4.5 | — | 16.3 | — | 18.3 |
| `ink-muted-on-inverse` on `surface-inverse` | 4.5 | — | 6.7 | — | 7.5 |
| `accent-on-inverse` on `surface-inverse` | 4.5 | — | 7.9 | — | 8.9 |
| `on-accent` on `accent` | 4.5 | 5.4 | 5.4 | 7.9 | 7.9 |
| `on-accent` on `accent-hover` | 4.5 | 7.9 | 7.9 | 5.4 | 5.4 |
| `ok` on `surface` | 4.5 | — | 5.5 | — | 8.9 |
| `warn` on `surface` | 4.5 | — | 5.0 | — | 10.2 |
| `danger` on `surface` | 4.5 | — | 6.5 | — | 6.2 |
| `info` on `surface` | 4.5 | — | 7.6 | — | 6.7 |
| `chart-1` on `surface` | 3 | — | 3.2 | — | 7.9 |
| `chart-2` on `surface` | 3 | — | 10.4 | — | 11.5 |
| `chart-3` on `surface` | 3 | — | 5.5 | — | 8.9 |

At the token level master already passed every pair it could express. The failures were in
how the tokens were used, which is what the next table shows.

### What the screens actually drew

| Where | Before | After |
| --- | --- | --- |
| Amber text and links, light (`#D97706` on white) | 3.2 ✗ | 5.0 (`#B45309`) |
| Amber text, dark (`text-amber-600` with no dark pair, on `#1A1A2E`) | 5.4 | 10.2 (`#FBBF24`) |
| Readable `foreground-tertiary` text, light, on white / page | 2.5 ✗ / 2.4 ✗ | 7.6 / 7.2 (`ink-muted`) |
| Readable `foreground-tertiary` text, dark, on `surface` / page | 3.5 ✗ / 3.9 ✗ | 6.7 / 7.5 |
| Radar axis labels on the navy identity card, light | 2.3 ✗ | 6.7 (`ink-muted-on-inverse`) |
| Amber callout text, light (amber-800 on amber-50 → accent-text on accent-tint) | 6.8 | 4.8 |
| Amber callout text, dark (amber-200 on amber-950 → accent-text on accent-tint) | 12.0 | 9.2 |
| Score text, light (red-600 / emerald-600 on white) | 4.8 / 3.8 ✗ | 6.5 / 5.5 (`danger` / `ok`) |
| Score text, dark (same classes, no dark pair, on `#1A1A2E`) | 3.5 ✗ / 4.5 | 6.2 / 8.9 |
| Identity card sub-scores on navy, light (red-600 / emerald-600) | 3.5 ✗ / 4.5 | 6.2 / 8.9 (on-inverse) |
| Error banner text (red-700 on red-50 → danger on danger-tint), light / dark | 5.9 / 8.5 | 5.9 / 5.9 |
| Success badge text (emerald-700 on emerald-100 → ok on ok-tint), light | 4.8 | 5.2 |
| Completed checkbox tick (white on emerald-500) | 2.5 ✗ | 5.5 light / 8.9 dark |

The callouts lose some contrast in return for sitting on brand tokens. Both modes still clear
4.5:1.
