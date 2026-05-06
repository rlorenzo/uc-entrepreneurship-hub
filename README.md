# UC Entrepreneurship Hub

A unified front door for entrepreneurship programs across all ten University of California campuses — incubators, accelerators, courses, funding, competitions, and maker spaces in one searchable, comparable catalog.

## Stack

Built on [**Vite+**](https://viteplus.dev) — the unified open-source toolchain that bundles Vite, Vitest, Oxlint, Oxfmt, Rolldown, and tsdown into a single `vp` CLI.

- **React 18** + **TypeScript** (strict)
- **React Router** (HashRouter, for static-host deep links)
- **CSS variables** from the official UC design tokens (Source Serif 4 + Source Sans 3, UC Blue / Dark Blue / Gold, square corners, Dark Blue tinted shadows)

## Develop

**Requires Node.js 24** (the LTS as of early 2026). The crawler scripts run TypeScript natively under `node` — `node scripts/crawl/run.ts` only works because Node ≥22 strip-types is the default and explicit `.ts` import extensions resolve out of the box. Use `vp env use 24` (Vite+ ships Node version management) or your usual version manager.

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
├── App.tsx                    # router + compare provider
├── main.tsx                   # entry
├── styles/
│   ├── tokens.css             # UC design tokens (verbatim from brand guide)
│   └── global.css             # resets + body defaults
├── data/
│   ├── types.ts               # Campus, Program, ProgramType, Spotlight
│   ├── campuses.ts            # 10 UC campuses with map coords, colors, hubUrl
│   ├── types-list.ts          # program types, industries, stages, eligibility, durations
│   ├── normalize.ts           # slug + canonical type/industry/stage helpers, mergePrograms
│   ├── programs.ts            # curated programs + spotlight stories (merges crawled data)
│   └── programs.generated.ts  # AUTO: written by `vp run build-data`
├── lib/                       # icons, compare cart context, program gradient
├── components/                # Nav, Footer, Page, ProgramCard, CaliforniaMap, etc.
└── pages/                     # HomePage, DiscoverPage, ProgramDetail, CampusPage, etc.

scripts/crawl/
├── sites.json                 # campus seed URLs
├── run.ts                     # Playwright crawler (worker pool over campuses)
├── extract.ts                 # link discovery + in-page program extractor
├── build-data.ts              # data/crawled/*.json → src/data/programs.generated.ts
└── campuses/                  # per-campus override hooks (allowlist, denylist, name filters)

data/crawled/                  # one JSON file per campus, written by `vp run crawl`
```

## Data pipeline

The catalog is a merge of **curated** programs (hand-shaped in `src/data/programs.ts`) and **crawled** programs (auto-extracted from each campus's innovation hub). On conflict, the curated record wins; the crawled record fills in optional fields the curated copy is missing (`website`, `applicationLink`, `sourceUrl`, `lastUpdated`, `longDescription`).

### Refresh the catalog

```bash
# install Playwright's chromium once
vp install
vp exec playwright install chromium

# crawl every campus (≈ 5–10 min over a fast connection)
vp run crawl

# scope to a subset
vp run crawl -- --campus=berkeley,la --limit=10

# walk the seed but skip extraction
vp run crawl -- --campus=sd --dry-run

# regenerate src/data/programs.generated.ts from data/crawled/*.json
vp run build-data

# the combined shortcut
vp run refresh-data
```

Weekly automation: `.github/workflows/weekly-crawl.yml` runs `refresh-data` every Sunday and commits the regenerated module. Trigger it on demand from the Actions tab via _Run workflow_.

### Program schema

Required fields stay stable for back-compat with the design prototype's curated cards:

```ts
interface Program {
  id: string; // also acts as the URL slug
  slug?: string; // explicit slug (defaults to id)
  name: string;
  campus: string; // CAMPUSES.id
  type: string; // canonical type (TYPES.id)
  desc: string; // card-length summary
  industries: string[]; // canonical industry labels
  stage: "Idea" | "Prototype" | "Pre-seed" | "Scaling";
  eligibility: string[];
  duration: string;
  funding: string;
  selectivity: string;
  cohortSize: number | null;
  deadline: string;

  // Optional, filled in by the crawler when available:
  longDescription?: string;
  deadlines?: { label?: string; date?: string }[];
  website?: string;
  applicationLink?: string;
  associatedCenter?: string;
  tags?: string[];
  lastUpdated?: string; // ISO 8601, set by the crawler
  sourceUrl?: string; // page the program was extracted from
  featured?: boolean;
  eyebrow?: string;
}
```

`canonicalType` / `canonicalIndustries` / `canonicalStage` in `src/data/normalize.ts` map noisy upstream phrasing ("startup accelerator", "AI/ML", "machine learning") onto the design's controlled vocabulary.

### Adding a new campus

1. Append the campus to `src/data/campuses.ts` (id, color, map x/y, `hubUrl`).
2. Add the matching entry to `scripts/crawl/sites.json`.
3. Drop `scripts/crawl/campuses/<id>.mjs` re-exporting from `_default.mjs`. Override `linkAllowlist`, `linkDenylist`, `allowName`, or `maxSubpages` only when the defaults pull in junk.
4. Run `vp run refresh-data`.

If a campus's site is JS-heavy and the generic extractor returns nothing, the override module is the right place to bolt in a custom `discover` selector — keep that surgery campus-local.

## Routes

| Path           | Page                                                       |
| -------------- | ---------------------------------------------------------- |
| `/`            | Home                                                       |
| `/discover`    | Program discovery (with `?q=`, `?campus=`, `?type=`, etc.) |
| `/program/:id` | Program detail                                             |
| `/campus/:id`  | Campus page                                                |
| `/campuses`    | All campuses index                                         |
| `/compare`     | Comparison tool                                            |

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
