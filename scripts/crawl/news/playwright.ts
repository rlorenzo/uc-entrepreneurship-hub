// Shared Playwright bootstrap for the news crawler. The article scraper and
// the image-enrichment pass both want the same anti-fingerprint context
// (real Chrome UA, Accept-Language header, no `navigator.webdriver === true`)
// and the same goto-with-fallback timing — keep them in one place.

import type { Browser, Page, Response } from "playwright";

import { resolveUserAgent } from "../user-agent.ts";

const NAV_TIMEOUT_MS = 30_000;

export async function gotoWithFallback(page: Page, url: string): Promise<Response | null> {
  // domcontentloaded is enough for our two operations (link discovery on
  // a listing, og:meta + JSON-LD scraping on an article) and avoids the
  // networkidle traps on sites with persistent connections — IEDO at
  // UC Davis runs analytics keep-alives that prevent idle indefinitely.
  try {
    return await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
  } catch (err) {
    if ((err as Error).name === "TimeoutError") {
      return await page.goto(url, { waitUntil: "load", timeout: NAV_TIMEOUT_MS });
    }
    throw err;
  }
}

export async function withPage<T>(browser: Browser, fn: (page: Page) => Promise<T>): Promise<T> {
  const userAgent = await resolveUserAgent();
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
  });
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
