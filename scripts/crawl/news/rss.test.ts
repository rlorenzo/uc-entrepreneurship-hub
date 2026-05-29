import { describe, it, expect } from "vite-plus/test";
import { decodeEntities, stripHtml } from "./rss.ts";

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
});
