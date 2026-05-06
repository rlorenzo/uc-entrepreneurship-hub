// Plain-Node mirror of src/data/normalize.ts. Kept here so the crawler
// can run without a TS runtime. If you change the canonical type or
// industry mappings, update both files in lockstep.

export function slugify(input) {
  return String(input)
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
 * page excerpts into this so the false-positive surface was huge.
 *
 * Aliases that contain non-word characters (slashes, dashes) skip the
 * regex path because their punctuation already disambiguates them and
 * \b doesn't fire around `/` or `-` in JS regex.
 */
function aliasMatches(haystack, alias) {
  if (!alias) return false;
  if (/[^a-z0-9 ]/i.test(alias)) {
    return haystack.includes(alias.toLowerCase());
  }
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(haystack);
}

const TYPE_ALIASES = {
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

const KNOWN_TYPES = new Set(Object.keys(TYPE_ALIASES));

/**
 * Strict classifier — returns null when nothing matches. Use this when
 * you need to know whether the input actually carried a type signal,
 * for example so the caller can decide between a confident match and a
 * neutral fallback. The crawler uses this against `name + description`
 * combined.
 */
export function tryCanonicalType(raw) {
  if (!raw) return null;
  const hay = String(raw).toLowerCase();
  for (const [canonical, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((a) => aliasMatches(hay, a))) return canonical;
  }
  if (KNOWN_TYPES.has(hay.trim())) return hay.trim();
  return null;
}

/** Permissive classifier — falls back to `incubator` for back-compat. */
export function canonicalType(raw) {
  return tryCanonicalType(raw) ?? "incubator";
}

const INDUSTRY_ALIASES = {
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

const INDUSTRY_LABELS = Object.keys(INDUSTRY_ALIASES);

/** Inspect raw text for industry signals; returns canonical labels. */
export function detectIndustriesInText(text) {
  if (!text) return [];
  const hay = text.toLowerCase();
  const out = new Set();
  for (const [canonical, aliases] of Object.entries(INDUSTRY_ALIASES)) {
    if (aliases.some((a) => aliasMatches(hay, a))) out.add(canonical);
  }
  return [...out];
}

export function canonicalIndustries(raw) {
  if (!raw?.length) return [];
  const out = new Set();
  for (const item of raw) {
    const hay = String(item).toLowerCase().trim();
    if (!hay) continue;
    let matched = false;
    for (const [canonical, aliases] of Object.entries(INDUSTRY_ALIASES)) {
      if (aliases.some((a) => aliasMatches(hay, a))) {
        out.add(canonical);
        matched = true;
      }
    }
    if (!matched) {
      const exact = INDUSTRY_LABELS.find((i) => i.toLowerCase() === hay);
      if (exact) out.add(exact);
    }
  }
  return [...out];
}

export function canonicalStage(raw) {
  if (!raw) return "Idea";
  const hay = String(raw).toLowerCase();
  if (hay.includes("scal")) return "Scaling";
  if (hay.includes("seed")) return "Pre-seed";
  if (hay.includes("proto")) return "Prototype";
  return "Idea";
}
