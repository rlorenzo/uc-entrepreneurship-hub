import { describe, it, expect } from "vite-plus/test";
import { hostUserAgentOverride } from "./user-agent.ts";

function withEnv(value: string | undefined, fn: () => void): void {
  const prev = process.env.MERCED_USER_AGENT;
  if (value === undefined) delete process.env.MERCED_USER_AGENT;
  else process.env.MERCED_USER_AGENT = value;
  try {
    fn();
  } finally {
    if (prev === undefined) delete process.env.MERCED_USER_AGENT;
    else process.env.MERCED_USER_AGENT = prev;
  }
}

describe("hostUserAgentOverride (ucmerced.edu row)", () => {
  it("returns the secret UA for any ucmerced.edu host when set", () => {
    withEnv("UC-Entrepreneurship-Hub-Scanner/1.0", () => {
      expect(hostUserAgentOverride("https://news.ucmerced.edu/rss.xml")).toBe(
        "UC-Entrepreneurship-Hub-Scanner/1.0",
      );
      expect(hostUserAgentOverride("https://research.ucmerced.edu/programs")).toBe(
        "UC-Entrepreneurship-Hub-Scanner/1.0",
      );
      expect(hostUserAgentOverride("https://ucmerced.edu/")).toBe(
        "UC-Entrepreneurship-Hub-Scanner/1.0",
      );
    });
  });

  it("returns undefined for non-Merced hosts", () => {
    withEnv("UC-Entrepreneurship-Hub-Scanner/1.0", () => {
      expect(hostUserAgentOverride("https://news.ucsc.edu/feed/")).toBeUndefined();
      // Suffix/prefix look-alikes must not match the ucmerced.edu rule.
      expect(hostUserAgentOverride("https://ucmerced.edu.evil.test/")).toBeUndefined();
      expect(hostUserAgentOverride("https://notucmerced.edu/")).toBeUndefined();
    });
  });

  it("returns undefined when the secret is unset or empty", () => {
    withEnv(undefined, () =>
      expect(hostUserAgentOverride("https://news.ucmerced.edu/x")).toBeUndefined(),
    );
    withEnv("", () => expect(hostUserAgentOverride("https://news.ucmerced.edu/x")).toBeUndefined());
  });

  it("returns undefined for an unparseable URL", () => {
    withEnv("UC-Entrepreneurship-Hub-Scanner/1.0", () =>
      expect(hostUserAgentOverride("not a url")).toBeUndefined(),
    );
  });
});
