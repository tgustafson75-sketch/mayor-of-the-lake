// Gemini text provider. Free-tier option for intents, dialogue and checks.
// Server-side only. The key never reaches the browser.
// Transport (timeout, retry, abort) is the shared engine in server/engines/llm-client.
import type { AiProvider, CompletionRequest, CompletionResult } from "../../packages/ai-conversations/src/provider";
import { callModel } from "../engines/llm-client/index";

export const GEMINI_MODELS = {
  intent: "gemini-3.5-flash-lite", // cheap, fast, fine for JSON intents
  dialogue: "gemini-3.5-flash",
  check: "gemini-3.5-flash-lite",
  classify: "gemini-3.5-flash-lite",
} as const;

function modelFor(task: string): string {
  const kind = task.split(":")[0] as keyof typeof GEMINI_MODELS;
  const model = GEMINI_MODELS[kind];
  if (!model) throw new Error(`no Gemini model configured for task "${task}"`);
  return model;
}

export function createGeminiProvider(apiKey: string): AiProvider {
  if (!apiKey) throw new Error("GEMINI_API_KEY is empty");
  return {
    name: "gemini",
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      const r = await callModel({
        provider: "gemini",
        model: modelFor(request.task),
        apiKey,
        system: request.system,
        prompt: request.user,
        maxTokens: 2048,
        temperature: 0.7,
        timeoutMs: 25_000,
      });
      if (!r.ok) throw new Error(`Gemini ${r.status} ${r.detail}`.trim());
      // A cut-off reply is an error, not a short answer.
      if (r.finishReason === "MAX_TOKENS") throw new Error(`Gemini reply was cut off at the token limit (${request.task})`);
      return { text: r.text, usage: r.usage };
    },
  };
}
