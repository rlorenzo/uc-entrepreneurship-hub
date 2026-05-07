const NEWS_DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatNewsDate(iso: string): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  return Number.isFinite(t) ? NEWS_DATE_FMT.format(new Date(t)) : "";
}
