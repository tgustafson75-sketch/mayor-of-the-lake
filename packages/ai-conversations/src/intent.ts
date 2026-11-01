// Turns what Tim typed into a validated intent. The model proposes; Zod decides.
// One retry with the validation error, then the NPC asks Tim to clarify in character.
import { z } from "zod";
import type { AiProvider, Usage } from "./provider";
import { SCHEMAS, type ConversationType, type Intent } from "./schemas";

export type ParseResult =
  | { ok: true; intent: Intent; usage: Usage }
  | { ok: false; clarify: string; usage: Usage };

const CLARIFY = "I didn't quite catch what you're asking. Could you say it another way?";

export async function parseIntent(provider: AiProvider, type: ConversationType, text: string): Promise<ParseResult> {
  const schema = SCHEMAS[type];
  const task = `intent:${type}`;
  // The model must see the exact field names, or it invents its own.
  const shape = JSON.stringify(z.toJSONSchema(schema));
  const system = `Convert the player's message into JSON for the "${type}" conversation. Use exactly these fields and no others. JSON Schema: ${shape}. Reply with the JSON object only, no code fence, no prose.`;
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };

  let user = text;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await provider.complete({ task, system, user });
    usage.inputTokens += res.usage.inputTokens;
    usage.outputTokens += res.usage.outputTokens;

    const parsed = safeJson(res.text);
    const checked = schema.safeParse(parsed);
    if (checked.success) return { ok: true, intent: checked.data, usage };

    // Second attempt sends the model its own error so it can correct the JSON.
    user = `${text}\n\nYour previous reply was invalid: ${formatIssues(checked.error)}. Reply with corrected JSON only.`;
  }
  return { ok: false, clarify: CLARIFY, usage };
}

/** Parses model JSON. Models often wrap it in a code fence, so strip one first. */
export function safeJson(text: string): unknown {
  try {
    return JSON.parse(stripFence(text));
  } catch {
    return undefined;
  }
}

export function stripFence(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
}

function formatIssues(err: z.ZodError): string {
  return err.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
}
