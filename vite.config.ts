import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

// GitHub Pages serves at /<repo>/ — base must match for assets to resolve.
// Set VITE_GH_PAGES=1 in CI to enable the /uc-entrepreneurship-hub/ prefix.
export default defineConfig({
  fmt: {
    // Machine-generated artifacts. The crawler writes data/crawled/*.json
    // via JSON.stringify, and build-data.ts emits programs.generated.ts /
    // news.generated.ts. All round-trip every refresh; format-checking
    // them just makes the bot fight oxfmt's whitespace rules without
    // buying anything.
    ignorePatterns: [
      "data/crawled/**",
      "src/data/programs.generated.ts",
      "src/data/news.generated.ts",
    ],
  },
  plugins: [react()],
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
});
