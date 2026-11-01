import { describe, expect, it } from "vitest";
import { DAYS_PER_MONTH, DAYS_PER_YEAR, stamp, ticksFor } from "./calendar";

describe("calendar", () => {
  it("day 0 is year 0, month 0, day 0", () => {
    expect(stamp({ day: 0 })).toEqual({ year: 0, month: 0, dayOfMonth: 0, week: 0 });
  });

  it("rolls over months and years", () => {
    expect(stamp({ day: DAYS_PER_MONTH })).toMatchObject({ month: 1, dayOfMonth: 0 });
    expect(stamp({ day: DAYS_PER_YEAR })).toMatchObject({ year: 1, month: 0, dayOfMonth: 0 });
  });

  it("weekly, monthly and yearly loops fire on their boundaries only", () => {
    expect(ticksFor(7)).toMatchObject({ weekly: true, monthly: false, yearly: false });
    expect(ticksFor(DAYS_PER_MONTH)).toMatchObject({ monthly: true });
    expect(ticksFor(DAYS_PER_YEAR)).toMatchObject({ yearly: true });
    expect(ticksFor(3)).toMatchObject({ daily: true, weekly: false, monthly: false, yearly: false });
  });
});
