import { describe, it, expect } from "vite-plus/test";
import { BotBlockedError, headedFallbackEnabled, isBotBlockedStatus } from "./playwright.ts";

function withEnv(value: string | undefined, fn: () => void): void {
  const prev = process.env.CRAWL_NO_HEADED_FALLBACK;
  if (value === undefined) delete process.env.CRAWL_NO_HEADED_FALLBACK;
  else process.env.CRAWL_NO_HEADED_FALLBACK = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.CRAWL_NO_HEADED_FALLBACK;
    else process.env.CRAWL_NO_HEADED_FALLBACK = prev;
  }
}

describe("isBotBlockedStatus", () => {
  it("matches the statuses bot managers answer automation with", () => {
    for (const status of [401, 403, 406, 429, 503]) {
      expect(isBotBlockedStatus(status)).toBe(true);
    }
  });

  it("leaves ordinary success and failure statuses alone", () => {
    for (const status of [200, 301, 404, 410, 500, 502]) {
      expect(isBotBlockedStatus(status)).toBe(false);
    }
  });
});

describe("BotBlockedError", () => {
  it("carries the url and status and keeps the HTTP-shaped message", () => {
    const err = new BotBlockedError("https://news.ucmerced.edu/rss.xml", 403);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("BotBlockedError");
    expect(err.url).toBe("https://news.ucmerced.edu/rss.xml");
    expect(err.status).toBe(403);
    // Call sites record err.message in crawl-error JSON; keep it starting
    // with "HTTP <status>" like the plain failures they already log.
    expect(err.message).toMatch(/^HTTP 403 /);
  });
});

describe("headedFallbackEnabled", () => {
  it("is on by default and off only when CRAWL_NO_HEADED_FALLBACK=1", () => {
    withEnv(undefined, () => expect(headedFallbackEnabled()).toBe(true));
    withEnv("", () => expect(headedFallbackEnabled()).toBe(true));
    withEnv("1", () => expect(headedFallbackEnabled()).toBe(false));
  });
});
