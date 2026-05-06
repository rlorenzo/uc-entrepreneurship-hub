import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Page } from "@/components/Page";
import { Eyebrow } from "@/components/Eyebrow";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProgramCard } from "@/components/ProgramCard";
import { CardArt } from "@/components/CardArt";
import { Pill, TypePill, CampusBadge } from "@/components/Pill";
import { CAMPUSES, CAMPUS_BY_ID } from "@/data/campuses";
import { TYPES, TYPE_BY_ID, INDUSTRIES, STAGES, ELIGIBILITY, DURATIONS } from "@/data/types-list";
import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/data/types.ts";
import { useCompare } from "@/lib/compare";
import { I_Calendar, I_Check, I_Chevron, I_Grid, I_List, I_Plus, I_Search, I_X } from "@/lib/icons";

type Filters = Record<string, string[]>;
type SortKey = "featured" | "deadline" | "campus" | "name";
type ViewKind = "grid" | "list";

// ── filter / sort engine ──────────────────────────────────────────────

interface FilterRule {
  key: keyof Filters;
  matches: (selected: string[], p: Program) => boolean;
}

const FILTER_RULES: FilterRule[] = [
  { key: "campus", matches: (sel, p) => sel.includes(p.campus) },
  { key: "type", matches: (sel, p) => sel.includes(p.type) },
  { key: "industry", matches: (sel, p) => sel.some((i) => p.industries.includes(i)) },
  { key: "stage", matches: (sel, p) => sel.includes(p.stage) },
  { key: "eligibility", matches: (sel, p) => sel.some((e) => p.eligibility.includes(e)) },
  { key: "duration", matches: (sel, p) => sel.includes(p.duration) },
];

function programHaystack(p: Program): string {
  const campusName = CAMPUS_BY_ID[p.campus]?.name ?? "";
  return `${p.name} ${p.desc} ${p.industries.join(" ")} ${campusName}`.toLowerCase();
}

function passesQuery(p: Program, q: string): boolean {
  return !q || programHaystack(p).includes(q.toLowerCase());
}

function passesFilters(p: Program, filters: Filters): boolean {
  for (const rule of FILTER_RULES) {
    const selected = filters[rule.key];
    if (selected?.length && !rule.matches(selected, p)) return false;
  }
  return true;
}

const SORTERS: Record<SortKey, (a: Program, b: Program) => number> = {
  featured: (a, b) => Number(b.featured ?? false) - Number(a.featured ?? false),
  deadline: (a, b) => a.deadline.localeCompare(b.deadline),
  campus: (a, b) => {
    const an = CAMPUS_BY_ID[a.campus]?.name ?? "";
    const bn = CAMPUS_BY_ID[b.campus]?.name ?? "";
    return an.localeCompare(bn);
  },
  name: (a, b) => a.name.localeCompare(b.name),
};

interface FacetCounts {
  campus: Record<string, number>;
  type: Record<string, number>;
  industry: Record<string, number>;
}

function bumpCount(target: Record<string, number>, key: string): void {
  target[key] = (target[key] ?? 0) + 1;
}

function tallyFacets(p: Program, counts: FacetCounts): void {
  bumpCount(counts.campus, p.campus);
  bumpCount(counts.type, p.type);
  for (const i of p.industries) bumpCount(counts.industry, i);
}

function buildFacetCounts(): FacetCounts {
  const counts: FacetCounts = { campus: {}, type: {}, industry: {} };
  for (const p of PROGRAMS) tallyFacets(p, counts);
  return counts;
}

// Map URL search params (single-value via the homepage chips) to multi-select filter arrays.
function paramsToFilters(params: URLSearchParams): Filters {
  const f: Filters = {};
  for (const [k, v] of params.entries()) {
    if (k === "q") continue;
    f[k] = [...(f[k] ?? []), v];
  }
  return f;
}

// ── filter sidebar ────────────────────────────────────────────────────

const ACCENT = "var(--accent, #1295D8)";

function checkboxBoxStyle(checked: boolean) {
  return {
    width: 18,
    height: 18,
    borderRadius: 3,
    border: checked ? `2px solid ${ACCENT}` : "1.5px solid rgba(0,32,51,.30)",
    background: checked ? ACCENT : "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  } as const;
}

function checkboxLabelStyle(checked: boolean) {
  return { flex: 1, fontSize: 14, color: "#002033", fontWeight: checked ? 600 : 400 } as const;
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "7px 0",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <span style={checkboxBoxStyle(checked)}>{checked && <I_Check size={12} />}</span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={checkboxLabelStyle(checked)}>{label}</span>
      {count !== undefined && <span style={{ fontSize: 12, color: "#7C7E7F" }}>{count}</span>}
    </label>
  );
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,32,51,.10)", padding: "18px 0" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "transparent",
          border: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 0,
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontSize: 12,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: "#002033",
          }}
        >
          {title}
        </span>
        <span
          style={{
            transform: open ? "rotate(90deg)" : "rotate(0)",
            transition: "transform .2s",
            color: "#4C4C4C",
          }}
        >
          <I_Chevron size={14} />
        </span>
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

interface FilterFacet {
  key: string;
  title: string;
  defaultOpen?: boolean;
  options: { value: string; label: string }[];
  countsKey?: keyof FacetCounts;
}

const FACETS: FilterFacet[] = [
  {
    key: "campus",
    title: "Campus",
    options: CAMPUSES.map((c) => ({ value: c.id, label: c.name })),
    countsKey: "campus",
  },
  {
    key: "type",
    title: "Program type",
    options: TYPES.map((t) => ({ value: t.id, label: t.label })),
    countsKey: "type",
  },
  {
    key: "industry",
    title: "Industry",
    options: INDUSTRIES.map((i) => ({ value: i, label: i })),
    countsKey: "industry",
  },
  {
    key: "stage",
    title: "Stage",
    defaultOpen: false,
    options: STAGES.map((s) => ({ value: s, label: s })),
  },
  {
    key: "eligibility",
    title: "Eligibility",
    defaultOpen: false,
    options: ELIGIBILITY.map((e) => ({ value: e, label: e })),
  },
  {
    key: "duration",
    title: "Duration",
    defaultOpen: false,
    options: DURATIONS.map((d) => ({ value: d, label: d })),
  },
];

interface FilterSidebarProps {
  filters: Filters;
  setFilters: (updater: (f: Filters) => Filters) => void;
  counts: FacetCounts;
}

function activeFilterCount(filters: Filters): number {
  let total = 0;
  for (const arr of Object.values(filters)) total += arr?.length ?? 0;
  return total;
}

function FilterFacetSection({
  facet,
  counts,
  filters,
  toggle,
}: {
  facet: FilterFacet;
  counts: FacetCounts;
  filters: Filters;
  toggle: (key: string, val: string) => void;
}) {
  const facetCounts = facet.countsKey ? counts[facet.countsKey] : undefined;
  const checkedFor = (val: string) => (filters[facet.key] ?? []).includes(val);
  return (
    <FilterSection title={facet.title} defaultOpen={facet.defaultOpen ?? true}>
      {facet.options.map((opt) => (
        <FilterCheckbox
          key={opt.value}
          label={opt.label}
          count={facetCounts?.[opt.value]}
          checked={checkedFor(opt.value)}
          onChange={() => toggle(facet.key, opt.value)}
        />
      ))}
    </FilterSection>
  );
}

function FilterSidebar({ filters, setFilters, counts }: FilterSidebarProps) {
  const toggle = (key: string, val: string) => {
    setFilters((f) => {
      const cur = new Set(f[key] ?? []);
      if (cur.has(val)) cur.delete(val);
      else cur.add(val);
      return { ...f, [key]: [...cur] };
    });
  };
  const clear = () => setFilters(() => ({}));
  const activeCount = activeFilterCount(filters);

  return (
    <aside
      style={{
        width: 280,
        flexShrink: 0,
        position: "sticky",
        top: 120,
        alignSelf: "flex-start",
        maxHeight: "calc(100vh - 140px)",
        overflowY: "auto",
        paddingRight: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 0 12px",
        }}
      >
        <div
          style={{
            fontFamily: "'Source Serif 4',Georgia,serif",
            fontWeight: 600,
            fontSize: 22,
            color: "#002033",
          }}
        >
          Filters
        </div>
        {activeCount > 0 && (
          <button
            onClick={clear}
            style={{
              background: "transparent",
              border: 0,
              color: "#005581",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>
      {FACETS.map((facet) => (
        <FilterFacetSection
          key={facet.key}
          facet={facet}
          counts={counts}
          filters={filters}
          toggle={toggle}
        />
      ))}
    </aside>
  );
}

// ── active chips ──────────────────────────────────────────────────────

const CHIP_LABEL_LOOKUP: Record<string, (v: string) => string> = {
  campus: (v) => CAMPUS_BY_ID[v]?.name ?? v,
  type: (v) => TYPE_BY_ID[v]?.label ?? v,
};

function chipLabel(key: string, value: string): string {
  return CHIP_LABEL_LOOKUP[key]?.(value) ?? value;
}

function flattenActiveFilters(filters: Filters): { k: string; v: string }[] {
  const out: { k: string; v: string }[] = [];
  for (const [k, arr] of Object.entries(filters)) {
    for (const v of arr ?? []) out.push({ k, v });
  }
  return out;
}

function QueryChip({ q, onClear }: { q: string; onClear: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#002033",
        color: "#fff",
        padding: "6px 10px 6px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      “{q}”
      <button
        onClick={onClear}
        style={{
          background: "transparent",
          border: 0,
          color: "#fff",
          cursor: "pointer",
          padding: 0,
          display: "flex",
        }}
      >
        <I_X size={14} />
      </button>
    </span>
  );
}

function FilterChip({ k, v, onRemove }: { k: string; v: string; onRemove: () => void }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        border: "1px solid rgba(0,32,51,.18)",
        color: "#002033",
        padding: "6px 10px 6px 12px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {chipLabel(k, v)}
      <button
        onClick={onRemove}
        style={{
          background: "transparent",
          border: 0,
          color: "#4C4C4C",
          cursor: "pointer",
          padding: 0,
          display: "flex",
        }}
      >
        <I_X size={14} />
      </button>
    </span>
  );
}

interface ActiveChipsProps {
  filters: Filters;
  setFilters: (updater: (f: Filters) => Filters) => void;
  q: string;
  setQ: (v: string) => void;
}

function ActiveChips({ filters, setFilters, q, setQ }: ActiveChipsProps) {
  const remove = (key: string, val: string) =>
    setFilters((f) => ({ ...f, [key]: (f[key] ?? []).filter((v) => v !== val) }));
  const all = flattenActiveFilters(filters);
  if (all.length === 0 && !q) return null;
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
      {q && <QueryChip q={q} onClear={() => setQ("")} />}
      {all.map(({ k, v }) => (
        <FilterChip key={`${k}-${v}`} k={k} v={v} onRemove={() => remove(k, v)} />
      ))}
    </div>
  );
}

// ── list-view row ─────────────────────────────────────────────────────

function ListRowMeta({ program }: { program: Program }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <CampusBadge campusId={program.campus} />
        <span style={{ color: "#7C7E7F" }}>·</span>
        <TypePill typeId={program.type} />
      </div>
      <h3
        style={{
          margin: "4px 0 6px",
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 22,
          color: "#002033",
        }}
      >
        {program.name}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.5,
          color: "#4C4C4C",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {program.desc}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
        {program.industries.slice(0, 4).map((i) => (
          <Pill key={i}>{i}</Pill>
        ))}
      </div>
    </>
  );
}

function ListRowActions({ program, onOpen }: { program: Program; onOpen: (id: string) => void }) {
  const { has, add, remove } = useCompare();
  const inCompare = has(program.id);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
      <div
        style={{
          fontSize: 12,
          color: "#4C4C4C",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <I_Calendar size={13} /> {program.deadline}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#002033" }}>{program.funding}</div>
      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
        <button
          onClick={() => (inCompare ? remove(program.id) : add(program.id))}
          style={{
            border: `1px solid ${inCompare ? "#005581" : "rgba(0,32,51,.15)"}`,
            background: inCompare ? "#005581" : "#fff",
            color: inCompare ? "#fff" : "#002033",
            borderRadius: 4,
            padding: "8px 12px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {inCompare ? (
            <>
              <I_Check size={13} /> Comparing
            </>
          ) : (
            <>
              <I_Plus size={13} /> Compare
            </>
          )}
        </button>
        <button
          onClick={() => onOpen(program.id)}
          style={{
            background: "var(--accent, #1295D8)",
            color: "#fff",
            border: 0,
            borderRadius: 4,
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          View
        </button>
      </div>
    </div>
  );
}

function ProgramListRow({ program, onOpen }: { program: Program; onOpen: (id: string) => void }) {
  const open = () => onOpen(program.id);
  return (
    <article
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr 200px",
        gap: 24,
        padding: 18,
        background: "#fff",
        border: "1px solid rgba(0,32,51,.10)",
        borderRadius: 8,
        alignItems: "center",
      }}
    >
      <div onClick={open} style={{ cursor: "pointer" }}>
        <CardArt program={program} height={104} />
      </div>
      <div onClick={open} style={{ cursor: "pointer" }}>
        <ListRowMeta program={program} />
      </div>
      <ListRowActions program={program} onOpen={onOpen} />
    </article>
  );
}

// ── results section ───────────────────────────────────────────────────

interface ResultsToolbarProps {
  count: number;
  query: string;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  view: ViewKind;
  setView: (v: ViewKind) => void;
}

function ResultsToolbar({ count, query, sort, setSort, view, setView }: ResultsToolbarProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <div style={{ fontSize: 14, color: "#4C4C4C" }}>
        <strong style={{ color: "#002033", fontWeight: 700 }}>{count}</strong>{" "}
        {count === 1 ? "program" : "programs"} {query && <>matching “{query}”</>}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <SortControl sort={sort} setSort={setSort} />
        <ViewToggle view={view} setView={setView} />
      </div>
    </div>
  );
}

function SortControl({ sort, setSort }: { sort: SortKey; setSort: (s: SortKey) => void }) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        color: "#4C4C4C",
      }}
    >
      Sort by
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as SortKey)}
        style={{
          fontFamily: "inherit",
          fontSize: 14,
          fontWeight: 600,
          color: "#002033",
          padding: "8px 28px 8px 10px",
          border: "1px solid rgba(0,32,51,.15)",
          borderRadius: 4,
          background: "#fff",
          cursor: "pointer",
        }}
      >
        <option value="featured">Most popular</option>
        <option value="deadline">Deadline approaching</option>
        <option value="campus">Campus (A–Z)</option>
        <option value="name">Program name</option>
      </select>
    </label>
  );
}

const viewToggleButtonStyle = (active: boolean) =>
  ({
    background: active ? "#002033" : "#fff",
    color: active ? "#fff" : "#002033",
    border: 0,
    padding: "8px 10px",
    cursor: "pointer",
    display: "flex",
  }) as const;

function ViewToggle({ view, setView }: { view: ViewKind; setView: (v: ViewKind) => void }) {
  return (
    <div
      style={{
        display: "flex",
        border: "1px solid rgba(0,32,51,.15)",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <button onClick={() => setView("grid")} style={viewToggleButtonStyle(view === "grid")}>
        <I_Grid size={16} />
      </button>
      <button onClick={() => setView("list")} style={viewToggleButtonStyle(view === "list")}>
        <I_List size={16} />
      </button>
    </div>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return (
    <div
      style={{
        padding: "80px 24px",
        textAlign: "center",
        background: "#F7F5F1",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          fontFamily: "'Source Serif 4',Georgia,serif",
          fontWeight: 600,
          fontSize: 28,
          color: "#002033",
        }}
      >
        No programs match those filters.
      </div>
      <p style={{ fontSize: 16, color: "#4C4C4C", margin: "12px 0 24px" }}>
        Try clearing a filter or broadening your search.
      </p>
      <button
        onClick={onReset}
        style={{
          background: "transparent",
          border: "2px solid #005581",
          color: "#005581",
          padding: "12px 22px",
          borderRadius: 4,
          fontWeight: 600,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Reset filters
      </button>
    </div>
  );
}

function ResultsView({
  view,
  programs,
  onOpen,
}: {
  view: ViewKind;
  programs: Program[];
  onOpen: (id: string) => void;
}) {
  if (view === "grid") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
        {programs.map((p) => (
          <ProgramCard key={p.id} program={p} onOpen={(prog) => onOpen(prog.id)} compact />
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {programs.map((p) => (
        <ProgramListRow key={p.id} program={p} onOpen={onOpen} />
      ))}
    </div>
  );
}

// ── hero ──────────────────────────────────────────────────────────────

function DiscoverHero({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <section
      style={{
        background: "#F7F5F1",
        padding: "32px 32px 28px",
        borderBottom: "1px solid rgba(0,32,51,.08)",
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <Breadcrumbs trail={[{ label: "Home", to: "/" }, { label: "Explore programs" }]} />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 24,
            marginTop: 18,
            flexWrap: "wrap",
          }}
        >
          <div>
            <Eyebrow>140+ programs across the system</Eyebrow>
            <h1
              style={{
                fontFamily: "'Source Serif 4',Georgia,serif",
                fontWeight: 600,
                fontSize: "clamp(36px,4vw,52px)",
                lineHeight: 1.1,
                margin: "10px 0 0",
                color: "#002033",
              }}
            >
              Explore programs
            </h1>
          </div>
          <SearchBox q={q} setQ={setQ} />
        </div>
      </div>
    </section>
  );
}

function SearchBox({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      style={{
        background: "#fff",
        borderRadius: 6,
        border: "1px solid rgba(0,32,51,.15)",
        padding: 6,
        display: "flex",
        gap: 6,
        minWidth: 380,
        maxWidth: 520,
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          color: "#4C4C4C",
        }}
      >
        <I_Search size={18} />
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search programs, industries, campuses…"
        style={{
          flex: 1,
          border: 0,
          outline: "none",
          fontSize: 15,
          padding: "10px 0",
          background: "transparent",
          color: "#002033",
          fontFamily: "inherit",
        }}
      />
      {q && (
        <button
          type="button"
          onClick={() => setQ("")}
          style={{
            background: "transparent",
            border: 0,
            color: "#4C4C4C",
            padding: "0 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <I_X size={16} />
        </button>
      )}
    </form>
  );
}

// ── page entry ────────────────────────────────────────────────────────

function applyFiltersAndSort(q: string, filters: Filters, sort: SortKey): Program[] {
  const list = PROGRAMS.filter((p) => passesQuery(p, q) && passesFilters(p, filters));
  return [...list].toSorted(SORTERS[sort]);
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => paramsToFilters(params));
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<SortKey>("featured");
  const [view, setView] = useState<ViewKind>("grid");

  // Re-sync filters when navigating into /discover with a new query string.
  useEffect(() => {
    setFilters(paramsToFilters(params));
    setQ(params.get("q") ?? "");
  }, [params]);

  const filtered = useMemo(() => applyFiltersAndSort(q, filters, sort), [q, filters, sort]);
  const counts = useMemo(buildFacetCounts, []);
  const open = (id: string) => navigate(`/program/${id}`);
  const reset = () => {
    setFilters(() => ({}));
    setQ("");
  };

  return (
    <Page>
      <DiscoverHero q={q} setQ={setQ} />
      <section style={{ padding: "32px 32px 80px", background: "#fff" }}>
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            display: "flex",
            gap: 40,
            alignItems: "flex-start",
          }}
        >
          <FilterSidebar filters={filters} setFilters={setFilters} counts={counts} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <ActiveChips filters={filters} setFilters={setFilters} q={q} setQ={setQ} />
            <ResultsToolbar
              count={filtered.length}
              query={q}
              sort={sort}
              setSort={setSort}
              view={view}
              setView={setView}
            />
            {filtered.length === 0 ? (
              <EmptyResults onReset={reset} />
            ) : (
              <ResultsView view={view} programs={filtered} onOpen={open} />
            )}
          </div>
        </div>
      </section>
    </Page>
  );
}
