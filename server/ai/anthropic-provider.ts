// Claude provider. Runs only on the server; the key never reaches the browser.
// Model choice follows the job: a small model parses intents, a larger one writes dialogue.
// Transport (timeout, retry, abort) is the shared engine in server/engines/llm-client.
import type { AiProvider, CompletionRequest, CompletionResult } from "../../packages/ai-conversations/src/provider";
import { callModel } from "../engines/llm-client/index";

export const MODELS = {
  intent: "claude-haiku-5-5",
  dialogue: "claude-sonnet-5-5",
  check: "claude-haiku-5-5",
  classify: "claude-haiku-5-5",
} as const;

function modelFor(task: string): string {
  const kind = task.split(":")[0] as keyof typeof MODELS;
  const model = MODELS[kind];
  if (!model) throw new Error(`no model configured for task "${task}"`);
  return model;
}

export function createAnthropicProvider(apiKey: string): AiProvider {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is empty");
  return {
    name: "anthropic",
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      const r = await callModel({
        provider: "anthropic",
        model: modelFor(request.task),
        apiKey,
        system: request.system,
        prompt: request.user,
        maxTokens: 400,
        timeoutMs: 25_000,
      });
      if (!r.ok) throw new Error(`Anthropic ${r.status} ${r.detail}`.trim());
      return { text: r.text, usage: r.usage };
    },
  };
}
