// Render in Pacific time: every source is a California (UC) newsroom, and the
// crawler stores publish dates anchored to Pacific, so formatting in the
// viewer's local zone could shift the displayed calendar date by a day.
const NEWS_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

export function formatNewsDate(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  return Number.isFinite(t) ? NEWS_DATE_FMT.format(new Date(t)) : "";
}
