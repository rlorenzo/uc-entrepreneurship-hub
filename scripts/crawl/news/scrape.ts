// Playwright-backed listing scraper for hubs without RSS. Fetches a
// /blog/news–style index, harvests article links matching a per-site
// pattern, then visits each article page to pull title, summary, image,
// and publish date.
//
// Self-contained — does not share the browser with scripts/crawl/run.ts
// because that runner is a one-shot top-level await module. Spinning up
// a separate Chromium for the news pass is a few seconds of overhead and
// keeps the pipelines decoupled.

import { chromium, type Page } from "playwright";

import { gotoWithFallback, withPage } from "./playwright.ts";
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

  let imageUrl = meta("og:image") || "";
  if (!imageUrl) {
    // UCSB / Drupal pages don't expose og:image but include a hero <img>
    // inside the article body. Take the first non-icon image we find.
    const imgs = Array.from(document.querySelectorAll("article img, main img, .blog-post img"));
    for (const img of imgs) {
      const src = img.getAttribute("src");
      if (!src) continue;
      if (/icon|logo|sprite|avatar/i.test(src)) continue;
      try {
        imageUrl = new URL(src, location.href).toString();
        break;
      } catch (e) {
        // skip unparseable src
      }
    }
  }

  let publishedAt = "";
  const ldNodes = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  for (const node of ldNodes) {
    try {
      const data = JSON.parse(node.textContent || "{}");
      const arr = Array.isArray(data) ? data : [data];
      for (const obj of arr) {
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
      const t = Date.parse(m[1]);
      if (Number.isFinite(t)) publishedAt = new Date(t).toISOString();
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

function safeUrl(href: string): URL | null {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

async function discoverArticleLinks(
  page: Page,
  listingUrl: string,
  pattern: RegExp,
  denylist: RegExp[],
): Promise<string[]> {
  const origin = new URL(listingUrl).origin;
  const hrefs = await page.$$eval("a[href]", (anchors) => anchors.map((a) => a.href));
  const cleaned = hrefs
    .map(safeUrl)
    .filter((u): u is URL => u !== null && u.origin === origin)
    .filter((u) => pattern.test(u.pathname) && !denylist.some((re) => re.test(u.pathname)))
    .map((u) => u.origin + u.pathname);
  return [...new Set(cleaned)];
}

export async function scrapeNewsListing(
  site: PlaywrightSite,
): Promise<{ items: NewsItem[]; errors: NewsCrawlError[] }> {
  const errors: NewsCrawlError[] = [];
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  try {
    const pattern = new RegExp(site.articleLinkPattern);
    const denylist = (site.linkDenylist ?? []).map((p) => new RegExp(p));
    const pages = site.paginationPages && site.paginationParam ? site.paginationPages : 1;
    const param = site.paginationParam;
    const seen = new Set<string>();
    const links: string[] = [];
    for (let i = 0; i < pages; i++) {
      const pageUrl =
        pages > 1 && param
          ? site.listingUrl + (site.listingUrl.includes("?") ? "&" : "?") + `${param}=${i}`
          : site.listingUrl;
      try {
        const found = await withPage(browser, async (page) => {
          const resp = await gotoWithFallback(page, pageUrl);
          if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"}`);
          return await discoverArticleLinks(page, site.listingUrl, pattern, denylist);
        });
        for (const url of found) {
          if (!seen.has(url)) {
            seen.add(url);
            links.push(url);
          }
        }
      } catch (err) {
        errors.push({ stage: "listing", url: pageUrl, message: (err as Error).message });
      }
    }
    if (links.length === 0 && errors.length > 0) return { items: [], errors };

    const cap = site.maxArticles ?? DEFAULT_MAX;
    const slice = links.slice(0, cap);
    const items: NewsItem[] = [];
    for (const url of slice) {
      try {
        const raw = await withPage(browser, async (page) => {
          const resp = await gotoWithFallback(page, url);
          if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"}`);
          await page.waitForTimeout(400);
          return (await page.evaluate(`(${inPageNewsExtractor})()`)) as RawArticle;
        });
        if (!raw.title) continue;
        if (site.keywordAllowlist?.length) {
          const hay = `${raw.title} ${raw.summary}`.toLowerCase();
          const hit = site.keywordAllowlist.some((k) => hay.includes(k.toLowerCase()));
          if (!hit) continue;
        }
        const sourceHost = (() => {
          try {
            return new URL(url).hostname;
          } catch {
            return undefined;
          }
        })();
        items.push({
          id: buildArticleId(site.campus, url),
          campus: site.campus,
          title: raw.title,
          summary: raw.summary,
          publishedAt: toIsoDate(raw.publishedAt),
          sourceUrl: url,
          imageUrl: raw.imageUrl || undefined,
          sourceHost,
        });
      } catch (err) {
        errors.push({ stage: "article", url, message: (err as Error).message });
      }
    }
    return { items, errors };
  } finally {
    await browser.close();
  }
}
