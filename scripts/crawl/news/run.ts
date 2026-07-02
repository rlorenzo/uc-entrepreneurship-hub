#!/usr/bin/env node
//
// Crawl news from selected UC innovation hubs into data/news/<campus>.json.
// RSS-first when the hub publishes a feed; Playwright fallback for HTML
// listings. Mirrors scripts/crawl/run.ts conventions including the
// "preserve previous file when fetch fails" guard so a transient outage
// can't blank the published feed.
//
// CLI flags:
//   --campus=irvine,berkeley   Restrict to a subset.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { fetchRssNews } from "./rss.ts";
import { scrapeNewsListing } from "./scrape.ts";
import { enrichWithImages } from "./enrich.ts";
import { closeHeadedBrowser } from "../playwright.ts";
import { filterSitesByCampus, parseCampusFlag } from "../cli.ts";
import type { NewsCrawlResult, NewsItem } from "./types.ts";

// Default keyword filter for campus-wide newsrooms. Used when a site sets
// `keywordAllowlist: "default"` in sites.json — keeps the JSON terse and
// gives us one place to tune the entrepreneurship signal.
//
// Mix of strict markers ("startup", "founder") and research-to-impact
// terms ("commercializ", "tech transfer", "spin-out"), since most UC
// newsrooms cover the lab→company arc with research vocabulary, not VC
// vocabulary. "patent" is intentionally omitted — too noisy.
const DEFAULT_KEYWORDS = [
  "entrepreneur",
  "startup",
  "start-up",
  "founder",
  "accelerator",
  "incubator",
  "venture",
  "seed funding",
  "seed round",
  "series a",
  "series b",
  "series c",
  "raised $",
  "raises $",
  "funding round",
  "spinoff",
  "spin-off",
  "spin-out",
  "spinout",
  "demo day",
  "i-corps",
  "icorps",
  "pitch competition",
  "commercializ",
  "tech transfer",
  "technology transfer",
  "innovation award",
  "innovation hub",
  "small business",
];

function resolveKeywordAllowlist(value: SiteConfig["keywordAllowlist"]): string[] | undefined {
  if (value === "default") return DEFAULT_KEYWORDS;
  return value;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..", "..");
const OUT_DIR = join(ROOT, "data", "news");

interface SiteConfig {
  campus: string;
  name: string;
  strategy: "rss" | "playwright";
  feedUrl?: string;
  listingUrl?: string;
  articleLinkPattern?: string;
  linkDenylist?: string[];
  titleDenylist?: string[];
  maxArticles?: number;
  paginationPages?: number;
  paginationParam?: string;
  // "default" pulls in the DEFAULT_KEYWORDS list; an explicit array overrides.
  keywordAllowlist?: string[] | "default";
  // Visit each item's article page to fill in a missing imageUrl.
  // Useful for RSS feeds that don't embed media (innovation.uci.edu).
  enrichImages?: boolean;
}

const sitesAll: SiteConfig[] = JSON.parse(await readFile(join(__dirname, "sites.json"), "utf-8"));
const sites = filterSitesByCampus(sitesAll, parseCampusFlag());
if (sites.length === 0) {
  console.error("No sites match the provided filters. Exiting.");
  process.exit(1);
}

await mkdir(OUT_DIR, { recursive: true });

console.log(`Crawling news from ${sites.length} hub(s) at ${new Date().toISOString()}\n`);

type Harvested = { items: NewsItem[]; errors: NewsCrawlResult["errors"] };

async function harvestRss(site: SiteConfig): Promise<Harvested> {
  if (!site.feedUrl) throw new Error(`${site.campus}: rss strategy requires feedUrl`);
  const { items, errors } = await fetchRssNews({
    campus: site.campus,
    feedUrl: site.feedUrl,
    linkDenylist: site.linkDenylist,
    titleDenylist: site.titleDenylist,
    keywordAllowlist: resolveKeywordAllowlist(site.keywordAllowlist),
  });
  return { items: site.enrichImages ? await enrichWithImages(items) : items, errors };
}

async function harvestPlaywright(site: SiteConfig): Promise<Harvested> {
  if (!site.listingUrl || !site.articleLinkPattern) {
    throw new Error(`${site.campus}: playwright strategy requires listingUrl + articleLinkPattern`);
  }
  return await scrapeNewsListing({
    campus: site.campus,
    listingUrl: site.listingUrl,
    articleLinkPattern: site.articleLinkPattern,
    maxArticles: site.maxArticles,
    paginationPages: site.paginationPages,
    paginationParam: site.paginationParam,
    keywordAllowlist: resolveKeywordAllowlist(site.keywordAllowlist),
    linkDenylist: site.linkDenylist,
  });
}

async function crawlSite(site: SiteConfig): Promise<NewsCrawlResult> {
  console.log(`▸ ${site.name} (${site.strategy})`);
  const harvested =
    site.strategy === "rss" ? await harvestRss(site) : await harvestPlaywright(site);
  console.log(`  ✓ ${harvested.items.length} item(s), ${harvested.errors.length} error(s)`);
  return {
    campus: site.campus,
    name: site.name,
    strategy: site.strategy,
    source: site.feedUrl || site.listingUrl || "",
    crawledAt: new Date().toISOString(),
    items: harvested.items,
    errors: harvested.errors,
  };
}

async function persistResult(result: NewsCrawlResult): Promise<void> {
  const path = join(OUT_DIR, `${result.campus}.json`);
  // If the source fetch failed entirely (no items, errors at the index/feed
  // stage) and we already have a file on disk, keep the previous run rather
  // than overwriting with an empty list. Same pattern as the program crawler.
  const fetchFailed =
    result.items.length === 0 &&
    result.errors.some((e) => e.stage === "feed" || e.stage === "listing");
  if (fetchFailed && existsSync(path)) {
    console.log(`  ⓘ preserving previous ${result.campus}.json — source fetch failed this run`);
    return;
  }
  await writeFile(path, JSON.stringify(result, null, 2));
}

const completed: NewsCrawlResult[] = [];
try {
  for (const site of sites) {
    const result = await crawlSite(site);
    completed.push(result);
    await persistResult(result);
  }
} finally {
  // Shut down the shared headed-fallback Chrome, if any fetch tripped it —
  // an open browser would keep this one-shot script alive.
  await closeHeadedBrowser();
}

const totalItems = completed.reduce((n, r) => n + r.items.length, 0);
const totalErrors = completed.reduce((n, r) => n + r.errors.length, 0);
console.log(
  `\nDone. ${totalItems} news item(s) across ${completed.length} hub(s). ${totalErrors} error(s).`,
);
console.log(`Output → data/news/`);
