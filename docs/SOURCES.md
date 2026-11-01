# Sources

Real-world data sources and their status. Populated in Phase 1.

| Data | Source | Status |
|------|--------|--------|
| Map, roads, buildings, land use | OpenStreetMap (ODbL, credit contributors) | Not yet fetched |
| Elevation | USGS 3DEP | Not yet fetched |
| Population, demographics, housing | US Census Bureau ACS | Not yet fetched |
| Governance, budget, general plan, zoning | City of Lake Elsinore published documents | Not yet fetched |
| Lake management | See LAKE-SOURCES.md | Phase 3 |

No real-world number is used in the game yet. `src/config/realworld.ts` is empty of numbers.

## Probed 2026-11-01
- OSM city boundary, Lake Elsinore relation 11051981 (admin_level 8). Population tag 73,637 (2025), source: https://dof.ca.gov/media/docs/forecasting/Demographics/estimates/E-1_2026_Press_Release.pdf (CA Dept. of Finance). Use this as the sourced population figure.
- USGS 3DEP ImageServer reachable: https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer
- Census API requires a key now (returns "Missing Key"). ACS demographics are blocked until a key is provided. Get a free key at https://api.census.gov/data/key_signup.html and put it in server/.env as CENSUS_API_KEY.

## Regional extent (2026-11-01)
- Regional DEM: USGS 3DEP ImageServer, 768x576 over 33.50-33.88 N, 117.60-117.05 W.
- Regional water and main roads: OpenStreetMap (ODbL), four Overpass tiles over the same box.
- Parcel prices are scenario values, not sourced.
