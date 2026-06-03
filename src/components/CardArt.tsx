import type { Program } from "@/data/types.ts";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";
import { programGradient } from "@/lib/programGradient";
import { isValidWebUrl } from "@/lib/url";
import { I_Pin, I_Star } from "@/lib/icons";

const CHIP_BASE = {
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".06em",
  textTransform: "uppercase",
} as const;

function CampusInitials({ initials }: { initials: string }) {
  return (
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
  );
}

function TypeChip({ label, color }: { label?: string; color?: string }) {
  return (
    <span
      style={{
        ...CHIP_BASE,
        background: "rgba(255,255,255,.95)",
        color: color ?? "var(--uc-dark-blue)",
      }}
    >
      {label}
    </span>
  );
}

function FeaturedChip() {
  return (
    <span
      style={{
        ...CHIP_BASE,
        background: "var(--uc-gold)",
        color: "var(--uc-dark-blue)",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <I_Star size={11} /> Featured
    </span>
  );
}

function CardChips({ program }: { program: Program }) {
  const t = TYPE_BY_ID[program.type];
  return (
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
      <TypeChip label={t?.label} color={t?.color} />
      {program.featured && <FeaturedChip />}
    </div>
  );
}

function CampusBadge({ name, onImage = false }: { name?: string; onImage?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 14,
        left: 14,
        color: "var(--uc-white)",
        fontSize: 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        // Over a photo, back the label with a solid navy chip so the white text
        // clears 4.5:1 on any image region (mirrors NewsCard's CampusPill). The
        // gradient art is uniformly dark, so it carries plain white text fine.
        ...(onImage
          ? { padding: "4px 10px", borderRadius: 999, background: "rgba(0,32,51,.82)" }
          : null),
      }}
    >
      <I_Pin size={14} /> {name}
    </div>
  );
}

// When a program page exposed a real hero image, render it over the gradient
// (which stays as the fallback while the image loads or if it 404s). A bottom
// scrim keeps the white campus badge legible over an arbitrary photo.
function CoverImage({ src }: { src: string }) {
  return (
    <>
      {/* Decorative: the program name sits right beside this art on the card.
          No background fill — the gradient on the parent is the genuine fallback
          shown while the photo loads or if it 404s (alt="" yields no broken
          icon, so the gradient simply shows through). */}
      <img
        src={src}
        alt=""
        loading="lazy"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,32,51,0) 42%, rgba(0,32,51,.62) 100%)",
        }}
      />
    </>
  );
}

export function CardArt({ program, height = 168 }: { program: Program; height?: number }) {
  const c = CAMPUS_BY_ID[program.campus];
  const initials = c?.short?.replace("UC ", "").slice(0, 2).toUpperCase() ?? "UC";
  // Defense in depth: data is sanitized at build, but never emit a non-http(s)
  // src at render time either (mirrors NewsCard / ProgramDetail). Resolve the
  // safe URL via a ternary: that narrows the optional imageUrl to a real string
  // for <CoverImage>. (A const alias of the type guard would not narrow the
  // argument, so we can't lean on `isValidWebUrl(...)` alone here.)
  const heroSrc = isValidWebUrl(program.imageUrl) ? program.imageUrl : null;
  return (
    <div
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        background: programGradient(program),
      }}
    >
      {heroSrc ? (
        <CoverImage src={heroSrc} />
      ) : (
        // The oversized campus initials are a feature of the gradient art only;
        // a photo carries its own identity, so we drop the watermark there.
        <CampusInitials initials={initials} />
      )}
      <CardChips program={program} />
      <CampusBadge name={c?.name} onImage={heroSrc !== null} />
    </div>
  );
}
