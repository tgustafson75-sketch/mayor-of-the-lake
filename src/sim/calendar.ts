// Game time. Days are the base unit. Pure functions, no DOM, no wall clock.
// Speeds: pause, 1x, 2x, 4x (addendum section 1). Skip-to-event is handled by the caller.

export type Speed = 0 | 1 | 2 | 4;
export const SPEEDS: readonly Speed[] = [0, 1, 2, 4];

export interface Calendar {
  /** Days since the start of the game. Day 0 is the first day of month 0. */
  day: number;
}

export const DAYS_PER_WEEK = 7;
/** Simplified calendar: 12 months of 30 days. A real-calendar mode is a later decision. */
export const DAYS_PER_MONTH = 30;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;

export interface Stamp {
  year: number;
  month: number; // 0..11
  dayOfMonth: number; // 0..29
  week: number; // 0.. within the year
}

export function stamp(cal: Calendar): Stamp {
  const dayInYear = cal.day % DAYS_PER_YEAR;
  return {
    year: Math.floor(cal.day / DAYS_PER_YEAR),
    month: Math.floor(dayInYear / DAYS_PER_MONTH),
    dayOfMonth: dayInYear % DAYS_PER_MONTH,
    week: Math.floor(dayInYear / DAYS_PER_WEEK),
  };
}

/** Which loops fire when the calendar advances onto `day`. */
export interface LoopTicks {
  daily: true;
  weekly: boolean;
  monthly: boolean;
  yearly: boolean;
}

export function ticksFor(day: number): LoopTicks {
  return {
    daily: true,
    weekly: day % DAYS_PER_WEEK === 0,
    monthly: day % DAYS_PER_MONTH === 0,
    yearly: day % DAYS_PER_YEAR === 0,
  };
}

/** Days advanced per real second at each speed, given a base of one day per second at 1x. */
export function daysPerSecond(speed: Speed): number {
  return speed;
}
