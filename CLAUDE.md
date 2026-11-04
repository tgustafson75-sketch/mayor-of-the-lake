# Mayor of the Lake

A single-player city-and-politics life sim set in Lake Elsinore. Read `README.md` for how to run it.

## Standing rules (set 2026-11-02, Tim)

1. **Start every session** by reading this file, then `docs/MEMORY.md`, then `docs/ENGINE-TESTS.md`.
2. **Memory lives in the project.** Before the context gets close to full, update `docs/MEMORY.md` with decisions, current state and next steps. Don't rely on the assistant's own memory alone.
3. **Shared engines come from the catalog** `~/SmartPlay-Engines/` (one folder per engine, each with an `ENGINE.md`). Vendored copies say where the canonical file is. Edit the canonical file, then copy it over.
4. **Engine test results go to `docs/ENGINE-TESTS.md`**, including what did NOT run.
5. **This game is a test bed for engines.** Engines are tried here (and in Gridiron and AMX) before anything is called done.
6. **Don't commit or push without Tim's OK.** Don't touch Caddie (`~/smartplay`) or SmartManage from here.
7. **Checks:** `npx tsc --noEmit -p tsconfig.json` and `npx vitest run`.
