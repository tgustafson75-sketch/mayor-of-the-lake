// Front page: the photoreal hero image of the lake, with the menu over it. #map
// opens the 3D city with the HUD. Menu buttons are placeholders until their phases.
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
      <img
        src="/assets/photoreal/hero-lake.png"
        alt="Aerial view of Lake Elsinore at golden hour"
        className="fixed inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/50 to-transparent" />

      <div className="relative flex min-h-screen flex-col justify-center gap-10 p-6 sm:p-16">
        <header className="pointer-events-none">
          <img src="/assets/brand/logo.png" alt="Mayor of the Lake" className="w-72 drop-shadow-xl sm:w-96" />
          <p className="mt-3 font-display text-sm uppercase tracking-[0.3em] text-stone-200">Lake Elsinore, California</p>
        </header>

        <nav aria-label="Main menu" className="flex w-64 flex-col gap-3">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled
              title={`Arrives in Phase ${item.phase}`}
              className="rounded-md border border-white/10 bg-stone-950/80 px-4 py-3 text-left font-display text-lg uppercase tracking-wider text-stone-500 backdrop-blur disabled:cursor-not-allowed"
            >
              {item.label}
            </button>
          ))}
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
