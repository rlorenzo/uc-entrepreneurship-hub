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

import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

import { isProgramLink, inPageExtractor, buildCandidate } from "./extract.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "data", "crawled");

const FALLBACK_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

const DEFAULT_CONCURRENCY = 3;
const NAV_TIMEOUT_MS = 30_000;

// ── CLI parsing ──────────────────────────────────────────────────────────
const flags = { campus: null, limit: null, concurrency: DEFAULT_CONCURRENCY, dryRun: false };
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

const sitesAll = JSON.parse(await readFile(join(__dirname, "sites.json"), "utf-8"));
const sites = flags.campus ? sitesAll.filter((s) => flags.campus.has(s.campus)) : sitesAll;
if (sites.length === 0) {
  console.error("No sites match the provided filters. Exiting.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

const startedAt = new Date().toISOString();
console.log(`Crawling ${sites.length} campus${sites.length === 1 ? "" : "es"} at ${startedAt}\n`);

// ── User-agent resolution ────────────────────────────────────────────────
async function resolveUserAgent() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch("https://jnrbsn.github.io/user-agents/user-agents.json", {
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const list = await resp.json();
    const candidates = list
      .filter((ua) => ua.includes("Macintosh") && ua.includes("Chrome/") && !ua.includes("Edg/"))
      .map((ua) => ({ ua, version: Number((ua.match(/Chrome\/(\d+)/) || [])[1] || 0) }))
      .toSorted((a, b) => b.version - a.version);
    if (candidates.length) return candidates[0].ua;
  } catch (err) {
    console.log(`Could not fetch latest UA list (${err.message}); using fallback.`);
  } finally {
    clearTimeout(timer);
  }
  return FALLBACK_USER_AGENT;
}

const USER_AGENT = await resolveUserAgent();

// ── Per-campus override loader ───────────────────────────────────────────
async function loadOverrides(campusId) {
  const path = join(__dirname, "campuses", `${campusId}.mjs`);
  if (existsSync(path)) {
    return await import(`./campuses/${campusId}.mjs`);
  }
  return await import("./campuses/_default.mjs");
}

// ── Browser setup ────────────────────────────────────────────────────────
const browser = await chromium.launch({
  headless: true,
  args: ["--disable-blink-features=AutomationControlled"],
});

async function withPage(fn) {
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

async function gotoWithFallback(page, url) {
  try {
    return await page.goto(url, { waitUntil: "networkidle", timeout: NAV_TIMEOUT_MS });
  } catch (err) {
    if (err.name === "TimeoutError") {
      return await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS });
    }
    throw err;
  }
}

// Discover internal program-candidate links from a seed URL.
async function discoverLinks(page, seedUrl, overrides) {
  const seedOrigin = new URL(seedUrl).origin;
  const all = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => ({ href: a.href, text: (a.textContent || "").replace(/\s+/g, " ").trim() }))
      .filter((x) => x.href),
  );

  const seen = new Set();
  const links = [];
  for (const { href, text } of all) {
    if (!isProgramLink(href, text, seedOrigin)) continue;
    if (overrides.linkAllowlist?.length && !overrides.linkAllowlist.some((re) => re.test(href))) {
      continue;
    }
    if (overrides.linkDenylist?.some((re) => re.test(href))) continue;
    const url = href.split("#")[0];
    if (seen.has(url)) continue;
    seen.add(url);
    links.push({ url, text });
  }
  return links;
}

// ── Per-campus pipeline ──────────────────────────────────────────────────
async function crawlCampus(site) {
  const overrides = await loadOverrides(site.campus);
  const cap = flags.limit ?? overrides.maxSubpages ?? 30;

  console.log(`▸ ${site.name} — ${site.seedUrl}`);
  const result = {
    campus: site.campus,
    name: site.name,
    seedUrl: site.seedUrl,
    crawledAt: new Date().toISOString(),
    candidates: [],
    errors: [],
  };

  let candidateLinks = [];
  try {
    candidateLinks = await withPage(async (page) => {
      const resp = await gotoWithFallback(page, site.seedUrl);
      if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"} on seed`);
      return await discoverLinks(page, site.seedUrl, overrides);
    });
  } catch (err) {
    console.error(`  ✗ seed failed: ${err.message}`);
    result.errors.push({ stage: "seed", url: site.seedUrl, message: err.message });
    return result;
  }

  candidateLinks = candidateLinks.slice(0, cap);
  console.log(`  ${candidateLinks.length} candidate sub-page(s)`);

  if (flags.dryRun) {
    for (const { url, text } of candidateLinks)
      console.log(`    • ${text || "(no text)"} → ${url}`);
    return result;
  }

  // Sequential per-campus to keep memory bounded; cross-campus parallelism
  // happens at the worker-pool layer.
  for (const { url } of candidateLinks) {
    try {
      const candidate = await withPage(async (page) => {
        const resp = await gotoWithFallback(page, url);
        if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"}`);
        await page.waitForTimeout(800);
        const raw = await page.evaluate(`(${inPageExtractor})()`);
        return buildCandidate({ raw, url, campus: site.campus, campusOverrides: overrides });
      });
      if (candidate) {
        result.candidates.push(candidate);
      }
    } catch (err) {
      result.errors.push({ stage: "subpage", url, message: err.message });
    }
  }

  // Dedupe by slug — a program directory page often links to the same
  // program from multiple sections.
  const bySlug = new Map();
  for (const c of result.candidates) bySlug.set(c.slug, c);
  result.candidates = [...bySlug.values()];

  console.log(`  ✓ ${result.candidates.length} program(s), ${result.errors.length} error(s)`);
  return result;
}

// ── Worker pool over campuses ────────────────────────────────────────────
const queue = [...sites];
const completed = [];
async function worker() {
  while (queue.length) {
    const site = queue.shift();
    const result = await crawlCampus(site);
    if (!flags.dryRun) {
      const path = join(OUT_DIR, `${site.campus}.json`);
      await writeFile(path, JSON.stringify(result, null, 2));
    }
    completed.push(result);
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
