// Generates the photoreal assets in jobs.ts with the Gemini API.
// Run locally: `npx tsx scripts/assets/generate.ts [--force] [id ...]`.
// The key comes from server/.env and never reaches the browser bundle.
// Output is cached by prompt hash, so re-running only regenerates changed jobs.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JOBS, type AssetJob } from "./jobs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "public/assets/photoreal");
const MANIFEST = resolve(OUT_DIR, "manifest.json");
const ENV_FILE = resolve(ROOT, "server/.env");
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

interface ManifestEntry {
  id: string;
  model: string;
  file: string;
  promptSha256: string;
  createdAt: string;
  prompt: string;
}

function loadKey(): string {
  if (!existsSync(ENV_FILE)) throw new Error(`server/.env not found. Create it with GEMINI_API_KEY=...`);
  const line = readFileSync(ENV_FILE, "utf8")
    .split("\n")
    .find((l) => l.startsWith("GEMINI_API_KEY="));
  const key = line?.slice("GEMINI_API_KEY=".length).trim();
  if (!key) throw new Error("GEMINI_API_KEY is empty in server/.env");
  return key;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function generate(job: AssetJob, key: string): Promise<Buffer> {
  const res = await fetch(`${ENDPOINT}/${job.model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: job.prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    }),
  });
  const body = (await res.json()) as {
    error?: { status?: string; message?: string };
    candidates?: { content?: { parts?: { inlineData?: { data: string } }[] } }[];
  };
  if (!res.ok || body.error) {
    throw new Error(`${job.id}: Gemini ${res.status} ${body.error?.status ?? ""} ${body.error?.message ?? ""}`.trim());
  }
  const image = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!image) throw new Error(`${job.id}: response had no image part`);
  return Buffer.from(image.data, "base64");
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const only = args.filter((a) => !a.startsWith("--"));
  const jobs = only.length ? JOBS.filter((j) => only.includes(j.id)) : JOBS;
  if (only.length && jobs.length !== only.length) throw new Error(`unknown job id in: ${only.join(", ")}`);

  mkdirSync(OUT_DIR, { recursive: true });
  const manifest: ManifestEntry[] = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : [];
  const key = loadKey();

  for (const job of jobs) {
    const file = `${job.id}.png`;
    const promptSha256 = sha256(`${job.model}\n${job.prompt}`);
    const cached = manifest.find((e) => e.id === job.id);
    if (!force && cached?.promptSha256 === promptSha256 && existsSync(resolve(OUT_DIR, file))) {
      console.log(`skip ${job.id} (cached)`);
      continue;
    }
    console.log(`generate ${job.id} with ${job.model} ...`);
    const png = await generate(job, key);
    writeFileSync(resolve(OUT_DIR, file), png);
    const entry: ManifestEntry = { id: job.id, model: job.model, file, promptSha256, createdAt: new Date().toISOString(), prompt: job.prompt };
    const i = manifest.findIndex((e) => e.id === job.id);
    if (i >= 0) manifest[i] = entry;
    else manifest.push(entry);
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`wrote public/assets/photoreal/${file} (${png.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
