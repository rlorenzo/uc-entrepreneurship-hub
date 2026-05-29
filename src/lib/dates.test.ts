import { describe, it, expect } from "vite-plus/test";
import { formatNewsDate } from "./dates.ts";

describe("formatNewsDate", () => {
  it("returns an empty string for empty or unparseable input", () => {
    expect(formatNewsDate("")).toBe("");
    expect(formatNewsDate("not a date")).toBe("");
  });

  it("formats an ISO timestamp as a short date in Pacific time", () => {
    // 14:07 UTC = 07:07 Pacific (PDT) on the 6th.
    expect(formatNewsDate("2026-05-06T14:07:53.001Z")).toBe("May 6, 2026");
  });

  it("renders the Pacific calendar date, not the viewer's", () => {
    // 03:00 UTC on the 6th = 20:00 Pacific (PDT) on the 5th, so it must read
    // as the 5th regardless of where the page is viewed.
    expect(formatNewsDate("2026-05-06T03:00:00.000Z")).toBe("May 5, 2026");
  });
});
