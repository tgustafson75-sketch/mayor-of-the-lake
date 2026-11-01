// City core: zoned parcels, population and jobs, monthly growth. Pure and
// deterministic: all randomness comes from the Rng passed in.
// No budget yet. Money systems wait for the real-world rules research (addendum section 4).

import { type Calendar, ticksFor } from "./calendar";
import { Rng, type RngSnapshot } from "./rng";
import { BALANCE } from "../config/balance";

export type ZoneType = "empty" | "residential" | "commercial" | "industrial" | "park" | "mixed";

export interface CityEvent {
  day: number;
  kind: "zone_set" | "growth" | "monthly_report";
  detail: Record<string, number | string>;
}

export interface CityState {
  version: 1;
  seed: string;
  calendar: Calendar;
  size: number;
  zones: ZoneType[];
  population: number;
  rng: RngSnapshot;
  log: CityEvent[];
}

export function createCity(seed: string, size = BALANCE.gridSize): CityState {
  const rng = new Rng(seed);
  return {
    version: 1,
    seed,
    calendar: { day: 0 },
    size,
    zones: Array.from({ length: size * size }, () => "empty" as ZoneType),
    population: 0,
    rng: rng.snapshot(),
    log: [],
  };
}

/** Capacity of one parcel. Each zone type gives housing units and jobs. */
function parcelCapacity(zone: ZoneType): { housing: number; jobs: number } {
  switch (zone) {
    case "residential":
      return { housing: BALANCE.housingPerParcel, jobs: 0 };
    case "commercial":
      return { housing: 0, jobs: BALANCE.jobsPerParcel };
    case "industrial":
      return { housing: 0, jobs: BALANCE.jobsPerParcel * 1.5 };
    case "mixed":
      return { housing: BALANCE.housingPerParcel / 2, jobs: BALANCE.jobsPerParcel / 2 };
    default:
      return { housing: 0, jobs: 0 };
  }
}

export function totals(city: CityState): { housing: number; jobs: number } {
  let housing = 0;
  let jobs = 0;
  for (const z of city.zones) {
    const c = parcelCapacity(z);
    housing += c.housing;
    jobs += c.jobs;
  }
  return { housing, jobs };
}

/** Returns a new state with the parcel zoned. Immutable. */
export function setZone(city: CityState, index: number, zone: ZoneType): CityState {
  if (index < 0 || index >= city.zones.length) throw new RangeError(`parcel ${index} is outside the grid`);
  const zones = city.zones.slice();
  zones[index] = zone;
  return {
    ...city,
    zones,
    log: [...city.log, { day: city.calendar.day, kind: "zone_set", detail: { index, zone } }],
  };
}

/** Advances one day. Monthly growth runs on the month boundary. */
export function advanceDay(city: CityState): CityState {
  const day = city.calendar.day + 1;
  let next: CityState = { ...city, calendar: { day } };
  const ticks = ticksFor(day);
  if (ticks.monthly) next = monthlyGrowth(next);
  return next;
}

/**
 * Monthly population change. People move in when there is spare housing and
 * jobs, and move out when housing is over-full or jobs are scarce.
 */
function monthlyGrowth(city: CityState): CityState {
  const rng = new Rng(0);
  rng.restore(city.rng);
  const { housing, jobs } = totals(city);
  const vacancy = housing === 0 ? -1 : (housing - city.population) / housing;
  const jobRatio = housing === 0 ? 0 : jobs / Math.max(1, city.population);

  // Pull toward a target: the lower of housing capacity and a jobs-supported population.
  const target = Math.min(housing * BALANCE.occupancyCap, jobs * BALANCE.jobsToPopulation);
  const gap = target - city.population;
  const change = Math.round(gap * BALANCE.monthlyAdjustRate + (rng.next() - 0.5) * BALANCE.monthlyNoise);
  const population = Math.max(0, Math.min(housing, city.population + change));

  const next: CityState = {
    ...city,
    population,
    rng: rng.snapshot(),
    log: [
      ...city.log,
      {
        day: city.calendar.day,
        kind: "growth",
        detail: { population, change: population - city.population, vacancy: round2(vacancy), jobRatio: round2(jobRatio) },
      },
    ],
  };
  return next;
}

/** Advances n days. Used by the headless tests and the fast-forward control. */
export function advanceDays(city: CityState, n: number): CityState {
  let s = city;
  for (let i = 0; i < n; i++) s = advanceDay(s);
  return s;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Advances whole days until the next monthly loop tick. Used by "skip to next event". */
export function advanceToNextMonth(city: CityState): CityState {
  let s = advanceDay(city);
  while (!ticksFor(s.calendar.day).monthly) s = advanceDay(s);
  return s;
}
