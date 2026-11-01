// The chosen game mode. Chosen on the main menu; the same save format works in every mode.
import { create } from "zustand";
import { DEFAULT_MODE, MODES, type ModeId } from "../config/modes";

export interface ModeStore {
  mode: ModeId;
  setMode: (id: ModeId) => void;
}

export const useMode = create<ModeStore>((set) => ({
  mode: DEFAULT_MODE,
  setMode: (mode) => set({ mode }),
}));

export const currentMode = () => MODES[useMode.getState().mode];
