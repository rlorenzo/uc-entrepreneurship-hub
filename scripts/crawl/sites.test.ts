import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vite-plus/test";
import { CAMPUS_BY_ID } from "../../src/data/campuses.ts";

// The crawl configs repeat campus ids and hub URLs that canonically live in
// src/data/campuses.ts. Drift is otherwise silent: a renamed campus id would
// emit crawled programs no campus page lists, and a moved hub would keep the
// crawler seeding a dead URL after the UI link was fixed.

const __dirname = dirname(fileURLToPath(import.meta.url));

interface ProgramSeed {
  campus: string;
  name: string;
  seedUrl: string;
}

interface NewsSite {
  campus: string;
  name: string;
}

const programSeeds = JSON.parse(
  readFileSync(join(__dirname, "sites.json"), "utf-8"),
) as ProgramSeed[];
const newsSites = JSON.parse(
  readFileSync(join(__dirname, "news", "sites.json"), "utf-8"),
) as NewsSite[];

describe("crawl config ↔ campus catalog sync", () => {
  it("every program-crawl seed references a known campus id", () => {
    const bad = programSeeds.filter((s) => !CAMPUS_BY_ID[s.campus]).map((s) => s.campus);
    expect(bad).toEqual([]);
  });

  it("every news-crawl site references a known campus id", () => {
    const bad = newsSites.filter((s) => !CAMPUS_BY_ID[s.campus]).map((s) => s.campus);
    expect(bad).toEqual([]);
  });

  it("every seedUrl matches the campus hubUrl (documented keep-in-sync contract)", () => {
    const mismatched = programSeeds
      .filter((s) => CAMPUS_BY_ID[s.campus] && s.seedUrl !== CAMPUS_BY_ID[s.campus].hubUrl)
      .map((s) => `${s.campus}: seed ${s.seedUrl} != hub ${CAMPUS_BY_ID[s.campus].hubUrl}`);
    expect(mismatched).toEqual([]);
  });
});
