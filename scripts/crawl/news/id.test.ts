import { describe, it, expect } from "vite-plus/test";
import { buildArticleId } from "./id.ts";

describe("buildArticleId", () => {
  it("derives a campus-prefixed id from the URL's last path segment", () => {
    expect(
      buildArticleId("berkeley", "https://news.berkeley.edu/2026/05/01/new-accelerator/"),
    ).toBe("berkeley-new-accelerator");
  });

  it("ignores a trailing slash and lowercases the segment", () => {
    expect(buildArticleId("davis", "https://example.com/a/b/Final-Story")).toBe(
      "davis-final-story",
    );
  });

  it("falls back to 'item' when the URL has no path segment", () => {
    expect(buildArticleId("ucla", "https://example.com/")).toBe("ucla-item");
  });

  it("handles non-URL input via the catch branch", () => {
    expect(buildArticleId("merced", "not a url")).toBe("merced-not-a-url");
  });
});
