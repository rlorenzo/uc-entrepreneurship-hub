// Best-effort image enrichment for items whose source feed didn't carry one.
//
// UCI's WordPress RSS doesn't embed media, so the items land with no
// imageUrl. We open each article page in Playwright and pull the hero
// image (og:image first, then the first non-icon body img). Failures are
// silent — an item without an image is acceptable; we'd rather ship the
// item than block on imagery.

import { chromium, type Browser } from "playwright";

import { gotoWithFallback, withPage } from "../playwright.ts";
import type { NewsItem } from "./types.ts";

const inPageImageExtractor = `() => {
  const meta = (n) =>
    document.querySelector('meta[property="' + n + '"], meta[name="' + n + '"]')?.content || "";
  const og = meta("og:image");
  if (og) return og;
  const imgs = Array.from(
    document.querySelectorAll("article img, main img, .entry-content img, .post-content img"),
  );
  for (const el of imgs) {
    const src = el.getAttribute("src");
    if (!src) continue;
    if (/icon|logo|sprite|avatar/i.test(src)) continue;
    try {
      return new URL(src, location.href).toString();
    } catch (e) {
      // skip unparseable src
    }
  }
  return "";
}`;

async function fetchImage(browser: Browser, url: string): Promise<string> {
  return await withPage(browser, async (page) => {
    const resp = await gotoWithFallback(page, url);
    if (!resp?.ok()) return "";
    await page.waitForTimeout(300);
    return (await page.evaluate(`(${inPageImageExtractor})()`)) as string;
  });
}

async function tryFetchImage(browser: Browser, url: string): Promise<string> {
  try {
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
    if (!url) continue;
    const existing = byId.get(item.id);
    if (existing) byId.set(item.id, { ...existing, imageUrl: url });
  }
  return items.map((i) => byId.get(i.id) ?? i);
}

export async function enrichWithImages(items: NewsItem[]): Promise<NewsItem[]> {
  const needs = items.filter((i) => !i.imageUrl);
  if (needs.length === 0) return items;
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
  try {
    return await enrichLoop(browser, items, needs);
  } finally {
    await browser.close();
  }
}
