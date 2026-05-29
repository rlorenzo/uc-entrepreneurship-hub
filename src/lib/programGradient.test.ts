import { describe, it, expect } from "vite-plus/test";
import { programGradient } from "./programGradient.ts";
import type { Program } from "../data/types.ts";

function prog(over: Partial<Program>): Program {
  return {
    id: "p",
    name: "P",
    campus: "berkeley",
    type: "incubator",
    desc: "",
    industries: [],
    stage: "Idea",
    eligibility: [],
    duration: "",
    funding: "",
    selectivity: "",
    cohortSize: null,
    deadline: "",
    ...over,
  };
}

describe("programGradient", () => {
  it("builds a gradient from the campus and type colors", () => {
    // berkeley -> #003262, incubator -> #1295D8
    expect(programGradient(prog({ campus: "berkeley", type: "incubator" }))).toBe(
      "linear-gradient(135deg, #003262 0%, #1295D8 100%)",
    );
  });

  it("falls back to default colors for an unknown campus or type", () => {
    expect(programGradient(prog({ campus: "nowhere", type: "mystery" }))).toBe(
      "linear-gradient(135deg, #002033 0%, #1295D8 100%)",
    );
  });
});
