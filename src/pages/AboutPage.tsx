import type { ReactNode } from "react";
import { Page } from "@/components/Page";
import { PageHero } from "@/components/PageHero";
import { PROGRAM_COUNT } from "@/data/programs";
import { CAMPUSES } from "@/data/campuses";
import { SUBMIT_PROGRAM_URL, SUGGEST_EDIT_URL } from "@/lib/links";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_External } from "@/lib/icons";

// ── shared building blocks ─────────────────────────────────────────────

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "'Source Serif 4',Georgia,serif",
        fontWeight: 600,
        fontSize: "clamp(28px,3vw,40px)",
        lineHeight: 1.12,
        color: "var(--uc-dark-blue)",
        margin: "0 0 18px",
        textWrap: "balance",
      }}
    >
      {children}
    </h2>
  );
}

function Para({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: 18,
        lineHeight: 1.6,
        color: "var(--uc-dark-blue)",
        margin: "0 0 18px",
        maxWidth: 720,
      }}
    >
      {children}
    </p>
  );
}

function ExternalCTA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        background: "var(--accent)",
        color: "var(--uc-white)",
        padding: "13px 22px",
        borderRadius: 4,
        fontWeight: 600,
        fontSize: 15,
        textDecoration: "none",
      }}
    >
      {children} <I_External size={15} />
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}

// ── audiences ──────────────────────────────────────────────────────────

interface Audience {
  who: string;
  what: string;
}

const AUDIENCES: Audience[] = [
  {
    who: "Students",
    what: "Have an idea and want the next concrete step — what's open now, what fits their stage, what won't collide with a courseload.",
  },
  {
    who: "Faculty & researchers",
    what: "Want to move work from lab to market: proof-of-concept funds, IP and licensing support, translational accelerators.",
  },
  {
    who: "Partners, mentors & investors",
    what: "Want a single front door to engage across the whole system instead of campus-by-campus outreach.",
  },
];

function AudienceGrid() {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
        gap: 16,
        marginTop: 8,
      }}
    >
      {AUDIENCES.map((a) => (
        <div
          key={a.who}
          style={{
            padding: "20px 22px",
            background: "var(--bg-2)",
            borderRadius: 8,
            border: "1px solid rgba(0,32,51,.10)",
          }}
        >
          <div
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontWeight: 600,
              fontSize: 19,
              color: "var(--uc-dark-blue)",
              marginBottom: 8,
            }}
          >
            {a.who}
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.5, color: "var(--uc-gray)" }}>
            {a.what}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── sections ───────────────────────────────────────────────────────────

function InitiativeSection() {
  return (
    <div>
      <SectionHeading>The initiative</SectionHeading>
      <Para>
        The UC Entrepreneurship Hub is a unified, searchable catalog of entrepreneurship programs
        across all {CAMPUSES.length} University of California campuses — incubators, accelerators,
        courses, funding, competitions, and maker spaces in one place. It collapses a
        campus-by-campus scavenger hunt into a single catalog where programs are described in
        standardized fields and compared side by side.
      </Para>
      <Para>
        It’s built for the people making a real decision about where to apply, and three audiences
        share the catalog — each arriving with a different job and rarely much time:
      </Para>
      <AudienceGrid />
      <div style={{ marginTop: 22 }}>
        <Para>
          The hub is an initiative of the UC Office of the President’s Innovation &amp;
          Entrepreneurship effort. It’s a public resource, not a pitch deck: the goal is to be
          genuinely useful to someone deciding where to apply.
        </Para>
      </div>
    </div>
  );
}

function MethodologySection() {
  return (
    <div>
      <SectionHeading>Data &amp; methodology</SectionHeading>
      <Para>
        Accuracy is the brand, so the catalog is honest about where every record comes from. It’s a
        merge of two sources:
      </Para>
      <ul
        style={{
          margin: "0 0 18px",
          paddingLeft: 22,
          maxWidth: 720,
          fontSize: 18,
          lineHeight: 1.6,
          color: "var(--uc-dark-blue)",
        }}
      >
        <li style={{ marginBottom: 10 }}>
          <strong>Curated programs</strong> — hand-shaped and vetted by the hub team.
        </li>
        <li>
          <strong>Crawled programs</strong> — automatically extracted from each campus’s innovation
          hub, then normalized onto a shared vocabulary of program types, industries, and stages.
        </li>
      </ul>
      <Para>
        On conflict, the curated record wins; the crawl fills in optional fields the curated copy is
        missing — website, application link, deadlines, and the source page. The crawl runs weekly,
        and every crawled record links its source and shows when it was last refreshed, so you can
        always check the original.
      </Para>
      <Para>
        We don’t invent deadlines or inflate counts. The hub currently lists{" "}
        <strong>{PROGRAM_COUNT} programs</strong>, and that number is derived from the catalog
        itself — never set by hand. Where a detail isn’t published, the hub says “not listed” rather
        than faking completeness.
      </Para>
      <CorrectionsCard />
    </div>
  );
}

function CorrectionsCard() {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        marginTop: 28,
        padding: isMobile ? "24px 22px" : "28px 30px",
        background: "var(--uc-dark-blue)",
        color: "var(--uc-white)",
        borderRadius: 8,
      }}
    >
      <h3
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 24,
          margin: "0 0 8px",
        }}
      >
        Help keep it accurate
      </h3>
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 16,
          lineHeight: 1.55,
          color: "var(--uc-blue-xlight)",
          maxWidth: 640,
        }}
      >
        Running a program that isn’t here, or spotted something out of date? Submitting it on GitHub
        takes a structured form — no account-specific setup or code required.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <ExternalCTA href={SUBMIT_PROGRAM_URL}>Submit a program</ExternalCTA>
        <a
          href={SUGGEST_EDIT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "transparent",
            color: "var(--uc-white)",
            padding: "13px 22px",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 15,
            border: "2px solid rgba(255,255,255,.5)",
            textDecoration: "none",
          }}
        >
          Suggest a correction <I_External size={15} />
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────

export function AboutPage() {
  const isMobile = useIsMobile();
  return (
    <Page>
      <PageHero
        trail={[{ label: "Home", to: "/" }, { label: "About" }]}
        eyebrow="About the hub"
        title="One front door, ten campuses."
        blurb="What this catalog is, who it’s for, and exactly how its data is gathered and kept honest."
      />
      {/* scrollMarginTop clears the sticky nav when footer links deep-link here
          (e.g. /about#methodology) — see ScrollToTop in App.tsx. */}
      <section
        id="initiative"
        style={{ padding: isMobile ? "40px 20px 24px" : "64px 32px 32px", scrollMarginTop: 96 }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <InitiativeSection />
        </div>
      </section>
      <section
        id="methodology"
        style={{
          padding: isMobile ? "24px 20px 56px" : "32px 32px 96px",
          background: "var(--uc-white)",
          scrollMarginTop: 96,
        }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <MethodologySection />
        </div>
      </section>
    </Page>
  );
}
