import { describe, expect, it } from "vitest";
import { createStubProvider } from "./stub-provider";

describe("stub AI provider", () => {
  it("returns the canned reply for a known task", async () => {
    const provider = createStubProvider();
    const reply = await provider.complete({
      task: "dialogue:greeting",
      system: "",
      user: "",
    });
    expect(reply.length).toBeGreaterThan(0);
  });

  it("throws for an unknown task instead of inventing a reply", async () => {
    const provider = createStubProvider();
    await expect(
      provider.complete({ task: "intent:unheard_of", system: "", user: "" }),
    ).rejects.toThrow(/no canned reply/);
  });
});
