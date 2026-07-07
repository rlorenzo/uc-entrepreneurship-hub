import { Fragment, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { I_Chevron } from "@/lib/icons";

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ trail }: { trail: Crumb[] }) {
  return (
    <nav
      style={{
        padding: "24px 32px 0",
        maxWidth: 1440,
        margin: "0 auto",
        width: "100%",
        fontSize: 13,
        color: "var(--uc-gray)",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {trail.map((t, i) => (
        <Fragment key={i}>
          {i > 0 && <I_Chevron size={12} />}
          {t.to ? (
            <Link
              to={t.to}
              style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}
            >
              {t.label}
            </Link>
          ) : (
            <span style={{ color: "var(--uc-dark-blue)", fontWeight: 600 }}>{t.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

// Dark-hero variant shared by ProgramDetail and CampusPage: sits inside a
// navy hero, so links render extra-light blue and the current page white.
// Unlike the light Breadcrumbs it does not own page padding — the hero's
// layout does; pass margins via `style`.
export function DarkBreadcrumbs({ trail, style }: { trail: Crumb[]; style?: CSSProperties }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        fontSize: 13,
        color: "var(--uc-blue-xlight)",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        ...style,
      }}
    >
      {trail.map((t, i) => (
        <Fragment key={i}>
          {i > 0 && <I_Chevron size={12} />}
          {t.to ? (
            <Link
              to={t.to}
              style={{ color: "var(--uc-blue-xlight)", textDecoration: "none", fontWeight: 600 }}
            >
              {t.label}
            </Link>
          ) : (
            <span style={{ color: "var(--uc-white)", fontWeight: 600 }}>{t.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
