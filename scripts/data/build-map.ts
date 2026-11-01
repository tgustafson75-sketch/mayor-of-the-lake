// Turns data/raw/ into data/processed/lake-elsinore-map.json.
// Geometry is projected to local metres (equirectangular, origin at the city's
// bounds centre), so the 3D scene uses x = east, z = north, units = metres.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const RAW = resolve(ROOT, "data/raw");
const OUT = resolve(ROOT, "data/processed/lake-elsinore-map.json");

const BOUNDS = { minLat: 33.6185, minLon: -117.42, maxLat: 33.7568, maxLon: -117.2168 };
const ORIGIN = { lat: (BOUNDS.minLat + BOUNDS.maxLat) / 2, lon: (BOUNDS.minLon + BOUNDS.maxLon) / 2 };
const METRES_PER_DEG_LAT = 110_540;
const METRES_PER_DEG_LON = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);
const DEM = { width: 512, height: 384 };
// Extent of the bounds box in metres, so the renderer can place the DEM grid.
const EXTENT_M = {
  minX: (BOUNDS.minLon - ORIGIN.lon) * METRES_PER_DEG_LON,
  maxX: (BOUNDS.maxLon - ORIGIN.lon) * METRES_PER_DEG_LON,
  minZ: (BOUNDS.minLat - ORIGIN.lat) * METRES_PER_DEG_LAT,
  maxZ: (BOUNDS.maxLat - ORIGIN.lat) * METRES_PER_DEG_LAT,
};

type LatLon = { lat: number; lon: number };
type OsmWay = { type: "way"; id: number; tags?: Record<string, string>; geometry: LatLon[] };
type OsmRel = { type: "relation"; id: number; tags?: Record<string, string>; members: { type: string; role: string; geometry?: LatLon[] }[] };
type Xz = [number, number];

const project = (p: LatLon): Xz => [
  round1((p.lon - ORIGIN.lon) * METRES_PER_DEG_LON),
  round1((p.lat - ORIGIN.lat) * METRES_PER_DEG_LAT),
];
const round1 = (n: number) => Math.round(n * 10) / 10;
const elements = (file: string) => JSON.parse(readFileSync(resolve(RAW, file), "utf8")).elements as (OsmWay | OsmRel)[];

// --- elevation -----------------------------------------------------------
const demBuf = readFileSync(resolve(RAW, "dem.bin"));
const samples = new Float32Array(demBuf.buffer, demBuf.byteOffset, DEM.width * DEM.height);
const elevation = Array.from(samples, (v) => (v <= -9000 ? 0 : round1(v)));
let elevationMin = Infinity;
let elevationMax = -Infinity;
for (const v of elevation) {
  if (v <= 0) continue; // 0 is the no-data marker
  if (v < elevationMin) elevationMin = v;
  if (v > elevationMax) elevationMax = v;
}

// --- water: lake polygons, rings projected to metres ---------------------
const waterRings: Xz[][] = [];
const waterNames: string[] = [];
for (const el of elements("osm-water.json")) {
  if (el.type === "way" && el.geometry?.length > 2) {
    waterRings.push(el.geometry.map(project));
    if (el.tags?.name) waterNames.push(el.tags.name);
  } else if (el.type === "relation") {
    for (const m of el.members) if (m.role === "outer" && m.geometry?.length) waterRings.push(m.geometry.map(project));
    if (el.tags?.name) waterNames.push(el.tags.name);
  }
}

// --- roads: centreline polylines -----------------------------------------
const roads = (elements("osm-roads.json") as OsmWay[])
  .filter((el) => el.type === "way" && el.geometry?.length > 1)
  .map((el) => ({
    id: el.id,
    class: el.tags?.highway ?? "",
    name: el.tags?.name ?? null,
    points: el.geometry.map(project),
  }));

// --- buildings: footprints + height where OSM gives one -------------------
const buildings = (elements("osm-buildings.json") as OsmWay[])
  .filter((el) => el.type === "way" && el.geometry?.length > 2)
  .map((el) => {
    const levels = Number(el.tags?.["building:levels"]);
    const height = Number(el.tags?.height);
    return {
      id: el.id,
      footprint: el.geometry.map(project),
      // OSM height, else levels * 3.2 m, else null (renderer uses a default and the source says so)
      heightM: Number.isFinite(height) && height > 0 ? height : Number.isFinite(levels) && levels > 0 ? round1(levels * 3.2) : null,
    };
  });

const map = {
  meta: {
    builtBy: "scripts/data/build-map.ts",
    origin: ORIGIN,
    bounds: BOUNDS,
    units: "metres; x east, z north, origin at bounds centre",
    extentM: EXTENT_M,
    sources: [
      { name: "OpenStreetMap contributors (ODbL)", url: "https://www.openstreetmap.org/copyright", used: "city boundary relation 11051981, water, roads, buildings" },
      { name: "USGS 3D Elevation Program (3DEP)", url: "https://www.usgs.gov/3d-elevation-program", used: "bare-earth DEM, 512x384 float32 over bounds" },
    ],
    waterNames: [...new Set(waterNames)],
    elevation: { width: DEM.width, height: DEM.height, minM: elevationMin, maxM: elevationMax, order: "row-major, row 0 = north (maxZ)" },
    counts: { waterRings: waterRings.length, roads: roads.length, buildings: buildings.length },
  },
  elevationM: elevation,
  water: waterRings,
  roads,
  buildings,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map));
console.log("wrote", OUT, map.meta.counts, "elev", elevationMin, "-", elevationMax);
