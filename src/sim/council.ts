// Council votes. Each member's support comes from their trust toward Tim and the
// proposal's fit with their priorities. Whipping a member is a conversation outcome
// applied to their trust. The sim applies it; the AI layer only words it.
import type { Rng } from "./rng";
import { vote, type Member, type VoteResult } from "./politics";

export interface Proposal {
  id: string;
  title: string;
}

/** Fit per member for each proposal: -1 against .. 1 for. Scenario data. */
export type FitTable = Record<string, Record<string, number>>;

export function rosterFor(proposal: Proposal, trust: Record<string, number>, fit: FitTable, ids: string[]): Member[] {
  return ids.map((id) => ({ id, trust: trust[id] ?? 0, fit: fit[proposal.id]?.[id] ?? 0 }));
}

export function runVote(proposal: Proposal, trust: Record<string, number>, fit: FitTable, ids: string[], rng: Rng): VoteResult & { proposal: string } {
  return { proposal: proposal.id, ...vote(rosterFor(proposal, trust, fit, ids), rng) };
}

/** Whipping: a successful outcome lifts that member's trust a little, a failed one costs trust. */
export function whip(trust: Record<string, number>, memberId: string, outcome: "agree" | "counter" | "refuse"): Record<string, number> {
  const delta = outcome === "agree" ? 0.15 : outcome === "counter" ? 0.02 : -0.1;
  const cur = trust[memberId] ?? 0;
  return { ...trust, [memberId]: Math.min(1, Math.max(-1, cur + delta)) };
}
