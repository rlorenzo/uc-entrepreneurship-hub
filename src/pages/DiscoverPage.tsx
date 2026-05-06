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
import type { Program } from "@/data/types";
import { useCompare } from "@/lib/compare";
import { I_Calendar, I_Check, I_Chevron, I_Grid, I_List, I_Plus, I_Search, I_X } from "@/lib/icons";

type Filters = Record<string, string[]>;

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
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 3,
          border: checked ? "2px solid var(--accent, #1295D8)" : "1.5px solid rgba(0,32,51,.30)",
          background: checked ? "var(--accent, #1295D8)" : "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        {checked && <I_Check size={12} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ display: "none" }} />
      <span style={{ flex: 1, fontSize: 14, color: "#002033", fontWeight: checked ? 600 : 400 }}>
        {label}
      </span>
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

function FilterSidebar({
  filters,
  setFilters,
  counts,
}: {
  filters: Filters;
  setFilters: (updater: (f: Filters) => Filters) => void;
  counts: {
    campus: Record<string, number>;
    type: Record<string, number>;
    industry: Record<string, number>;
  };
}) {
  const toggle = (key: string, val: string) => {
    setFilters((f) => {
      const cur = new Set(f[key] ?? []);
      if (cur.has(val)) cur.delete(val);
      else cur.add(val);
      return { ...f, [key]: [...cur] };
    });
  };
  const clear = () => setFilters(() => ({}));
  const has = (key: string, val: string) => (filters[key] ?? []).includes(val);
  const activeCount = Object.values(filters).reduce(
    (n, arr) => n + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

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

      <FilterSection title="Campus">
        {CAMPUSES.map((c) => (
          <FilterCheckbox
            key={c.id}
            label={c.name}
            count={counts.campus[c.id] ?? 0}
            checked={has("campus", c.id)}
            onChange={() => toggle("campus", c.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Program type">
        {TYPES.map((t) => (
          <FilterCheckbox
            key={t.id}
            label={t.label}
            count={counts.type[t.id] ?? 0}
            checked={has("type", t.id)}
            onChange={() => toggle("type", t.id)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Industry">
        {INDUSTRIES.map((i) => (
          <FilterCheckbox
            key={i}
            label={i}
            count={counts.industry[i] ?? 0}
            checked={has("industry", i)}
            onChange={() => toggle("industry", i)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Stage" defaultOpen={false}>
        {STAGES.map((s) => (
          <FilterCheckbox
            key={s}
            label={s}
            checked={has("stage", s)}
            onChange={() => toggle("stage", s)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Eligibility" defaultOpen={false}>
        {ELIGIBILITY.map((e) => (
          <FilterCheckbox
            key={e}
            label={e}
            checked={has("eligibility", e)}
            onChange={() => toggle("eligibility", e)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Duration" defaultOpen={false}>
        {DURATIONS.map((d) => (
          <FilterCheckbox
            key={d}
            label={d}
            checked={has("duration", d)}
            onChange={() => toggle("duration", d)}
          />
        ))}
      </FilterSection>
    </aside>
  );
}

function ActiveChips({
  filters,
  setFilters,
  q,
  setQ,
}: {
  filters: Filters;
  setFilters: (updater: (f: Filters) => Filters) => void;
  q: string;
  setQ: (v: string) => void;
}) {
  const remove = (key: string, val: string) =>
    setFilters((f) => ({
      ...f,
      [key]: (f[key] ?? []).filter((v) => v !== val),
    }));
  const labelFor = (key: string, v: string) => {
    if (key === "campus") return CAMPUS_BY_ID[v]?.name ?? v;
    if (key === "type") return TYPE_BY_ID[v]?.label ?? v;
    return v;
  };
  const all = Object.entries(filters).flatMap(([k, arr]) => (arr ?? []).map((v) => ({ k, v })));
  if (all.length === 0 && !q) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
      {q && (
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
            onClick={() => setQ("")}
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
      )}
      {all.map(({ k, v }) => (
        <span
          key={`${k}-${v}`}
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
          {labelFor(k, v)}
          <button
            onClick={() => remove(k, v)}
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
      ))}
    </div>
  );
}

function ProgramListRow({ program, onOpen }: { program: Program; onOpen: (id: string) => void }) {
  const { has, add, remove } = useCompare();
  const inCompare = has(program.id);
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
      <div onClick={() => onOpen(program.id)} style={{ cursor: "pointer" }}>
        <CardArt program={program} height={104} />
      </div>
      <div onClick={() => onOpen(program.id)} style={{ cursor: "pointer" }}>
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
      </div>
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
    </article>
  );
}

// Map URL search params (single-value via the homepage chips) to multi-select filter arrays.
function paramsToFilters(params: URLSearchParams): Filters {
  const f: Filters = {};
  for (const [k, v] of params.entries()) {
    if (k === "q") continue;
    f[k] = (f[k] ?? []).concat([v]);
  }
  return f;
}

export function DiscoverPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState<Filters>(() => paramsToFilters(params));
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<"featured" | "deadline" | "campus" | "name">("featured");
  const [view, setView] = useState<"grid" | "list">("grid");

  // Re-sync filters when navigating into /discover with a new query string.
  useEffect(() => {
    setFilters(paramsToFilters(params));
    setQ(params.get("q") ?? "");
  }, [params]);

  const filtered = useMemo(() => {
    let list = PROGRAMS.filter((p) => {
      const haystack =
        `${p.name} ${p.desc} ${p.industries.join(" ")} ${CAMPUS_BY_ID[p.campus]?.name ?? ""}`.toLowerCase();
      if (q && !haystack.includes(q.toLowerCase())) return false;
      if (filters.campus?.length && !filters.campus.includes(p.campus)) return false;
      if (filters.type?.length && !filters.type.includes(p.type)) return false;
      if (filters.industry?.length && !filters.industry.some((i) => p.industries.includes(i)))
        return false;
      if (filters.stage?.length && !filters.stage.includes(p.stage)) return false;
      if (
        filters.eligibility?.length &&
        !filters.eligibility.some((e) => p.eligibility.includes(e))
      )
        return false;
      if (filters.duration?.length && !filters.duration.includes(p.duration)) return false;
      return true;
    });
    if (sort === "featured")
      list = [...list].toSorted((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    if (sort === "deadline")
      list = [...list].toSorted((a, b) => a.deadline.localeCompare(b.deadline));
    if (sort === "campus")
      list = [...list].toSorted((a, b) =>
        (CAMPUS_BY_ID[a.campus]?.name ?? "").localeCompare(CAMPUS_BY_ID[b.campus]?.name ?? ""),
      );
    if (sort === "name") list = [...list].toSorted((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [q, filters, sort]);

  const counts = useMemo(() => {
    const c = {
      campus: {} as Record<string, number>,
      type: {} as Record<string, number>,
      industry: {} as Record<string, number>,
    };
    PROGRAMS.forEach((p) => {
      c.campus[p.campus] = (c.campus[p.campus] ?? 0) + 1;
      c.type[p.type] = (c.type[p.type] ?? 0) + 1;
      p.industries.forEach((i) => {
        c.industry[i] = (c.industry[i] ?? 0) + 1;
      });
    });
    return c;
  }, []);

  const open = (id: string) => navigate(`/program/${id}`);

  return (
    <Page>
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
          </div>
        </div>
      </section>

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
                <strong style={{ color: "#002033", fontWeight: 700 }}>{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "program" : "programs"} {q && <>matching “{q}”</>}
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
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
                    onChange={(e) => setSort(e.target.value as typeof sort)}
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
                <div
                  style={{
                    display: "flex",
                    border: "1px solid rgba(0,32,51,.15)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setView("grid")}
                    style={{
                      background: view === "grid" ? "#002033" : "#fff",
                      color: view === "grid" ? "#fff" : "#002033",
                      border: 0,
                      padding: "8px 10px",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <I_Grid size={16} />
                  </button>
                  <button
                    onClick={() => setView("list")}
                    style={{
                      background: view === "list" ? "#002033" : "#fff",
                      color: view === "list" ? "#fff" : "#002033",
                      border: 0,
                      padding: "8px 10px",
                      cursor: "pointer",
                      display: "flex",
                    }}
                  >
                    <I_List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
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
                  onClick={() => {
                    setFilters(() => ({}));
                    setQ("");
                  }}
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
            ) : view === "grid" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                {filtered.map((p) => (
                  <ProgramCard key={p.id} program={p} onOpen={(prog) => open(prog.id)} compact />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {filtered.map((p) => (
                  <ProgramListRow key={p.id} program={p} onOpen={open} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Page>
  );
}
