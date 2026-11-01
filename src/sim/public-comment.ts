// Public comment before a vote. Speakers' stance follows the interest groups' sentiment,
// drawn with the seeded RNG. The count reflects the city's mood; it does not change the vote.
import type { Rng } from "./rng";
import type { Group } from "./social";

export interface Speaker {
  group: Group;
  stance: "for" | "against";
}

export interface PublicComment {
  speakers: Speaker[];
  supporters: number;
  opponents: number;
}

/** Each group contributes speakers in proportion to how strongly it cares, with stance from its sentiment. */
export function publicComment(sentiment: Record<Group, number>, rng: Rng, speakersPerGroup = 3): PublicComment {
  const speakers: Speaker[] = [];
  for (const g of Object.keys(sentiment) as Group[]) {
    for (let i = 0; i < speakersPerGroup; i++) {
      if (rng.next() < 0.5) {
        speakers.push({ group: g, stance: rng.next() < sentiment[g] ? "for" : "against" });
      }
    }
  }
  const supporters = speakers.filter((s) => s.stance === "for").length;
  return { speakers, supporters, opponents: speakers.length - supporters };
}
