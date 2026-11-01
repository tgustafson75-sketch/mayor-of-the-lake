// Real-data city map in 3D. Geometry comes from map-geometry.ts; this file only
// does lighting, materials, props and the camera. Nothing here touches sim state.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import mapJson from "../../data/processed/lake-elsinore-map.json";
import {
  type MapData,
  type TreePlacement,
  buildBuildings,
  buildRoads,
  buildSkirt,
  buildTerrain,
  buildWater,
  lakeCentre,
  treePlacements,
} from "./map-geometry";

export type MapMode = "backdrop" | "full";

const map = mapJson as unknown as MapData;

/** Display-only vertical exaggeration so the hills read at city scale. Not sim data. */
const VERTICAL_EXAGGERATION = 2; // TUNABLE — render choice, not a fact

const ROAD_COLORS: Readonly<Record<string, string>> = {
  motorway: "#3a3a3d",
  trunk: "#434347",
  primary: "#4d4d52",
  secondary: "#56565c",
  tertiary: "#62626a",
};

const focus = lakeCentre(map);

// Built once per page load. Heavy, so it is shared by both modes.
let assets: ReturnType<typeof buildAssets> | null = null;
function buildAssets() {
  return {
    terrain: buildTerrain(map),
    skirt: buildSkirt(map),
    water: buildWater(map),
    roads: buildRoads(map),
    buildings: buildBuildings(map),
    trees: treePlacements(map),
  };
}
function getAssets() {
  assets ??= buildAssets();
  return assets;
}

/** Procedural facade: a grid of dark windows on a white tile. Tinted by vertex colour. */
function makeWindowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d")!;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 128, 128);
  for (const x of [14, 78]) {
    for (const y of [18, 82]) {
      g.fillStyle = "#2b3643";
      g.fillRect(x, y, 36, 28);
      g.fillStyle = "#e9eef2";
      g.fillRect(x - 2, y + 28, 40, 3); // sill
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1 / 10, 1 / 10); // one tile per 10 m of wall
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function Lighting() {
  return (
    <>
      <Sky distance={450000} sunPosition={[0.4, 0.35, 0.7]} inclination={0.49} azimuth={0.25} />
      <hemisphereLight args={["#cfe6ff", "#7a6a4f", 0.6]} />
      <directionalLight
        castShadow
        position={[9000, 14000, 6000]}
        intensity={2.2}
        color="#fff1d6"
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={20}
        shadow-camera-left={-14000}
        shadow-camera-right={14000}
        shadow-camera-top={14000}
        shadow-camera-bottom={-14000}
        shadow-camera-far={60000}
      />
    </>
  );
}

/** Image-based light from a built-in room. Gives the water and metal something to reflect, with no network fetch. */
function ImageBasedLight() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
}

function Trees({ placements }: { placements: TreePlacement[] }) {
  const trunks = useRef<THREE.InstancedMesh>(null);
  const crowns = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const trunkMesh = trunks.current;
    const crownMesh = crowns.current;
    if (!trunkMesh || !crownMesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const col = new THREE.Color();
    placements.forEach((t, i) => {
      p.set(t.x, t.y + 3 * t.scale, t.z);
      s.set(t.scale, t.scale, t.scale);
      m.compose(p, q, s);
      trunkMesh.setMatrixAt(i, m);

      p.set(t.x, t.y + 7 * t.scale, t.z);
      s.set(t.scale * 1.1, t.scale * 1.3, t.scale * 1.1);
      m.compose(p, q, s);
      crownMesh.setMatrixAt(i, m);
      // Olive to dry-grass greens, varied per tree.
      col.setHSL(0.2 + t.tint * 0.07, 0.38 + t.tint * 0.1, 0.24 + t.tint * 0.1);
      crownMesh.setColorAt(i, col);
    });
    trunkMesh.instanceMatrix.needsUpdate = true;
    crownMesh.instanceMatrix.needsUpdate = true;
    if (crownMesh.instanceColor) crownMesh.instanceColor.needsUpdate = true;
  }, [placements]);

  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, placements.length]} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 6, 6]} />
        <meshStandardMaterial color="#5a4632" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, placements.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[3.2, 2]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
    </>
  );
}

function MapMeshes() {
  const { terrain, skirt, water, roads, buildings, trees } = getAssets();
  const windowMap = useMemo(() => makeWindowTexture(), []);
  useEffect(() => () => windowMap.dispose(), [windowMap]);

  return (
    <group scale={[1, VERTICAL_EXAGGERATION, 1]}>
      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>
      <mesh geometry={skirt}>
        <meshStandardMaterial color="#4a4134" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {water && (
        <mesh geometry={water} position={[0, 0.2, 0]} receiveShadow>
          <meshPhysicalMaterial
            color="#1d5b7a"
            roughness={0.12}
            metalness={0}
            clearcoat={0.6}
            clearcoatRoughness={0.1}
            envMapIntensity={0.55}
          />
        </mesh>
      )}

      {[...roads.entries()].map(([cls, geo]) => (
        <mesh key={cls} geometry={geo} receiveShadow>
          <meshStandardMaterial color={ROAD_COLORS[cls] ?? "#55555a"} roughness={0.85} />
        </mesh>
      ))}

      {buildings.roofs && (
        <mesh geometry={buildings.roofs} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.9} />
        </mesh>
      )}
      {buildings.walls && (
        <mesh geometry={buildings.walls} castShadow receiveShadow>
          <meshStandardMaterial vertexColors map={windowMap} roughness={0.75} />
        </mesh>
      )}

      <Trees placements={trees} />
    </group>
  );
}

export default function MapScene({ mode }: { mode: MapMode }) {
  const full = mode === "full";
  const cam = full
    ? { position: [focus.x - 3000, focus.y * VERTICAL_EXAGGERATION + 4800, focus.z + 5600] as [number, number, number], fov: 40 }
    : { position: [0, 16000, 18000] as [number, number, number], fov: 40 };
  const target: [number, number, number] = full ? [focus.x, focus.y * VERTICAL_EXAGGERATION, focus.z] : [0, 0, 0];

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: cam.position, fov: cam.fov, near: 10, far: 200000 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#cfdde4"]} />
      <fog attach="fog" args={["#d8e4ea", 30000, 120000]} />
      <Lighting />
      <ImageBasedLight />
      <MapMeshes />
      <OrbitControls
        target={target}
        autoRotate={!full}
        autoRotateSpeed={0.35}
        enablePan={full}
        enableZoom={full}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={800}
        maxDistance={60000}
      />
    </Canvas>
  );
}
