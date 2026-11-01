import { describe, expect, it } from "vitest";
import { GROUP_WEIGHT, TERM_DAYS, addCampaignWork, createCampaign, runElection, tickCampaign, voteShare, winChance } from "./election";
import { Rng } from "./rng";
import { POLITICS_SCENARIO } from "../config/scenarios/politics";

const even = { homeowners: 0.5, renters: 0.5, smallBusiness: 0.5, developers: 0.5, environmental: 0.5, publicSafety: 0.5 };
const high = { homeowners: 0.9, renters: 0.9, smallBusiness: 0.9, developers: 0.9, environmental: 0.9, publicSafety: 0.9 };
const low = { homeowners: 0.1, renters: 0.1, smallBusiness: 0.1, developers: 0.1, environmental: 0.1, publicSafety: 0.1 };

describe("elections (scenario)", () => {
  it("group weights sum to 1", () => {
    const sum = Object.values(GROUP_WEIGHT).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it("the term follows the scenario term length", () => {
    expect(TERM_DAYS).toBe(POLITICS_SCENARIO.termYears * 360);
    expect(createCampaign().daysToElection).toBe(TERM_DAYS);
  });

  it("higher sentiment and more campaign work both raise the vote share", () => {
    expect(voteShare(high, 50)).toBeGreaterThan(voteShare(low, 50));
    expect(voteShare(even, 90)).toBeGreaterThan(voteShare(even, 10));
  });

  it("campaign work is capped at 100", () => {
    let c = createCampaign();
    for (let i = 0; i < 30; i++) c = addCampaignWork(c);
    expect(c.strength).toBe(100);
  });

  it("the odds of winning rise with sentiment and with campaign work", () => {
    expect(winChance(high, 60)).toBeGreaterThan(winChance(low, 60));
    expect(winChance(even, 90)).toBeGreaterThan(winChance(even, 5));
  });

  it("a single election is deterministic for the same seed", () => {
    expect(runElection(even, 40, new Rng("s"))).toEqual(runElection(even, 40, new Rng("s")));
  });

  it("the clock counts down and the election resolves when it falls due, then resets", () => {
    let c = { ...createCampaign(), daysToElection: 3 };
    const rng = new Rng("clock");
    let res = null;
    for (let i = 0; i < 3; i++) {
      const t = tickCampaign(c, high, rng);
      c = t.campaign;
      res = t.result;
    }
    expect(res).not.toBeNull();
    expect(c.daysToElection).toBe(TERM_DAYS);
    expect(c.strength).toBe(0);
  });
});
