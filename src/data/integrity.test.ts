import { describe, it, expect } from "vite-plus/test";
import { PROGRAMS } from "./programs.ts";
import { CAMPUSES, CAMPUS_BY_ID } from "./campuses.ts";
import { TYPE_BY_ID } from "./types-list.ts";

// These guard the shipped catalog (curated + crawled, merged) against bad
// data sneaking in from a crawl run: dangling type/campus ids, duplicate
// keys, or empty content the UI would render blank.
describe("PROGRAMS catalog integrity", () => {
  it("contains at least one program", () => {
    expect(PROGRAMS.length).toBeGreaterThan(0);
  });

  it("every program references a known program type", () => {
    const bad = PROGRAMS.filter((p) => !TYPE_BY_ID[p.type]).map((p) => `${p.id}:${p.type}`);
    expect(bad).toEqual([]);
  });

  it("every program references a known campus", () => {
    const bad = PROGRAMS.filter((p) => !CAMPUS_BY_ID[p.campus]).map((p) => `${p.id}:${p.campus}`);
    expect(bad).toEqual([]);
  });

  it("program routing keys (slug ?? id) are unique", () => {
    const keys = PROGRAMS.map((p) => p.slug ?? p.id);
    const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
    expect(dupes).toEqual([]);
  });

  it("every program has a non-empty name and description", () => {
    const bad = PROGRAMS.filter((p) => !p.name?.trim() || !p.desc?.trim()).map((p) => p.id);
    expect(bad).toEqual([]);
  });
});

describe("CAMPUSES integrity", () => {
  it("campus ids are unique", () => {
    const ids = CAMPUSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("campus coordinates fall within California's bounding box", () => {
    for (const c of CAMPUSES) {
      expect(c.lat, `${c.id} lat`).toBeGreaterThan(32);
      expect(c.lat, `${c.id} lat`).toBeLessThan(42.1);
      expect(c.lon, `${c.id} lon`).toBeGreaterThan(-125);
      expect(c.lon, `${c.id} lon`).toBeLessThan(-114);
    }
  });
});
