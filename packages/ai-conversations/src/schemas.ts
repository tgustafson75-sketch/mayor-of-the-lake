// Zod schemas for each conversation type. The intent parser validates model
// output against these before the sim sees it. Only the types the game uses
// now are here; the rest are added with their phases.
import { z } from "zod";

export const Tone = z.enum(["friendly", "neutral", "firm", "hostile"]);

/** Whip a council vote: ask a member to support a proposal, optionally offering something. */
export const VoteWhipIntent = z.object({
  intent: z.literal("vote_whip"),
  proposalId: z.string().min(1),
  offer: z
    .object({ type: z.enum(["support_their_project", "favor", "none"]), targetId: z.string().optional() })
    .default({ type: "none" }),
  tone: Tone,
});

/** Constituent meeting: a resident raises an issue. */
export const ConstituentIntent = z.object({
  intent: z.literal("constituent_meeting"),
  issueId: z.string().min(1),
  response: z.enum(["promise_action", "explain", "deflect"]),
  tone: Tone,
});

/** Advisor briefing: Tim asks an advisor for a recommendation on a topic. */
export const AdvisorIntent = z.object({
  intent: z.literal("advisor_briefing"),
  topic: z.string().min(1),
  tone: Tone,
});

export const SCHEMAS = {
  vote_whip: VoteWhipIntent,
  constituent_meeting: ConstituentIntent,
  advisor_briefing: AdvisorIntent,
} as const;

export type ConversationType = keyof typeof SCHEMAS;
export type Intent = z.infer<(typeof SCHEMAS)[ConversationType]>;
