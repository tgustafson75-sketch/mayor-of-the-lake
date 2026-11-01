// Recall rules. See docs/research/recall-and-campaigns.md. TUNABLE until verified.
/** Share of registered voters whose signatures trigger a recall election. TUNABLE. */
export const RECALL_TRIGGER_SHARE = 0.25; // TUNABLE — not sourced for Lake Elsinore
/** A petition may not be filed within this many days of the official's term ending. TUNABLE. */
export const RECALL_TERM_LOCK_DAYS = 180; // TUNABLE — based on another city's code, verify
