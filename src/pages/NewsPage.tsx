import { useMemo, useState } from "react";
import { Page } from "@/components/Page";
import { PageHero } from "@/components/PageHero";
import { NewsCard } from "@/components/NewsCard";
import { CAMPUS_BY_ID } from "@/data/campuses";
import { NEWS } from "@/data/news.generated";
import type { NewsItem } from "@/data/news";
import { useIsMobile } from "@/lib/useMediaQuery";
import { I_Search, I_X } from "@/lib/icons";

type TimeWindow = "all" | "month" | "quarter" | "year";

const TIME_WINDOWS: { id: TimeWindow; label: string; days: number | null }[] = [
  { id: "all", label: "Any time", days: null },
  { id: "month", label: "Past month", days: 31 },
  { id: "quarter", label: "Past 3 months", days: 92 },
  { id: "year", label: "Past year", days: 365 },
];

function withinWindow(iso: string, days: number | null): boolean {
  if (days === null) return true;
  if (!iso) return false;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

function newsHaystack(item: NewsItem): string {
  const campusName = CAMPUS_BY_ID[item.campus]?.name ?? "";
  return `${item.title} ${item.summary} ${campusName}`.toLowerCase();
}

function NewsHero() {
  return (
    <PageHero
      trail={[{ label: "Home", to: "/" }, { label: "Latest news" }]}
      eyebrow="From across the system"
      title="Latest news."
      blurb="Founder spotlights, funding news, and program announcements pulled directly from each campus’s entrepreneurship hub."
    />
  );
}

interface FilterBarProps {
  query: string;
  setQuery: (q: string) => void;
  campuses: { id: string; name: string; count: number }[];
  selectedCampuses: Set<string>;
  toggleCampus: (id: string) => void;
  window: TimeWindow;
  setWindow: (w: TimeWindow) => void;
  resultCount: number;
  totalCount: number;
  onReset: () => void;
  hasActiveFilters: boolean;
}

function FilterBar(props: FilterBarProps) {
  const isMobile = useIsMobile();
  const {
    query,
    setQuery,
    campuses,
    selectedCampuses,
    toggleCampus,
    window: timeWindow,
    setWindow,
    resultCount,
    totalCount,
    onReset,
    hasActiveFilters,
  } = props;
  return (
    <div
      style={{
        background: "#fff",
        borderBottom: "1px solid rgba(0,32,51,.08)",
        padding: isMobile ? "16px 20px" : "20px 32px",
        position: "sticky",
        top: isMobile ? 64 : 116,
        zIndex: 20,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              flex: "1 1 280px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(0,32,51,.18)",
              borderRadius: 4,
              padding: "8px 12px",
              background: "#fff",
            }}
          >
            <I_Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles and summaries"
              aria-label="Search news"
              style={{
                flex: 1,
                border: 0,
                outline: 0,
                fontSize: 15,
                color: "#002033",
                background: "transparent",
              }}
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#4C4C4C",
                  cursor: "pointer",
                  display: "flex",
                  padding: 2,
                }}
              >
                <I_X size={16} />
              </button>
            ) : null}
          </div>
          <select
            value={timeWindow}
            onChange={(e) => setWindow(e.target.value as TimeWindow)}
            aria-label="Filter by time"
            style={{
              border: "1px solid rgba(0,32,51,.18)",
              borderRadius: 4,
              padding: "9px 12px",
              fontSize: 15,
              color: "#002033",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {TIME_WINDOWS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {campuses.map((c) => {
            const active = selectedCampuses.has(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleCampus(c.id)}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: active ? "1px solid #002033" : "1px solid rgba(0,32,51,.18)",
                  background: active ? "#002033" : "#fff",
                  color: active ? "#fff" : "#002033",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {c.name}
                <span style={{ opacity: 0.6, fontWeight: 500 }}>{c.count}</span>
              </button>
            );
          })}
          {hasActiveFilters ? (
            <button
              onClick={onReset}
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 999,
                border: 0,
                background: "transparent",
                color: "var(--accent, #1295D8)",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Reset filters
            </button>
          ) : null}
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#4C4C4C" }}>
            {resultCount === totalCount
              ? `${totalCount} ${totalCount === 1 ? "story" : "stories"}`
              : `${resultCount} of ${totalCount}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsPage() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [selectedCampuses, setSelectedCampuses] = useState<Set<string>>(new Set());
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("all");

  const campusOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of NEWS) counts.set(item.campus, (counts.get(item.campus) ?? 0) + 1);
    return [...counts.entries()]
      .map(([id, count]) => ({ id, name: CAMPUS_BY_ID[id]?.name ?? id, count }))
      .toSorted((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const days = TIME_WINDOWS.find((w) => w.id === timeWindow)?.days ?? null;
    let out = NEWS;
    if (selectedCampuses.size > 0) out = out.filter((i) => selectedCampuses.has(i.campus));
    if (days !== null) out = out.filter((i) => withinWindow(i.publishedAt, days));
    if (q) out = out.filter((i) => newsHaystack(i).includes(q));
    return out;
  }, [query, selectedCampuses, timeWindow]);

  const toggleCampus = (id: string) => {
    setSelectedCampuses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQuery("");
    setSelectedCampuses(new Set());
    setTimeWindow("all");
  };

  const hasActiveFilters = query.length > 0 || selectedCampuses.size > 0 || timeWindow !== "all";

  return (
    <Page>
      <NewsHero />
      <FilterBar
        query={query}
        setQuery={setQuery}
        campuses={campusOptions}
        selectedCampuses={selectedCampuses}
        toggleCampus={toggleCampus}
        window={timeWindow}
        setWindow={setTimeWindow}
        resultCount={filtered.length}
        totalCount={NEWS.length}
        onReset={reset}
        hasActiveFilters={hasActiveFilters}
      />
      <section style={{ padding: isMobile ? "24px 20px 64px" : "32px 32px 96px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          {filtered.length === 0 ? (
            <div style={{ color: "#4C4C4C", padding: "48px 0", textAlign: "center" }}>
              No stories match these filters.{" "}
              {hasActiveFilters ? (
                <button
                  onClick={reset}
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--accent, #1295D8)",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 3,
                    padding: 0,
                  }}
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
                gap: isMobile ? 16 : 24,
              }}
            >
              {filtered.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}
