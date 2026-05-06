import { useState } from "react";
import type { Program } from "@/data/types";
import { CardArt } from "./CardArt";
import { Pill } from "./Pill";
import { useCompare } from "@/lib/compare";
import { I_Calendar, I_Check, I_Plus, I_Users } from "@/lib/icons";

interface Props {
  program: Program;
  onOpen: (p: Program) => void;
  compact?: boolean;
}

export function ProgramCard({ program, onOpen, compact = false }: Props) {
  const [hover, setHover] = useState(false);
  const { has, add, remove } = useCompare();
  const inCompare = has(program.id);

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "#fff",
        border: "1px solid rgba(0,32,51,.10)",
        borderRadius: 8,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: hover ? "0 12px 28px rgba(0,32,51,.12)" : "0 1px 2px rgba(0,32,51,.05)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow .25s var(--ease-standard), transform .25s var(--ease-standard)",
      }}
    >
      <div onClick={() => onOpen(program)} style={{ cursor: "pointer" }}>
        <CardArt program={program} height={compact ? 140 : 168} />
      </div>
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
          onClick={() => onOpen(program)}
          style={{
            margin: 0,
            cursor: "pointer",
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: compact ? 20 : 22,
            lineHeight: 1.2,
            color: "#002033",
            textWrap: "pretty",
          }}
        >
          {program.name}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.5,
            color: "#4C4C4C",
            display: "-webkit-box",
            WebkitLineClamp: compact ? 2 : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {program.desc}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
          {program.industries.slice(0, 3).map((i) => (
            <Pill key={i}>{i}</Pill>
          ))}
          {program.industries.length > 3 && (
            <Pill style={{ opacity: 0.6 }}>+{program.industries.length - 3}</Pill>
          )}
        </div>
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
          <div
            style={{ fontSize: 12, color: "#4C4C4C", display: "flex", gap: 12, flexWrap: "wrap" }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <I_Calendar size={13} /> {program.deadline}
            </span>
            {program.cohortSize && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <I_Users size={13} /> {program.cohortSize}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (inCompare) remove(program.id);
              else add(program.id);
            }}
            title={inCompare ? "Remove from compare" : "Add to compare"}
            style={{
              border: `1px solid ${inCompare ? "#005581" : "rgba(0,32,51,.15)"}`,
              background: inCompare ? "#005581" : "#fff",
              color: inCompare ? "#fff" : "#002033",
              borderRadius: 4,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
          >
            {inCompare ? (
              <>
                <I_Check size={13} /> Comparing
              </>
            ) : (
              <>
                <I_Plus size={13} /> Compare
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
