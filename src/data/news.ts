// Shared news item shape consumed by the UI and produced by the news
// crawler (scripts/crawl/news/). Kept tiny on purpose — anything that
// looks campus-specific lives in the JSON output, not in the type.

export interface NewsItem {
  id: string;
  campus: string;
  title: string;
  summary: string;
  publishedAt: string;
  sourceUrl: string;
  imageUrl?: string;
  // Hostname of sourceUrl. Surfaced in the UI so an aggregator card
  // (e.g. begin.berkeley.edu pulling from newsroom.haas.berkeley.edu)
  // can show where the story actually lives.
  sourceHost?: string;
}
