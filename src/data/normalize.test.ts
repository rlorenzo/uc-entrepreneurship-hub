import { describe, it, expect } from "vite-plus/test";
import {
  slugify,
  tryCanonicalType,
  detectIndustriesInText,
  coerceToProgram,
  mergePrograms,
} from "./normalize.ts";
import type { Program } from "./types.ts";

/** Build a full Program from a partial, so tests only state what they exercise. */
function prog(over: Partial<Program> & Pick<Program, "name" | "campus">): Program {
  const base: Program = {
    id: over.id ?? over.slug ?? slugify(over.name),
    name: over.name,
    campus: over.campus,
    type: "incubator",
    desc: "desc",
    industries: [],
    stage: "Idea",
    eligibility: [],
    duration: "Not specified",
    funding: "Not disclosed",
    selectivity: "Not disclosed",
    cohortSize: null,
    deadline: "See program site",
  };
  return { ...base, ...over };
}

describe("slugify", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("UC Berkeley SkyDeck")).toBe("uc-berkeley-skydeck");
  });

  it("strips diacritics via NFKD normalization", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
    expect(slugify("São Paulo Lab!")).toBe("sao-paulo-lab");
  });

  it("collapses punctuation/whitespace runs and trims the edges", () => {
    expect(slugify("  multiple   spaces  ")).toBe("multiple-spaces");
    expect(slugify("Trailing!!!")).toBe("trailing");
    expect(slugify("a / b \\ c")).toBe("a-b-c");
  });

  it("returns an empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("tryCanonicalType", () => {
  it("returns null for nullish or empty input", () => {
    expect(tryCanonicalType(null)).toBeNull();
    expect(tryCanonicalType(undefined)).toBeNull();
    expect(tryCanonicalType("")).toBeNull();
  });

  it("maps alias phrases to a canonical type id", () => {
    expect(tryCanonicalType("Startup Accelerator Program")).toBe("accelerator");
    expect(tryCanonicalType("We run a small incubator")).toBe("incubator");
    expect(tryCanonicalType("Faculty mentorship and office hours")).toBe("mentorship");
  });

  it("matches punctuated aliases by substring (proof-of-concept)", () => {
    expect(tryCanonicalType("Proof-of-Concept Fund")).toBe("funding");
  });

  it("falls back to a bare canonical id not present in the alias list", () => {
    // "certificate" alone is not in TYPE_ALIASES, so this exercises the
    // TYPE_BY_ID fallback path rather than alias matching.
    expect(tryCanonicalType("certificate")).toBe("certificate");
  });

  it("does not match an alias across word boundaries (refund != funding)", () => {
    expect(tryCanonicalType("our refund policy")).toBeNull();
  });

  it("returns null when no type signal is present", () => {
    expect(tryCanonicalType("a community gathering")).toBeNull();
  });
});

describe("detectIndustriesInText", () => {
  it("returns [] for nullish or empty input", () => {
    expect(detectIndustriesInText(null)).toEqual([]);
    expect(detectIndustriesInText("")).toEqual([]);
  });

  it("does NOT tag 'ai' embedded inside unrelated words (regression guard)", () => {
    // A naive haystack.includes("ai") falsely tagged "trAIning" and
    // "mAIntenance" as AI/ML; the word-boundary matcher must not.
    expect(detectIndustriesInText("training and maintenance")).toEqual([]);
  });

  it("tags a standalone 'ai' token", () => {
    expect(detectIndustriesInText("our ai lab")).toEqual(["AI / ML"]);
  });

  it("matches multi-word and punctuated aliases", () => {
    expect(detectIndustriesInText("machine learning and AI/ML")).toEqual(["AI / ML"]);
    expect(detectIndustriesInText("a fintech payments company")).toEqual(["Fintech"]);
  });

  it("maps 'sustainability' to Climate", () => {
    expect(detectIndustriesInText("a sustainability program")).toEqual(["Climate"]);
  });

  it("collects multiple distinct industries", () => {
    const got = detectIndustriesInText("biotech and climate and energy work");
    expect([...got].sort()).toEqual(["Biotech", "Climate", "Energy"]);
  });
});

describe("coerceToProgram", () => {
  it("fills safe defaults for a minimal candidate", () => {
    const p = coerceToProgram({ name: "  Foo Lab  ", campus: "berkeley" });
    expect(p.slug).toBe("foo-lab");
    expect(p.id).toBe("foo-lab");
    expect(p.name).toBe("Foo Lab");
    expect(p.type).toBe("incubator"); // permissive fallback when no signal
    expect(p.stage).toBe("Idea");
    expect(p.eligibility).toEqual(["Open to public"]);
    expect(p.duration).toBe("Not specified");
    expect(p.funding).toBe("Not disclosed");
    expect(p.cohortSize).toBeNull();
    expect(p.deadline).toBe("See program site");
    expect(p.industries).toEqual([]);
  });

  it("prefers explicit slug, then id, then a slug derived from the name", () => {
    expect(coerceToProgram({ name: "N", campus: "c", slug: "explicit" }).slug).toBe("explicit");
    expect(coerceToProgram({ name: "N", campus: "c", id: "from-id" }).slug).toBe("from-id");
    expect(coerceToProgram({ name: "Derive Me", campus: "c" }).slug).toBe("derive-me");
  });

  it("canonicalizes type and industries from free-form crawler text", () => {
    const p = coerceToProgram({
      name: "X",
      campus: "c",
      type: "startup accelerator",
      industries: ["machine learning", "sustainability"],
    });
    expect(p.type).toBe("accelerator");
    expect(p.industries).toEqual(["AI / ML", "Climate"]);
  });
});

describe("mergePrograms", () => {
  it("pairs a crawled record to a curated one by (campus, name) and enriches missing fields", () => {
    // Crawler campus-prefixes its slugs, so slugs differ; the (campus, name)
    // fallback is what lines them up.
    const curated = prog({ id: "skydeck", slug: "skydeck", name: "SkyDeck", campus: "berkeley" });
    const crawled = prog({
      id: "berkeley-skydeck",
      slug: "berkeley-skydeck",
      name: "SkyDeck",
      campus: "berkeley",
      website: "https://skydeck.berkeley.edu",
      sourceUrl: "https://begin.berkeley.edu/skydeck",
      longDescription: "Berkeley's flagship accelerator.",
      lastUpdated: "2026-05-01T00:00:00.000Z",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(1);
    expect(merged[0].slug).toBe("skydeck"); // curated identity is preserved
    expect(merged[0].website).toBe("https://skydeck.berkeley.edu");
    expect(merged[0].sourceUrl).toBe("https://begin.berkeley.edu/skydeck");
    expect(merged[0].longDescription).toBe("Berkeley's flagship accelerator.");
  });

  it("keeps the curated value when both sides have an enrichable field", () => {
    const curated = prog({
      slug: "x",
      name: "X",
      campus: "davis",
      website: "https://curated.example",
    });
    const crawled = prog({
      slug: "x",
      name: "X",
      campus: "davis",
      website: "https://crawled.example",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(1);
    expect(merged[0].website).toBe("https://curated.example");
  });

  it("always takes the crawled lastUpdated when present (the documented exception)", () => {
    const curated = prog({
      slug: "y",
      name: "Y",
      campus: "ucla",
      lastUpdated: "2020-01-01T00:00:00.000Z",
    });
    const crawled = prog({
      slug: "y",
      name: "Y",
      campus: "ucla",
      lastUpdated: "2026-05-01T00:00:00.000Z",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged[0].lastUpdated).toBe("2026-05-01T00:00:00.000Z");
  });

  it("appends a crawled record that has no curated counterpart", () => {
    const curated = prog({ slug: "a", name: "A", campus: "berkeley" });
    const crawled = prog({ slug: "b", name: "B", campus: "davis" });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.slug).sort()).toEqual(["a", "b"]);
  });
});
