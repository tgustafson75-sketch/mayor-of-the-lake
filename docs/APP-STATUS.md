# App status (2026-11-01)

## What runs where
- **Browser (static, deployed to mayorofthelake.vercel.app):** front page with the photoreal hero, the 3D city map (`#map`), HUD, time controls, camera presets, and the council talk panel.
- **Game server (local only, `npm run server`):** `/health` and `/api/talk`. The talk route runs words → intent (Gemini) → sim outcome (seeded) → reply (Gemini) → consistency check → trust update. Not deployed.
- **Sim (pure TypeScript, src/sim):** calendar and loops, city growth, lake model, life sim, council votes, commitments ledger, budget and politics on SCENARIO data.
- **AI package (packages/ai-conversations):** standalone. Gemini and Claude providers live in server/ai/.

## Verified
- Unit tests: 114 across 19 files, all pass.
- Browser tests: map, front page, camera presets, council panel error state.
- Production build clean.
- Live: one full talk turn through the server returned a valid intent, a sim outcome, a consistent reply, and updated trust.

## Known gaps
- The talk panel will show "game server not running" on the deployed site, because the server is not deployed.
- Trust resets when the server restarts (in-memory store). No save file yet.
- Only vote whipping is resolved. Other conversation types have schemas but no resolver.
- The 3D home, city hall, life screen, council chamber, Promises screen, advisors, social media, elections, game modes and polish (Phases 5 UI to 9) are not built.
- Budget and politics values are SCENARIO placeholders (D-019). Real rules come from the Phase 5.5 research, which is not done.
- No git remote. Push is blocked until a remote is set up (see the last session's report).

## How to run
    npm install
    npm run dev        # web on :5173, /api proxied to :8787
    npm run server     # game server, reads server/.env for GEMINI_API_KEY
    npm test           # unit tests
    npm run test:e2e   # browser tests (own port 5183)
