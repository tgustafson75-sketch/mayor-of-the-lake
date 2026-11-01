// Camera presets (addendum section 3). Offsets are metres from the focus point
// (the lake centre). Cameras never change sim state.

export type CameraPresetId = "city" | "street" | "lake" | "planner" | "free";

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  /** Camera position relative to the focus, metres. Ignored for free. */
  offset: readonly [number, number, number];
  /** Orbit target relative to the focus, metres. */
  target: readonly [number, number, number];
  fov: number;
}

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  { id: "city", label: "City", offset: [-3000, 4800, 5600], target: [0, 0, 0], fov: 40 }, // ~45° overhead, default
  { id: "street", label: "Street", offset: [-600, 60, 900], target: [0, 20, 0], fov: 60 }, // walking level
  { id: "lake", label: "Lake", offset: [-2400, 90, -2600], target: [0, 0, 0], fov: 50 }, // from the water toward shore
  { id: "planner", label: "Planner", offset: [0, 14000, 0.1], target: [0, 0, 0], fov: 35 }, // top-down, overlays
  { id: "free", label: "Free", offset: [-3000, 4800, 5600], target: [0, 0, 0], fov: 40 }, // user controls
];

export const DEFAULT_CAMERA: CameraPresetId = "city";
