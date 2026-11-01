import { describe, expect, it } from "vitest";
import { createApp, createSessionStore } from "./app";
import { createStubProvider } from "../packages/ai-conversations/src/stub-provider";

const INTENT = JSON.stringify({ intent: "vote_whip", proposalId: "lakefront", offer: { type: "favor" }, tone: "friendly" });

function appWith(reply: string) {
  const provider = createStubProvider((req) => {
    if (req.task.startsWith("intent:")) return INTENT;
    if (req.task === "check:consistency") return '{"consistent": true}';
    return reply;
  });
  return createApp({ provider, store: createSessionStore("test") });
}

describe("server", () => {
  it("answers /health with the provider name", async () => {
    const res = await appWith("x").request("/health");
    expect(await res.json()).toEqual({ ok: true, ai: "stub" });
  });

  it("a talk turn runs words -> intent -> sim outcome -> reply", async () => {
    const res = await appWith("We will consider it.").request("/api/talk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ npcId: "member-1", text: "Back the lakefront plan, I'll owe you" }),
    });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.intent.intent).toBe("vote_whip");
    expect(["agree", "counter", "refuse"]).toContain(body.outcome.kind);
    expect(body.reply).toBe("We will consider it.");
    expect(body.consistent).toBe(true);
  });

  it("rejects a talk with no text, and an unknown council member", async () => {
    const app = appWith("x");
    const bad = await app.request("/api/talk", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
    expect(bad.status).toBe(400);
    const unknown = await app.request("/api/talk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ npcId: "nobody", text: "hi" }) });
    expect(unknown.status).toBe(404);
  });

  it("the same talk in the same session gives the same outcome (seeded)", async () => {
    const run = async () => {
      const app = appWith("ok");
      const r = await app.request("/api/talk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ npcId: "member-2", text: "vote yes" }) });
      return (await r.json()).outcome;
    };
    expect(await run()).toEqual(await run());
  });
});
