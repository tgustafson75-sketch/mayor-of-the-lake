// Dialogue writer and consistency check. The writer gets the resolved outcome
// and must express it. A second classifier call checks the reply against the
// outcome. The check is a test gate, and the shipped game also uses it to
// reject a reply that contradicts the outcome.
import type { AiProvider, Usage } from "./provider";
import type { Outcome } from "./resolver";
import { stripFence } from "./intent";

export interface DialogueInput {
  npcName: string;
  voice: string;
  /** Memory lines the NPC may use. Only what this NPC would know. */
  memory: string[];
  outcome: Outcome;
}

export interface DialogueResult {
  text: string;
  consistent: boolean;
  usage: Usage;
}

export async function writeDialogue(provider: AiProvider, input: DialogueInput): Promise<DialogueResult> {
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };
  const system = `You are ${input.npcName}. ${input.voice} Speak in character, two or three sentences, as spoken dialogue only: no notes, no labels, no stage directions. You must express this outcome exactly: ${input.outcome.kind} (${input.outcome.reason}).`;
  const user = input.memory.length ? `What you remember:\n- ${input.memory.join("\n- ")}` : "No earlier history.";
  const res = await provider.complete({ task: "dialogue:npc", system, user });
  add(usage, res.usage);

  const check = await provider.complete({
    task: "check:consistency",
    system: "Does this NPC reply express the required outcome? Reply JSON {\"consistent\": true|false}.",
    user: `Outcome: ${input.outcome.kind}. Reply: ${res.text}`,
  });
  add(usage, check.usage);
  return { text: res.text, consistent: parseConsistent(check.text), usage };
}

export function parseConsistent(text: string): boolean {
  try {
    const v = JSON.parse(stripFence(text)) as { consistent?: unknown };
    return v.consistent === true;
  } catch {
    return false;
  }
}

function add(into: Usage, u: Usage) {
  into.inputTokens += u.inputTokens;
  into.outputTokens += u.outputTokens;
}
