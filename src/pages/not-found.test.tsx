import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CompareProvider } from "@/lib/compare";
import { ProgramDetail } from "./ProgramDetail";
import { CampusPage } from "./CampusPage";
import { PROGRAMS } from "@/data/programs";

// Regression guard for the trust-critical bug where an unknown :id silently
// fell back to a real record (ProgramDetail -> PROGRAMS[0], CampusPage ->
// CAMPUSES[0]). A stale or mistyped link must render a not-found state, never
// a confident wrong program/campus with a real apply link.
function renderAt(path: string) {
  return render(
    <CompareProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/program/:id" element={<ProgramDetail />} />
          <Route path="/campus/:id" element={<CampusPage />} />
        </Routes>
      </MemoryRouter>
    </CompareProvider>,
  );
}

describe("unknown route params never fall back to a real record", () => {
  it("ProgramDetail renders a not-found state for an unknown id", () => {
    renderAt("/program/this-program-does-not-exist");
    expect(screen.getByText(/program not found/i)).toBeTruthy();
    // The old bug rendered the first catalog program as a fallback.
    expect(screen.queryByText(PROGRAMS[0].name)).toBeNull();
  });

  it("ProgramDetail renders not-found when the id param is absent", () => {
    // Without an id, a naive `p.slug === id` check would match the first
    // slug-less crawled program. Guard against that regression.
    render(
      <CompareProvider>
        <MemoryRouter initialEntries={["/program"]}>
          <Routes>
            <Route path="/program" element={<ProgramDetail />} />
          </Routes>
        </MemoryRouter>
      </CompareProvider>,
    );
    expect(screen.getByText(/program not found/i)).toBeTruthy();
    expect(screen.queryByText(PROGRAMS[0].name)).toBeNull();
  });

  it("ProgramDetail renders the real program for a known id", () => {
    const program = PROGRAMS[0];
    renderAt(`/program/${program.slug ?? program.id}`);
    expect(screen.getAllByText(program.name).length).toBeGreaterThan(0);
    expect(screen.queryByText(/program not found/i)).toBeNull();
  });

  it("CampusPage renders a not-found state for an unknown id", () => {
    renderAt("/campus/not-a-real-campus");
    expect(screen.getByText(/campus not found/i)).toBeTruthy();
  });
});
