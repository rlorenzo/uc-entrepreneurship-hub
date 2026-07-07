// RSS-first news fetcher for hubs that publish a WordPress (or
// WordPress-shaped) feed. Two of our test campuses qualify:
//
//   - innovation.uci.edu — self-hosted feed, every item is on-topic
//   - begin.berkeley.edu — aggregator feed, items link out to UC subdomains
//
// We avoid pulling in an XML dep — WordPress feeds are stable enough that
// a small regex extractor is robust, and the alternative (xml2js etc.) is
// larger than the parser we'd write.

import { buildArticleId } from "./id.ts";
import { toIsoDate } from "./dates.ts";
import { mercedUserAgent } from "../user-agent.ts";
import {
  fetchBodyWithHeadedChrome,
  headedFallbackEnabled,
  isBotBlockedStatus,
} from "../playwright.ts";
import type { NewsCrawlError, NewsItem } from "./types.ts";

export interface RssSite {
  campus: string;
  feedUrl: string;
  linkDenylist?: string[];
  titleDenylist?: string[];
  // When set, only keep items whose title or summary contains at least one
  // of these (case-insensitive substring match). Lets us aim a campus
  // newsroom at entrepreneurship coverage without forking the feed.
  keywordAllowlist?: string[];
}

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  contentEncoded: string;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&#8217;": "’",
  "&#8216;": "‘",
  "&#8220;": "“",
  "&#8221;": "”",
  "&#8211;": "–",
  "&#8212;": "—",
  "&#038;": "&",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+|x[0-9a-fA-F]+);/gi, (m, code: string) => {
      // Numeric entities come in decimal (&#39;) and hex (&#x27;) forms; the
      // hex form was previously left raw. fromCodePoint also handles astral
      // code points (e.g. emoji) that fromCharCode would mangle.
      const n = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : Number(code);
      return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m;
    })
    .replace(/&[a-zA-Z#0-9]+;/g, (m) => HTML_ENTITIES[m] ?? m);
}

function stripCdata(s: string): string {
  const m = s.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return m ? m[1] : s;
}

function extractTag(block: string, tag: string): string {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)</${escaped}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return stripCdata(m[1].trim()).trim();
}

export function stripHtml(s: string): string {
  // Unwrap CDATA sections, keeping their inner text, before stripping tags.
  // stripCdata only fires on a value that is a single clean CDATA block, so
  // mixed content (text + CDATA) would otherwise reach the tag regex below,
  // which treats `<![CDATA[...]]>` as one tag and deletes the text inside it.
  const unwrapped = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  // Decode, strip, decode. Some feeds (Drupal, e.g. UC Merced) entity-encode
  // their markup (&lt;div&gt;…) and double-encode the inner text entities
  // (&amp;#039;). The first decode turns &lt;div&gt; back into a real tag and
  // peels one layer off the text entities; the strip removes those tags; the
  // second decode resolves the now-single-encoded text entity (&#039; → ').
  // A lone "<" with no closing ">" survives the strip unharmed.
  const decoded = decodeEntities(unwrapped).replace(/<[^>]+>/g, " ");
  // Drop zero-width and other invisible format characters (Unicode Cf) — some
  // newsrooms (e.g. UC San Diego) prefix a U+200B onto summaries, which leaves
  // a stray gap in the UI and skews search. Strip after the final decode so an
  // entity-encoded one (&#8203;) is removed too.
  return decodeEntities(decoded)
    .replace(/\p{Cf}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function firstImageSrc(html: string): string {
  // Decode first: Drupal feeds (e.g. UC Merced) entity-encode their markup, so
  // the hero arrives as "&lt;img src=…&gt;" and would otherwise be invisible to
  // this scan. Decoding is harmless for feeds that already ship real <img> tags
  // (WordPress) and additionally repairs &amp;-escaped query strings in the src.
  const m = decodeEntities(html).match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml))) {
    const block = match[1];
    items.push({
      title: decodeEntities(extractTag(block, "title")),
      link: decodeEntities(extractTag(block, "link")),
      pubDate: extractTag(block, "pubDate"),
      description: extractTag(block, "description"),
      contentEncoded: extractTag(block, "content:encoded"),
    });
  }
  return items;
}

function isDenied(value: string, patterns: string[] | undefined): boolean {
  if (!patterns?.length) return false;
  return patterns.some((p) => new RegExp(p, "i").test(value));
}

function passesKeywordFilter(haystack: string, allowlist: string[] | undefined): boolean {
  if (!allowlist?.length) return true;
  const lower = haystack.toLowerCase();
  return allowlist.some((k) => lower.includes(k.toLowerCase()));
}

// Identifies us honestly. A bare Chrome UA was the previous default; it failed
// on Akamai-protected newsrooms that fingerprint browser TLS.
const FETCH_USER_AGENT = "uc-entrepreneurship-hub-crawler/1.0 (+github.com/rlorenzo)";

// UC Merced's newsroom 403s our default identity; when the MERCED_USER_AGENT
// secret is set we present their allowlisted UA for *.ucmerced.edu instead. The
// same helper backs the robots and Playwright fetches (see user-agent.ts), so
// one allowlist exception clears every path. Until that exception is live (or
// with the secret unset) the feed 403s and fetchFeedXml retries through headed
// Chrome; if that also fails, the outage guard in run.ts preserves the
// previous merced.json.
export function userAgentForFeed(feedUrl: string): string {
  return mercedUserAgent(feedUrl) ?? FETCH_USER_AGENT;
}

// The exact set of RSS feeds this crawler is allowed to fetch, as in-code
// string literals. The config file (news/sites.json) decides *which* campus
// to crawl, but the URL actually handed to fetch() is always one of these
// constants — never the raw string read from the file. That hardens us
// against a tampered/typo'd config reaching an arbitrary host, and keeps the
// file-data → outbound-request flow CodeQL flags broken (js/file-access-to-http).
//
// Adding a new RSS site means adding its feed URL here as well as in
// sites.json; an unlisted URL is refused rather than fetched. Exported so
// rss.test.ts can cross-validate the two lists — a sites.json entry missing
// from here would otherwise only fail at crawl runtime.
export const ALLOWED_RSS_FEEDS = [
  "https://innovation.uci.edu/news/feed/",
  "https://begin.berkeley.edu/feed/",
  "https://innovation.ucsb.edu/rss.xml",
  "https://news.ucsc.edu/feed/",
  "https://news.ucmerced.edu/rss.xml",
] as const;

// Returns the matching allowlist *constant* (not the passed-in, file-derived
// string) so nothing tainted by the file read flows onward to the network.
function resolveAllowedFeed(requested: string): string {
  const match = ALLOWED_RSS_FEEDS.find((feed) => feed === requested);
  if (!match) {
    throw new Error(
      `Refusing to fetch unrecognized feed URL: ${requested}. ` +
        `Add it to ALLOWED_RSS_FEEDS in scripts/crawl/news/rss.ts.`,
    );
  }
  return match;
}

async function fetchFeedXml(feedUrl: string): Promise<string> {
  const url = resolveAllowedFeed(feedUrl);
  const resp = await fetch(url, {
    headers: {
      "User-Agent": userAgentForFeed(url),
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (resp.ok) return await resp.text();
  // Bot-manager denial (news.ucmerced.edu until its UA exception is live):
  // Node's fetch can't pass Akamai's TLS-fingerprint check under any UA, so
  // retry the download through real headed Chrome. Other failures (404, 500)
  // stay hard errors; either way the outage guard in run.ts keeps the
  // previous data file if nothing is fetched.
  if (isBotBlockedStatus(resp.status) && headedFallbackEnabled()) {
    console.log(`  ⤷ feed HTTP ${resp.status} — retrying via headed Chrome`);
    try {
      return await fetchBodyWithHeadedChrome(url);
    } catch (err) {
      // Keep the recorded feed error meaningful: a Chrome launch failure (no
      // installed Chrome, no display) shouldn't clobber the block status.
      // Same policy as retryOnHeadedChrome in playwright.ts.
      console.log(`  ⓘ headed retry failed: ${(err as Error).message}`);
    }
  }
  throw new Error(`HTTP ${resp.status}`);
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function hasMinimalShape(r: RssItem): boolean {
  return Boolean(r.link && r.title);
}

function shouldKeep(r: RssItem, summaryRaw: string, site: RssSite): boolean {
  if (!hasMinimalShape(r)) return false;
  if (isDenied(r.link, site.linkDenylist)) return false;
  if (isDenied(r.title, site.titleDenylist)) return false;
  return passesKeywordFilter(`${r.title} ${summaryRaw}`, site.keywordAllowlist);
}

function rssItemToNewsItem(r: RssItem, campus: string, summaryRaw: string): NewsItem {
  return {
    id: buildArticleId(campus, r.link),
    campus,
    title: stripHtml(r.title),
    summary: summaryRaw.slice(0, 400),
    publishedAt: toIsoDate(r.pubDate),
    sourceUrl: r.link,
    imageUrl: firstImageSrc(r.contentEncoded || r.description) || undefined,
    sourceHost: hostOf(r.link),
  };
}

function buildNewsItems(raw: RssItem[], site: RssSite): NewsItem[] {
  const items: NewsItem[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const summaryRaw = stripHtml(r.description);
    if (!shouldKeep(r, summaryRaw, site)) continue;
    const item = rssItemToNewsItem(r, site.campus, summaryRaw);
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
  }
  return items;
}

export async function fetchRssNews(
  site: RssSite,
): Promise<{ items: NewsItem[]; errors: NewsCrawlError[] }> {
  let xml: string;
  try {
    xml = await fetchFeedXml(site.feedUrl);
  } catch (err) {
    return {
      items: [],
      errors: [{ stage: "feed", url: site.feedUrl, message: (err as Error).message }],
    };
  }
  return { items: buildNewsItems(parseRss(xml), site), errors: [] };
}
