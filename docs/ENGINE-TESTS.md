# Engine tests: Mayor of the Lake

Last run: 2026-11-02. Live model calls: NOT run (no valid key in this session). The tests use a mocked transport.

## Engine: llm-client (shared model call)
- Canonical source: `~/SmartPlay-Engines/llm-client/src/index.ts`. Vendored copy: `server/engines/llm-client/` (`index.ts` and `index.test.ts`). Copy from the canonical source when it changes.
- Behavior: one timeout per attempt (`AbortSignal.timeout`). Retries only network errors, timeouts, 429 and 5xx. Other 4xx fail at once. Never throws.
- Wired into: `server/ai/anthropic-provider.ts` and `server/ai/gemini-provider.ts`. The public shape is unchanged (`complete(request)` returns `{ text, usage }`). Error messages keep the status text. Gemini still throws on a cut-off reply (`MAX_TOKENS`).
- Timeout: 25 s per attempt (new; the old calls had none). Retry: one retry.
- Tests: `npx vitest run`, 31 files, 180 tests, all pass. The 8 engine tests are new.
- Typecheck: `npx tsc --noEmit -p tsconfig.json` exit 0.
- NOT verified: a live Claude or Gemini call, and the dialogue path in the browser.
