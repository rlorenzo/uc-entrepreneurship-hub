import { useState } from "react";
import type { Program } from "@/data/types.ts";
import { CardArt } from "./CardArt";
import { Pill } from "./Pill";
import { useCompare } from "@/lib/compare";
import { I_Calendar, I_Check, I_Plus, I_Users } from "@/lib/icons";

interface Props {
  program: Program;
  onOpen: (p: Program) => void;
  compact?: boolean;
}

function CardIndustries({ industries }: { industries: string[] }) {
  const visible = industries.slice(0, 3);
  const overflow = industries.length - visible.length;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
      {visible.map((i) => (
        <Pill key={i}>{i}</Pill>
      ))}
      {overflow > 0 && <Pill>+{overflow}</Pill>}
    </div>
  );
}

function CardMeta({ program }: { program: Program }) {
  return (
    <div
      style={{ fontSize: 12, color: "var(--uc-gray)", display: "flex", gap: 12, flexWrap: "wrap" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        <I_Calendar size={13} /> {program.deadline}
      </span>
      {program.cohortSize !== null && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <I_Users size={13} /> {program.cohortSize}
        </span>
      )}
    </div>
  );
}

function compareToggleStyle(inCompare: boolean) {
  return {
    border: `1px solid ${inCompare ? "var(--accent)" : "rgba(0,32,51,.15)"}`,
    background: inCompare ? "var(--accent)" : "var(--uc-white)",
    color: inCompare ? "var(--uc-white)" : "var(--uc-dark-blue)",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    cursor: "pointer",
  } as const;
}

function CompareToggleLabel({ inCompare }: { inCompare: boolean }) {
  if (inCompare) {
    return (
      <>
        <I_Check size={13} /> Comparing
      </>
    );
  }
  return (
    <>
      <I_Plus size={13} /> Compare
    </>
  );
}

function CompareToggle({ programId }: { programId: string }) {
  const { has, add, remove } = useCompare();
  const inCompare = has(programId);
  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (inCompare) remove(programId);
    else add(programId);
  };
  return (
    <button
      onClick={toggle}
      title={inCompare ? "Remove from compare" : "Add to compare"}
      style={compareToggleStyle(inCompare)}
    >
      <CompareToggleLabel inCompare={inCompare} />
    </button>
  );
}

function articleStyle(hover: boolean) {
  return {
    background: "var(--uc-white)",
    border: "1px solid rgba(0,32,51,.10)",
    borderRadius: 8,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: hover ? "0 12px 28px rgba(0,32,51,.12)" : "0 1px 2px rgba(0,32,51,.05)",
    transform: hover ? "translateY(-2px)" : "translateY(0)",
    transition: "box-shadow .25s var(--ease-standard), transform .25s var(--ease-standard)",
  } as const;
}

const titleButtonStyle = {
  background: "transparent",
  border: 0,
  padding: 0,
  font: "inherit",
  color: "inherit",
  textAlign: "left",
  cursor: "pointer",
} as const;

function CardBody({
  program,
  compact,
  onOpen,
}: {
  program: Program;
  compact: boolean;
  onOpen: () => void;
}) {
  return (
    <div
      style={{
        padding: compact ? "16px 18px 18px" : "20px 22px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: compact ? 20 : 22,
          lineHeight: 1.2,
          color: "var(--uc-dark-blue)",
          textWrap: "pretty",
        }}
      >
        <button type="button" onClick={onOpen} style={titleButtonStyle}>
          {program.name}
        </button>
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: "var(--uc-gray)",
          display: "-webkit-box",
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {program.desc}
      </p>
      <CardIndustries industries={program.industries} />
      <div
        style={{
          marginTop: "auto",
          paddingTop: 14,
          borderTop: "1px solid rgba(0,32,51,.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <CardMeta program={program} />
        <CompareToggle programId={program.id} />
      </div>
    </div>
  );
}

const artButtonStyle = {
  background: "transparent",
  border: 0,
  padding: 0,
  cursor: "pointer",
  display: "block",
  width: "100%",
} as const;

export function ProgramCard({ program, onOpen, compact = false }: Props) {
  const [hover, setHover] = useState(false);
  const open = () => onOpen(program);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={articleStyle(hover)}
    >
      <button
        type="button"
        onClick={open}
        aria-label={`Open ${program.name}`}
        style={artButtonStyle}
      >
        <CardArt program={program} height={compact ? 140 : 168} />
      </button>
      <CardBody program={program} compact={compact} onOpen={open} />
    </article>
  );
}
