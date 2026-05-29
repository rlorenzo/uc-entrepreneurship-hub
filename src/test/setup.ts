// Test environment setup, loaded once before the suite (see vite.config.ts
// `test.setupFiles`). jsdom omits a handful of browser APIs the UI touches;
// we stub the few the components actually call so renders don't throw.
import { afterEach } from "vite-plus/test";
import { cleanup } from "@testing-library/react";

// useMediaQuery (src/lib/useMediaQuery.ts) calls window.matchMedia, which
// jsdom does not implement. Return a non-matching, inert MediaQueryList.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      // Deprecated MQL API, kept for type compatibility.
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// ScrollToTop (src/App.tsx) calls window.scrollTo on every route change;
// jsdom leaves it undefined and would otherwise throw "not implemented".
window.scrollTo = (() => {}) as typeof window.scrollTo;

// Unmount React trees and reset the document between tests so component
// renders stay isolated (Testing Library v16 does not auto-clean).
afterEach(() => {
  cleanup();
});
