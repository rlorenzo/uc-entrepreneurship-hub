// Shared user-agent helper for Playwright-based crawlers.
//
// Some UC sites (e.g. uci.edu via AWS ELB) return 403 to Playwright's
// default "HeadlessChrome" UA. We pick the latest macOS Chrome string
// from jnrbsn/user-agents (refreshed daily) so we stay current as Chrome
// bumps major versions, with a pinned fallback if the fetch fails.
//
// IMPORTANT: this is for Playwright contexts (where the underlying TLS
// fingerprint is real Chrome's). Do not reuse it for plain Node `fetch`
// calls — Akamai filters block "claims to be Chrome but TLS isn't",
// which the RSS fetcher learned the hard way (see scripts/crawl/news/rss.ts).

const FALLBACK_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

// UC Merced's news + research sites sit behind Akamai Bot Manager. They
// allowlist a specific UA for our crawler; because this repo is public, that
// string lives in the MERCED_USER_AGENT secret (see .env.example and
// weekly-crawl.yml), never hardcoded. Present it on every *.ucmerced.edu
// request — RSS feed fetch, robots.txt, and Playwright page loads — so one
// allowlist exception clears the whole crawl, on whichever ucmerced.edu host
// they add it. Returns undefined when the secret is unset or the host isn't
// Merced, so each caller keeps its own default UA. The `(^|\.)` anchor stops a
// look-alike host like ucmerced.edu.evil.test from matching.
export function mercedUserAgent(url: string): string | undefined {
  const ua = process.env.MERCED_USER_AGENT;
  if (!ua) return undefined;
  try {
    if (/(^|\.)ucmerced\.edu$/i.test(new URL(url).hostname)) return ua;
  } catch {
    // unparseable URL — no override
  }
  return undefined;
}

const USER_AGENT_LIST_URL = "https://jnrbsn.github.io/user-agents/user-agents.json";

let cached: string | null = null;

export async function resolveUserAgent(): Promise<string> {
  if (cached) return cached;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(USER_AGENT_LIST_URL, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const list = (await resp.json()) as string[];
    const candidates = list
      .filter((ua) => ua.includes("Macintosh") && ua.includes("Chrome/") && !ua.includes("Edg/"))
      .map((ua) => ({ ua, version: Number((ua.match(/Chrome\/(\d+)/) ?? [])[1] ?? 0) }))
      .toSorted((a, b) => b.version - a.version);
    if (candidates.length) {
      cached = candidates[0].ua;
      return cached;
    }
  } catch (err) {
    console.log(`Could not fetch latest UA list (${(err as Error).message}); using fallback.`);
  } finally {
    clearTimeout(timer);
  }
  cached = FALLBACK_USER_AGENT;
  return cached;
}
