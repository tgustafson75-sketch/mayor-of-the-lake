# Phase 4 report: AI conversation package

## Built (packages/ai-conversations, standalone, copyable into Gridiron Life)
- provider.ts: the one interface. Returns text and token usage.
- schemas.ts: Zod intents for vote_whip, constituent_meeting, advisor_briefing. Other conversation types wait for their phases.
- intent.ts: parse with one retry that sends the model its own validation error. If still invalid, the NPC asks Tim to clarify in character.
- resolver.ts: the sim decides the outcome from trust, offers, tone, and a seeded roll. Takes any RNG with next(), so the package does not import the game.
- dialogue.ts: writer gets the resolved outcome and only the NPC's own memory. A second classifier call checks the reply against the outcome.
- memory.ts: per-NPC structured memory, recall by tag then recency, compaction into per-session summaries.
- cost.ts: token counter. Prices are passed in, never hard-coded.
- stub-provider.ts: dev-only, can take a responder function.

## Tests (83 unit total, 22 in this package)
- Scripted player messages produce valid intents. A bad reply is retried and corrected. Persistent bad output asks for clarification.
- Resolver: deterministic; trust, offers and friendly tone raise agreement; hostile tone lowers it.
- Memory: an NPC recalls a promise from session 1 when asked in session 4.
- Dialogue: the outcome and only the NPC's memory reach the prompt.

## Important limits, stated plainly
- The "dialogue never contradicts the outcome" check is tested with a stub classifier. That proves the plumbing, not that Claude's replies are consistent. The live test needs a working Anthropic key.
- Claude provider written (server/ai/anthropic-provider.ts, models: intent claude-haiku-5-5, dialogue claude-sonnet-5-5). Not verified live: the Anthropic key from SmartGreens returns 401 (invalid or revoked). ANTHROPIC_API_KEY in server/.env is blank until you give a working key.
- Live smoke test: scripts/ai/smoke.ts. Not yet run successfully.
- Model IDs come from the platform's model list, not a live lookup. Check pricing before any cost estimate.

## Needed from Tim
- A working Anthropic API key, put in server/.env as ANTHROPIC_API_KEY. Then run `npx tsx scripts/ai/smoke.ts`.

## Update: free text provider works live (2026-11-01)
- Gemini text provider (server/ai/gemini-provider.ts) is the free option. Models: gemini-3.5-flash-lite for intents, gemini-3.5-flash for dialogue. The 2.5 models were retired for new users.
- Live smoke test (`npx tsx scripts/ai/smoke.ts`): the intent parsed to valid JSON. The consistency check correctly flagged a dialogue reply that agreed when the outcome was a counter. Live checking is working.
- Claude remains the target for dialogue quality once a working Anthropic key is supplied.
