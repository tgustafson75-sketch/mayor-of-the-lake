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

## D-011 Addendum 1 accepted into the plan (2026-11)
docs/ADDENDUM-1.md adds time controls, daily/weekly/monthly/yearly loops, camera presets, four game modes, a real-world research phase (5.5) with a STOP, and a commitments ledger. Addendum wins over the main prompt on conflicts. Phase 1 has not started: Phase 0 review is still pending.

## D-012 Visual style: close realistic 3D (Tim, 2026-11-01)
Tim chose "close realistic 3D" over the spec's stylized low-poly. Target: real-time Three.js with PBR materials, soft shadows, lighting and post-processing, using real OSM and 3DEP geometry, matching the mood and layout of the Lakefront mockups. Exact pixel match to AI renders is not a goal. This supersedes the "stylized low-poly tilt-shift" line in the main prompt. Open: Gridiron Life's style guide says "illustrated, not photoreal." Tim has not yet said whether "both" includes Gridiron Life.

## D-013 Phase 1 map pipeline (2026-11-01)
- Raw inputs are cached in data/raw/ (gitignored). Processed output is committed to data/processed/ so the game builds without a network.
- Geometry is projected to local metres (equirectangular at the city centre). This is accurate to a few metres across the 19 km box.
- The DEM row order is north-first. Terrain indices are counter-clockwise from above. Terrain under water is carved down to the lake bed.
- Display-only constants (vertical exaggeration 2x, lake-bed depth 4 m, default building height 7 m, road widths) are marked TUNABLE in code. None of them feed the sim.

## D-014 Front page and HUD palette (2026-11-01)
Charcoal (#14161A family) with gold accent (#F4C430), taken from the Gridiron Life style guide so the two games read as one family. The front page is the main menu over a slowly orbiting city. #map opens the full HUD. The HUD shows only sourced values (population from CA DOF). Sim values (budget, year, jobs, ratings) are blank until their phases.

## D-015 Deployment (2026-11-01)
Static Vite build deployed to Vercel project `mayorofthelake`: https://mayorofthelake.vercel.app. The server/ proxy is not deployed yet (no AI until Phase 4). Re-deploy with `vercel deploy --prod --yes --name mayorofthelake`.

## D-016 Phase 2 budget deferred (2026-11-01)
The plan puts a budget in Phase 2. The addendum requires real-world rules research before any money or politics system. The addendum wins. Phase 2 builds time controls, loops, zoning and growth. The budget waits for the Phase 5.5 research.

## D-017 Simplified calendar (2026-11-01)
12 months of 30 days, 360 days a year. Chosen so the loops are simple and testable. A real-calendar mode is a later decision, and the addendum's "real election cycle" will need it.

## D-018 Abstract zones and growth (2026-11-01)
Zones are generic types. Growth is a monthly pull toward a target (the lower of housing capacity and jobs-supported population), with seeded noise. This is a placeholder model for testing, not a claim about how Lake Elsinore grows. All constants are TUNABLE.
