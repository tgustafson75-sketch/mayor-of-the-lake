// Real-world facts about Lake Elsinore. Every real number lives here, with a
// source URL and an "as of" date in the comment above it. A number that cannot
// be sourced is marked TUNABLE and must never be shown in-game as fact.

export const CITY = {
  name: "Lake Elsinore",
  state: "California",
} as const;

// Population. Source: California Department of Finance, E-1 2026 press release
// (January 2026 estimate, 2025 date). https://dof.ca.gov/media/docs/forecasting/Demographics/estimates/E-1_2026_Press_Release.pdf
// Also tagged on OSM relation 11051981 as population=73,637 (2025).
export const POPULATION_2025 = 73_637;

// Map bounds. Source: OpenStreetMap relation 11051981 (City of Lake Elsinore
// boundary), fetched 2026-11-01. https://www.openstreetmap.org/relation/11051981
export const CITY_BOUNDS = { minLat: 33.6185, minLon: -117.42, maxLat: 33.7568, maxLon: -117.2168 } as const;
