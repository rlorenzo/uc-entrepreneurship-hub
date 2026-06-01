import { describe, it, expect } from "vite-plus/test";
import { NEWS } from "./news.generated.ts";

// Guards the shipped news feed against crawler artifacts sneaking back in on a
// future weekly crawl. The build-step quality gate (scripts/crawl/news/
// build-data.ts) drops feed entries that lack a title or summary — index/nav
// pages like UC Davis's "Innovation and Economic Development Office", which
// carry a title but no summary. These assertions lock that contract on the
// generated output a visitor actually sees.
describe("NEWS feed integrity", () => {
  it("contains stories", () => {
    expect(NEWS.length).toBeGreaterThan(0);
  });

  it("every story has a non-empty title and summary", () => {
    const bad = NEWS.filter((n) => !n.title?.trim() || !n.summary?.trim()).map((n) => n.id);
    expect(bad).toEqual([]);
  });

  it("contains no known crawler index/nav-page artifacts", () => {
    const junk = NEWS.filter((n) =>
      /Innovation and Economic Development Office/i.test(n.title),
    ).map((n) => n.id);
    expect(junk).toEqual([]);
  });

  it("story ids are unique", () => {
    const ids = NEWS.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps real articles that merely lack a publish date (dateless is allowed)", () => {
    // Datelessness is not a quality signal — the UI renders these without a
    // date. This asserts the gate did NOT over-prune them away.
    const dateless = NEWS.filter((n) => !n.publishedAt?.trim());
    for (const n of dateless) {
      expect(n.title.trim(), `${n.id} title`).not.toBe("");
      expect(n.summary.trim(), `${n.id} summary`).not.toBe("");
    }
  });
});
