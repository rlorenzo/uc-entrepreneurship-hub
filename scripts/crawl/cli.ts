// Shared CLI flag parsing for the crawlers. Both `vp run crawl` and
// `vp run crawl:news` accept `--campus=<csv>` to restrict the run to a
// subset of campus IDs; this module is the one place the parsing lives.

export function parseCampusFlag(argv: string[] = process.argv.slice(2)): Set<string> | null {
  for (const arg of argv) {
    const m = arg.match(/^--campus=(.+)$/);
    if (!m) continue;
    const ids = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return null;
    return new Set(ids);
  }
  return null;
}

export function filterSitesByCampus<T extends { campus: string }>(
  sites: T[],
  campus: Set<string> | null,
): T[] {
  return campus ? sites.filter((s) => campus.has(s.campus)) : sites;
}
