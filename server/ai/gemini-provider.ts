// Gemini text provider. Free-tier option for intents, dialogue and checks.
// Server-side only. The key never reaches the browser.
import type { AiProvider, CompletionRequest, CompletionResult } from "../../packages/ai-conversations/src/provider";

export const GEMINI_MODELS = {
  intent: "gemini-3.5-flash-lite", // cheap, fast, fine for JSON intents
  dialogue: "gemini-3.5-flash",
  check: "gemini-3.5-flash-lite",
  classify: "gemini-3.5-flash-lite",
} as const;

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

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
      const res = await fetch(`${ENDPOINT}/${modelFor(request.task)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system }] },
          contents: [{ role: "user", parts: [{ text: request.user }] }],
          generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
        }),
      });
      const body = (await res.json()) as {
        error?: { status?: string; message?: string };
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      if (!res.ok || body.error) {
        throw new Error(`Gemini ${res.status} ${body.error?.status ?? ""} ${body.error?.message ?? ""}`.trim());
      }
      // A cut-off reply is an error, not a short answer.
      if (body.candidates?.[0]?.finishReason === "MAX_TOKENS") throw new Error(`Gemini reply was cut off at the token limit (${request.task})`);
      const text = (body.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
      return {
        text,
        usage: { inputTokens: body.usageMetadata?.promptTokenCount ?? 0, outputTokens: body.usageMetadata?.candidatesTokenCount ?? 0 },
      };
    },
  };
}
