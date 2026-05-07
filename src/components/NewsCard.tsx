import { CAMPUS_BY_ID } from "@/data/campuses";
import { formatNewsDate } from "@/lib/dates";
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

function coverBackground(imageUrl: string | undefined): string {
  return imageUrl ? `#001520 center/cover no-repeat url("${imageUrl}")` : COVER_FALLBACK;
}

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
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(4px)",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "#fff" }} />
      {name}
    </div>
  );
}

function NewsCardCover({ item, showPill }: { item: NewsItem; showPill: boolean }) {
  return (
    <div
      style={{
        aspectRatio: "16/10",
        background: coverBackground(item.imageUrl),
        position: "relative",
      }}
    >
      {showPill ? <CampusPill campusId={item.campus} /> : null}
    </div>
  );
}

function NewsCardSummary({ summary }: { summary: string }) {
  return (
    <p
      style={{
        fontSize: 14,
        lineHeight: 1.5,
        color: "#4C4C4C",
        margin: "0 0 14px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
      }}
    >
      {summary}
    </p>
  );
}

function NewsCardBody({ item }: { item: NewsItem }) {
  const date = formatNewsDate(item.publishedAt);
  return (
    <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
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
      <h3
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 20,
          lineHeight: 1.25,
          color: "#002033",
          margin: "0 0 10px",
          textWrap: "pretty",
        }}
      >
        {item.title}
      </h3>
      {item.summary ? <NewsCardSummary summary={item.summary} /> : null}
      {item.sourceHost ? (
        <div style={{ marginTop: "auto", fontSize: 13, color: "var(--accent, #005581)" }}>
          {item.sourceHost} ↗
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
}

export function NewsCard({ item, hideCampusName = false }: NewsCardProps) {
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
        flexDirection: "column",
        background: "#fff",
        border: "1px solid rgba(0,32,51,.10)",
        borderRadius: 8,
        overflow: "hidden",
        transition: "transform .15s ease, box-shadow .15s ease",
      }}
    >
      <NewsCardCover item={item} showPill={!hideCampusName} />
      <NewsCardBody item={item} />
    </a>
  );
}
