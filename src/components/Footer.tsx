import { Link } from "react-router-dom";
import { useIsMobile } from "@/lib/useMediaQuery";
import { SUBMIT_PROGRAM_URL } from "@/lib/links";

interface FooterItem {
  label: string;
  /** Internal route (react-router Link). */
  to?: string;
  /** External destination (opens in a new tab). Mutually exclusive with `to`. */
  href?: string;
}

interface FooterColumn {
  h: string;
  l: FooterItem[];
}

// Items without `to` render as plain text rather than dead links — until
// the corresponding pages exist, the label still communicates scope but
// doesn't lie about clickability.
const COLUMNS: FooterColumn[] = [
  {
    h: "Explore",
    l: [
      { label: "All programs", to: "/discover" },
      { label: "Browse by campus", to: "/campuses" },
      { label: "Browse by industry", to: "/discover" },
      { label: "Compare programs", to: "/compare" },
      { label: "Spotlight stories", to: "/news" },
      { label: "Events calendar" },
    ],
  },
  {
    h: "For founders",
    l: [
      { label: "Funding directory" },
      { label: "Maker spaces" },
      { label: "Mentor network" },
      { label: "Submit a venture" },
      { label: "Office hours" },
    ],
  },
  {
    h: "For partners",
    l: [
      { label: "Become a mentor" },
      { label: "Sponsor a program" },
      { label: "Investor portal" },
      { label: "Industry partnerships" },
    ],
  },
  {
    h: "About",
    l: [
      { label: "The initiative", to: "/about#initiative" },
      { label: "Submit a program", href: SUBMIT_PROGRAM_URL },
      { label: "Data & methodology", to: "/about#methodology" },
      { label: "Press" },
      { label: "Contact" },
    ],
  },
];

function FooterLink({ item }: { item: FooterItem }) {
  const baseStyle = { color: "var(--uc-white)", textDecoration: "none", fontSize: 14 } as const;
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" style={baseStyle}>
        {item.label} <span aria-hidden="true">↗</span>
        <span className="sr-only"> (opens in new tab)</span>
      </a>
    );
  }
  if (item.to) {
    return (
      <Link to={item.to} style={baseStyle}>
        {item.label}
      </Link>
    );
  }
  // No destination yet — render as muted text rather than a dead link.
  return <span style={{ ...baseStyle, color: "rgba(255,255,255,.55)" }}>{item.label}</span>;
}

function FooterColumnView({ column }: { column: FooterColumn }) {
  return (
    <div>
      <h6
        style={{
          margin: "0 0 14px",
          fontSize: 11.5,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--uc-gold)",
          fontWeight: 700,
        }}
      >
        {column.h}
      </h6>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {column.l.map((item) => (
          <li key={item.label}>
            <FooterLink item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function FooterBrand() {
  return (
    <div>
      <img
        src={`${import.meta.env.BASE_URL}assets/uc-wordmark-white.png`}
        style={{ height: 42, marginBottom: 18, display: "block" }}
        alt="UC"
      />
      <div
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontSize: 20,
          lineHeight: 1.35,
          color: "var(--uc-white)",
          maxWidth: 360,
          marginBottom: 16,
        }}
      >
        Every entrepreneurship program across the ten UC campuses, in one place to search and
        compare.
      </div>
      <div style={{ fontSize: 13, color: "var(--uc-blue-xlight)" }}>
        An initiative of the UC Office of the President.
      </div>
    </div>
  );
}

function FooterBottom() {
  return (
    <div
      style={{
        maxWidth: 1440,
        margin: "48px auto 0",
        paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,.12)",
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        color: "var(--uc-blue-xlight)",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div>© Regents of the University of California</div>
    </div>
  );
}

export function Footer() {
  const isMobile = useIsMobile();
  return (
    <footer
      style={{
        background: "var(--uc-dark-blue)",
        color: "var(--uc-white)",
        padding: isMobile ? "48px 20px 20px" : "72px 32px 28px",
        marginTop: 0,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr 1fr 1fr 1fr",
          gap: isMobile ? 28 : 32,
        }}
      >
        <FooterBrand />
        {COLUMNS.map((col) => (
          <FooterColumnView key={col.h} column={col} />
        ))}
      </div>
      <FooterBottom />
    </footer>
  );
}
