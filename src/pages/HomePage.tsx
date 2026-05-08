import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Page } from "@/components/Page";
import { Eyebrow } from "@/components/Eyebrow";
import { ProgramCard } from "@/components/ProgramCard";
import { CaliforniaMap } from "@/components/CaliforniaMap";
import { CAMPUSES, CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import { NEWS } from "@/data/news.generated";
import { formatNewsDate } from "@/lib/dates";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_Arrow, I_Search } from "@/lib/icons";

interface SearchOpts {
  q?: string;
  filter?: Record<string, string>;
}

function Hero({ onSearch }: { onSearch: (opts: SearchOpts) => void }) {
  const [q, setQ] = useState("");
  const isMobile = useIsMobile();
  const chips: { label: string; filter: Record<string, string> }[] = [
    { label: "Accelerators", filter: { type: "accelerator" } },
    { label: "Funding & grants", filter: { type: "funding" } },
    { label: "Open to undergrads", filter: { eligibility: "Undergrad" } },
    { label: "Climate", filter: { industry: "Climate" } },
    { label: "Biotech", filter: { industry: "Biotech" } },
    { label: "AI / ML", filter: { industry: "AI / ML" } },
  ];

  return (
    <section
      style={{ position: "relative", background: "#002033", color: "#fff", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(60% 80% at 80% 30%, rgba(18,149,216,.45), transparent 60%), radial-gradient(40% 60% at 15% 90%, rgba(255,181,17,.18), transparent 70%), #002033",
        }}
      />
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0, opacity: 0.08 }}
        aria-hidden="true"
      >
        <defs>
          <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0v48" fill="none" stroke="#fff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div
        style={{
          position: "relative",
          maxWidth: 1440,
          margin: "0 auto",
          padding: isMobile ? "56px 20px 48px" : "88px 32px 72px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr",
          gap: isMobile ? 32 : 64,
          alignItems: "center",
          minHeight: isMobile ? 0 : 560,
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 14px",
              borderRadius: 999,
              background: "rgba(255,181,17,.14)",
              color: "#FFB511",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "#FFB511" }} /> 1
            platform · 10 campuses · 140+ programs
          </div>
          <h1
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontWeight: 600,
              fontSize: "clamp(44px,5.6vw,76px)",
              lineHeight: 1.04,
              letterSpacing: "-0.015em",
              margin: 0,
              textWrap: "balance",
            }}
          >
            Every UC entrepreneurship program, in one place.
          </h1>
          <p
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontWeight: 400,
              fontSize: 22,
              lineHeight: 1.45,
              marginTop: 22,
              maxWidth: 620,
              color: "#BDE3F6",
            }}
          >
            Incubators, accelerators, courses, funding, competitions, and maker spaces — across all
            ten UC campuses. Discover, compare, and apply from one front door.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch({ q });
            }}
            style={{
              marginTop: 28,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 12px 32px rgba(0,0,0,.18)",
              padding: 8,
              display: "flex",
              gap: 8,
              maxWidth: 680,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 16px",
                color: "#005581",
              }}
            >
              <I_Search size={20} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search programs, industries, campuses…"
              aria-label="Search programs, industries, campuses"
              type="search"
              style={{
                flex: 1,
                border: 0,
                outline: "none",
                fontSize: 17,
                fontFamily: "'Source Sans 3',sans-serif",
                color: "#002033",
                padding: "14px 0",
                background: "transparent",
              }}
            />
            <button
              type="submit"
              style={{
                background: "var(--accent, #1295D8)",
                color: "#fff",
                border: 0,
                borderRadius: 6,
                padding: "12px 22px",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Search <I_Arrow size={16} />
            </button>
          </form>

          <div style={{ marginTop: 18, display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 680 }}>
            <span style={{ fontSize: 13, color: "#BDE3F6", alignSelf: "center", marginRight: 4 }}>
              Try:
            </span>
            {chips.map((c) => (
              <button
                key={c.label}
                onClick={() => onSearch({ filter: c.filter })}
                style={{
                  background: "rgba(255,255,255,.08)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,.18)",
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <CaliforniaMap variant="hero" />
      </div>
    </section>
  );
}

function FeaturedStrip({ onOpen }: { onOpen: (id: string) => void }) {
  const featured = PROGRAMS.filter((p) => p.featured);
  const isMobile = useIsMobile();
  return (
    <section
      style={{ padding: isMobile ? "56px 20px 32px" : "96px 32px 48px", background: "#fff" }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: isMobile ? 24 : 32,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 720 }}>
            <Eyebrow>Spotlight programs</Eyebrow>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(32px,3.6vw,48px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "#002033",
                textWrap: "balance",
              }}
            >
              Flagship programs across the system
            </h2>
            <p
              style={{
                margin: "14px 0 0",
                fontSize: 18,
                lineHeight: 1.5,
                color: "#4C4C4C",
                maxWidth: 640,
              }}
            >
              Hand-picked accelerators, funds, and incubators with active cohorts. Each has
              standardized info so you can compare apples to apples.
            </p>
          </div>
          <Link
            to="/discover"
            style={{
              color: "#005581",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            See all 140+ programs →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 16 : 24,
          }}
        >
          {featured.map((p) => (
            <ProgramCard key={p.id} program={p} onOpen={(prog) => onOpen(prog.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryGrid({ onPick }: { onPick: (filter: Record<string, string>) => void }) {
  const isMobile = useIsMobile();
  const items = [
    {
      type: "accelerator",
      label: "Accelerators",
      desc: "Cohort-based programs with mentorship and capital.",
      count: 18,
    },
    {
      type: "incubator",
      label: "Incubators",
      desc: "Long-term homes for early-stage ventures.",
      count: 26,
    },
    {
      type: "funding",
      label: "Funding",
      desc: "Grants, prizes, and proof-of-concept funds.",
      count: 31,
    },
    {
      type: "competition",
      label: "Competitions",
      desc: "Pitch contests and venture challenges.",
      count: 22,
    },
    {
      type: "certificate",
      label: "Certificates",
      desc: "Year-long structured entrepreneurship certificate programs.",
      count: 6,
    },
    {
      type: "maker",
      label: "Maker spaces",
      desc: "Open-access prototyping, fab, and wet labs.",
      count: 14,
    },
  ];

  return (
    <section style={{ background: "#F7F5F1", padding: isMobile ? "48px 20px" : "80px 32px" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: isMobile ? 24 : 32,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Eyebrow>Browse by program type</Eyebrow>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(28px,3vw,40px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "#002033",
              }}
            >
              Find what fits where you are
            </h2>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 12 : 16,
          }}
        >
          {items.map((it) => {
            const t = TYPE_BY_ID[it.type];
            return (
              <button
                key={it.type}
                onClick={() => onPick({ type: it.type })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,32,51,.12)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.transform = "";
                }}
                style={{
                  textAlign: "left",
                  background: "#fff",
                  border: "1px solid rgba(0,32,51,.10)",
                  borderRadius: 8,
                  padding: "24px 24px 22px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  transition: "box-shadow .25s, transform .25s",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 6,
                      height: 32,
                      background: t.color,
                      borderRadius: 3,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 32,
                      fontFamily: "'Source Serif 4',Georgia,serif",
                      fontWeight: 600,
                      color: "#002033",
                      lineHeight: 1,
                    }}
                  >
                    {it.count}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Source Serif 4',Georgia,serif",
                    fontWeight: 600,
                    fontSize: 24,
                    color: "#002033",
                    marginTop: 8,
                  }}
                >
                  {it.label}
                </div>
                <div style={{ fontSize: 15, color: "#4C4C4C", lineHeight: 1.45 }}>{it.desc}</div>
                <div
                  style={{
                    marginTop: 10,
                    color: "#005581",
                    fontSize: 14,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Browse {it.label.toLowerCase()} <I_Arrow size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface CampusButtonProps {
  campus: (typeof CAMPUSES)[number];
  active: boolean;
  onHover: (id: string | null) => void;
  onPick: (id: string) => void;
}

function CampusButton({ campus, active, onHover, onPick }: CampusButtonProps) {
  return (
    <button
      onMouseEnter={() => onHover(campus.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onPick(campus.id)}
      style={{
        textAlign: "left",
        background: active ? "#F7F5F1" : "transparent",
        border: 0,
        padding: "10px 12px",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: campus.color }} />
      <span style={{ fontWeight: 600, fontSize: 15, color: "#002033" }}>{campus.name}</span>
      <span style={{ marginLeft: "auto", fontSize: 12, color: "#5B5D5E" }}>
        {campus.programs} programs
      </span>
    </button>
  );
}

function MapSectionLeft({
  active,
  setActive,
  onPick,
}: {
  active: string | null;
  setActive: (id: string | null) => void;
  onPick: (id: string) => void;
}) {
  const isMobile = useIsMobile();
  return (
    <div>
      <Eyebrow>The UC system</Eyebrow>
      <h2
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: "clamp(36px,4vw,56px)",
          lineHeight: 1.08,
          margin: "12px 0 0",
          color: "#002033",
          textWrap: "balance",
        }}
      >
        One mission. Ten campuses. <span style={{ color: "#005581" }}>Hundreds of paths.</span>
      </h2>
      <p
        style={{
          margin: "18px 0 0",
          fontSize: 18,
          lineHeight: 1.55,
          color: "#4C4C4C",
          maxWidth: 520,
        }}
      >
        From SkyDeck in the Bay to Beall in Orange County, every campus brings its own ecosystem.
        Hover the map to peek inside, or click to explore a campus in depth.
      </p>
      <div
        style={{
          marginTop: isMobile ? 24 : 32,
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: 8,
          maxWidth: 520,
        }}
      >
        {CAMPUSES.map((c) => (
          <CampusButton
            key={c.id}
            campus={c}
            active={active === c.id}
            onHover={setActive}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}

function MapSection() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);
  const isMobile = useIsMobile();
  return (
    <section style={{ padding: isMobile ? "56px 20px" : "96px 32px", background: "#fff" }}>
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1.05fr",
          gap: isMobile ? 32 : 80,
          alignItems: "center",
        }}
      >
        <MapSectionLeft
          active={active}
          setActive={setActive}
          onPick={(id) => navigate(`/campus/${id}`)}
        />
        <div>
          <CaliforniaMap variant="standalone" highlight={active} />
        </div>
      </div>
    </section>
  );
}

function SpotlightStories() {
  const isMobile = useIsMobile();
  const stories = NEWS.slice(0, 3);
  if (stories.length === 0) return null;
  return (
    <section
      style={{
        padding: isMobile ? "56px 20px" : "96px 32px",
        background: "#002033",
        color: "#fff",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginBottom: 40,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Eyebrow color="#FFB511">Latest news</Eyebrow>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(32px,3.6vw,48px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "#fff",
              }}
            >
              What’s shipping out of UC
            </h2>
          </div>
          <Link
            to="/news"
            style={{
              color: "#FFB511",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Browse latest news →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 16 : 24,
          }}
        >
          {stories.map((n) => {
            const c = CAMPUS_BY_ID[n.campus];
            const date = formatNewsDate(n.publishedAt);
            return (
              <a
                key={n.id}
                href={n.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    aspectRatio: "16/10",
                    background: n.imageUrl
                      ? `#001520 center/cover no-repeat url("${n.imageUrl}")`
                      : "linear-gradient(135deg,#1295D8,#005581)",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      left: 14,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "rgba(0,0,0,.55)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} />{" "}
                    {c?.name ?? n.campus}
                  </div>
                </div>
                <div style={{ padding: "22px 24px 26px" }}>
                  <div
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      letterSpacing: ".12em",
                      textTransform: "uppercase",
                      color: "#FFB511",
                      marginBottom: 10,
                    }}
                  >
                    {date}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Source Serif 4',Georgia,serif",
                      fontWeight: 600,
                      fontSize: 24,
                      lineHeight: 1.22,
                      color: "#fff",
                      margin: "0 0 12px",
                      textWrap: "pretty",
                    }}
                  >
                    {n.title}
                  </h3>
                  {n.sourceHost ? (
                    <div style={{ fontSize: 13, color: "#BDE3F6" }}>{n.sourceHost} ↗</div>
                  ) : null}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AudienceBand() {
  const items = [
    {
      eyebrow: "For students",
      title: "You’ve got an idea. Find your next step.",
      cta: "Browse programs",
      body: "Filter by what’s open right now, what fits your stage, and what doesn’t conflict with your courseload.",
      go: "/discover",
    },
    {
      eyebrow: "For faculty",
      title: "Move your research from lab to market.",
      cta: "See faculty resources",
      body: "Proof-of-concept funds, IP support, and accelerators built around translational science.",
      go: "/discover?eligibility=Faculty",
    },
    {
      eyebrow: "For partners",
      title: "Mentor, sponsor, or invest across UC.",
      cta: "Partner with UC",
      body: "A single front door for the system’s 140+ programs — no more campus-by-campus outreach.",
      go: "/discover",
    },
  ];

  const isMobile = useIsMobile();
  return (
    <section
      style={{
        padding: isMobile ? "48px 20px" : "80px 32px",
        background: "#FFB511",
        color: "#002033",
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 28 : 32,
        }}
      >
        {items.map((a) => (
          <div key={a.eyebrow} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              {a.eyebrow}
            </div>
            <h3
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: 30,
                lineHeight: 1.15,
                margin: 0,
                textWrap: "balance",
              }}
            >
              {a.title}
            </h3>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, maxWidth: 380 }}>{a.body}</p>
            <Link
              to={a.go}
              style={{
                marginTop: "auto",
                color: "#002033",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 12,
              }}
            >
              {a.cta} <I_Arrow size={16} />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  return (
    <Page>
      <Hero
        onSearch={(opts) => {
          const params = new URLSearchParams();
          if (opts.q) params.set("q", opts.q);
          if (opts.filter) {
            for (const [k, v] of Object.entries(opts.filter)) params.set(k, v);
          }
          const qs = params.toString();
          navigate(qs ? `/discover?${qs}` : "/discover");
        }}
      />
      <FeaturedStrip onOpen={(id) => navigate(`/program/${id}`)} />
      <CategoryGrid
        onPick={(filter) => {
          const params = new URLSearchParams(filter);
          navigate(`/discover?${params.toString()}`);
        }}
      />
      <MapSection />
      <SpotlightStories />
      <AudienceBand />
    </Page>
  );
}
