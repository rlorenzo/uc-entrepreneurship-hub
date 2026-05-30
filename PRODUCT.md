# Product

## Register

product

## Users

Three audiences share one catalog, each arriving with a different job and rarely much time:

- **Students (primary).** Have an idea or curiosity and want the next concrete step. They scan for what's open right now, what fits their stage (Idea → Scaling), and what won't collide with a courseload. Often on a phone, often comparing two or three options before committing.
- **Faculty & researchers.** Want to move work from lab to market: proof-of-concept funds, IP and licensing support, translational accelerators. They arrive with a specific need, not to browse.
- **Partners, mentors, and investors.** Want a single front door to engage across the whole system instead of campus-by-campus outreach.

The shared context: exploratory, decision-oriented, time-constrained, frequently mobile. People come to **decide where to apply**, not to read.

## Product Purpose

A unified, searchable, comparable catalog of every entrepreneurship program across all ten University of California campuses — incubators, accelerators, courses, funding, competitions, and maker spaces. The hub collapses a campus-by-campus scavenger hunt into one place where programs are described in standardized fields and can be compared apples-to-apples.

Success: a visitor lands, narrows 140+ programs down to the handful that fit their stage, eligibility, and interests, and leaves with a shortlist (and an application link) — without visiting ten separate campus sites.

## Brand Personality

**Institutional and trustworthy.** Public-university credibility: calm, authoritative, civic. Confidence is carried by clarity, accurate and sourced data, and restraint — not by flash or marketing inflation. The voice is plain and specific: it names real programs, real deadlines, and real campuses. Warmth comes from being genuinely useful to someone making a real decision, not from hype.

Three words: **credible, clear, civic.**

## Anti-references

- **Generic SaaS landing.** No gradient-on-dark hero clichés as a crutch, no endless grid of identical icon+heading+text feature cards, no big-number "hero metric" template, no gradient text. The home page earns attention with real content (programs, campuses, news), not template scaffolding.
- **Hypey startup.** No marketing buzzwords (streamline, supercharge, empower, transform, seamless, world-class), no neon gradients, no over-animation, no exclamation-point energy. This is a public resource, not a pitch deck.
- **Sterile admin dashboard.** The utility surfaces (discover, compare) must not collapse into all-gray dense tables with no warmth. Density serves scanning, but the UC identity, typography, and color should stay present even in the tool.

## Design Principles

1. **Comparison is the product.** The reason the hub exists is to make programs decidable side-by-side. Standardized fields, visual parity across cards, and honest gaps (show "not listed", don't fake completeness) matter more than any single page's polish.
2. **One front door, ten campuses.** Every screen is wayfinding first. Reduce the cognitive load of "which campus, which program type, what stage" into filters and signposts a stranger can navigate without instruction.
3. **Earn trust, don't claim it.** Accuracy is the brand. Date and source crawled data, never inflate counts or invent deadlines, and let the institutional restraint of the UC system read through the design.
4. **Clarity is accessibility.** For a public-good audience on every device and ability, legibility and navigability are the product, not a compliance checkbox. Contrast, keyboard paths, focus, and reduced-motion alternatives are designed in, not bolted on.
5. **Show the real ecosystem.** Concrete over abstract: name programs, surface live deadlines, render the actual ten-campus map. Specificity is what a marketing site can't fake and what makes this trustworthy.

## Accessibility & Inclusion

- **Floor: WCAG 2.2 AA, enforced in CI** (axe-core via Playwright + pa11y-ci). This is the non-negotiable baseline already wired into the build.
- **Target: WCAG 2.2 AAA where the UC palette allows.** Push body text toward 7:1 contrast; prefer larger hit targets and generous spacing. Where AAA fights the locked brand colors, AA wins and the trade-off is deliberate, not accidental. (Note: UC Blue `#1295d8` does **not** pass AA as text on white — `#005581` / `--fg-link` is the sanctioned text-on-light blue; keep bright UC Blue for dark-background accents only.)
- **Reduced motion is required, not optional.** Every animation needs a `prefers-reduced-motion: reduce` alternative (crossfade or instant).
- **Color-blind-safe encoding.** Campus and program-type colors are decorative reinforcement, never the sole carrier of meaning — always pair color with a label, icon, or text.
- **Keyboard-first and screen-reader sound.** Visible focus, logical tab order, standalone link text, and labeled controls across the discover/compare/detail flows.
