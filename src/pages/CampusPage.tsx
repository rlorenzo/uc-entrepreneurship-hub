import { useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/Page";
import { DarkBreadcrumbs } from "@/components/Breadcrumbs";
import { NotFound } from "@/components/NotFound";
import { ProgramCard } from "@/components/ProgramCard";
import { CaliforniaMap } from "@/components/CaliforniaMap";
import { NewsCard } from "@/components/NewsCard";
import { CAMPUSES, CAMPUS_BY_ID } from "@/data/campuses";
import { TYPES } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import { NEWS } from "@/data/news.generated";
import type { EcosystemCenter, Program } from "@/data/types.ts";
import type { NewsItem } from "@/data/news";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_External, I_Pin } from "@/lib/icons";

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 48,
          lineHeight: 1,
          color: "var(--uc-gold)",
        }}
      >
        {n}
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: "var(--uc-blue-xlight)", maxWidth: 160 }}>
        {l}
      </div>
    </div>
  );
}

function tabPill(active: boolean, color: string): CSSProperties {
  return {
    background: active ? color : "var(--uc-white)",
    color: active ? "var(--uc-white)" : "var(--uc-dark-blue)",
    border: `1px solid ${active ? color : "rgba(0,32,51,.15)"}`,
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}

// ── hero ──────────────────────────────────────────────────────────────

function HeroBreadcrumbs({ campusName }: { campusName: string }) {
  const isMobile = useIsMobile();
  return (
    <DarkBreadcrumbs
      trail={[
        { label: "Home", to: "/" },
        { label: "Campuses", to: "/campuses" },
        { label: campusName },
      ]}
      style={{ marginBottom: isMobile ? 24 : 32 }}
    />
  );
}

function CampusHero({
  campus,
  programTypeCount,
}: {
  campus: (typeof CAMPUSES)[number];
  programTypeCount: number;
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  return (
    <section
      style={{
        position: "relative",
        background: campus.color,
        color: "var(--uc-white)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${campus.color} 0%, #002033 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1,
          backgroundImage: "radial-gradient(rgba(255,255,255,.4) 1.5px, transparent 1.5px)",
          backgroundSize: "18px 18px",
        }}
      />
      {/* Legibility scrim: keep the hero text AA-contrast over the lighter
          campus colors (e.g. UCLA, Irvine). Darkens behind the left text
          column and fades to clear over the map on the right. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(90deg, rgba(0,32,51,.6) 0%, rgba(0,32,51,.3) 45%, rgba(0,32,51,0) 75%)",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 1440,
          margin: "0 auto",
          padding: isMobile ? "20px 20px 48px" : "24px 32px 80px",
        }}
      >
        <HeroBreadcrumbs campusName={campus.name} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.5fr 1fr",
            gap: isMobile ? 24 : 64,
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,.12)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              <I_Pin size={14} /> {campus.name} · Est. {campus.founded}
            </div>
            <h1
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(48px,5.6vw,80px)",
                lineHeight: 1.02,
                letterSpacing: "-0.015em",
                margin: 0,
                textWrap: "balance",
              }}
            >
              Entrepreneurship at {campus.short}.
            </h1>
            <p
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 400,
                fontSize: 24,
                lineHeight: 1.4,
                marginTop: 22,
                maxWidth: 680,
                color: "var(--uc-blue-xlight)",
              }}
            >
              {campus.tagline}.
            </p>
            <div style={{ display: "flex", gap: 36, marginTop: 32, flexWrap: "wrap" }}>
              <Stat n={campus.programs} l="Active programs" />
              <Stat
                n={programTypeCount}
                l={programTypeCount === 1 ? "Program type" : "Program types"}
              />
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <CaliforniaMap
              variant="hero"
              highlight={campus.id}
              onPick={(c2) => navigate(`/campus/${c2.id}`)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── ecosystem ─────────────────────────────────────────────────────────

function EcosystemRow({
  index,
  entry,
  campusColor,
}: {
  index: number;
  entry: EcosystemCenter;
  campusColor: string;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr auto",
        gap: 20,
        padding: "22px 0",
        borderTop: index === 0 ? "none" : "1px solid rgba(0,32,51,.10)",
        alignItems: "center",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 10,
          height: 10,
          borderRadius: 999,
          background: campusColor,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: 22,
            color: "var(--uc-dark-blue)",
          }}
        >
          {entry.name}
        </div>
        <div style={{ fontSize: 14, color: "var(--uc-gray)", marginTop: 4, maxWidth: 600 }}>
          {entry.desc}
        </div>
      </div>
      {entry.url ? (
        <a
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--accent)",
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          Visit <I_External size={14} />
        </a>
      ) : (
        <span style={{ width: 14 }} />
      )}
    </div>
  );
}

function CampusEcosystem({ campus }: { campus: (typeof CAMPUSES)[number] }) {
  const isMobile = useIsMobile();
  // Ecosystem entries are curated data on the campus record; a campus without
  // any simply has no section (never a fake placeholder center).
  if (campus.ecosystem.length === 0) return null;
  return (
    <section
      style={{ padding: isMobile ? "40px 20px" : "72px 32px", background: "var(--uc-white)" }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1.4fr",
            gap: isMobile ? 24 : 64,
            alignItems: "flex-start",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(28px,3.2vw,42px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "var(--uc-dark-blue)",
                textWrap: "balance",
              }}
            >
              The major centers driving entrepreneurship at {campus.short}
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {campus.ecosystem.map((e, i) => (
              <EcosystemRow key={e.name} index={i} entry={e} campusColor={campus.color} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── programs section ──────────────────────────────────────────────────

interface CampusProgramsProps {
  campus: (typeof CAMPUSES)[number];
  programs: Program[];
  typeCounts: Record<string, number>;
}

function ProgramsHeader({
  campus,
  programCount,
}: {
  campus: (typeof CAMPUSES)[number];
  programCount: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 24,
        flexWrap: "wrap",
        gap: 24,
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: "clamp(28px,3.2vw,42px)",
            lineHeight: 1.1,
            margin: "12px 0 0",
            color: "var(--uc-dark-blue)",
          }}
        >
          {programCount} programs at {campus.short}
        </h2>
      </div>
      <Link
        to={`/discover?campus=${campus.id}`}
        style={{
          color: "var(--accent)",
          fontWeight: 600,
          fontSize: 15,
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Open in advanced search →
      </Link>
    </div>
  );
}

function ProgramFilterTabs({
  campus,
  programs,
  typeCounts,
  filter,
  onChange,
}: {
  campus: (typeof CAMPUSES)[number];
  programs: Program[];
  typeCounts: Record<string, number>;
  filter: string;
  onChange: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
      <button onClick={() => onChange("all")} style={tabPill(filter === "all", campus.color)}>
        All ({programs.length})
      </button>
      {TYPES.filter((t) => typeCounts[t.id]).map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={tabPill(filter === t.id, campus.color)}
        >
          {t.label} ({typeCounts[t.id]})
        </button>
      ))}
    </div>
  );
}

function ProgramsResults({
  filtered,
  campus,
}: {
  filtered: Program[];
  campus: (typeof CAMPUSES)[number];
}) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  if (filtered.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          background: "var(--uc-white)",
          borderRadius: 8,
          textAlign: "center",
          color: "var(--uc-gray)",
        }}
      >
        No programs of this type yet at {campus.short}.
      </div>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 14 : 24,
      }}
    >
      {filtered.map((p) => (
        <ProgramCard key={p.id} program={p} onOpen={(prog) => navigate(`/program/${prog.id}`)} />
      ))}
    </div>
  );
}

function CampusPrograms({ campus, programs, typeCounts }: CampusProgramsProps) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? programs : programs.filter((p) => p.type === filter);
  const isMobile = useIsMobile();
  return (
    <section style={{ padding: isMobile ? "40px 20px" : "72px 32px", background: "var(--bg-2)" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <ProgramsHeader campus={campus} programCount={programs.length} />
        <ProgramFilterTabs
          campus={campus}
          programs={programs}
          typeCounts={typeCounts}
          filter={filter}
          onChange={setFilter}
        />
        <ProgramsResults filtered={filtered} campus={campus} />
      </div>
    </section>
  );
}

// ── latest news ───────────────────────────────────────────────────────

function CampusNews({ campus, items }: { campus: (typeof CAMPUSES)[number]; items: NewsItem[] }) {
  const isMobile = useIsMobile();
  if (items.length === 0) return null;
  return (
    <section
      style={{ padding: isMobile ? "40px 20px" : "72px 32px", background: "var(--uc-white)" }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(28px,3.2vw,42px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "var(--uc-dark-blue)",
              }}
            >
              What’s coming out of {campus.short}
            </h2>
          </div>
          <Link
            to="/news"
            style={{
              color: "var(--accent)",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            All UC news →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
            gap: isMobile ? 16 : 24,
          }}
        >
          {items.map((item) => (
            <NewsCard key={item.id} item={item} hideCampusName />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── cross-campus links ────────────────────────────────────────────────

function CrossCampusCard({ campus }: { campus: (typeof CAMPUSES)[number] }) {
  return (
    <Link
      to={`/campus/${campus.id}`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 6,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.10)",
        color: "var(--uc-white)",
        textDecoration: "none",
      }}
    >
      <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: campus.color,
            boxShadow: "0 0 0 2px rgba(255,255,255,.20)",
          }}
        />
        <span style={{ fontWeight: 600, fontSize: 15 }}>{campus.name}</span>
      </span>
      <span style={{ fontSize: 13, color: "var(--uc-blue-xlight)" }}>
        {campus.programs} programs
      </span>
    </Link>
  );
}

function CampusCrossLinks({ campus }: { campus: (typeof CAMPUSES)[number] }) {
  const isMobile = useIsMobile();
  const others = CAMPUSES.filter((x) => x.id !== campus.id).slice(0, 8);
  return (
    <section
      style={{
        padding: isMobile ? "40px 20px" : "72px 32px",
        background: "var(--uc-dark-blue)",
        color: "var(--uc-white)",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr",
          gap: isMobile ? 24 : 64,
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontWeight: 600,
              fontSize: "clamp(28px,3.4vw,44px)",
              lineHeight: 1.1,
              margin: "12px 0 0",
              color: "var(--uc-white)",
              textWrap: "balance",
            }}
          >
            Most {campus.short} programs accept founders from any UC campus.
          </h2>
          <p
            style={{
              margin: "18px 0 0",
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--uc-blue-xlight)",
              maxWidth: 520,
            }}
          >
            The system was built for cross-pollination. If you’re a UCSD biotech founder eyeing a
            Berkeley accelerator, you can apply.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: 12,
          }}
        >
          {others.map((other) => (
            <CrossCampusCard key={other.id} campus={other} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── page entry ────────────────────────────────────────────────────────

function buildTypeCounts(programs: Program[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of programs) counts[p.type] = (counts[p.type] ?? 0) + 1;
  return counts;
}

export function CampusPage() {
  const { id } = useParams<{ id: string }>();
  const campus = id ? CAMPUS_BY_ID[id] : undefined;
  if (!campus) {
    return (
      <NotFound
        eyebrow="Campus not found"
        title="No UC campus by that name"
        body={
          <>
            {id ? `“${id}” isn’t one of the ten UC campuses.` : "That link is missing a campus."}{" "}
            Explore all ten to find the one you’re after.
          </>
        }
        ctaLabel="Explore all campuses"
        ctaTo="/campuses"
      />
    );
  }
  const programs = PROGRAMS.filter((p) => p.campus === campus.id);
  const typeCounts = buildTypeCounts(programs);
  const news = NEWS.filter((n) => n.campus === campus.id).slice(0, 6);
  return (
    <Page>
      <CampusHero campus={campus} programTypeCount={Object.keys(typeCounts).length} />
      <CampusEcosystem campus={campus} />
      {/* Keyed by campus so the type-filter state resets when navigating
          between campuses (the /campus/:id route re-renders in place). */}
      <CampusPrograms key={campus.id} campus={campus} programs={programs} typeCounts={typeCounts} />
      <CampusNews campus={campus} items={news} />
      <CampusCrossLinks campus={campus} />
    </Page>
  );
}
