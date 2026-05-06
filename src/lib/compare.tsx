import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export interface CompareApi {
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
  const [ids, setIds] = useState<string[]>([]);

  const api = useMemo<CompareApi>(
    () => ({
      ids,
      add: (id) => setIds((arr) => (arr.includes(id) ? arr : [...arr, id].slice(0, 4))),
      remove: (id) => setIds((arr) => arr.filter((x) => x !== id)),
      clear: () => setIds([]),
      has: (id) => ids.includes(id),
    }),
    [ids],
  );

  return <CompareCtx.Provider value={api}>{children}</CompareCtx.Provider>;
}

export const useCompare = () => useContext(CompareCtx);
