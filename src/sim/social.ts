// Social feed (Phase 7). A post reaches each interest group with a sentiment change
// computed by the sim from the group's interest in the topic, the tone, and the
// author's reputation. Pure and deterministic. Affinities are SCENARIO placeholders.
import { POLITICS_SCENARIO } from "../config/scenarios/politics";

export type Tone = "friendly" | "neutral" | "firm" | "hostile";
export type Topic = "housing" | "lake" | "jobs" | "safety" | "taxes";
export type Group = keyof typeof POLITICS_SCENARIO.interestGroups;

export interface Post {
  id: number;
  day: number;
  text: string;
  tone: Tone;
  topic: Topic;
  /** Sentiment change per group, applied when the post lands. */
  impact: Record<Group, number>;
  reach: number;
}

export interface SocialState {
  posts: Post[];
  sentiment: Record<Group, number>;
  log: { day: number; kind: "post" | "sentiment" | "interview"; detail: Record<string, string | number> }[];
}

/** How much each group cares about each topic, -1 (opposed) .. 1 (in favour). SCENARIO placeholder. */
export const AFFINITY: Record<Topic, Record<Group, number>> = {
  housing: { homeowners: -0.4, renters: 0.8, smallBusiness: 0.2, developers: 0.9, environmental: -0.5, publicSafety: 0 },
  lake: { homeowners: 0.5, renters: 0.3, smallBusiness: 0.3, developers: -0.2, environmental: 0.9, publicSafety: 0.1 },
  jobs: { homeowners: 0.2, renters: 0.6, smallBusiness: 0.8, developers: 0.5, environmental: -0.3, publicSafety: 0 },
  safety: { homeowners: 0.6, renters: 0.4, smallBusiness: 0.3, developers: 0, environmental: 0, publicSafety: 0.9 },
  taxes: { homeowners: -0.7, renters: -0.3, smallBusiness: -0.5, developers: -0.2, environmental: 0, publicSafety: 0.1 },
};

const TONE_FACTOR: Record<Tone, number> = { friendly: 0.5, neutral: 0.3, firm: 0.2, hostile: -0.6 };
const GROUPS = Object.keys(POLITICS_SCENARIO.interestGroups) as Group[];

export function createSocial(): SocialState {
  return {
    posts: [],
    sentiment: { ...POLITICS_SCENARIO.interestGroups },
    log: [],
  };
}

/** Publishes a post. Reach grows with the author's reputation and falls for hostile tone. */
export function publish(s: SocialState, input: { day: number; text: string; tone: Tone; topic: Topic; reputation: number }): SocialState {
  if (input.text.trim().length === 0) throw new RangeError("a post needs text");
  const reach = Math.round((50 + input.reputation * 4) * (input.tone === "hostile" ? 0.7 : 1));
  const impact = Object.fromEntries(
    GROUPS.map((g) => [g, round3(AFFINITY[input.topic][g] * TONE_FACTOR[input.tone] * 0.1)]),
  ) as Record<Group, number>;
  const post: Post = { id: s.posts.length + 1, day: input.day, text: input.text.trim(), tone: input.tone, topic: input.topic, impact, reach };
  const sentiment = { ...s.sentiment };
  for (const g of GROUPS) sentiment[g] = clamp(sentiment[g] + impact[g], 0, 1);
  return {
    posts: [...s.posts, post],
    sentiment,
    log: [
      ...s.log,
      { day: input.day, kind: "post", detail: { id: post.id, topic: input.topic, tone: input.tone, reach } },
      ...GROUPS.map((g) => ({ day: input.day, kind: "sentiment" as const, detail: { group: g, change: impact[g] } })),
    ],
  };
}

/** The most recent earlier post on a topic, for an NPC to quote back. Null if there is none. */
export function quoteBack(s: SocialState, topic: Topic, beforeDay: number): Post | null {
  const earlier = s.posts.filter((p) => p.topic === topic && p.day < beforeDay);
  return earlier.length ? earlier[earlier.length - 1] : null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}
