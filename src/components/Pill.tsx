import type { CSSProperties, ReactNode } from "react";
import { TYPE_BY_ID } from "@/data/types-list";
import { CAMPUS_BY_ID } from "@/data/campuses";

interface PillProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

function pillStyle(color: string, bg: string | undefined, style: CSSProperties | undefined) {
  const solid = bg !== undefined;
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 999,
    border: solid ? "1px solid transparent" : `1px solid ${color}33`,
    color: solid ? "#fff" : color,
    background: bg ?? `${color}14`,
    letterSpacing: ".02em",
    whiteSpace: "nowrap",
    ...style,
  } as CSSProperties;
}

export function Pill({ children, color = "#005581", bg, onClick, style }: PillProps) {
  const css = pillStyle(color, bg, style);
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ ...css, cursor: "pointer", font: "inherit" }}
      >
        {children}
      </button>
    );
  }
  return <span style={css}>{children}</span>;
}

export function TypePill({ typeId }: { typeId: string }) {
  const t = TYPE_BY_ID[typeId];
  if (!t) return null;
  return <Pill color={t.color}>{t.label}</Pill>;
}

export function CampusBadge({ campusId, dark = false }: { campusId: string; dark?: boolean }) {
  const c = CAMPUS_BY_ID[campusId];
  if (!c) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        color: dark ? "#BDE3F6" : "#4C4C4C",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: c.color,
          display: "inline-block",
        }}
      />
      {c.name}
    </span>
  );
}
