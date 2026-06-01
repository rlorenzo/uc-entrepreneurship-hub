import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CAMPUSES } from "@/data/campuses";
import type { Campus } from "@/data/types.ts";

interface Props {
  variant?: "standalone" | "hero";
  highlight?: string | null;
  onPick?: (c: Campus) => void;
}

// Equirectangular projection with longitude scaled by cos(LAT_REF) so
// California reads correctly at mid-state latitudes. Lon is negative west.
const LAT_REF = 37.0;
const LAT_TOP = 42.0;
const LAT_BOTTOM = 32.4;
const LON_LEFT = -124.55;
const LON_RIGHT = -114.0;
const COS_REF = Math.cos((LAT_REF * Math.PI) / 180);

const PADDING = 16;
const MAP_HEIGHT = 508;
const SCALE_LAT = MAP_HEIGHT / (LAT_TOP - LAT_BOTTOM);
const SCALE_LON = SCALE_LAT * COS_REF;
const W = Math.round((LON_RIGHT - LON_LEFT) * SCALE_LON + 2 * PADDING);
const H = MAP_HEIGHT + 2 * PADDING;
const LEGEND_H = 40;

function project(lat: number, lon: number): { x: number; y: number } {
  return {
    x: PADDING + (lon - LON_LEFT) * SCALE_LON,
    y: PADDING + (LAT_TOP - lat) * SCALE_LAT,
  };
}

// Coast (NW→SE), south border (W→E), Colorado River + NV diagonal (S→N),
// then top edge back to NW. Vertices are real lat/lon so the silhouette
// reads as California; the projection above turns them into screen space.
const CA_OUTLINE: Array<[number, number]> = [
  [42.0, -124.21], // NW corner at OR
  [41.75, -124.2],
  [41.05, -124.15],
  [40.8, -124.16],
  [40.45, -124.4], // Cape Mendocino — westernmost point
  [40.0, -124.07],
  [39.55, -123.77],
  [38.95, -123.74], // Point Arena
  [38.32, -123.05],
  [38.04, -122.99], // Point Reyes
  [37.81, -122.49], // Golden Gate
  [37.46, -122.43], // Half Moon Bay
  [37.18, -122.39],
  [36.95, -122.04], // Santa Cruz
  [36.85, -121.81], // Moss Landing (east side of Monterey Bay)
  [36.6, -121.9], // Monterey
  [36.31, -121.9],
  [36.0, -121.55], // Big Sur
  [35.66, -121.28],
  [35.36, -120.85], // Morro Bay
  [35.13, -120.65],
  [34.9, -120.66],
  [34.45, -120.47], // Point Conception
  [34.42, -119.85], // Santa Barbara
  [34.27, -119.3], // Ventura
  [34.1, -119.1],
  [34.03, -118.7], // Malibu
  [34.01, -118.49], // Santa Monica
  [33.74, -118.4], // Palos Verdes
  [33.77, -118.19], // Long Beach
  [33.62, -117.93], // Newport
  [33.47, -117.71],
  [33.2, -117.39], // Oceanside
  [32.85, -117.27], // La Jolla
  [32.67, -117.24], // Point Loma
  [32.53, -117.13], // Tijuana (border at Pacific)
  [32.55, -116.62], // Tecate
  [32.69, -115.5], // Calexico
  [32.72, -114.71], // Algodones / Yuma corner
  [33.41, -114.53], // up the Colorado River
  [33.62, -114.57], // Blythe
  [34.2, -114.13], // Parker
  [34.45, -114.13], // Lake Havasu City
  [34.71, -114.49], // Topock
  [34.99, -114.63], // border bend (river meets NV diagonal)
  [38.99, -120.0], // Lake Tahoe (NV/CA tripoint)
  [42.0, -120.0], // NE corner at OR
];

const CA_PATH =
  CA_OUTLINE.map(([lat, lon], i) => {
    const { x, y } = project(lat, lon);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ") + " Z";

interface PlacedCampus {
  campus: Campus;
  x: number;
  y: number;
}

const PLACED: PlacedCampus[] = CAMPUSES.map((c) => ({
  campus: c,
  ...project(c.lat, c.lon),
}));

// Short edges read clearly as straight; long edges get a "flight path"
// arc that bulges toward smaller y (visually "north"). Quadratic Bezier
// control point sits perpendicular to the chord at its midpoint, offset
// by a fraction of the over-threshold length.
const STRAIGHT_THRESHOLD = 90;
const ARC_CURVATURE = 0.18;

interface CampusEdge {
  a: PlacedCampus;
  b: PlacedCampus;
  /** Bezier control point (== midpoint when the edge is short → linear). */
  cx: number;
  cy: number;
  pathD: string;
}

function buildEdge(a: PlacedCampus, b: PlacedCampus): CampusEdge {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  let cx = (a.x + b.x) / 2;
  let cy = (a.y + b.y) / 2;
  let pathD = `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  if (len > STRAIGHT_THRESHOLD) {
    let perpX = -dy / len;
    let perpY = dx / len;
    if (perpY > 0) {
      perpX = -perpX;
      perpY = -perpY;
    }
    const offset = (len - STRAIGHT_THRESHOLD) * ARC_CURVATURE;
    cx += perpX * offset;
    cy += perpY * offset;
    pathD = `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  return { a, b, cx, cy, pathD };
}

function allEdges(): CampusEdge[] {
  const edges: CampusEdge[] = [];
  for (let i = 0; i < PLACED.length; i++) {
    for (let j = i + 1; j < PLACED.length; j++) {
      edges.push(buildEdge(PLACED[i], PLACED[j]));
    }
  }
  return edges;
}

const NETWORK_EDGES = allEdges();

function bezierAt(e: CampusEdge, t: number): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * e.a.x + 2 * u * t * e.cx + t * t * e.b.x,
    y: u * u * e.a.y + 2 * u * t * e.cy + t * t * e.b.y,
  };
}

function NetworkLines() {
  return (
    <>
      {NETWORK_EDGES.map((e) => (
        <path
          key={`${e.a.campus.id}-${e.b.campus.id}`}
          d={e.pathD}
          stroke="rgba(255,181,17,.18)"
          strokeWidth="1"
          fill="none"
        />
      ))}
    </>
  );
}

const PULSE_COUNT = 5;
const PULSE_DURATION_MIN = 1800;
const PULSE_DURATION_MAX = 3600;

interface PulseState {
  edgeIndex: number;
  /** Flip travel direction so endpoints aren't biased by edge-list ordering. */
  reverse: boolean;
  startTs: number;
  duration: number;
}

function randomPulse(now: number): PulseState {
  return {
    edgeIndex: Math.floor(Math.random() * NETWORK_EDGES.length),
    reverse: Math.random() < 0.5,
    startTs: now,
    duration: PULSE_DURATION_MIN + Math.random() * (PULSE_DURATION_MAX - PULSE_DURATION_MIN),
  };
}

// Light points travel along random edges. Drawn imperatively (rAF +
// setAttribute) so we don't pay React reconciliation on every frame.
// Honors prefers-reduced-motion: leaves the network static if the user
// has asked to dial down animation.
function PulseLayer() {
  const groupRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const SVG_NS = "http://www.w3.org/2000/svg";
    const now0 = performance.now();
    const pulses: PulseState[] = Array.from({ length: PULSE_COUNT }, () => {
      const p = randomPulse(now0);
      // stagger initial start times so pulses don't all fire at once
      p.startTs = now0 - Math.random() * p.duration;
      return p;
    });

    const cores: SVGCircleElement[] = [];
    const halos: SVGCircleElement[] = [];
    pulses.forEach(() => {
      const halo = document.createElementNS(SVG_NS, "circle") as SVGCircleElement;
      halo.setAttribute("r", "5");
      halo.setAttribute("fill", "#FFE6A8");
      halo.setAttribute("opacity", "0");
      const core = document.createElementNS(SVG_NS, "circle") as SVGCircleElement;
      core.setAttribute("r", "2");
      core.setAttribute("fill", "#FFFBEA");
      core.setAttribute("opacity", "0");
      group.appendChild(halo);
      group.appendChild(core);
      halos.push(halo);
      cores.push(core);
    });

    let raf = 0;
    const tick = () => {
      const now = performance.now();
      pulses.forEach((p, i) => {
        let t = (now - p.startTs) / p.duration;
        if (t >= 1) {
          Object.assign(p, randomPulse(now));
          t = 0;
        }
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const param = p.reverse ? 1 - eased : eased;
        const pos = bezierAt(NETWORK_EDGES[p.edgeIndex], param);
        const alpha = Math.sin(Math.PI * t);
        const x = pos.x.toFixed(1);
        const y = pos.y.toFixed(1);
        halos[i].setAttribute("cx", x);
        halos[i].setAttribute("cy", y);
        halos[i].setAttribute("opacity", (alpha * 0.55).toFixed(3));
        cores[i].setAttribute("cx", x);
        cores[i].setAttribute("cy", y);
        cores[i].setAttribute("opacity", alpha.toFixed(3));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      halos.forEach((c) => c.remove());
      cores.forEach((c) => c.remove());
    };
  }, []);

  return <g ref={groupRef} />;
}

function CampusTooltip({ placed, dark }: { placed: PlacedCampus; dark: boolean }) {
  const { campus, x, y } = placed;
  return (
    <g>
      <rect
        x={x + 12}
        y={y - 22}
        rx="3"
        ry="3"
        width={campus.short.length * 7 + 24}
        height="26"
        fill={dark ? "#fff" : "#002033"}
      />
      <text
        x={x + 24}
        y={y - 5}
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

function MarkerHalo({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <circle cx={x} cy={y} r="14" fill={fill} />;
}

function MarkerDot({
  x,
  y,
  emphasized,
  style,
}: {
  x: number;
  y: number;
  emphasized: boolean;
  style: MarkerStyle;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={emphasized ? 8 : 6}
      fill={style.dotFill}
      stroke={style.dotStroke}
      strokeWidth="2"
    />
  );
}

interface CampusMarkerProps {
  placed: PlacedCampus;
  dark: boolean;
  active: boolean;
  hovered: boolean;
  onHoverChange: (id: string | null) => void;
  onPick: (campus: Campus) => void;
}

function CampusMarker({ placed, dark, active, hovered, onHoverChange, onPick }: CampusMarkerProps) {
  const { campus, x, y } = placed;
  const emphasized = hovered || active;
  const style = dark ? MARKER_STYLES.hero : MARKER_STYLES.standalone;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${campus.name}, ${campus.programs} programs`}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => onHoverChange(campus.id)}
      onMouseLeave={() => onHoverChange(null)}
      onFocus={() => onHoverChange(campus.id)}
      onBlur={() => onHoverChange(null)}
      onClick={() => onPick(campus)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick(campus);
        }
      }}
    >
      {emphasized && <MarkerHalo x={x} y={y} fill={style.haloFill} />}
      <MarkerDot x={x} y={y} emphasized={emphasized} style={style} />
      {hovered && <CampusTooltip placed={placed} dark={dark} />}
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

function MapBackdrop({ theme, fillId }: { theme: MapTheme; fillId: string }) {
  return (
    <>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.fillTop} />
          <stop offset="1" stopColor={theme.fillBottom} />
        </linearGradient>
      </defs>
      <path
        d={CA_PATH}
        fill={`url(#${fillId})`}
        stroke={theme.outline}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </>
  );
}

export function CaliforniaMap({ variant = "standalone", highlight = null, onPick }: Props) {
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const dark = variant === "hero";
  const theme = dark ? MAP_THEMES.hero : MAP_THEMES.standalone;
  const handlePick = (c: Campus) => (onPick ? onPick(c) : navigate(`/campus/${c.id}`));
  // useId() ensures the gradient def has a page-unique id so multiple
  // CaliforniaMap instances on the same page don't collide.
  const reactId = useId();
  const fillId = `caFill-${reactId.replace(/:/g, "")}`;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${W}/${H + LEGEND_H}`,
        maxWidth: 460,
        margin: "0 auto",
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H + LEGEND_H}`}
        width="100%"
        height="100%"
        style={{ display: "block" }}
        role="group"
        aria-label="Map of the ten UC campuses"
      >
        <MapBackdrop theme={theme} fillId={fillId} />
        {dark && <NetworkLines />}
        {dark && <PulseLayer />}
        {PLACED.map((p) => (
          <CampusMarker
            key={p.campus.id}
            placed={p}
            dark={dark}
            active={highlight === p.campus.id}
            hovered={hover === p.campus.id}
            onHoverChange={setHover}
            onPick={handlePick}
          />
        ))}
        {dark && <HeroLegend />}
      </svg>
    </div>
  );
}
