# Decisions

Each entry: what was chosen, why, and what would change it. Newest last.

## D-001 React 18.3 with React Three Fiber 8 and drei 9 (Phase 0)
The spec pins React 18. Latest @react-three/fiber (9.x) requires React 19, so R3F 8.18 and drei 9.122 are used. Revisit if we move to React 19 (then R3F 9).

## D-002 @vitejs/plugin-react 6 (Phase 0)
plugin-react 4.x declares a peer range that stops at Vite 7. Vite 8 is in use, so plugin-react 6.x.

## D-003 TypeScript 5.9 (Phase 0)
TypeScript 7.0 exists but was not chosen: tooling and @types compatibility is safer on 5.9 for now. Revisit once the TS 7 ecosystem settles.

## D-004 Vitest 5 prints an engine warning on Node 25 (Phase 0)
Vitest 5 lists Node 22.12, 24 and 26+ in its engines field. Node 25.9 installed here works; the warning is cosmetic. Revisit if Node is pinned to 24 or if Vitest misbehaves.

## D-005 npm workspaces for the AI package (Phase 0)
packages/ai-conversations is a workspace package named @mayor/ai-conversations. The root depends on it so the game imports it by name. It has no build step; it is consumed as TypeScript source. This keeps it copyable into Gridiron Life unchanged.

## D-006 Stub AI provider throws on unknown tasks (Phase 0)
Only the stub uses canned replies, and only for keyed tasks. An unknown task throws instead of returning generic text, so a missing reply shows up in tests rather than being quietly papered over.

## D-007 Server runs with the stub until a key is present (Phase 0)
The Claude provider does not exist yet (Phase 4). /health reports ai: "stub". When the Claude provider lands it reads ANTHROPIC_API_KEY from server/.env and falls back to the stub only if the key is absent, and that absence is logged at startup.

## D-008 Ports (Phase 0)
Web dev server 5173 (strict port). Game server 8787 (override with PORT).

## D-009 Installed but not yet used (Phase 0)
Zustand, Comlink, Dexie, Zod, three/R3F are installed because the decided stack names them. They are first used in Phases 1, 2 and 4-5. Nothing imports them yet.

## D-010 Smoke test uses Playwright's Chromium headless shell (Phase 0)
Installed with `npx playwright install chromium`. No other browser is configured.
