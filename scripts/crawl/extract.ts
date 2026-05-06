// Generic extraction heuristics for UC innovation/entrepreneurship pages.
//
// Strategy:
//   1. From a campus seed URL, harvest internal links.
//   2. Filter to links whose URL or anchor text mentions program keywords
//      (accelerator, incubator, fund, competition, maker space, etc.).
//   3. For each candidate page, run an in-page evaluator that pulls the
//      best-guess program metadata: name (h1/title), description (lead
//      paragraph or meta description), associated center, deadline cues.
//
// Per-campus override modules (see ./campuses/) can refine the link
// allowlist or supply explicit selectors when a site's structure resists
// the defaults. We never throw on extraction failures — the worst case
// is an empty array, which the build step will silently drop.

import {
  detectIndustriesInText,
  slugify,
  tryCanonicalType,
  type ProgramCandidate,
} from "../../src/data/normalize.ts";

export interface CampusOverrides {
  allowName?: (name: string) => boolean;
  linkAllowlist?: RegExp[];
  linkDenylist?: RegExp[];
  maxSubpages?: number;
}

const PROGRAM_KEYWORDS = [
  "accelerator",
  "incubator",
  "venture",
  "startup",
  "fund",
  "grant",
  "competition",
  "challenge",
  "fellowship",
  "maker",
  "fab lab",
  "prototyping",
  "innovation",
  "commercialization",
  "i-corps",
  "icorps",
  "entrepreneur",
  // Catch-all directory paths used by sites like innovation.ucsd.edu and
  // techpartnerships.ucr.edu where the program list nests under /programs/
  // rather than under a typed path. Per-page extraction in buildCandidate
  // still requires a PROGRAM_TYPE_HINTS match, so false positives fall out.
  "program",
  "programs",
  "directory",
  "initiative",
];

// Per-page sniff that decides whether a candidate's name+description text
// looks like a real entrepreneurship program. Kept intentionally narrow —
// every term here is something only a program would call itself, not
// general academic content. (Removing "course" filters out Accounting
// Minor / Management 19 / Marketing 101–style noise.)
const PROGRAM_TYPE_HINTS = [
  "accelerator",
  "incubator",
  "venture lab",
  "competition",
  "challenge",
  "fund",
  "grant",
  "fellowship",
  "maker",
  "lab",
  "certificate program",
  "technical management",
];

const DENY_PATHS = [
  "/news",
  "/events",
  "/blog",
  "/press",
  "/contact",
  "/about/team",
  "/people",
  "/staff",
  "/jobs",
  "/careers",
  "/login",
  "/account",
  "/search",
  "/privacy",
  "/terms",
  "/sitemap",
  "/feed",
];

const DENY_EXT = /\.(pdf|jpg|jpeg|png|gif|svg|webp|mp4|zip|docx?|xlsx?|pptx?)(\?|$)/i;

function parseHref(href: string): URL | null {
  if (!href) return null;
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

function isDeniedPath(url: URL): boolean {
  if (DENY_EXT.test(url.pathname)) return true;
  const path = url.pathname.toLowerCase();
  return DENY_PATHS.some((deny) => path.startsWith(deny));
}

/**
 * Three-way result for the per-campus allowlist:
 *   `true`  — allowlist exists and the link matched
 *   `false` — allowlist exists and the link missed
 *   `null`  — no allowlist configured; defer to keyword heuristic
 */
function classifyAllowlist(href: string, allowlist?: RegExp[]): boolean | null {
  if (!allowlist?.length) return null;
  return allowlist.some((re) => re.test(href));
}

function matchesKeyword(url: URL, text: string): boolean {
  const hay = `${url.pathname.toLowerCase()} ${text || ""}`.toLowerCase();
  return PROGRAM_KEYWORDS.some((k) => hay.includes(k));
}

/**
 * Decide whether a sub-link looks like a program page worth visiting.
 *
 * Origin policy: same-origin by default. Per-campus `linkAllowlist`
 * regexes can opt sub-domains in (e.g. Berkeley pulls in
 * `skydeck.berkeley.edu` and `sutardja-center.berkeley.edu`). When an
 * allowlist match hits, we trust the override and skip the keyword
 * heuristic — `buildCandidate`'s `PROGRAM_TYPE_HINTS` gate is still the
 * per-page authority on what counts as a program.
 */
export function isProgramLink(
  href: string,
  text: string,
  seedOrigin: string,
  overrides: CampusOverrides = {},
): boolean {
  const url = parseHref(href);
  if (!url || isDeniedPath(url)) return false;

  // When an allowlist is configured, it's the authoritative pass
  // condition — cross-origin links are permitted on a hit, and same-origin
  // links that miss are rejected. With no allowlist we fall back to the
  // same-origin + keyword heuristic.
  const allowlistMatch = classifyAllowlist(href, overrides.linkAllowlist);
  if (allowlistMatch !== null) return allowlistMatch;
  return url.origin === seedOrigin && matchesKeyword(url, text);
}

/**
 * Run inside the browser (passed to page.evaluate). Returns a single
 * candidate program shaped from whatever signals are on the page.
 *
 * Kept dependency-free so it serializes cleanly into Playwright.
 */
export const inPageExtractor = `() => {
  const text = (el) => (el?.textContent || "").replace(/\\s+/g, " ").trim();
  const meta = (name) =>
    document.querySelector('meta[property="' + name + '"], meta[name="' + name + '"]')?.content || "";

  const h1 = document.querySelector("main h1, article h1, h1");
  const ogTitle = meta("og:title");
  const titleEl = document.querySelector("title");
  const name = text(h1) || ogTitle || (titleEl ? titleEl.textContent.split("|")[0].trim() : "");

  const description =
    meta("og:description") ||
    meta("description") ||
    text(document.querySelector("main p, article p, .lead, .intro p, p"));

  const paras = Array.from(document.querySelectorAll("main p, article p"))
    .map(text)
    .filter((p) => p.length > 60)
    .slice(0, 4);
  const longDescription = paras.join(" ").slice(0, 600);

  const applyAnchor = Array.from(document.querySelectorAll("a")).find((a) => {
    const t = text(a).toLowerCase();
    return /^(apply|application|submit|register)( now| here| today)?$/.test(t);
  });

  const bodyText = (document.body.textContent || "").replace(/\\s+/g, " ");
  const deadlineMatch = bodyText.match(
    /\\b(?:deadline|apply by|applications? close|submissions? due)[^.]{0,80}\\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.? \\d{1,2}(?:,? \\d{4})?|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4})/i,
  );

  return {
    name,
    description,
    longDescription,
    applicationLink: applyAnchor?.href || "",
    deadline: deadlineMatch ? deadlineMatch[1] : "",
    bodyExcerpt: bodyText.slice(0, 4000),
  };
}`;

export interface RawPageData {
  name: string;
  description: string;
  longDescription: string;
  applicationLink: string;
  deadline: string;
  bodyExcerpt: string;
}

// Names that obviously aren't programs even when the page would otherwise
// look like one (footer landing pages, etc.).
const REJECTED_NAMES = new Set(["home", "about", "contact"]);
const REJECTED_NAME_PREFIXES = ["welcome to "];
const NAME_LEN = { min: 4, max: 140 } as const;

type NameValidator = (name: string) => boolean;

function isInLength(name: string): boolean {
  return name.length >= NAME_LEN.min && name.length <= NAME_LEN.max;
}

function isAllowedLabel(name: string): boolean {
  const lower = name.toLowerCase();
  if (REJECTED_NAMES.has(lower)) return false;
  return !REJECTED_NAME_PREFIXES.some((p) => lower.startsWith(p));
}

const NAME_VALIDATORS: NameValidator[] = [isInLength, isAllowedLabel];

function normalizeName(raw: string | undefined, allowName?: NameValidator): string | null {
  const name = raw?.trim();
  if (!name) return null;
  if (!NAME_VALIDATORS.every((v) => v(name))) return null;
  if (allowName && !allowName(name)) return null;
  return name;
}

function looksLikeProgram(text: string): boolean {
  const lower = text.toLowerCase();
  return PROGRAM_TYPE_HINTS.some((k) => lower.includes(k));
}

interface NormalizedPage {
  name: string;
  description: string;
  longDescription: string;
  deadline: string;
  applicationLink: string;
}

const PAGE_DEFAULTS = {
  description: "",
  longDescription: "",
  deadline: "",
  applicationLink: "",
} as const;

function normalizePage(raw: RawPageData | null | undefined, name: string): NormalizedPage {
  return { ...PAGE_DEFAULTS, ...raw, name };
}

const blankToUndefined = (s: string): string | undefined => s || undefined;

function assembleCandidate(page: NormalizedPage, url: string, campus: string): ProgramCandidate {
  const slug = slugify(page.name);
  const combined = `${page.name} ${page.description}`.toLowerCase();
  return {
    id: `${campus}-${slug}`,
    slug,
    name: page.name,
    campus,
    type: tryCanonicalType(combined) ?? "incubator",
    desc: page.description.trim(),
    longDescription: blankToUndefined(page.longDescription.trim()),
    industries: detectIndustriesInText(`${page.name} ${page.longDescription}`),
    deadline: blankToUndefined(page.deadline),
    applicationLink: blankToUndefined(page.applicationLink),
    sourceUrl: url,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Lift raw page-eval output into a normalized candidate.
 *
 * Slug strategy: `slug` is `slugify(name)` so a crawled page about
 * "Berkeley SkyDeck" produces slug `berkeley-skydeck`, which lets
 * `mergePrograms` line it up against curated entries by name; `id`
 * carries the campus prefix so it stays globally unique even when
 * two campuses host programs with the same name.
 */
export function buildCandidate({
  raw,
  url,
  campus,
  campusOverrides = {},
}: {
  raw: RawPageData | null | undefined;
  url: string;
  campus: string;
  campusOverrides?: CampusOverrides;
}): ProgramCandidate | null {
  const name = normalizeName(raw?.name, campusOverrides.allowName);
  if (!name) return null;
  const page = normalizePage(raw, name);
  if (!looksLikeProgram(`${page.name} ${page.description}`)) return null;
  return assembleCandidate(page, url, campus);
}
