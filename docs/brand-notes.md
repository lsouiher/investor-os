# Brand notes: Investor OS on brand.md

Working notes on carrying `docs/brand.md` (v0.4 as corrected on 2026-10-23, copied unchanged
from RECS) into Investor OS. v0.3 and v0.4 reached master together in PR #9. brand.md
stays the source of truth and nothing here changes it. §3 records what v0.4 adopted from this
file's proposals and what the same-day correction settled.

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
| `ink-faint` | `--ink-faint` | `#9CA3AF` | `#6B7280` | v0.4: renamed from `--foreground-tertiary` |
| `accent` | `--accent` | `#D97706` | `#F59E0B` | none (v0.3 commit) |
| `accent-on-inverse` | `--accent-on-inverse` | `#F59E0B` | `#F59E0B` | new |
| `accent-hover` | `--accent-hover` | `#F59E0B` | `#D97706` | none (v0.3 commit) |
| `accent-text` | `--accent-text` | `#B45309` | `#FBBF24` | new |
| `on-accent` | `--on-accent` | `#1A1A2E` | `#1A1A2E` | none (v0.3 commit) |
| `ok` / `warn` / `danger` / `info` | same names | §2 values | §2 values | new |
| `ok-on-inverse` / `danger-on-inverse` | same names | `#34D399` / `#F87171` | same | v0.4 names them |
| `accent-tint` / `danger-tint` | same names | §2 values | §2 values | v0.4 names them |
| `ok-tint` | `--ok-tint` | `#ECFDF5` | `#16261F` | v0.4: dark was `#172A24` |
| `info-tint` | `--info-tint` | `#F1F5F9` | `#1C2130` | v0.4: dark was `#1E2433` |
| `chart-1..3` | `--chart-1..3` | accent / `#334155` / ok | accent / `#CBD5E1` / ok | new |

Each has a Tailwind `@theme` colour (`text-accent-text`, `bg-surface-dark`, `text-ok`...).
Radii follow §4: `--radius-button` 0, `--radius-default` 4 (inputs), `--radius-card` 8, and a
new `--radius-pill` 999.

Kept, not in brand.md: `--foreground-secondary` (same as `ink-muted` in light, `#D1D5DB`
dark). Since v0.4 every other Investor OS colour variable is a brand.md token, and the drift
test maps all of them. `--score-red/amber/emerald` are gone; their users now take
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
| the remaining `foreground-tertiary` (v0.4, 11 places) | `ink-faint`: placeholders in `tasks/page.tsx` and `contact-form.tsx`, the two disabled states in `audit-form-shell.tsx`, status dots in `hub/page.tsx` and `identity/history/page.tsx`, one hover border in `PathCard.tsx` |
| `bg-accent/10` (landing eyebrow, "built by" tile), `bg-danger-tint/30` (two badges) | `bg-accent-tint`, `bg-danger-tint` (v0.4) |
| `foreground-secondary`/`-muted` text on `accent-tint` (next-best-action reasons ×3, tasks form impact label, selected history row, hovered rating buttons) | `text-accent-text` (v0.4: a tint carries its own status colour's text) |
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
| secondary/ghost buttons, checkboxes, the 1–5 rating buttons, selectable rows (`rounded`/`-md`/`-lg`/`-full`) | `rounded-none` (§4: controls and buttons 0) |
| panels and callouts at `rounded-md` (6px), the identity card at `rounded-xl` (12px), one banner at `rounded` | `rounded-lg` (8px, §4: cards) |
| small badges and tags at `rounded` (4px) | `rounded-full` (§4: pills 999) |
| card `shadow-sm` (auth cards, landing example card, hub, hover lifts) | none; auth cards get a 1px `border`, hovers change colour instead |
| dialog `shadow-xl`/`shadow-lg` | `shadow-dialog` = §4's `0 10px 30px rgb(0 0 0 / .25)` (new `@theme` token) |
| growth export button `bg-foreground-strong text-background` (black in light, white in dark) | the §5 secondary: `border border-border text-foreground` |

`grep -rnoE '[a-z:]*amber-[0-9]+' frontend/app frontend/components` returns nothing, and
neither does the same grep for `red|emerald|gray|blue|purple|green|yellow` (rechecked for v0.4),
or for `foreground-tertiary`. The two opacity fills left carry no text, so they are not tints:
the hub's `bg-ok/40` progress connector and the identity card's `from-accent/10` glow on navy.

## 2. Changes beyond brand.md's letter

- **Tints and status on `surface-inverse`** started here and are brand.md tokens since v0.4
  (§3). Callout borders still use `border-accent/30` (and `danger/30`, `ok/30`), not a token.
- **Dark-mode edges on inverse surfaces (v0.4 §5).** Every `surface-inverse` element takes
  `dark:border-border` on each side facing the page: under the signed-out `SiteHeader` and the
  phone header, right of the sidebar, above the phone tab bar, and all four sides of the
  identity card. The tab bar's edge is on the `<nav>`, not the items, since each item already
  has `border-t-2` (transparent, or amber when active).
- **App icon (v0.4 §5).** `frontend/app/icon.svg` is §5's SVG as written. The create-next-app
  `favicon.ico` is deleted: Next 16 emits a `sizes="any"` link for each, and the browser could
  keep the old one.
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
- **Disabled controls take `ink-faint`** (was `foreground-tertiary`). These are the two
  `cursor-not-allowed` states in the audit form. WCAG 1.4.3 exempts inactive components.
- **Dead hovers.** `text-foreground-muted hover:text-foreground-secondary` changed nothing in
  light mode, because both are `#4B5563`. These hovers now go to `foreground-strong`.
- **Calculators link.** It opens RECS in a new tab, and it appears in the sidebar nav, the
  phone header band and the signed-out header band. The frontend has no `.env.example`, so
  `NEXT_PUBLIC_RECS_URL` is documented in `frontend/.env.local.example`, the frontend
  Dockerfile's build args and `docs/deploy.md`.

Left as they were (follow-ups, not regressions):

- Code comments, the backend `package.json` description and the Dockerfile headers still say
  "InvestorOS"; every string a user sees (page title, copy, locales, the PDF blueprint, the
  growth export and the reset email) says "Investor OS".

Kept on purpose: the contacts and tasks filter chips stay pills (`rounded-full`), being
pills, and the roadmap's milestone nodes stay circles, being timeline markers rather than
checkboxes. Loading skeletons for text lines keep 4px.

Seen in the browser: every signed-in page (dashboard, hub, identity, history, strategies,
strategy detail, tasks, contacts, simulation, growth strategy, an audit) in light and dark
at 1280px, and dashboard and identity at 390px, with a seeded user against the mock AI. That
pass caught the export button above. Path icons are emoji, which the headless browser had no
font for; a real browser draws them.

## 3. brand.md v0.4

### Adopted from the v0.3 proposals

- `ink-faint` (`#9CA3AF` / `#6B7280`) for placeholders, disabled controls and decorative dots,
  never readable text. Investor OS renamed `--foreground-tertiary` to it rather than mapping
  the old name.
- The four tints and `ok-/danger-on-inverse`, plus the rule that a tint carries its own status
  colour's text, never `ink-muted`. v0.4 changes two dark tints: `ok-tint` `#16261F` (ok on it
  8.2:1, was 7.8 on `#172A24`) and `info-tint` `#1C2130` (info 6.3:1, was 6.0 on `#1E2433`).
- The dark band: v0.4 keeps the shared token values and adds a 1px `border` edge on the side
  of an inverse band that faces the page (§5). The default stays "follow the system".
- The app icon: the amber square on a navy tile (§5). A wordmark lockup is still open (§7).
- The three corrected ratios, and §7's link item is closed.

### Settled by the same-day correction of v0.4

Investor OS raised four points after the first v0.4 copy; RECS corrected brand.md the same day,
before either product committed it, and this branch carries the corrected file:

- §2's intro now gives `#F59E0B` on navy as 7.9:1, matching the `accent-on-inverse` row (it
  measures 7.94; the first v0.4 said 7.2).
- The `ok-on-inverse` row now gives light `ok` on navy as 3.1:1 (`#047857` on `#1A1A2E`, 3.11;
  the first v0.4 said 2.6, which is the light `danger` figure).
- §5's edge rule is about inverse surfaces, not bands: a card or hero takes the dark-mode edge
  on all four sides. The identity card now has `dark:border dark:border-border`.
- §5 says a decorative gradient or glow over an inverse surface is not a tint, so the identity
  card's `from-accent/10` glow stays.

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
| Success badge text (emerald-700 on emerald-100 → ok on ok-tint), light / dark | 4.8 / — | 5.2 / 8.2 |
| Completed checkbox tick (white on emerald-500) | 2.5 ✗ | 5.5 light / 8.9 dark |

The callouts lose some contrast in return for sitting on brand tokens. Both modes still clear
4.5:1.
