import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { MAX_COMPARE, loadIds, saveIds } from "./compare-storage";

export { MAX_COMPARE };

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

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(loadIds);

  useEffect(() => {
    saveIds(ids);
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
