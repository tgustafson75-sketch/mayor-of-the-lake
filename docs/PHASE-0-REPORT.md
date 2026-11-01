# Phase 0 report: Scaffold

**Status:** complete, awaiting Tim's review.

## Discovery
- Node v25.9.0 (requirement: 20+).
- Folder created at `mayor-of-the-lake/`, `git init` run. The parent home directory is not a repo.
- No `server/.env` existed, so the stub AI provider is in use.

## Built
- Vite 8 + React 18.3 + TypeScript 5.9 (strict) + Tailwind 4.
- Three.js via R3F 8 and drei 9 (installed; first used in Phase 1).
- Zustand, Comlink, Dexie, Zod installed (first used in Phases 2, 4, 5).
- Hono server with `GET /health`. Verified live: `{"ok":true,"ai":"stub"}` over HTTP 200.
- Stub AI provider in `packages/ai-conversations` (workspace package). Dev-only; throws on unknown tasks.
- Seeded RNG in `src/sim/rng.ts`. Same seed = same sequence; snapshot/restore survives JSON.
- Main menu (`src/App.tsx`). Buttons are disabled placeholders until their phases.

## Tests
- `npm test`: 3 files, 13 tests, all pass. Covers RNG determinism, snapshot restore, bounds, stub provider, and `/health`.
- `npx tsc --noEmit`: clean.
- `npm run build`: clean.
- `npm run test:e2e`: 1 test (main menu renders), passes.

## Decisions made without asking
See `docs/DECISIONS.md` D-001 to D-010. The main ones: React 18 with R3F 8 (the latest R3F needs React 19), plugin-react 6 for Vite 8, TypeScript 5.9 rather than 7.0.

## Needed from Tim
- Nothing blocking. Phase 4 needs the key: copy `server/.env.example` to `server/.env` and paste `ANTHROPIC_API_KEY=`.
- For Phase 1: the real-data build script will fetch OSM, USGS 3DEP and Census data itself. If any source is unreachable from this environment, I will stop and name the file to download.

## Not done (deliberately)
- No real-world data yet. `realworld.ts` holds only the city name.
- No 3D scene yet.
