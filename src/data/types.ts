/** A curated center/institute shown in a campus page's ecosystem section. */
export interface EcosystemCenter {
  name: string;
  desc: string;
  url?: string;
}

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
  /** Curated major centers driving entrepreneurship on this campus. */
  ecosystem: EcosystemCenter[];
}

export interface ProgramType {
  id: string;
  label: string;
  color: string;
  /**
   * AA-contrast-safe variant of `color` for text and tint-pill fills on white
   * (DESIGN.md Contrast-First Rule). Same as `color` where the base hue
   * already clears 4.5:1 on paper.
   */
  textColor: string;
}

export type Stage = "Idea" | "Prototype" | "Pre-seed" | "Scaling";

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
  /** Canonical program homepage. */
  website?: string;
  /** Direct application link if separate from `website`. */
  applicationLink?: string;
  /** The center, lab, or office that runs the program. */
  associatedCenter?: string;
  /** ISO 8601 timestamp of the most recent successful crawl/refresh. */
  lastUpdated?: string;
  /** The page the program was extracted from, when crawled. */
  sourceUrl?: string;
  /**
   * Optional hero image (the program page's og:image, harvested by the
   * crawler). Mirrors NewsItem.imageUrl. When absent — which is the common
   * case, since program pages rarely publish hero photos — the card and
   * detail hero fall back to the branded `programGradient` art.
   */
  imageUrl?: string;
  featured?: boolean;
  eyebrow?: string;
}
