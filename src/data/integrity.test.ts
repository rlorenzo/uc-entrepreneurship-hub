import { describe, it, expect } from "vite-plus/test";
import { PROGRAMS, PROGRAM_COUNT, PROGRAM_COUNT_BY_TYPE } from "./programs.ts";
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

// The hero badge, the home category grid, and the discover header all render
// these derived numbers. They must reconcile with the real catalog — the
// product's brand is accurate counts, and an earlier version inflated them by
// hand ("140+", a hardcoded per-type grid) while /discover showed the truth.
describe("derived program counts", () => {
  it("PROGRAM_COUNT equals the merged catalog length", () => {
    expect(PROGRAM_COUNT).toBe(PROGRAMS.length);
  });

  it("the per-type breakdown sums to the total (no inflation, no omission)", () => {
    const sum = Object.values(PROGRAM_COUNT_BY_TYPE).reduce((a, b) => a + b, 0);
    expect(sum).toBe(PROGRAM_COUNT);
  });

  it("every counted type is a known type and matches a direct count of the catalog", () => {
    for (const [type, count] of Object.entries(PROGRAM_COUNT_BY_TYPE)) {
      expect(TYPE_BY_ID[type], `unknown type ${type}`).toBeDefined();
      expect(count, `count for ${type}`).toBe(PROGRAMS.filter((p) => p.type === type).length);
    }
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
