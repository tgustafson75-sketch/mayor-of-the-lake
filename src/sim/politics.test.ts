import { describe, expect, it } from "vitest";
import { Rng } from "./rng";
import { scenarioRoster, vote, yesChance, type Member } from "./politics";

const passRate = (members: Member[], trials = 2000) => {
  const rng = new Rng("politics-test");
  let passed = 0;
  for (let i = 0; i < trials; i++) if (vote(members, rng).passed) passed++;
  return passed / trials;
};

const roster = (trust: number, fit: number) => scenarioRoster().map((m) => ({ ...m, trust, fit }));

describe("council vote (scenario)", () => {
  it("the same proposal passes with a good relationship and fails with a worse one", () => {
    expect(passRate(roster(0.8, 0.2))).toBeGreaterThan(passRate(roster(-0.8, -0.2)));
  });

  it("a strongly favourable roster passes most of the time", () => {
    expect(passRate(roster(0.9, 0.5))).toBeGreaterThan(0.9);
  });

  it("chance stays in 0..1 whatever the trust or fit", () => {
    expect(yesChance({ id: "x", trust: 1, fit: 1 })).toBeLessThanOrEqual(1);
    expect(yesChance({ id: "x", trust: -1, fit: -1 })).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic for the same seed", () => {
    const a = vote(roster(0.2, 0), new Rng("same"));
    const b = vote(roster(0.2, 0), new Rng("same"));
    expect(a).toEqual(b);
  });
});
