// The one interface every AI backend implements. The language model never
// touches game state: it receives a prompt and returns text and usage.

export interface CompletionRequest {
  /** Names the job, e.g. "intent:vote_whip" or "dialogue:council_reply". Stub providers key replies on this. */
  readonly task: string;
  readonly system: string;
  readonly user: string;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface CompletionResult {
  text: string;
  usage: Usage;
}

export interface AiProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}
