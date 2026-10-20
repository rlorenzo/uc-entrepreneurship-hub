// Best-effort image enrichment for feed items.
//
// UCI's WordPress RSS doesn't embed media, so the items land with no
// imageUrl. For each article we first fetch the HTML with the crawler's
// honest feed UA and read og:image (newsrooms like news.ucsc.edu 403 a
// Chrome UA but serve this one), then fall back to Playwright (og:image,
// then the first non-icon body img). Every candidate is HEAD-checked so a
// dead URL never ships. Failures are silent — an item without an image is
// acceptable; we'd rather ship the item than block on imagery.

import type { Browser } from "playwright";

import {
  assertRobotsAllows,
  fetchBodyWithHeadedChrome,
  getHeadlessBrowser,
  gotoWithFallback,
  headedFallbackEnabled,
  isBotBlockedStatus,
  withPage,
} from "../playwright.ts";
import { IN_PAGE_HERO_IMAGE_FN } from "../page-snippets.ts";
import { sanitizeImageUrl } from "../../../src/data/normalize.ts";
import { decodeEntities, userAgentForFeed } from "./rss.ts";
import type { NewsItem } from "./types.ts";

const FETCH_TIMEOUT_MS = 15_000;

export function ogImageFromHtml(html: string): string {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\b(?:property|name)=["'](?:og:image|twitter:image)["']/i.test(tag)) continue;
    const m = tag.match(/\bcontent=["']([^"']+)["']/i);
    if (m) return decodeEntities(m[1]).trim();
  }
  return "";
}

async function fetchOgImage(url: string): Promise<string> {
  await assertRobotsAllows(url);
  const resp = await fetch(url, {
    headers: { "User-Agent": userAgentForFeed(url), Accept: "text/html" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  let html = "";
  if (resp.ok) html = await resp.text();
  // Same fallback the feed download uses: the news.ucsc.edu feed gets through
  // headed Chrome in CI while Node's fetch and headless Playwright get 403.
  else if (isBotBlockedStatus(resp.status) && headedFallbackEnabled()) {
    html = await fetchBodyWithHeadedChrome(url);
  }
  return sanitizeImageUrl(ogImageFromHtml(html), url) ?? "";
}

// Only a definite "gone" (404/410) rejects the image. Other statuses (HEAD
// 403/405 from CDNs) and network errors keep it: the host may merely dislike
// HEAD or be flaky from CI, and the browser can still load it.
async function imageLoads(imageUrl: string, pageUrl: string): Promise<boolean> {
  try {
    const resp = await fetch(imageUrl, {
      method: "HEAD",
      headers: { "User-Agent": userAgentForFeed(imageUrl), Referer: pageUrl },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return resp.status !== 404 && resp.status !== 410;
  } catch {
    return true;
  }
}

async function fetchImage(browser: Browser, url: string): Promise<string> {
  return await withPage(browser, async (page) => {
    const resp = await gotoWithFallback(page, url);
    if (!resp?.ok()) return "";
    await page.waitForTimeout(300);
    return (await page.evaluate(`(${IN_PAGE_HERO_IMAGE_FN})()`)) as string;
  });
}

async function tryFetchImage(browser: Browser, url: string): Promise<string> {
  try {
    const og = await fetchOgImage(url).catch(() => "");
    if (og && (await imageLoads(og, url))) return og;
    return await fetchImage(browser, url);
  } catch {
    // best-effort: an item without an image is acceptable
    return "";
  }
}

async function enrichLoop(
  browser: Browser,
  items: NewsItem[],
  needs: NewsItem[],
): Promise<NewsItem[]> {
  const byId = new Map(items.map((i) => [i.id, i] as const));
  for (const item of needs) {
    const url = await tryFetchImage(browser, item.sourceUrl);
    if (!url || url === item.imageUrl || !(await imageLoads(url, item.sourceUrl))) continue;
    byId.set(item.id, { ...item, imageUrl: url });
  }
  return items.map((i) => byId.get(i.id) ?? i);
}

// `all` re-checks items that already have a feed image, for feeds whose
// image lives on the aggregator host rather than the article's (Berkeley).
export async function enrichWithImages(items: NewsItem[], all = false): Promise<NewsItem[]> {
  const needs = all ? items : items.filter((i) => !i.imageUrl);
  if (needs.length === 0) return items;
  // Shared with the listing scraper — the runner closes it at shutdown via
  // closeHeadlessBrowser(), so each site doesn't pay a Chromium cold start.
  const browser = await getHeadlessBrowser();
  return await enrichLoop(browser, items, needs);
}
