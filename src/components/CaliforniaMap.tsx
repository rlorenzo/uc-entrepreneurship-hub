import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CAMPUSES } from "@/data/campuses";
import type { Campus } from "@/data/types";

interface Props {
  variant?: "standalone" | "hero";
  highlight?: string | null;
  onPick?: (c: Campus) => void;
}

export function CaliforniaMap({ variant = "standalone", highlight = null, onPick }: Props) {
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const dark = variant === "hero";
  const W = 360;
  const H = 540;

  const caPath =
    "M120 30 L160 30 L185 50 L195 80 L210 110 L210 145 L235 175 L260 220 L260 260 L280 305 L285 350 L300 395 L310 430 L320 470 L340 510 L335 540 L295 535 L255 520 L225 495 L180 490 L155 475 L130 470 L120 455 L105 425 L95 395 L80 365 L70 335 L70 305 L85 275 L90 240 L100 200 L95 170 L100 140 L105 110 L110 80 Z";

  const handlePick = (c: Campus) => {
    if (onPick) onPick(c);
    else navigate(`/campus/${c.id}`);
  };

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
        <defs>
          <linearGradient id="caFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={dark ? "rgba(18,149,216,.18)" : "#F7F5F1"} />
            <stop offset="1" stopColor={dark ? "rgba(0,85,129,.35)" : "#EDE7DD"} />
          </linearGradient>
        </defs>
        <path
          d={caPath}
          fill="url(#caFill)"
          stroke={dark ? "rgba(189,227,246,.45)" : "rgba(0,32,51,.25)"}
          strokeWidth="1.5"
        />

        {dark &&
          CAMPUSES.map((a, i) =>
            CAMPUSES.slice(i + 1).map((b) => {
              const dist = Math.hypot(a.x - b.x, a.y - b.y);
              if (dist > 80) return null;
              return (
                <line
                  key={`${a.id}-${b.id}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="rgba(255,181,17,.25)"
                  strokeWidth="1"
                />
              );
            }),
          )}

        {CAMPUSES.map((c) => {
          const isHover = hover === c.id;
          const isHL = highlight === c.id;
          return (
            <g
              key={c.id}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHover(c.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => handlePick(c)}
            >
              {(isHover || isHL) && (
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="14"
                  fill={dark ? "rgba(255,181,17,.25)" : "rgba(18,149,216,.20)"}
                />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={isHover || isHL ? 8 : 6}
                fill={dark ? "#FFB511" : "#1295D8"}
                stroke={dark ? "#002033" : "#fff"}
                strokeWidth="2"
              />
              {isHover && (
                <g>
                  <rect
                    x={c.x + 12}
                    y={c.y - 22}
                    rx="3"
                    ry="3"
                    width={c.short.length * 7 + 24}
                    height="26"
                    fill={dark ? "#fff" : "#002033"}
                  />
                  <text
                    x={c.x + 24}
                    y={c.y - 5}
                    fontSize="12"
                    fontWeight="700"
                    fontFamily="'Source Sans 3',sans-serif"
                    fill={dark ? "#002033" : "#fff"}
                  >
                    {c.short}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {dark && (
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
        )}
      </svg>
    </div>
  );
}
