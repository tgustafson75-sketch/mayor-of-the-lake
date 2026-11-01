// Land state for the map: parcels beyond the city, the player's funds and selection.
// The sim does the buying and designating; this store only holds the result.
import { create } from "zustand";
import { buyParcel, createLand, designateParcel, type Designation, type LandState, type RegionExtent } from "../sim/land";
import type { MapData, Xz } from "../render/map-geometry";
import { sampleElevation } from "../render/map-geometry";

export interface LandStore {
  land: LandState | null;
  selected: number | null;
  /** Builds the parcel grid once, from the map. Safe to call again. */
  ensure: (map: MapData) => void;
  select: (id: number | null) => void;
  buy: (id: number, day: number) => string | null;
  designate: (id: number, d: Designation, day: number) => string | null;
}

export const useLand = create<LandStore>((set, get) => ({
  land: null,
  selected: null,
  ensure: (map) => {
    if (get().land) return;
    const extent: RegionExtent = map.meta.extentM;
    const outline: Xz[][] = map.cityOutline;
    set({ land: createLand(extent, outline, (x, z) => sampleElevation(map, x, z)) });
  },
  select: (selected) => set({ selected }),
  buy: (id, day) => {
    const land = get().land;
    if (!land) return "The map is not ready.";
    try {
      set({ land: buyParcel(land, id, day) });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not buy this parcel.";
    }
  },
  designate: (id, d, day) => {
    const land = get().land;
    if (!land) return "The map is not ready.";
    try {
      set({ land: designateParcel(land, id, d, day) });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Could not designate this parcel.";
    }
  },
}));

/** The parcel under a map point, or null if off the grid. */
export function parcelAt(land: LandState, x: number, z: number, extent: RegionExtent): number | null {
  const col = Math.floor((x - extent.minX) / 1000);
  const row = Math.floor((extent.maxZ - z) / 1000);
  if (col < 0 || row < 0 || col >= land.cols || row >= land.rows) return null;
  return row * land.cols + col;
}
