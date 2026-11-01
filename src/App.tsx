// Front page: the photoreal hero image of the lake, with the menu over it. #map
// opens the 3D city with the HUD. Menu buttons are placeholders until their phases.
import { useEffect, useState } from "react";
import MapView from "./ui/MapView";
import { parseRoute } from "./ui/routes";
import { LifeScreen } from "./ui/LifeScreen";
import { CouncilScreen } from "./ui/CouncilScreen";

/** Tracks the URL hash, so the "Open the 3D city" link switches screens without a reload. */
function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

const MENU_ITEMS = [
  { label: "New Life", phase: 5, href: "#life" },
  { label: "Council", phase: 6, href: "#council" },
  { label: "Settings", phase: 9 },
] as const;

export default function App() {
  const route = parseRoute(useHash());
  if (route === "life") return <LifeScreen />;
  if (route === "council") return <CouncilScreen />;
  if (route === "map") {
    return (
      <div className="fixed inset-0">
        <MapView mode="full" />
      </div>
    );
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-900 text-stone-100">
      <img
        src="/assets/photoreal/hero-lake.png"
        alt="Aerial view of Lake Elsinore at golden hour"
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/50 to-transparent" />

      <div className="relative flex min-h-screen flex-col justify-center gap-10 p-6 sm:p-16">
        <header className="pointer-events-none">
          <div className="inline-block rounded-2xl border border-white/10 bg-[#14161A]/95 p-4 shadow-2xl backdrop-blur-md">
            <img src="/assets/brand/logo.png" alt="Mayor of the Lake" className="w-64 rounded-lg sm:w-80" />
          </div>
          <p className="mt-3 font-display text-sm uppercase tracking-[0.3em] text-stone-200">Lake Elsinore, California</p>
        </header>

        <nav aria-label="Main menu" className="flex w-64 flex-col gap-3">
          {MENU_ITEMS.map((item) =>
            "href" in item ? (
              <a
                key={item.label}
                href={item.href}
                className="rounded-md border border-white/15 bg-stone-950/80 px-4 py-3 text-left font-display text-lg uppercase tracking-wider text-[#E8E6E1] backdrop-blur hover:bg-stone-900"
              >
                {item.label}
              </a>
            ) : (
              <button
                key={item.label}
                type="button"
                disabled
                title={`Arrives in Phase ${item.phase}`}
                className="rounded-md border border-white/10 bg-stone-950/80 px-4 py-3 text-left font-display text-lg uppercase tracking-wider text-stone-500 backdrop-blur disabled:cursor-not-allowed"
              >
                {item.label}
              </button>
            ),
          )}
          <a
            href="#map"
            className="rounded-md border border-[#F4C430] bg-[#F4C430] px-4 py-3 text-left font-display text-lg uppercase tracking-wider text-stone-900 hover:bg-[#e0b020]"
          >
            Open the 3D city
          </a>
        </nav>
      </div>
    </main>
  );
}
