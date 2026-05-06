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

export function Pill({ children, color = "#005581", bg, onClick, style }: PillProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 600,
        padding: "4px 10px",
        borderRadius: 999,
        border: bg ? "1px solid transparent" : `1px solid ${color}33`,
        color: bg ? "#fff" : color,
        background: bg ?? `${color}14`,
        letterSpacing: ".02em",
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </span>
  );
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
