// Coerce arbitrary newsroom date strings into ISO so the UI's
// `Date.parse` always succeeds. RSS pubDate (RFC 2822) and JSON-LD
// (ISO) parse cleanly. Drupal `<time>` elements occasionally render
// "Wed, 04/15/2026 - 12:00" (UCLA Anderson) where the " - " confuses
// V8; stripping it lets the permissive MM/DD/YYYY parser take over.

export function toIsoDate(raw: string): string {
  if (!raw) return "";
  const t = Date.parse(raw.replace(/\s+-\s+/, " "));
  return Number.isFinite(t) ? new Date(t).toISOString() : "";
}
