import { Hono } from "hono";
import type { AiProvider } from "../packages/ai-conversations/src/provider";
import { parseIntent } from "../packages/ai-conversations/src/intent";
import { resolveVoteWhip, type NpcState } from "../packages/ai-conversations/src/resolver";
import { writeDialogue } from "../packages/ai-conversations/src/dialogue";
import { Rng } from "../src/sim/rng";
import { whip } from "../src/sim/council";
import { POLITICS_SCENARIO } from "../src/config/scenarios/politics";
import type { Limiter } from "./rate-limit";
import { classifyPost } from "./classify";

export interface SessionStore {
  /** Trust toward Tim per council member. In-memory: resets when the server restarts. */
  trust: Record<string, number>;
  /** Count of talks so far, so each talk draws from the seeded RNG in order. */
  talks: number;
  seed: string;
}

export interface AppDeps {
  provider: AiProvider;
  store: SessionStore;
  /** Optional: the public deployment passes one. Local development does not. */
  limiter?: Limiter;
}

export function createSessionStore(seed = "lake-elsinore"): SessionStore {
  return { trust: {}, talks: 0, seed };
}

const NPC_NAMES: Record<string, string> = {};
for (let i = 1; i <= POLITICS_SCENARIO.councilSeats + 1; i++) {
  NPC_NAMES[`member-${i}`] = `Council Member ${i} (fictional)`;
}
const VOICE = "Measured, plain-spoken, careful with commitments. Fictional council member.";

export function createApp(deps: AppDeps) {
  const app = new Hono();
  const checkLimit = (forwardedFor: string | undefined) =>
    deps.limiter ? deps.limiter.check(forwardedFor?.split(",")[0].trim() ?? "local") : null;

  app.get("/health", (c) => c.json({ ok: true, ai: deps.provider.name }));

  /** Labels a post's tone and topic. Same limiter as /api/talk: both spend the Gemini key. */
  app.post("/api/classify", async (c) => {
    const refused = checkLimit(c.req.header("x-forwarded-for"));
    if (refused) return c.json({ error: refused }, 429);
    const body = (await c.req.json().catch(() => null)) as { text?: string } | null;
    const text = body?.text?.trim();
    if (!text) return c.json({ error: "text is required" }, 400);
    const label = await classifyPost(deps.provider, text).catch(() => null);
    if (!label) return c.json({ error: "the classifier could not label this post" }, 502);
    return c.json(label);
  });

  /** One conversation turn: words -> intent -> sim outcome -> reply. The model never sets the outcome. */
  app.post("/api/talk", async (c) => {
    const refused = checkLimit(c.req.header("x-forwarded-for"));
    if (refused) return c.json({ error: refused }, 429);
    const body = (await c.req.json().catch(() => null)) as { npcId?: string; text?: string } | null;
    if (!body?.npcId || !body.text) return c.json({ error: "npcId and text are required" }, 400);
    const name = NPC_NAMES[body.npcId];
    if (!name) return c.json({ error: `unknown council member ${body.npcId}` }, 404);

    const parsed = await parseIntent(deps.provider, "vote_whip", body.text);
    if (!parsed.ok) return c.json({ clarify: parsed.clarify, usage: parsed.usage });
    // This route only resolves vote whipping. Other intents need their own resolver.
    if (parsed.intent.intent !== "vote_whip") return c.json({ error: `intent ${parsed.intent.intent} is not handled here` }, 422);

    const { store } = deps;
    const trust = store.trust[body.npcId] ?? 0;
    const npc: NpcState = { id: body.npcId, trust, favorOwed: 0 };
    const rng = new Rng(`${store.seed}:${store.talks}`);
    store.talks++;
    const outcome = resolveVoteWhip(npc, parsed.intent, rng);
    store.trust = { ...store.trust, ...whip(store.trust, body.npcId, outcome.kind) };

    const reply = await writeDialogue(deps.provider, { npcName: name, voice: VOICE, memory: [], outcome });
    return c.json({
      intent: parsed.intent,
      outcome,
      reply: reply.text,
      consistent: reply.consistent,
      trust: store.trust[body.npcId],
    });
  });

  return app;
}
