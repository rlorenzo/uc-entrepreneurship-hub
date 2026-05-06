import { useEffect, useState } from "react";

/**
 * Reactively track a CSS media query. Returns whether the query
 * currently matches; updates on viewport change.
 *
 * Used to swap grid-template-columns and other inline-style decisions
 * for mobile layouts. We standardize on a 768px breakpoint to match
 * the design prototype's two-column-or-stacked rule of thumb.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

const MOBILE_BREAKPOINT = 768;

export const useIsMobile = (): boolean => useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
