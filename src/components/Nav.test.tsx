import { describe, it, expect, afterEach } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CompareProvider } from "@/lib/compare";
import { Nav } from "./Nav";

// The rest of the suite only exercises the desktop branch (jsdom's matchMedia
// stub reports matches:false). Drive useIsMobile both ways here so the
// responsive Nav switch — hamburger drawer vs. inline links — stays covered.
function setMobile(mobile: boolean) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: mobile,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function renderNav() {
  return render(
    <CompareProvider>
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    </CompareProvider>,
  );
}

describe("Nav responsive layout", () => {
  // Restore the default (desktop) stub so other tests are unaffected.
  afterEach(() => setMobile(false));

  it("renders the hamburger menu (and no inline links) on mobile", () => {
    setMobile(true);
    renderNav();
    expect(screen.getByRole("button", { name: /open menu/i })).toBeTruthy();
    expect(screen.queryByText("Explore programs")).toBeNull();
  });

  it("renders inline nav links (and no hamburger) on desktop", () => {
    setMobile(false);
    renderNav();
    expect(screen.getByText("Explore programs")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /open menu/i })).toBeNull();
  });
});
