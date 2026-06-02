// Berkeley overrides. begin.berkeley.edu rolls a campus-wide directory of
// programs across Haas, Sutardja, SkyDeck, Jacobs, etc. SkyDeck and the
// Foundry live on subdomains, so we follow links to *.berkeley.edu.
export * from "./_default.mjs";

// Anchored to the URL scheme + host so the pattern matches the *host* of the
// link, not an arbitrary substring. Without the `^https?://` anchor and the
// trailing host boundary, a hostile URL like
// `https://evil.com/?x=skydeck.berkeley.edu` or `https://skydeck.berkeley.edu.evil.com`
// would slip past the allowlist (CodeQL js/regex/missing-regexp-anchor).
export const linkAllowlist = [
  /^https?:\/\/begin\.berkeley\.edu\/.*\/(programs?|accelerators?|incubators?|funding|courses?|competitions?|maker|labs?)/i,
  /^https?:\/\/skydeck\.berkeley\.edu(?:[:/]|$)/i,
  /^https?:\/\/sutardja-center\.berkeley\.edu(?::\d+)?\/programs/i,
];

export const linkDenylist = [
  /\/(news|events|blog|press|alumni|people|staff|team|faq|donate)(\/|$)/i,
  /\/category\//i,
];

export const maxSubpages = 40;
