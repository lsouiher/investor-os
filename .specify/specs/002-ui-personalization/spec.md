# 002 — UI Personalization: Dark Mode & French Language

**Status:** Draft
**Date:** 2026-04-04
**Branches:** `002-dark-mode` (theme), `003-french-i18n` (language)

---

## Overview

Add two user-facing personalization features to InvestorOS: a dark/light theme toggle and French language support. These are independent features sharing a spec but implemented on separate branches.

---

## Feature A: Dark Mode

### Summary
Allow users to switch between light and dark color themes, with system preference detection and persistence.

### Functional Requirements

| ID | Requirement |
|----|-------------|
| DM-01 | App supports three theme modes: light, dark, system (follows OS preference) |
| DM-02 | Theme preference persists across sessions via localStorage |
| DM-03 | No flash of wrong theme on page load (FOUC prevention via inline script) |
| DM-04 | Theme toggle is accessible from sidebar (desktop) and bottom nav area (mobile) |
| DM-05 | All pages render correctly in both themes with sufficient contrast |
| DM-06 | SVG charts (radar, sparkline, gauge) adapt colors to current theme |
| DM-07 | Identity card dark variant remains visually distinct from page background in dark mode |
| DM-08 | Score colors (red/amber/emerald) remain distinguishable in both themes |
| DM-09 | Colored badges (status, category) remain readable in both themes |
| DM-10 | System preference changes are detected in real-time when in "system" mode |

### Technical Approach

- **No new dependencies** — custom ThemeProvider (~50 lines) instead of `next-themes`
- **CSS custom variables** — dark overrides via `.dark` class on `<html>`
- **Tailwind v4** — `@custom-variant dark (&:where(.dark, .dark *))` for class-based dark mode
- **New semantic tokens** — replace hardcoded gray-scale Tailwind classes (`bg-white`, `text-gray-600`, etc.) with theme-aware tokens (`bg-surface-card`, `text-foreground-secondary`)

### Dark Palette

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `#FAFAFA` | `#0F0F17` |
| `--surface-card` | `#FFFFFF` | `#1A1A2E` |
| `--surface-dark` | `#1A1A2E` | `#0F0F17` |
| `--surface-subtle` | `#F9FAFB` | `#151525` |
| `--foreground` | `#171717` | `#E5E7EB` |
| `--foreground-muted` | `#6B7280` | `#9CA3AF` |
| `--foreground-strong` | `#111827` | `#F9FAFB` |
| `--foreground-secondary` | `#4B5563` | `#D1D5DB` |
| `--foreground-tertiary` | `#9CA3AF` | `#6B7280` |
| `--border` | `#E5E7EB` | `#2D2D44` |
| `--border-muted` | `#F3F4F6` | `#1F1F35` |
| `--accent` | `#D97706` | `#D97706` (unchanged) |

### New Files
- `frontend/lib/theme.tsx` — ThemeProvider context + useTheme hook
- `frontend/components/shared/theme-toggle.tsx` — toggle button component

### Modified Files
- `frontend/app/globals.css` — dark tokens, new semantic tokens, @custom-variant
- `frontend/app/layout.tsx` — inline script + ThemeProvider wrapper
- `frontend/app/(authenticated)/layout.tsx` — toggle placement
- `frontend/app/page.tsx` — toggle for unauthenticated users
- ~30 component/page files — replace hardcoded gray classes with semantic tokens

### Success Criteria

| # | Criterion |
|---|-----------|
| SC-DM-01 | Toggle cycles through light/dark/system with correct icon |
| SC-DM-02 | Page loads in correct theme without flash (test: set dark in localStorage, hard refresh) |
| SC-DM-03 | All text meets WCAG AA contrast ratio (4.5:1) in both themes |
| SC-DM-04 | Charts and SVGs render legibly in dark mode |
| SC-DM-05 | localStorage `theme` key correctly persists user choice |
| SC-DM-06 | System mode tracks OS preference changes in real-time |

---

## Feature B: French Language Support (EN/FR)

### Summary
Add French as a second language with a simple toggle. English remains the default. No URL-based locale routing.

### Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | App supports English (default) and French |
| FR-02 | Language toggle accessible from sidebar (desktop) and settings area (mobile) |
| FR-03 | Language preference persists across sessions via localStorage |
| FR-04 | All user-facing static text is translatable (labels, headings, buttons, empty states, error messages) |
| FR-05 | Dynamic content from API (AI-generated text, user input) is NOT translated |
| FR-06 | Number formatting respects locale (e.g., 1,000.50 vs 1 000,50) |
| FR-07 | Date formatting respects locale (e.g., Apr 4, 2026 vs 4 avr. 2026) |
| FR-08 | `<html lang="">` attribute updates to reflect active language |
| FR-09 | Pluralization is handled correctly in both languages |
| FR-10 | No page reload required when switching language |

### Technical Approach

- **Translation files** — JSON dictionaries at `frontend/locales/en.json` and `frontend/locales/fr.json`
- **LanguageProvider** — React context exposing `locale`, `setLocale`, and `t()` function
- **`t()` helper** — key-based lookup with interpolation support: `t("dashboard.welcome", { name })` → "Welcome, Leo" / "Bienvenue, Leo"
- **No URL routing** — language is a client-side preference, not a route segment
- **No `next-intl`** — keep it simple with a custom provider (~60 lines) + JSON files
- **Namespace by page/component** — flat keys with dot notation: `dashboard.title`, `audit.financial.heading`, `common.save`, etc.

### Translation Scope

| Category | Example Keys | Count (est.) |
|----------|-------------|--------------|
| Common | `common.save`, `common.cancel`, `common.loading`, `common.error` | ~30 |
| Navigation | `nav.dashboard`, `nav.identity`, `nav.strategy`, etc. | ~10 |
| Dashboard | `dashboard.title`, `dashboard.welcome`, `dashboard.readiness_score` | ~20 |
| Audits (5) | `audit.financial.title`, `audit.financial.income_label`, etc. | ~80 |
| Identity | `identity.archetype`, `identity.score`, `identity.history` | ~15 |
| Strategy | `strategy.title`, `strategy.blueprint`, `strategy.timeline` | ~20 |
| Contacts | `contacts.title`, `contacts.add`, `contacts.form.*` | ~20 |
| Tasks | `tasks.title`, `tasks.status.*` | ~15 |
| Growth | `growth.paths`, `growth.unlock`, `growth.insights` | ~20 |
| Auth | `auth.login`, `auth.register`, `auth.email`, `auth.password` | ~15 |
| Errors/Empty | `error.generic`, `empty.no_contacts`, etc. | ~15 |
| **Total** | | **~260 keys** |

### New Files
- `frontend/locales/en.json` — English translations
- `frontend/locales/fr.json` — French translations
- `frontend/lib/i18n.tsx` — LanguageProvider context + useTranslation hook + t() function

### Modified Files
- `frontend/app/layout.tsx` — LanguageProvider wrapper, dynamic `lang` attribute
- `frontend/app/(authenticated)/layout.tsx` — language toggle placement
- All page and component files — replace hardcoded strings with `t()` calls

### Success Criteria

| # | Criterion |
|---|-----------|
| SC-FR-01 | Toggle switches language without page reload |
| SC-FR-02 | All static UI text displays correctly in French |
| SC-FR-03 | localStorage `locale` key persists language choice |
| SC-FR-04 | Number and date formatting matches active locale |
| SC-FR-05 | `<html lang="fr">` is set when French is active |
| SC-FR-06 | Missing translation keys fall back to English gracefully |
| SC-FR-07 | Pluralization works correctly (e.g., "1 contact" vs "2 contacts" / "1 contact" vs "2 contacts") |

---

## Implementation Order

1. **Branch `002-dark-mode`** — Dark mode first (smaller scope, no string extraction needed)
2. **Branch `003-french-i18n`** — French i18n second (larger scope, benefits from stable component structure)

Both branches are independent and could technically be parallel, but sequential is simpler for review.

---

## Out of Scope

- Additional languages beyond French
- URL-based locale routing (`/fr/dashboard`)
- Server-side locale detection (Accept-Language header)
- Translation of AI-generated content
- RTL layout support
- Dark mode for PDF blueprint export (stays light for print)
