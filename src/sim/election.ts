// Elections (Phase 8, scenario). A seat is won by weighted support across interest
// groups, plus campaign strength, plus one seeded roll. Pure and deterministic.
// Term length and the election cycle come from the SCENARIO (D-019), not the real rules.
import { POLITICS_SCENARIO } from "../config/scenarios/politics";
import { Rng } from "./rng";
import type { Group } from "./social";

/** How much each interest group counts toward the vote. SCENARIO placeholder, sums to 1. */
export const GROUP_WEIGHT: Record<Group, number> = {
  homeowners: 0.25,
  renters: 0.2,
  smallBusiness: 0.15,
  developers: 0.1,
  environmental: 0.15,
  publicSafety: 0.15,
};

export interface Campaign {
  /** Campaign strength, 0..100, built by campaign blocks. */
  strength: number;
  /** Days until the next election. Resets to the term length after each one. */
  daysToElection: number;
}

export const TERM_DAYS = POLITICS_SCENARIO.termYears * 360; // calendar: 360-day years (D-017)

export function createCampaign(): Campaign {
  return { strength: 0, daysToElection: TERM_DAYS };
}

/** Each campaign block adds strength, up to 100. */
export function addCampaignWork(c: Campaign, points = 8): Campaign {
  return { ...c, strength: Math.min(100, c.strength + points) };
}

/** Vote share in 0..1 from sentiment, weighted by group, and campaign strength. */
export function voteShare(sentiment: Record<Group, number>, strength: number): number {
  const base = (Object.keys(GROUP_WEIGHT) as Group[]).reduce((sum, g) => sum + sentiment[g] * GROUP_WEIGHT[g], 0);
  return Math.min(1, Math.max(0, base * 0.85 + (strength / 100) * 0.15));
}

export interface ElectionResult {
  won: boolean;
  share: number;
}

/** Resolves one election with a seeded roll around the expected share. */
export function runElection(sentiment: Record<Group, number>, strength: number, rng: Rng): ElectionResult {
  const share = voteShare(sentiment, strength);
  const noise = (rng.next() - 0.5) * 0.1; // ±5 points of luck
  const final = Math.min(1, Math.max(0, share + noise));
  return { won: final > 0.5, share: final };
}

/** Chance to win, estimated over many seeded elections. Shown to the player as a probability. */
export function winChance(sentiment: Record<Group, number>, strength: number, trials = 400, seed = "election-odds"): number {
  const rng = new Rng(seed);
  let wins = 0;
  for (let i = 0; i < trials; i++) if (runElection(sentiment, strength, rng).won) wins++;
  return wins / trials;
}

/** Advances the clock one day. Returns the election result when it falls due. */
export function tickCampaign(c: Campaign, sentiment: Record<Group, number>, rng: Rng): { campaign: Campaign; result: ElectionResult | null } {
  if (c.daysToElection > 1) return { campaign: { ...c, daysToElection: c.daysToElection - 1 }, result: null };
  const result = runElection(sentiment, c.strength, rng);
  return { campaign: { strength: 0, daysToElection: TERM_DAYS }, result };
}
