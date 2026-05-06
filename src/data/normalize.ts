import type { Program, Stage } from "./types";
import { TYPE_BY_ID, INDUSTRIES, STAGES } from "./types-list";

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
 * Resolve a noisy program-type label to one of TYPES.id, falling back to
 * "incubator" (the most generic bucket) when nothing matches. Returning
 * a canonical value always — never undefined — so downstream sorting,
 * pill rendering, and counts never have to special-case missing types.
 */
export function canonicalType(raw: string | undefined | null): string {
  if (!raw) return "incubator";
  const hay = raw.toLowerCase();
  for (const [canonical, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((a) => hay.includes(a))) return canonical;
  }
  // If the crawler already produced a known canonical id, pass it through.
  if (TYPE_BY_ID[hay]) return hay;
  return "incubator";
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

/** Canonicalize a list of free-form industry strings to our taxonomy. */
export function canonicalIndustries(raw: string[] | undefined | null): string[] {
  if (!raw?.length) return [];
  const out = new Set<string>();
  for (const item of raw) {
    const hay = item.toLowerCase().trim();
    if (!hay) continue;
    let matched = false;
    for (const [canonical, aliases] of Object.entries(INDUSTRY_ALIASES)) {
      if (aliases.some((a) => hay.includes(a))) {
        out.add(canonical);
        matched = true;
      }
    }
    // Pass through items already in canonical form.
    if (!matched) {
      const exact = INDUSTRIES.find((i) => i.toLowerCase() === hay);
      if (exact) out.add(exact);
    }
  }
  return [...out];
}

/** Resolve a stage label to one of the canonical stages. */
export function canonicalStage(raw: string | undefined | null): Stage {
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
  lastUpdated?: string;
}

const FIELD_FALLBACKS = {
  duration: "Not specified",
  funding: "Not disclosed",
  selectivity: "Not disclosed",
  deadline: "See program site",
  desc: "Program details not yet aggregated. Visit the source page for full information.",
} as const;

/**
 * Lift a crawler candidate into a fully-typed Program, filling in safe
 * defaults so the UI never has to render undefined for required fields.
 * `slug` is computed if missing.
 */
export function coerceToProgram(candidate: ProgramCandidate): Program {
  const slug = candidate.slug ?? candidate.id ?? slugify(candidate.name);
  const type = canonicalType(candidate.type);
  const industries = canonicalIndustries(candidate.industries);
  const stage = canonicalStage(candidate.stage);
  return {
    id: candidate.id ?? slug,
    slug,
    name: candidate.name.trim(),
    campus: candidate.campus,
    type,
    desc: candidate.desc?.trim() || FIELD_FALLBACKS.desc,
    longDescription: candidate.longDescription?.trim(),
    industries,
    stage,
    eligibility: candidate.eligibility?.length ? candidate.eligibility : ["Open to public"],
    duration: candidate.duration?.trim() || FIELD_FALLBACKS.duration,
    funding: candidate.funding?.trim() || FIELD_FALLBACKS.funding,
    selectivity: candidate.selectivity?.trim() || FIELD_FALLBACKS.selectivity,
    cohortSize: candidate.cohortSize ?? null,
    deadline: candidate.deadline?.trim() || FIELD_FALLBACKS.deadline,
    deadlines: candidate.deadlines,
    website: candidate.website,
    applicationLink: candidate.applicationLink,
    associatedCenter: candidate.associatedCenter,
    tags: candidate.tags,
    lastUpdated: candidate.lastUpdated,
    sourceUrl: candidate.sourceUrl,
  };
}

/**
 * Merge curated programs with crawled programs.
 *
 * Curated entries (from `programs.ts`) win on conflict because a human
 * has already vetted them. Crawled entries with the same slug enrich
 * the curated record with new optional fields (website, applicationLink,
 * sourceUrl, lastUpdated, longDescription) when those are missing on the
 * curated copy. Crawled entries with no curated counterpart are appended.
 */
const programKey = (p: Program) => p.slug ?? p.id;

export function mergePrograms(curated: Program[], crawled: Program[]): Program[] {
  const byKey = new Map<string, Program>();
  for (const p of curated) byKey.set(programKey(p), p);
  for (const c of crawled) {
    const key = programKey(c);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, c);
      continue;
    }
    byKey.set(key, {
      ...existing,
      longDescription: existing.longDescription ?? c.longDescription,
      website: existing.website ?? c.website,
      applicationLink: existing.applicationLink ?? c.applicationLink,
      associatedCenter: existing.associatedCenter ?? c.associatedCenter,
      tags: existing.tags ?? c.tags,
      sourceUrl: existing.sourceUrl ?? c.sourceUrl,
      lastUpdated: c.lastUpdated ?? existing.lastUpdated,
      deadlines: existing.deadlines ?? c.deadlines,
    });
  }
  return [...byKey.values()];
}
