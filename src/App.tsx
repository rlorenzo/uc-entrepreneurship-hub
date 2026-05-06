import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CompareProvider } from "@/lib/compare";
import { HomePage } from "@/pages/HomePage";
import { DiscoverPage } from "@/pages/DiscoverPage";
import { ProgramDetail } from "@/pages/ProgramDetail";
import { CampusPage } from "@/pages/CampusPage";
import { CampusesPage } from "@/pages/CampusesPage";
import { ComparePage } from "@/pages/ComparePage";

// Reset scroll on every route change so deep-link navigation lands at the top.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CompareProvider>
    </HashRouter>
  );
}
