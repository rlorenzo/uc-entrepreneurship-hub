import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CAMPUSES } from "@/data/campuses";
import type { Campus } from "@/data/types.ts";

interface Props {
  variant?: "standalone" | "hero";
  highlight?: string | null;
  onPick?: (c: Campus) => void;
}

const W = 360;
const H = 540;
const NEIGHBOR_THRESHOLD = 80;

const CA_PATH =
  "M120 30 L160 30 L185 50 L195 80 L210 110 L210 145 L235 175 L260 220 L260 260 L280 305 L285 350 L300 395 L310 430 L320 470 L340 510 L335 540 L295 535 L255 520 L225 495 L180 490 L155 475 L130 470 L120 455 L105 425 L95 395 L80 365 L70 335 L70 305 L85 275 L90 240 L100 200 L95 170 L100 140 L105 110 L110 80 Z";

interface CampusEdge {
  a: Campus;
  b: Campus;
}

/** Pre-compute the inter-campus edges short enough to draw on the hero map. */
function neighborEdges(): CampusEdge[] {
  const edges: CampusEdge[] = [];
  for (let i = 0; i < CAMPUSES.length; i++) {
    const a = CAMPUSES[i];
    for (let j = i + 1; j < CAMPUSES.length; j++) {
      const b = CAMPUSES[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) <= NEIGHBOR_THRESHOLD) edges.push({ a, b });
    }
  }
  return edges;
}

const NEIGHBOR_EDGES = neighborEdges();

function NeighborLines() {
  return (
    <>
      {NEIGHBOR_EDGES.map(({ a, b }) => (
        <line
          key={`${a.id}-${b.id}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="rgba(255,181,17,.25)"
          strokeWidth="1"
        />
      ))}
    </>
  );
}

function CampusTooltip({ campus, dark }: { campus: Campus; dark: boolean }) {
  return (
    <g>
      <rect
        x={campus.x + 12}
        y={campus.y - 22}
        rx="3"
        ry="3"
        width={campus.short.length * 7 + 24}
        height="26"
        fill={dark ? "#fff" : "#002033"}
      />
      <text
        x={campus.x + 24}
        y={campus.y - 5}
        fontSize="12"
        fontWeight="700"
        fontFamily="'Source Sans 3',sans-serif"
        fill={dark ? "#002033" : "#fff"}
      >
        {campus.short}
      </text>
    </g>
  );
}

interface MarkerStyle {
  haloFill: string;
  dotFill: string;
  dotStroke: string;
}

const MARKER_STYLES = {
  hero: {
    haloFill: "rgba(255,181,17,.25)",
    dotFill: "#FFB511",
    dotStroke: "#002033",
  },
  standalone: {
    haloFill: "rgba(18,149,216,.20)",
    dotFill: "#1295D8",
    dotStroke: "#fff",
  },
} as const satisfies Record<"hero" | "standalone", MarkerStyle>;

function MarkerHalo({ campus, fill }: { campus: Campus; fill: string }) {
  return <circle cx={campus.x} cy={campus.y} r="14" fill={fill} />;
}

function MarkerDot({
  campus,
  emphasized,
  style,
}: {
  campus: Campus;
  emphasized: boolean;
  style: MarkerStyle;
}) {
  return (
    <circle
      cx={campus.x}
      cy={campus.y}
      r={emphasized ? 8 : 6}
      fill={style.dotFill}
      stroke={style.dotStroke}
      strokeWidth="2"
    />
  );
}

interface CampusMarkerProps {
  campus: Campus;
  dark: boolean;
  active: boolean;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
  onPick: (campus: Campus) => void;
}

function CampusMarker({ campus, dark, active, hovered, onHoverChange, onPick }: CampusMarkerProps) {
  const emphasized = hovered || active;
  const style = dark ? MARKER_STYLES.hero : MARKER_STYLES.standalone;
  return (
    <g
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHoverChange(campus.id)}
      onMouseLeave={() => onHoverChange(null)}
      onClick={() => onPick(campus)}
    >
      {emphasized && <MarkerHalo campus={campus} fill={style.haloFill} />}
      <MarkerDot campus={campus} emphasized={emphasized} style={style} />
      {hovered && <CampusTooltip campus={campus} dark={dark} />}
    </g>
  );
}

function HeroLegend() {
  return (
    <g transform={`translate(20, ${H + 8})`}>
      <circle cx="6" cy="14" r="5" fill="#FFB511" stroke="#002033" strokeWidth="2" />
      <text
        x="20"
        y="18"
        fontSize="11"
        fontFamily="'Source Sans 3',sans-serif"
        fill="#BDE3F6"
        fontWeight="600"
      >
        10 UC campuses
      </text>
    </g>
  );
}

interface MapTheme {
  fillTop: string;
  fillBottom: string;
  outline: string;
}

const MAP_THEMES = {
  hero: {
    fillTop: "rgba(18,149,216,.18)",
    fillBottom: "rgba(0,85,129,.35)",
    outline: "rgba(189,227,246,.45)",
  },
  standalone: {
    fillTop: "#F7F5F1",
    fillBottom: "#EDE7DD",
    outline: "rgba(0,32,51,.25)",
  },
} as const satisfies Record<"hero" | "standalone", MapTheme>;

function MapBackdrop({ theme }: { theme: MapTheme }) {
  return (
    <>
      <defs>
        <linearGradient id="caFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.fillTop} />
          <stop offset="1" stopColor={theme.fillBottom} />
        </linearGradient>
      </defs>
      <path d={CA_PATH} fill="url(#caFill)" stroke={theme.outline} strokeWidth="1.5" />
    </>
  );
}

export function CaliforniaMap({ variant = "standalone", highlight = null, onPick }: Props) {
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const dark = variant === "hero";
  const theme = dark ? MAP_THEMES.hero : MAP_THEMES.standalone;
  const handlePick = (c: Campus) => (onPick ? onPick(c) : navigate(`/campus/${c.id}`));
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "2/3",
        maxWidth: 420,
        margin: "0 auto",
      }}
    >
      <svg viewBox={`0 0 ${W} ${H + 40}`} width="100%" height="100%" style={{ display: "block" }}>
        <MapBackdrop theme={theme} />
        {dark && <NeighborLines />}
        {CAMPUSES.map((c) => (
          <CampusMarker
            key={c.id}
            campus={c}
            dark={dark}
            active={highlight === c.id}
            hovered={hover === c.id}
            onHoverChange={setHover}
            onPick={handlePick}
          />
        ))}
        {dark && <HeroLegend />}
      </svg>
    </div>
  );
}
