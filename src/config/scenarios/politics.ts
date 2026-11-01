// SCENARIO politics. Near-world placeholder, not sourced, not a fact about the
// real city. Replace with exact values from docs/research/ later.

export const POLITICS_SCENARIO = {
  label: "scenario",
  /** Council seats besides the mayor. SCENARIO placeholder. */
  councilSeats: 4,
  /** Votes needed to pass a measure. SCENARIO placeholder: simple majority of seated members. */
  passThreshold: "majority",
  /** Term length in years. SCENARIO placeholder. */
  termYears: 4,
  /** Interest groups and starting sentiment (0..1). SCENARIO placeholder. */
  interestGroups: {
    homeowners: 0.55,
    renters: 0.5,
    smallBusiness: 0.5,
    developers: 0.45,
    environmental: 0.5,
    publicSafety: 0.55,
  },
} as const;
