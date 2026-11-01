import { lazy, Suspense } from "react";

// The 3D map is heavy, so it loads only when someone opens #map.
const MapScene = lazy(() => import("../render/MapScene"));

export default function MapView() {
  return (
    <Suspense fallback={<p className="p-6 text-stone-300">Loading the map…</p>}>
      <MapScene />
    </Suspense>
  );
}
