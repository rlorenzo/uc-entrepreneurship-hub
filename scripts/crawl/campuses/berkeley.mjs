// Berkeley overrides. begin.berkeley.edu rolls a campus-wide directory of
// programs across Haas, Sutardja, SkyDeck, Jacobs, etc. SkyDeck and the
// Foundry live on subdomains, so we follow links to *.berkeley.edu.
export * from "./_default.mjs";

export const linkAllowlist = [
  /begin\.berkeley\.edu\/.*\/(programs?|accelerators?|incubators?|funding|courses?|competitions?|maker|labs?)/i,
  /skydeck\.berkeley\.edu/i,
  /sutardja-center\.berkeley\.edu\/programs/i,
];

export const linkDenylist = [
  /\/(news|events|blog|press|alumni|people|staff|team|faq|donate)(\/|$)/i,
  /\/category\//i,
];

export const maxSubpages = 40;
