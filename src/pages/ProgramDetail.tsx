import { type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Page } from "@/components/Page";
import { NotFound } from "@/components/NotFound";
import { ProgramCard } from "@/components/ProgramCard";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { TYPE_BY_ID } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import type { Campus, Program, ProgramType } from "@/data/types.ts";
import { useCompare } from "@/lib/compare";
import { useIsMobile } from "@/lib/useMediaQuery";
import { programGradient } from "@/lib/programGradient";
import {
  I_Calendar,
  I_Check,
  I_Chevron,
  I_Clock,
  I_External,
  I_Money,
  I_Pin,
  I_Plus,
  I_Star,
  I_Trophy,
  I_Users,
} from "@/lib/icons";

// ── derived view-model ─────────────────────────────────────────────────

interface DetailVM {
  program: Program;
  campus: Campus;
  type: ProgramType;
  applyHref: string;
  isExternal: boolean;
  hasSeparateWebsite: boolean;
  related: Program[];
}

// Only ever treat http(s) URLs as links — crawled data could carry a
// javascript:/data: value that would be a DOM-XSS vector in an href.
function isValidWebUrl(url: string | undefined): boolean {
  return !!url && (url.startsWith("http://") || url.startsWith("https://"));
}

function buildVM(program: Program): DetailVM {
  const campus = CAMPUS_BY_ID[program.campus];
  const type = TYPE_BY_ID[program.type];
  const applyHref =
    [program.applicationLink, program.website, program.sourceUrl].find(isValidWebUrl) ?? "#";
  const isExternal = applyHref !== "#";
  const hasSeparateWebsite = Boolean(
    program.website && isValidWebUrl(program.website) && program.website !== applyHref,
  );
  const related = PROGRAMS.filter((p) => isRelated(p, program)).slice(0, 3);
  return { program, campus, type, applyHref, isExternal, hasSeparateWebsite, related };
}

function isRelated(p: Program, target: Program): boolean {
  if (p.id === target.id) return false;
  if (p.type === target.type) return true;
  return p.industries.some((i) => target.industries.includes(i));
}

// ── shared building blocks ─────────────────────────────────────────────

function ExternalAnchorProps(href: string, isExternal: boolean) {
  // Re-validate at render: never emit a live href for a non-http(s) URL.
  const safe = isExternal && isValidWebUrl(href);
  return {
    href: safe ? href : "#",
    target: safe ? "_blank" : undefined,
    rel: safe ? "noopener noreferrer" : undefined,
    onClick: safe ? undefined : (e: React.MouseEvent) => e.preventDefault(),
  } as const;
}

function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 28,
          lineHeight: 1.15,
          margin: "10px 0 4px",
          color: "#002033",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── hero section ───────────────────────────────────────────────────────

function HeroBreadcrumbs({ campus, programName }: { campus: Campus; programName: string }) {
  const linkStyle = { color: "#BDE3F6", textDecoration: "none", fontWeight: 600 } as const;
  return (
    <div
      style={{
        fontSize: 13,
        color: "#BDE3F6",
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 32,
      }}
    >
      <Link to="/" style={linkStyle}>
        Home
      </Link>
      <I_Chevron size={12} />
      <Link to="/discover" style={linkStyle}>
        Programs
      </Link>
      <I_Chevron size={12} />
      <Link to={`/campus/${campus.id}`} style={linkStyle}>
        {campus.name}
      </Link>
      <I_Chevron size={12} />
      <span style={{ color: "#fff", fontWeight: 600 }}>{programName}</span>
    </div>
  );
}

function HeroChips({
  type,
  featured,
  campusName,
}: {
  type: ProgramType;
  featured?: boolean;
  campusName: string;
}) {
  const chipBase = {
    padding: "5px 12px",
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: ".08em",
    textTransform: "uppercase",
  } as const;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginBottom: 18,
        flexWrap: "wrap",
      }}
    >
      <span style={{ ...chipBase, background: "#fff", color: type.color }}>{type.label}</span>
      {featured && (
        <span
          style={{
            ...chipBase,
            background: "#FFB511",
            color: "#002033",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <I_Star size={12} /> Featured
        </span>
      )}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "#BDE3F6",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        <I_Pin size={14} /> {campusName}
      </span>
    </div>
  );
}

// A crawled applicationLink is sometimes a campus *admissions* root, not the
// program's own application. Don't promise "Start application" in that case.
function isGenericAdmissionsLink(url: string | undefined): boolean {
  return !!url && /admissions/i.test(url);
}

function applyCtaLabel(program: Program, fallback: string): string {
  if (!program.applicationLink) return fallback;
  return isGenericAdmissionsLink(program.applicationLink) ? "How to apply" : "Start application";
}

function HeroPrimaryCTA({ vm }: { vm: DetailVM }) {
  const label = applyCtaLabel(vm.program, `Visit on ${vm.campus.short}.edu`);
  return (
    <a
      {...ExternalAnchorProps(vm.applyHref, vm.isExternal)}
      style={{
        background: "#FFB511",
        color: "#002033",
        padding: "14px 24px",
        borderRadius: 4,
        fontWeight: 700,
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {label} <I_External size={15} />
    </a>
  );
}

function HeroCompareToggle({ programId }: { programId: string }) {
  const { has, add, remove } = useCompare();
  const inCompare = has(programId);
  return (
    <button
      onClick={() => (inCompare ? remove(programId) : add(programId))}
      style={{
        background: "transparent",
        color: "#fff",
        padding: "13px 22px",
        borderRadius: 4,
        fontWeight: 600,
        border: "2px solid #fff",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {inCompare ? (
        <>
          <I_Check size={16} /> Added to compare
        </>
      ) : (
        <>
          <I_Plus size={16} /> Add to compare
        </>
      )}
    </button>
  );
}

function HeroLeft({ vm }: { vm: DetailVM }) {
  return (
    <div>
      <HeroChips type={vm.type} featured={vm.program.featured} campusName={vm.campus.name} />
      <h1
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: "clamp(40px,4.6vw,64px)",
          lineHeight: 1.05,
          letterSpacing: "-0.01em",
          margin: 0,
          textWrap: "balance",
        }}
      >
        {vm.program.name}
      </h1>
      <p
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 400,
          fontSize: 22,
          lineHeight: 1.45,
          marginTop: 20,
          maxWidth: 760,
          color: "#BDE3F6",
        }}
      >
        {vm.program.desc}
      </p>
      <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
        {vm.isExternal && <HeroPrimaryCTA vm={vm} />}
        <HeroCompareToggle programId={vm.program.id} />
      </div>
    </div>
  );
}

interface GlanceRow {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function buildGlanceRows(program: Program): GlanceRow[] {
  return [
    { icon: <I_Calendar size={16} />, label: "Application deadline", value: program.deadline },
    { icon: <I_Money size={16} />, label: "Funding", value: program.funding },
    { icon: <I_Clock size={16} />, label: "Duration", value: program.duration },
    { icon: <I_Users size={16} />, label: "Cohort size", value: cohortLabel(program.cohortSize) },
    { icon: <I_Trophy size={16} />, label: "Selectivity", value: program.selectivity },
  ];
}

function cohortLabel(cohortSize: number | null): ReactNode {
  if (!cohortSize) return <em style={{ color: "#5B5D5E", fontStyle: "normal" }}>Not disclosed</em>;
  return `${cohortSize} ventures`;
}

function AtAGlanceCard({ program }: { program: Program }) {
  const rows = buildGlanceRows(program);
  return (
    <div
      style={{
        background: "rgba(255,255,255,.08)",
        border: "1px solid rgba(255,255,255,.18)",
        borderRadius: 8,
        padding: "24px 26px",
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: "#FFB511",
          marginBottom: 18,
        }}
      >
        At a glance
      </div>
      {rows.map((row, i) => (
        <GlanceRowItem key={row.label} row={row} first={i === 0} />
      ))}
    </div>
  );
}

function GlanceRowItem({ row, first }: { row: GlanceRow; first: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 0",
        borderTop: first ? "none" : "1px solid rgba(255,255,255,.10)",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#BDE3F6",
        }}
      >
        {row.icon} {row.label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 600, color: "#fff", textAlign: "right" }}>
        {row.value}
      </span>
    </div>
  );
}

function DetailHero({ vm }: { vm: DetailVM }) {
  const isMobile = useIsMobile();
  return (
    <section
      style={{ background: "#002033", color: "#fff", position: "relative", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: programGradient(vm.program),
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(0,32,51,.4) 0%, rgba(0,32,51,.85) 100%)",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 1440,
          margin: "0 auto",
          padding: isMobile ? "20px 20px 40px" : "24px 32px 56px",
        }}
      >
        <HeroBreadcrumbs campus={vm.campus} programName={vm.program.name} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr",
            gap: isMobile ? 24 : 48,
            alignItems: "flex-end",
          }}
        >
          <HeroLeft vm={vm} />
          <AtAGlanceCard program={vm.program} />
        </div>
      </div>
    </section>
  );
}

// ── overview body ──────────────────────────────────────────────────────

interface KeyDetail {
  label: string;
  value: string;
}

function buildKeyDetails(program: Program): KeyDetail[] {
  return [
    { label: "Stage", value: program.stage },
    { label: "Eligibility", value: program.eligibility.join(", ") },
    { label: "Duration", value: program.duration },
    { label: "Funding", value: program.funding },
    { label: "Selectivity", value: program.selectivity },
    {
      label: "Cohort size",
      value: program.cohortSize ? `${program.cohortSize} ventures` : "Not disclosed",
    },
  ];
}

function KeyDetailsGrid({ program }: { program: Program }) {
  const isMobile = useIsMobile();
  return (
    <DetailBlock title="Key details">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: isMobile ? 12 : 16,
          marginTop: 10,
        }}
      >
        {buildKeyDetails(program).map((d) => (
          <div
            key={d.label}
            style={{
              padding: "14px 16px",
              background: "#F7F5F1",
              borderRadius: 6,
              border: "1px solid rgba(0,32,51,.10)",
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#4C4C4C",
              }}
            >
              {d.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#002033", marginTop: 4 }}>
              {d.value}
            </div>
          </div>
        ))}
      </div>
    </DetailBlock>
  );
}

function IndustryPills({ industries, color }: { industries: string[]; color: string }) {
  return (
    <DetailBlock title="Focus areas">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
        {industries.map((i) => (
          <span
            key={i}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              background: "#fff",
              border: `1px solid ${color}33`,
              color,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {i}
          </span>
        ))}
      </div>
    </DetailBlock>
  );
}

function DetailOverview({ vm }: { vm: DetailVM }) {
  return (
    <div>
      <h2
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 36,
          lineHeight: 1.15,
          margin: "12px 0 18px",
          color: "#002033",
          textWrap: "balance",
        }}
      >
        What this program is, in one paragraph
      </h2>
      <p
        style={{
          fontSize: 18,
          lineHeight: 1.6,
          color: "#002033",
          marginTop: 0,
          maxWidth: 720,
        }}
      >
        {vm.program.longDescription ?? vm.program.desc}
      </p>
      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 40 }}>
        <KeyDetailsGrid program={vm.program} />
        {vm.program.industries.length > 0 && (
          <IndustryPills industries={vm.program.industries} color={vm.type.color} />
        )}
      </div>
    </div>
  );
}

// ── sidebar ────────────────────────────────────────────────────────────

function ApplyCard({ vm }: { vm: DetailVM }) {
  return (
    <div style={{ background: "#F7F5F1", borderRadius: 8, padding: "24px 24px 22px" }}>
      <h3
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 24,
          margin: "10px 0 6px",
          color: "#002033",
        }}
      >
        Ready to apply?
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.45, color: "#4C4C4C", marginTop: 0 }}>
        Applications go directly to the program team at {vm.campus.name}. Deadline:{" "}
        <strong>{vm.program.deadline}</strong>.
      </p>
      {vm.isExternal ? (
        <a
          {...ExternalAnchorProps(vm.applyHref, vm.isExternal)}
          style={{
            display: "block",
            textAlign: "center",
            background: "var(--accent, #1295D8)",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
            marginTop: 16,
          }}
        >
          {applyCtaLabel(vm.program, "Visit program page")} <I_External size={14} />
        </a>
      ) : (
        // No application/website/source URL on record — show a muted note
        // rather than a button that goes nowhere.
        <p
          style={{
            fontSize: 14,
            color: "#9aa5ab",
            fontWeight: 600,
            marginTop: 16,
            marginBottom: 0,
          }}
        >
          Details coming soon
        </p>
      )}
      {vm.hasSeparateWebsite && vm.program.website && (
        <a
          {...ExternalAnchorProps(vm.program.website, true)}
          style={{
            display: "block",
            textAlign: "center",
            background: "transparent",
            border: "2px solid #002033",
            color: "#002033",
            padding: "12px 18px",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: "none",
            marginTop: 10,
          }}
        >
          Visit program homepage
        </a>
      )}
    </div>
  );
}

function RunByCard({ campus }: { campus: Campus }) {
  const initials = campus.short.replace("UC ", "").slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        marginTop: 20,
        padding: "20px 22px",
        border: "1px solid rgba(0,32,51,.10)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 4,
            background: campus.color,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: "-.02em",
          }}
        >
          {initials}
        </div>
        <div>
          <div
            style={{
              fontFamily: "'Source Serif 4',Georgia,serif",
              fontWeight: 600,
              fontSize: 18,
              color: "#002033",
            }}
          >
            {campus.name}
          </div>
          <Link
            to={`/campus/${campus.id}`}
            style={{
              fontSize: 13,
              color: "#005581",
              fontWeight: 600,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            See all {campus.programs} programs at {campus.short} →
          </Link>
        </div>
      </div>
    </div>
  );
}

// Provenance shown on every record so trust is always visible: crawled
// records link their source and show when they were refreshed; curated
// records say so plainly instead of showing nothing.
function SourceFooter({ sourceUrl, lastUpdated }: { sourceUrl?: string; lastUpdated?: string }) {
  const hasSource = isValidWebUrl(sourceUrl);
  const parsed = lastUpdated ? new Date(lastUpdated) : null;
  const refreshed = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid rgba(0,32,51,.18)",
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      {hasSource ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#002033",
            textDecoration: "underline",
            textUnderlineOffset: 2,
            fontWeight: 600,
          }}
        >
          View source page
        </a>
      ) : refreshed ? null : (
        <span style={{ fontWeight: 600 }}>Curated by the UC Entrepreneurship Hub</span>
      )}
      {refreshed && (
        <div style={{ marginTop: 4, opacity: 0.8 }}>
          Refreshed{" "}
          {refreshed.toLocaleDateString(undefined, {
            timeZone: "America/Los_Angeles",
          })}
        </div>
      )}
    </div>
  );
}

function HeadsUpCard({ program }: { program: Program }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: "20px 22px",
        background: "#FFB511",
        color: "#002033",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontSize: 11.5,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          fontWeight: 700,
          marginBottom: 8,
        }}
      >
        Heads up
      </div>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
        Some details are pulled from the program’s site and may be incomplete. Always verify on the
        source page before applying.
      </p>
      <SourceFooter sourceUrl={program.sourceUrl} lastUpdated={program.lastUpdated} />
    </div>
  );
}

function DetailSidebar({ vm }: { vm: DetailVM }) {
  const isMobile = useIsMobile();
  return (
    <aside
      style={
        isMobile ? { width: "100%" } : { position: "sticky", top: 120, alignSelf: "flex-start" }
      }
    >
      <ApplyCard vm={vm} />
      <RunByCard campus={vm.campus} />
      <HeadsUpCard program={vm.program} />
    </aside>
  );
}

// ── related programs section ───────────────────────────────────────────

function DetailRelated({ related }: { related: Program[] }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  return (
    <section style={{ padding: isMobile ? "48px 20px" : "72px 32px", background: "#F7F5F1" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(28px,3vw,40px)",
                lineHeight: 1.1,
                margin: "12px 0 0",
                color: "#002033",
              }}
            >
              Programs with similar fit across UC
            </h2>
          </div>
          <Link
            to="/discover"
            style={{
              color: "#005581",
              fontWeight: 600,
              fontSize: 15,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            Explore all programs →
          </Link>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 14 : 24,
          }}
        >
          {related.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              onOpen={(prog) => navigate(`/program/${prog.id}`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── page entry ─────────────────────────────────────────────────────────

export function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  // Guard on `id` first: without it, `p.slug === undefined` would match the
  // first slug-less crawled program and bypass the not-found state.
  const program = id ? PROGRAMS.find((p) => p.id === id || p.slug === id) : undefined;
  const isMobile = useIsMobile();

  if (!program) {
    return (
      <NotFound
        eyebrow="Program not found"
        title="We couldn’t find that program"
        body={
          <>
            {id
              ? `No program matches “${id}”. It may have been renamed or removed since you last saw it.`
              : "That program link is missing an identifier."}{" "}
            Browse the full catalog to find what you’re looking for.
          </>
        }
        ctaLabel="Browse all programs"
        ctaTo="/discover"
      />
    );
  }
  const vm = buildVM(program);

  return (
    <Page>
      <DetailHero vm={vm} />
      <section style={{ padding: isMobile ? "40px 20px" : "72px 32px", background: "#fff" }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.5fr) 360px",
            gap: isMobile ? 32 : 64,
          }}
        >
          <DetailOverview vm={vm} />
          <DetailSidebar vm={vm} />
        </div>
      </section>
      <DetailRelated related={vm.related} />
    </Page>
  );
}
