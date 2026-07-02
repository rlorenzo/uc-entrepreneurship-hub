import { PROGRAMS } from "@/data/programs";

// Persist the comparison across refreshes and tab switches — the primary user
// is a mobile student lining up a few programs, and losing the set on a single
// refresh defeats the page's whole purpose.
const STORAGE_KEY = "uc-compare-ids";
export const MAX_COMPARE = 4;
const VALID_IDS = new Set(PROGRAMS.map((p) => p.id));

export function loadIds(): string[] {
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

export function saveIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable/full (e.g. private mode) — in-memory state still works.
  }
}
