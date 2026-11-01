// Press interviews. A reporter quotes the player's most recent post on a topic.
// The answer is scored by the sim: standing by it reinforces the groups that agree
// with it; changing position costs them; deflecting costs reputation. Pure.
import { AFFINITY, quoteBack, type Group, type SocialState, type Topic } from "./social";

export type Answer = "stand_by" | "changed_mind" | "deflect";

export interface Interview {
  day: number;
  topic: Topic;
  quotedPostId: number;
  question: string;
  answer: Answer | null;
}

export interface PressResult {
  sentiment: Record<Group, number>;
  reputationDelta: number;
  log: { day: number; kind: "interview"; detail: Record<string, string | number> }[];
}

/** Opens an interview on a topic, quoting the player's latest post there. Null if no post exists. */
export function openInterview(s: SocialState, topic: Topic, day: number): Interview | null {
  const post = quoteBack(s, topic, day + 1);
  if (!post) return null;
  return {
    day,
    topic,
    quotedPostId: post.id,
    question: `You said: "${post.text}". Do you still stand by that?`,
    answer: null,
  };
}

/** Scores the answer. Sentiment moves only for groups whose affinity on the topic is clear. */
export function answerInterview(s: SocialState, interview: Interview, answer: Answer): PressResult {
  const sentiment = { ...s.sentiment };
  let reputationDelta = 0;
  const groups = Object.keys(AFFINITY[interview.topic]) as Group[];
  const post = s.posts.find((p) => p.id === interview.quotedPostId);
  const stance = post ? Math.sign(groups.reduce((sum, g) => sum + AFFINITY[interview.topic][g] * (post.tone === "hostile" ? -1 : 1), 0)) : 0;

  if (answer === "stand_by") {
    for (const g of groups) if (Math.abs(AFFINITY[interview.topic][g]) > 0.5) sentiment[g] = clamp(sentiment[g] + 0.03 * Math.sign(AFFINITY[interview.topic][g]) * stance, 0, 1);
    reputationDelta = 2;
  } else if (answer === "changed_mind") {
    for (const g of groups) if (Math.abs(AFFINITY[interview.topic][g]) > 0.5) sentiment[g] = clamp(sentiment[g] - 0.04 * Math.sign(AFFINITY[interview.topic][g]) * stance, 0, 1);
    reputationDelta = -1;
  } else {
    reputationDelta = -3;
  }
  return {
    sentiment,
    reputationDelta,
    log: [{ day: interview.day, kind: "interview", detail: { topic: interview.topic, answer, quotedPostId: interview.quotedPostId, reputationDelta } }],
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
