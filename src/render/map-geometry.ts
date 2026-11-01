// Turns data/processed/lake-elsinore-map.json into three.js geometry.
// Pure functions, no React, so they can be unit-tested in Node.
// Units: metres. x = east, z = north, y = up.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Rng } from "../sim/rng";

export type Xz = [number, number];

export interface MapData {
  meta: {
    extentM: { minX: number; maxX: number; minZ: number; maxZ: number };
    elevation: { width: number; height: number; minM: number; maxM: number };
  };
  elevationM: number[];
  water: Xz[][];
  roads: { id: number; class: string; name: string | null; points: Xz[] }[];
  buildings: { id: number; footprint: Xz[]; heightM: number | null }[];
}

/** Road ribbon width in metres by OSM highway class. Display only. */
export const ROAD_WIDTH_M: Readonly<Record<string, number>> = {
  motorway: 24,
  trunk: 20,
  primary: 14,
  secondary: 10,
  tertiary: 8,
};

/** Used when OSM has no height or level count. Display only, not sourced: a render default. */
export const DEFAULT_BUILDING_HEIGHT_M = 7; // TUNABLE — not sourced

/** How far the lake bed sits below the water surface. Display only; not sourced. */
export const LAKE_BED_DEPTH_M = 4; // TUNABLE — not sourced

const WALL_TINTS = ["#ece1cc", "#dccbab", "#cbb99b", "#f3eee4", "#bfb8aa", "#e6d3b3"];
const ROOF_TINTS = ["#5b5b60", "#6e5b4b", "#7f7d78", "#4f5359"];
// Vertex colours multiply the photoreal textures, so they stay near white.
const FLAT_TINT = new THREE.Color("#ffffff");
const HILL_TINT = new THREE.Color("#e6d9b8"); // warmer on higher ground
const ROCK_TINT = new THREE.Color("#8d7f6c"); // darker on steep faces
/** Metres of ground covered by one texture tile. Display only. */
export const GROUND_TILE_M = 60; // TUNABLE — render choice

interface WaterSurface {
  ring: Xz[];
  y: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  area: number;
}

/** Bilinear elevation lookup at world (x, z). Clamps to the grid edge. */
export function sampleElevation(map: MapData, x: number, z: number): number {
  const { width: W, height: H } = map.meta.elevation;
  const { minX, maxX, minZ, maxZ } = map.meta.extentM;
  const c = clamp(((x - minX) / (maxX - minX)) * (W - 1), 0, W - 1);
  const r = clamp(((maxZ - z) / (maxZ - minZ)) * (H - 1), 0, H - 1);
  const c0 = Math.floor(c);
  const r0 = Math.floor(r);
  const c1 = Math.min(c0 + 1, W - 1);
  const r1 = Math.min(r0 + 1, H - 1);
  const fc = c - c0;
  const fr = r - r0;
  const at = (rr: number, cc: number) => map.elevationM[rr * W + cc];
  const top = at(r0, c0) * (1 - fc) + at(r0, c1) * fc;
  const bottom = at(r1, c0) * (1 - fc) + at(r1, c1) * fc;
  return top * (1 - fr) + bottom * fr;
}

/** Each water ring with its flat surface height (DEM under its centroid) and bounding box. */
export function waterSurfaces(map: MapData): WaterSurface[] {
  return map.water
    .filter((ring) => ring.length >= 3)
    .map((ring) => {
      const [cx, cz] = centroid(ring);
      const xs = ring.map((p) => p[0]);
      const zs = ring.map((p) => p[1]);
      return {
        ring,
        y: sampleElevation(map, cx, cz),
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minZ: Math.min(...zs),
        maxZ: Math.max(...zs),
        area: Math.abs(shoelace(ring)),
      };
    });
}

/** Centre of the largest water body (Lake Elsinore). Used as the camera focus. */
export function lakeCentre(map: MapData): { x: number; z: number; y: number } {
  const biggest = waterSurfaces(map).reduce((a, b) => (b.area > a.area ? b : a));
  const [x, z] = centroid(biggest.ring);
  return { x, z, y: biggest.y };
}

/**
 * Terrain mesh from the DEM grid. Coloured by elevation and slope (steep faces
 * read as rock). Water bodies are carved in.
 */
export function buildTerrain(map: MapData): THREE.BufferGeometry {
  const { width: W, height: H } = map.meta.elevation;
  const { minX, maxX, minZ, maxZ } = map.meta.extentM;
  const { minM, maxM } = map.meta.elevation;
  const positions = new Float32Array(W * H * 3);
  const surfaces = waterSurfaces(map);

  for (let r = 0; r < H; r++) {
    for (let c = 0; c < W; c++) {
      const i = r * W + c;
      const x = minX + (c / (W - 1)) * (maxX - minX);
      const z = maxZ - (r / (H - 1)) * (maxZ - minZ);
      let y = map.elevationM[i];
      for (const s of surfaces) {
        if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue;
        if (pointInRing(x, z, s.ring)) y = Math.min(y, s.y - LAKE_BED_DEPTH_M);
      }
      positions.set([x, y, z], i * 3);
    }
  }

  const indices: number[] = [];
  for (let r = 0; r < H - 1; r++) {
    for (let c = 0; c < W - 1; c++) {
      const a = r * W + c;
      const b = a + 1;
      const d = a + W;
      const e = d + 1;
      // Counter-clockwise seen from above, so the front face points up.
      indices.push(a, b, d, b, e, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  // Colour needs the normals, so it is set after them.
  const normal = geo.getAttribute("normal");
  const colors = new Float32Array(W * H * 3);
  const uvs = new Float32Array(W * H * 2);
  const tmp = new THREE.Color();
  for (let i = 0; i < W * H; i++) {
    const elev = clamp((map.elevationM[i] - minM) / (maxM - minM), 0, 1);
    tmp.copy(FLAT_TINT).lerp(HILL_TINT, elev);
    // ny is 1 on flat ground and falls toward 0 on steep faces.
    const steep = clamp((0.9 - normal.getY(i)) / 0.5, 0, 1);
    tmp.lerp(ROCK_TINT, steep);
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
    const x = positions[i * 3];
    const z = positions[i * 3 + 2];
    uvs.set([x / GROUND_TILE_M, z / GROUND_TILE_M], i * 2);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  return geo;
}

/** How far the tile's edge skirt drops below the lowest ground. Display only. */
export const SKIRT_DEPTH_M = 250; // TUNABLE — render choice

/**
 * Vertical skirt around the tile edge, dropping to a flat base below the lowest
 * ground. Makes the map read as a solid model tile instead of a floating slab.
 */
export function buildSkirt(map: MapData): THREE.BufferGeometry {
  const { width: W, height: H } = map.meta.elevation;
  const { minX, maxX, minZ, maxZ } = map.meta.extentM;
  const base = map.meta.elevation.minM - SKIRT_DEPTH_M;
  const at = (i: number): [number, number, number] => {
    const r = Math.floor(i / W);
    const c = i % W;
    return [minX + (c / (W - 1)) * (maxX - minX), map.elevationM[i], maxZ - (r / (H - 1)) * (maxZ - minZ)];
  };
  // Perimeter grid indices, going once around the tile.
  const perimeter: number[] = [];
  for (let c = 0; c < W; c++) perimeter.push(c); // north edge, west to east
  for (let r = 1; r < H; r++) perimeter.push(r * W + (W - 1)); // east edge, north to south
  for (let c = W - 2; c >= 0; c--) perimeter.push((H - 1) * W + c); // south edge, east to west
  for (let r = H - 2; r >= 1; r--) perimeter.push(r * W); // west edge, south to north

  const positions: number[] = [];
  for (let k = 0; k < perimeter.length; k++) {
    const a = perimeter[k];
    const b = perimeter[(k + 1) % perimeter.length];
    const [ax, ay, az] = at(a);
    const [bx, by, bz] = at(b);
    // Two triangles per wall segment: top-a, top-b, bottom-a and top-b, bottom-b, bottom-a.
    positions.push(ax, ay, az, bx, by, bz, ax, base, az);
    positions.push(bx, by, bz, bx, base, bz, ax, base, az);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Lake and pond surfaces. Each ring is laid flat at the DEM elevation under its
 * centroid. The DEM is bare-earth, so water sits where the grid says it is.
 */
export function buildWater(map: MapData): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  for (const s of waterSurfaces(map)) {
    const shape = new THREE.Shape(s.ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, s.y, 0);
    parts.push(geo);
  }
  return parts.length ? mergeGeometries(parts) : null;
}

/** One ribbon mesh per OSM road class. Each ribbon hugs the terrain. */
export function buildRoads(map: MapData): Map<string, THREE.BufferGeometry> {
  const byClass = new Map<string, number[]>();
  const LIFT_M = 0.8; // keeps the ribbon above the grid so it doesn't z-fight

  for (const road of map.roads) {
    const width = ROAD_WIDTH_M[road.class];
    if (width === undefined) continue;
    const verts = byClass.get(road.class) ?? [];
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x0, z0] = road.points[i];
      const [x1, z1] = road.points[i + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz);
      if (len === 0) continue;
      const nx = (-dz / len) * (width / 2);
      const nz = (dx / len) * (width / 2);
      const y0 = sampleElevation(map, x0, z0) + LIFT_M;
      const y1 = sampleElevation(map, x1, z1) + LIFT_M;
      const a = [x0 + nx, y0, z0 + nz];
      const b = [x0 - nx, y0, z0 - nz];
      const c = [x1 + nx, y1, z1 + nz];
      const d = [x1 - nx, y1, z1 - nz];
      verts.push(...a, ...b, ...c, ...b, ...d, ...c);
    }
    byClass.set(road.class, verts);
  }

  const out = new Map<string, THREE.BufferGeometry>();
  for (const [cls, verts] of byClass) {
    if (verts.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    geo.computeVertexNormals();
    out.set(cls, geo);
  }
  return out;
}

/**
 * Extruded building footprints as two meshes: roofs and walls. Each building
 * gets its own wall and roof tint, stored as vertex colour.
 */
export function buildBuildings(map: MapData): { roofs: THREE.BufferGeometry | null; walls: THREE.BufferGeometry | null } {
  const roofParts: THREE.BufferGeometry[] = [];
  const wallParts: THREE.BufferGeometry[] = [];
  const wallCol = new THREE.Color();
  const roofCol = new THREE.Color();
  for (const b of map.buildings) {
    // Slivers under 1 m² have no usable roof and produce zero normals.
    if (b.footprint.length < 3 || Math.abs(shoelace(b.footprint)) < 1) continue;
    const shape = new THREE.Shape(b.footprint.map(([x, z]) => new THREE.Vector2(x, -z)));
    const height = b.heightM ?? DEFAULT_BUILDING_HEIGHT_M;
    const extruded = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
    // Extrude runs along +z in shape space. This maps shape y to world -z and depth to world +y.
    extruded.rotateX(-Math.PI / 2);
    const c = centroid(b.footprint);
    extruded.translate(0, sampleElevation(map, c[0], c[1]), 0);

    // ExtrudeGeometry emits its caps (group 0) and walls (group 1) as separate vertex ranges.
    const [caps, walls] = extruded.groups;
    wallCol.set(WALL_TINTS[b.id % WALL_TINTS.length]);
    roofCol.set(ROOF_TINTS[b.id % ROOF_TINTS.length]);
    roofParts.push(tint(upFacingCaps(sliceGeometry(extruded, caps.start, caps.count)), roofCol));
    wallParts.push(tint(sliceGeometry(extruded, walls.start, walls.count), wallCol));
  }
  return {
    roofs: roofParts.length ? mergeGeometries(roofParts) : null,
    walls: wallParts.length ? mergeGeometries(wallParts) : null,
  };
}

/** Copies a contiguous vertex range out of a non-indexed geometry. */
function sliceGeometry(geo: THREE.BufferGeometry, start: number, count: number): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  for (const name of ["position", "normal", "uv"] as const) {
    const attr = geo.getAttribute(name);
    out.setAttribute(name, new THREE.BufferAttribute(attr.array.slice(start * attr.itemSize, (start + count) * attr.itemSize), attr.itemSize));
  }
  return out;
}

/** Zero-area triangles from collinear footprint points get a zero normal. Caps are flat, so give them up. */
function upFacingCaps(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const normal = geo.getAttribute("normal");
  for (let i = 0; i < normal.count; i++) {
    if (normal.getX(i) === 0 && normal.getY(i) === 0 && normal.getZ(i) === 0) normal.setXYZ(i, 0, 1, 0);
  }
  return geo;
}

/** Sets a flat vertex colour on a geometry and returns it. */
function tint(geo: THREE.BufferGeometry, col: THREE.Color): THREE.BufferGeometry {
  const colors = new Float32Array(geo.getAttribute("position").count * 3);
  for (let v = 0; v < colors.length; v += 3) colors.set([col.r, col.g, col.b], v);
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

export interface TreePlacement {
  x: number;
  y: number;
  z: number;
  scale: number;
  tint: number;
}

/**
 * Trees along the main roads, plus a sparse scatter on the valley floor.
 * Seeded, so the same map always gets the same trees.
 */
export function treePlacements(map: MapData, seed = "lake-elsinore-trees"): TreePlacement[] {
  const rng = new Rng(seed);
  const out: TreePlacement[] = [];
  const STEP_M = 45;
  const roadClasses = new Set(["trunk", "primary", "secondary", "tertiary"]);

  for (const road of map.roads) {
    if (!roadClasses.has(road.class)) continue;
    const half = ROAD_WIDTH_M[road.class] / 2;
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x0, z0] = road.points[i];
      const [x1, z1] = road.points[i + 1];
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len === 0) continue;
      const nx = -(z1 - z0) / len;
      const nz = (x1 - x0) / len;
      for (let d = STEP_M / 2; d < len; d += STEP_M) {
        if (!rng.chance(0.6)) continue;
        const side = rng.chance(0.5) ? 1 : -1;
        const offset = half + 4 + rng.next() * 6;
        const x = x0 + ((x1 - x0) * d) / len + nx * offset * side;
        const z = z0 + ((z1 - z0) * d) / len + nz * offset * side;
        if (!insideExtent(map, x, z)) continue;
        out.push({ x, y: sampleElevation(map, x, z), z, scale: 0.8 + rng.next() * 0.6, tint: rng.next() });
      }
    }
  }

  // Sparse scatter on low ground away from the water: 6000 candidates, about 1 in 40 kept.
  const { minX, maxX, minZ, maxZ } = map.meta.extentM;
  for (let i = 0; i < 6000; i++) {
    const x = minX + rng.next() * (maxX - minX);
    const z = minZ + rng.next() * (maxZ - minZ);
    const y = sampleElevation(map, x, z);
    if (y > map.meta.elevation.minM + 60) continue;
    if (inAnyWater(map, x, z)) continue;
    if (!rng.chance(1 / 40)) continue;
    out.push({ x, y, z, scale: 0.7 + rng.next() * 0.5, tint: rng.next() });
  }
  return out;
}

function insideExtent(map: MapData, x: number, z: number): boolean {
  const { minX, maxX, minZ, maxZ } = map.meta.extentM;
  return x >= minX && x <= maxX && z >= minZ && z <= maxZ;
}

function inAnyWater(map: MapData, x: number, z: number): boolean {
  for (const s of waterSurfaces(map)) {
    if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) continue;
    if (pointInRing(x, z, s.ring)) return true;
  }
  return false;
}

function centroid(ring: Xz[]): Xz {
  let x = 0;
  let z = 0;
  for (const [px, pz] of ring) {
    x += px;
    z += pz;
  }
  return [x / ring.length, z / ring.length];
}

function shoelace(ring: Xz[]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return sum / 2;
}

/** Even-odd ray cast in the x/z plane. */
function pointInRing(x: number, z: number, ring: Xz[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, zi] = ring[i];
    const [xj, zj] = ring[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
