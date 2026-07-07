import { describe, it, expect } from "vite-plus/test";
import {
  slugify,
  tryCanonicalType,
  detectIndustriesInText,
  coerceToProgram,
  mergePrograms,
  sanitizeImageUrl,
  isGenericImage,
  isGenericAdmissionsLink,
  pickProgramImage,
  isRejectedProgramName,
  isBoilerplateDescription,
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

  it("resolves a relative imageUrl against the source origin and drops unsafe schemes", () => {
    const resolved = coerceToProgram({
      name: "X",
      campus: "c",
      imageUrl: "/media/hero.png",
      sourceUrl: "https://innovation.example.edu/programs/x",
    });
    expect(resolved.imageUrl).toBe("https://innovation.example.edu/media/hero.png");

    const unsafe = coerceToProgram({
      name: "X",
      campus: "c",
      imageUrl: "javascript:alert(1)",
      sourceUrl: "https://innovation.example.edu/programs/x",
    });
    expect(unsafe.imageUrl).toBeUndefined();
  });

  it("drops a generic social-card / logo og:image, keeping a real photo", () => {
    // UCSF serves the same social-default.jpg for every page; UCLA advertises a
    // logo card. Both should fall back to the gradient (imageUrl undefined).
    const social = coerceToProgram({
      name: "X",
      campus: "sf",
      imageUrl: "/sites/innovation.ucsf.edu/files/social-default.jpg",
      sourceUrl: "https://innovation.ucsf.edu/programs/x",
    });
    expect(social.imageUrl).toBeUndefined();

    const logo = coerceToProgram({
      name: "Y",
      campus: "la",
      imageUrl: "/sites/default/files/image/accelerator-logo-card.png",
      sourceUrl: "https://www.anderson.ucla.edu/x",
    });
    expect(logo.imageUrl).toBeUndefined();

    const photo = coerceToProgram({
      name: "Z",
      campus: "la",
      imageUrl: "/sites/default/files/2025-healthcare-hero-home.jpg",
      sourceUrl: "https://www.anderson.ucla.edu/z",
    });
    expect(photo.imageUrl).toBe(
      "https://www.anderson.ucla.edu/sites/default/files/2025-healthcare-hero-home.jpg",
    );
  });

  it("drops an under-construction placeholder image and a denylisted headshot", () => {
    const construction = coerceToProgram({
      name: "X",
      campus: "merced",
      imageUrl: "/sites/research.ucmerced.edu/files/page/images/construction_3.png",
      sourceUrl: "https://research.ucmerced.edu/departments/cga",
    });
    expect(construction.imageUrl).toBeUndefined();

    const headshot = coerceToProgram({
      name: "Early-Stage Investment Fund",
      campus: "la",
      imageUrl: "/sites/default/files/PHD-finance-garmaise.jpg",
      sourceUrl: "https://www.anderson.ucla.edu/for-companies/early-stage-investment-fund",
    });
    expect(headshot.imageUrl).toBeUndefined();
  });

  it("drops a generic admissions applicationLink, keeps a real one", () => {
    const admissions = coerceToProgram({
      name: "X",
      campus: "merced",
      applicationLink: "https://admissions.ucmerced.edu/first-year/apply?button",
      sourceUrl: "https://research.ucmerced.edu/departments/cga",
    });
    expect(admissions.applicationLink).toBeUndefined();

    const real = coerceToProgram({
      name: "Y",
      campus: "berkeley",
      applicationLink: "https://skydeck.berkeley.edu/apply",
    });
    expect(real.applicationLink).toBe("https://skydeck.berkeley.edu/apply");
  });
});

describe("pickProgramImage", () => {
  const base = "https://innovation.ucsf.edu/partnerships/panther-program";

  it("skips a generic og:image and takes the real hero-section background", () => {
    expect(
      pickProgramImage(
        [
          "/sites/innovation.ucsf.edu/files/social-default.jpg",
          "/sites/innovation.ucsf.edu/files/2025-01/page-hero-3.jpg",
        ],
        base,
      ),
    ).toBe("https://innovation.ucsf.edu/sites/innovation.ucsf.edu/files/2025-01/page-hero-3.jpg");
  });

  it("prefers an earlier real candidate over a later one", () => {
    expect(pickProgramImage(["/files/real-hero.jpg", "/files/also-good.jpg"], base)).toBe(
      "https://innovation.ucsf.edu/files/real-hero.jpg",
    );
  });

  it("returns undefined when every candidate is generic, empty, or unsafe", () => {
    expect(pickProgramImage(["/x/logo.png", "", undefined, "javascript:alert(1)"], base)).toBe(
      undefined,
    );
  });
});

describe("isRejectedProgramName", () => {
  it("rejects section/navigation page names", () => {
    for (const n of [
      "News and Events",
      "news & events",
      "Contact",
      "Home",
      "Newsletter",
      "Events",
    ]) {
      expect(isRejectedProgramName(n), n).toBe(true);
    }
    expect(isRejectedProgramName("Welcome to Beall")).toBe(true);
    expect(isRejectedProgramName("")).toBe(true);
  });

  it("keeps real program names", () => {
    for (const n of ["Berkeley SkyDeck", "POP Grants", "Big Ideas Contest", "The Basement"]) {
      expect(isRejectedProgramName(n), n).toBe(false);
    }
  });
});

describe("isBoilerplateDescription", () => {
  it("flags cookie banners and enable-JavaScript notices", () => {
    expect(
      isBoilerplateDescription(
        "This website stores cookies on your computer. These cookies are used to improve your website experience.",
      ),
    ).toBe(true);
    expect(isBoilerplateDescription("Please enable JavaScript to view this site.")).toBe(true);
  });

  it("passes a real program description", () => {
    expect(
      isBoilerplateDescription("A six-month accelerator backing growth-stage UC startups."),
    ).toBe(false);
  });
});

describe("coerceToProgram description cleaning", () => {
  it("replaces a cookie-banner desc with the real longDescription", () => {
    const p = coerceToProgram({
      name: "Funding Resources",
      campus: "irvine",
      desc: "This website stores cookies on your computer. See our Privacy Policy.",
      longDescription: "Proof of Product (POP) Grants awards funding to accelerate UCI technology.",
    });
    expect(p.desc).toBe(
      "Proof of Product (POP) Grants awards funding to accelerate UCI technology.",
    );
  });

  it("falls back to the neutral default when desc and longDescription are both boilerplate", () => {
    const p = coerceToProgram({
      name: "X",
      campus: "irvine",
      desc: "We use cookies to improve your experience.",
      longDescription: "This website uses cookies.",
    });
    expect(p.desc).toBe(
      "Program details not yet aggregated. Visit the source page for full information.",
    );
  });

  it("replaces a too-short nav-fragment desc ('Search') with the longDescription", () => {
    const p = coerceToProgram({
      name: "Prototyping + Lab Space",
      campus: "santabarbara",
      desc: "Search",
      longDescription: "The CNSI Innovation Workshop is a makerspace facility open in Elings Hall.",
    });
    expect(p.desc).toBe(
      "The CNSI Innovation Workshop is a makerspace facility open in Elings Hall.",
    );
  });
});

describe("isGenericAdmissionsLink", () => {
  it("flags admissions URLs, passes program application links", () => {
    expect(isGenericAdmissionsLink("https://admissions.ucmerced.edu/first-year/apply")).toBe(true);
    expect(isGenericAdmissionsLink("https://www.ucdavis.edu/admissions/apply/#quicklink")).toBe(
      true,
    );
    expect(isGenericAdmissionsLink("https://skydeck.berkeley.edu/apply")).toBe(false);
    expect(isGenericAdmissionsLink(undefined)).toBe(false);
  });
});

describe("isGenericImage", () => {
  it("flags logos, generic social cards, and placeholders", () => {
    for (const u of [
      "https://x.edu/sites/social-default.jpg",
      "https://x.edu/img/accelerator-logo-card.png",
      "https://x.edu/themes/wordmark.svg",
      "https://x.edu/meta-logo.jpg",
      "https://x.edu/assets/placeholder.png",
      "https://x.edu/default-share.png",
      "https://x.edu/files/page/images/construction_3.png",
      "https://x.edu/files/2026/04/Screenshot-2026-04-08-at-1.png",
      "https://x.edu/wp-content/uploads/Triton-GPT-CTA-Module-3.png",
      "https://x.edu/files/accelerator-student-testimonial-sagar-pande.png",
    ]) {
      expect(isGenericImage(u), u).toBe(true);
    }
  });

  it("does NOT flag real photos with incidental substrings", () => {
    for (const u of [
      "https://x.edu/files/2025-healthcare-hero-home.jpg",
      "https://x.edu/uploads/Makani-2.png",
      "https://x.edu/files/Janelle-King-Student-Startup-Fund.png",
      "https://x.edu/files/Innovation_Workshop_Lab_004.jpg",
      "https://x.edu/files/PRICE-MDE-online-banner.jpg",
    ]) {
      expect(isGenericImage(u), u).toBe(false);
    }
  });
});

describe("sanitizeImageUrl", () => {
  const base = "https://x.edu/programs/a";

  it("returns undefined for empty input", () => {
    expect(sanitizeImageUrl(undefined, base)).toBeUndefined();
    expect(sanitizeImageUrl("", base)).toBeUndefined();
  });

  it("treats a whitespace-only value as empty (does not resolve to the origin)", () => {
    expect(sanitizeImageUrl("   ", base)).toBeUndefined();
    expect(sanitizeImageUrl("\n\t", base)).toBeUndefined();
  });

  it("resolves a root-relative path against the source origin (not the path)", () => {
    expect(sanitizeImageUrl("/img/hero.jpg", base)).toBe("https://x.edu/img/hero.jpg");
  });

  it("passes through an absolute http(s) URL unchanged", () => {
    expect(sanitizeImageUrl("https://cdn.x.edu/h.png", base)).toBe("https://cdn.x.edu/h.png");
  });

  it("drops non-http(s) schemes so a src can't carry javascript:/data:", () => {
    expect(sanitizeImageUrl("javascript:alert(1)", base)).toBeUndefined();
    expect(sanitizeImageUrl("data:image/png;base64,AAAA", base)).toBeUndefined();
  });

  it("drops a relative path when there is no base to resolve against", () => {
    expect(sanitizeImageUrl("hero.jpg", undefined)).toBeUndefined();
  });
});

describe("mergePrograms", () => {
  it("keeps same-slug programs from different campuses as distinct entries", () => {
    // Slugs derive from page titles, so two campuses publishing a
    // "Venture Lab" page must not collapse into one catalog entry.
    const a = prog({
      id: "berkeley-venture-lab",
      slug: "venture-lab",
      name: "Venture Lab",
      campus: "berkeley",
    });
    const b = prog({
      id: "davis-venture-lab",
      slug: "venture-lab",
      name: "Venture Lab",
      campus: "davis",
    });

    const merged = mergePrograms([], [a, b]);

    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.campus).toSorted()).toEqual(["berkeley", "davis"]);
    // Routing keys (slug ?? id) stay unique: the later duplicate slug is
    // dropped so that program routes by its campus-prefixed id instead.
    const keys = merged.map((p) => p.slug ?? p.id);
    expect(new Set(keys).size).toBe(2);
  });

  it("does not pair a crawled record with a same-slug curated program on another campus", () => {
    const curated = prog({ id: "tmp", slug: "tmp", name: "TMP", campus: "santabarbara" });
    const crawled = prog({
      id: "davis-tmp",
      slug: "tmp",
      name: "TMP",
      campus: "davis",
      website: "https://tmp.ucdavis.edu",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(2);
    const sb = merged.find((p) => p.campus === "santabarbara");
    expect(sb?.website).toBeUndefined(); // not enriched by the other campus's page
  });

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

  it("enriches a curated program's missing imageUrl from the crawl", () => {
    const curated = prog({ slug: "z", name: "Z", campus: "sd" });
    const crawled = prog({
      slug: "z",
      name: "Z",
      campus: "sd",
      imageUrl: "https://x.edu/hero.png",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(1);
    expect(merged[0].imageUrl).toBe("https://x.edu/hero.png");
  });

  it("appends a crawled record that has no curated counterpart", () => {
    const curated = prog({ slug: "a", name: "A", campus: "berkeley" });
    const crawled = prog({ slug: "b", name: "B", campus: "davis" });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.slug).sort()).toEqual(["a", "b"]);
  });

  it("pairs by canonical URL when slugs and names both differ", () => {
    // Real regression: the crawler titled the Anderson Venture Accelerator
    // page "UCLA Anderson Venture Accelerator", so neither the slug nor the
    // (campus, name) key matched and the catalog listed the program twice.
    const curated = prog({
      slug: "andersonva",
      name: "Anderson Venture Accelerator",
      campus: "la",
      website: "https://www.anderson.ucla.edu/accelerator",
    });
    const crawled = prog({
      slug: "la-ucla-anderson-venture-accelerator",
      name: "UCLA Anderson Venture Accelerator",
      campus: "la",
      sourceUrl: "https://www.anderson.ucla.edu/accelerator/", // trailing slash is insignificant
      longDescription: "Crawled detail.",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(1);
    expect(merged[0].slug).toBe("andersonva");
    expect(merged[0].longDescription).toBe("Crawled detail.");
  });

  it("does not URL-pair programs whose URLs differ only by path", () => {
    const curated = prog({
      slug: "hub",
      name: "Hub",
      campus: "irvine",
      website: "https://innovation.uci.edu/",
    });
    const crawled = prog({
      slug: "irvine-pop-grants",
      name: "POP Grants",
      campus: "irvine",
      sourceUrl: "https://innovation.uci.edu/pop-grants/",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(2);
  });

  it("does not URL-pair two crawled records that share a page", () => {
    // Two distinct programs extracted from the same hub page must both
    // survive — URL pairing is only for matching crawled records to curated
    // ones, never for collapsing crawled records into each other.
    const c1 = prog({
      slug: "davis-program-a",
      name: "Program A",
      campus: "davis",
      sourceUrl: "https://iedo.ucdavis.edu/",
    });
    const c2 = prog({
      slug: "davis-program-b",
      name: "Program B",
      campus: "davis",
      sourceUrl: "https://iedo.ucdavis.edu/",
    });

    const merged = mergePrograms([], [c1, c2]);

    expect(merged).toHaveLength(2);
    expect(merged.map((p) => p.name).sort()).toEqual(["Program A", "Program B"]);
  });

  it("pairs by URL with neither curated program when two curated entries share a URL", () => {
    // An ambiguous URL slot is poisoned rather than last-writer-wins: the
    // crawled record can't know which curated program it belongs to, so it
    // appends instead of enriching the wrong one.
    const cur1 = prog({ slug: "hub-a", name: "Hub A", campus: "merced", website: "https://x.edu" });
    const cur2 = prog({ slug: "hub-b", name: "Hub B", campus: "merced", website: "https://x.edu" });
    const crawled = prog({
      slug: "merced-something",
      name: "Something",
      campus: "merced",
      sourceUrl: "https://x.edu/",
      longDescription: "Crawled detail.",
    });

    const merged = mergePrograms([cur1, cur2], [crawled]);

    expect(merged).toHaveLength(3);
    expect(merged.find((p) => p.slug === "hub-a")?.longDescription).toBeUndefined();
    expect(merged.find((p) => p.slug === "hub-b")?.longDescription).toBeUndefined();
  });

  it("ignores hash fragments and host case when URL-pairing", () => {
    const curated = prog({
      slug: "maker",
      name: "Maker Pass",
      campus: "berkeley",
      website: "HTTPS://Jacobs.Berkeley.EDU/pass#apply",
    });
    const crawled = prog({
      slug: "berkeley-jacobs-maker-pass",
      name: "Jacobs Maker Pass",
      campus: "berkeley",
      sourceUrl: "https://jacobs.berkeley.edu/pass",
      longDescription: "Crawled detail.",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(1);
    expect(merged[0].slug).toBe("maker");
    expect(merged[0].longDescription).toBe("Crawled detail.");
  });

  it("ignores a trailing slash before the query string when URL-pairing", () => {
    const curated = prog({
      slug: "hub-page",
      name: "Hub Page",
      campus: "davis",
      website: "https://iedo.ucdavis.edu/programs/?tab=funding",
    });
    const crawled = prog({
      slug: "davis-hub-page",
      name: "Davis Hub Page",
      campus: "davis",
      sourceUrl: "https://iedo.ucdavis.edu/programs?tab=funding",
      longDescription: "Crawled detail.",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(1);
    expect(merged[0].slug).toBe("hub-page");
    expect(merged[0].longDescription).toBe("Crawled detail.");
  });

  it("treats path case as significant when URL-pairing (RFC 3986)", () => {
    // Only scheme/host are case-insensitive; /Pass and /pass may be
    // different pages, so they must not silently merge.
    const curated = prog({
      slug: "maker",
      name: "Maker Pass",
      campus: "berkeley",
      website: "https://jacobs.berkeley.edu/Pass",
    });
    const crawled = prog({
      slug: "berkeley-open-lab",
      name: "Open Lab",
      campus: "berkeley",
      sourceUrl: "https://jacobs.berkeley.edu/pass",
    });

    const merged = mergePrograms([curated], [crawled]);

    expect(merged).toHaveLength(2);
  });
});
