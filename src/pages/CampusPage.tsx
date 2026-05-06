import { useState, type CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/Page";
import { Eyebrow } from "@/components/Eyebrow";
import { ProgramCard } from "@/components/ProgramCard";
import { CaliforniaMap } from "@/components/CaliforniaMap";
import { CAMPUSES, CAMPUS_BY_ID } from "@/data/campuses";
import { TYPES } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import { I_Chevron, I_External, I_Pin } from "@/lib/icons";

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div>
      <div
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 48,
          lineHeight: 1,
          color: "#FFB511",
        }}
      >
        {n}
      </div>
      <div style={{ marginTop: 8, fontSize: 14, color: "#BDE3F6", maxWidth: 160 }}>{l}</div>
    </div>
  );
}

function tabPill(active: boolean, color: string): CSSProperties {
  return {
    background: active ? color : "#fff",
    color: active ? "#fff" : "#002033",
    border: `1px solid ${active ? color : "rgba(0,32,51,.15)"}`,
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };
}

function ecosystemFor(campusId: string) {
  const lookups: Record<string, { name: string; desc: string }[]> = {
    berkeley: [
      {
        name: "Sutardja Center for Entrepreneurship & Technology",
        desc: "The cross-disciplinary engine behind SkyDeck, the Foundry, and Berkeley’s entrepreneurship curriculum.",
      },
      {
        name: "Berkeley SkyDeck",
        desc: "A top-floor accelerator that has invested in 350+ companies across all 10 UC campuses.",
      },
      {
        name: "Jacobs Institute for Design Innovation",
        desc: "Open-access fabrication and design labs serving every major and skill level.",
      },
      {
        name: "Haas School of Business — Lester Center",
        desc: "Research, courses, and the Big Ideas Contest open to all UC students.",
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
      },
      {
        name: "Rosenman Institute",
        desc: "Health-tech fellowship and innovator pipeline at the QB3 Mission Bay campus.",
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
  return (
    lookups[campusId] ?? [
      { name: "Center for Innovation", desc: "The campus hub for entrepreneurship programming." },
    ]
  );
}

export function CampusPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const c = CAMPUS_BY_ID[id ?? ""] ?? CAMPUSES[0];
  const programs = PROGRAMS.filter((p) => p.campus === c.id);
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? programs : programs.filter((p) => p.type === filter);

  const typeCounts: Record<string, number> = {};
  programs.forEach((p) => {
    typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;
  });

  return (
    <Page>
      <section
        style={{ position: "relative", background: c.color, color: "#fff", overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${c.color} 0%, #002033 100%)`,
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
        <div
          style={{
            position: "relative",
            maxWidth: 1440,
            margin: "0 auto",
            padding: "24px 32px 80px",
          }}
        >
          <div
            style={{
              padding: 0,
              fontSize: 13,
              color: "#BDE3F6",
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <Link to="/" style={{ color: "#BDE3F6", textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>
            <I_Chevron size={12} />
            <Link
              to="/campuses"
              style={{ color: "#BDE3F6", textDecoration: "none", fontWeight: 600 }}
            >
              Campuses
            </Link>
            <I_Chevron size={12} />
            <span style={{ color: "#fff", fontWeight: 600 }}>{c.name}</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 64,
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
                <I_Pin size={14} /> {c.name} · Est. {c.founded}
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
                Entrepreneurship at {c.short}.
              </h1>
              <p
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 400,
                  fontSize: 24,
                  lineHeight: 1.4,
                  marginTop: 22,
                  maxWidth: 680,
                  color: "#BDE3F6",
                }}
              >
                {c.tagline}.
              </p>
              <div style={{ display: "flex", gap: 36, marginTop: 32, flexWrap: "wrap" }}>
                <Stat n={c.programs} l="Active programs" />
                <Stat n={Object.keys(typeCounts).length} l="Program types" />
                <Stat n="$200M+" l="Capital deployed (FY24)" />
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <CaliforniaMap
                variant="hero"
                highlight={c.id}
                onPick={(c2) => navigate(`/campus/${c2.id}`)}
              />
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "72px 32px", background: "#fff" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.4fr",
              gap: 64,
              alignItems: "flex-start",
            }}
          >
            <div>
              <Eyebrow>Ecosystem overview</Eyebrow>
              <h2
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(28px,3.2vw,42px)",
                  lineHeight: 1.1,
                  margin: "12px 0 0",
                  color: "#002033",
                  textWrap: "balance",
                }}
              >
                The major centers driving entrepreneurship at {c.short}
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ecosystemFor(c.id).map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 20,
                    padding: "22px 0",
                    borderTop: i === 0 ? "none" : "1px solid rgba(0,32,51,.10)",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 4,
                      background: c.color,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Source Serif 4',Georgia,serif",
                      fontWeight: 600,
                      fontSize: 18,
                    }}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "'Source Serif 4',Georgia,serif",
                        fontWeight: 600,
                        fontSize: 22,
                        color: "#002033",
                      }}
                    >
                      {e.name}
                    </div>
                    <div style={{ fontSize: 14, color: "#4C4C4C", marginTop: 4, maxWidth: 600 }}>
                      {e.desc}
                    </div>
                  </div>
                  <a
                    href="#"
                    style={{
                      color: "#005581",
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "72px 32px", background: "#F7F5F1" }}>
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
              <Eyebrow>Browse the catalog</Eyebrow>
              <h2
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(28px,3.2vw,42px)",
                  lineHeight: 1.1,
                  margin: "12px 0 0",
                  color: "#002033",
                }}
              >
                {programs.length} programs at {c.short}
              </h2>
            </div>
            <Link
              to={`/discover?campus=${c.id}`}
              style={{
                color: "#005581",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Open in advanced search →
            </Link>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <button onClick={() => setFilter("all")} style={tabPill(filter === "all", c.color)}>
              All ({programs.length})
            </button>
            {TYPES.filter((t) => typeCounts[t.id]).map((t) => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                style={tabPill(filter === t.id, c.color)}
              >
                {t.label} ({typeCounts[t.id]})
              </button>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "40px",
                background: "#fff",
                borderRadius: 8,
                textAlign: "center",
                color: "#4C4C4C",
              }}
            >
              No programs of this type yet at {c.short}.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {filtered.map((p) => (
                <ProgramCard
                  key={p.id}
                  program={p}
                  onOpen={(prog) => navigate(`/program/${prog.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: "72px 32px", background: "#002033", color: "#fff" }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          <div>
            <Eyebrow color="#FFB511">Cross-campus exploration</Eyebrow>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(28px,3.4vw,44px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "#fff",
                textWrap: "balance",
              }}
            >
              Most {c.short} programs accept founders from any UC campus.
            </h2>
            <p
              style={{
                margin: "18px 0 0",
                fontSize: 17,
                lineHeight: 1.55,
                color: "#BDE3F6",
                maxWidth: 520,
              }}
            >
              The system was built for cross-pollination. If you’re a UCSD biotech founder eyeing a
              Berkeley accelerator, you can apply.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {CAMPUSES.filter((x) => x.id !== c.id)
              .slice(0, 8)
              .map((other) => (
                <Link
                  key={other.id}
                  to={`/campus/${other.id}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,.04)",
                    border: "1px solid rgba(255,255,255,.10)",
                    color: "#fff",
                    textDecoration: "none",
                  }}
                >
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: other.color,
                        boxShadow: "0 0 0 2px rgba(255,255,255,.20)",
                      }}
                    />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{other.name}</span>
                  </span>
                  <span style={{ fontSize: 13, color: "#BDE3F6" }}>{other.programs} programs</span>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
