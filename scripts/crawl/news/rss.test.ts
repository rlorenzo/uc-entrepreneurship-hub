import { describe, it, expect } from "vite-plus/test";
import { decodeEntities, stripHtml, userAgentForFeed } from "./rss.ts";

describe("userAgentForFeed", () => {
  const MERCED = "https://news.ucmerced.edu/rss.xml";
  const DEFAULT_UA = "uc-entrepreneurship-hub-crawler/1.0 (+github.com/rlorenzo)";

  it("uses the default UA for non-Merced feeds regardless of env", () => {
    const prev = process.env.MERCED_USER_AGENT;
    process.env.MERCED_USER_AGENT = "Some-Allowlisted-UA/1.0";
    try {
      expect(userAgentForFeed("https://news.ucsc.edu/feed/")).toBe(DEFAULT_UA);
    } finally {
      if (prev === undefined) delete process.env.MERCED_USER_AGENT;
      else process.env.MERCED_USER_AGENT = prev;
    }
  });

  it("uses the env-provided UA for the Merced feed when set", () => {
    const prev = process.env.MERCED_USER_AGENT;
    process.env.MERCED_USER_AGENT = "Some-Allowlisted-UA/1.0";
    try {
      expect(userAgentForFeed(MERCED)).toBe("Some-Allowlisted-UA/1.0");
    } finally {
      if (prev === undefined) delete process.env.MERCED_USER_AGENT;
      else process.env.MERCED_USER_AGENT = prev;
    }
  });

  it("falls back to the default UA for Merced when the env var is unset or empty", () => {
    const prev = process.env.MERCED_USER_AGENT;
    try {
      delete process.env.MERCED_USER_AGENT;
      expect(userAgentForFeed(MERCED)).toBe(DEFAULT_UA);
      process.env.MERCED_USER_AGENT = "";
      expect(userAgentForFeed(MERCED)).toBe(DEFAULT_UA);
    } finally {
      if (prev === undefined) delete process.env.MERCED_USER_AGENT;
      else process.env.MERCED_USER_AGENT = prev;
    }
  });
});

describe("decodeEntities", () => {
  it("decodes decimal numeric entities", () => {
    expect(decodeEntities("Tom&#39;s lab")).toBe("Tom's lab");
  });

  it("decodes hexadecimal numeric entities (regression)", () => {
    // Hex entities like &#x27; were previously left raw.
    expect(decodeEntities("Tom&#x27;s lab")).toBe("Tom's lab");
    expect(decodeEntities("A&#X26;B")).toBe("A&B"); // uppercase X too
  });

  it("decodes astral-plane code points", () => {
    expect(decodeEntities("rocket &#x1F680;")).toBe("rocket 🚀");
  });

  it("decodes named entities", () => {
    expect(decodeEntities("R&amp;D &lt;tag&gt;")).toBe("R&D <tag>");
  });

  it("leaves invalid numeric entities untouched", () => {
    expect(decodeEntities("keep &#xZZ; raw")).toBe("keep &#xZZ; raw");
  });
});

describe("stripHtml", () => {
  it("strips tags and collapses whitespace", () => {
    expect(stripHtml("<p>Just <b>bold</b></p>")).toBe("Just bold");
  });

  it("unwraps a clean CDATA block", () => {
    expect(stripHtml("<![CDATA[Hello world]]>")).toBe("Hello world");
  });

  it("preserves text inside CDATA mixed with other content (regression)", () => {
    // The tag regex used to swallow `<![CDATA[...]]>` whole, losing the text;
    // CDATA is now unwrapped first so the inner text survives.
    expect(stripHtml("intro <![CDATA[<p>inner text</p>]]> outro")).toBe("intro inner text outro");
  });

  it("decodes entities inside unwrapped CDATA", () => {
    expect(stripHtml("<![CDATA[Tom&#x27;s & Jerry]]>")).toBe("Tom's & Jerry");
  });

  it("strips entity-encoded markup revealed by decoding (Drupal/Merced regression)", () => {
    // UC Merced's feed entity-encodes its HTML; decoding turns &lt;div&gt; back
    // into a real tag, so it must be stripped after decoding too.
    const encoded = "&lt;div class=&quot;byline&quot;&gt;By Patty Guerra&lt;/div&gt; The body.";
    expect(stripHtml(encoded)).toBe("By Patty Guerra The body.");
  });

  it("keeps a decoded '<' that is not a complete tag", () => {
    expect(stripHtml("Cost &lt; $100 for founders")).toBe("Cost < $100 for founders");
  });

  it("resolves double-encoded text entities (Merced &amp;#039; -> ')", () => {
    // The markup is entity-encoded and the inner apostrophe is double-encoded
    // (&amp;#039;); both layers must resolve, not just the outer one.
    expect(stripHtml("&lt;p&gt;Chen&amp;#039;s work&lt;/p&gt;")).toBe("Chen's work");
  });

  it("strips zero-width and invisible format characters", () => {
    // UC San Diego prefixes a U+200B onto summaries; it must not survive.
    expect(stripHtml("​From the lab")).toBe("From the lab");
    expect(stripHtml("a‌‍﻿b")).toBe("ab");
    // An entity-encoded zero-width space (&#8203;) is removed after decoding too.
    expect(stripHtml("x&#8203;y")).toBe("xy");
  });
});
