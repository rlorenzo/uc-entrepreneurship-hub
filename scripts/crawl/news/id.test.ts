import { describe, it, expect } from "vite-plus/test";
import { buildArticleId } from "./id.ts";

describe("buildArticleId", () => {
  it("derives a campus-, host-, and segment-based id", () => {
    expect(
      buildArticleId("berkeley", "https://news.berkeley.edu/2026/05/01/new-accelerator/"),
    ).toBe("berkeley-news-berkeley-edu-new-accelerator");
  });

  it("keeps same-slug articles on different hosts distinct", () => {
    const a = buildArticleId("berkeley", "https://skydeck.berkeley.edu/demo-day-2026/");
    const b = buildArticleId("berkeley", "https://newsroom.haas.berkeley.edu/demo-day-2026");
    expect(a).not.toBe(b);
  });

  it("keeps different host-root links distinct", () => {
    const a = buildArticleId("berkeley", "https://citris-uc.org/");
    const b = buildArticleId("berkeley", "https://skydeck.berkeley.edu/");
    expect(a).toBe("berkeley-citris-uc-org-item");
    expect(a).not.toBe(b);
  });

  it("ignores a www prefix, trailing slash, and segment case", () => {
    expect(buildArticleId("davis", "https://www.example.com/a/b/Final-Story")).toBe(
      "davis-example-com-final-story",
    );
  });

  it("handles non-URL input via the catch branch", () => {
    expect(buildArticleId("merced", "not a url")).toBe("merced-not-a-url");
  });
});
