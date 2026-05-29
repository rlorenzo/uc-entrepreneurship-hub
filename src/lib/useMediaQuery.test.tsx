import { describe, it, expect, afterEach } from "vite-plus/test";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./useMediaQuery.ts";

type Listener = (e: { matches: boolean }) => void;

// Controllable matchMedia stand-in so we can drive 'change' events and assert
// the hook re-renders and unsubscribes. (setup.ts installs an inert stub; this
// overrides it per-test and restores it afterward.)
function installMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  const mql = {
    get matches() {
      return matches;
    },
    media: "",
    onchange: null,
    addEventListener: (_type: string, l: Listener) => {
      listeners.add(l);
    },
    removeEventListener: (_type: string, l: Listener) => {
      listeners.delete(l);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
  window.matchMedia = ((_query: string) => mql) as unknown as typeof window.matchMedia;
  return {
    emit: (next: boolean) => {
      matches = next;
      listeners.forEach((l) => l({ matches: next }));
    },
    listenerCount: () => listeners.size,
  };
}

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("useIsMobile", () => {
  it("reflects the initial match state", () => {
    installMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when the media query changes", () => {
    const mq = installMatchMedia(false);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => mq.emit(true));
    expect(result.current).toBe(true);
  });

  it("unsubscribes the change listener on unmount", () => {
    const mq = installMatchMedia(false);
    const { unmount } = renderHook(() => useIsMobile());
    expect(mq.listenerCount()).toBe(1);

    unmount();
    expect(mq.listenerCount()).toBe(0);
  });
});
