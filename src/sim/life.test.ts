import { describe, expect, it } from "vitest";
import { adjustRelationship, createLife, endDay, playDays, spendBlock, type Block } from "./life";

const busyPlan: Block[][] = Array.from({ length: 30 }, (_, i) => (i % 2 === 0 ? ["work", "meeting", "campaign"] : ["family", "rest"]));

describe("life sim: 30 in-game days", () => {
  it("needs change from the actions taken, not from nothing", () => {
    const start = createLife();
    const after = playDays(start, busyPlan);
    expect(after.needs).not.toEqual(start.needs);
    expect(after.day).toBe(30);
  });

  it("a rest-heavy plan leaves more energy and less stress than a work-heavy one", () => {
    const rest = playDays(createLife(), Array.from({ length: 30 }, () => ["rest", "family"]));
    const work = playDays(createLife(), Array.from({ length: 30 }, () => ["work", "campaign", "meeting"]));
    expect(rest.needs.energy).toBeGreaterThan(work.needs.energy);
    expect(rest.needs.stress).toBeLessThan(work.needs.stress);
  });

  it("reputation rises only through blocks that earn it", () => {
    const after = playDays(createLife(), busyPlan);
    expect(after.reputation).toBeGreaterThan(30);
    const idle = playDays(createLife(), Array.from({ length: 30 }, () => []));
    expect(idle.reputation).toBe(30);
  });

  it("relationships do not change on their own over 30 days", () => {
    const start = adjustRelationship(createLife(), "council-a", { trust: 0.2 });
    const after = playDays(start, busyPlan);
    expect(after.relationships).toEqual(start.relationships);
  });

  it("a relationship changes only when an outcome is applied to it", () => {
    const start = createLife();
    const after = adjustRelationship(start, "council-a", { trust: 0.3, favorOwed: -1 });
    expect(after.relationships["council-a"]).toEqual({ trust: 0.3, favorOwed: -1, rivalry: 0 });
    expect(start.relationships["council-a"]).toBeUndefined();
  });

  it("trust stays within -1..1 however many outcomes land", () => {
    let s = createLife();
    for (let i = 0; i < 50; i++) s = adjustRelationship(s, "x", { trust: 0.5 });
    expect(s.relationships.x.trust).toBe(1);
  });

  it("a fifth block in a day is refused", () => {
    let s = createLife();
    for (const b of ["work", "family", "rest", "event"] as Block[]) s = spendBlock(s, b);
    expect(() => spendBlock(s, "meeting")).toThrow(RangeError);
  });

  it("a stressed, exhausted resident logs burnout", () => {
    let s = createLife();
    s = { ...s, needs: { ...s.needs, stress: 95, energy: 5 } };
    s = endDay(s);
    expect(s.log.some((e) => e.kind === "burnout")).toBe(true);
  });

  it("is deterministic and survives a JSON save", () => {
    const a = playDays(createLife(), busyPlan);
    const b = playDays(JSON.parse(JSON.stringify(createLife())), busyPlan);
    expect(b).toEqual(a);
  });
});
