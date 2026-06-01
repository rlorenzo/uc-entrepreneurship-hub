import { describe, it, expect, afterEach } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CompareProvider } from "@/lib/compare";
import { Nav } from "./Nav";

// Capture the real matchMedia up front so afterEach can restore it exactly.
// Resetting to a desktop stub instead would leak this file's behavior into
// other suites that rely on the environment's matchMedia.
const originalMatchMedia = window.matchMedia;

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
  // Restore the real matchMedia so this file's stub can't leak into other tests.
  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

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
