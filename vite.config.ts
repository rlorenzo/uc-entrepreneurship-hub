import { defineConfig, type Plugin } from "vite-plus";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

// Content-Security-Policy as a <meta> tag, production build only. GitHub Pages
// can't set response headers, so the meta tag is the one CSP that reaches every
// deploy target (public/_headers adds frame-ancestors on Cloudflare). Build-only
// because the dev server needs inline scripts (React refresh preamble) and a
// websocket for HMR. The site renders crawled third-party image URLs, so the
// policy is the backstop if a data-driven injection ever slips past validation.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' https: data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

function csp(): Plugin {
  return {
    name: "csp-meta",
    apply: "build",
    transformIndexHtml: () => [
      {
        tag: "meta",
        attrs: { "http-equiv": "Content-Security-Policy", content: CSP },
        injectTo: "head-prepend",
      },
    ],
  };
}

// GitHub Pages serves at /<repo>/ — base must match for assets to resolve.
// Set VITE_GH_PAGES=1 in CI to enable the /uc-entrepreneurship-hub/ prefix.
export default defineConfig({
  fmt: {
    // Machine-generated artifacts. The crawlers write data/crawled/*.json and
    // data/news/*.json via JSON.stringify, and build-data.ts emits
    // programs.generated.ts / news.generated.ts. All round-trip every refresh;
    // format-checking them just makes the bot fight oxfmt's whitespace rules
    // without buying anything.
    ignorePatterns: [
      "data/crawled/**",
      "data/news/**",
      "src/data/programs.generated.ts",
      "src/data/news.generated.ts",
    ],
  },
  plugins: [react(), csp()],
  base: process.env.VITE_GH_PAGES === "1" ? "/uc-entrepreneurship-hub/" : "/",
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  test: {
    // Pure-logic tests live next to the code under src/ and scripts/.
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    // jsdom only matters for the component render test; pure tests ignore it.
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
