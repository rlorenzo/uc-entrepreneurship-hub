// Spawn `vp preview` against the latest build, wait for the port to open,
// then run axe + pa11y in series. Always tear down the preview server on
// exit so this is safe to run locally and in CI.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import net from "node:net";

const PORT = Number(process.env.A11Y_PORT ?? 4173);
const HOST = "localhost";

function tryConnect(port, host) {
  return new Promise((resolve) => {
    const s = net.createConnection({ port, host }, () => {
      s.end();
      resolve(true);
    });
    s.on("error", () => resolve(false));
  });
}

async function waitForPort(port, host, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await tryConnect(port, host)) return;
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${host}:${port}`);
}

const preview = spawn("node_modules/.bin/vp", ["preview", "--port", String(PORT)], {
  stdio: ["ignore", "inherit", "inherit"],
  env: { ...process.env },
});

let exitCode = 0;
const cleanup = () => {
  if (!preview.killed) preview.kill("SIGTERM");
};
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

try {
  await waitForPort(PORT, HOST);
  process.env.A11Y_BASE_URL = `http://${HOST}:${PORT}`;

  for (const cmd of ["scripts/a11y/axe.mjs", null]) {
    const child = cmd
      ? spawn("node", [cmd], { stdio: "inherit", env: process.env })
      : spawn("node_modules/.bin/pa11y-ci", ["--config", ".pa11yci.json"], {
          stdio: "inherit",
          env: process.env,
        });
    const [code] = await once(child, "exit");
    if (code !== 0) exitCode = code ?? 1;
  }
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  cleanup();
}

process.exit(exitCode);
