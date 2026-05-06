#!/usr/bin/env node
//
// Crawl every UC innovation/entrepreneurship hub and emit one JSON file per
// campus to data/crawled/<campus>.json. Each file lists program candidates
// shaped to satisfy `coerceToProgram` in src/data/normalize.ts.
//
// CLI flags (combine with AND):
//   --campus=berkeley,la     Only scan these campus ids.
//   --limit=5                Cap sub-pages per campus (overrides per-campus default).
//   --concurrency=3          Override default worker count.
//   --dry-run                Print discovered links without extracting.
//
// Architecture mirrors rlorenzo/uc-homepage-a11y-report's scan/run.mjs:
//   - one shared chromium browser, per-site contexts
//   - realistic desktop Chrome UA to slip past simple bot filters
//   - networkidle → load fallback for sites that never go idle
//   - per-site error capture so one failure can't sink the run

import { chromium, type Browser, type Page, type Response } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

import {
  isProgramLink,
  inPageExtractor,
  buildCandidate,
  type CampusOverrides,
  type RawPageData,
} from "./extract.ts";
import type { ProgramCandidate } from "../../src/data/normalize.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "data", "crawled");

const FALLBACK_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

const DEFAULT_CONCURRENCY = 3;
const NAV_TIMEOUT_MS = 30_000;

interface Site {
  campus: string;
  name: string;
  seedUrl: string;
}

interface CrawlError {
  stage: "seed" | "subpage";
  url: string;
  message: string;
}

interface CrawlResult {
  campus: string;
  name: string;
  seedUrl: string;
  crawledAt: string;
  candidates: ProgramCandidate[];
  errors: CrawlError[];
}

interface Flags {
  campus: Set<string> | null;
  limit: number | null;
  concurrency: number;
  dryRun: boolean;
}

// ── CLI parsing ──────────────────────────────────────────────────────────
const flags: Flags = {
  campus: null,
  limit: null,
  concurrency: DEFAULT_CONCURRENCY,
  dryRun: false,
};
for (const arg of process.argv.slice(2)) {
  if (arg === "--dry-run") {
    flags.dryRun = true;
    continue;
  }
  const m = arg.match(/^--(campus|limit|concurrency)=(.+)$/);
  if (!m) continue;
  if (m[1] === "campus") {
    flags.campus = new Set(
      m[2]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  } else if (m[1] === "limit") {
    flags.limit = Number(m[2]);
  } else if (m[1] === "concurrency") {
    flags.concurrency = Number(m[2]);
  }
}

const sitesAll: Site[] = JSON.parse(await readFile(join(__dirname, "sites.json"), "utf-8"));
const sites = flags.campus ? sitesAll.filter((s) => flags.campus?.has(s.campus)) : sitesAll;
if (sites.length === 0) {
  console.error("No sites match the provided filters. Exiting.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const startedAt = new Date().toISOString();
console.log(`Crawling ${sites.length} campus${sites.length === 1 ? "" : "es"} at ${startedAt}\n`);

// ── User-agent resolution ────────────────────────────────────────────────
async function resolveUserAgent(): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch("https://jnrbsn.github.io/user-agents/user-agents.json", {
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const list = (await resp.json()) as string[];
    const candidates = list
      .filter((ua) => ua.includes("Macintosh") && ua.includes("Chrome/") && !ua.includes("Edg/"))
      .map((ua) => ({ ua, version: Number((ua.match(/Chrome\/(\d+)/) ?? [])[1] ?? 0) }))
      .toSorted((a, b) => b.version - a.version);
    if (candidates.length) return candidates[0].ua;
  } catch (err) {
    console.log(`Could not fetch latest UA list (${(err as Error).message}); using fallback.`);
  } finally {
    clearTimeout(timer);
  }
  return FALLBACK_USER_AGENT;
}

const USER_AGENT = await resolveUserAgent();

// ── Per-campus override loader ───────────────────────────────────────────
async function loadOverrides(campusId: string): Promise<CampusOverrides> {
  const path = join(__dirname, "campuses", `${campusId}.mjs`);
  if (existsSync(path)) {
    return (await import(`./campuses/${campusId}.mjs`)) as CampusOverrides;
  }
  return (await import("./campuses/_default.mjs")) as CampusOverrides;
}

// ── Browser setup ────────────────────────────────────────────────────────
const browser: Browser = await chromium.launch({
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"],
});

async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  // Several UC sites (UCI, Merced) sit behind WAFs that 403 a vanilla
  // Playwright context even with a realistic UA. The fingerprints they
  // key on are usually the absence of `navigator.webdriver === false`,
  // missing Accept-Language, or missing client-hint headers. We patch
  // all three before navigating.
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      "sec-ch-ua": '"Chromium";v="139", "Not?A_Brand";v="24"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
    },
  });
  // Hide the automation marker exposed via `navigator.webdriver`. Real
  // Chrome reports `false` here; headless Chromium reports `true`.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  try {
    const page = await context.newPage();
    return await fn(page);
  } finally {
    await context.close();
  }
}

async function gotoWithFallback(page: Page, url: string): Promise<Response | null> {
  try {
    return await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
  } catch (err) {
    if ((err as Error).name === "TimeoutError") {
      return await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS });
    }
    throw err;
  }
}

// Discover internal program-candidate links from a seed URL.
async function discoverLinks(
  page: Page,
  seedUrl: string,
  overrides: CampusOverrides,
): Promise<{ url: string; text: string }[]> {
  const seedOrigin = new URL(seedUrl).origin;
  const all = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => ({ href: a.href, text: (a.textContent || "").replace(/\s+/g, " ").trim() }))
      .filter((x) => x.href),
  );

  const seen = new Set<string>();
  const links: { url: string; text: string }[] = [];
  for (const { href, text } of all) {
    // isProgramLink consults overrides.linkAllowlist for the origin
    // gate, so cross-origin program subdomains (e.g. skydeck.berkeley.edu)
    // can opt in via the per-campus override module.
    if (!isProgramLink(href, text, seedOrigin, overrides)) continue;
    if (overrides.linkDenylist?.some((re) => re.test(href))) continue;
    const url = href.split("#")[0];
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({ url, text });
  }
  return links;
}

// ── Per-campus pipeline ──────────────────────────────────────────────────

interface SeedOutcome {
  links: { url: string; text: string }[];
  error: CrawlError | null;
}

async function fetchSeed(site: Site, overrides: CampusOverrides): Promise<SeedOutcome> {
  try {
    const links = await withPage(async (page) => {
      const resp = await gotoWithFallback(page, site.seedUrl);
      if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"} on seed`);
      return await discoverLinks(page, site.seedUrl, overrides);
    });
    return { links, error: null };
  } catch (err) {
    const message = (err as Error).message;
    console.error(`  ✗ seed failed: ${message}`);
    return { links: [], error: { stage: "seed", url: site.seedUrl, message } };
  }
}

async function extractFromUrl(
  site: Site,
  url: string,
  overrides: CampusOverrides,
): Promise<ProgramCandidate | null> {
  return await withPage(async (page) => {
    const resp = await gotoWithFallback(page, url);
    if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"}`);
    await page.waitForTimeout(800);
    const raw = (await page.evaluate(`(${inPageExtractor})()`)) as RawPageData;
    return buildCandidate({ raw, url, campus: site.campus, campusOverrides: overrides });
  });
}

/** Walk the candidate sub-pages, accumulating extracted programs and errors. */
async function visitCandidates(
  site: Site,
  links: { url: string; text: string }[],
  overrides: CampusOverrides,
): Promise<{ candidates: ProgramCandidate[]; errors: CrawlError[] }> {
  const candidates: ProgramCandidate[] = [];
  const errors: CrawlError[] = [];
  for (const { url } of links) {
    try {
      const candidate = await extractFromUrl(site, url, overrides);
      if (candidate) candidates.push(candidate);
    } catch (err) {
      errors.push({ stage: "subpage", url, message: (err as Error).message });
    }
  }
  return { candidates, errors };
}

/** A program directory often links the same page from multiple sections. */
function dedupeById(candidates: ProgramCandidate[]): ProgramCandidate[] {
  const byId = new Map<string, ProgramCandidate>();
  for (const c of candidates) {
    if (c.id) byId.set(c.id, c);
  }
  return [...byId.values()];
}

function logDryRunPlan(links: { url: string; text: string }[]): void {
  for (const { url, text } of links) {
    console.log(`    • ${text || "(no text)"} → ${url}`);
  }
}

async function crawlCampus(site: Site): Promise<CrawlResult> {
  const overrides = await loadOverrides(site.campus);
  const cap = flags.limit ?? overrides.maxSubpages ?? 30;

  console.log(`▸ ${site.name} — ${site.seedUrl}`);
  const result: CrawlResult = {
    campus: site.campus,
    name: site.name,
    seedUrl: site.seedUrl,
    crawledAt: new Date().toISOString(),
    candidates: [],
    errors: [],
  };

  const seed = await fetchSeed(site, overrides);
  if (seed.error) {
    result.errors.push(seed.error);
    return result;
  }

  const links = seed.links.slice(0, cap);
  console.log(`  ${links.length} candidate sub-page(s)`);
  if (flags.dryRun) {
    logDryRunPlan(links);
    return result;
  }

  const harvested = await visitCandidates(site, links, overrides);
  result.candidates = dedupeById(harvested.candidates);
  result.errors.push(...harvested.errors);

  console.log(`  ✓ ${result.candidates.length} program(s), ${result.errors.length} error(s)`);
  return result;
}

// ── Worker pool over campuses ────────────────────────────────────────────

/**
 * Persist a crawl result, preserving the previous file when the seed
 * fetch failed and a previous run exists. Without this, a transient
 * WAF/DNS outage would write an empty candidates list, the weekly
 * workflow would commit the deletion, and every program for that
 * campus would vanish from the published catalog. A recovered crawl
 * on the next run repopulates it cleanly.
 */
async function persistResult(result: CrawlResult): Promise<void> {
  const path = join(OUT_DIR, `${result.campus}.json`);
  const seedFailed = result.errors.some((e) => e.stage === "seed");
  if (seedFailed && existsSync(path)) {
    console.log(`  ⓘ preserving previous ${result.campus}.json — seed failed this run`);
    return;
  }
  await writeFile(path, JSON.stringify(result, null, 2));
}

const queue: Site[] = [...sites];
const completed: CrawlResult[] = [];
async function worker(): Promise<void> {
  while (queue.length) {
    const site = queue.shift();
    if (!site) break;
    const result = await crawlCampus(site);
    completed.push(result);
    if (!flags.dryRun) await persistResult(result);
  }
}

await Promise.all(Array.from({ length: flags.concurrency }, () => worker()));
await browser.close();

const totalCandidates = completed.reduce((n, r) => n + r.candidates.length, 0);
const totalErrors = completed.reduce((n, r) => n + r.errors.length, 0);
console.log(
  `\nDone. ${totalCandidates} candidate program(s) across ${completed.length} campus(es). ${totalErrors} error(s).`,
);
if (!flags.dryRun) console.log(`Output → data/crawled/`);
