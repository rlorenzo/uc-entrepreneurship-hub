---
name: UC Entrepreneurship Hub
description: A searchable, comparable catalog of UC entrepreneurship programs, dressed as an institutional blue-and-gold field guide.
colors:
  uc-blue: "#1295D8"
  uc-gold: "#FFB511"
  uc-dark-blue: "#002033"
  uc-blue-deep: "#005581"
  uc-blue-light: "#72CDF4"
  uc-blue-xlight: "#BDE3F6"
  uc-gold-bright: "#FFD200"
  uc-gold-light: "#FFE552"
  uc-teal: "#00778B"
  uc-teal-light: "#00A3AD"
  uc-pink: "#E44C9A"
  uc-orange: "#FF6E1B"
  ink: "#002033"
  ink-secondary: "#4C4C4C"
  ink-muted: "#5B5D5E"
  paper: "#FFFFFF"
  surface-warm: "#F7F5F1"
  warm-gray-1: "#DBD5CD"
  hairline: "#BEB6AF"
  status-success: "#2D7A3E"
  status-warning: "#FF6E1B"
  status-error: "#B3122F"
typography:
  display:
    fontFamily: "Source Serif 4, Lyon Text, Georgia, serif"
    fontSize: "clamp(40px, 5.6vw, 72px)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Source Serif 4, Lyon Text, Georgia, serif"
    fontSize: "clamp(32px, 4vw, 56px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Source Serif 4, Lyon Text, Georgia, serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  lede:
    fontFamily: "Source Serif 4, Lyon Text, Georgia, serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  body:
    fontFamily: "Source Sans 3, Kievit, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.56
    letterSpacing: "normal"
  label:
    fontFamily: "Source Sans 3, Kievit, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.12em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
components:
  button-primary:
    backgroundColor: "{colors.uc-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.uc-blue-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.uc-blue-deep}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-gold:
    backgroundColor: "{colors.uc-gold}"
    textColor: "{colors.uc-dark-blue}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px 22px"
  pill-industry:
    backgroundColor: "#EBF1F5"
    textColor: "{colors.uc-blue-deep}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  type-chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  compare-toggle:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  compare-toggle-active:
    backgroundColor: "{colors.uc-blue-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "6px 10px"
  search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px"
---

# Design System: UC Entrepreneurship Hub

## 1. Overview

**Creative North Star: "The Systemwide Field Guide"**

This is the single front door to every entrepreneurship program across all ten University of California campuses: incubators, accelerators, courses, funding, competitions, and maker spaces, described in standardized fields so a stranger can compare them apples to apples. It carries the identity all ten campuses share, so it reads as an institutional public resource, not a startup's pitch. The metaphor is a printed field guide to a varied ecosystem: a serif voice for headlines and program names, official UC blue and gold as the spine, generous column measure, and a calm, navigable structure that helps someone find their way rather than impressing them. Authority comes from accuracy and typography, never from decoration.

The palette is the official UC systemwide blue and gold, applied with discipline, over a paper-white surface warmed by the UC warm-gray neutral (`#F7F5F1`) on grouped sections and page heroes. Every other hue is a working color that earns its place as _data_: the seven program-type colors and the ten campus navies are the legend of the guide. A color on a card is never mood; it tells you which campus a program belongs to and what kind of program it is. The signature card artwork is literally this encoding made visible, a 135-degree gradient from the campus navy into the program-type hue.

Because the audience is students, faculty, and partners making a real decision under time pressure, the artifact's job is wayfinding, and the discipline that overrides every aesthetic impulse is clarity: AA contrast as the enforced floor (axe and pa11y run in CI) pushing toward AAA where the palette allows, a loud focus ring, real `<button>`/`<th>` semantics, color paired with text or icon so it never carries meaning alone, and motion that disappears under `prefers-reduced-motion`. This system explicitly rejects the reflexes of its neighbors: no generic SaaS landing (gradient-on-dark hero clichés, identical feature-card grids, the big-number hero-metric template, gradient text), no hypey startup voice (buzzwords, neon, over-animation), and no sterile all-gray admin dashboard. Density serves scanning, but the UC identity stays present even inside the tool.

**Key Characteristics:**

- Editorial and institutional; a public field guide rather than a product pitch.
- Official UC blue-and-gold as the spine; campus and program-type hues only as a data legend.
- Paper-white with a warm off-white (`#F7F5F1`) for grouped surfaces; hairline borders, near-flat at rest.
- Serif display voice (Source Serif 4) over humanist-sans body (Source Sans 3).
- Comparison and accessibility are visible design features, not afterthoughts.

## 2. Colors: The Blue-and-Gold Legend

The palette is the University of California systemwide brand, hex-exact, with a small set of derived working tokens for surface, text, and status, plus two categorical legends (program type and campus) that do the catalog's real work.

### Primary

- **UC Blue** (#1295D8): The signature systemwide blue. Primary-action buttons, the active nav underline, the "incubator" type color, and brand moments on dark surfaces. Carries identity, not just emphasis. **Never use as text on white** (it fails AA); reach for UC Blue Deep instead.
- **UC Gold** (#FFB511): The systemwide gold. Featured badges, the audience CTA band, and the rare paired highlight against blue. The "funding" type color. Never body text; it cannot meet contrast on white.
- **UC Dark Blue / Ink** (#002033): The primary text color, the dark hero and utility-bar surface, and strong rules. The deepest brand blue, used where most systems would reach for black.

### Secondary

- **UC Blue Deep** (#005581): The interactive ink. Links, the default accent (`--accent`), eyebrows, pill borders and tint text, the "accelerator" type color, and the focus-ring color. The workhorse blue, dark enough for AA text on paper.
- **UC Light Blue** (#72CDF4) / **UC Extra-Light Blue** (#BDE3F6): Hero subheads and utility text on dark blue, hovered surfaces, sparing decorative tint.
- **UC Bright Gold** (#FFD200) / **UC Light Gold** (#FFE552): Secondary gold steps; data and hover only.

### Tertiary (the program-type legend)

Seven fixed colors, one per program type. They appear on type chips, the industry/type pills, the category markers, and as the second stop of the card-art gradient. Each enters only to distinguish a kind of program.

- **Incubator** UC Blue (#1295D8), **Accelerator** UC Blue Deep (#005581), **Certificate** UC Teal (#00778B), **Funding** UC Gold (#FFB511), **Competition** UC Pink (#E44C9A), **Maker space** UC Orange (#FF6E1B), **Mentorship** UC Gray-Mid (#5B5D5E).
- Extended data hues (charts, accents): **UC Teal-Light** (#00A3AD), **UC Pink-Light** (#FEB2E0), **UC Orange-Light** (#FF8F28).

### Neutral

- **Ink Secondary** (#4C4C4C): Card descriptions, captions, metadata, blurbs. AA on white.
- **Ink Muted** (#5B5D5E): Quietest metadata and the "mentorship" marker. Darkened from UC's `#7C7E7F` to clear AA on white.
- **Paper** (#FFFFFF): The base page and card stock.
- **Surface Warm** (#F7F5F1): The warm off-white for grouped sections, page heroes, and active campus rows. Derived from UC Warm Gray 1; this is the brand's own warmth, not a generic cream.
- **Warm Gray 1** (#DBD5CD) and **Hairline** (#BEB6AF): The deeper warm neutral and the tertiary hairline / disabled tone.
- **Borders** are translucent dark blue (`rgba(0,32,51,0.08–0.20)`), not solid gray, so edges read as the brand's ink at low opacity. Shadows tint the same way.

### Status (semantic, derived)

- **Success** (#2D7A3E), **Warning** (#FF6E1B / UC Orange), **Error** (#B3122F), **Info** (#1295D8 / UC Blue). The success and error tones are derived to clear WCAG AA on white while staying in the brand's cool family.

### Named Rules

**The Blue-and-Gold Spine Rule.** UC Blue and UC Gold are the only colors permitted to carry identity. Every other hue must justify itself as data: which campus, which program type, which status. If a color is not distinguishing one thing from another, it does not belong on the page.

**The Campus-and-Type Legend Rule.** Categorical color comes only from two fixed sets: the ten official campus navies (`#003262` Berkeley, `#022851` Davis, `#2774AE` UCLA, and so on) and the seven program-type hues. Do not invent new categorical colors. The card-art gradient is `linear-gradient(135deg, <campus navy> 0%, <type hue> 100%)`, and that is the only place the two legends combine.

**The Contrast-First Rule.** Text and small-fill colors are chosen for WCAG AA on paper first, brand vibrancy second. Never use raw UC Blue (#1295D8), UC Gold (#FFB511), UC Orange (#FF6E1B), UC Pink (#E44C9A), or UC Light Blue (#72CDF4) as text or small-pill fills on white. Use UC Blue Deep (#005581) for blue text and the darkened status tokens for status.

## 3. Typography

**Display Font:** Source Serif 4 (with Lyon Text, Georgia, serif)
**Body Font:** Source Sans 3 (with Kievit, Arial, sans-serif)
**Mono Font:** `ui-monospace`, SF Mono, Menlo, Consolas, for figures in tabular contexts.

**Character:** A humanist serif for headlines, program names, and figures, paired with a humanist sans for reading and UI. Source Sans 3 stands in for UC's proprietary wordmark face Kievit, sharing its contemporary-but-rooted humanist bones; Source Serif 4 stands in for Lyon and gives the guide its editorial authority. UC sanctions Arial as the fallback for Kievit and Georgia for Lyon.

### Hierarchy

- **Display** (600, `clamp(40px, 5.6vw, 72px)`, line-height ~1.05, letter-spacing -0.01em): Home hero and page-hero titles. Fluid, so it behaves like a printed headline at any width. Use `text-wrap: balance`.
- **Headline** (600, `clamp(32px, 4vw, 56px)`, line-height 1.1): Major section openers ("Flagship programs across the system"). Serif.
- **Title** (600, 22px, line-height 1.2): Program-card names and subsection headings, set in the serif so a program name reads with gravity. Use `text-wrap: pretty`.
- **Stat / Figure** (600, serif, 32–200px): The serif carries quantitative figures, the category counts, and the oversized campus-initial watermark on card art. A number set in the serif reads as a printed figure.
- **Lede** (400, 24px serif, line-height 1.45): Hero subheads and section intros, in the serif at reading weight.
- **Body** (400, 18px sans, line-height 1.56): Reading text. Hold prose measure to roughly 65–75ch (max ~680px content column). Denser UI runs 14–16px.
- **Label / Eyebrow** (600, 12px sans, letter-spacing 0.12–0.14em, uppercase): Section kickers, filter labels, pill and chip text, the "HUB" lockup. The wide tracking is the guide's small-caps voice.

### Named Rules

**The Serif-for-Significance Rule.** Serif (Source Serif 4) carries headlines, program names, and figures; sans (Source Sans 3) carries everything you read in quantity and every UI control. Do not set body copy or button labels in the serif, or running prose in figures.

**The One-Kicker Rule.** The uppercase tracked eyebrow is a section _kicker_, not wallpaper. At most one per section, naming what follows ("Spotlight programs", "Browse by program type"). Never stack two, and never let every block on a page open with one; let the serif headline carry sections that do not need a label.

## 4. Elevation

The system is near-flat at rest and lifts on intent. A surface sits on paper defined by a single hairline border (translucent dark blue); its resting shadow is a whisper. On hover or focus, an interactive card rises 2px and gains a soft drop shadow, the affordance that says "this is openable." Depth is a response to interaction, never ambient chrome. All shadows tint toward the deep brand blue (`rgba(0,32,51,...)`), never neutral gray-black.

### Shadow Vocabulary

- **Resting** (`box-shadow: 0 1px 2px rgba(0,32,51,0.05)`): Default card and panel definition; mostly the hairline border does the work.
- **Hover / Lift** (`box-shadow: 0 12px 28px rgba(0,32,51,0.12)` with `transform: translateY(-2px)`): Interactive cards and category tiles on hover/focus.
- **Overlay** (`box-shadow: -12px 0 32px rgba(0,32,51,0.20)` / `0 12px 32px rgba(0,0,0,0.18)`): The mobile drawer and the hero search field, the rare genuinely-floating surfaces.

The token scale (`--shadow-sm` → `--shadow-xl`) follows the same dark-blue tint at rising blur and spread.

### Named Rules

**The Lift-on-Intent Rule.** Surfaces are flat at rest. The 2px rise and drop shadow appear only as a response to hover or focus on something openable. If a static card is already casting a heavy shadow, the shadow is wrong. Borders define; shadows react.

## 5. Components

### Buttons

- **Shape:** 4px radius (`--radius-sm`) on all buttons and inputs. Square-ish, per the UC system's corner discipline.
- **Primary:** UC Blue (#1295D8) fill, paper text, padding 14px 24px, sans 600. Hover deepens to UC Blue Deep (#005581). This is "Find a program", "Search".
- **Secondary / Ghost:** Transparent or paper background, UC Blue Deep text and 2px border; hover inverts to a Blue Deep fill with paper text.
- **Gold:** UC Gold (#FFB511) fill, UC Dark Blue text; hover brightens to #FFD200. Reserved for the rare high-emphasis or "featured" action.
- **Compare chip (nav):** Paper fill, 2px Ink (#002033) border, Ink text, 4px radius; appears only when the compare cart is non-empty.
- **Hover/Focus:** Transitions run on `background`, `color`, and `transform` over 150–250ms with the standard ease (`cubic-bezier(0.4, 0, 0.2, 1)`). `:active` scales to 0.98. Focus is governed globally (see Do's).

### Pills & Chips

- **Industry Pill** (`Pill`, default tint mode): Fully rounded (999px), background = accent color at ~8% alpha, 1px border at ~20% alpha, text in the accent color (default UC Blue Deep), 12px / 600. Used for industry tags on cards. A solid `bg` variant flips to white text on a filled color.
- **Type Chip** (on card art): Rounded pill on near-opaque paper (`rgba(255,255,255,0.95)`), the program-type color as text, uppercase 11px / 700, 0.06em tracking. Reads as a printed label over the gradient.
- **Featured Chip:** Solid UC Gold, UC Dark Blue text, star icon, same pill shape.
- **Rule:** Tags inform, chips/buttons act. Keep tint pills for classification; reserve solid fills for selected state.
- **Note (Stitch frontmatter):** The frontmatter is hex-only and cannot express alpha tints or runtime-dynamic values, so the pill/chip color entries there are static stand-ins. The industry pill's real background is the accent at ~8% alpha (the frontmatter shows the composited default `#EBF1F5`), and the type chip's real text color is the runtime program-type color (the frontmatter shows the `#002033` fallback).

### Compare Toggle (signature)

- **Style:** Small 4px-radius button, paper background, 1px translucent-ink border, Ink text, 12px / 600, plus icon.
- **Selected:** Inverts to a solid UC Blue Deep (#005581) fill with paper text and a check icon ("Comparing"). The single clearest "on" state in the product; it drives the compare cart and the nav compare chip count.

### Cards / Containers

- **Corner Style:** 8px (`--radius-md`).
- **Background:** Paper (#FFFFFF).
- **Border:** 1px translucent dark blue (`rgba(0,32,51,0.10)`). This single hairline is the card's resting definition.
- **Shadow Strategy:** Resting whisper; lift on hover (see Elevation). Cards are flat printed panels until touched.
- **Internal Padding:** 20–22px (`--space-5`-ish); 16–18px compact.
- **Card Art:** A `programGradient` banner (campus navy → type hue, 135deg), 168px tall (140 compact), carrying the oversized serif campus-initial watermark (white at 15%), the type chip and featured chip (top-left), and the campus badge with pin (bottom-left).
- **Rule:** Cards appear only for genuine discrete records (a program, a campus, a news item). Never nest a card inside a card.

### Inputs / Fields

- **Style:** The hero search is a paper field block with an 8px radius and a soft overlay shadow, a leading search icon in UC Blue Deep, a borderless text input, and a UC Blue submit button. Filters and search inputs use 4px radius and the hairline border.
- **Focus:** Governed by the global 3px focus ring; never remove the outline.

### Navigation / Masthead

- **Utility bar (desktop):** A slim UC Dark Blue (#002033) strip with UC Extra-Light Blue text, a gold uppercase "UC System" kicker, and right-aligned utility links ("For partners", "For faculty", "UC Newsroom").
- **Primary nav:** Sticky (z-index 30), paper background, 80px tall, closed by a 1px hairline. Brand lockup = UC wordmark image + a serif "Entrepreneurship" over an uppercase tracked "HUB". Links are sans 600 with a 3px active underline in UC Blue Deep (the `--accent` token, #005581); right side holds search, the conditional compare chip, and the primary "Find a program" CTA. Nav-level primary actions (active underline, the CTA, the search submit) resolve through `--accent` (#005581), not the token primary button's UC Blue (#1295D8).
- **Mobile:** 64px bar with a hamburger that opens a right-side drawer (`role="dialog"`, `aria-modal`), a translucent ink backdrop, Escape-to-close, and a focusable close button. Drawer at z-index 40, above the sticky nav.

### California Map (signature)

- A custom SVG map of the ten campuses used in two variants: a `hero` variant on dark blue with blue line work, and a `standalone` variant that highlights a hovered campus. Each campus node carries its official navy and links to its campus page. This is the product's most distinctive non-card surface; treat it as the spatial index of the catalog.

## 6. Do's and Don'ts

### Do:

- **Do** treat UC Blue (#1295D8) and UC Gold (#FFB511) as the identity spine and make every other hue earn its place as data: campus, program type, or status (the Blue-and-Gold Spine Rule).
- **Do** pull categorical color only from the ten campus navies and the seven program-type hues; combine them only in the 135deg card-art gradient (the Campus-and-Type Legend Rule).
- **Do** pick text and small-fill colors for WCAG AA on paper first; use UC Blue Deep (#005581) for blue text and the darkened status tokens, never raw bright-brand hues, on white (the Contrast-First Rule).
- **Do** pair every categorical color with a text label or icon so meaning never rides on color alone (color-blind safe). Hold the AA floor that axe and pa11y enforce, and push toward AAA where the palette allows.
- **Do** keep a loud global `:focus-visible` ring on every interactive element, and let real `<button>`/`<th>` semantics carry sort, disclosure, and compare state.
- **Do** set headlines, program names, and figures in Source Serif 4 and reading text plus all UI in Source Sans 3 (the Serif-for-Significance Rule); hold prose to roughly 65–75ch.
- **Do** keep surfaces flat at rest and lift them only on hover/focus (the Lift-on-Intent Rule); tint every shadow toward `rgba(0,32,51,...)`.
- **Do** warm grouped sections and page heroes with `#F7F5F1`, the brand's own warm gray, and keep cards on pure paper.
- **Do** honor `prefers-reduced-motion`: disable smooth scroll, the hover lift, and transitions entirely.

### Don't:

- **Don't** build the generic SaaS landing: no gradient-on-dark hero cliché as a content substitute, no endless identical icon-heading-text feature-card grid, no big-number gradient hero-metric template.
- **Don't** use gradient _text_ (`background-clip: text`), glassmorphism, or decorative blur. The card-art gradient is a data encoding and the dark hero's glow is brand atmosphere; neither licenses gradient text. Emphasis comes from scale, weight, and the serif.
- **Don't** adopt a hypey startup voice: no marketing buzzwords (streamline, supercharge, empower, transform, seamless, world-class), no neon, no over-animation, no exclamation-point energy. This is a public resource.
- **Don't** let the utility surfaces collapse into a sterile all-gray admin dashboard. Density serves scanning, but UC blue-and-gold, the serif, and the warm surface stay present inside the tool.
- **Don't** use side-stripe borders (a `border-left`/`border-right` greater than 1px as a colored accent). Use a full hairline border, a tint, a leading icon, or the type chip instead.
- **Don't** nest a card inside a card, or use a card where a list row or inline group would read better.
- **Don't** use UC Gold for text on white, or any color purely for vibrancy.
- **Don't** animate layout properties or use bounce/elastic easing; transitions ease out on `background`, `color`, and `transform` over 150–250ms.
- **Don't** use em dashes in interface copy; use commas, colons, or parentheses.
