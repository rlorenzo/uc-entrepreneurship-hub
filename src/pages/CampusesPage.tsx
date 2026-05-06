import { Link } from "react-router-dom";
import { Page } from "@/components/Page";
import { Eyebrow } from "@/components/Eyebrow";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CaliforniaMap } from "@/components/CaliforniaMap";
import { CAMPUSES } from "@/data/campuses";
import { I_Arrow } from "@/lib/icons";

export function CampusesPage() {
  return (
    <Page>
      <section
        style={{
          padding: "48px 32px 24px",
          background: "#F7F5F1",
          borderBottom: "1px solid rgba(0,32,51,.08)",
        }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Campuses" }]} />
          <Eyebrow>10 campuses, one system</Eyebrow>
          <h1
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontWeight: 600,
              fontSize: "clamp(40px,4.4vw,60px)",
              lineHeight: 1.05,
              margin: "12px 0 16px",
              color: "#002033",
            }}
          >
            Pick a campus.
          </h1>
          <p style={{ fontSize: 18, maxWidth: 680, color: "#4C4C4C", lineHeight: 1.5, margin: 0 }}>
            Each campus has its own ecosystem of centers, accelerators, and funds. Most are open to
            founders from any UC campus.
          </p>
        </div>
      </section>

      <section style={{ padding: "56px 32px 96px", background: "#fff" }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.05fr 1.4fr",
            gap: 80,
            alignItems: "flex-start",
          }}
        >
          <CaliforniaMap variant="standalone" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {CAMPUSES.map((c) => (
              <Link
                key={c.id}
                to={`/campus/${c.id}`}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,32,51,.10)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "";
                  e.currentTarget.style.transform = "";
                }}
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
                    background: c.color,
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
                    {c.name}
                  </div>
                  <span
                    style={{
                      fontSize: 11.5,
                      letterSpacing: ".10em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      color: c.color,
                    }}
                  >
                    {c.programs} programs
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "#4C4C4C", lineHeight: 1.45 }}>{c.tagline}.</div>
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
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
