// Recall. A petition needs signatures from a share of voters, and it cannot be filed
// within the term lock. Thresholds are TUNABLE (docs/research/recall-and-campaigns.md).
import { RECALL_TERM_LOCK_DAYS, RECALL_TRIGGER_SHARE } from "../config/realworld/recall";
import type { Group } from "./social";

/** Share of voters who would sign, estimated from sentiment: the unhappy sign. */
export function signingShare(sentiment: Record<Group, number>): number {
  const groups = Object.keys(sentiment) as Group[];
  return groups.reduce((sum, g) => sum + Math.max(0, 0.5 - sentiment[g]), 0) / groups.length;
}

export function canFile(daysLeftInTerm: number): boolean {
  return daysLeftInTerm > RECALL_TERM_LOCK_DAYS;
}

/** A petition succeeds when signatures reach the trigger share and filing is allowed. */
export function petitionQualifies(sentiment: Record<Group, number>, daysLeftInTerm: number): { qualifies: boolean; share: number; reason: string } {
  const share = signingShare(sentiment);
  if (!canFile(daysLeftInTerm)) return { qualifies: false, share, reason: "too close to the end of the term to file" };
  if (share < RECALL_TRIGGER_SHARE) return { qualifies: false, share, reason: "not enough signatures" };
  return { qualifies: true, share, reason: "petition qualifies for a recall election" };
}
