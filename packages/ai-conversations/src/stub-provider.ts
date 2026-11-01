// Dev-only stand-in for the Claude API. Used when no key is present so the game
// runs. Never a fallback in the shipped game: an unknown task throws.
//
// Two forms: canned replies keyed by task, and a responder function for tests
// that need replies to depend on the prompt.

import type { AiProvider, CompletionRequest, CompletionResult } from "./provider";

export type Responder = (request: CompletionRequest) => string;

const CANNED_REPLIES: Readonly<Record<string, string>> = {
  "dialogue:greeting": "Good to see you. What's on your mind?",
};

/** Rough token count for the stub's usage report: about four characters per token. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function toResult(request: CompletionRequest, text: string): CompletionResult {
  return { text, usage: { inputTokens: estimateTokens(request.system + request.user), outputTokens: estimateTokens(text) } };
}

export function createStubProvider(responder?: Responder): AiProvider {
  return {
    name: "stub",
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      if (responder) return toResult(request, responder(request));
      const reply = CANNED_REPLIES[request.task];
      if (reply === undefined) {
        throw new Error(`stub provider has no canned reply for task "${request.task}"`);
      }
      return toResult(request, reply);
    },
  };
}
