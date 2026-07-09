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

// Some campus WAFs (Akamai Bot Manager) allowlist a specific UA for our
// crawler. Because this repo is public, those strings live in secrets (see
// .env.example and weekly-crawl.yml), never hardcoded. Every fetch path —
// RSS feed download, robots.txt, Playwright page loads — consults this table
// via hostUserAgentOverride, so onboarding the next WAF'd campus is one row
// here plus its secret; no new per-campus helper and no call-site edits.
const HOST_UA_OVERRIDES: { hostSuffix: string; envVar: string }[] = [
  // UC Merced's news + research sites. One allowlist exception clears the
  // whole crawl, on whichever ucmerced.edu host they add it.
  { hostSuffix: "ucmerced.edu", envVar: "MERCED_USER_AGENT" },
];

/**
 * The allowlisted UA for a host, or undefined when no override matches (or
 * its secret is unset) so each caller keeps its own default UA. Matching is
 * exact-host or dot-boundary suffix (plain string comparison, no dynamic
 * RegExp — CodeQL js/regex/missing-regexp-anchor can't see anchors in a
 * constructed pattern), so a look-alike host like ucmerced.edu.evil.test or
 * notucmerced.edu never matches.
 */
export function hostUserAgentOverride(url: string): string | undefined {
  let hostname: string;
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return undefined; // unparseable URL — no override
  }
  for (const { hostSuffix, envVar } of HOST_UA_OVERRIDES) {
    const ua = process.env[envVar];
    if (ua && (hostname === hostSuffix || hostname.endsWith(`.${hostSuffix}`))) {
      return ua;
    }
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
