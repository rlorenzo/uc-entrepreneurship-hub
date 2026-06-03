import { describe, it, expect } from "vite-plus/test";
import { render } from "@testing-library/react";
import { CardArt } from "./CardArt";
import type { Program } from "@/data/types.ts";

/** Minimal valid Program; tests override only what they exercise. */
function prog(over: Partial<Program>): Program {
  return {
    id: "p",
    name: "Test Program",
    campus: "berkeley",
    type: "incubator",
    desc: "desc",
    industries: [],
    stage: "Idea",
    eligibility: [],
    duration: "Not specified",
    funding: "Not disclosed",
    selectivity: "Not disclosed",
    cohortSize: null,
    deadline: "Rolling",
    ...over,
  };
}

describe("CardArt hero image", () => {
  it("renders the hero photo when imageUrl is a safe http(s) URL", () => {
    const { container } = render(
      <CardArt program={prog({ imageUrl: "https://x.edu/hero.png" })} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://x.edu/hero.png");
    // Decorative — the program name sits beside the art on the card.
    expect(img?.getAttribute("alt")).toBe("");
  });

  it("falls back to gradient art (no img) when imageUrl is absent", () => {
    const { container } = render(<CardArt program={prog({})} />);
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not emit an img for an unsafe (non-http) imageUrl", () => {
    const { container } = render(<CardArt program={prog({ imageUrl: "javascript:alert(1)" })} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
