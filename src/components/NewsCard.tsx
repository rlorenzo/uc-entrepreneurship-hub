import { CAMPUS_BY_ID } from "@/data/campuses";
import { formatNewsDate } from "@/lib/dates";
import { useIsMobile } from "@/lib/useMediaQuery";
import type { NewsItem } from "@/data/news";

function liftCard(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,32,51,.10)";
  e.currentTarget.style.transform = "translateY(-2px)";
}

function dropCard(e: React.MouseEvent<HTMLAnchorElement>) {
  e.currentTarget.style.boxShadow = "";
  e.currentTarget.style.transform = "";
}

const COVER_FALLBACK = "linear-gradient(135deg,#1295D8,#005581)";

function CampusPill({ campusId }: { campusId: string }) {
  const name = CAMPUS_BY_ID[campusId]?.name ?? campusId;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: 12,
        fontSize: 12,
        fontWeight: 600,
        color: "var(--uc-white)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        // Solid navy chip (no decorative backdrop blur) — legible over any cover.
        background: "rgba(0,32,51,.78)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--uc-white)" }} />
      {name}
    </div>
  );
}

function NewsCardCover({
  item,
  showPill,
  eager,
}: {
  item: NewsItem;
  showPill: boolean;
  eager: boolean;
}) {
  const campusName = CAMPUS_BY_ID[item.campus]?.name ?? item.campus;
  return (
    <div style={{ position: "absolute", inset: 0, background: COVER_FALLBACK }}>
      {item.imageUrl ? (
        // Decorative: the headline beside it already carries the meaning.
        // The featured lead is above the fold, so load it eagerly (LCP).
        <img
          src={item.imageUrl}
          alt=""
          loading={eager ? "eager" : "lazy"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            background: "#001520",
          }}
        />
      ) : (
        // Imageless story: name the campus on the gradient so it still reads.
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: "0 16px",
            textAlign: "center",
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontSize: 20,
            color: "rgba(255,255,255,.9)",
          }}
        >
          {campusName}
        </span>
      )}
      {/* Skip the pill on imageless cards — the centered campus name already names it. */}
      {showPill && item.imageUrl ? <CampusPill campusId={item.campus} /> : null}
    </div>
  );
}

function NewsCardSummary({ summary, lines }: { summary: string; lines: number }) {
  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.5,
        color: "var(--uc-gray)",
        margin: "0 0 14px",
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {summary}
    </p>
  );
}

function NewsCardBody({ item, featured }: { item: NewsItem; featured: boolean }) {
  const date = formatNewsDate(item.publishedAt);
  return (
    <div
      style={{
        padding: featured ? "28px 30px 30px" : "20px 22px 22px",
        display: "flex",
        flexDirection: "column",
        flex: 1,
        justifyContent: featured ? "center" : undefined,
      }}
    >
      {date ? (
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            color: "var(--accent, #005581)",
            marginBottom: 8,
          }}
        >
          {date}
        </div>
      ) : null}
      <h3
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: featured ? 28 : 20,
          lineHeight: 1.22,
          color: "var(--uc-dark-blue)",
          margin: "0 0 10px",
          textWrap: "pretty",
        }}
      >
        {item.title}
      </h3>
      {item.summary ? <NewsCardSummary summary={item.summary} lines={featured ? 4 : 3} /> : null}
      {item.sourceHost ? (
        <div style={{ marginTop: "auto", fontSize: 13, color: "var(--accent, #005581)" }}>
          {item.sourceHost} <span aria-hidden="true">↗</span>
        </div>
      ) : null}
    </div>
  );
}

interface NewsCardProps {
  item: NewsItem;
  // When set, replaces the campus pill with the campus dot only — useful on
  // campus detail pages where the campus name would be redundant.
  hideCampusName?: boolean;
  // Lead-story treatment: wider, side-by-side on desktop, larger headline.
  featured?: boolean;
}

export function NewsCard({ item, hideCampusName = false, featured = false }: NewsCardProps) {
  const isMobile = useIsMobile();
  const horizontal = featured && !isMobile;
  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={liftCard}
      onMouseLeave={dropCard}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: horizontal ? "row" : "column",
        background: "var(--uc-white)",
        border: "1px solid rgba(0,32,51,.10)",
        borderRadius: 8,
        overflow: "hidden",
        transition: "transform .15s ease, box-shadow .15s ease",
      }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          ...(horizontal ? { flexBasis: "46%", minHeight: 300 } : { aspectRatio: "16 / 10" }),
        }}
      >
        <NewsCardCover item={item} showPill={!hideCampusName} eager={featured} />
      </div>
      <NewsCardBody item={item} featured={featured} />
      {/* Announce the new-tab behavior to screen readers without an aria-label
          that would mask the card's visible content. */}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  );
}
