import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Page } from "./Page";
import { Eyebrow } from "./Eyebrow";
import { I_Arrow } from "@/lib/icons";
import { useIsMobile } from "@/lib/useMediaQuery";

interface NotFoundProps {
  eyebrow: string;
  title: string;
  body: ReactNode;
  ctaLabel: string;
  ctaTo: string;
}

// Shared "we couldn't find that" surface for unknown route params (an unknown
// program or campus id). Routes must never silently fall back to a real record
// — showing the wrong program/campus is the worst possible trust failure for a
// catalog whose brand is accurate data.
export function NotFound({ eyebrow, title, body, ctaLabel, ctaTo }: NotFoundProps) {
  const isMobile = useIsMobile();
  // On an SPA route change the element that triggered navigation is gone, so
  // move focus to the heading. Keyboard and screen-reader users land on the
  // not-found message instead of being stranded at the top of the document.
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);
  return (
    <Page>
      <section
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: isMobile ? "72px 20px" : "120px 32px",
          textAlign: "center",
        }}
      >
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          ref={headingRef}
          tabIndex={-1}
          style={{
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: "clamp(32px,4vw,48px)",
            lineHeight: 1.1,
            margin: "12px 0 0",
            color: "#002033",
            textWrap: "balance",
            outline: "none",
          }}
        >
          {title}
        </h1>
        <p style={{ margin: "16px 0 28px", fontSize: 18, lineHeight: 1.55, color: "#4C4C4C" }}>
          {body}
        </p>
        <Link
          to={ctaTo}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--accent)",
            color: "#fff",
            padding: "14px 24px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          {ctaLabel} <I_Arrow size={16} />
        </Link>
      </section>
    </Page>
  );
}
