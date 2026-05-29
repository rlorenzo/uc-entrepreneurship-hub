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
  return decodeEntities(unwrapped.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function firstImageSrc(html: string): string {
  const m = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i);
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

// Identifies us honestly. Akamai-protected newsrooms (e.g. UC Merced) 403
// requests that claim to be Chrome but don't have Chrome's TLS fingerprint
// — counter-intuitively, a non-browser UA passes their filter cleanly.
// A bare Chrome UA was the previous default; it failed on Merced.
const FETCH_USER_AGENT = "uc-entrepreneurship-hub-crawler/1.0 (+github.com/rlorenzo)";

async function fetchFeedXml(feedUrl: string): Promise<string> {
  const resp = await fetch(feedUrl, {
    headers: {
      "User-Agent": FETCH_USER_AGENT,
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.text();
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
