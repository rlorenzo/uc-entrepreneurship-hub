// Stable cross-pipeline IDs for news items. The slug of the URL's last
// path segment is unique per article on every UC newsroom we crawl, and
// prefixing with the campus avoids collisions across hubs.

import { slugify } from "../../../src/data/normalize.ts";

export function buildArticleId(campus: string, articleUrl: string): string {
  try {
    const url = new URL(articleUrl);
    const seg = url.pathname.split("/").filter(Boolean).pop() || "item";
    return `${campus}-${slugify(seg)}`;
  } catch {
    return `${campus}-${slugify(articleUrl).slice(0, 64) || "item"}`;
  }
}
