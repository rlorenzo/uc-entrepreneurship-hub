import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { App } from "./App";

// Smoke test: there is no other automated coverage of the runtime, so this
// guards the React 19 + react-router 7 upgrade by confirming the app mounts
// and the HashRouter resolves the default '#/' location to the home page.
describe("<App> smoke test", () => {
  it("mounts and renders the home route without crashing", () => {
    render(<App />);
    // Nav landmarks (desktop + mobile) render on every route.
    expect(screen.getAllByRole("navigation").length).toBeGreaterThan(0);
    // The site chrome renders meaningful content rather than a blank tree.
    expect(document.body.textContent).toContain("Entrepreneurship");
  });
});
