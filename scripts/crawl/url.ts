// Safe URL parsing shared by every crawler entry point (program extractor,
// news scraper, RSS fetcher). One implementation means a hardening change —
// e.g. lowercasing hostnames or rejecting non-http schemes — reaches all
// pipelines at once instead of drifting per copy.

export function safeUrl(href: string | null | undefined): URL | null {
  if (!href) return null;
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

export function hostOf(url: string): string | undefined {
  return safeUrl(url)?.hostname;
}
