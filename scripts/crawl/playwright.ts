// Shared Playwright bootstrap for both crawlers (program + news). Both
// want the same anti-fingerprint context — real Chrome UA, Accept-Language
// header, no `navigator.webdriver === true` — and the same goto-with-
// fallback timing. Per-call extra headers (sec-ch-ua etc.) are accepted
// so the program crawler can keep its slightly stricter handshake.
//
// When a site's bot manager denies the headless context outright — Akamai
// fingerprints headless Chromium regardless of UA; every ucmerced.edu host
// does this — withPage retries the page operation once on real, headed
// Chrome, whose genuine fingerprint clears the check. Same recovery the
// sister scanner uses (rlorenzo/uc-homepage-a11y-report#22). Once UC
// Merced's allowlisted-UA exception is live the headless attempt succeeds
// and the fallback never launches.

import {
  chromium,
  type Browser,
  type BrowserContextOptions,
  type Page,
  type Response,
} from "playwright";

import { resolveUserAgent } from "./user-agent.ts";
import { RobotsGate, RobotsDisallowedError } from "./robots.ts";

const NAV_TIMEOUT_MS = 30_000;

// Statuses bot managers answer automation with: the auth-flavored denials
// (401/403/406) plus the rate-limit/challenge pair (429/503). Same set the
// sister a11y scanner retries on.
const BLOCKED_STATUSES = new Set([401, 403, 406, 429, 503]);

export function isBotBlockedStatus(status: number): boolean {
  return BLOCKED_STATUSES.has(status);
}

// Thrown (rather than returned) by gotoWithFallback on a blocked status so
// withPage can tell "bot manager said no" apart from ordinary HTTP failures
// and rerun the operation on headed Chrome. Existing call sites catch
// generic errors, so this subclass flows through their error accounting.
export class BotBlockedError extends Error {
  readonly url: string;
  readonly status: number;

  constructor(url: string, status: number) {
    super(`HTTP ${status} (bot manager denial) on ${url}`);
    this.name = "BotBlockedError";
    this.url = url;
    this.status = status;
  }
}

// Escape hatch mirroring the sister repo's SCAN_NO_HEADED_FALLBACK: set
// CRAWL_NO_HEADED_FALLBACK=1 to stay strictly headless (quick local runs,
// environments without a display or an installed Chrome).
export function headedFallbackEnabled(): boolean {
  return process.env.CRAWL_NO_HEADED_FALLBACK !== "1";
}

// Single source of the headless anti-fingerprint launch flags for every
// crawler entry point — a new flag needed to clear a bot manager lands in one
// place instead of drifting across per-pipeline copies.
export function launchHeadlessBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

let headlessBrowser: Promise<Browser> | null = null;

// Lazily-launched headless browser shared across the news pipeline (listing
// scrapes and image enrichment) so each site doesn't pay a multi-second
// Chromium cold start. Same failure-un-caching shape as getHeadedBrowser.
export function getHeadlessBrowser(): Promise<Browser> {
  if (!headlessBrowser) {
    const launch = launchHeadlessBrowser();
    launch.catch(() => {
      if (headlessBrowser === launch) headlessBrowser = null;
    });
    headlessBrowser = launch;
  }
  return headlessBrowser;
}

// Runners call this at shutdown, mirroring closeHeadedBrowser.
export async function closeHeadlessBrowser(): Promise<void> {
  const pending = headlessBrowser;
  headlessBrowser = null;
  if (!pending) return;
  try {
    await (await pending).close();
  } catch {
    // a launch that failed has nothing to close
  }
}

let headedBrowser: Promise<Browser> | null = null;

// Launched lazily on the first bot-blocked navigation and shared for the
// rest of the run — most runs never need it. `channel: "chrome"` launches
// real Google Chrome, not bundled Chromium: the genuine build plus a real
// window is the fingerprint that clears Akamai. On a display-less CI runner
// the crawl runs under xvfb-run (see weekly-crawl.yml).
function getHeadedBrowser(): Promise<Browser> {
  if (!headedBrowser) {
    const launch = chromium.launch({
      channel: process.env.CRAWL_HEADED_CHANNEL || "chrome",
      headless: false,
      args: ["--disable-blink-features=AutomationControlled"],
    });
    // A failed launch un-caches itself so the next blocked navigation can
    // try again — otherwise one transient failure (display hiccup, slow
    // first Chrome start) would pin every later retry to a dead promise.
    // The identity check keeps a stale failure from clobbering a relaunch.
    launch.catch(() => {
      if (headedBrowser === launch) headedBrowser = null;
    });
    headedBrowser = launch;
  }
  return headedBrowser;
}

// Runners call this at shutdown; a tripped fallback otherwise keeps the
// Chrome child process alive and the one-shot crawl scripts never exit.
export async function closeHeadedBrowser(): Promise<void> {
  const pending = headedBrowser;
  headedBrowser = null;
  if (!pending) return;
  try {
    await (await pending).close();
  } catch {
    // a launch that failed has nothing to close
  }
}

// Shared across a crawl run so each host's robots.txt is fetched at most once.
// Every third-party navigation funnels through gotoWithFallback, so gating here
// means no call site (present or future) can bypass robots.txt.
const robotsGate = new RobotsGate();

export async function gotoWithFallback(page: Page, url: string): Promise<Response | null> {
  // Refuse URLs the origin's robots.txt disallows for us before we ever open
  // the page. Callers already treat a throw here as a per-item skip: the news
  // scraper/program crawler record it as an error and move on, and the image
  // enricher swallows it and ships the item without an image.
  if (!(await robotsGate.allows(url))) throw new RobotsDisallowedError(url);

  const resp = await navigateWithTimingFallback(page, url);
  if (resp && isBotBlockedStatus(resp.status())) throw new BotBlockedError(url, resp.status());
  return resp;
}

async function navigateWithTimingFallback(page: Page, url: string): Promise<Response | null> {
  // domcontentloaded is enough for our operations (link discovery on a
  // listing, og:meta + JSON-LD scraping on an article) and avoids the
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

interface WithPageOptions {
  extraHTTPHeaders?: Record<string, string>;
  // Override the default (real-Chrome) UA for this context — e.g. UC Merced's
  // WAF-allowlisted UA. Falls back to resolveUserAgent() when unset.
  userAgent?: string;
}

// The headed fallback context deliberately skips the UA override and any
// caller-spoofed client-hint headers: real Chrome's own UA and hints are
// internally consistent, which is the point of the retry. (The sister repo
// verified every ucmerced.edu host recovers on exactly this shape.)
const HEADED_CONTEXT: BrowserContextOptions = {
  viewport: { width: 1440, height: 900 },
  locale: "en-US",
  extraHTTPHeaders: { "Accept-Language": "en-US,en;q=0.9" },
};

async function runInContext<T>(
  browser: Browser,
  contextOptions: BrowserContextOptions,
  fn: (page: Page) => Promise<T>,
): Promise<T> {
  const context = await browser.newContext(contextOptions);
  // Hide the automation marker exposed via `navigator.webdriver`. Real
  // Chrome reports `false`; headless Chromium reports `true`.
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

async function retryOnHeadedChrome<T>(
  fn: (page: Page) => Promise<T>,
  blocked: BotBlockedError,
): Promise<T> {
  let headed: Browser;
  try {
    headed = await getHeadedBrowser();
  } catch (launchErr) {
    // No installed Chrome (or launch failed): surface the original block,
    // not the launch failure, so the recorded crawl error stays meaningful.
    console.log(`  ⓘ headed-Chrome fallback unavailable: ${(launchErr as Error).message}`);
    throw blocked;
  }
  console.log(`  ⤷ ${blocked.message} — retrying on headed Chrome`);
  return await runInContext(headed, HEADED_CONTEXT, fn);
}

export async function withPage<T>(
  browser: Browser,
  fn: (page: Page) => Promise<T>,
  options: WithPageOptions = {},
): Promise<T> {
  const userAgent = options.userAgent ?? (await resolveUserAgent());
  const headlessContext: BrowserContextOptions = {
    userAgent,
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      ...options.extraHTTPHeaders,
    },
  };
  try {
    return await runInContext(browser, headlessContext, fn);
  } catch (err) {
    if (!(err instanceof BotBlockedError) || !headedFallbackEnabled()) throw err;
    // One retry only: a BotBlockedError from the headed attempt propagates.
    return await retryOnHeadedChrome(fn, err);
  }
}

// Fetch a URL's raw body through the headed fallback browser. The RSS
// fetcher uses this when its plain fetch() hits a bot-manager denial —
// Node's TLS fingerprint can't imitate Chrome under any UA, so the only way
// past is a real browser. Deliberately a bare goto rather than
// gotoWithFallback: feed downloads stay outside the robots gate (see the
// scope note in robots.ts).
export async function fetchBodyWithHeadedChrome(url: string): Promise<string> {
  const headed = await getHeadedBrowser();
  return await runInContext(headed, HEADED_CONTEXT, async (page) => {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
    if (!resp?.ok()) throw new Error(`HTTP ${resp?.status() ?? "?"} via headed Chrome`);
    return await resp.text();
  });
}
