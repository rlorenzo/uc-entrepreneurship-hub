import type { ProgramType } from "./types";

// textColor: AA-safe on white per the Contrast-First Rule. Bright brand hues
// get darkened derivatives (same pattern as the derived status tokens);
// hues that already clear 4.5:1 on paper reuse the base color.
export const TYPES: ProgramType[] = [
  { id: "incubator", label: "Incubator", color: "#1295D8", textColor: "#005581" },
  { id: "accelerator", label: "Accelerator", color: "#005581", textColor: "#005581" },
  { id: "certificate", label: "Certificate", color: "#00778B", textColor: "#00778B" },
  { id: "funding", label: "Funding", color: "#FFB511", textColor: "#8A6400" },
  { id: "competition", label: "Competition", color: "#E44C9A", textColor: "#B02A75" },
  { id: "maker", label: "Maker space", color: "#FF6E1B", textColor: "#B34700" },
  { id: "mentorship", label: "Mentorship", color: "#5B5D5E", textColor: "#5B5D5E" },
];

export const TYPE_BY_ID: Record<string, ProgramType> = Object.fromEntries(
  TYPES.map((t) => [t.id, t]),
);

export const INDUSTRIES = [
  "AI / ML",
  "Biotech",
  "Climate",
  "Consumer",
  "Hardware",
  "Health",
  "Fintech",
  "AgTech",
  "Media",
  "EdTech",
  "Robotics",
  "Energy",
];

export const STAGES = ["Idea", "Prototype", "Pre-seed", "Scaling"] as const;

export const ELIGIBILITY = [
  "Undergrad",
  "Graduate",
  "Alumni",
  "Faculty",
  "Postdoc",
  "Open to public",
];

export const DURATIONS = ["Short-term (<1 mo)", "Semester", "Academic year", "Ongoing / rolling"];
