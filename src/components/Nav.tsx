import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCompare } from "@/lib/compare";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_Compare, I_Menu, I_Search, I_X } from "@/lib/icons";

interface NavLink {
  to: string;
  label: string;
  match: string;
}

const NAV_LINKS: NavLink[] = [
  { to: "/discover", label: "Explore programs", match: "/discover" },
  { to: "/campuses", label: "Campuses", match: "/camp" },
  { to: "/compare", label: "Compare", match: "/compare" },
];

const UTILITY_LINKS = [
  { href: "#/discover", label: "For partners" },
  { href: "#/discover?eligibility=Faculty", label: "For faculty" },
  { href: "https://www.universityofcalifornia.edu/news", label: "UC Newsroom" },
];

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
        {UTILITY_LINKS.map((u) => (
          <a key={u.label} href={u.href} style={{ color: "#BDE3F6", textDecoration: "none" }}>
            {u.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none" }}>
      <img
        src={`${import.meta.env.BASE_URL}assets/uc-wordmark-blue.png`}
        style={{ height: 42, display: "block" }}
        alt="University of California"
      />
      <div style={{ borderLeft: "1px solid rgba(0,32,51,.18)", paddingLeft: 14, lineHeight: 1.1 }}>
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
          Hub
        </div>
      </div>
    </Link>
  );
}

function DesktopLinks({ pathname }: { pathname: string }) {
  return (
    <div style={{ display: "flex", gap: 28, marginLeft: 24 }}>
      {NAV_LINKS.map((l) => {
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
              borderBottom: active ? "3px solid var(--accent, #1295D8)" : "3px solid transparent",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </div>
  );
}

function CompareChip() {
  const { ids } = useCompare();
  if (ids.length === 0) return null;
  return (
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
  );
}

function FindCTA() {
  return (
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
  );
}

function SearchButton() {
  const navigate = useNavigate();
  return (
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
  );
}

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
}

function MobileDrawer({ open, onClose, pathname }: MobileDrawerProps) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,32,51,.55)",
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          marginLeft: "auto",
          width: "min(320px, 86%)",
          height: "100%",
          padding: "20px 22px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          boxShadow: "-12px 0 32px rgba(0,32,51,.20)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: "transparent",
              border: 0,
              cursor: "pointer",
              color: "#002033",
              padding: 6,
              display: "flex",
            }}
          >
            <I_X size={22} />
          </button>
        </div>
        {NAV_LINKS.map((l) => {
          const active = pathname.startsWith(l.match);
          return (
            <Link
              key={l.to}
              to={l.to}
              onClick={onClose}
              style={{
                color: active ? "var(--accent, #1295D8)" : "#002033",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 18,
                padding: "12px 0",
                borderBottom: "1px solid rgba(0,32,51,.08)",
              }}
            >
              {l.label}
            </Link>
          );
        })}
        <Link
          to="/discover"
          onClick={onClose}
          style={{
            marginTop: 18,
            background: "var(--accent, #1295D8)",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          Find a program
        </Link>
        <div
          style={{
            marginTop: 22,
            paddingTop: 16,
            borderTop: "1px solid rgba(0,32,51,.10)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {UTILITY_LINKS.map((u) => (
            <a
              key={u.label}
              href={u.href}
              onClick={onClose}
              style={{
                color: "#4C4C4C",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {u.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  // Close drawer on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          height: 64,
          padding: "0 16px",
          borderBottom: "1px solid rgba(0,32,51,.10)",
          gap: 12,
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Brand />
        <div style={{ flex: 1 }} />
        <CompareChip />
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          style={{
            background: "transparent",
            border: 0,
            color: "#002033",
            cursor: "pointer",
            padding: 8,
            display: "flex",
          }}
        >
          <I_Menu size={26} />
        </button>
      </nav>
      <MobileDrawer open={open} onClose={() => setOpen(false)} pathname={pathname} />
    </>
  );
}

function DesktopNav({ pathname }: { pathname: string }) {
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
        <Brand />
        <DesktopLinks pathname={pathname} />
        <div style={{ flex: 1 }} />
        <SearchButton />
        <CompareChip />
        <FindCTA />
      </nav>
    </>
  );
}

export function Nav() {
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  return isMobile ? <MobileNav pathname={pathname} /> : <DesktopNav pathname={pathname} />;
}
