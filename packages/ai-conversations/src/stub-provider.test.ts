import { describe, expect, it } from "vitest";
import { createStubProvider } from "./stub-provider";

describe("stub AI provider", () => {
  it("returns the canned reply for a known task, with usage", async () => {
    const res = await createStubProvider().complete({ task: "dialogue:greeting", system: "", user: "" });
    expect(res.text.length).toBeGreaterThan(0);
    expect(res.usage.outputTokens).toBeGreaterThan(0);
  });

  it("throws for an unknown task instead of inventing a reply", async () => {
    await expect(createStubProvider().complete({ task: "intent:unheard_of", system: "", user: "" })).rejects.toThrow(/no canned reply/);
  });

  it("uses a responder when given one", async () => {
    const p = createStubProvider((req) => `echo:${req.user}`);
    expect((await p.complete({ task: "x", system: "", user: "hi" })).text).toBe("echo:hi");
  });
});
