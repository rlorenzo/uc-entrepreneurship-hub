import { describe, expect, it } from "vite-plus/test";

import { ogImageFromHtml } from "./enrich.ts";

describe("ogImageFromHtml", () => {
  it("reads og:image regardless of attribute order", () => {
    expect(ogImageFromHtml('<meta property="og:image" content="https://a.test/x.jpg" />')).toBe(
      "https://a.test/x.jpg",
    );
    expect(ogImageFromHtml("<meta content='https://a.test/y.jpg' property='og:image'>")).toBe(
      "https://a.test/y.jpg",
    );
  });

  it("ignores og:image:width and decodes entities", () => {
    const html =
      '<meta property="og:image:width" content="2560" /><meta name="twitter:image" content="https://a.test/z.jpg?a=1&amp;b=2" />';
    expect(ogImageFromHtml(html)).toBe("https://a.test/z.jpg?a=1&b=2");
  });

  it("returns empty when absent", () => {
    expect(ogImageFromHtml("<html></html>")).toBe("");
  });
});
