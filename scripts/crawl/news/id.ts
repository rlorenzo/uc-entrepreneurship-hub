// Stable cross-pipeline IDs for news items: campus + host + the slug of the
// URL's last path segment. The host matters because aggregator feeds (e.g.
// begin.berkeley.edu) link out to many UC subdomains — two hosts can publish
// a same-slugged article (or plain host-root links), and dedupe-by-id would
// otherwise silently drop one of them.

import { slugify } from "../../../src/data/normalize.ts";

export function buildArticleId(campus: string, articleUrl: string): string {
  try {
    const url = new URL(articleUrl);
    const host = slugify(url.hostname.replace(/^www\./, ""));
    const seg = url.pathname.split("/").filter(Boolean).pop() || "item";
    return `${campus}-${host}-${slugify(seg)}`;
  } catch {
    return `${campus}-${slugify(articleUrl).slice(0, 64) || "item"}`;
  }
}
