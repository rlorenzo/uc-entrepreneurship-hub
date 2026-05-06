import type { ReactNode } from "react";

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: "'Source Sans 3',sans-serif",
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: ".14em",
        textTransform: "uppercase",
        color: color ?? "var(--accent, #005581)",
      }}
    >
      {children}
    </div>
  );
}
