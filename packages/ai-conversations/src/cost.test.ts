import { describe, expect, it } from "vitest";
import { CostCounter } from "./cost";

describe("cost counter", () => {
  it("sums tokens across calls", () => {
    const c = new CostCounter();
    c.add({ inputTokens: 100, outputTokens: 20 });
    c.add({ inputTokens: 50, outputTokens: 5 });
    expect(c.totals()).toEqual({ inputTokens: 150, outputTokens: 25, usd: null });
  });

  it("prices tokens only when the caller supplies prices", () => {
    const c = new CostCounter({ inputPerMTok: 1, outputPerMTok: 5 });
    c.add({ inputTokens: 1_000_000, outputTokens: 1_000_000 });
    expect(c.totals().usd).toBeCloseTo(6);
  });
});
