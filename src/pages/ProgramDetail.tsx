import type { ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Page } from "@/components/Page";
import { Eyebrow } from "@/components/Eyebrow";
import { ProgramCard } from "@/components/ProgramCard";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import { useCompare } from "@/lib/compare";
import { programGradient } from "@/lib/programGradient";
import {
  I_Calendar,
  I_Check,
  I_Chevron,
  I_Clock,
  I_External,
  I_Money,
  I_Pin,
  I_Plus,
  I_Star,
  I_Trophy,
  I_Users,
} from "@/lib/icons";

function DetailBlock({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1.15,
          margin: "10px 0 4px",
          color: "#002033",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { has, add, remove } = useCompare();

  const program = PROGRAMS.find((p) => p.id === id || p.slug === id) ?? PROGRAMS[0];
  const inCompare = has(program.id);
  const c = CAMPUS_BY_ID[program.campus];
  const t = TYPE_BY_ID[program.type];
  const applyHref = program.applicationLink || program.website || program.sourceUrl || "#";
  const isExternal = applyHref !== "#";

  const related = PROGRAMS.filter(
    (p) =>
      p.id !== program.id &&
      (p.industries.some((i) => program.industries.includes(i)) || p.type === program.type),
  ).slice(0, 3);

  return (
    <Page>
      <section
        style={{ background: "#002033", color: "#fff", position: "relative", overflow: "hidden" }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: programGradient(program),
            opacity: 0.55,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(0,32,51,.4) 0%, rgba(0,32,51,.85) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            maxWidth: 1440,
            margin: "0 auto",
            padding: "24px 32px 56px",
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
              flexWrap: "wrap",
              marginBottom: 32,
            }}
          >
            <Link to="/" style={{ color: "#BDE3F6", textDecoration: "none", fontWeight: 600 }}>
              Home
            </Link>
            <I_Chevron size={12} />
            <Link
              to="/discover"
              style={{ color: "#BDE3F6", textDecoration: "none", fontWeight: 600 }}
            >
              Programs
            </Link>
            <I_Chevron size={12} />
            <Link
              to={`/campus/${c.id}`}
              style={{ color: "#BDE3F6", textDecoration: "none", fontWeight: 600 }}
            >
              {c.name}
            </Link>
            <I_Chevron size={12} />
            <span style={{ color: "#fff", fontWeight: 600 }}>{program.name}</span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 48,
              alignItems: "flex-end",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    background: "#fff",
                    color: t.color,
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                  }}
                >
                  {t.label}
                </span>
                {program.featured && (
                  <span
                    style={{
                      background: "#FFB511",
                      color: "#002033",
                      padding: "5px 12px",
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 700,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <I_Star size={12} /> Featured
                  </span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#BDE3F6",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <I_Pin size={14} /> {c.name}
                </span>
              </div>
              <h1
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 600,
                  fontSize: "clamp(40px,4.6vw,64px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.01em",
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                {program.name}
              </h1>
              <p
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 400,
                  fontSize: 22,
                  lineHeight: 1.45,
                  marginTop: 20,
                  maxWidth: 760,
                  color: "#BDE3F6",
                }}
              >
                {program.desc}
              </p>
              <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
                <a
                  href={applyHref}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  onClick={isExternal ? undefined : (e) => e.preventDefault()}
                  style={{
                    background: "#FFB511",
                    color: "#002033",
                    padding: "14px 24px",
                    borderRadius: 4,
                    fontWeight: 700,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {program.applicationLink ? "Start application" : `Visit on ${c.short}.edu`}{" "}
                  <I_External size={15} />
                </a>
                <button
                  onClick={() => (inCompare ? remove(program.id) : add(program.id))}
                  style={{
                    background: "transparent",
                    color: "#fff",
                    padding: "13px 22px",
                    borderRadius: 4,
                    fontWeight: 600,
                    border: "2px solid #fff",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {inCompare ? (
                    <>
                      <I_Check size={16} /> Added to compare
                    </>
                  ) : (
                    <>
                      <I_Plus size={16} /> Add to compare
                    </>
                  )}
                </button>
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.18)",
                borderRadius: 8,
                padding: "24px 26px",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#FFB511",
                  marginBottom: 18,
                }}
              >
                At a glance
              </div>
              {[
                {
                  icon: <I_Calendar size={16} />,
                  k: "Application deadline",
                  v: program.deadline as ReactNode,
                },
                { icon: <I_Money size={16} />, k: "Funding", v: program.funding as ReactNode },
                { icon: <I_Clock size={16} />, k: "Duration", v: program.duration as ReactNode },
                {
                  icon: <I_Users size={16} />,
                  k: "Cohort size",
                  v: program.cohortSize ? (
                    `${program.cohortSize} ventures`
                  ) : (
                    <em style={{ color: "#7C7E7F", fontStyle: "normal" }}>Not disclosed</em>
                  ),
                },
                {
                  icon: <I_Trophy size={16} />,
                  k: "Selectivity",
                  v: program.selectivity as ReactNode,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,.10)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: "#BDE3F6",
                    }}
                  >
                    {s.icon} {s.k}
                  </span>
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "right" }}
                  >
                    {s.v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "72px 32px", background: "#fff" }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.5fr) 360px",
            gap: 64,
          }}
        >
          <div>
            <Eyebrow>Overview</Eyebrow>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: 36,
                lineHeight: 1.15,
                margin: "12px 0 18px",
                color: "#002033",
                textWrap: "balance",
              }}
            >
              What this program is, in one paragraph
            </h2>
            <p
              style={{
                fontSize: 18,
                lineHeight: 1.6,
                color: "#002033",
                marginTop: 0,
                maxWidth: 720,
              }}
            >
              {program.longDescription ?? program.desc}
            </p>

            <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 40 }}>
              <DetailBlock title="Key details" eyebrow="What you get">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 16,
                    marginTop: 10,
                  }}
                >
                  {[
                    { k: "Stage", v: program.stage },
                    { k: "Eligibility", v: program.eligibility.join(", ") },
                    { k: "Duration", v: program.duration },
                    { k: "Funding", v: program.funding },
                    { k: "Selectivity", v: program.selectivity },
                    {
                      k: "Cohort size",
                      v: program.cohortSize ? `${program.cohortSize} ventures` : "Not disclosed",
                    },
                  ].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "14px 16px",
                        background: "#F7F5F1",
                        borderRadius: 6,
                        borderLeft: `3px solid ${t.color}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11.5,
                          letterSpacing: ".12em",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: "#4C4C4C",
                        }}
                      >
                        {d.k}
                      </div>
                      <div
                        style={{ fontSize: 16, fontWeight: 600, color: "#002033", marginTop: 4 }}
                      >
                        {d.v}
                      </div>
                    </div>
                  ))}
                </div>
              </DetailBlock>

              <DetailBlock title="Who should apply" eyebrow="Fit">
                <ul
                  style={{
                    paddingLeft: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {[
                    `Founders working on ${program.industries.slice(0, 2).join(" or ")} ventures.`,
                    `Teams at the ${program.stage.toLowerCase()} stage with at least one ${c.name} affiliate.`,
                    "Committed to running the program full-time during cohort weeks.",
                    "Comfortable sharing progress with peer cohort and mentors.",
                  ].map((b, i) => (
                    <li
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        fontSize: 16,
                        lineHeight: 1.5,
                        color: "#002033",
                      }}
                    >
                      <span
                        style={{
                          flexShrink: 0,
                          marginTop: 6,
                          width: 6,
                          height: 6,
                          borderRadius: 999,
                          background: t.color,
                        }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </DetailBlock>

              <DetailBlock title="Timeline" eyebrow="When">
                <ol
                  style={{
                    paddingLeft: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    marginTop: 10,
                  }}
                >
                  {[
                    {
                      d: "Now → Deadline",
                      label: "Applications open",
                      body: "Submit your team, traction snapshot, and a 2-minute video.",
                    },
                    {
                      d: program.deadline,
                      label: "Deadline",
                      body: "Final cutoff. We start reviewing immediately.",
                    },
                    {
                      d: "+2 weeks",
                      label: "Interviews",
                      body: "Selected teams meet with the partner team and program leads.",
                    },
                    {
                      d: "+4 weeks",
                      label: "Cohort kickoff",
                      body: "Onboarding, intros, mentor pairing, and goal-setting.",
                    },
                  ].map((it, i, arr) => (
                    <li
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "170px 1fr",
                        gap: 24,
                        padding: "18px 0",
                        borderBottom: i < arr.length - 1 ? "1px solid rgba(0,32,51,.10)" : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#005581",
                          letterSpacing: ".04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {it.d}
                      </div>
                      <div>
                        <div
                          style={{
                            fontFamily: "'Source Serif 4',Georgia,serif",
                            fontWeight: 600,
                            fontSize: 20,
                            color: "#002033",
                            marginBottom: 4,
                          }}
                        >
                          {it.label}
                        </div>
                        <div style={{ fontSize: 15, color: "#4C4C4C", lineHeight: 1.5 }}>
                          {it.body}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </DetailBlock>

              <DetailBlock title="Industries we love" eyebrow="Focus areas">
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {program.industries.map((i) => (
                    <span
                      key={i}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        background: "#fff",
                        border: `1px solid ${t.color}33`,
                        color: t.color,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </DetailBlock>
            </div>
          </div>

          <aside style={{ position: "sticky", top: 120, alignSelf: "flex-start" }}>
            <div style={{ background: "#F7F5F1", borderRadius: 8, padding: "24px 24px 22px" }}>
              <Eyebrow>Apply</Eyebrow>
              <h3
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 600,
                  fontSize: 24,
                  margin: "10px 0 6px",
                  color: "#002033",
                }}
              >
                Ready to apply?
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.45, color: "#4C4C4C", marginTop: 0 }}>
                Applications go directly to the program team at {c.name}. Deadline:{" "}
                <strong>{program.deadline}</strong>.
              </p>
              <a
                href={applyHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                onClick={isExternal ? undefined : (e) => e.preventDefault()}
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "var(--accent, #1295D8)",
                  color: "#fff",
                  padding: "14px 18px",
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  marginTop: 16,
                }}
              >
                {program.applicationLink ? "Start application" : "Visit program page"}{" "}
                <I_External size={14} />
              </a>
              {program.website && program.website !== applyHref && (
                <a
                  href={program.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textAlign: "center",
                    background: "transparent",
                    border: "2px solid #002033",
                    color: "#002033",
                    padding: "12px 18px",
                    borderRadius: 4,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                    marginTop: 10,
                  }}
                >
                  Visit program homepage
                </a>
              )}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "20px 22px",
                border: "1px solid rgba(0,32,51,.10)",
                borderRadius: 8,
              }}
            >
              <Eyebrow>Run by</Eyebrow>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    background: c.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontFamily: "'Source Serif 4',Georgia,serif",
                    fontWeight: 600,
                    fontSize: 18,
                    letterSpacing: "-.02em",
                  }}
                >
                  {c.short.replace("UC ", "").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Source Serif 4',Georgia,serif",
                      fontWeight: 600,
                      fontSize: 18,
                      color: "#002033",
                    }}
                  >
                    {c.name}
                  </div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/campus/${c.id}`);
                    }}
                    style={{
                      fontSize: 13,
                      color: "#005581",
                      fontWeight: 600,
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                  >
                    See all {c.programs} programs at {c.short} →
                  </a>
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "20px 22px",
                background: "#FFB511",
                color: "#002033",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Heads up
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
                Some details are pulled from the program’s site and may be incomplete. Always verify
                on the source page before applying.
              </p>
              {(program.sourceUrl || program.lastUpdated) && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(0,32,51,.18)",
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {program.sourceUrl && (
                    <a
                      href={program.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#002033",
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                        fontWeight: 600,
                      }}
                    >
                      View source page
                    </a>
                  )}
                  {program.lastUpdated && (
                    <div style={{ marginTop: 4, opacity: 0.8 }}>
                      Refreshed {new Date(program.lastUpdated).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section style={{ padding: "72px 32px", background: "#F7F5F1" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: 32,
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div>
              <Eyebrow>Cross-campus suggestions</Eyebrow>
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
                Programs with similar fit across UC
              </h2>
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
              Explore all programs →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {related.map((p) => (
              <ProgramCard
                key={p.id}
                program={p}
                onOpen={(prog) => navigate(`/program/${prog.id}`)}
              />
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
