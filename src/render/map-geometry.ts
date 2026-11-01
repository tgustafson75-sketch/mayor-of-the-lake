// Turns data/processed/lake-elsinore-map.json into three.js geometry.
// Pure functions, no React, so they can be unit-tested in Node.
// Units: metres. x = east, z = north, y = up.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

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

/** How far the lake bed sits below the water surface. Display only; not sourced. */
export const LAKE_BED_DEPTH_M = 4; // TUNABLE — not sourced

interface WaterSurface {
  ring: Xz[];
  y: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
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
      };
    });
}

/** Terrain mesh from the DEM grid, vertex-coloured by elevation. Water bodies are carved in. */
export function buildTerrain(map: MapData): THREE.BufferGeometry {
  const { width: W, height: H } = map.meta.elevation;
  const { minX, maxX, minZ, maxZ } = map.meta.extentM;
  const positions = new Float32Array(W * H * 3);
  const colors = new Float32Array(W * H * 3);
  const { minM, maxM } = map.meta.elevation;
  const low = new THREE.Color("#8a9a6a"); // valley floor, green-tan
  const high = new THREE.Color("#b49a6e"); // dry hills, tan
  const tmp = new THREE.Color();
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
      tmp.copy(low).lerp(high, clamp((y - minM) / (maxM - minM), 0, 1));
      colors.set([tmp.r, tmp.g, tmp.b], i * 3);
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
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
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

/** Extruded building footprints, merged into one mesh. */
export function buildBuildings(map: MapData): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  for (const b of map.buildings) {
    if (b.footprint.length < 3) continue;
    const shape = new THREE.Shape(b.footprint.map(([x, z]) => new THREE.Vector2(x, -z)));
    const height = b.heightM ?? DEFAULT_BUILDING_HEIGHT_M;
    const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 1 });
    // Extrude runs along +z in shape space. This maps shape y to world -z and depth to world +y.
    geo.rotateX(-Math.PI / 2);
    const c = centroid(b.footprint);
    geo.translate(0, sampleElevation(map, c[0], c[1]), 0);
    parts.push(geo);
  }
  return parts.length ? mergeGeometries(parts) : null;
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
