import { describe, expect, it } from "vitest";
import { Rng } from "./rng";
import { runVote, whip, type FitTable } from "./council";

const IDS = ["m1", "m2", "m3", "m4", "m5"];
const PLAN = { id: "zoning-waterfront", title: "Waterfront zoning change" };
const FIT: FitTable = { "zoning-waterfront": { m1: 0.4, m2: 0.2, m3: 0, m4: -0.1, m5: 0.3 } };

function passRate(trust: Record<string, number>, trials = 2000): number {
  const rng = new Rng("council-test");
  let passed = 0;
  for (let i = 0; i < trials; i++) if (runVote(PLAN, trust, FIT, IDS, rng).passed) passed++;
  return passed / trials;
}

describe("council: the success criterion", () => {
  it("the zoning change passes after whipping votes with good relationships", () => {
    const relationshipsGood = Object.fromEntries(IDS.map((id) => [id, 0.6]));
    expect(passRate(relationshipsGood)).toBeGreaterThan(0.8);
  });

  it("the same proposal fails with worse relationships", () => {
    const relationshipsBad = Object.fromEntries(IDS.map((id) => [id, -0.6]));
    expect(passRate(relationshipsBad)).toBeLessThan(0.35);
  });

  it("whipping a member through a successful conversation raises their support", () => {
    const before = passRate({ m1: -0.3, m2: -0.3, m3: -0.3, m4: -0.3, m5: -0.3 });
    let trust: Record<string, number> = { m1: -0.3, m2: -0.3, m3: -0.3, m4: -0.3, m5: -0.3 };
    trust = whip(trust, "m1", "agree");
    trust = whip(trust, "m2", "agree");
    trust = whip(trust, "m5", "agree");
    expect(passRate(trust)).toBeGreaterThan(before);
  });

  it("a refused whip costs trust", () => {
    expect(whip({ m1: 0 }, "m1", "refuse").m1).toBeLessThan(0);
  });

  it("trust stays within -1..1 whatever the whips", () => {
    let t: Record<string, number> = { m1: 0.95 };
    for (let i = 0; i < 10; i++) t = whip(t, "m1", "agree");
    expect(t.m1).toBe(1);
  });
});
