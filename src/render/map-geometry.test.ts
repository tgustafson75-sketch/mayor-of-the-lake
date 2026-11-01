import { describe, expect, it } from "vitest";
import mapJson from "../../data/processed/lake-elsinore-map.json";
import {
  type MapData,
  buildBuildings,
  buildRoads,
  buildSkirt,
  buildTerrain,
  buildWater,
  lakeCentre,
  sampleElevation,
  treePlacements,
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
  it("builds merged roof and wall meshes with a bounding box inside the city extent", () => {
    const { walls } = buildBuildings(map);
    expect(walls).not.toBeNull();
    const geo = walls!;
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    expect(box.min.x).toBeGreaterThanOrEqual(minX - 1);
    expect(box.max.x).toBeLessThanOrEqual(maxX + 1);
    expect(box.min.z).toBeGreaterThanOrEqual(minZ - 1);
    expect(box.max.z).toBeLessThanOrEqual(maxZ + 1);
  });

  it("extrudes upward: the top of the mesh is above the ground", () => {
    const geo = buildBuildings(map).walls!;
    geo.computeBoundingBox();
    expect(geo.boundingBox!.max.y).toBeGreaterThan(map.meta.elevation.minM);
  });
});

describe("buildings: roofs, walls and colour", () => {
  it("returns separate roof and wall meshes", () => {
    const { roofs, walls } = buildBuildings(map);
    expect(roofs).not.toBeNull();
    expect(walls).not.toBeNull();
    expect(roofs!.getAttribute("position").count).toBeLessThan(walls!.getAttribute("position").count);
  });

  it("gives every vertex a colour in both meshes", () => {
    for (const geo of Object.values(buildBuildings(map))) {
      expect(geo!.getAttribute("color").count).toBe(geo!.getAttribute("position").count);
    }
  });

  it("roof vertices point up; wall vertices are near-horizontal", () => {
    const { roofs, walls } = buildBuildings(map);
    const roofN = roofs!.getAttribute("normal");
    for (let i = 0; i < roofN.count; i++) expect(Math.abs(roofN.getY(i))).toBeGreaterThan(0.99);
    const wallN = walls!.getAttribute("normal");
    for (let i = 0; i < wallN.count; i++) expect(Math.abs(wallN.getY(i))).toBeLessThan(0.01);
  });
});

describe("terrain UVs", () => {
  it("gives every terrain vertex a UV, scaled in metres per tile", () => {
    const geo = buildTerrain(map);
    expect(geo.getAttribute("uv").count).toBe(W * H);
  });
});

describe("terrain colour", () => {
  it("gives every vertex an RGB colour in [0, 1]", () => {
    const col = buildTerrain(map).getAttribute("color");
    const bad = Array.from(col.array).filter((v) => !(v >= 0 && v <= 1));
    expect(bad, `out-of-range colour values: ${bad.slice(0, 5).join(", ")}`).toEqual([]);
  });
});

describe("lakeCentre", () => {
  it("sits inside the city extent, on the lake", () => {
    const c = lakeCentre(map);
    expect(c.x).toBeGreaterThan(minX);
    expect(c.x).toBeLessThan(maxX);
    expect(c.z).toBeGreaterThan(minZ);
    expect(c.z).toBeLessThan(maxZ);
  });
});

describe("tree placements", () => {
  const trees = treePlacements(map);

  it("places a substantial number of trees", () => {
    expect(trees.length).toBeGreaterThan(1000);
  });

  it("is deterministic for the same seed", () => {
    const again = treePlacements(map);
    expect(again.length).toBe(trees.length);
    expect(again[0]).toEqual(trees[0]);
    expect(again[again.length - 1]).toEqual(trees[trees.length - 1]);
  });

  it("keeps every tree inside the city extent with a sensible scale", () => {
    for (const t of trees) {
      expect(t.x).toBeGreaterThanOrEqual(minX - 1);
      expect(t.x).toBeLessThanOrEqual(maxX + 1);
      expect(t.scale).toBeGreaterThan(0.5);
      expect(t.scale).toBeLessThan(1.5);
    }
  });
});

describe("tile skirt", () => {
  it("drops from the ground edge to a base below the lowest ground", () => {
    const geo = buildSkirt(map);
    geo.computeBoundingBox();
    expect(geo.boundingBox!.min.y).toBeLessThan(map.meta.elevation.minM);
    // The top edge follows the ground at the tile border, so it never exceeds the map's highest point.
    expect(geo.boundingBox!.max.y).toBeLessThanOrEqual(map.meta.elevation.maxM + 0.01);
  });

  it("sits on the tile edge, inside the city extent", () => {
    const geo = buildSkirt(map);
    geo.computeBoundingBox();
    const b = geo.boundingBox!;
    expect(b.min.x).toBeCloseTo(minX, 0);
    expect(b.max.x).toBeCloseTo(maxX, 0);
    expect(b.min.z).toBeCloseTo(minZ, 0);
    expect(b.max.z).toBeCloseTo(maxZ, 0);
  });
});
