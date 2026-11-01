import { lazy, Suspense } from "react";
import type { MapMode } from "../render/MapScene";
import { MapHud } from "./MapHud";

// The 3D map is heavy, so it loads only when it is shown.
const MapScene = lazy(() => import("../render/MapScene"));

export default function MapView({ mode }: { mode: MapMode }) {
  return (
    <div className="relative h-full w-full bg-stone-300">
      <Suspense fallback={<p className="p-6 text-stone-700">Loading the map…</p>}>
        <MapScene mode={mode} />
      </Suspense>
      {mode === "full" && <MapHud />}
    </div>
  );
}
