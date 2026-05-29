import { describe, it, expect } from "vite-plus/test";
import { toIsoDate } from "./dates.ts";

describe("toIsoDate", () => {
  it("returns an empty string for empty or unparseable input", () => {
    expect(toIsoDate("")).toBe("");
    expect(toIsoDate("garbage")).toBe("");
  });

  it("preserves timestamps that carry an explicit timezone", () => {
    expect(toIsoDate("2026-04-15T12:00:00.000Z")).toBe("2026-04-15T12:00:00.000Z");
    expect(toIsoDate("2026-04-15T12:00:00-04:00")).toBe("2026-04-15T16:00:00.000Z");
    expect(toIsoDate("Wed, 15 Apr 2026 12:00:00 GMT")).toBe("2026-04-15T12:00:00.000Z");
  });

  it("interprets timezone-less dates as Pacific time", () => {
    // The Drupal '<weekday>, MM/DD/YYYY - HH:MM' shape, ' - ' stripped, noon
    // Pacific. April is PDT (UTC-7), so noon Pacific = 19:00 UTC.
    expect(toIsoDate("Wed, 04/15/2026 - 12:00")).toBe("2026-04-15T19:00:00.000Z");
    // Long-month byline -> midnight Pacific (PDT) = 07:00 UTC.
    expect(toIsoDate("May 4, 2026")).toBe("2026-05-04T07:00:00.000Z");
    expect(toIsoDate("Sep. 3, 2026")).toBe("2026-09-03T07:00:00.000Z");
    // ISO date-only is anchored to Pacific midnight, not UTC midnight.
    expect(toIsoDate("2026-07-04")).toBe("2026-07-04T07:00:00.000Z");
  });

  it("accounts for Pacific standard vs daylight time", () => {
    // January -> PST (UTC-8): midnight Pacific = 08:00 UTC.
    expect(toIsoDate("Jan 10, 2026")).toBe("2026-01-10T08:00:00.000Z");
    // July -> PDT (UTC-7): midnight Pacific = 07:00 UTC.
    expect(toIsoDate("Jul 10, 2026")).toBe("2026-07-10T07:00:00.000Z");
  });

  it("is independent of the process timezone (anchors to America/Los_Angeles)", () => {
    expect(toIsoDate("2026-04-15T12:00:00")).toBe("2026-04-15T19:00:00.000Z");
  });
});
