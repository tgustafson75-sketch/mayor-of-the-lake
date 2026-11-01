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

// Demographics, approximate. Source: U.S. Census Bureau QuickFacts, Lake Elsinore city, CA.
// https://www.census.gov/quickfacts/fact/table/lakeelsinorecitycalifornia/PST045224
// Retrieved 2026-11-01 via web search. Check against data.census.gov before any publication.
export const DEMOGRAPHICS = {
  // Population estimate, July 1 2024 (V2024). QuickFacts.
  population2024Estimate: 73_595,
  // 2020 decennial census count. QuickFacts.
  population2020Census: 70_265,
  // Age, 2020 census base. QuickFacts.
  pctUnder18: 27.5,
  pct65AndOver: 9.3,
  // Race and ethnicity, 2020 census base. QuickFacts.
  pctHispanicOrLatino: 52.8,
  pctWhiteAlone: 43.0, // QuickFacts "White alone" (does not exclude Hispanic respondents)
  // Median household income, 2019–2023 ACS 5-year, 2023 dollars. QuickFacts.
  medianHouseholdIncome2023Dollars: 96_527,
} as const;

// Third-party figure, NOT official. americabynumbers.com citing ACS 2024 5-year.
// Shown only for comparison. Do not use in-game. Source: https://americabynumbers.com/cities/lake-elsinore-california/
export const DEMOGRAPHICS_UNVERIFIED = {
  population2024Acs5: 72_461,
  medianHouseholdIncome2024Acs5: 101_888,
} as const;
