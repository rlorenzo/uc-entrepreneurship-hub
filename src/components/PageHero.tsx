import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/Breadcrumbs";
import { Eyebrow } from "@/components/Eyebrow";
import { useIsMobile } from "@/lib/useMediaQuery";

interface PageHeroProps {
  trail: Crumb[];
  eyebrow: string;
  title: ReactNode;
  blurb: ReactNode;
}

export function PageHero({ trail, eyebrow, title, blurb }: PageHeroProps) {
  const isMobile = useIsMobile();
  return (
    <section
      style={{
        padding: isMobile ? "24px 20px 18px" : "48px 32px 24px",
        background: "var(--bg-2)",
        borderBottom: "1px solid rgba(0,32,51,.08)",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <Breadcrumbs trail={trail} />
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1
          style={{
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: "clamp(40px,4.4vw,60px)",
            lineHeight: 1.05,
            margin: "12px 0 16px",
            color: "var(--uc-dark-blue)",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 18,
            maxWidth: 680,
            color: "var(--uc-gray)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {blurb}
        </p>
      </div>
    </section>
  );
}
