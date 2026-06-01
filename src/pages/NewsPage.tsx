import { useEffect, useMemo, useState } from "react";
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

const DAY_MS = 24 * 60 * 60 * 1000;

function withinWindow(iso: string, days: number | null): boolean {
  if (days === null) return true;
  const t = Date.parse(iso || "");
  return Number.isFinite(t) && Date.now() - t <= days * DAY_MS;
}

function newsHaystack(item: NewsItem): string {
  const campusName = CAMPUS_BY_ID[item.campus]?.name ?? "";
  return `${item.title} ${item.summary} ${campusName}`.toLowerCase();
}

function daysForWindow(id: TimeWindow): number | null {
  return TIME_WINDOWS.find((w) => w.id === id)?.days ?? null;
}

interface CampusOption {
  id: string;
  name: string;
  count: number;
}

function buildCampusOptions(items: NewsItem[]): CampusOption[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item.campus, (counts.get(item.campus) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, count]) => ({ id, name: CAMPUS_BY_ID[id]?.name ?? id, count }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}

interface FilterState {
  query: string;
  selectedCampuses: Set<string>;
  window: TimeWindow;
}

function applyFilters(items: NewsItem[], state: FilterState): NewsItem[] {
  const days = daysForWindow(state.window);
  const q = state.query.trim().toLowerCase();
  return items.filter(
    (i) =>
      (state.selectedCampuses.size === 0 || state.selectedCampuses.has(i.campus)) &&
      withinWindow(i.publishedAt, days) &&
      (!q || newsHaystack(i).includes(q)),
  );
}

function isFilterActive(state: FilterState): boolean {
  return state.query.length > 0 || state.selectedCampuses.size > 0 || state.window !== "all";
}

interface NewsFilters extends FilterState {
  setQuery: (q: string) => void;
  toggleCampus: (id: string) => void;
  setWindow: (w: TimeWindow) => void;
  reset: () => void;
}

function useNewsFilters(): NewsFilters {
  const [query, setQuery] = useState("");
  const [selectedCampuses, setSelectedCampuses] = useState<Set<string>>(new Set());
  const [window, setWindow] = useState<TimeWindow>("all");
  const toggleCampus = (id: string) =>
    setSelectedCampuses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const reset = () => {
    setQuery("");
    setSelectedCampuses(new Set());
    setWindow("all");
  };
  return { query, selectedCampuses, window, setQuery, toggleCampus, setWindow, reset };
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

interface SearchInputProps {
  query: string;
  setQuery: (q: string) => void;
}

function SearchInput({ query, setQuery }: SearchInputProps) {
  return (
    <div
      style={{
        flex: "1 1 280px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        border: "1px solid rgba(0,32,51,.18)",
        borderRadius: 4,
        padding: "8px 12px",
        background: "var(--uc-white)",
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
          fontSize: 15,
          color: "var(--uc-dark-blue)",
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
            color: "var(--uc-gray)",
            cursor: "pointer",
            display: "flex",
            padding: 2,
          }}
        >
          <I_X size={16} />
        </button>
      ) : null}
    </div>
  );
}

interface TimeSelectProps {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
}

function TimeSelect({ value, onChange }: TimeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TimeWindow)}
      aria-label="Filter by time"
      style={{
        border: "1px solid rgba(0,32,51,.18)",
        borderRadius: 4,
        padding: "9px 12px",
        fontSize: 15,
        color: "var(--uc-dark-blue)",
        background: "var(--uc-white)",
        cursor: "pointer",
      }}
    >
      {TIME_WINDOWS.map((w) => (
        <option key={w.id} value={w.id}>
          {w.label}
        </option>
      ))}
    </select>
  );
}

function CampusChip({
  option,
  active,
  onToggle,
}: {
  option: CampusOption;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        fontSize: 13,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: 999,
        border: active ? "1px solid #002033" : "1px solid rgba(0,32,51,.18)",
        background: active ? "var(--uc-dark-blue)" : "var(--uc-white)",
        color: active ? "var(--uc-white)" : "var(--uc-dark-blue)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {option.name}
      <span style={{ opacity: 0.6, fontWeight: 500 }}>{option.count}</span>
    </button>
  );
}

function ResetButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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
  );
}

function ResultMeta({ resultCount, totalCount }: { resultCount: number; totalCount: number }) {
  if (resultCount === totalCount) {
    const noun = totalCount === 1 ? "story" : "stories";
    return (
      <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--uc-gray)" }}>
        {totalCount} {noun}
      </div>
    );
  }
  return (
    <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--uc-gray)" }}>
      {resultCount} of {totalCount}
    </div>
  );
}

interface FilterBarProps {
  filters: NewsFilters;
  campuses: CampusOption[];
  resultCount: number;
  totalCount: number;
}

function FilterBar({ filters, campuses, resultCount, totalCount }: FilterBarProps) {
  const isMobile = useIsMobile();
  const active = isFilterActive(filters);
  return (
    <div
      style={{
        background: "var(--uc-white)",
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
          <SearchInput query={filters.query} setQuery={filters.setQuery} />
          <TimeSelect value={filters.window} onChange={filters.setWindow} />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {campuses.map((c) => (
            <CampusChip
              key={c.id}
              option={c}
              active={filters.selectedCampuses.has(c.id)}
              onToggle={() => filters.toggleCampus(c.id)}
            />
          ))}
          {active ? <ResetButton onClick={filters.reset} /> : null}
          <ResultMeta resultCount={resultCount} totalCount={totalCount} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ active, onReset }: { active: boolean; onReset: () => void }) {
  return (
    <div style={{ color: "var(--uc-gray)", padding: "48px 0", textAlign: "center" }}>
      No stories match these filters.{" "}
      {active ? (
        <button
          onClick={onReset}
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
  );
}

function NewsGrid({ items }: { items: NewsItem[] }) {
  const isMobile = useIsMobile();
  // Items arrive newest-first; give the lead story a full-width featured
  // treatment so the feed has hierarchy instead of one flat wall of cards.
  const [lead, ...rest] = items;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
        gap: isMobile ? 16 : 24,
      }}
    >
      {lead && (
        <div key={lead.id} style={{ gridColumn: isMobile ? "auto" : "1 / -1" }}>
          <NewsCard item={lead} featured />
        </div>
      )}
      {rest.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </div>
  );
}

const PAGE_SIZE = 24;

function ShowMoreButton({ remaining, onClick }: { remaining: number; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 36 }}>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: hover ? "var(--uc-dark-blue)" : "var(--uc-white)",
          border: "2px solid var(--uc-dark-blue)",
          color: hover ? "var(--uc-white)" : "var(--uc-dark-blue)",
          padding: "14px 24px",
          borderRadius: 4,
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
          transition: "background .15s ease, color .15s ease",
        }}
      >
        Show more stories ({remaining} more)
      </button>
    </div>
  );
}

function NewsResults({ items, filters }: { items: NewsItem[]; filters: NewsFilters }) {
  const isMobile = useIsMobile();
  // Render in pages so the feed doesn't mount ~100 cards (and their images) at
  // once. `items` is memoized on the filter state, so changing a filter resets
  // the view to the first page.
  const [visible, setVisible] = useState(PAGE_SIZE);
  // Reset to the first page when the filter set changes (not on every render —
  // `items` is a fresh array each render, which would otherwise reset
  // pagination whenever the page re-renders for an unrelated reason).
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [filters.query, filters.selectedCampuses, filters.window]);
  return (
    <section style={{ padding: isMobile ? "24px 20px 64px" : "32px 32px 96px" }}>
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        {items.length === 0 ? (
          <EmptyState active={isFilterActive(filters)} onReset={filters.reset} />
        ) : (
          <>
            <NewsGrid items={items.slice(0, visible)} />
            {visible < items.length && (
              <ShowMoreButton
                remaining={items.length - visible}
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
              />
            )}
          </>
        )}
      </div>
    </section>
  );
}

export function NewsPage() {
  const filters = useNewsFilters();
  const campusOptions = useMemo(() => buildCampusOptions(NEWS), []);
  // Depend on the primitive filter values: useNewsFilters returns a fresh
  // object each render, so [filters] would never actually memoize.
  const filtered = useMemo(
    () => applyFilters(NEWS, filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.query, filters.selectedCampuses, filters.window],
  );
  return (
    <Page>
      <NewsHero />
      <FilterBar
        filters={filters}
        campuses={campusOptions}
        resultCount={filtered.length}
        totalCount={NEWS.length}
      />
      <NewsResults items={filtered} filters={filters} />
    </Page>
  );
}
