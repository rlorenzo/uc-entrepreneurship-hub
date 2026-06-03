// External destinations that live outside the app (the project's GitHub).
// Centralized so the footer, About page, and anywhere else share one source of
// truth for the contribution URLs. The `?template=` deep-links open a specific
// GitHub Issue *form* (see .github/ISSUE_TEMPLATE/) so the public can submit
// structured details without forking the repo or editing data files.
const REPO = "https://github.com/rlorenzo/uc-entrepreneurship-hub";

/** Issue form for proposing a brand-new program. */
export const SUBMIT_PROGRAM_URL = `${REPO}/issues/new?template=submit-program.yml`;

/** Issue form for correcting an existing program's metadata. */
export const SUGGEST_EDIT_URL = `${REPO}/issues/new?template=update-program.yml`;
