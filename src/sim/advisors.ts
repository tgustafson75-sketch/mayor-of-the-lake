// Advisors brief Tim with numbers from the sim, a recommendation, and the trade-off.
// Each advisor has a skill: the chance their read of the numbers is right. A wrong
// read is a real mistake, seeded, and visible in the briefing. The sim picks nothing.
import type { Rng } from "./rng";
import type { Group } from "./social";
import { voteShare } from "./election";

export type Advisor = "chief_of_staff" | "budget" | "planning" | "communications" | "strategist";
export const ADVISORS: readonly Advisor[] = ["chief_of_staff", "budget", "planning", "communications", "strategist"];

export const ADVISOR_NAME: Record<Advisor, string> = {
  chief_of_staff: "Chief of staff (fictional)",
  budget: "Budget director (fictional)",
  planning: "Planning director (fictional)",
  communications: "Communications director (fictional)",
  strategist: "Political strategist (fictional)",
};

/** Skill from 0 to 1. SCENARIO placeholder. */
export const ADVISOR_SKILL: Record<Advisor, number> = {
  chief_of_staff: 0.85,
  budget: 0.9,
  planning: 0.8,
  communications: 0.75,
  strategist: 0.7,
};

export interface Briefing {
  advisor: Advisor;
  numbers: string;
  recommendation: "push" | "hold";
  tradeoff: string;
  /** False when the advisor's read was wrong on this run. Visible to the player. */
  reliable: boolean;
}

export interface BriefingInput {
  sentiment: Record<Group, number>;
  campaignStrength: number;
  trust: number;
}

/** Each advisor reads the same sim numbers. Skill decides whether the read is right. */
export function briefAll(input: BriefingInput, rng: Rng): Briefing[] {
  const share = voteShare(input.sentiment, input.campaignStrength);
  const pct = Math.round(share * 100);
  const lowest = (Object.keys(input.sentiment) as Group[]).reduce((a, b) => (input.sentiment[a] < input.sentiment[b] ? a : b));
  const truth = share > 0.5 ? "push" : "hold";
  return ADVISORS.map((a) => {
    const reliable = rng.next() < ADVISOR_SKILL[a];
    const recommendation = reliable ? truth : truth === "push" ? "hold" : "push";
    return {
      advisor: a,
      numbers: `Estimated vote ${pct}%, campaign strength ${input.campaignStrength}, trust ${input.trust.toFixed(2)}, weakest group ${lowest} at ${Math.round(input.sentiment[lowest] * 100)}%`,
      recommendation,
      tradeoff:
        recommendation === "push"
          ? "Pushing now uses campaign capital; the margin looks safe enough."
          : "Holding protects the margin but gives opponents time to shape the story.",
      reliable,
    };
  });
}
