// Real-data city map in 3D. Geometry comes from map-geometry.ts; this file only
// does lighting, materials and the camera. Nothing here touches sim state.
import { useMemo } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sky } from "@react-three/drei";
import mapJson from "../../data/processed/lake-elsinore-map.json";
import {
  type MapData,
  buildBuildings,
  buildRoads,
  buildTerrain,
  buildWater,
} from "./map-geometry";

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

function MapMeshes() {
  const terrain = useMemo(() => buildTerrain(map), []);
  const water = useMemo(() => buildWater(map), []);
  const roads = useMemo(() => buildRoads(map), []);
  const buildings = useMemo(() => buildBuildings(map), []);

  return (
    <group scale={[1, VERTICAL_EXAGGERATION, 1]}>
      <mesh geometry={terrain} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>

      {water && (
        <mesh geometry={water} position={[0, 0.2, 0]} receiveShadow>
          <meshPhysicalMaterial
            color="#1d5b7a"
            roughness={0.06}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.05}
            transparent
            opacity={0.94}
          />
        </mesh>
      )}

      {[...roads.entries()].map(([cls, geo]) => (
        <mesh key={cls} geometry={geo} receiveShadow>
          <meshStandardMaterial color={ROAD_COLORS[cls] ?? "#55555a"} roughness={0.85} />
        </mesh>
      ))}

      {buildings && (
        <mesh geometry={buildings} castShadow receiveShadow>
          <meshStandardMaterial color="#d9cdb4" roughness={0.8} metalness={0} />
        </mesh>
      )}
    </group>
  );
}

export default function MapScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 14000, 16000], fov: 40, near: 10, far: 200000 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      style={{ width: "100vw", height: "100vh" }}
    >
      <Sky distance={450000} sunPosition={[0.4, 0.35, 0.7]} inclination={0.49} azimuth={0.25} />
      <hemisphereLight args={["#cfe6ff", "#7a6a4f", 0.7]} />
      <directionalLight
        castShadow
        position={[9000, 14000, 6000]}
        intensity={2.2}
        color="#fff1d6"
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-14000}
        shadow-camera-right={14000}
        shadow-camera-top={14000}
        shadow-camera-bottom={-14000}
        shadow-camera-far={60000}
      />
      <fog attach="fog" args={["#d8e4ea", 30000, 120000]} />
      <MapMeshes />
      <OrbitControls target={[0, 400, 0]} maxPolarAngle={Math.PI / 2.05} minDistance={2000} maxDistance={60000} />
    </Canvas>
  );
}
