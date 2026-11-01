import { describe, expect, it } from "vitest";
import { advanceDays, createCity, setZone, totals, type CityState, type ZoneType } from "./city";
import { DAYS_PER_YEAR } from "./calendar";

const YEARS = 20;

/** A small layout: a residential block in the top rows, commercial below it. */
function layout(seed: string): CityState {
  let city = createCity(seed);
  const size = city.size;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < size; c++) {
      const zone: ZoneType = r < 6 ? "residential" : "commercial";
      city = setZone(city, r * size + c, zone);
    }
  }
  return city;
}

describe("city 20-year headless run", () => {
  const start = layout("lake-elsinore");
  const end = advanceDays(start, YEARS * DAYS_PER_YEAR);

  it("runs 20 years without error and keeps population inside the bands", () => {
    const { housing, jobs } = totals(end);
    expect(end.population).toBeGreaterThanOrEqual(0);
    expect(end.population).toBeLessThanOrEqual(housing);
    expect(Number.isFinite(end.population)).toBe(true);
    expect(jobs).toBeGreaterThan(0);
    expect(end.calendar.day).toBe(YEARS * DAYS_PER_YEAR);
  });

  it("grows toward the target instead of staying empty", () => {
    expect(end.population).toBeGreaterThan(start.population + 1000);
  });

  it("logs one growth report per month, append-only", () => {
    const growth = end.log.filter((e) => e.kind === "growth");
    expect(growth.length).toBe(YEARS * 12);
    expect(end.log.slice(0, start.log.length)).toEqual(start.log);
  });

  it("is deterministic: same seed and actions give the same city", () => {
    const again = advanceDays(layout("lake-elsinore"), YEARS * DAYS_PER_YEAR);
    expect(again.population).toBe(end.population);
    expect(again.log).toEqual(end.log);
  });

  it("different seeds give different cities", () => {
    const other = advanceDays(layout("another-seed"), YEARS * DAYS_PER_YEAR);
    expect(other.population).not.toBe(end.population);
  });

  it("a save restored from JSON replays identically", () => {
    const mid = advanceDays(start, 5 * DAYS_PER_YEAR);
    const restored: CityState = JSON.parse(JSON.stringify(mid));
    const a = advanceDays(mid, 3 * DAYS_PER_YEAR);
    const b = advanceDays(restored, 3 * DAYS_PER_YEAR);
    expect(b.population).toBe(a.population);
    expect(b.log).toEqual(a.log);
  });

  it("zoning matters: a city with no housing stays empty", () => {
    const empty = advanceDays(createCity("lake-elsinore"), 5 * DAYS_PER_YEAR);
    expect(empty.population).toBe(0);
  });
});

describe("setZone", () => {
  it("rejects a parcel outside the grid", () => {
    expect(() => setZone(createCity("x"), 10_000, "park")).toThrow(RangeError);
  });

  it("does not mutate the previous state", () => {
    const before = createCity("x");
    setZone(before, 0, "residential");
    expect(before.zones[0]).toBe("empty");
  });
});
