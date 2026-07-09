import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, expect, afterEach } from "vite-plus/test";
import { persistPreservingPrevious } from "./persist.ts";

// This helper is the single safety net keeping an empty crawl run from
// blanking a campus's published catalog/news file — exercise every branch.
describe("persistPreservingPrevious", () => {
  const dirs: string[] = [];
  const tempPath = (name: string): string => {
    const dir = mkdtempSync(join(tmpdir(), "persist-test-"));
    dirs.push(dir);
    return join(dir, name);
  };
  afterEach(() => {
    while (dirs.length) rmSync(dirs.pop() as string, { recursive: true, force: true });
  });

  it("writes a non-empty result", async () => {
    const path = tempPath("campus.json");
    await persistPreservingPrevious({
      path,
      label: "campus.json",
      isEmpty: false,
      emptyReason: "no candidates this run",
      result: { candidates: [1, 2] },
    });
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({ candidates: [1, 2] });
  });

  it("preserves the previous file when the run came back empty", async () => {
    const path = tempPath("campus.json");
    writeFileSync(path, JSON.stringify({ candidates: ["previous"] }));
    await persistPreservingPrevious({
      path,
      label: "campus.json",
      isEmpty: true,
      emptyReason: "no candidates this run",
      result: { candidates: [] },
    });
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({ candidates: ["previous"] });
  });

  it("writes an empty result when there is no previous file to preserve", async () => {
    const path = tempPath("campus.json");
    expect(existsSync(path)).toBe(false);
    await persistPreservingPrevious({
      path,
      label: "campus.json",
      isEmpty: true,
      emptyReason: "no items this run",
      result: { items: [] },
    });
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({ items: [] });
  });

  it("overwrites a previous file with a non-empty result", async () => {
    const path = tempPath("campus.json");
    writeFileSync(path, JSON.stringify({ items: ["stale"] }));
    await persistPreservingPrevious({
      path,
      label: "campus.json",
      isEmpty: false,
      emptyReason: "no items this run",
      result: { items: ["fresh"] },
    });
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({ items: ["fresh"] });
  });
});
