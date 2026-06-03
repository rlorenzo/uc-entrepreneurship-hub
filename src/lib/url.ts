// Guard against non-http(s) hrefs (e.g. javascript:/data:) sneaking in from
// crawled/generated data and becoming a live DOM-XSS vector. Anything that
// isn't a parseable http(s) URL is treated as unsafe so callers can suppress
// the link entirely.
export function isValidWebUrl(url: string | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
