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

import { detectIndustriesInText, slugify, tryCanonicalType } from "./normalize.mjs";

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
export function isProgramLink(href, text, seedOrigin, overrides = {}) {
  if (!href) return false;
  let url;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (DENY_EXT.test(url.pathname)) return false;
  const path = url.pathname.toLowerCase();
  if (DENY_PATHS.some((deny) => path.startsWith(deny))) return false;

  const allowlist = overrides.linkAllowlist;
  const allowlistMatch = allowlist?.length ? allowlist.some((re) => re.test(href)) : null;

  // Origin gate: same-origin OR an explicit allowlist hit. Allowlists
  // are how campuses opt sub-domain hubs into the crawl without
  // dropping the same-origin default for everyone else.
  if (url.origin !== seedOrigin && allowlistMatch !== true) return false;

  // If an allowlist is configured, treat it as the authoritative pass
  // condition and skip the keyword heuristic — the override knows
  // exactly which paths are program pages.
  if (allowlistMatch === true) return true;
  if (allowlistMatch === false) return false;

  // No allowlist configured: keyword heuristic on path + anchor text.
  const hay = `${path} ${text || ""}`.toLowerCase();
  return PROGRAM_KEYWORDS.some((k) => hay.includes(k));
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

  // Grab a longer-form excerpt by concatenating the first few paragraphs
  // inside main/article. Cap at ~600 chars so we stay readable in cards.
  const paras = Array.from(document.querySelectorAll("main p, article p"))
    .map(text)
    .filter((p) => p.length > 60)
    .slice(0, 4);
  const longDescription = paras.join(" ").slice(0, 600);

  // Detect explicit "Apply" / "Application" links on the page.
  const applyAnchor = Array.from(document.querySelectorAll("a")).find((a) => {
    const t = text(a).toLowerCase();
    return /^(apply|application|submit|register)( now| here| today)?$/.test(t);
  });

  // Look for date strings near a "deadline" keyword.
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

/**
 * Lift raw page-eval output into a normalized candidate.
 *
 * Slug strategy: `slug` is `slugify(name)` so a crawled page about
 * "Berkeley SkyDeck" produces slug `berkeley-skydeck`, which lets
 * `mergePrograms` line it up against curated entries by name; `id`
 * carries the campus prefix so it stays globally unique even when
 * two campuses host programs with the same name.
 */
export function buildCandidate({ raw, url, campus, campusOverrides = {} }) {
  if (!raw?.name) return null;
  const name = raw.name.trim();
  if (name.length < 4 || name.length > 140) return null;
  if (campusOverrides.allowName && !campusOverrides.allowName(name)) return null;
  const lower = name.toLowerCase();
  if (
    lower === "home" ||
    lower === "about" ||
    lower === "contact" ||
    lower.startsWith("welcome to ")
  ) {
    return null;
  }

  const combined = `${name} ${raw.description || ""}`.toLowerCase();
  if (!PROGRAM_TYPE_HINTS.some((k) => combined.includes(k))) return null;

  const industries = detectIndustriesInText(`${name} ${raw.longDescription || ""}`);
  // Classify against name + description together. Falling back to
  // "incubator" only when nothing in either matches — the previous
  // version short-circuited on the first call (which always defaulted
  // to "incubator") and never inspected the description.
  const type = tryCanonicalType(combined) ?? "incubator";

  const slug = slugify(name);
  const id = `${campus}-${slug}`;

  return {
    id,
    slug,
    name,
    campus,
    type,
    desc: (raw.description || "").trim(),
    longDescription: (raw.longDescription || "").trim() || undefined,
    industries,
    deadline: raw.deadline || undefined,
    applicationLink: raw.applicationLink || undefined,
    sourceUrl: url,
    lastUpdated: new Date().toISOString(),
  };
}
