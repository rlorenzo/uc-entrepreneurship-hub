import type { ProgramType } from "./types";

export const TYPES: ProgramType[] = [
  { id: "incubator", label: "Incubator", color: "#1295D8" },
  { id: "accelerator", label: "Accelerator", color: "#005581" },
  { id: "certificate", label: "Certificate", color: "#00778B" },
  { id: "funding", label: "Funding", color: "#FFB511" },
  { id: "competition", label: "Competition", color: "#E44C9A" },
  { id: "maker", label: "Maker space", color: "#FF6E1B" },
  { id: "mentorship", label: "Mentorship", color: "#7C7E7F" },
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
