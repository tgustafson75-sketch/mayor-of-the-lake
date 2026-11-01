// Which camera preset is showing. View state only: nothing here touches the sim.
import { create } from "zustand";
import { DEFAULT_CAMERA, type CameraPresetId } from "../config/cameras";

export interface CameraStore {
  preset: CameraPresetId;
  setPreset: (id: CameraPresetId) => void;
}

export const useCamera = create<CameraStore>((set) => ({
  preset: DEFAULT_CAMERA,
  setPreset: (preset) => set({ preset }),
}));
