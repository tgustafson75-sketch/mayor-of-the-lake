// Photoreal asset jobs. Each job becomes one PNG in public/assets/photoreal/.
// Prompts are generic: no brands, no real people, no legible text or logos.
// Models are checked against the live Gemini model list (models.list) before use.

export interface AssetJob {
  id: string;
  model: string;
  /** Tileable textures must be seamless so they can repeat across the terrain. */
  tileable: boolean;
  prompt: string;
}

const PHOTO = "Photorealistic, natural daylight, true-to-life colour, sharp detail, no text, no logos, no people.";

export const JOBS: readonly AssetJob[] = [
  {
    id: "hero-lake",
    model: "gemini-3-pro-image",
    tileable: false,
    prompt: `Wide 16:9 aerial photograph at golden hour of a large freshwater lake in Southern California, a palm-lined lakeside promenade with a small marina, low tan hills behind, a modest town on the far shore, hazy blue sky. ${PHOTO}`,
  },
  {
    id: "tex-ground",
    model: "gemini-3-pro-image",
    tileable: true,
    prompt: `Seamless tileable top-down texture of dry Southern California valley grass and bare soil with small rocks, photographed from directly above. Edges must match exactly so it tiles. ${PHOTO}`,
  },
  {
    id: "tex-water",
    model: "gemini-3-pro-image",
    tileable: true,
    prompt: `Seamless tileable top-down photo texture of smooth, calm, uniform deep teal lake water. Subtle, low-contrast. Edges match so it tiles. Photorealistic, no text, no people.`,
  },
  {
    id: "tex-facade",
    model: "gemini-3-pro-image",
    tileable: true,
    prompt: `Seamless tileable close-up texture of a light cream stucco building facade with evenly spaced rectangular dark-glass windows in a regular grid. Edges must match exactly so it tiles. ${PHOTO}`,
  },
  {
    id: "tex-roof",
    model: "gemini-3-pro-image",
    tileable: true,
    prompt: `Seamless tileable top-down texture of a commercial building roof: dark grey membrane with small gravel and HVAC units spaced regularly. Edges must match exactly so it tiles. ${PHOTO}`,
  },
];
