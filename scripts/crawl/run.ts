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

import type { Browser, Page } from "playwright";
import { readFile, mkdir } from "node:fs/promises";
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
import {
  closeHeadedBrowser,
  gotoWithFallback,
  launchHeadlessBrowser,
  withPage as sharedWithPage,
} from "./playwright.ts";
import { hostUserAgentOverride } from "./user-agent.ts";
import { filterSitesByCampus, parseCampusFlag } from "./cli.ts";
import { persistPreservingPrevious } from "./persist.ts";
import type { ProgramCandidate } from "../../src/data/normalize.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "data", "crawled");

const DEFAULT_CONCURRENCY = 3;

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
  campus: parseCampusFlag(),
  limit: null,
  concurrency: DEFAULT_CONCURRENCY,
  dryRun: false,
};
for (const arg of process.argv.slice(2)) {
  if (arg === "--dry-run") {
    flags.dryRun = true;
    continue;
  }
  const m = arg.match(/^--(limit|concurrency)=(.+)$/);
  if (!m) continue;
  if (m[1] === "limit") flags.limit = Number(m[2]);
  else if (m[1] === "concurrency") flags.concurrency = Number(m[2]);
}

const sitesAll: Site[] = JSON.parse(await readFile(join(__dirname, "sites.json"), "utf-8"));
const sites = filterSitesByCampus(sitesAll, flags.campus);
if (sites.length === 0) {
  console.error("No sites match the provided filters. Exiting.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const startedAt = new Date().toISOString();
console.log(`Crawling ${sites.length} campus${sites.length === 1 ? "" : "es"} at ${startedAt}\n`);

// ── Per-campus override loader ───────────────────────────────────────────
async function loadOverrides(campusId: string): Promise<CampusOverrides> {
  const path = join(__dirname, "campuses", `${campusId}.mjs`);
  if (existsSync(path)) {
    return (await import(`./campuses/${campusId}.mjs`)) as CampusOverrides;
  }
  return (await import("./campuses/_default.mjs")) as CampusOverrides;
}

// ── Browser setup ────────────────────────────────────────────────────────
const browser: Browser = await launchHeadlessBrowser();

// Some UC sites (UCI, Merced) sit behind WAFs that 403 a vanilla Playwright
// context even with a realistic UA. The extra client-hint headers below
// strengthen the Chrome fingerprint past those filters; the news crawler
// doesn't need them, so they live here rather than in the shared helper.
const PROGRAM_CRAWL_HEADERS = {
  "sec-ch-ua": '"Chromium";v="139", "Not?A_Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
};

// `userAgent` overrides the default Chrome UA for this context — used to send
// UC Merced's WAF-allowlisted UA (from the MERCED_USER_AGENT secret) on
// research.ucmerced.edu, so the crawl clears once their exception is live.
function withPage<T>(fn: (page: Page) => Promise<T>, userAgent?: string): Promise<T> {
  return sharedWithPage(browser, fn, { extraHTTPHeaders: PROGRAM_CRAWL_HEADERS, userAgent });
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
      .map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: (a.textContent || "").replace(/\s+/g, " ").trim(),
      }))
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
    }, hostUserAgentOverride(site.seedUrl));
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
  }, hostUserAgentOverride(url));
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

async function persistResult(result: CrawlResult): Promise<void> {
  await persistPreservingPrevious({
    path: join(OUT_DIR, `${result.campus}.json`),
    label: `${result.campus}.json`,
    isEmpty: result.candidates.length === 0,
    emptyReason: "no candidates this run",
    result,
  });
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

try {
  await Promise.all(Array.from({ length: flags.concurrency }, () => worker()));
} finally {
  await browser.close();
  // Also shut down the shared headed-fallback Chrome, if any navigation
  // tripped it — an open browser would keep this one-shot script alive.
  await closeHeadedBrowser();
}

const totalCandidates = completed.reduce((n, r) => n + r.candidates.length, 0);
const totalErrors = completed.reduce((n, r) => n + r.errors.length, 0);
console.log(
  `\nDone. ${totalCandidates} candidate program(s) across ${completed.length} campus(es). ${totalErrors} error(s).`,
);
if (!flags.dryRun) console.log(`Output → data/crawled/`);
