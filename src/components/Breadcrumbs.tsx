import { Fragment } from "react";
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
        color: "#4C4C4C",
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
            <Link to={t.to} style={{ color: "#005581", textDecoration: "none", fontWeight: 600 }}>
              {t.label}
            </Link>
          ) : (
            <span style={{ color: "#002033", fontWeight: 600 }}>{t.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
