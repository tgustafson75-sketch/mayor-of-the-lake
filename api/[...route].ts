// Vercel serverless entry for the game server. Same Hono app as local dev, with
// the public rate limiter switched on. The Gemini key comes from the Vercel environment.
import { handle } from "hono/vercel";
import { createApp, createSessionStore } from "../server/app";
import { createGeminiProvider } from "../server/ai/gemini-provider";
import { createLimiter } from "../server/rate-limit";

const key = process.env.GEMINI_API_KEY ?? "";
if (!key) throw new Error("GEMINI_API_KEY is not set in the Vercel environment");

const app = createApp({
  provider: createGeminiProvider(key),
  store: createSessionStore(),
  limiter: createLimiter(),
});

export const config = { runtime: "nodejs" };
export default handle(app);
