import type { Program } from "@/data/types";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";
import { programGradient } from "@/lib/programGradient";
import { I_Pin, I_Star } from "@/lib/icons";

export function CardArt({ program, height = 168 }: { program: Program; height?: number }) {
  const c = CAMPUS_BY_ID[program.campus];
  const t = TYPE_BY_ID[program.type];
  const initials = c?.short?.replace("UC ", "").slice(0, 2).toUpperCase() ?? "UC";

  return (
    <div
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        background: programGradient(program),
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -20,
          bottom: -50,
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 200,
          lineHeight: 1,
          color: "rgba(255,255,255,.15)",
          letterSpacing: "-.02em",
        }}
      >
        {initials}
      </div>
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <span
          style={{
            background: "rgba(255,255,255,.95)",
            color: t?.color ?? "#002033",
            padding: "4px 10px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          {t?.label}
        </span>
        {program.featured && (
          <span
            style={{
              background: "#FFB511",
              color: "#002033",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <I_Star size={11} /> Featured
          </span>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 14,
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <I_Pin size={14} /> {c?.name}
      </div>
    </div>
  );
}
