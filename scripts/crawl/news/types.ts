// Crawl-stage shapes. The wire-format `NewsItem` is canonical and lives
// next to the UI in src/data/news.ts so both halves of the pipeline
// import the same type.

export type { NewsItem } from "../../../src/data/news.ts";
import type { NewsItem } from "../../../src/data/news.ts";

export interface NewsCrawlError {
  stage: "feed" | "listing" | "article";
  url: string;
  message: string;
}

export interface NewsCrawlResult {
  campus: string;
  name: string;
  strategy: "rss" | "playwright";
  source: string;
  crawledAt: string;
  items: NewsItem[];
  errors: NewsCrawlError[];
}
