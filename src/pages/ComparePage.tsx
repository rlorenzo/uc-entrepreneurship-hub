import { Link, useNavigate } from "react-router-dom";
import { Page } from "@/components/Page";
import { Eyebrow } from "@/components/Eyebrow";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pill, TypePill, CampusBadge } from "@/components/Pill";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/data/types";
import { useCompare } from "@/lib/compare";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_Arrow, I_Compare, I_Plus, I_X } from "@/lib/icons";

interface Row {
  k: string;
  render: (p: Program) => React.ReactNode;
}

function CohortCell({ size }: { size: number | null }) {
  if (!size) return <em style={{ color: "#7C7E7F" }}>Not disclosed</em>;
  return <>{`${size} ventures`}</>;
}

function IndustriesCell({ industries }: { industries: string[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {industries.map((i) => (
        <Pill key={i}>{i}</Pill>
      ))}
    </div>
  );
}

const COMPARE_ROWS: Row[] = [
  { k: "Campus", render: (p) => <CampusBadge campusId={p.campus} /> },
  { k: "Type", render: (p) => <TypePill typeId={p.type} /> },
  { k: "Stage", render: (p) => p.stage },
  {
    k: "Eligibility",
    render: (p) => (
      <span style={{ fontSize: 13, lineHeight: 1.4 }}>{p.eligibility.join(", ")}</span>
    ),
  },
  { k: "Duration", render: (p) => p.duration },
  { k: "Funding", render: (p) => <strong style={{ color: "#002033" }}>{p.funding}</strong> },
  { k: "Selectivity", render: (p) => p.selectivity },
  { k: "Cohort size", render: (p) => <CohortCell size={p.cohortSize} /> },
  { k: "Deadline", render: (p) => p.deadline },
  { k: "Industries", render: (p) => <IndustriesCell industries={p.industries} /> },
];

function CompareHero({ canClear, onClear }: { canClear: boolean; onClear: () => void }) {
  const isMobile = useIsMobile();
  return (
    <section
      style={{
        padding: isMobile ? "24px 20px 18px" : "48px 32px 28px",
        background: "#F7F5F1",
        borderBottom: "1px solid rgba(0,32,51,.08)",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <Breadcrumbs
          trail={[
            { label: "Home", to: "/" },
            { label: "Explore programs", to: "/discover" },
            { label: "Compare" },
          ]}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Eyebrow>Side-by-side</Eyebrow>
            <h1
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(36px,4vw,52px)",
                lineHeight: 1.1,
                margin: "10px 0 0",
                color: "#002033",
              }}
            >
              Compare programs
            </h1>
            <p style={{ margin: "10px 0 0", color: "#4C4C4C", fontSize: 16, maxWidth: 600 }}>
              Pick up to four programs to compare standardized details.
            </p>
          </div>
          {canClear && (
            <button
              onClick={onClear}
              style={{
                background: "transparent",
                border: "2px solid #002033",
                color: "#002033",
                padding: "10px 18px",
                borderRadius: 4,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function ComparePage() {
  const navigate = useNavigate();
  const { ids, remove, clear } = useCompare();
  const programs = ids
    .map((id) => PROGRAMS.find((p) => p.id === id))
    .filter((p): p is Program => Boolean(p));
  const isMobile = useIsMobile();
  const rows = COMPARE_ROWS;

  return (
    <Page>
      <CompareHero canClear={programs.length > 0} onClear={clear} />
      <section
        style={{
          padding: isMobile ? "24px 20px 56px" : "48px 32px 96px",
          background: "#fff",
        }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          {programs.length === 0 ? (
            <div
              style={{
                padding: "80px 24px",
                textAlign: "center",
                background: "#F7F5F1",
                borderRadius: 8,
              }}
            >
              <I_Compare size={36} />
              <div
                style={{
                  fontFamily: "'Source Serif 4',Georgia,serif",
                  fontWeight: 600,
                  fontSize: 30,
                  marginTop: 14,
                  color: "#002033",
                }}
              >
                No programs to compare yet.
              </div>
              <p style={{ fontSize: 16, color: "#4C4C4C", margin: "12px 0 24px" }}>
                Browse programs and click “Compare” on any card to add it here.
              </p>
              <button
                onClick={() => navigate("/discover")}
                style={{
                  background: "var(--accent, #1295D8)",
                  color: "#fff",
                  border: 0,
                  borderRadius: 4,
                  padding: "14px 22px",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Browse programs
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  minWidth: Math.max(720, 200 + programs.length * 260),
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        position: "sticky",
                        left: 0,
                        background: "#fff",
                        zIndex: 1,
                        padding: "16px 20px 16px 0",
                        textAlign: "left",
                        width: 200,
                        minWidth: 200,
                        verticalAlign: "top",
                      }}
                    />
                    {programs.map((p) => (
                      <th key={p.id} style={{ padding: 0, verticalAlign: "top", minWidth: 240 }}>
                        <div
                          style={{
                            background: "#F7F5F1",
                            borderRadius: 8,
                            padding: "18px 20px",
                            marginRight: 14,
                            marginBottom: 8,
                            position: "relative",
                          }}
                        >
                          <button
                            onClick={() => remove(p.id)}
                            aria-label="Remove"
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              background: "transparent",
                              border: 0,
                              cursor: "pointer",
                              color: "#4C4C4C",
                              padding: 6,
                              display: "flex",
                            }}
                          >
                            <I_X size={16} />
                          </button>
                          <div
                            style={{
                              height: 6,
                              width: 32,
                              background: TYPE_BY_ID[p.type].color,
                              borderRadius: 3,
                              marginBottom: 10,
                            }}
                          />
                          <Link
                            to={`/program/${p.id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <div
                              style={{
                                fontFamily: "'Source Serif 4',Georgia,serif",
                                fontWeight: 600,
                                fontSize: 20,
                                lineHeight: 1.2,
                                color: "#002033",
                                textWrap: "balance",
                              }}
                            >
                              {p.name}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13, color: "#4C4C4C" }}>
                              {CAMPUS_BY_ID[p.campus].name}
                            </div>
                          </Link>
                        </div>
                      </th>
                    ))}
                    {programs.length < 4 && (
                      <th style={{ padding: 0, verticalAlign: "top", minWidth: 240 }}>
                        <button
                          onClick={() => navigate("/discover")}
                          style={{
                            background: "#fff",
                            border: "2px dashed rgba(0,32,51,.20)",
                            borderRadius: 8,
                            padding: "24px 20px",
                            marginRight: 14,
                            marginBottom: 8,
                            width: "calc(100% - 14px)",
                            cursor: "pointer",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            color: "#005581",
                            fontWeight: 600,
                            fontSize: 14,
                            height: "100%",
                            minHeight: 120,
                          }}
                        >
                          <I_Plus size={20} /> Add another
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={row.k} style={{ background: ri % 2 ? "#fff" : "#F7F5F1" }}>
                      <th
                        scope="row"
                        style={{
                          textAlign: "left",
                          padding: "16px 20px 16px 16px",
                          fontSize: 11.5,
                          letterSpacing: ".12em",
                          textTransform: "uppercase",
                          fontWeight: 700,
                          color: "#4C4C4C",
                          verticalAlign: "top",
                          width: 200,
                          minWidth: 200,
                          position: "sticky",
                          left: 0,
                          background: ri % 2 ? "#fff" : "#F7F5F1",
                        }}
                      >
                        {row.k}
                      </th>
                      {programs.map((p) => (
                        <td
                          key={p.id}
                          style={{
                            padding: "16px 20px",
                            verticalAlign: "top",
                            fontSize: 14,
                            lineHeight: 1.45,
                            color: "#002033",
                            minWidth: 240,
                          }}
                        >
                          {row.render(p)}
                        </td>
                      ))}
                      {programs.length < 4 && <td />}
                    </tr>
                  ))}
                  <tr>
                    <th
                      scope="row"
                      style={{ padding: "16px 20px 16px 16px", width: 200, minWidth: 200 }}
                    />
                    {programs.map((p) => (
                      <td key={p.id} style={{ padding: "16px 20px", minWidth: 240 }}>
                        <Link
                          to={`/program/${p.id}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            background: "var(--accent, #1295D8)",
                            color: "#fff",
                            padding: "10px 14px",
                            borderRadius: 4,
                            fontWeight: 600,
                            fontSize: 14,
                            textDecoration: "none",
                          }}
                        >
                          View program <I_Arrow size={14} />
                        </Link>
                      </td>
                    ))}
                    {programs.length < 4 && <td />}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}
