import { describe, expect, it } from "vitest";
import { addDevelopmentRunoff, createLake, meetsTargets, runMonths, setAeration, setTreatment } from "./lake";
import { LAKE_LEVEL_GOAL_FT } from "../config/realworld/lake";

const TWENTY_YEARS = 240;

describe("lake model: each lever changes the outcome", () => {
  const base = runMonths(createLake("lake-elsinore"), TWENTY_YEARS);

  it("aeration raises dissolved oxygen", () => {
    const aerated = runMonths(setAeration(createLake("lake-elsinore"), true), TWENTY_YEARS);
    expect(aerated.dissolvedOxygen).toBeGreaterThan(base.dissolvedOxygen);
  });

  it("watershed treatment lowers chlorophyll", () => {
    const treated = runMonths(setTreatment(createLake("lake-elsinore"), 0.6), TWENTY_YEARS);
    expect(treated.chlorophyll).toBeLessThan(base.chlorophyll);
  });

  it("lakefront development raises chlorophyll", () => {
    const built = runMonths(addDevelopmentRunoff(createLake("lake-elsinore"), 0.4), TWENTY_YEARS);
    expect(built.chlorophyll).toBeGreaterThan(base.chlorophyll);
  });

  it("aeration plus treatment can meet the documented targets", () => {
    let lake = setAeration(setTreatment(createLake("lake-elsinore"), 0.8), true);
    lake = runMonths(lake, TWENTY_YEARS);
    expect(meetsTargets(lake)).toEqual({ chlorophyll: true, dissolvedOxygen: true, level: true });
  });

  it("the untreated lake fails the documented targets", () => {
    expect(meetsTargets(base).chlorophyll).toBe(false);
  });
});

describe("lake model: bounds and determinism", () => {
  const run = runMonths(createLake("lake-elsinore"), TWENTY_YEARS);

  it("keeps level near the documented goal band over 20 years", () => {
    expect(run.levelFt).toBeGreaterThan(LAKE_LEVEL_GOAL_FT.min - 3);
    expect(run.levelFt).toBeLessThan(LAKE_LEVEL_GOAL_FT.max + 3);
  });

  it("keeps oxygen in 0..12 mg/L and nutrients non-negative", () => {
    expect(run.dissolvedOxygen).toBeGreaterThanOrEqual(0);
    expect(run.dissolvedOxygen).toBeLessThanOrEqual(12);
    expect(run.nutrients).toBeGreaterThanOrEqual(0);
  });

  it("is deterministic and survives a JSON save", () => {
    const again = runMonths(createLake("lake-elsinore"), TWENTY_YEARS);
    expect(again.levelFt).toBe(run.levelFt);
    const restored = JSON.parse(JSON.stringify(createLake("lake-elsinore")));
    expect(runMonths(restored, TWENTY_YEARS).levelFt).toBe(run.levelFt);
  });
});
