// Playwright-backed listing scraper for hubs without RSS. Fetches a
// /blog/news–style index, harvests article links matching a per-site
// pattern, then visits each article page to pull title, summary, image,
// and publish date.
//
// Uses the news pipeline's shared headless browser (see getHeadlessBrowser in
// ../playwright.ts) so each configured site doesn't pay a multi-second
// Chromium cold start; the news runner closes it at shutdown. Still decoupled
// from scripts/crawl/run.ts, which is a separate one-shot process.

import type { Browser, Page } from "playwright";

import { getHeadlessBrowser, gotoWithFallback, withPage } from "../playwright.ts";
import { IN_PAGE_HERO_IMAGE_FN } from "../page-snippets.ts";
import { safeUrl, hostOf } from "../url.ts";
import { buildArticleId } from "./id.ts";
import { toIsoDate } from "./dates.ts";
import type { NewsCrawlError, NewsItem } from "./types.ts";

export interface PlaywrightSite {
  campus: string;
  listingUrl: string;
  articleLinkPattern: string;
  maxArticles?: number;
  // Many CMS listings paginate via ?page=N (Drupal, e.g. innovation.ucsb.edu).
  // When set, walk pages 0..paginationPages-1 and union the harvested links.
  paginationPages?: number;
  paginationParam?: string;
  // Drop articles whose title+summary doesn't contain any of these
  // case-insensitive substrings. Used for campus-wide newsrooms where
  // only the entrepreneurship slice is on-topic.
  keywordAllowlist?: string[];
  // Skip article URLs whose path matches any of these regex patterns.
  // Useful when a listing page mixes real articles with nav subpages
  // that happen to share the article URL prefix (e.g. UCLA Anderson's
  // /news-and-events/press-releases is a section, not a story).
  linkDenylist?: string[];
}

const DEFAULT_MAX = 20;

const inPageNewsExtractor = `() => {
  const text = (el) => (el?.textContent || "").replace(/\\s+/g, " ").trim();
  const meta = (n) =>
    document.querySelector('meta[property="' + n + '"], meta[name="' + n + '"]')?.content || "";

  // Title-resolution waterfall: <title> tag (split off site suffix), then
  // article h1/h2, then og:title. UCSF's pages have a banner <h1>UCSF
  // Innovation News</h1> on every article and no og:title; the real title
  // lives in <title> and an inner h2. Drupal/WordPress sites usually agree
  // on <title>"Article" | "Site"</title>, so splitting on common separators
  // works as a universal first pass.
  const docTitle = ((document.title || "").split(/\\s+[|\\u2013\\u2014]\\s+/)[0] || "").trim();
  const h1Text = text(document.querySelector("article h1, main h1, h1"));
  const h2Text = text(document.querySelector("article h2, main h2"));
  const looksLikeBanner = (s) =>
    !s || /^(home|news|newsroom|innovation news|latest|stories)$/i.test(s) ||
    /\\bnewsroom\\b/i.test(s);
  const candidates = [docTitle, h1Text, h2Text, meta("og:title")].filter(
    (s) => s && !looksLikeBanner(s),
  );
  const title = candidates[0] || docTitle || h1Text || meta("og:title") || "";

  const summary =
    meta("og:description") ||
    meta("description") ||
    text(document.querySelector("article p, main p, .lead, p"));

  // UCSB / Drupal pages don't expose og:image but include a hero <img>
  // inside the article body; the shared heuristic covers both shapes.
  const imageUrl = (${IN_PAGE_HERO_IMAGE_FN})();

  let publishedAt = "";
  const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const node of ldNodes) {
    try {
      const data = JSON.parse(node.textContent || "{}");
      const tops = Array.isArray(data) ? data : [data];
      // WordPress/Yoast emit { "@graph": [ { @type: "Article", datePublished },
      // ... ] }, so descend into @graph rather than only reading root objects.
      const nodes = [];
      for (const top of tops) {
        if (top && Array.isArray(top["@graph"])) nodes.push(...top["@graph"]);
        else nodes.push(top);
      }
      for (const obj of nodes) {
        if (obj && typeof obj.datePublished === "string") {
          publishedAt = obj.datePublished;
          break;
        }
      }
      if (publishedAt) break;
    } catch (e) {
      // skip malformed JSON-LD
    }
  }
  if (!publishedAt) {
    publishedAt =
      document.querySelector("time[datetime]")?.getAttribute("datetime") ||
      meta("article:published_time") ||
      "";
  }
  if (!publishedAt) {
    // UCSB / Drupal pattern: byline like "By Staff Writer - May 4, 2026"
    // inside <footer class="byline"> <div class="author">. Fall back to a
    // free-text scan of likely byline containers.
    const byline = text(
      document.querySelector(".byline, .author, .post-meta, footer.byline, time, .date"),
    );
    const m = byline.match(
      /\\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.? \\d{1,2},? \\d{4})\\b/,
    );
    if (m) {
      // Hand the raw match to toIsoDate (Node side), which interprets tz-less
      // dates as Pacific. Converting here would use the crawl browser's zone.
      publishedAt = m[1];
    }
  }

  return { title, summary: summary.slice(0, 400), imageUrl, publishedAt };
}`;

interface RawArticle {
  title: string;
  summary: string;
  imageUrl: string;
  publishedAt: string;
}

async function discoverArticleLinks(
  page: Page,
  listingUrl: string,
  pattern: RegExp,
  denylist: RegExp[],
): Promise<string[]> {
  const origin = new URL(listingUrl).origin;
  const hrefs = await page.$$eval("a[href]", (anchors) =>
    anchors.map((a) => (a as HTMLAnchorElement).href),
  );
  const cleaned = hrefs
    .map(safeUrl)
    .filter((u): u is URL => u !== null && u.origin === origin)
    .filter((u) => pattern.test(u.pathname) && !denylist.some((re) => re.test(u.pathname)))
    .map((u) => u.origin + u.pathname);
  return [...new Set(cleaned)];
}

function paginatedUrl(base: string, param: string | undefined, page: number): string {
  if (!param || page === 0) return base;
  return base + (base.includes("?") ? "&" : "?") + `${param}=${page}`;
}

function passesKeywordFilter(raw: RawArticle, allowlist: string[] | undefined): boolean {
  if (!allowlist?.length) return true;
  const hay = `${raw.title} ${raw.summary}`.toLowerCase();
  return allowlist.some((k) => hay.includes(k.toLowerCase()));
}

async function harvestPage(
  browser: Browser,
  pageUrl: string,
  listingUrl: string,
  pattern: RegExp,
  denylist: RegExp[],
): Promise<string[]> {
  return await withPage(browser, async (page) => {
    const resp = await gotoWithFallback(page, pageUrl);
    if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"}`);
    return await discoverArticleLinks(page, listingUrl, pattern, denylist);
  });
}

function unionInto(target: { seen: Set<string>; links: string[] }, found: string[]): void {
  for (const url of found) {
    if (target.seen.has(url)) continue;
    target.seen.add(url);
    target.links.push(url);
  }
}

function paginationCount(site: PlaywrightSite): number {
  return site.paginationPages && site.paginationParam ? site.paginationPages : 1;
}

async function harvestAllListings(
  browser: Browser,
  site: PlaywrightSite,
  pattern: RegExp,
  denylist: RegExp[],
): Promise<{ links: string[]; errors: NewsCrawlError[] }> {
  const errors: NewsCrawlError[] = [];
  const acc = { seen: new Set<string>(), links: [] as string[] };
  for (let i = 0; i < paginationCount(site); i++) {
    const pageUrl = paginatedUrl(site.listingUrl, site.paginationParam, i);
    try {
      unionInto(acc, await harvestPage(browser, pageUrl, site.listingUrl, pattern, denylist));
    } catch (err) {
      errors.push({ stage: "listing", url: pageUrl, message: (err as Error).message });
    }
  }
  return { links: acc.links, errors };
}

async function fetchArticle(browser: Browser, url: string): Promise<RawArticle> {
  return await withPage(browser, async (page) => {
    const resp = await gotoWithFallback(page, url);
    if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"}`);
    await page.waitForTimeout(400);
    return (await page.evaluate(`(${inPageNewsExtractor})()`)) as RawArticle;
  });
}

function makeItem(site: PlaywrightSite, url: string, raw: RawArticle): NewsItem {
  return {
    id: buildArticleId(site.campus, url),
    campus: site.campus,
    title: raw.title,
    summary: raw.summary,
    publishedAt: toIsoDate(raw.publishedAt),
    sourceUrl: url,
    imageUrl: raw.imageUrl || undefined,
    sourceHost: hostOf(url),
  };
}

async function tryExtract(
  browser: Browser,
  site: PlaywrightSite,
  url: string,
): Promise<NewsItem | null> {
  const raw = await fetchArticle(browser, url);
  if (!raw.title || !passesKeywordFilter(raw, site.keywordAllowlist)) return null;
  return makeItem(site, url, raw);
}

async function collectArticle(
  browser: Browser,
  site: PlaywrightSite,
  url: string,
  errors: NewsCrawlError[],
): Promise<NewsItem | null> {
  try {
    return await tryExtract(browser, site, url);
  } catch (err) {
    errors.push({ stage: "article", url, message: (err as Error).message });
    return null;
  }
}

async function extractItems(
  browser: Browser,
  site: PlaywrightSite,
  links: string[],
): Promise<{ items: NewsItem[]; errors: NewsCrawlError[] }> {
  const errors: NewsCrawlError[] = [];
  const items: NewsItem[] = [];
  const cap = site.maxArticles ?? DEFAULT_MAX;
  // Cap the number of KEPT articles, not links visited. tryExtract applies the
  // keywordAllowlist, and on a campus-wide newsroom the on-topic stories often
  // sit past the first `cap` links — slicing to `cap` up front would let
  // off-topic articles eat the budget and starve the result. Stop once we have
  // `cap` matches, or exhaust the harvested links (already bounded by the
  // listing harvest and paginationPages).
  for (const url of links) {
    if (items.length >= cap) break;
    const item = await collectArticle(browser, site, url, errors);
    if (item) items.push(item);
  }
  return { items, errors };
}

export async function scrapeNewsListing(
  site: PlaywrightSite,
): Promise<{ items: NewsItem[]; errors: NewsCrawlError[] }> {
  // Shared across sites and with the image enricher; the news runner closes
  // it at shutdown via closeHeadlessBrowser().
  const browser = await getHeadlessBrowser();
  const pattern = new RegExp(site.articleLinkPattern);
  const denylist = (site.linkDenylist ?? []).map((p) => new RegExp(p));
  const listing = await harvestAllListings(browser, site, pattern, denylist);
  if (listing.links.length === 0 && listing.errors.length > 0) {
    return { items: [], errors: listing.errors };
  }
  const extracted = await extractItems(browser, site, listing.links);
  return {
    items: extracted.items,
    errors: [...listing.errors, ...extracted.errors],
  };
}
