# Memory: Mayor of the Lake (dumped 2026-11-02)

## State
- Shared LLM client vendored at `server/engines/llm-client/` and wired into both providers (`server/ai/anthropic-provider.ts`, `server/ai/gemini-provider.ts`).
- Tests: 31 files, 180 tests, pass. Typecheck exit 0.
- Not verified: a live Claude or Gemini call (no valid key in this session).
- Nothing committed. Uncommitted: `server/ai/*-provider.ts`, `server/engines/llm-client/`, `docs/ENGINE-TESTS.md`, `CLAUDE.md`, this file.

## Decisions
- Timeout 25 s per attempt and one retry, from the shared engine. Old calls had no timeout.
- Models unchanged (`claude-haiku-5-5`, `claude-sonnet-5-5`, Gemini 3.5 family).

## Next
1. Live smoke test when Tim has a valid key.
2. Gemini cut-off (`MAX_TOKENS`) is still an error, as before.

## Don't
- Don't merge the `ai-conversations` package with Gridiron's copy without Tim's call (see the catalog's Mayor card).
