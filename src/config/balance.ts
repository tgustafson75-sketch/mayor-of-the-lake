// Tuning knobs for the sim. Anything here is a game-design choice, not a fact
// about the real city, so none of it is sourced. Each value names what it controls.
// Every value is TUNABLE until the Phase 5.5 research sets the real rules.

/** Seed used when the player does not type one. */
export const DEFAULT_SEED = "lake-elsinore";

export const BALANCE = {
  /** Parcels per side of the city grid. TUNABLE. */
  gridSize: 24,
  /** Housing units on one residential parcel. TUNABLE. */
  housingPerParcel: 40,
  /** Jobs on one commercial parcel. TUNABLE. */
  jobsPerParcel: 30,
  /** Share of housing that can be occupied before growth stops. TUNABLE. */
  occupancyCap: 0.95,
  /** Population supported per job. TUNABLE. */
  jobsToPopulation: 1.6,
  /** Fraction of the gap to the target that closes each month. TUNABLE. */
  monthlyAdjustRate: 0.35,
  /** Random monthly swing in people. TUNABLE. */
  monthlyNoise: 120,
} as const;
