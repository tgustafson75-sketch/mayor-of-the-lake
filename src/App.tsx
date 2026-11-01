// Front page: the main menu over a slowly orbiting 3D city. #map opens the full
// Phase 1 view with the HUD. The menu buttons are placeholders until their phases.
import MapView from "./ui/MapView";

const MENU_ITEMS = [
  { label: "New Life", phase: 5 },
  { label: "Continue", phase: 5 },
  { label: "Settings", phase: 9 },
] as const;

export default function App() {
  if (window.location.hash === "#map") {
    return (
      <div className="fixed inset-0">
        <MapView mode="full" />
      </div>
    );
  }
  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-900 text-stone-100">
      <div className="fixed inset-0">
        <MapView mode="backdrop" />
      </div>
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/50 to-transparent" />

      <div className="relative flex min-h-screen flex-col justify-center gap-10 p-6 sm:p-16">
        <header className="pointer-events-none">
          <h1 className="text-4xl font-black tracking-tight text-[#F4C430] sm:text-6xl">Mayor of the Lake</h1>
          <p className="mt-2 text-stone-300">Lake Elsinore, California · working title</p>
        </header>

        <nav aria-label="Main menu" className="flex w-64 flex-col gap-3">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled
              title={`Arrives in Phase ${item.phase}`}
              className="rounded-lg bg-stone-950/80 px-4 py-3 text-left font-semibold text-stone-500 backdrop-blur disabled:cursor-not-allowed"
            >
              {item.label}
            </button>
          ))}
          <a
            href="#map"
            className="rounded-lg border border-[#F4C430]/60 bg-stone-950/80 px-4 py-3 text-left font-semibold text-[#F4C430] backdrop-blur hover:bg-stone-900"
          >
            Open the city map
          </a>
        </nav>
      </div>
    </main>
  );
}
