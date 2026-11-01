// Live smoke test of the conversation pipeline against Claude. Run locally:
// `npx tsx scripts/ai/smoke.ts`. Reads ANTHROPIC_API_KEY from server/.env.
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createAnthropicProvider } from "../../server/ai/anthropic-provider";
import { parseIntent, writeDialogue, CostCounter } from "../../packages/ai-conversations/src";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const envFile = resolve(ROOT, "server/.env");
if (!existsSync(envFile)) throw new Error("server/.env not found");
const key = readFileSync(envFile, "utf8").split("\n").find((l) => l.startsWith("ANTHROPIC_API_KEY="))?.slice(17).trim() ?? "";

const provider = createAnthropicProvider(key);
const cost = new CostCounter();

const parsed = await parseIntent(provider, "vote_whip", "Please back the Lakefront plan this month. I'll owe you a favour.");
if (parsed.ok) cost.add(parsed.usage);
console.log("intent:", parsed.ok ? JSON.stringify(parsed.intent) : `clarify: ${parsed.clarify}`);

const reply = await writeDialogue(provider, {
  npcName: "Council Member (fictional)",
  voice: "Measured and careful. Speaks plainly.",
  memory: [],
  outcome: { kind: "counter", relationshipDelta: 0, reason: "wants something in return" },
});
cost.add(reply.usage);
console.log("dialogue:", reply.text);
console.log("consistent with outcome:", reply.consistent);
console.log("tokens:", cost.totals());
