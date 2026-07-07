import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_COMPARE, loadIds, saveIds } from "./compare-storage";

export { MAX_COMPARE };

interface CompareApi {
  ids: string[];
  /** True at the MAX_COMPARE cap — add() is a silent no-op then, so buttons
   * must disable or relabel instead of pretending the click worked. */
  isFull: boolean;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
}

const CompareCtx = createContext<CompareApi>({
  ids: [],
  isFull: false,
  add: () => {},
  remove: () => {},
  clear: () => {},
  has: () => false,
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(loadIds);

  useEffect(() => {
    saveIds(ids);
  }, [ids]);

  const api = useMemo<CompareApi>(
    () => ({
      ids,
      isFull: ids.length >= MAX_COMPARE,
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
