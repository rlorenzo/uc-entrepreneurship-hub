export interface Campus {
  id: string;
  name: string;
  short: string;
  /** Campus latitude (decimal degrees). Projected to SVG space by CaliforniaMap. */
  lat: number;
  /** Campus longitude (decimal degrees, negative = west). */
  lon: number;
  color: string;
  tagline: string;
  programs: number;
  founded: number;
  /** Innovation hub / entrepreneurship office home page (used as crawler seed). */
  hubUrl?: string;
}

export interface ProgramType {
  id: string;
  label: string;
  color: string;
}

export type Stage = "Idea" | "Prototype" | "Pre-seed" | "Scaling";

export interface ProgramDeadline {
  label?: string;
  /** ISO 8601 date string when known, otherwise free-form. */
  date?: string;
}

export interface Program {
  id: string;
  /** URL-safe identifier. Defaults to `id` when absent so existing routes keep working. */
  slug?: string;
  name: string;
  campus: string;
  type: string;
  /** Short summary used on cards. */
  desc: string;
  /** Optional long-form description used on the program detail page. */
  longDescription?: string;
  industries: string[];
  stage: Stage;
  eligibility: string[];
  duration: string;
  funding: string;
  selectivity: string;
  cohortSize: number | null;
  /** Free-form deadline label kept for back-compat with curated cards. */
  deadline: string;
  /** Structured deadlines harvested from program pages. */
  deadlines?: ProgramDeadline[];
  /** Canonical program homepage. */
  website?: string;
  /** Direct application link if separate from `website`. */
  applicationLink?: string;
  /** The center, lab, or office that runs the program. */
  associatedCenter?: string;
  /** Free-form tags layered on top of `industries` for richer filtering. */
  tags?: string[];
  /** ISO 8601 timestamp of the most recent successful crawl/refresh. */
  lastUpdated?: string;
  /** The page the program was extracted from, when crawled. */
  sourceUrl?: string;
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
