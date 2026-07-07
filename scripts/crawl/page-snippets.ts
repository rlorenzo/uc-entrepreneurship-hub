// In-page JS source strings shared by every Playwright extractor that pulls a
// hero image: the program extractor (extract.ts), the news scraper
// (news/scrape.ts), and the image enricher (news/enrich.ts). They are source
// strings rather than functions because they execute inside page.evaluate in
// the browser context. Keeping the heuristic in one place means tuning the
// selector list or the junk-image filter once instead of three times — the
// copies had already drifted (.blog-post vs .entry-content selectors).

// First non-icon <img> inside the article/main body, resolved absolute
// against the page URL (a body src can be path-relative, so origin-only
// resolution at build time would drop the path segment).
export const IN_PAGE_BODY_IMAGE_FN = `(() => {
  const imgs = Array.from(
    document.querySelectorAll(
      "article img, main img, .entry-content img, .post-content img, .blog-post img",
    ),
  );
  for (const el of imgs) {
    const src = el.getAttribute("src");
    if (!src) continue;
    if (/icon|logo|sprite|avatar/i.test(src)) continue;
    try {
      return new URL(src, location.href).toString();
    } catch (e) {
      // skip unparseable src
    }
  }
  return "";
})`;

// og:image with the body-image fallback — the shape the news pipeline wants.
// (The program extractor composes IN_PAGE_BODY_IMAGE_FN itself because it
// also collects twitter:image and hero CSS backgrounds as candidates.)
export const IN_PAGE_HERO_IMAGE_FN = `(() => {
  const meta = (n) =>
    document.querySelector('meta[property="' + n + '"], meta[name="' + n + '"]')?.content || "";
  return meta("og:image") || (${IN_PAGE_BODY_IMAGE_FN})();
})`;
