// City Hall, in 3D. Architecture from smooth profiles (lathe, extrude) and the
// photoreal facade and roof textures from the asset pipeline. Decorative: it does
// not read or write sim state.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Sky, useTexture } from "@react-three/drei";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const COLUMN_XS = Array.from({ length: 6 }, (_, i) => -6 + i * 2.4);

/** Pediment: a triangle of stone, extruded to a little depth. */
function pedimentGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-8, 0);
  shape.lineTo(8, 0);
  shape.lineTo(0, 3.2);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 2, curveSegments: 1 });
}

/** Dome profile turned on a lathe, so the curve is smooth rather than faceted. */
function domeGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.001, 3.4 * Math.cos(t)), 3.4 * Math.sin(t)));
  }
  return new THREE.LatheGeometry(pts, 64);
}

function Building() {
  const [facade, roof] = useTexture(["/assets/photoreal/tex-facade.png", "/assets/photoreal/tex-roof.png"]);
  const stone = useMemo(() => {
    const t = facade.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 26, 1 / 26);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  }, [facade]);
  const roofTex = useMemo(() => {
    const t = roof.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / 8, 1 / 8);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [roof]);
  const pediment = useMemo(() => pedimentGeometry(), []);
  const dome = useMemo(() => domeGeometry(), []);
  useEffect(() => () => { pediment.dispose(); dome.dispose(); }, [pediment, dome]);

  return (
    <group>
      {/* Plinth and a wide stair of three steps */}
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[27, 0.7, 15]} />
        <meshStandardMaterial color="#c7bfab" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.12 + i * 0.12, 8.2 + i * 0.5]} castShadow receiveShadow>
          <boxGeometry args={[12 - i * 0.5, 0.24, 0.5]} />
          <meshStandardMaterial color="#d8d0bd" roughness={0.85} />
        </mesh>
      ))}

      {/* Main hall, with the facade texture */}
      <mesh position={[0, 4.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[22, 7.6, 11]} />
        <meshStandardMaterial map={stone} roughness={0.85} />
      </mesh>
      {/* Cornice band and roof parapet */}
      <mesh position={[0, 8.35, 0]} castShadow>
        <boxGeometry args={[22.8, 0.55, 11.8]} />
        <meshStandardMaterial color="#ece6d8" roughness={0.7} />
      </mesh>
      <mesh position={[0, 8.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[22.2, 0.4, 11.2]} />
        <meshStandardMaterial map={roofTex} roughness={0.8} />
      </mesh>

      {/* Portico: columns with capitals and a pediment */}
      {COLUMN_XS.map((x) => (
        <group key={x} position={[x, 0, 6.2]}>
          <mesh position={[0, 4.2, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.5, 6.7, 28]} />
            <meshStandardMaterial color="#f1ece0" roughness={0.55} />
          </mesh>
          <mesh position={[0, 7.65, 0]} castShadow>
            <cylinderGeometry args={[0.66, 0.5, 0.35, 28]} />
            <meshStandardMaterial color="#e9e2d1" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, 0.4, 28]} />
            <meshStandardMaterial color="#e9e2d1" roughness={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 7.9, 6.2]} castShadow>
        <primitive object={pediment} attach="geometry" />
        <meshStandardMaterial color="#ebe4d3" roughness={0.6} />
      </mesh>
      {/* Entrance recess */}
      <mesh position={[0, 3.2, 5.5]}>
        <boxGeometry args={[3.2, 5.4, 0.2]} />
        <meshStandardMaterial color="#3d4650" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Drum, dome and lantern */}
      <mesh position={[0, 9.9, 0]} castShadow>
        <cylinderGeometry args={[3.1, 3.4, 2.4, 48]} />
        <meshStandardMaterial color="#efe9dc" roughness={0.6} />
      </mesh>
      <mesh position={[0, 11.1, 0]} castShadow>
        <primitive object={dome} attach="geometry" />
        <meshStandardMaterial color="#5f7d86" roughness={0.35} metalness={0.45} />
      </mesh>
      <mesh position={[0, 14.7, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 2.6, 12]} />
        <meshStandardMaterial color="#c9a227" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 16.1, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#d9b44a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Lawn and rounded shrubs */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <meshStandardMaterial color="#6f8c4a" roughness={1} />
      </mesh>
      {[-14, -9, 9, 14].flatMap((x) =>
        [7.5, 10.5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.9, z]} castShadow>
            <sphereGeometry args={[1.3, 24, 16]} />
            <meshStandardMaterial color="#4f6f3a" roughness={0.95} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Image-based light from a built-in room, so the copper and stone have something to reflect. */
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

export default function CityHallScene() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [24, 13, 32], fov: 36, near: 0.5, far: 500 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }} style={{ width: "100%", height: "100%" }}>
      <color attach="background" args={["#cfdde4"]} />
      <Sky distance={450000} sunPosition={[0.6, 0.4, 0.5]} inclination={0.49} azimuth={0.25} />
      <hemisphereLight args={["#cfe6ff", "#7a6a4f", 0.5]} />
      <directionalLight castShadow position={[18, 26, 12]} intensity={2.2} color="#fff1d6" shadow-mapSize={[2048, 2048]} shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-normalBias={0.05} />
      <ImageBasedLight />
      <Building />
      <OrbitControls target={[0, 6, 0]} maxPolarAngle={Math.PI / 2.1} minDistance={12} maxDistance={70} />
    </Canvas>
  );
}
