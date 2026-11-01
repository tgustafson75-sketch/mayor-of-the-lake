# Photoreal pipeline: lessons for any app on this Mac

For Save the AMX, Gridiron Life, and any future 3D or image work.

## Generating images with Gemini
- List live models before using one: `GET https://generativelanguage.googleapis.com/v1beta/models` with the `x-goog-api-key` header. Don't trust model names from memory or search results.
- Free-tier quota for image models can be zero per model ("limit: 0"). If a key returns 429 with limit 0, it has no image quota. Use a key from a project with billing, or check the project's billing. Tested here: SmartGarden's key had zero image quota; SmartGreens' key worked.
- `gemini-3-pro-image` gave the best photoreal hero. `gemini-3.1-flash-image` and `gemini-2.5-flash-image` were also live. For textures, `gemini-3-pro-image` worked too.
- Request body needs `generationConfig.responseModalities: ["TEXT","IMAGE"]`. The image is `candidates[0].content.parts[].inlineData.data` (base64).
- A response with no image part is possible (the model returns text). Retry once, then simplify the prompt. A long prompt with many "no X" clauses made it fail. "Photorealistic, uniform, low-contrast, no text, no people" worked.
- Keep keys in a gitignored env file (`server/.env`) read by a local script. Never in the browser bundle or git.

## Tiling textures
- Generated images are not seamless even when asked. Use `MirroredRepeatWrapping` in three.js. It hides seams for any image.
- Tile size matters. A 400 m tile showed a grid where tiles meet. A 2 km tile for water removed it.
- Water with sun glints and bright streaks repeats badly. Use calm, low-contrast, uniform water.
- Avoid high-clearcoat materials on water. The gloss makes repeats show up.

## Dev servers and tests
- Don't reuse a dev server in Playwright (`reuseExistingServer: true`) without checking it's yours. Another app took port 5173 here, and tests hit the wrong app. Use a dedicated port and `reuseExistingServer: false`.
- Run Playwright with `workers: 1` for WebGL pages. Parallel WebGL pages caused screenshot protocol errors.
- After a WebGL test, a screenshot can fail if a previous page is still alive. Keep screenshots to one page per test, or skip them.

## Debugging visuals
- When a render looks wrong, isolate one thing at a time: replace the texture with a flat colour and re-render. An old screenshot from a failed run looked like a valid test; always check the test passed.
