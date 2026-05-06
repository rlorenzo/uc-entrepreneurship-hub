// Default per-campus overrides. Each campus module re-exports from this
// and tightens what it needs. The scraper falls back to these when a
// campus has no specific module.
//
// Hooks (all optional):
//   allowName(name): boolean
//     Final filter on a candidate's extracted name. Return false to reject
//     pages that survived the URL/keyword filter but obviously aren't a
//     program (e.g. "Our Team", "Contact Us").
//
//   linkAllowlist: RegExp[]
//     If provided, ONLY links whose href matches at least one regex are
//     followed. Useful for sites with strict program directories.
//
//   linkDenylist: RegExp[]
//     Links matching any regex are skipped (in addition to the global
//     denylist in extract.mjs).
//
//   maxSubpages: number
//     Cap on the number of sub-pages crawled per campus. Default: 30.

export const allowName = (name) => {
  const lower = name.toLowerCase();
  return !["our team", "contact us", "newsletter", "subscribe", "donate"].includes(lower);
};

export const linkAllowlist = [];

export const linkDenylist = [/\/(news|events|stories|blog|press|alumni|people|staff)(\/|$)/i];

export const maxSubpages = 30;
