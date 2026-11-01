import { describe, expect, it } from "vitest";
import { ADVISORS, briefAll } from "./advisors";
import { publicComment } from "./public-comment";
import { canFile, petitionQualifies, signingShare } from "./recall";
import { Rng } from "./rng";
import { RECALL_TERM_LOCK_DAYS } from "../config/realworld/recall";

const happy = { homeowners: 0.9, renters: 0.9, smallBusiness: 0.9, developers: 0.9, environmental: 0.9, publicSafety: 0.9 };
const angry = { homeowners: 0.05, renters: 0.05, smallBusiness: 0.05, developers: 0.05, environmental: 0.05, publicSafety: 0.05 };

describe("advisors", () => {
  it("every advisor briefs, citing the sim's numbers", () => {
    const b = briefAll({ sentiment: happy, campaignStrength: 60, trust: 0.2 }, new Rng("adv"));
    expect(b.map((x) => x.advisor)).toEqual(ADVISORS);
    expect(b[0].numbers).toMatch(/Estimated vote \d+%, campaign strength 60, trust 0\.20/);
  });

  it("an advisor with a low skill is sometimes wrong, and the briefing says so", () => {
    let wrong = 0;
    for (let i = 0; i < 400; i++) {
      const b = briefAll({ sentiment: happy, campaignStrength: 60, trust: 0 }, new Rng(`a${i}`));
      wrong += b.filter((x) => !x.reliable).length;
    }
    expect(wrong).toBeGreaterThan(0);
  });

  it("advisors can disagree with each other on the same numbers", () => {
    let disagree = false;
    for (let i = 0; i < 60 && !disagree; i++) {
      const b = briefAll({ sentiment: happy, campaignStrength: 60, trust: 0 }, new Rng(`d${i}`));
      if (new Set(b.map((x) => x.recommendation)).size > 1) disagree = true;
    }
    expect(disagree).toBe(true);
  });
});

describe("public comment", () => {
  it("happy groups bring more supporters than opponents, and angry groups the reverse", () => {
    const up = publicComment(happy, new Rng("pc"), 20);
    const down = publicComment(angry, new Rng("pc"), 20);
    expect(up.supporters).toBeGreaterThan(up.opponents);
    expect(down.opponents).toBeGreaterThan(down.supporters);
  });

  it("is deterministic for the same seed", () => {
    expect(publicComment(happy, new Rng("s"))).toEqual(publicComment(happy, new Rng("s")));
  });
});

describe("recall", () => {
  it("an angry electorate qualifies a petition; a happy one does not", () => {
    expect(petitionQualifies(angry, 400).qualifies).toBe(true);
    expect(petitionQualifies(happy, 400).qualifies).toBe(false);
    expect(signingShare(angry)).toBeGreaterThan(signingShare(happy));
  });

  it("no petition can be filed inside the term lock", () => {
    expect(canFile(RECALL_TERM_LOCK_DAYS)).toBe(false);
    expect(petitionQualifies(angry, RECALL_TERM_LOCK_DAYS - 1).qualifies).toBe(false);
  });
});
