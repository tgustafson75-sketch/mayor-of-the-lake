import { describe, expect, it } from "vitest";
import { resolveVoteWhip, type Random } from "./resolver";
import { SCHEMAS } from "./schemas";

/** Seeded generator for tests. Same seed gives the same sequence. */
function seeded(seed: number): Random {
  let s = seed >>> 0;
  return {
    next() {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), s | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

const intent = (tone: "friendly" | "neutral" | "firm" | "hostile", offer: "none" | "favor") =>
  SCHEMAS.vote_whip.parse({ intent: "vote_whip", proposalId: "p", offer: { type: offer }, tone });

function agreeRate(trust: number, tone: "friendly" | "hostile", offer: "none" | "favor"): number {
  const rng = seeded(7);
  let agree = 0;
  for (let i = 0; i < 4000; i++) {
    if (resolveVoteWhip({ id: "c1", trust, favorOwed: 0 }, intent(tone, offer), rng).kind === "agree") agree++;
  }
  return agree / 4000;
}

describe("vote resolver (the sim decides)", () => {
  it("is deterministic for the same seed", () => {
    const a = resolveVoteWhip({ id: "c", trust: 0.2, favorOwed: 0 }, intent("neutral", "none"), seeded(1));
    const b = resolveVoteWhip({ id: "c", trust: 0.2, favorOwed: 0 }, intent("neutral", "none"), seeded(1));
    expect(a).toEqual(b);
  });

  it("higher trust makes agreement more likely", () => {
    expect(agreeRate(0.9, "friendly", "none")).toBeGreaterThan(agreeRate(-0.9, "friendly", "none"));
  });

  it("a hostile tone makes agreement less likely than a friendly one", () => {
    expect(agreeRate(0, "friendly", "none")).toBeGreaterThan(agreeRate(0, "hostile", "none"));
  });

  it("an offer makes agreement more likely", () => {
    expect(agreeRate(0, "friendly", "favor")).toBeGreaterThan(agreeRate(0, "friendly", "none"));
  });

  it("every outcome carries a reason the dialogue writer can express", () => {
    const rng = seeded(3);
    for (let i = 0; i < 200; i++) {
      const o = resolveVoteWhip({ id: "c", trust: 0, favorOwed: 0 }, intent("neutral", "none"), rng);
      expect(o.reason.length).toBeGreaterThan(0);
    }
  });
});
