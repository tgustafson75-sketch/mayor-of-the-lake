import { CAMERA_PRESETS } from "../config/cameras";
import { useCamera } from "./cameraStore";

/** Live switch between the five camera presets. */
export function CameraSwitcher() {
  const preset = useCamera((s) => s.preset);
  const setPreset = useCamera((s) => s.setPreset);
  return (
    <div role="group" aria-label="Camera" className="flex gap-1">
      {CAMERA_PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          aria-pressed={preset === p.id}
          onClick={() => setPreset(p.id)}
          className={`rounded-md px-2.5 py-1 text-sm font-semibold ${preset === p.id ? "bg-[#F4C430] text-stone-900" : "bg-stone-800 text-stone-200 hover:bg-stone-700"}`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
