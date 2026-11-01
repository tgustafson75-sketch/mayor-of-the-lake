import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { serve } from "@hono/node-server";
import { createApp, createSessionStore } from "./app";
import { createGeminiProvider } from "./ai/gemini-provider";
import { createStubProvider } from "../packages/ai-conversations/src/stub-provider";

// Reads server/.env directly. A missing file or empty key means the stub runs, and the log says so.
const envPath = resolve(process.cwd(), "server/.env");
const env = existsSync(envPath)
  ? Object.fromEntries(readFileSync(envPath, "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]))
  : {};
const key = env.GEMINI_API_KEY ?? "";
const provider = key ? createGeminiProvider(key) : createStubProvider();
console.log(`AI provider: ${provider.name}${key ? "" : " (no GEMINI_API_KEY in server/.env)"}`);

const port = Number(process.env.PORT ?? 8787);
serve({ fetch: createApp({ provider, store: createSessionStore() }).fetch, port }, (info) => {
  console.log(`Mayor of the Lake server on http://localhost:${info.port}`);
});
