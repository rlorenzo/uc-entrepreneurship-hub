import { describe, it, expect } from "vite-plus/test";

import {
  parseRobots,
  isPathAllowed,
  readCapped,
  MAX_ROBOTS_BYTES,
  RobotsGate,
  RobotsDisallowedError,
  type RobotsFetchResult,
} from "./robots.ts";

function allowed(txt: string, path: string, token?: string): boolean {
  return isPathAllowed(parseRobots(txt, token), path);
}

describe("parseRobots + isPathAllowed", () => {
  it("allows everything when robots.txt is empty", () => {
    expect(allowed("", "/anything")).toBe(true);
  });

  it("honors a wildcard Disallow", () => {
    const txt = "User-agent: *\nDisallow: /private";
    expect(allowed(txt, "/private/report")).toBe(false);
    expect(allowed(txt, "/public/report")).toBe(true);
  });

  it("treats an empty Disallow as allow-all", () => {
    const txt = "User-agent: *\nDisallow:";
    expect(allowed(txt, "/anything")).toBe(true);
  });

  it("lets a longer, more specific rule win regardless of order", () => {
    const txt = "User-agent: *\nDisallow: /news\nAllow: /news/press";
    expect(allowed(txt, "/news/press/2026")).toBe(true); // Allow is longer
    expect(allowed(txt, "/news/other")).toBe(false); // only Disallow matches
  });

  it("breaks an equal-length tie in favor of Allow", () => {
    const txt = "User-agent: *\nDisallow: /a\nAllow: /a";
    expect(allowed(txt, "/apple")).toBe(true);
  });

  it("expands the * wildcard inside a pattern", () => {
    const txt = "User-agent: *\nDisallow: /*/admin";
    expect(allowed(txt, "/team/admin/settings")).toBe(false);
    expect(allowed(txt, "/admin")).toBe(true); // needs a segment before /admin
  });

  it("anchors the end with a trailing $", () => {
    const txt = "User-agent: *\nDisallow: /*.pdf$";
    expect(allowed(txt, "/files/report.pdf")).toBe(false);
    expect(allowed(txt, "/files/report.pdf?download=1")).toBe(true); // not the end
  });

  it("ignores comments and blank lines", () => {
    const txt = "# a comment\n\nUser-agent: *\nDisallow: /x  # inline";
    expect(allowed(txt, "/x/y")).toBe(false);
  });

  it("matches the query string, not just the path", () => {
    const txt = "User-agent: *\nDisallow: /search?";
    expect(allowed(txt, "/search?q=hi")).toBe(false);
    expect(allowed(txt, "/search")).toBe(true);
  });
});

describe("user-agent group selection", () => {
  it("prefers a group that names us over the wildcard group", () => {
    const txt = [
      "User-agent: *",
      "Disallow: /",
      "",
      "User-agent: uc-entrepreneurship-hub-crawler",
      "Disallow:",
    ].join("\n");
    // The named group (empty Disallow → allow all) applies to us, not the
    // blanket wildcard block.
    expect(allowed(txt, "/anything")).toBe(true);
  });

  it("matches a named group by prefix", () => {
    const txt = "User-agent: uc-entrepreneurship\nDisallow: /secret";
    expect(allowed(txt, "/secret/x")).toBe(false);
    expect(allowed(txt, "/open")).toBe(true);
  });

  it("matches a group naming our versioned UA, as sent on the wire", () => {
    // An admin who copies the UA from their access logs writes the versioned
    // form; the default token is the full UA string so it still matches by
    // prefix instead of silently falling back to the * group.
    const txt = [
      "User-agent: *",
      "Disallow:",
      "",
      "User-agent: uc-entrepreneurship-hub-crawler/1.0",
      "Disallow: /private",
    ].join("\n");
    expect(allowed(txt, "/private/x")).toBe(false);
    expect(allowed(txt, "/open")).toBe(true);
  });

  it("stacks multiple User-agent lines onto one group", () => {
    const txt = "User-agent: googlebot\nUser-agent: *\nDisallow: /blocked";
    expect(allowed(txt, "/blocked/x")).toBe(false);
  });

  it("does not apply an unrelated named group to us", () => {
    const txt = "User-agent: googlebot\nDisallow: /";
    expect(allowed(txt, "/anything")).toBe(true); // no * group, googlebot ≠ us
  });

  it("merges rules from duplicate blocks that name the same agent", () => {
    // Some CMS plugins emit a second block for the same agent; both blocks'
    // rules must apply, not just the first.
    const txt = [
      "User-agent: uc-entrepreneurship-hub-crawler",
      "Disallow: /a",
      "",
      "User-agent: uc-entrepreneurship-hub-crawler",
      "Disallow: /b",
    ].join("\n");
    expect(allowed(txt, "/a/x")).toBe(false);
    expect(allowed(txt, "/b/x")).toBe(false);
    expect(allowed(txt, "/c")).toBe(true);
  });

  it("does not merge two groups separated by a non-rule directive", () => {
    // A Sitemap line between our (rule-less) group and googlebot's blanket
    // block must NOT fold googlebot's `Disallow: /` onto us. Regression guard:
    // before the fix, the intervening non-rule line left agent-collection open
    // and merged the two groups, wrongly blocking us everywhere.
    const txt = [
      "User-agent: uc-entrepreneurship-hub-crawler",
      "Sitemap: https://x.test/sitemap.xml",
      "User-agent: googlebot",
      "Disallow: /",
    ].join("\n");
    expect(allowed(txt, "/anything")).toBe(true);
  });

  it("keeps a within-group Crawl-delay from dropping the group's Disallow", () => {
    const txt = ["User-agent: *", "Crawl-delay: 5", "Disallow: /blocked"].join("\n");
    // Crawl-delay contributes no path rule, but the Disallow still lands in the
    // one `*` group it belongs to.
    expect(allowed(txt, "/blocked/y")).toBe(false);
    expect(allowed(txt, "/open")).toBe(true);
  });
});

describe("robustness", () => {
  it("tolerates a leading UTF-8 BOM on the first directive", () => {
    const txt = "\uFEFFUser-agent: *\nDisallow: /private";
    expect(allowed(txt, "/private/x")).toBe(false);
    expect(allowed(txt, "/ok")).toBe(true);
  });

  it("handles CRLF line endings", () => {
    const txt = "User-agent: *\r\nDisallow: /private\r\n";
    expect(allowed(txt, "/private/x")).toBe(false);
  });
});

describe("readCapped", () => {
  // Minimal stand-in for a fetch Response body that yields the given chunks.
  function respFrom(...chunks: Uint8Array[]): Awaited<ReturnType<typeof fetch>> {
    let i = 0;
    const reader = {
      read: async () =>
        i < chunks.length ? { done: false, value: chunks[i++] } : { done: true, value: undefined },
      cancel: async () => {},
    };
    return { body: { getReader: () => reader } } as unknown as Awaited<ReturnType<typeof fetch>>;
  }

  it("returns the full body when under the cap", async () => {
    const text = await readCapped(
      respFrom(new TextEncoder().encode("User-agent: *\nDisallow: /x")),
    );
    expect(isPathAllowed(parseRobots(text), "/x/y")).toBe(false);
  });

  it("keeps the leading rules when a single chunk exceeds the cap (regression)", async () => {
    // Before the fix, an oversized first chunk was dropped entirely and the
    // file was misread as empty → allow-all, silently ignoring robots.txt.
    const head = "User-agent: *\nDisallow: /private\n";
    const oversized = new TextEncoder().encode(head + "#".repeat(MAX_ROBOTS_BYTES + 100));
    const text = await readCapped(respFrom(oversized));
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(MAX_ROBOTS_BYTES);
    expect(text.startsWith(head)).toBe(true);
    expect(isPathAllowed(parseRobots(text), "/private/x")).toBe(false);
  });

  it("returns empty for a bodyless response", async () => {
    const resp = { body: null } as unknown as Awaited<ReturnType<typeof fetch>>;
    expect(await readCapped(resp)).toBe("");
  });
});

describe("RobotsGate", () => {
  function gateReturning(result: Partial<RobotsFetchResult> | (() => never)): {
    gate: RobotsGate;
    calls: string[];
  } {
    const calls: string[] = [];
    const gate = new RobotsGate(async (url) => {
      calls.push(url);
      if (typeof result === "function") result();
      return { status: 200, text: "", ...result };
    });
    return { gate, calls };
  }

  it("fetches /robots.txt at the origin and enforces a Disallow", async () => {
    const { gate, calls } = gateReturning({
      status: 200,
      text: "User-agent: *\nDisallow: /private",
    });
    expect(await gate.allows("https://example.com/private/x")).toBe(false);
    expect(await gate.allows("https://example.com/ok")).toBe(true);
    expect(calls).toEqual(["https://example.com/robots.txt"]);
  });

  it("selects the allowlisted-UA group on ucmerced.edu origins", async () => {
    // Merced hosts are crawled under the MERCED_USER_AGENT identity, so a
    // robots group naming that UA must govern us there — not fall through
    // to the * group selected by our default token.
    const prev = process.env.MERCED_USER_AGENT;
    process.env.MERCED_USER_AGENT = "UC-Entrepreneurship-Hub-Scanner/1.0";
    try {
      const txt = [
        "User-agent: *",
        "Disallow:",
        "",
        "User-agent: uc-entrepreneurship-hub-scanner",
        "Disallow: /private",
      ].join("\n");
      const { gate } = gateReturning({ status: 200, text: txt });
      expect(await gate.allows("https://news.ucmerced.edu/private/x")).toBe(false);
      expect(await gate.allows("https://news.ucmerced.edu/open")).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.MERCED_USER_AGENT;
      else process.env.MERCED_USER_AGENT = prev;
    }
  });

  it("caches per origin — one fetch even across concurrent calls", async () => {
    const { gate, calls } = gateReturning({ status: 200, text: "User-agent: *\nDisallow: /no" });
    const [a, b] = await Promise.all([
      gate.allows("https://example.com/no/1"),
      gate.allows("https://example.com/yes/2"),
    ]);
    expect(a).toBe(false);
    expect(b).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it("allows everything when robots.txt is missing (404)", async () => {
    const { gate } = gateReturning({ status: 404, text: "" });
    expect(await gate.allows("https://example.com/whatever")).toBe(true);
  });

  it("fails open on a 5xx", async () => {
    const { gate } = gateReturning({ status: 503, text: "" });
    expect(await gate.allows("https://example.com/whatever")).toBe(true);
  });

  it("fails open when the fetch throws", async () => {
    const { gate } = gateReturning(() => {
      throw new Error("network down");
    });
    expect(await gate.allows("https://example.com/whatever")).toBe(true);
  });

  it("skips gating for unparseable or non-http(s) URLs without fetching", async () => {
    const { gate, calls } = gateReturning({ status: 200, text: "User-agent: *\nDisallow: /" });
    expect(await gate.allows("not a url")).toBe(true);
    expect(await gate.allows("data:text/plain,hi")).toBe(true);
    expect(calls).toHaveLength(0);
  });
});

describe("RobotsDisallowedError", () => {
  it("carries the url and a clear message", () => {
    const err = new RobotsDisallowedError("https://x.test/y");
    expect(err.name).toBe("RobotsDisallowedError");
    expect(err.url).toBe("https://x.test/y");
    expect(err.message).toContain("robots.txt");
  });
});
