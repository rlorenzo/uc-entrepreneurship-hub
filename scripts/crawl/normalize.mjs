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

export function canonicalType(raw) {
  if (!raw) return "incubator";
  const hay = String(raw).toLowerCase();
  for (const [canonical, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((a) => hay.includes(a))) return canonical;
  }
  if (KNOWN_TYPES.has(hay)) return hay;
  return "incubator";
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
    if (aliases.some((a) => hay.includes(a))) out.add(canonical);
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
      if (aliases.some((a) => hay.includes(a))) {
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
