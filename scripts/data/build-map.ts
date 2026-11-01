// Turns data/raw/ into data/processed/lake-elsinore-map.json.
// The map covers a region around the city (REGION), so surrounding land can be
// designated or bought. The city boundary and the city's buildings are kept separately.
// Geometry is projected to local metres (equirectangular at the city centre); z = north.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const RAW = resolve(ROOT, "data/raw");
const OUT = resolve(ROOT, "data/processed/lake-elsinore-map.json");

/** The city itself (OSM relation 11051981 bounds). */
const CITY = { minLat: 33.6185, minLon: -117.42, maxLat: 33.7568, maxLon: -117.2168 };
/** The wider region the map covers. Matches the DEM and the regional OSM tiles in fetch.sh. */
const REGION = { minLat: 33.5, minLon: -117.6, maxLat: 33.88, maxLon: -117.05 };
const DEM = { width: 768, height: 576 };

const ORIGIN = { lat: (CITY.minLat + CITY.maxLat) / 2, lon: (CITY.minLon + CITY.maxLon) / 2 };
const METRES_PER_DEG_LAT = 110_540;
const METRES_PER_DEG_LON = 111_320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

type LatLon = { lat: number; lon: number };
type OsmWay = { type: "way"; id: number; tags?: Record<string, string>; geometry: LatLon[] };
type OsmRel = { type: "relation"; id: number; tags?: Record<string, string>; members: { type: string; role: string; geometry?: LatLon[] }[] };
type Xz = [number, number];

const round1 = (n: number) => Math.round(n * 10) / 10;
const project = (p: LatLon): Xz => [round1((p.lon - ORIGIN.lon) * METRES_PER_DEG_LON), round1((p.lat - ORIGIN.lat) * METRES_PER_DEG_LAT)];
const extentOf = (b: typeof CITY) => ({
  minX: round1((b.minLon - ORIGIN.lon) * METRES_PER_DEG_LON),
  maxX: round1((b.maxLon - ORIGIN.lon) * METRES_PER_DEG_LON),
  minZ: round1((b.minLat - ORIGIN.lat) * METRES_PER_DEG_LAT),
  maxZ: round1((b.maxLat - ORIGIN.lat) * METRES_PER_DEG_LAT),
});
const elements = (file: string) => JSON.parse(readFileSync(resolve(RAW, file), "utf8")).elements as (OsmWay | OsmRel)[];

/** Merges OSM tiles, keeping each element once (OSM ids repeat across overlapping tiles). */
function mergedElements(files: string[]): (OsmWay | OsmRel)[] {
  const seen = new Map<string, OsmWay | OsmRel>();
  for (const f of files) for (const el of elements(f)) seen.set(`${el.type}/${el.id}`, el);
  return [...seen.values()];
}

// --- elevation over the region ---------------------------------------------
const demBuf = readFileSync(resolve(RAW, "region-dem.bin"));
const samples = new Float32Array(demBuf.buffer, demBuf.byteOffset, DEM.width * DEM.height);
const elevation = Array.from(samples, (v) => (v <= -9000 ? 0 : round1(v)));
let elevationMin = Infinity;
let elevationMax = -Infinity;
for (const v of elevation) {
  if (v <= 0) continue; // 0 is the no-data marker
  if (v < elevationMin) elevationMin = v;
  if (v > elevationMax) elevationMax = v;
}

// --- water and roads over the region (merged tiles) -------------------------
const regionOsm = mergedElements(["rw-1.json", "rw-2.json", "rw-3.json", "rw-4.json"]);
const waterRings: Xz[][] = [];
const waterNames: string[] = [];
for (const el of regionOsm) {
  if (el.type === "way" && el.tags?.natural === "water" && el.geometry?.length > 2) {
    waterRings.push(el.geometry.map(project));
    if (el.tags?.name) waterNames.push(el.tags.name);
  }
}
const roads = regionOsm
  .filter((el): el is OsmWay => el.type === "way" && !!el.tags?.highway && el.geometry?.length > 1)
  .map((el) => ({ id: el.id, class: el.tags?.highway ?? "", name: el.tags?.name ?? null, points: el.geometry.map(project) }));

// --- the city: boundary outline and its buildings ----------------------------
const cityRel = elements("osm-city-boundary.json")[0] as OsmRel;
const cityOutline: Xz[][] = cityRel.members
  .filter((m) => m.role === "outer" && m.geometry?.length)
  .map((m) => m.geometry!.map(project));
const buildings = (elements("osm-buildings.json") as OsmWay[])
  .filter((el) => el.type === "way" && el.geometry?.length > 2)
  .map((el) => {
    const levels = Number(el.tags?.["building:levels"]);
    const height = Number(el.tags?.height);
    return {
      id: el.id,
      footprint: el.geometry.map(project),
      heightM: Number.isFinite(height) && height > 0 ? height : Number.isFinite(levels) && levels > 0 ? round1(levels * 3.2) : null,
    };
  });

const map = {
  meta: {
    builtBy: "scripts/data/build-map.ts",
    origin: ORIGIN,
    city: { bounds: CITY, extentM: extentOf(CITY) },
    region: { bounds: REGION, extentM: extentOf(REGION) },
    // Terrain, water and roads cover the region. The renderer reads this extent.
    extentM: extentOf(REGION),
    units: "metres; x east, z north, origin at the city centre",
    sources: [
      { name: "OpenStreetMap contributors (ODbL)", url: "https://www.openstreetmap.org/copyright", used: "city boundary, regional water and roads, city buildings" },
      { name: "USGS 3D Elevation Program (3DEP)", url: "https://www.usgs.gov/3d-elevation-program", used: "bare-earth DEM over the region, 768x576 float32" },
    ],
    waterNames: [...new Set(waterNames)],
    elevation: { width: DEM.width, height: DEM.height, minM: elevationMin, maxM: elevationMax, order: "row-major, row 0 = north (maxZ)" },
    counts: { waterRings: waterRings.length, roads: roads.length, buildings: buildings.length, cityOutlineRings: cityOutline.length },
  },
  elevationM: elevation,
  water: waterRings,
  roads,
  cityOutline,
  buildings,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map));
// The game fetches the map from public/data at runtime, so the same file goes there.
const PUBLIC = resolve(ROOT, "public/data/lake-elsinore-map.json");
mkdirSync(dirname(PUBLIC), { recursive: true });
writeFileSync(PUBLIC, JSON.stringify(map));
console.log("wrote", OUT, map.meta.counts, "elev", elevationMin, "-", elevationMax);
