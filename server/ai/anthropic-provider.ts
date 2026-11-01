// Claude provider. Runs only on the server; the key never reaches the browser.
// Model choice follows the job: a small model parses intents, a larger one writes dialogue.
import type { AiProvider, CompletionRequest, CompletionResult } from "../../packages/ai-conversations/src/provider";

export const MODELS = {
  intent: "claude-haiku-5-5",
  dialogue: "claude-sonnet-5-5",
  check: "claude-haiku-5-5",
} as const;

const ENDPOINT = "https://api.anthropic.com/v1/messages";

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
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: modelFor(request.task),
          max_tokens: 400,
          system: request.system,
          messages: [{ role: "user", content: request.user }],
        }),
      });
      const body = (await res.json()) as {
        error?: { type?: string; message?: string };
        content?: { type: string; text?: string }[];
        usage?: { input_tokens: number; output_tokens: number };
      };
      if (!res.ok || body.error) {
        throw new Error(`Anthropic ${res.status} ${body.error?.type ?? ""} ${body.error?.message ?? ""}`.trim());
      }
      const text = (body.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("");
      return {
        text,
        usage: { inputTokens: body.usage?.input_tokens ?? 0, outputTokens: body.usage?.output_tokens ?? 0 },
      };
    },
  };
}
