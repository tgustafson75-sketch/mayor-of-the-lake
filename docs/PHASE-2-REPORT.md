# Phase 2 report: city sim core

**Status:** core complete, awaiting Tim's review. Budget deferred (D-016).

## Built
- src/sim/calendar.ts: day/month/year stamps, loop ticks (daily, weekly, monthly, yearly), speeds 0/1/2/4.
- src/sim/city.ts: zoned grid, capacity by zone type, monthly growth, immutable zoning, append-only log, 20-year advance.
- src/config/balance.ts: all sim tuning, every value marked TUNABLE.
- docs/DATA-MODEL.md, docs/DECISIONS.md D-016 to D-018.

## Tests
- `npx vitest run`: sim tests pass (calendar 3, city 11 including the 20-year run). Full suite count is in the commit message.
- The 20-year headless run covers: population inside bands, growth toward target, one growth report per month, determinism, a JSON save replaying identically, and zoning changing the outcome.

## Not done yet (by design)
- Time controls in the UI and "skip to next event": the sim side is done (speeds, ticks), the HUD control is not.
- Pre-office and politics loops, which need the research.
- Budget, utilities, lake: wait for the research (D-016) and Phase 3.
- Real-world growth rules: none. The model is a placeholder until research sets them.

## Needed from Tim
- Review of this phase and the D-016 decision: is it OK that the budget waits for research?
