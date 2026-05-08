// Runs axe-core against the production build over Playwright Chromium.
// Assumes a server is already serving the build at A11Y_BASE_URL (default
// http://localhost:4173) — `pnpm a11y` handles spawning vp preview.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { ROUTES, urlFor } from "./routes.mjs";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

function formatNode(node) {
  const target = Array.isArray(node.target) ? node.target.join(" ") : node.target;
  return `      ${target}\n        ${node.failureSummary?.replace(/\n/g, "\n        ") ?? ""}`;
}

function formatViolation(v) {
  const nodes = v.nodes.slice(0, 3).map(formatNode).join("\n");
  const more = v.nodes.length > 3 ? `\n      … and ${v.nodes.length - 3} more node(s)` : "";
  return `  - [${v.impact ?? "n/a"}] ${v.id}: ${v.help}\n    ${v.helpUrl}\n${nodes}${more}`;
}

const browser = await chromium.launch();
let totalViolations = 0;
const summary = [];

try {
  for (const route of ROUTES) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const url = urlFor(route);
    await page.goto(url, { waitUntil: "networkidle" });
    // HashRouter renders client-side; wait for the app shell.
    await page.waitForSelector("main, [role='main'], #root *", { timeout: 5000 }).catch(() => {});

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    const count = results.violations.reduce((n, v) => n + v.nodes.length, 0);
    totalViolations += count;
    summary.push({ route, violations: results.violations, count });

    console.log(`\n${route.name} (${url})`);
    if (results.violations.length === 0) {
      console.log("  ok — no axe violations");
    } else {
      console.log(`  ${count} violation node(s) across ${results.violations.length} rule(s):`);
      for (const v of results.violations) console.log(formatViolation(v));
    }
    await context.close();
  }
} finally {
  await browser.close();
}

console.log(`\nTotal axe violation nodes: ${totalViolations}`);
process.exit(totalViolations > 0 ? 1 : 0);
