import { describe, it, expect, beforeEach } from "vite-plus/test";
import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { CompareProvider, useCompare, MAX_COMPARE } from "./compare";

const wrapper = ({ children }: { children: ReactNode }) => (
  <CompareProvider>{children}</CompareProvider>
);

// Guards the P0: the comparison must survive a refresh/remount (localStorage),
// and never exceed MAX_COMPARE programs.
describe("compare provider", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists selections across a remount", () => {
    const first = renderHook(() => useCompare(), { wrapper });
    act(() => {
      first.result.current.add("skydeck");
      first.result.current.add("foundry");
    });
    expect(first.result.current.ids).toEqual(["skydeck", "foundry"]);
    first.unmount();

    // A fresh provider (as after a page refresh) hydrates from storage.
    const second = renderHook(() => useCompare(), { wrapper });
    expect(second.result.current.ids).toEqual(["skydeck", "foundry"]);
  });

  it(`caps the comparison at ${MAX_COMPARE} programs`, () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    const ids = Array.from({ length: MAX_COMPARE + 1 }, (_, i) => String.fromCharCode(97 + i));
    act(() => {
      ids.forEach((id) => result.current.add(id));
    });
    expect(result.current.ids).toEqual(ids.slice(0, MAX_COMPARE));
  });

  it("clear() empties the comparison", () => {
    const { result } = renderHook(() => useCompare(), { wrapper });
    act(() => {
      result.current.add("a");
      result.current.clear();
    });
    expect(result.current.ids).toEqual([]);
  });
});
