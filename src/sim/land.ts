// Land beyond the city. The region is divided into one-kilometre parcels. Parcels inside
// the city belong to the city. Others can be bought and designated for a use, or are
// future town sites. Prices and designations are TUNABLE placeholders, not sourced values.
import type { Xz } from "../render/map-geometry";

export const PARCEL_M = 1000; // TUNABLE — parcel size for the game grid

export type Designation = "unset" | "open_space" | "future_town" | "commercial" | "industrial" | "residential";
export const DESIGNATIONS: readonly Designation[] = ["unset", "open_space", "future_town", "commercial", "industrial", "residential"];

export interface Parcel {
  id: number;
  col: number;
  row: number;
  /** Centre in map metres (x east, z north). */
  x: number;
  z: number;
  inCity: boolean;
  owner: "none" | "city" | "player";
  designation: Designation;
  /** Price in USD thousands. TUNABLE. */
  price: number;
}

export interface LandState {
  parcels: Parcel[];
  cols: number;
  rows: number;
  /** Cash the player has for land, USD thousands. Scenario value (TUNABLE). */
  funds: number;
  log: { day: number; kind: "buy" | "designate"; detail: Record<string, string | number> }[];
}

export interface RegionExtent {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Point-in-polygon for one ring. Even-odd rule. */
function inRing(x: number, z: number, ring: Xz[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Inside the city if inside any outer ring of its boundary. */
export function insideCity(x: number, z: number, outline: Xz[][]): boolean {
  return outline.some((ring) => ring.length >= 3 && inRing(x, z, ring));
}

/** Price from distance to the city centre and elevation. TUNABLE shape, not a sourced market. */
export function parcelPrice(x: number, z: number, elevationM: number): number {
  const dist = Math.hypot(x, z) / 1000; // km from the centre
  const base = 40; // USD thousands per parcel, TUNABLE
  const nearby = Math.max(0.2, 1.2 - dist / 25);
  const highGround = Math.max(0.6, 1 - Math.max(0, elevationM - 500) / 1500);
  return Math.round(base * nearby * highGround);
}

export function createLand(extent: RegionExtent, outline: Xz[][], elevationAt: (x: number, z: number) => number, funds = 500): LandState {
  const cols = Math.ceil((extent.maxX - extent.minX) / PARCEL_M);
  const rows = Math.ceil((extent.maxZ - extent.minZ) / PARCEL_M);
  const parcels: Parcel[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = extent.minX + (col + 0.5) * PARCEL_M;
      const z = extent.maxZ - (row + 0.5) * PARCEL_M;
      const inCity = insideCity(x, z, outline);
      parcels.push({
        id: row * cols + col,
        col,
        row,
        x,
        z,
        inCity,
        owner: inCity ? "city" : "none",
        designation: inCity ? "unset" : "unset",
        price: parcelPrice(x, z, elevationAt(x, z)),
      });
    }
  }
  return { parcels, cols, rows, funds, log: [] };
}

/** Buys an unowned parcel outside the city if the player can pay. Returns the state unchanged otherwise. */
export function buyParcel(land: LandState, id: number, day: number): LandState {
  const p = land.parcels[id];
  if (!p) throw new RangeError(`no parcel ${id}`);
  if (p.owner !== "none") throw new Error(`parcel ${id} is not for sale`);
  if (land.funds < p.price) throw new Error(`not enough funds for parcel ${id}`);
  const parcels = land.parcels.slice();
  parcels[id] = { ...p, owner: "player" };
  return {
    ...land,
    parcels,
    funds: land.funds - p.price,
    log: [...land.log, { day, kind: "buy", detail: { id, price: p.price } }],
  };
}

/** Sets a designation on a parcel the player owns. */
export function designateParcel(land: LandState, id: number, designation: Designation, day: number): LandState {
  const p = land.parcels[id];
  if (!p) throw new RangeError(`no parcel ${id}`);
  if (p.owner !== "player") throw new Error(`parcel ${id} is not yours to designate`);
  const parcels = land.parcels.slice();
  parcels[id] = { ...p, designation };
  return { ...land, parcels, log: [...land.log, { day, kind: "designate", detail: { id, designation } }] };
}
