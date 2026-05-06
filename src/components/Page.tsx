import type { ReactNode } from "react";
import { Nav } from "./Nav";
import { Footer } from "./Footer";

export function Page({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#fff",
        color: "#002033",
      }}
    >
      <Nav />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
