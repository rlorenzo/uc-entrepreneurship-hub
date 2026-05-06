# UC Entrepreneurship Hub

A unified front door for entrepreneurship programs across all ten University of California campuses — incubators, accelerators, courses, funding, competitions, and maker spaces in one searchable, comparable catalog.

Implemented from a Claude Design HTML/CSS/JS prototype as a production React app.

## Stack

Built on [**Vite+**](https://viteplus.dev) — the unified open-source toolchain that bundles Vite, Vitest, Oxlint, Oxfmt, Rolldown, and tsdown into a single `vp` CLI.

- **React 18** + **TypeScript** (strict)
- **React Router** (HashRouter, for static-host deep links)
- **CSS variables** from the official UC design tokens (Source Serif 4 + Source Sans 3, UC Blue / Dark Blue / Gold, square corners, Dark Blue tinted shadows)

## Develop

```bash
# install Vite+ globally if you haven't
curl -fsSL https://vite.plus | bash

# install deps
vp install

# dev server
vp dev

# format + lint + type-check
vp check

# auto-fix formatting
vp check --fix

# tests
vp test

# production build
vp build

# preview production build
vp preview
```

## Project layout

```
src/
├── App.tsx              # router + compare provider
├── main.tsx             # entry
├── styles/
│   ├── tokens.css       # UC design tokens (verbatim from brand guide)
│   └── global.css       # resets + body defaults
├── data/
│   ├── types.ts         # Campus, Program, ProgramType, Spotlight
│   ├── campuses.ts      # 10 UC campuses with map coords + colors
│   ├── types-list.ts    # program types, industries, stages, eligibility, durations
│   └── programs.ts      # 23 real-sounding UC programs + spotlight stories
├── lib/
│   ├── icons.tsx        # 20 single-use SVG icons
│   ├── compare.tsx      # compare cart context (max 4)
│   └── programGradient.ts
├── components/
│   ├── Nav.tsx          # utility bar + sticky nav
│   ├── Footer.tsx
│   ├── Page.tsx         # nav + main + footer wrapper
│   ├── Breadcrumbs.tsx
│   ├── CaliforniaMap.tsx # SVG map with hover tooltips, hero/standalone variants
│   ├── CardArt.tsx      # gradient + monogram card hero
│   ├── ProgramCard.tsx
│   ├── Pill.tsx         # Pill, TypePill, CampusBadge
│   └── Eyebrow.tsx
└── pages/
    ├── HomePage.tsx     # hero, featured strip, category grid, map, spotlights, audience band
    ├── DiscoverPage.tsx # filter sidebar, search, sort, grid/list view, active chips
    ├── ProgramDetail.tsx
    ├── CampusPage.tsx
    ├── CampusesPage.tsx
    └── ComparePage.tsx  # side-by-side standardized comparison table
```

## Routes

| Path | Page |
|------|------|
| `/` | Home |
| `/discover` | Program discovery (with `?q=`, `?campus=`, `?type=`, etc.) |
| `/program/:id` | Program detail |
| `/campus/:id` | Campus page |
| `/campuses` | All campuses index |
| `/compare` | Comparison tool |

## Deployment

GitHub Actions workflow at `.github/workflows/deploy.yml` builds on every push to `main` and publishes to GitHub Pages. The workflow:

1. Installs Vite+ globally
2. Runs `vp check` (format + lint + type-check)
3. Runs `vp build` with `VITE_GH_PAGES=1` so assets resolve under `/uc-entrepreneurship-hub/`
4. Copies `index.html` to `404.html` so hash-router deep links work
5. Uploads `dist/` and deploys

To enable: in the GitHub repo settings, **Settings → Pages → Source: GitHub Actions**.

## Credits

- Design system: [UC Brand Guide](https://brand.universityofcalifornia.edu/)
- Design prototype: handed off from [Claude Design](https://claude.ai/design)
- Toolchain: [Vite+](https://viteplus.dev)
