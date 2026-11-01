import { describe, expect, it } from "vitest";
import { useClock } from "./clockStore";
import { DAYS_PER_MONTH } from "../sim/calendar";

describe("game clock", () => {
  it("does not advance while paused", () => {
    useClock.setState({ speed: 0 });
    const before = useClock.getState().city.calendar.day;
    useClock.getState().tickSecond();
    expect(useClock.getState().city.calendar.day).toBe(before);
  });

  it("advances one day per second at 1x, two at 2x, four at 4x", () => {
    for (const [speed, days] of [[1, 1], [2, 2], [4, 4]] as const) {
      useClock.setState({ speed, city: { ...useClock.getState().city, calendar: { day: 0 } } });
      useClock.getState().tickSecond();
      expect(useClock.getState().city.calendar.day).toBe(days);
    }
  });

  it("skip to next event lands on the next monthly tick", () => {
    useClock.setState({ speed: 0, city: { ...useClock.getState().city, calendar: { day: 3 } } });
    useClock.getState().skipToNextEvent();
    expect(useClock.getState().city.calendar.day).toBe(DAYS_PER_MONTH);
  });
});
