// Governance rules for Lake Elsinore. Each value cites docs/research/governance.md.
// SECONDARY = from a news or reference source, to verify against the municipal code.
// TUNABLE = not found, a scenario placeholder (D-019).

/** Council members who are elected, by district. SECONDARY: Patch. */
export const COUNCIL_ELECTED_SEATS = 5;

/** Council term length, years. SECONDARY: Patch. */
export const COUNCIL_TERM_YEARS = 4;

/** Mayor is chosen by a council vote each December, not elected directly. SECONDARY: Patch, Valley News. */
export const MAYOR_SELECTION = "council-vote-annual" as const;

/** Direct election of the mayor is an alternate-history toggle only. Not the real process. */
export const MAYOR_DIRECT_ELECTION_IS_REAL = false;

/** Recall signature threshold, share of registered voters. TUNABLE: secondary source, not verified for this city. */
export const RECALL_SIGNATURE_SHARE = 0.25; // TUNABLE — verify against the municipal code
