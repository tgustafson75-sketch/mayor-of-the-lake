// Real-data city map in 3D. Geometry comes from map-geometry.ts; this file only
// does lighting, materials, props and the camera. Nothing here touches sim state.
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls, Sky, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CAMERA_PRESETS, type CameraPreset } from "../config/cameras";
import { useCamera } from "../ui/cameraStore";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  type MapData,
  type TreePlacement,
  buildBuildings,
  buildRoads,
  buildSkirt,
  buildTerrain,
  GROUND_TILE_M,
  buildWater,
  lakeCentre,
  treePlacements,
} from "./map-geometry";

export type MapMode = "backdrop" | "full";

/** Display-only vertical exaggeration so the hills read at city scale. Not sim data. */
const VERTICAL_EXAGGERATION = 2; // TUNABLE — render choice, not a fact

const ROAD_COLORS: Readonly<Record<string, string>> = {
  motorway: "#3a3a3d",
  trunk: "#434347",
  primary: "#4d4d52",
  secondary: "#56565c",
  tertiary: "#62626a",
};

// The map is ~2 MB of data. It is fetched at runtime, not bundled, and Suspense
// holds the scene until it arrives.
let mapData: MapData | null = null;
let mapLoading: Promise<void> | null = null;
function useMapData(): MapData {
  if (mapData) return mapData;
  mapLoading ??= fetch("/data/lake-elsinore-map.json")
    .then((r) => {
      if (!r.ok) throw new Error(`map data failed to load: HTTP ${r.status}`);
      return r.json() as Promise<MapData>;
    })
    .then((d) => {
      mapData = d;
    });
  throw mapLoading;
}

function buildAssets(map: MapData) {
  return {
    terrain: buildTerrain(map),
    skirt: buildSkirt(map),
    water: buildWater(map),
    roads: buildRoads(map),
    buildings: buildBuildings(map),
    trees: treePlacements(map),
  };
}

/** Photoreal tiles from scripts/assets/generate.ts, one per surface. Metres per tile set per surface. */
const TEXTURE_PATHS = {
  ground: "/assets/photoreal/tex-ground.png",
  water: "/assets/photoreal/tex-water.png",
  facade: "/assets/photoreal/tex-facade.png",
  roof: "/assets/photoreal/tex-roof.png",
} as const;
const TILE_M = { ground: GROUND_TILE_M, water: 2000, facade: 12, roof: 30 } as const;

function usePhotoTextures() {
  const [ground, water, facade, roof] = useTexture([
    TEXTURE_PATHS.ground,
    TEXTURE_PATHS.water,
    TEXTURE_PATHS.facade,
    TEXTURE_PATHS.roof,
  ]);
  return useMemo(() => {
    // Mirrored wrapping hides seams even where a generated tile is not perfectly seamless.
    const prep = (tex: THREE.Texture, tileM: number) => {
      tex.wrapS = THREE.MirroredRepeatWrapping;
      tex.wrapT = THREE.MirroredRepeatWrapping;
      tex.repeat.set(1 / tileM, 1 / tileM);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      return tex;
    };
    return {
      ground: prep(ground, TILE_M.ground),
      water: prep(water, TILE_M.water),
      facade: prep(facade, TILE_M.facade),
      roof: prep(roof, TILE_M.roof),
    };
  }, [ground, water, facade, roof]);
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

function MapMeshes({ map }: { map: MapData }) {
  const { terrain, skirt, water, roads, buildings, trees } = useMemo(() => buildAssets(map), [map]);
  const tex = usePhotoTextures();

  return (
    <group scale={[1, VERTICAL_EXAGGERATION, 1]}>
      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial vertexColors map={tex.ground} roughness={0.95} metalness={0} />
      </mesh>
      <mesh geometry={skirt}>
        <meshStandardMaterial color="#4a4134" roughness={1} side={THREE.DoubleSide} />
      </mesh>

      {water && (
        <mesh geometry={water} position={[0, 0.2, 0]}>
          <meshPhysicalMaterial
            map={tex.water}
            color="#8fb9c9"
            roughness={0.22}
            metalness={0}
            clearcoat={0.2}
            clearcoatRoughness={0.3}
            envMapIntensity={0.45}
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
          <meshStandardMaterial vertexColors map={tex.roof} roughness={0.9} />
        </mesh>
      )}
      {buildings.walls && (
        <mesh geometry={buildings.walls} castShadow receiveShadow>
          <meshStandardMaterial vertexColors map={tex.facade} roughness={0.75} />
        </mesh>
      )}

      <Trees placements={trees} />
    </group>
  );
}

/**
 * Glides the camera and orbit target to the chosen preset. "free" leaves the
 * camera where the user put it. View only: no sim state is read or written.
 */
function CameraRig({ focus }: { focus: { x: number; y: number; z: number } }) {
  const preset = useCamera((s) => s.preset);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as { target: THREE.Vector3; update: () => void } | null;
  const goalPos = useRef(new THREE.Vector3());
  const goalTarget = useRef(new THREE.Vector3());
  const animating = useRef(false);

  useEffect(() => {
    const p: CameraPreset = CAMERA_PRESETS.find((c) => c.id === preset)!;
    if (p.id === "free") return;
    goalPos.current.set(focus.x + p.offset[0], focus.y * VERTICAL_EXAGGERATION + p.offset[1], focus.z + p.offset[2]);
    goalTarget.current.set(focus.x + p.target[0], focus.y * VERTICAL_EXAGGERATION + p.target[1], focus.z + p.target[2]);
    animating.current = true;
  }, [preset, focus]);

  useFrame(() => {
    if (!animating.current) return;
    camera.position.lerp(goalPos.current, 0.08);
    if (controls) {
      controls.target.lerp(goalTarget.current, 0.08);
      controls.update();
    }
    if (camera.position.distanceTo(goalPos.current) < 2) animating.current = false;
  });
  return null;
}

export default function MapScene({ mode }: { mode: MapMode }) {
  const map = useMapData();
  const focus = useMemo(() => lakeCentre(map), [map]);
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
      <MapMeshes map={map} />
      {full && <CameraRig focus={focus} />}
      <OrbitControls
        makeDefault
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
