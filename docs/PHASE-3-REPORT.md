# Phase 3 report: lake system and camera presets

## Lake (src/sim/lake.ts)
- Uses only the documented mechanics in docs/LAKE-SOURCES.md: nutrients drive algae, low oxygen stresses fish, aeration raises oxygen, dredging and treatment cut nutrients, and the level is managed toward the LESJWA goal band (1,240–1,247 ft).
- Targets from sources: chlorophyll-a ≤ 40 µg/L, dissolved oxygen ≥ 5 mg/L, level in band.
- Tests show each lever changes the outcome in the right direction. Aeration plus treatment meets all three targets over 20 years. The untreated lake fails.
- Starting values are TUNABLE, not measured. Inflow, rainfall and Canyon Lake are not modelled (see gaps in LAKE-SOURCES.md).

## Cameras (src/config/cameras.ts, src/ui/cameraStore.ts, src/ui/CameraSwitcher.tsx)
- Five presets: City (default, ~45° overhead), Street, Lake, Planner (top-down), Free.
- Live switching with a smooth glide. The camera is view state only: no sim state is read or written.
- Browser test clicks through all five with no page errors. Unit tests check the presets.

## Tests
- 63 unit tests and 4 browser tests pass.

## Not done
- Overlays for the planner view (zoning and risk layers). The preset exists but the overlay data does not yet.
- Lake dashboard UI. The model exists; the panel is still the placeholder nav item.
