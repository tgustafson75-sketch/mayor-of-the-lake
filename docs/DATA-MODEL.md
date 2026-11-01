# Data model

Plain serializable data. Saves are JSON. The RNG is restored from its snapshot, so a save replays exactly.

## CityState (src/sim/city.ts, version 1)
- seed: string. The only root of randomness, via Rng(seed).
- calendar: { day }. Day 0 is year 0, month 0, day 0. 12 months of 30 days (see D-017).
- size: parcels per side. zones: ZoneType[] of length size*size, row-major, row 0 = north.
- population: people. Never exceeds housing.
- rng: { state }. Snapshot of the seeded generator.
- log: CityEvent[]. Append-only. kind = zone_set | growth.

## Zone types
empty, residential, commercial, industrial, park, mixed. Generic names only.

## Balance (src/config/balance.ts)
All values TUNABLE. Not sourced. They are design choices until the Phase 5.5 research sets real rules.

## Calendar (src/sim/calendar.ts)
- Speeds: pause (0), 1x, 2x, 4x.
- Loop ticks: daily every day, weekly every 7 days, monthly every 30, yearly every 360.

## Not yet modelled
Budget, debt, utilities, lake, politics, life sim. Each waits for its phase and for the research gate (addendum section 4).
