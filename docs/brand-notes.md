# Brand notes: Investor OS on brand.md

Working notes on carrying `docs/brand.md` (v0.3, copied unchanged from RECS) into Investor OS.
brand.md stays the source of truth; nothing here changes it. Items under "Proposed for v0.4"
are for the next brand.md revision, to be made in RECS first.

## Proposed for v0.4

### `foreground-tertiary`: never readable text

Investor OS had a fourth text grey that brand.md does not name: `--foreground-tertiary`,
`#9CA3AF` light (2.5:1 on white, 2.4:1 on the page) and `#6B7280` dark (3.5:1 on `surface`).
It carried 51 pieces of readable text: section headings, dates, empty-state messages,
disclaimers, completed (struck-through) items, the sidebar footer links.

Chosen fix: **move readable text to `ink-muted`** (`--foreground-muted`, 7.6:1 light, 6.7:1
dark on `surface`) rather than raising the token. brand.md has three text greys and a
fourth one that passes 4.5:1 on `surface-subtle` would sit within a few points of
`ink-muted`, so it would not read as a separate step anyway. The token stays, documented in
`globals.css` as placeholders, disabled controls (WCAG 1.4.3 exempts inactive components)
and decorative fills (status dots) only.

Proposal: add `ink-faint` to §2 with that restricted use, so both products name the same
grey for placeholders and disabled states and nobody reaches for it for text:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `ink-faint` | `#9CA3AF` | `#6B7280` | placeholders, disabled controls, decorative dots; never readable text |
