// The sim decides. The model never does. A resolver takes the NPC's state and
// the validated intent and returns the outcome, using the seeded RNG.
import type { VoteWhipIntent } from "./schemas";
import type { z } from "zod";

export type Outcome =
  | { kind: "agree"; reason: string }
  | { kind: "counter"; reason: string }
  | { kind: "refuse"; reason: string };

/** What the sim knows about the NPC. The model never sees more than this summary. */
export interface NpcState {
  id: string;
  /** -1 (hostile) .. 1 (loyal). */
  trust: number;
  /** Favours the player owes this NPC, positive means the player owes them. */
  favorOwed: number;
}

/** Anything with next() in [0, 1). The game passes its seeded Rng, so the package stays standalone. */
export interface Random {
  next(): number;
}

export type VoteIntent = z.infer<typeof VoteWhipIntent>;

const TONE_BIAS = { friendly: 0.1, neutral: 0, firm: -0.05, hostile: -0.3 } as const;

/**
 * Support probability: trust, a favour bonus, and tone. The outcome is drawn
 * from the seeded RNG, so the same inputs and seed always give the same result.
 */
export function resolveVoteWhip(npc: NpcState, intent: VoteIntent, rng: Random): Outcome {
  const offerBonus = intent.offer.type === "none" ? 0 : 0.15;
  const p = clamp(0.5 + npc.trust * 0.35 + offerBonus + TONE_BIAS[intent.tone], 0, 1);
  const roll = rng.next();
  if (roll < p) {
    return { kind: "agree", reason: "support" };
  }
  if (roll < p + (1 - p) * 0.5) {
    return { kind: "counter", reason: "wants something in return" };
  }
  return { kind: "refuse", reason: "not persuaded" };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
