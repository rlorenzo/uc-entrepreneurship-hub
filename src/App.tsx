import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CompareProvider } from "@/lib/compare";
import { HomePage } from "@/pages/HomePage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { ProgramDetail } from "@/pages/ProgramDetail";
import { CampusPage } from "@/pages/CampusPage";
import { CampusesPage } from "@/pages/CampusesPage";
import { ComparePage } from "@/pages/ComparePage";
import { NewsPage } from "@/pages/NewsPage";
import { AboutPage } from "@/pages/AboutPage";

// Reset scroll on every route change so deep-link navigation lands at the top —
// unless the location carries a hash (e.g. /about#methodology from the footer),
// in which case scroll that section into view. Instant scroll, so it's
// reduced-motion-safe. The DOM is committed before this effect runs, so the
// target element is already present.
function decodeHashId(hash: string): string {
  // The hash comes straight from the address bar; a malformed percent-sequence
  // must not throw and blank the whole app.
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeHashId(hash));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

export function App() {
  return (
    <HashRouter>
      <CompareProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/program/:id" element={<ProgramDetail />} />
          <Route path="/campus/:id" element={<CampusPage />} />
          <Route path="/campuses" element={<CampusesPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CompareProvider>
    </HashRouter>
  );
}
