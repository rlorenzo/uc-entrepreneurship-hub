import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCompare } from "@/lib/compare";
import { I_Compare, I_Search } from "@/lib/icons";

function UtilityBar() {
  return (
    <div
      style={{
        background: "#002033",
        color: "#BDE3F6",
        fontSize: 13,
        padding: "8px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <span
          style={{
            color: "#FFB511",
            fontWeight: 600,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            fontSize: 11,
          }}
        >
          UC System
        </span>
        <span style={{ opacity: 0.5 }}>—</span>
        <span>Office of the President · Innovation &amp; Entrepreneurship Initiative</span>
      </div>
      <div style={{ display: "flex", gap: 18 }}>
        <a href="#" style={{ color: "#BDE3F6", textDecoration: "none" }}>
          For partners
        </a>
        <a href="#" style={{ color: "#BDE3F6", textDecoration: "none" }}>
          For faculty
        </a>
        <a href="#" style={{ color: "#BDE3F6", textDecoration: "none" }}>
          UC Newsroom
        </a>
        <a href="#" style={{ color: "#BDE3F6", textDecoration: "none" }}>
          Sign in
        </a>
      </div>
    </div>
  );
}

export function Nav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { ids } = useCompare();

  const links = [
    { to: "/discover", label: "Explore programs", match: "/discover" },
    { to: "/campuses", label: "Campuses", match: "/camp" },
    { to: "/resources", label: "Resources", match: "/resources" },
    { to: "/about", label: "About", match: "/about" },
  ];

  return (
    <>
      <UtilityBar />
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          height: 80,
          padding: "0 32px",
          borderBottom: "1px solid rgba(0,32,51,.10)",
          gap: 32,
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}
        >
          <img
            src={`${import.meta.env.BASE_URL}assets/uc-wordmark-blue.png`}
            style={{ height: 42, display: "block" }}
            alt="University of California"
          />
          <div
            style={{ borderLeft: "1px solid rgba(0,32,51,.18)", paddingLeft: 14, lineHeight: 1.1 }}
          >
            <div
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: 18,
                color: "#002033",
              }}
            >
              Entrepreneurship
            </div>
            <div
              style={{
                fontSize: 11.5,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--accent, #005581)",
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              Hub · All 10 campuses
            </div>
          </div>
        </Link>

        <div style={{ display: "flex", gap: 28, marginLeft: 24 }}>
          {links.map((l) => {
            const active = pathname.startsWith(l.match);
            return (
              <Link
                key={l.to}
                to={l.to}
                style={{
                  color: "#002033",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: 15,
                  padding: "30px 0",
                  borderBottom: active
                    ? "3px solid var(--accent, #1295D8)"
                    : "3px solid transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => navigate("/discover")}
          aria-label="Search"
          style={{
            background: "transparent",
            border: 0,
            color: "#002033",
            cursor: "pointer",
            padding: 8,
            display: "flex",
          }}
        >
          <I_Search size={20} />
        </button>

        {ids.length > 0 && (
          <Link
            to="/compare"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "2px solid #002033",
              color: "#002033",
              padding: "10px 16px",
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <I_Compare size={16} /> Compare ({ids.length})
          </Link>
        )}

        <Link
          to="/discover"
          style={{
            background: "var(--accent, #1295D8)",
            color: "#fff",
            padding: "12px 22px",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          Find a program
        </Link>
      </nav>
    </>
  );
}
