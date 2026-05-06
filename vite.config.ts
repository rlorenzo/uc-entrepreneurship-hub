import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

declare const process: { env: Record<string, string | undefined> };

// GitHub Pages serves at /<repo>/ — base must match for assets to resolve.
// Set VITE_GH_PAGES=1 in CI to enable the /uc-entrepreneurship-hub/ prefix.
export default defineConfig({
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
