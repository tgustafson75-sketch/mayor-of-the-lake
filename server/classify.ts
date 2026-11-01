// Labels a social post with a tone and topic. The model only labels; the sim
// still decides reach and sentiment. Zod validates the label before it is used.
import { z } from "zod";
import type { AiProvider } from "../packages/ai-conversations/src/provider";
import { safeJson } from "../packages/ai-conversations/src/intent";
import { TONES, TOPICS } from "../src/sim/social";

export const PostLabel = z.object({ tone: z.enum(TONES), topic: z.enum(TOPICS) });
export type PostLabel = z.infer<typeof PostLabel>;

const SYSTEM = `Label a city mayor's social media post. Reply with JSON only, no code fence, no prose: {"tone": one of ${JSON.stringify(TONES)}, "topic": one of ${JSON.stringify(TOPICS)}}. Pick the closest topic.`;

/** Returns the label, or null when the model's reply does not validate. */
export async function classifyPost(provider: AiProvider, text: string): Promise<PostLabel | null> {
  const res = await provider.complete({ task: "classify:post", system: SYSTEM, user: text });
  const checked = PostLabel.safeParse(safeJson(res.text));
  return checked.success ? checked.data : null;
}
