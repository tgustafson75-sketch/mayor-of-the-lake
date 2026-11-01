// Lake model. Uses only the mechanics in docs/LAKE-SOURCES.md:
// nutrients drive algae (chlorophyll-a), algae and low oxygen drive fish stress,
// aeration raises dissolved oxygen, dredging and treatment cut nutrients, and
// the level is managed toward a documented goal band. Magnitudes are TUNABLE.
// Pure and deterministic: all randomness comes from the Rng passed in.

import { CHLOROPHYLL_TARGET_UG_PER_L, DISSOLVED_OXYGEN_FLOOR_MG_PER_L, LAKE_LEVEL_GOAL_FT } from "../config/realworld/lake";
import { Rng, type RngSnapshot } from "./rng";

export interface LakeState {
  nutrients: number; // 0..1, normalised nutrient load (TUNABLE scale)
  chlorophyll: number; // µg/L
  dissolvedOxygen: number; // mg/L
  levelFt: number;
  aeration: boolean;
  treatment: number; // 0..1, share of inflow nutrients removed by watershed treatment
  developmentRunoff: number; // 0..1, added load from lakefront development
  rng: RngSnapshot;
  log: { month: number; kind: string; detail: Record<string, number | boolean> }[];
  month: number;
}

export function createLake(seed: string): LakeState {
  return {
    nutrients: 0.6, // starts in the documented-impaired range (TUNABLE, not measured)
    chlorophyll: chlorophyllFrom(0.6),
    dissolvedOxygen: 6,
    levelFt: (LAKE_LEVEL_GOAL_FT.min + LAKE_LEVEL_GOAL_FT.max) / 2,
    aeration: false,
    treatment: 0,
    developmentRunoff: 0,
    rng: new Rng(seed).snapshot(),
    log: [],
    month: 0,
  };
}

/** Chlorophyll-a rises with nutrients. TUNABLE shape. */
function chlorophyllFrom(nutrients: number): number {
  return 10 + 80 * nutrients;
}

/** Monthly step. Relaxes nutrients to their target, then derives algae and oxygen. */
function monthlyLake(lake: LakeState): LakeState {
  const rng = new Rng(0);
  rng.restore(lake.rng);
  const inflowLoad = 0.5 + lake.developmentRunoff;
  const targetNutrients = Math.max(0, inflowLoad * (1 - lake.treatment));
  const nutrients = lake.nutrients + (targetNutrients - lake.nutrients) * 0.2;
  const chlorophyll = chlorophyllFrom(nutrients);
  // Oxygen falls with algae (decay), rises with aeration, and is capped.
  const aerationGain = lake.aeration ? 2.5 : 0;
  const dissolvedOxygen = clamp(9 - chlorophyll * 0.06 + aerationGain, 0, 12);
  // Level drifts with a seeded wet/dry swing and is pulled back toward the goal centre.
  const goal = (LAKE_LEVEL_GOAL_FT.min + LAKE_LEVEL_GOAL_FT.max) / 2;
  const levelFt = lake.levelFt + (goal - lake.levelFt) * 0.1 + (rng.next() - 0.5) * 0.4;
  const month = lake.month + 1;
  return {
    ...lake,
    nutrients,
    chlorophyll,
    dissolvedOxygen,
    levelFt,
    month,
    rng: rng.snapshot(),
    log: [...lake.log, { month, kind: "monthly", detail: { chlorophyll: round2(chlorophyll), dissolvedOxygen: round2(dissolvedOxygen) } }],
  };
}

export function setAeration(lake: LakeState, on: boolean): LakeState {
  return { ...lake, aeration: on, log: [...lake.log, { month: lake.month, kind: "aeration", detail: { on } }] };
}

/** Watershed treatment: cuts inflow nutrients by the given share, up to 90 %. */
export function setTreatment(lake: LakeState, share: number): LakeState {
  const treatment = clamp(share, 0, 0.9);
  return { ...lake, treatment, log: [...lake.log, { month: lake.month, kind: "treatment", detail: { treatment } }] };
}

/** Lakefront development adds runoff load. */
export function addDevelopmentRunoff(lake: LakeState, amount: number): LakeState {
  const developmentRunoff = clamp(lake.developmentRunoff + amount, 0, 1);
  return { ...lake, developmentRunoff, log: [...lake.log, { month: lake.month, kind: "development", detail: { developmentRunoff } }] };
}

/** Whether the lake meets both documented targets. */
export function meetsTargets(lake: LakeState): { chlorophyll: boolean; dissolvedOxygen: boolean; level: boolean } {
  return {
    chlorophyll: lake.chlorophyll <= CHLOROPHYLL_TARGET_UG_PER_L,
    dissolvedOxygen: lake.dissolvedOxygen >= DISSOLVED_OXYGEN_FLOOR_MG_PER_L,
    level: lake.levelFt >= LAKE_LEVEL_GOAL_FT.min && lake.levelFt <= LAKE_LEVEL_GOAL_FT.max,
  };
}

export function runMonths(lake: LakeState, months: number): LakeState {
  let s = lake;
  for (let i = 0; i < months; i++) s = monthlyLake(s);
  return s;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
