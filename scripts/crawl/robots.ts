// robots.txt awareness for the Playwright crawlers.
//
// Playwright is just a browser driver — page.goto() fetches whatever URL it is
// handed, and real Chrome ignores robots.txt too. robots.txt is a convention
// honored by the *crawler* at the application layer, so we implement it here:
// fetch /robots.txt once per origin, parse the rules that apply to us, and let
// the shared gotoWithFallback() consult this gate before every navigation.
//
// Scope: this governs HTML page fetches (news listings + articles, og:image
// enrichment, program seed + sub-pages). The RSS feed downloads in news/rss.ts
// use a plain fetch() and are intentionally left ungated — a published feed is
// a syndication invitation, and robots groups rarely govern feed readers.
//
// We deliberately keep this dependency-free (same rationale as the hand-rolled
// RSS parser): our needs are the standard User-agent / Allow / Disallow subset
// with `*` and `$` wildcards, which is small and well-covered by robots.test.ts.

import { mercedUserAgent } from "./user-agent.ts";

// The identity we send when fetching /robots.txt (same honest string the RSS
// fetcher uses) and the token we match User-agent groups against. Matching
// uses "group agent is a case-insensitive prefix of this", so a site can name
// us at any specificity — "uc-entrepreneurship", the bare product token, or
// the exact versioned UA an admin copy-pastes from their access logs — and
// still win over the wildcard `*` group. Matching the full UA (not just the
// product token) is what lets the versioned forms match.
const ROBOTS_USER_AGENT = "uc-entrepreneurship-hub-crawler/1.0 (+github.com/rlorenzo)";

const ROBOTS_TIMEOUT_MS = 5_000;

export interface RobotsRules {
  allow: string[];
  disallow: string[];
}

const ALLOW_ALL: RobotsRules = { allow: [], disallow: [] };

interface Group {
  agents: string[];
  allow: string[];
  disallow: string[];
}

interface Directive {
  field: string;
  value: string;
}

// Strip a trailing comment and split "field: value". Returns null for blank or
// comment-only lines and for lines without a colon.
function tokenize(rawLine: string): Directive | null {
  const line = rawLine.replace(/#.*$/, "").trim();
  const idx = line.indexOf(":");
  if (!line || idx === -1) return null;
  return {
    field: line.slice(0, idx).trim().toLowerCase(),
    value: line.slice(idx + 1).trim(),
  };
}

function addRule(group: Group, field: string, value: string): void {
  if (field === "allow") group.allow.push(value);
  else group.disallow.push(value);
}

// Split robots.txt into user-agent groups. A group is one or more consecutive
// `User-agent` lines followed by its rule lines; a `User-agent` line that
// appears *after* a rule line starts a new group.
function parseGroups(txt: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  // True while consuming stacked `User-agent` lines and before any rule line,
  // so consecutive agents accumulate into one group; a rule line ends it.
  let collectingAgents = false;

  for (const rawLine of txt.split(/\r?\n/)) {
    const directive = tokenize(rawLine);
    if (!directive) continue;
    const { field, value } = directive;

    if (field === "user-agent") {
      if (!collectingAgents) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
        collectingAgents = true;
      }
      current?.agents.push(value.toLowerCase());
      continue;
    }

    // Any non-user-agent line ends agent collection, so a later `User-agent`
    // begins a fresh group even when a Sitemap/Crawl-delay/etc. line sits
    // between the two — otherwise the agents would wrongly share one group.
    collectingAgents = false;
    // Ignore a rule before any user-agent line, and treat an empty value as no
    // restriction (empty `Disallow:` = allow-all, empty `Allow:` = no-op).
    // Other fields (Sitemap, Crawl-delay, Host, …) contribute no path rule.
    if (current && value && (field === "allow" || field === "disallow")) {
      addRule(current, field, value);
    }
  }
  return groups;
}

// The length of a group's longest agent that is a case-insensitive prefix of
// our token (0 if the group only names `*` or unrelated agents).
function namedMatchLen(group: Group, token: string): number {
  let len = 0;
  for (const agent of group.agents) {
    if (agent && agent !== "*" && token.startsWith(agent) && agent.length > len) {
      len = agent.length;
    }
  }
  return len;
}

// Select the rules that govern us: merge every group whose most-specific
// matching agent ties for the longest — this both applies the closest-named
// group and unions duplicate blocks that name us. With no named match, fall
// back to the merged `*` groups; with neither, allow-all (empty rule set).
function selectRules(groups: Group[], token: string): RobotsRules {
  const t = token.toLowerCase();
  const best = Math.max(0, ...groups.map((g) => namedMatchLen(g, t)));
  const chosen =
    best > 0
      ? groups.filter((g) => namedMatchLen(g, t) === best)
      : groups.filter((g) => g.agents.includes("*"));
  return {
    allow: chosen.flatMap((g) => g.allow),
    disallow: chosen.flatMap((g) => g.disallow),
  };
}

export function parseRobots(txt: string, token: string = ROBOTS_USER_AGENT): RobotsRules {
  // Some servers prepend a UTF-8 BOM; left in place it would corrupt the first
  // directive's field name (e.g. "<BOM>user-agent").
  return selectRules(parseGroups(txt.replace(/^\uFEFF/, "")), token);
}

interface CompiledRule {
  allow: boolean;
  re: RegExp;
  len: number;
}

// Translate a robots path pattern into an anchored regex. `*` matches any run
// of characters; a trailing `$` anchors the end; everything else is literal.
function compile(pattern: string, allow: boolean): CompiledRule {
  let re = "^";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") re += ".*";
    else if (c === "$" && i === pattern.length - 1) re += "$";
    else re += c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return { allow, re: new RegExp(re), len: pattern.length };
}

// Standard precedence: the longest matching pattern wins; on an equal-length
// tie, Allow beats Disallow; with no match at all, the path is allowed.
export function isPathAllowed(rules: RobotsRules, path: string): boolean {
  const compiled: CompiledRule[] = [
    ...rules.disallow.map((p) => compile(p, false)),
    ...rules.allow.map((p) => compile(p, true)),
  ];
  let best: CompiledRule | null = null;
  for (const rule of compiled) {
    if (!rule.re.test(path)) continue;
    if (!best || rule.len > best.len || (rule.len === best.len && rule.allow && !best.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

export class RobotsDisallowedError extends Error {
  readonly url: string;

  constructor(url: string) {
    super(`blocked by robots.txt: ${url}`);
    this.name = "RobotsDisallowedError";
    this.url = url;
  }
}

export interface RobotsFetchResult {
  status: number;
  text: string;
}

export type RobotsFetcher = (url: string) => Promise<RobotsFetchResult>;

// Cap the robots.txt body we read. Google enforces the same 500 KiB ceiling;
// past it a host (malicious or misconfigured) can't OOM the crawler — we parse
// the prefix, which is where the rules that govern us live anyway.
export const MAX_ROBOTS_BYTES = 512 * 1024;

export async function readCapped(resp: Awaited<ReturnType<typeof fetch>>): Promise<string> {
  const reader = resp.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = MAX_ROBOTS_BYTES - total;
    if (value.byteLength >= remaining) {
      // Decode only the prefix that fits under the cap, then stop. Dropping the
      // chunk entirely (the tempting `break` before appending) would misread a
      // large — or single-big-chunk — robots.txt as empty, i.e. allow-all.
      text += decoder.decode(value.subarray(0, remaining), { stream: true });
      await reader.cancel();
      break;
    }
    total += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

async function defaultFetcher(url: string): Promise<RobotsFetchResult> {
  const resp = await fetch(url, {
    // Present UC Merced's allowlisted UA on its own robots.txt so we read the
    // real rules once the WAF exception is live, instead of 403 → fail-open.
    headers: { "User-Agent": mercedUserAgent(url) ?? ROBOTS_USER_AGENT, Accept: "text/plain, */*" },
    signal: AbortSignal.timeout(ROBOTS_TIMEOUT_MS),
  });
  const ok = resp.status >= 200 && resp.status < 300;
  return { status: resp.status, text: ok ? await readCapped(resp) : "" };
}

// Per-origin robots.txt cache + decision gate. One instance is shared across a
// crawl run so each host's robots.txt is fetched at most once.
export class RobotsGate {
  private readonly cache = new Map<string, Promise<RobotsRules>>();
  private readonly fetcher: RobotsFetcher;

  // Note: no TS parameter properties (`constructor(private fetcher…)`) — the
  // crawler runs under Node's native type-stripping, which rejects them.
  constructor(fetcher: RobotsFetcher = defaultFetcher) {
    this.fetcher = fetcher;
  }

  async allows(urlStr: string): Promise<boolean> {
    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      return true; // unparseable target → nothing to check it against
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return true;
    const rules = await this.rulesFor(url.origin);
    return isPathAllowed(rules, url.pathname + url.search);
  }

  // Cache the in-flight promise (not just the result) so concurrent workers
  // hitting the same origin share a single robots.txt fetch.
  private rulesFor(origin: string): Promise<RobotsRules> {
    let pending = this.cache.get(origin);
    if (!pending) {
      pending = this.load(origin);
      this.cache.set(origin, pending);
    }
    return pending;
  }

  private async load(origin: string): Promise<RobotsRules> {
    try {
      const { status, text } = await this.fetcher(`${origin}/robots.txt`);
      // 2xx → honor it. 4xx (esp. 404 "no robots.txt") → full allow. 5xx or a
      // network/timeout error → fail open: this is a low-volume, weekly,
      // honestly-identified crawl of public UC newsrooms, so a transient
      // robots.txt outage shouldn't sink the run. (Stricter crawlers treat a
      // persistent 5xx as a full disallow — we favor availability instead.)
      // Select the group with the identity this host actually sees: the
      // allowlisted UA on *.ucmerced.edu (the same one defaultFetcher sends
      // there), our default UA everywhere else. Otherwise rules Merced
      // writes for the UA they allowlisted would be silently ignored.
      if (status >= 200 && status < 300) {
        return parseRobots(text, mercedUserAgent(origin) ?? ROBOTS_USER_AGENT);
      }
      return ALLOW_ALL;
    } catch {
      return ALLOW_ALL;
    }
  }
}
