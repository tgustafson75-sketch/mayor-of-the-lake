// Council vote model over SCENARIO seats. Each member's yes-probability comes
// from trust and the proposal's fit with their priorities. The roll is seeded.
// Scenario only: the seat count and thresholds are placeholders.
import { POLITICS_SCENARIO } from "../config/scenarios/politics";
import type { Rng } from "./rng";

export interface Member {
  id: string;
  /** -1 (hostile) .. 1 (loyal) toward the player. */
  trust: number;
  /** -1 (against) .. 1 (for) on this proposal's topic. */
  fit: number;
}

export interface VoteResult {
  yes: number;
  no: number;
  passed: boolean;
}

/** Yes-probability for one member: an even chance nudged by trust and topic fit. */
export function yesChance(m: Member): number {
  return clamp(0.5 + m.trust * 0.3 + m.fit * 0.3, 0, 1);
}

export function vote(members: Member[], rng: Rng): VoteResult {
  let yes = 0;
  for (const m of members) if (rng.next() < yesChance(m)) yes++;
  const no = members.length - yes;
  const needed = Math.floor(members.length / 2) + 1; // simple majority of seated members
  return { yes, no, passed: yes >= needed };
}

/** The council seats the scenario calls for, as a starting roster with neutral trust. */
export function scenarioRoster(): Member[] {
  return Array.from({ length: POLITICS_SCENARIO.councilSeats + 1 }, (_, i) => ({ id: `member-${i + 1}`, trust: 0, fit: 0 }));
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
