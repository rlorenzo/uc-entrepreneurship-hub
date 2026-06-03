import type { Program, Stage } from "./types.ts";
import { TYPE_BY_ID, INDUSTRIES, STAGES } from "./types-list.ts";

/**
 * Normalization utilities for the program catalog.
 *
 * The crawler emits raw text — "startup accelerator", "Accelerator Program",
 * "AI/ML", "machine learning" — which has to collapse onto the canonical
 * taxonomy the UI was built around. Keep mappings here so the crawler and
 * the build step agree on a single canonical form.
 */

/**
 * URL-safe slug for routes and lookups.
 * Strips diacritics, lowercases, replaces non-alphanumerics with `-`,
 * and collapses runs of `-`.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Word-boundary alias check. Replaces a naive `haystack.includes(alias)`
 * which falsely matches short tokens — `"ai"` would otherwise tag
 * "sustainability" or "training" as AI/ML, and the crawler feeds full
 * page excerpts into the industry detector so the false-positive
 * surface was huge.
 *
 * Aliases that contain non-word characters (slashes, dashes) skip the
 * regex path because their punctuation already disambiguates them and
 * \b doesn't fire around `/` or `-` in JS regex.
 */
function aliasMatches(haystack: string, alias: string): boolean {
  if (!alias) return false;
  if (/[^a-z0-9 ]/i.test(alias)) {
    return haystack.includes(alias.toLowerCase());
  }
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(haystack);
}

/**
 * Lookup that resolves a noisy phrase to one of our canonical program type ids.
 * Map keys are themselves the canonical id; values are case-insensitive
 * substrings/aliases the crawler is allowed to match against.
 */
const TYPE_ALIASES: Record<string, string[]> = {
  accelerator: ["accelerator", "venture accelerator", "startup accelerator", "cohort program"],
  incubator: ["incubator", "venture lab", "innovation hub", "innovation district", "studio"],
  certificate: [
    "certificate program",
    "professional certificate",
    "technical management",
    "fellowship program",
  ],
  funding: [
    "funding",
    "grant",
    "fund",
    "proof of concept",
    "proof-of-concept",
    "poc fund",
    "seed fund",
    "micro-grant",
    "prize",
  ],
  competition: ["competition", "challenge", "pitch contest", "hackathon", "venture challenge"],
  maker: ["maker", "fab lab", "fabrication", "wet lab", "prototyping", "design lab", "makerspace"],
  mentorship: ["mentorship", "mentor", "advisor program", "office hours"],
};

/**
 * Strict classifier — returns null when nothing matches. Use this when
 * you need to know whether the input actually carried a type signal so
 * the caller can decide between a confident match and a neutral
 * fallback. The crawler uses this against `name + description`.
 */
export function tryCanonicalType(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const hay = raw.toLowerCase();
  for (const [canonical, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((a) => aliasMatches(hay, a))) return canonical;
  }
  const trimmed = hay.trim();
  if (TYPE_BY_ID[trimmed]) return trimmed;
  return null;
}

/**
 * Permissive classifier — back-compat wrapper that always returns a
 * canonical id, falling back to "incubator" when nothing matches.
 * Used by `coerceToProgram` below; not exported because no external
 * consumer needs it. Promote to `export` if/when the UI starts calling
 * it directly.
 */
function canonicalType(raw: string | undefined | null): string {
  return tryCanonicalType(raw) ?? "incubator";
}

/**
 * Aliases for canonical industries. Match keys are canonical industry
 * labels exactly as listed in INDUSTRIES; values are alternate phrasings
 * the crawler might encounter.
 */
const INDUSTRY_ALIASES: Record<string, string[]> = {
  "AI / ML": ["ai", "ml", "machine learning", "artificial intelligence", "ai/ml", "ai / ml"],
  Biotech: ["biotech", "life sciences", "life-sciences", "therapeutics", "drug discovery"],
  Climate: ["climate", "cleantech", "clean tech", "sustainability", "decarbonization"],
  Consumer: ["consumer", "d2c", "direct to consumer", "cpg"],
  Hardware: ["hardware", "deep tech", "deep-tech", "semiconductor", "robotics hardware"],
  Health: ["health", "healthtech", "health tech", "digital health", "medtech", "medical devices"],
  Fintech: ["fintech", "financial technology", "payments", "insurtech"],
  AgTech: ["agtech", "ag tech", "agriculture", "agritech", "food systems", "food-systems"],
  Media: ["media", "entertainment", "creator economy"],
  EdTech: ["edtech", "ed tech", "education technology", "online learning"],
  Robotics: ["robotics", "autonomy", "autonomous systems"],
  Energy: ["energy", "battery", "storage", "grid", "solar"],
};

/**
 * Collect every alias-matching canonical industry into `out`.
 * Returns true when at least one alias hit, so the caller knows whether
 * to fall back to literal-label matching.
 */
function collectAliasMatches(hay: string, out: Set<string>): boolean {
  let matched = false;
  for (const [canonical, aliases] of Object.entries(INDUSTRY_ALIASES)) {
    if (aliases.some((a) => aliasMatches(hay, a))) {
      out.add(canonical);
      matched = true;
    }
  }
  return matched;
}

/** Canonicalize a single free-form industry token into `out`. */
function canonicalizeIndustry(hay: string, out: Set<string>): void {
  if (!hay) return;
  if (collectAliasMatches(hay, out)) return;
  const exact = INDUSTRIES.find((i) => i.toLowerCase() === hay);
  if (exact) out.add(exact);
}

/** Canonicalize a list of free-form industry strings to our taxonomy. */
function canonicalIndustries(raw: string[] | undefined | null): string[] {
  if (!raw?.length) return [];
  const out = new Set<string>();
  for (const item of raw) canonicalizeIndustry(item.toLowerCase().trim(), out);
  return [...out];
}

/** Inspect free-form text for industry signals; returns canonical labels. */
export function detectIndustriesInText(text: string | undefined | null): string[] {
  if (!text) return [];
  const out = new Set<string>();
  collectAliasMatches(text.toLowerCase(), out);
  return [...out];
}

/** Resolve a stage label to one of the canonical stages. */
function canonicalStage(raw: string | undefined | null): Stage {
  if (!raw) return "Idea";
  const hay = raw.toLowerCase();
  if (hay.includes("scal")) return "Scaling";
  if (hay.includes("seed")) return "Pre-seed";
  if (hay.includes("proto")) return "Prototype";
  return STAGES[0];
}

/**
 * A relaxed, partial Program shape suitable for crawler output.
 * The crawler doesn't always know the cohort size, selectivity, etc.,
 * so most fields are optional and `coerceToProgram` fills in safe
 * defaults to satisfy the UI's stricter type.
 */
export interface ProgramCandidate {
  id?: string;
  slug?: string;
  name: string;
  campus: string;
  type?: string;
  desc?: string;
  longDescription?: string;
  industries?: string[];
  stage?: string;
  eligibility?: string[];
  duration?: string;
  funding?: string;
  selectivity?: string;
  cohortSize?: number | null;
  deadline?: string;
  deadlines?: { label?: string; date?: string }[];
  website?: string;
  applicationLink?: string;
  associatedCenter?: string;
  tags?: string[];
  sourceUrl?: string;
  imageUrl?: string;
  lastUpdated?: string;
}

/**
 * Resolve a possibly site-relative og:image to an absolute http(s) URL.
 *
 * Shared by the program crawler (`coerceToProgram`) and the news pipeline
 * (`build-data.ts`): a source page can emit a root-relative image path — e.g.
 * a Drupal asset path shipped without a leading slash — which we resolve
 * against the source page's origin (not its path, which would yield a bogus
 * nested URL). The value ends up in a CSS background / `<img src>`, so anything
 * that isn't http(s) (data:, javascript:, file:, …) is dropped rather than
 * shipped — a missing image is acceptable, an unsafe one is not.
 */
export function sanitizeImageUrl(
  imageUrl: string | undefined,
  base: string | undefined,
): string | undefined {
  if (!imageUrl) return undefined;
  try {
    const origin = base ? new URL(base).origin : undefined;
    const resolved = origin ? new URL(imageUrl, origin) : new URL(imageUrl);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return undefined;
    return resolved.href;
  } catch {
    return undefined;
  }
}

/**
 * Many pages expose a generic site-wide social card or a logo as their
 * og:image instead of a real hero photo — e.g. UCSF serves the same
 * `social-default.jpg` for every program page, and UCLA's accelerator page
 * advertises an `accelerator-logo-card.png`. Stretched into a full-bleed
 * cover those look worse than the branded gradient art, so the program
 * pipeline drops them and lets the gradient show. Matched on filename tokens
 * with separator boundaries so it won't fire inside a real photo's slug.
 * Also catches "under construction" / "coming soon" placeholder graphics
 * (e.g. UC Merced's `construction_3.png`), screenshots (UCSC shipped a logo
 * screengrab), CTA/marketing modules (UCSD's `Triton-GPT-CTA-Module`), and
 * testimonial graphics (typically a single headshot or quote card, e.g. UCLA's
 * `accelerator-student-testimonial-…png`).
 */
const GENERIC_IMAGE_RE =
  /(?:^|[/_-])(?:logo|wordmark|icon|favicon|sprite|avatar|placeholder|construction|coming-soon|screenshot|cta|testimonial|social-default|default-(?:image|share|social|og)|og-default|meta-logo)(?:[._-]|$)/i;

export function isGenericImage(url: string): boolean {
  return GENERIC_IMAGE_RE.test(url);
}

/**
 * Specific harvested images a human has flagged as wrong for a program hero —
 * e.g. a faculty headshot or an off-topic photo the heuristic above can't
 * catch. Matched as a case-insensitive substring of the resolved URL; add the
 * distinctive part of a filename when you spot a bad one in the catalog.
 */
const IMAGE_DENYLIST = [
  "phd-finance-garmaise", // UCLA Early-Stage Investment Fund — advisor headshot, not a hero
  "makani-2", // UCI POP Grants — a portfolio company's product photo, off-topic for a grants program
];

function isDenylistedImage(url: string): boolean {
  const u = url.toLowerCase();
  return IMAGE_DENYLIST.some((token) => u.includes(token));
}

/**
 * Resolve a program's hero image, then drop it when it's a generic social
 * card / logo / placeholder (heuristic) or a specifically denylisted image.
 * Keeps the crawler permissive (it harvests whatever og:image a page offers)
 * while keeping the catalog's imagery honest; dropped images fall back to the
 * gradient art.
 */
function programHeroImage(raw: string | undefined, base: string | undefined): string | undefined {
  const url = sanitizeImageUrl(raw, base);
  if (!url || isGenericImage(url) || isDenylistedImage(url)) return undefined;
  return url;
}

/**
 * Pick the best hero image from an ordered, best-first list of raw candidates
 * (og:image, twitter:image, a hero-section CSS background, a body image). The
 * crawler harvests them all; this returns the first that survives sanitize +
 * generic/denylist filtering, so a page whose og:image is a generic social
 * card still gets its real hero-section background. Returns undefined when
 * none qualify (the UI falls back to the gradient).
 */
export function pickProgramImage(
  candidates: (string | undefined)[],
  base: string | undefined,
): string | undefined {
  for (const candidate of candidates) {
    const url = programHeroImage(candidate, base);
    if (url) return url;
  }
  return undefined;
}

/**
 * A crawled "Apply" anchor is often a campus-wide *admissions* CTA (e.g.
 * admissions.ucmerced.edu/first-year/apply) rather than the program's own
 * application — undergraduate admissions is never the right "apply to this
 * program" link. Detect those so the pipeline can drop them and the apply CTA
 * falls back to the program's own page. Also used as a render-time backstop in
 * ProgramDetail for curated records.
 */
export function isGenericAdmissionsLink(url: string | undefined): boolean {
  return !!url && /admissions/i.test(url);
}

const FIELD_FALLBACKS = {
  duration: "Not specified",
  funding: "Not disclosed",
  selectivity: "Not disclosed",
  deadline: "See program site",
  desc: "Program details not yet aggregated. Visit the source page for full information.",
} as const;

/** Trim then fall back when the trimmed value is empty. */
function trimOr(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

const DEFAULT_ELIGIBILITY = ["Open to public"] as const;

function deriveSlug(c: ProgramCandidate): string {
  return c.slug ?? c.id ?? slugify(c.name);
}

function deriveEligibility(eligibility?: string[]): readonly string[] {
  return eligibility?.length ? eligibility : DEFAULT_ELIGIBILITY;
}

/**
 * Lift a crawler candidate into a fully-typed Program, filling in safe
 * defaults so the UI never has to render undefined for required fields.
 * `slug` is computed if missing.
 */
export function coerceToProgram(c: ProgramCandidate): Program {
  const slug = deriveSlug(c);
  return {
    id: c.id ?? slug,
    slug,
    name: c.name.trim(),
    campus: c.campus,
    type: canonicalType(c.type),
    desc: trimOr(c.desc, FIELD_FALLBACKS.desc),
    longDescription: c.longDescription?.trim(),
    industries: canonicalIndustries(c.industries),
    stage: canonicalStage(c.stage),
    eligibility: [...deriveEligibility(c.eligibility)],
    duration: trimOr(c.duration, FIELD_FALLBACKS.duration),
    funding: trimOr(c.funding, FIELD_FALLBACKS.funding),
    selectivity: trimOr(c.selectivity, FIELD_FALLBACKS.selectivity),
    cohortSize: c.cohortSize ?? null,
    deadline: trimOr(c.deadline, FIELD_FALLBACKS.deadline),
    deadlines: c.deadlines,
    website: c.website,
    // Drop generic admissions CTAs (undergrad admissions ≠ program application);
    // the apply CTA then falls back to website/sourceUrl (the program's page).
    applicationLink: isGenericAdmissionsLink(c.applicationLink) ? undefined : c.applicationLink,
    associatedCenter: c.associatedCenter,
    tags: c.tags,
    lastUpdated: c.lastUpdated,
    sourceUrl: c.sourceUrl,
    imageUrl: programHeroImage(c.imageUrl, c.sourceUrl),
  };
}

/**
 * Merge curated programs with crawled programs.
 *
 * Curated entries (from `programs.ts`) win on conflict because a human
 * has already vetted them. Crawled entries enrich the curated record
 * with optional fields (website, applicationLink, sourceUrl, lastUpdated,
 * longDescription) the curated copy is missing. Crawled entries with no
 * curated counterpart are appended.
 *
 * Match policy: a crawled program is paired with a curated one when
 * either (a) they share a slug/id, or (b) they share a campus and a
 * normalized name. The (campus, name) fallback is what lets a curated
 * `id: "skydeck"` line up with a crawled `slug: "berkeley-skydeck"` —
 * the crawler campus-prefixes its slugs for global uniqueness, so a
 * direct slug equality test would always miss curated entries.
 */
const programKey = (p: Program): string => p.slug ?? p.id;
const nameKey = (p: Program): string =>
  `${p.campus}::${p.name.normalize("NFKC").trim().toLowerCase()}`;

/**
 * Optional Program fields a crawled record can fill in on a curated one.
 * Curated values always win — these are only copied when the curated
 * record left the field undefined. `lastUpdated` is the lone exception:
 * the crawl timestamp is fresher than whatever the curated record had,
 * so the crawled value wins when present.
 */
const ENRICHABLE_FIELDS = [
  "longDescription",
  "website",
  "applicationLink",
  "associatedCenter",
  "tags",
  "sourceUrl",
  "imageUrl",
  "deadlines",
] as const satisfies readonly (keyof Program)[];

function enrichWithCrawl(existing: Program, crawled: Program): Program {
  const merged: Program = { ...existing };
  for (const field of ENRICHABLE_FIELDS) {
    if (existing[field] === undefined) {
      (merged as unknown as Record<string, unknown>)[field] = crawled[field];
    }
  }
  if (crawled.lastUpdated) merged.lastUpdated = crawled.lastUpdated;
  return merged;
}

function indexProgram(p: Program, byKey: Map<string, Program>, byName: Map<string, Program>) {
  byKey.set(programKey(p), p);
  byName.set(nameKey(p), p);
}

function mergeOneCrawled(
  c: Program,
  byKey: Map<string, Program>,
  byName: Map<string, Program>,
): void {
  const existing = byKey.get(programKey(c)) ?? byName.get(nameKey(c));
  const merged = existing ? enrichWithCrawl(existing, c) : c;
  indexProgram(merged, byKey, byName);
  if (existing) byKey.set(programKey(existing), merged);
}

export function mergePrograms(curated: Program[], crawled: Program[]): Program[] {
  const byKey = new Map<string, Program>();
  const byName = new Map<string, Program>();
  for (const p of curated) indexProgram(p, byKey, byName);
  for (const c of crawled) mergeOneCrawled(c, byKey, byName);
  return [...byKey.values()];
}
