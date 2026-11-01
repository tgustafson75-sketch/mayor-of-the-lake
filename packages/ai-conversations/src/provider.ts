// The one interface every AI backend implements. The language model never
// touches game state: it only receives a prompt and returns text.

export interface CompletionRequest {
  /** Names the job, e.g. "intent:request_vote" or "dialogue:council_reply". Stub providers key canned replies on this. */
  readonly task: string;
  readonly system: string;
  readonly user: string;
}

export interface AiProvider {
  readonly name: string;
  complete(request: CompletionRequest): Promise<string>;
}
