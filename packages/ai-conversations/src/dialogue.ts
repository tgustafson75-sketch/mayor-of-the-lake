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

/** Writes a reply and checks it. One retry with the mismatch stated, then the result is reported as it stands. */
export async function writeDialogue(provider: AiProvider, input: DialogueInput): Promise<DialogueResult> {
  const usage: Usage = { inputTokens: 0, outputTokens: 0 };
  const system = `You are ${input.npcName}. ${input.voice} Reply with only the words the character says aloud, two or three sentences. No drafts, no notes, no labels, no stage directions, no alternatives. You must express this outcome exactly: ${input.outcome.kind} (${input.outcome.reason}).`;
  const memory = input.memory.length ? `What you remember:\n- ${input.memory.join("\n- ")}` : "No earlier history.";

  let feedback = "";
  let text = "";
  let consistent = false;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await provider.complete({ task: "dialogue:npc", system, user: feedback ? `${memory}\n\n${feedback}` : memory });
    add(usage, res.usage);
    text = res.text;

    const check = await provider.complete({
      task: "check:consistency",
      system: "Does this NPC reply express the required outcome? Reply JSON {\"consistent\": true|false}.",
      user: `Outcome: ${input.outcome.kind}. Reply: ${text}`,
    });
    add(usage, check.usage);
    consistent = parseConsistent(check.text);
    if (consistent) break;
    feedback = `Your last reply did not clearly express "${input.outcome.kind}". Rewrite it so the outcome is unmistakable.`;
  }
  return { text, consistent, usage };
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
