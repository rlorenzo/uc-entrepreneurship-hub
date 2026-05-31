import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROGRAMS } from "@/data/programs";

interface CompareApi {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CompareCtx = createContext<CompareApi>({
  ids: [],
  add: () => {},
  remove: () => {},
  clear: () => {},
  has: () => false,
});

// Persist the comparison across refreshes and tab switches — the primary user
// is a mobile student lining up a few programs, and losing the set on a single
// refresh defeats the page's whole purpose.
const STORAGE_KEY = "uc-compare-ids";
export const MAX_COMPARE = 4;
const VALID_IDS = new Set(PROGRAMS.map((p) => p.id));

function loadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Drop ids that no longer match a program (stale link, re-crawled slug),
    // so the stored count can't drift from what the page can actually render.
    return parsed
      .filter((x): x is string => typeof x === "string" && VALID_IDS.has(x))
      .slice(0, MAX_COMPARE);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(loadIds);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable/full (e.g. private mode) — in-memory state still works.
    }
  }, [ids]);

  const api = useMemo<CompareApi>(
    () => ({
      ids,
      // Return the existing array reference on no-ops so we don't rerender the
      // whole app tree or write unchanged data to localStorage.
      add: (id) =>
        setIds((arr) => (arr.includes(id) || arr.length >= MAX_COMPARE ? arr : [...arr, id])),
      remove: (id) => setIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : arr)),
      clear: () => setIds((arr) => (arr.length === 0 ? arr : [])),
      has: (id) => ids.includes(id),
    }),
    [ids],
  );

  return <CompareCtx.Provider value={api}>{children}</CompareCtx.Provider>;
}

export const useCompare = () => useContext(CompareCtx);
