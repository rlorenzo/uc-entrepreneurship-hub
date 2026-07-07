import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";

/**
 * Preserve-on-empty write shared by both crawlers. When a run comes back
 * empty and a previous file exists, keep the previous run: a seed failure, a
 * WAF 403ing every sub-page, a zero-link redesign, an Atom-migrated feed, or
 * an HTTP-200 maintenance page all look the same on disk — an empty list the
 * weekly workflow would commit, blanking the campus's published catalog or
 * news feed. A recovered crawl on the next run repopulates it cleanly.
 *
 * One implementation so a policy change (e.g. also preserving on partial
 * results) reaches both pipelines instead of drifting per copy.
 */
export async function persistPreservingPrevious(options: {
  path: string;
  label: string;
  isEmpty: boolean;
  emptyReason: string;
  result: unknown;
}): Promise<void> {
  if (options.isEmpty && existsSync(options.path)) {
    console.log(`  ⓘ preserving previous ${options.label} — ${options.emptyReason}`);
    return;
  }
  await writeFile(options.path, JSON.stringify(options.result, null, 2));
}
