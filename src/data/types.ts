export interface Campus {
  id: string;
  name: string;
  short: string;
  x: number;
  y: number;
  color: string;
  tagline: string;
  programs: number;
  founded: number;
}

export interface ProgramType {
  id: string;
  label: string;
  color: string;
}

export type Stage = "Idea" | "Prototype" | "Pre-seed" | "Scaling";

export interface Program {
  id: string;
  name: string;
  campus: string;
  type: string;
  desc: string;
  industries: string[];
  stage: Stage;
  eligibility: string[];
  duration: string;
  funding: string;
  selectivity: string;
  cohortSize: number | null;
  deadline: string;
  featured?: boolean;
  eyebrow?: string;
}

export interface Spotlight {
  id: string;
  campus: string;
  eyebrow: string;
  title: string;
  meta: string;
  gradient: string;
}
