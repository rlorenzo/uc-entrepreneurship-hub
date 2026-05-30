// Best-effort: point Git at the repo's committed hooks so the pre-commit
// check suite (format, lint, type-check, fallow) runs locally. Invoked by
// the package.json "prepare" script on `vp install` / `pnpm install`.
//
// Cross-platform and non-fatal: spawnSync does not throw on a missing git
// binary (it returns `{ error }`), so a missing git or a non-git checkout
// (e.g. CI installing from a tarball) never fails the install. This avoids
// the shell-only `|| true` idiom, which is unreliable on Windows cmd.exe.
import { spawnSync } from "node:child_process";

spawnSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
