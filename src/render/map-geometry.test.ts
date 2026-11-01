import { describe, expect, it } from "vitest";
import mapJson from "../../data/processed/lake-elsinore-map.json";
import {
  type MapData,
  buildBuildings,
  buildRoads,
  buildTerrain,
  buildWater,
  sampleElevation,
} from "./map-geometry";

const map = mapJson as unknown as MapData;
const { minX, maxX, minZ, maxZ } = map.meta.extentM;
const { width: W, height: H } = map.meta.elevation;

describe("processed map data", () => {
  it("has one elevation sample per grid cell", () => {
    expect(map.elevationM).toHaveLength(W * H);
  });

  it("extent is symmetric about the city centre and roughly 19 km x 15 km", () => {
    expect(minX).toBeCloseTo(-maxX, 0);
    expect(minZ).toBeCloseTo(-maxZ, 0);
    expect((maxX - minX) / 1000).toBeGreaterThan(18);
    expect((maxX - minX) / 1000).toBeLessThan(20);
    expect((maxZ - minZ) / 1000).toBeGreaterThan(14);
    expect((maxZ - minZ) / 1000).toBeLessThan(16);
  });
});

describe("sampleElevation", () => {
  it("returns the stored value exactly at the north-west grid corner (row 0, col 0)", () => {
    expect(sampleElevation(map, minX, maxZ)).toBeCloseTo(map.elevationM[0], 6);
  });

  it("returns the stored value exactly at the south-east grid corner", () => {
    expect(sampleElevation(map, maxX, minZ)).toBeCloseTo(map.elevationM[W * H - 1], 6);
  });

  it("treats row 0 as north: an exact grid node reads back its own sample", () => {
    const row = 50;
    const col = 100;
    const x = minX + (col / (W - 1)) * (maxX - minX);
    const z = maxZ - (row / (H - 1)) * (maxZ - minZ);
    expect(sampleElevation(map, x, z)).toBeCloseTo(map.elevationM[row * W + col], 6);
  });

  it("clamps outside the grid instead of extrapolating", () => {
    expect(sampleElevation(map, minX - 50_000, maxZ + 50_000)).toBeCloseTo(map.elevationM[0], 6);
  });
});

describe("terrain mesh", () => {
  it("has one vertex per grid sample and two triangles per cell", () => {
    const geo = buildTerrain(map);
    expect(geo.getAttribute("position").count).toBe(W * H);
    expect(geo.getIndex()!.count).toBe((W - 1) * (H - 1) * 6);
  });
});

describe("water", () => {
  it("builds a merged surface from the OSM rings", () => {
    const geo = buildWater(map);
    expect(geo).not.toBeNull();
    expect(geo!.getAttribute("position").count).toBeGreaterThan(0);
  });

  it("lies flat: every vertex of one ring sits at one elevation", () => {
    const ring = map.water.find((r) => r.length >= 3)!;
    const geo = buildWater({ ...map, water: [ring] })!;
    const y = geo.getAttribute("position").getY(0);
    const pos = geo.getAttribute("position");
    for (let i = 0; i < pos.count; i++) expect(pos.getY(i)).toBeCloseTo(y, 6);
  });
});

describe("roads", () => {
  it("builds one ribbon per class present in the data", () => {
    const byClass = buildRoads(map);
    expect(byClass.size).toBeGreaterThan(0);
    for (const cls of byClass.keys()) expect(["motorway", "trunk", "primary", "secondary", "tertiary"]).toContain(cls);
  });

  it("ribbons are triangles (vertex count divisible by 3)", () => {
    for (const geo of buildRoads(map).values()) expect(geo.getAttribute("position").count % 3).toBe(0);
  });
});

describe("buildings", () => {
  it("builds one merged mesh with a bounding box inside the city extent", () => {
    const geo = buildBuildings(map);
    expect(geo).not.toBeNull();
    geo!.computeBoundingBox();
    const box = geo!.boundingBox!;
    expect(box.min.x).toBeGreaterThanOrEqual(minX - 1);
    expect(box.max.x).toBeLessThanOrEqual(maxX + 1);
    expect(box.min.z).toBeGreaterThanOrEqual(minZ - 1);
    expect(box.max.z).toBeLessThanOrEqual(maxZ + 1);
  });

  it("extrudes upward: the top of the mesh is above the ground", () => {
    const geo = buildBuildings(map)!;
    geo.computeBoundingBox();
    expect(geo.boundingBox!.max.y).toBeGreaterThan(map.meta.elevation.minM);
  });
});
