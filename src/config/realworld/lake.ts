// Documented lake facts, each with its source. See docs/LAKE-SOURCES.md.
// Any number here that is not listed in LAKE-SOURCES.md is TUNABLE and must not be shown as fact.

/** Chlorophyll-a summer average target, µg/L (interim, 2015). Source: 2004 TMDL, summarised in https://www.waterboards.ca.gov/santaana/water_issues/programs/tmdl/docs/elsinore/2019/Tentative_Resolution_March_15_2019.pdf */
export const CHLOROPHYLL_TARGET_UG_PER_L = 40;

/** Depth-average dissolved oxygen floor, mg/L. Same source. */
export const DISSOLVED_OXYGEN_FLOOR_MG_PER_L = 5;

/** Lake level goal band, feet above sea level. Source: LESJWA Final PEIR (2005), https://www.sawpa.gov/wp-content/uploads/2018/08/16-Lake-Elsinore-Final-PEIR-MWH-9-05.pdf */
export const LAKE_LEVEL_GOAL_FT = { min: 1240, max: 1247 } as const;
