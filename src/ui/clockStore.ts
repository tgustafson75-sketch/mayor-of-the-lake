// Game clock state for the UI. The sim does the work; this only holds the
// current city, the speed, and the advance actions.
import { create } from "zustand";
import { DEFAULT_SEED } from "../config/balance";
import { type Speed } from "../sim/calendar";
import { type CityState, advanceDay, advanceDays, advanceToNextMonth, createCity } from "../sim/city";

export interface ClockStore {
  city: CityState;
  speed: Speed;
  setSpeed: (speed: Speed) => void;
  /** Advances by one real second's worth of days at the current speed. */
  tickSecond: () => void;
  skipToNextEvent: () => void;
}

export const useClock = create<ClockStore>((set, get) => ({
  city: createCity(DEFAULT_SEED),
  speed: 0,
  setSpeed: (speed) => set({ speed }),
  tickSecond: () => {
    const { speed, city } = get();
    if (speed === 0) return;
    // One day per second at 1x, so 2x is two days and 4x is four.
    set({ city: advanceDays(city, speed) });
  },
  skipToNextEvent: () => set({ city: advanceToNextMonth(get().city) }),
}));

/** Single-day step, for tests and the debug panel. */
export function stepOneDay(city: CityState): CityState {
  return advanceDay(city);
}
