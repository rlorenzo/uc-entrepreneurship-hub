import { useState } from "react";
import { Link } from "react-router-dom";
import { Page } from "@/components/Page";
import { PageHero } from "@/components/PageHero";
import { CaliforniaMap } from "@/components/CaliforniaMap";
import { CAMPUSES } from "@/data/campuses";
import type { Campus } from "@/data/types.ts";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_Arrow } from "@/lib/icons";

function CampusesHero() {
  return (
    <PageHero
      trail={[{ label: "Home", to: "/" }, { label: "Campuses" }]}
      eyebrow="10 campuses, one system"
      title="Pick a campus."
      blurb="Each campus has its own ecosystem of centers, accelerators, and funds. Most are open to founders from any UC campus."
    />
  );
}

interface CampusCardProps {
  campus: Campus;
  onHoverChange: (id: string | null) => void;
}

function CampusCard({ campus, onHoverChange }: CampusCardProps) {
  const handleEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,32,51,.10)";
    e.currentTarget.style.transform = "translateY(-2px)";
    onHoverChange(campus.id);
  };
  const handleLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.boxShadow = "";
    e.currentTarget.style.transform = "";
    onHoverChange(null);
  };
  return (
    <Link
      to={`/campus/${campus.id}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={() => onHoverChange(campus.id)}
      onBlur={() => onHoverChange(null)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "20px 22px",
        background: "#fff",
        border: "1px solid rgba(0,32,51,.10)",
        borderRadius: 8,
        textDecoration: "none",
        color: "#002033",
        transition: "box-shadow .25s, transform .25s",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: campus.color,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginTop: 6,
        }}
      >
        <div
          style={{
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: 22,
            color: "#002033",
          }}
        >
          {campus.name}
        </div>
        <span
          style={{
            fontSize: 11.5,
            letterSpacing: ".10em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: campus.color,
          }}
        >
          {campus.programs} programs
        </span>
      </div>
      <div style={{ fontSize: 14, color: "#4C4C4C", lineHeight: 1.45 }}>{campus.tagline}.</div>
      <div
        style={{
          marginTop: 8,
          color: "#005581",
          fontWeight: 600,
          fontSize: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Explore campus <I_Arrow size={14} />
      </div>
    </Link>
  );
}

function CampusesGrid() {
  const isMobile = useIsMobile();
  const [hoverId, setHoverId] = useState<string | null>(null);
  return (
    <section
      style={{ padding: isMobile ? "32px 20px 56px" : "56px 32px 96px", background: "#fff" }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.05fr 1.4fr",
          gap: isMobile ? 32 : 80,
          alignItems: "flex-start",
        }}
      >
        <div style={{ position: isMobile ? "static" : "sticky", top: 116 }}>
          <CaliforniaMap variant="standalone" highlight={hoverId} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 14,
          }}
        >
          {CAMPUSES.map((c) => (
            <CampusCard key={c.id} campus={c} onHoverChange={setHoverId} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CampusesPage() {
  return (
    <Page>
      <CampusesHero />
      <CampusesGrid />
    </Page>
  );
}
