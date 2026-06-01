import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { NewsCard } from "./NewsCard";
import type { NewsItem } from "@/data/news";

const base: NewsItem = {
  id: "test-1",
  campus: "berkeley",
  title: "A real entrepreneurship story",
  summary: "A short summary of the story.",
  publishedAt: "2026-05-01T12:00:00-07:00",
  sourceUrl: "https://example.com/story",
  sourceHost: "example.com",
};

// Real articles can arrive without a publish date. They are kept in the feed
// and must render cleanly — earlier the date eyebrow rendered as an empty,
// space-occupying element when the date was missing.
describe("NewsCard date rendering", () => {
  it("shows the formatted date when publishedAt is present", () => {
    render(<NewsCard item={base} />);
    expect(screen.getByText("May 1, 2026")).toBeTruthy();
  });

  it("omits the date entirely when publishedAt is missing (no empty slot)", () => {
    const { container } = render(<NewsCard item={{ ...base, publishedAt: "" }} />);
    // The story still renders…
    expect(screen.getByText(base.title)).toBeTruthy();
    // …but no uppercase date eyebrow is emitted, empty or otherwise.
    const uppercase = [...container.querySelectorAll("div")].filter(
      (d) => d.style.textTransform === "uppercase",
    );
    expect(uppercase).toEqual([]);
  });
});
