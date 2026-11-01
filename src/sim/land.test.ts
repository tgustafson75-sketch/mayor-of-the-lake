import { describe, expect, it } from "vitest";
import { buyParcel, createLand, designateParcel, insideCity, PARCEL_M, parcelPrice, type RegionExtent } from "./land";
import type { Xz } from "../render/map-geometry";

const extent: RegionExtent = { minX: -10_000, maxX: 10_000, minZ: -8_000, maxZ: 8_000 };
// A square city of 6 km a side, centred on the origin.
const city: Xz[][] = [[[-3000, -3000], [3000, -3000], [3000, 3000], [-3000, 3000]]];
const flat = () => 200;
const make = (funds = 500) => createLand(extent, city, flat, funds);

describe("land grid", () => {
  it("covers the region in one-kilometre parcels", () => {
    const land = make();
    expect(land.cols).toBe(20);
    expect(land.rows).toBe(16);
    expect(land.parcels.length).toBe(20 * 16);
    expect(PARCEL_M).toBe(1000);
  });

  it("parcels inside the city are the city's, and cannot be bought", () => {
    const land = make();
    const inside = land.parcels.find((p) => p.inCity)!;
    expect(inside.owner).toBe("city");
    expect(() => buyParcel(land, inside.id, 1)).toThrow(/not for sale/);
  });

  it("the city test follows the boundary", () => {
    expect(insideCity(0, 0, city)).toBe(true);
    expect(insideCity(5000, 0, city)).toBe(false);
  });
});

describe("buying and designating", () => {
  it("the player buys an outside parcel with funds, and the cost is taken", () => {
    const land = make(500);
    const outside = land.parcels.find((p) => !p.inCity)!;
    const after = buyParcel(land, outside.id, 3);
    expect(after.parcels[outside.id].owner).toBe("player");
    expect(after.funds).toBe(500 - outside.price);
    expect(after.log.at(-1)!.kind).toBe("buy");
  });

  it("a parcel cannot be bought without enough funds", () => {
    const land = make(0);
    const outside = land.parcels.find((p) => !p.inCity)!;
    expect(() => buyParcel(land, outside.id, 1)).toThrow(/not enough funds/);
  });

  it("only an owned parcel can be designated, and designation is logged", () => {
    const land = make(500);
    const outside = land.parcels.find((p) => !p.inCity)!;
    expect(() => designateParcel(land, outside.id, "commercial", 1)).toThrow(/not yours/);
    const owned = buyParcel(land, outside.id, 1);
    const designated = designateParcel(owned, outside.id, "open_space", 2);
    expect(designated.parcels[outside.id].designation).toBe("open_space");
    expect(designated.log.at(-1)!.kind).toBe("designate");
  });

  it("prices are deterministic and fall with distance from the city centre", () => {
    expect(parcelPrice(0, 0, 200)).toBeGreaterThan(parcelPrice(40_000, 0, 200));
    expect(parcelPrice(1000, 1000, 200)).toBe(parcelPrice(1000, 1000, 200));
  });
});
