import { describe, expect, it } from "vitest";
import { AFFINITY, createSocial, publish, quoteBack, type Group } from "./social";

const GROUPS = Object.keys(AFFINITY.housing) as Group[];
const base = { day: 10, reputation: 30 };

describe("social feed: the sim computes sentiment", () => {
  it("a friendly housing post helps renters and developers and hurts homeowners", () => {
    const s = publish(createSocial(), { ...base, text: "More homes near the lake", tone: "friendly", topic: "housing" });
    const p = s.posts[0];
    expect(p.impact.renters).toBeGreaterThan(0);
    expect(p.impact.developers).toBeGreaterThan(0);
    expect(p.impact.homeowners).toBeLessThan(0);
  });

  it("a hostile post costs more sentiment than a friendly one on the same topic", () => {
    const friendly = publish(createSocial(), { ...base, text: "x", tone: "friendly", topic: "lake" }).posts[0];
    const hostile = publish(createSocial(), { ...base, text: "x", tone: "hostile", topic: "lake" }).posts[0];
    expect(hostile.impact.environmental).toBeLessThan(friendly.impact.environmental);
  });

  it("every post changes sentiment for every group, and every change is logged", () => {
    const s = publish(createSocial(), { ...base, text: "Lake clean-up starts Monday", tone: "friendly", topic: "lake" });
    const logged = s.log.filter((e) => e.kind === "sentiment").map((e) => e.detail.group);
    expect(new Set(logged)).toEqual(new Set(GROUPS));
  });

  it("sentiment stays between 0 and 1", () => {
    let s = createSocial();
    for (let i = 0; i < 50; i++) s = publish(s, { ...base, day: i, text: "x", tone: "friendly", topic: "lake" });
    for (const g of GROUPS) {
      expect(s.sentiment[g]).toBeGreaterThanOrEqual(0);
      expect(s.sentiment[g]).toBeLessThanOrEqual(1);
    }
  });

  it("reputation raises reach, and an empty post is refused", () => {
    const low = publish(createSocial(), { day: 1, text: "x", tone: "neutral", topic: "jobs", reputation: 0 }).posts[0];
    const high = publish(createSocial(), { day: 1, text: "x", tone: "neutral", topic: "jobs", reputation: 80 }).posts[0];
    expect(high.reach).toBeGreaterThan(low.reach);
    expect(() => publish(createSocial(), { day: 1, text: "   ", tone: "neutral", topic: "jobs", reputation: 0 })).toThrow(RangeError);
  });
});

describe("social feed: NPCs quote past posts accurately", () => {
  it("quotes the most recent earlier post on the same topic, word for word", () => {
    let s = createSocial();
    s = publish(s, { day: 5, text: "Parking downtown will be free", tone: "friendly", topic: "jobs", reputation: 30 });
    s = publish(s, { day: 80, text: "Jobs fair next month", tone: "neutral", topic: "jobs", reputation: 30 });
    expect(quoteBack(s, "jobs", 200)?.text).toBe("Jobs fair next month");
    expect(quoteBack(s, "jobs", 50)?.text).toBe("Parking downtown will be free");
  });

  it("returns null rather than inventing a quote when there is none", () => {
    expect(quoteBack(createSocial(), "taxes", 100)).toBeNull();
  });
});
