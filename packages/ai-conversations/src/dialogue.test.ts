import { describe, expect, it } from "vitest";
import { createStubProvider } from "./stub-provider";
import { writeDialogue, parseConsistent } from "./dialogue";
import type { Outcome } from "./resolver";

const outcome: Outcome = { kind: "refuse", reason: "not persuaded" };

describe("dialogue writer and consistency check", () => {
  it("passes the outcome and only the NPC's own memory into the prompt", async () => {
    let seen = "";
    const p = createStubProvider((req) => {
      if (req.task === "dialogue:npc") seen = req.system + "\n" + req.user;
      return req.task === "check:consistency" ? '{"consistent": true}' : "No. I'm not persuaded.";
    });
    await writeDialogue(p, { npcName: "Council Member A", voice: "Measured.", memory: ["You promised a marina by spring."], outcome });
    expect(seen).toContain("refuse");
    expect(seen).toContain("You promised a marina by spring.");
  });

  it("flags a reply the classifier says contradicts the outcome", async () => {
    const p = createStubProvider((req) => {
      if (req.task === "check:consistency") return '{"consistent": false}';
      return "Absolutely, count me in.";
    });
    const r = await writeDialogue(p, { npcName: "X", voice: "", memory: [], outcome });
    expect(r.consistent).toBe(false);
  });

  it("treats an unreadable classifier reply as inconsistent, not as a pass", () => {
    expect(parseConsistent("not json")).toBe(false);
    expect(parseConsistent('{"consistent": true}')).toBe(true);
  });
});

describe("dialogue retry", () => {
  it("retries once when the first reply is inconsistent, and keeps the corrected reply", async () => {
    let writes = 0;
    const p = createStubProvider((req) => {
      if (req.task === "check:consistency") return req.user.includes("Fine by me") ? '{"consistent": false}' : '{"consistent": true}';
      writes++;
      return writes === 1 ? "Fine by me." : "No, I won't support it.";
    });
    const r = await writeDialogue(p, { npcName: "X", voice: "", memory: [], outcome });
    expect(writes).toBe(2);
    expect(r.consistent).toBe(true);
    expect(r.text).toBe("No, I won't support it.");
  });

  it("reports inconsistent after the retry also fails, rather than hiding it", async () => {
    const p = createStubProvider((req) => (req.task === "check:consistency" ? '{"consistent": false}' : "Sure."));
    const r = await writeDialogue(p, { npcName: "X", voice: "", memory: [], outcome });
    expect(r.consistent).toBe(false);
  });
});
