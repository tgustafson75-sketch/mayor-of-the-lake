// Vercel serverless entry for the game server. Same Hono app as local dev, with
// the public rate limiter switched on. The Gemini key comes from the Vercel environment.
import { handle } from "hono/vercel";
import { createApp, createSessionStore } from "./app";
import { createGeminiProvider } from "./ai/gemini-provider";
import { createLimiter } from "./rate-limit";

const key = process.env.GEMINI_API_KEY ?? "";
if (!key) throw new Error("GEMINI_API_KEY is not set in the Vercel environment");

const app = createApp({
  provider: createGeminiProvider(key),
  store: createSessionStore(),
  limiter: createLimiter(),
});

// Vercel's Node runtime routes by named HTTP method exports, not a default export.
const handler = handle(app);
export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
