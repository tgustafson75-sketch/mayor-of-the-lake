// Dev-only stand-in for the Claude API. Used when server/.env has no key so the
// game still runs. It is never a fallback in the shipped game: an unknown task
// throws instead of returning something generic.

import type { AiProvider, CompletionRequest } from "./provider";

const CANNED_REPLIES: Readonly<Record<string, string>> = {
  "dialogue:greeting": "Good to see you. What's on your mind?",
};

export function createStubProvider(): AiProvider {
  return {
    name: "stub",
    async complete({ task }: CompletionRequest): Promise<string> {
      const reply = CANNED_REPLIES[task];
      if (reply === undefined) {
        throw new Error(`stub provider has no canned reply for task "${task}"`);
      }
      return reply;
    },
  };
}
