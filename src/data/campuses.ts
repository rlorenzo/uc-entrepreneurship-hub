import type { Campus, EcosystemCenter } from "./types";
import { PROGRAMS } from "./programs";

// Static campus metadata. The `programs` count is derived from the merged
// PROGRAMS array (curated + crawled) below, so the hero stat, footer
// "See all N programs" link, and CampusPage section header all stay in
// sync with the actual catalog.
type CampusMeta = Omit<Campus, "programs" | "ecosystem">;

const CAMPUS_META: CampusMeta[] = [
  {
    id: "berkeley",
    name: "UC Berkeley",
    short: "Berkeley",
    lat: 37.8716,
    lon: -122.2727,
    color: "#003262",
    tagline: "The Bay’s deep-tech and consumer launchpad",
    founded: 1868,
    hubUrl: "https://begin.berkeley.edu/",
  },
  {
    id: "davis",
    name: "UC Davis",
    short: "Davis",
    lat: 38.5382,
    lon: -121.7617,
    color: "#022851",
    tagline: "AgTech, food systems, sustainability",
    founded: 1905,
    hubUrl: "https://iedo.ucdavis.edu/",
  },
  {
    id: "merced",
    name: "UC Merced",
    short: "Merced",
    lat: 37.3661,
    lon: -120.4242,
    color: "#002856",
    tagline: "Climate, water, the San Joaquin Valley",
    founded: 2005,
    hubUrl: "https://entrepreneurship.ucmerced.edu/",
  },
  {
    id: "santacruz",
    name: "UC Santa Cruz",
    short: "Santa Cruz",
    lat: 36.9914,
    lon: -122.0609,
    color: "#003c6c",
    tagline: "Games, genomics, ocean science",
    founded: 1965,
    hubUrl: "https://innovation.ucsc.edu/",
  },
  {
    id: "sf",
    name: "UC San Francisco",
    short: "UCSF",
    lat: 37.7626,
    lon: -122.4582,
    color: "#052049",
    tagline: "Health and life-science startups",
    founded: 1864,
    hubUrl: "https://innovation.ucsf.edu/",
  },
  {
    id: "santabarbara",
    name: "UC Santa Barbara",
    short: "Santa Barbara",
    lat: 34.414,
    lon: -119.8489,
    color: "#003660",
    tagline: "Materials, photonics, deep tech",
    founded: 1909,
    hubUrl: "https://innovation.ucsb.edu/",
  },
  {
    id: "la",
    name: "UCLA",
    short: "UCLA",
    lat: 34.0689,
    lon: -118.4452,
    color: "#2774AE",
    tagline: "Media, biosciences, consumer",
    founded: 1919,
    hubUrl:
      "https://www.anderson.ucla.edu/about/centers/price-center-for-entrepreneurship-and-innovation",
  },
  {
    id: "irvine",
    name: "UC Irvine",
    short: "Irvine",
    lat: 33.6405,
    lon: -117.8443,
    color: "#0064A4",
    tagline: "Beall, biotech, gaming",
    founded: 1965,
    hubUrl: "https://innovation.uci.edu/",
  },
  {
    id: "riverside",
    name: "UC Riverside",
    short: "Riverside",
    lat: 33.9737,
    lon: -117.3281,
    color: "#003DA5",
    tagline: "AgTech, Inland Empire founders",
    founded: 1954,
    hubUrl: "https://techpartnerships.ucr.edu/",
  },
  {
    id: "sd",
    name: "UC San Diego",
    short: "San Diego",
    lat: 32.8801,
    lon: -117.234,
    color: "#182B49",
    tagline: "Biotech, hardware, climate",
    founded: 1960,
    hubUrl: "https://innovation.ucsd.edu/",
  },
];

// Curated centers/institutes shown in each campus page's ecosystem section.
// This is catalog data, not UI copy — it lives here so campus facts are
// edited (and audited) in one place. A campus with no entries simply renders
// no ecosystem section; never invent a placeholder center.
const ECOSYSTEM_BY_CAMPUS: Record<string, EcosystemCenter[]> = {
  berkeley: [
    {
      name: "Sutardja Center for Entrepreneurship & Technology",
      desc: "The cross-disciplinary engine behind SkyDeck, the Foundry, and Berkeley’s entrepreneurship curriculum.",
      url: "https://scet.berkeley.edu/",
    },
    {
      name: "Berkeley SkyDeck",
      desc: "A top-floor accelerator that has invested in 350+ companies across all 10 UC campuses.",
      url: "https://skydeck.berkeley.edu/",
    },
    {
      name: "Jacobs Institute for Design Innovation",
      desc: "Open-access fabrication and design labs serving every major and skill level.",
      url: "https://jacobsinstitute.berkeley.edu/",
    },
    {
      name: "Haas School of Business — Lester Center",
      desc: "Research, courses, and the Big Ideas Contest open to all UC students.",
      url: "https://bigideascontest.org/",
    },
  ],
  la: [
    {
      name: "Anderson Venture Accelerator",
      desc: "Anderson’s flagship accelerator for UCLA-founded ventures across all schools.",
    },
    {
      name: "StartUp UCLA",
      desc: "Campus-wide entrepreneurship hub running summer accelerators and competitions.",
    },
    {
      name: "Institute for Technology Advancement",
      desc: "Translational research and licensing arm for UCLA-developed IP.",
    },
  ],
  sd: [
    {
      name: "The Basement",
      desc: "Undergraduate-first innovation hub with workshops, micro-grants, and 24/7 space.",
    },
    {
      name: "Institute for the Global Entrepreneur",
      desc: "Joint Rady-Jacobs program for engineering-led ventures.",
    },
    {
      name: "Office of Innovation and Commercialization",
      desc: "IP, licensing, and proof-of-concept funding across UCSD research labs.",
    },
  ],
  irvine: [
    {
      name: "Beall Applied Innovation",
      desc: "A campus-adjacent innovation district housing the Cove, Wayfinder accelerator, and POC funds.",
    },
    {
      name: "New Venture Group",
      desc: "The student-led venture community running speaker series and pitch nights.",
    },
  ],
  sf: [
    {
      name: "UCSF Innovation Ventures",
      desc: "The translational engine for UCSF research, from disclosure to spin-out.",
      url: "https://innovation.ucsf.edu/",
    },
    {
      name: "Rosenman Institute",
      desc: "Health-tech fellowship and innovator pipeline at the QB3 Mission Bay campus.",
      url: "https://www.linkedin.com/school/rosenman-institute",
    },
  ],
  davis: [
    {
      name: "Mike & Renee Child Institute for Innovation & Entrepreneurship",
      desc: "The Graduate School of Management’s entrepreneurship hub.",
    },
    {
      name: "PLeAT Lab",
      desc: "Plant Lab Accelerator focused on AgTech and food-system startups.",
    },
  ],
  santabarbara: [
    {
      name: "Technology Management Program",
      desc: "Year-long entrepreneurship certificate sitting between engineering and business.",
    },
    {
      name: "NVCC New Venture Competition",
      desc: "A 10-month deep-tech competition with 30+ years of alumni outcomes.",
    },
  ],
  santacruz: [
    {
      name: "Center for Innovation & Entrepreneurial Development",
      desc: "CIED runs Slug Tank, the IDEA Hub, and undergraduate-focused programs.",
    },
  ],
  riverside: [
    {
      name: "Office of Technology Partnerships",
      desc: "Manages EPIC proof-of-concept funding and licensing for UCR ventures.",
    },
  ],
  merced: [
    {
      name: "Venture Lab @ Merced",
      desc: "Founder-led incubator focused on water, climate, and the Central Valley.",
    },
  ],
};

function countProgramsByCampus(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const meta of CAMPUS_META) counts[meta.id] = 0;
  for (const p of PROGRAMS) {
    if (counts[p.campus] !== undefined) counts[p.campus] += 1;
  }
  return counts;
}

const PROGRAM_COUNTS = countProgramsByCampus();

export const CAMPUSES: Campus[] = CAMPUS_META.map((meta) => ({
  ...meta,
  programs: PROGRAM_COUNTS[meta.id] ?? 0,
  ecosystem: ECOSYSTEM_BY_CAMPUS[meta.id] ?? [],
}));

export const CAMPUS_BY_ID: Record<string, Campus> = Object.fromEntries(
  CAMPUSES.map((c) => [c.id, c]),
);
