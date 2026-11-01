import { describe, expect, it } from "vitest";
import { createStubProvider } from "./stub-provider";
import { parseIntent } from "./intent";

// Scripted "model": maps the player's words to the JSON a model would produce.
const SCRIPT: Record<string, unknown> = {
  "Please back the Lakefront plan, I'll owe you one": {
    intent: "vote_whip",
    proposalId: "lakefront-plan",
    offer: { type: "favor" },
    tone: "friendly",
  },
  "Vote for it or else": { intent: "vote_whip", proposalId: "lakefront-plan", offer: { type: "none" }, tone: "hostile" },
};

describe("intent parser", () => {
  it("turns a scripted player message into a valid vote_whip intent", async () => {
    const p = createStubProvider(() => JSON.stringify(SCRIPT["Please back the Lakefront plan, I'll owe you one"]));
    const r = await parseIntent(p, "vote_whip", "Please back the Lakefront plan, I'll owe you one");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.intent).toMatchObject({ intent: "vote_whip", proposalId: "lakefront-plan", tone: "friendly" });
  });

  it("parses every scripted message in the set", async () => {
    for (const [text, reply] of Object.entries(SCRIPT)) {
      const p = createStubProvider(() => JSON.stringify(reply));
      const r = await parseIntent(p, "vote_whip", text);
      expect(r.ok).toBe(true);
    }
  });

  it("retries once after an invalid reply and accepts the corrected one", async () => {
    let calls = 0;
    const p = createStubProvider(() => {
      calls++;
      return calls === 1 ? "not json" : JSON.stringify(SCRIPT["Vote for it or else"]);
    });
    const r = await parseIntent(p, "vote_whip", "Vote for it or else");
    expect(calls).toBe(2);
    expect(r.ok).toBe(true);
  });

  it("asks Tim to clarify in character when the model stays invalid", async () => {
    const p = createStubProvider(() => JSON.stringify({ intent: "vote_whip" }));
    const r = await parseIntent(p, "vote_whip", "hmm");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.clarify).toMatch(/say it another way/);
  });

  it("counts tokens across the attempts", async () => {
    const p = createStubProvider(() => "bad");
    const r = await parseIntent(p, "vote_whip", "x");
    expect(r.usage.inputTokens).toBeGreaterThan(0);
    expect(r.usage.outputTokens).toBeGreaterThan(0);
  });
});
