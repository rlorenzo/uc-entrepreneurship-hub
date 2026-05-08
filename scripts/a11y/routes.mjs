// Hash-router routes exercised by the a11y suite. Pa11y and axe-core/playwright
// both read this list so the two tools cover the same surface area.
export const ROUTES = [
  { name: "Home", hash: "/" },
  { name: "Discover", hash: "/discover" },
  { name: "Campuses", hash: "/campuses" },
  { name: "Compare", hash: "/compare" },
  { name: "News", hash: "/news" },
  { name: "Campus (Davis)", hash: "/campus/davis" },
  {
    name: "Program (Davis Aggie Venture Accelerator)",
    hash: "/program/davis-aggie-venture-accelerator",
  },
];

const BASE_URL = process.env.A11Y_BASE_URL ?? "http://localhost:4173";

export function urlFor(route) {
  return `${BASE_URL}/#${route.hash}`;
}
