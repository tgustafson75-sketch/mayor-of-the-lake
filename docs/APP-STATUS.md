# App status (2026-11-01)

## What runs where
- **Browser (static, deployed to mayorofthelake.vercel.app):** front page with the photoreal hero, the 3D city map (`#map`), HUD, time controls, camera presets, and the council talk panel.
- **Game server (local only, `npm run server`):** `/health` and `/api/talk`. The talk route runs words → intent (Gemini) → sim outcome (seeded) → reply (Gemini) → consistency check → trust update. Not deployed.
- **Sim (pure TypeScript, src/sim):** calendar and loops, city growth, lake model, life sim, council votes, commitments ledger, budget and politics on SCENARIO data.
- **AI package (packages/ai-conversations):** standalone. Gemini and Claude providers live in server/ai/.

## Verified
- Unit tests: 114 across 19 files, all pass. Dead-code pass done 2026-11-01 (removed unused helpers and empty folders).
- Browser tests: map, front page, camera presets, council panel error state.
- Production build clean.
- Live: one full talk turn through the server returned a valid intent, a sim outcome, a consistent reply, and updated trust.

## Known gaps
- The talk panel will show "game server not running" on the deployed site, because the server is not deployed.
- Trust resets when the server restarts (in-memory store). No save file yet.
- Only vote whipping is resolved. Other conversation types have schemas but no resolver.
- Built since: the Life screen (needs, blocks, sleep) and the Council chamber (agenda, vote, whip, Promises ledger), both wired to the sim.
- Also built: the social feed (posts, reach, sentiment by interest group, quoting past posts), in the sim and on its own screen.
- Also built: elections (Phase 8, scenario): campaign blocks build strength, the term clock runs on sleep, the result follows sentiment and strength plus one seeded roll, and the odds are shown as a probability.
- Also built: the four game modes (Life, Builder, Politics, Spectator) as flags in src/config/modes.ts, chosen on the menu and shown on the Life screen. Mode flags do not yet change what the screens allow; that wiring is next.
- Also built: City Hall in 3D, advisors, public comment, recall (sourced threshold, TUNABLE), voice input (browser speech), press interviews, the desktop app (Tauri, macOS DMG, unsigned), and the wider map with buyable and designatable parcels.
- Not built: the AI tone classifier and the Gemini budget alert (with Cowork).
- Budget and politics values are SCENARIO placeholders (D-019). Real rules come from the Phase 5.5 research, which is not done.
- Repo: https://github.com/tgustafson75-sketch/mayor-of-the-lake (public). Static site: https://mayorofthelake.vercel.app.
- The game server is not public. Deploying it means putting the Gemini key behind an endpoint, which needs rate limits first.

## How to run
    npm install
    npm run dev        # web on :5173, /api proxied to :8787
    npm run server     # game server, reads server/.env for GEMINI_API_KEY
    npm test           # unit tests
    npm run test:e2e   # browser tests (own port 5183)
