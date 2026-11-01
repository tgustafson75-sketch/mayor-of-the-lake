// Brand logo for Mayor of the Lake, generated from the approved branding boards.
// References: the Lakefront mockup (logo + HUD look) and the Gridiron style guide
// (palette and condensed all-caps type). Output: public/assets/brand/logo.png.
// Run: npx tsx scripts/assets/logo.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = resolve(ROOT, "public/assets/brand/logo.png");
const KEY = readFileSync(resolve(ROOT, "server/.env"), "utf8").split("\n").find((l) => l.startsWith("GEMINI_API_KEY="))!.slice(15).trim();
const REFS = [
  "/Users/timothyg/Downloads/Lakefront Revitalization Builder.png",
  "/Users/timothyg/Downloads/Gridiron Life Style Guide-1.png",
];

const PROMPT = `Design a clean, premium game logo lockup for "MAYOR OF THE LAKE". Match the reference: bold, condensed, all-caps headline lettering in warm gold (#F4C430) with a thin off-white outline and a soft drop shadow, the words "MAYOR OF" above, "THE LAKE" below, and a small line of tracked caps "LAKE ELSINORE, CA" beneath. Above the lettering, a simple emblem: a flat mountain ridge line with a gentle lake wave, in gold and off-white. Use only the reference palette (charcoal #14161A, slate #2A2F36, off-white #E8E6E1, gold #F4C430). Solid charcoal background, centred, generous margins, crisp vector-like edges, no photo texture, no people, no extra text.`;

async function main() {
  const parts: object[] = [{ text: PROMPT }];
  for (const f of REFS) {
    if (!existsSync(f)) throw new Error(`reference missing: ${f}`);
    parts.push({ inlineData: { mimeType: "image/png", data: readFileSync(f).toString("base64") } });
  }
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": KEY },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"] } }),
  });
  const body = (await res.json()) as { error?: { message?: string }; candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[] };
  if (!res.ok || body.error) throw new Error(`Gemini ${res.status}: ${body.error?.message ?? ""}`);
  const img = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!img) throw new Error("no image in response");
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, Buffer.from(img.data, "base64"));
  console.log("wrote", OUT);
}
main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
