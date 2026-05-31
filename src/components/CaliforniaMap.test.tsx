import { describe, it, expect } from "vite-plus/test";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CaliforniaMap } from "./CaliforniaMap";
import { CAMPUSES } from "@/data/campuses";

// The map is the product's signature spatial index. It used to be mouse-only
// (<g onClick> with no role/tabindex/label). These guard that every campus
// node stays a focusable, labelled, keyboard-operable control.
describe("CaliforniaMap accessibility", () => {
  it("exposes every campus as a focusable, labelled control", () => {
    render(
      <MemoryRouter>
        <CaliforniaMap />
      </MemoryRouter>,
    );
    const markers = screen.getAllByRole("button");
    expect(markers.length).toBe(CAMPUSES.length);
    for (const m of markers) {
      expect(m.getAttribute("tabindex")).toBe("0");
      expect(m.getAttribute("aria-label")?.trim()).toBeTruthy();
    }
  });

  it("activates a campus from the keyboard (Enter and Space)", () => {
    const picked: string[] = [];
    render(
      <MemoryRouter>
        <CaliforniaMap onPick={(c) => picked.push(c.id)} />
      </MemoryRouter>,
    );
    const markers = screen.getAllByRole("button");
    fireEvent.keyDown(markers[0], { key: "Enter" });
    fireEvent.keyDown(markers[1], { key: " " });
    expect(picked.length).toBe(2);
  });
});
