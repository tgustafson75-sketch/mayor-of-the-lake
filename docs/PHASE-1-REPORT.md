# Phase 1 report: real map

**Status:** first pass complete, awaiting Tim's review. Visual quality is not yet at the "close realistic" target (see below).

## Data pulled (all real, cited in docs/SOURCES.md)
- OSM city boundary, relation 11051981: 53 members, bounds 33.6185,-117.42 to 33.7568,-117.2168.
- OSM water: 165 rings (Lake Elsinore, Railroad Canyon Reservoir, ponds).
- OSM major roads (motorway to tertiary): 1,382 ways.
- OSM buildings inside the city boundary: 2,989 footprints.
- USGS 3DEP bare-earth DEM, 512x384 float32, elevation 356.4 to 1084.5 m.

Raw downloads are in data/raw/ (gitignored). Reproduce with `scripts/data/fetch.sh`, then `npx tsx scripts/data/build-map.ts`. Output: data/processed/lake-elsinore-map.json (~2 MB).

## Built
- scripts/data/fetch.sh and scripts/data/build-map.ts.
- src/render/map-geometry.ts: terrain mesh, lake surfaces, road ribbons, extruded buildings. Lake beds carved 4 m below the water (TUNABLE, display only).
- src/render/MapScene.tsx: R3F scene, Sky, sun shadows, fog, orbit camera. Vertical exaggeration 2x (TUNABLE, display only).
- src/ui/MapView.tsx and App.tsx: opened at `#map`.
- src/config/realworld.ts: population 73,637 (CA DOF, 2025) and city bounds, each with source and date.

## Tests
- `npx vitest run`: 26 passed. Includes grid-corner sampling, north orientation, terrain vertex counts, flat water, road classes, and building extents.
- `npx playwright test`: 2 passed. Main menu and `#map` load with no page errors.
- `npx tsc --noEmit`: clean.

## Known gaps
- Visual: this is real geometry with basic lighting. It is not the photoreal target Tim picked. Buildings and roads are small at city-wide zoom. Next: a closer default camera, better materials, and shadow tuning. A planner-style top view is also needed.
- Lake level: the water surface is set from the DEM under each ring's centroid. This is an approximation, not a surveyed level.
- Building heights default to 7 m when OSM has none (TUNABLE).
- Census ACS demographics are blocked: the Census API needs a key. Add `CENSUS_API_KEY` to server/.env to unblock.
- Not yet sourced: the General Plan, zoning layers, and land-use categories. These are Phase 2 and Phase 5.5 work.

## Needed from Tim
- Census API key (free) in server/.env as CENSUS_API_KEY.
- Confirm "both" in the visual request: does it include Gridiron Life? Its own style guide says "not photoreal," so the two would differ.
