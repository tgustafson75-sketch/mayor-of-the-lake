# Mayor of the Lake

A single-player city-and-politics life sim set in Lake Elsinore, California, on real geography. Working title.

## Run

    npm install
    npm run dev        # web on http://localhost:5173, server on http://localhost:8787
    npm test           # unit tests (Vitest)
    npm run test:e2e   # browser smoke test (Playwright)
    npm run build

## AI key

Copy `server/.env.example` to `server/.env` and paste your Anthropic key after `ANTHROPIC_API_KEY=`. The key stays on the server. Until the Claude provider lands in Phase 4, the game runs on the stub and the key is not needed.

## Docs

- `docs/DECISIONS.md` — choices made without asking
- `docs/SOURCES.md` — real-world data sources
- `docs/LAKE-SOURCES.md` — documented lake mechanics
- `docs/PHASE-N-REPORT.md` — per-phase reports
