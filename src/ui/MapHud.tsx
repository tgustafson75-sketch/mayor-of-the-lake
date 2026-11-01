// HUD over the full map. Only sourced values are shown. Anything the sim will
// own (budget, year, jobs, ratings) is absent until its phase lands.
import { POPULATION_2025 } from "../config/realworld";

const NAV = [
  { label: "Build", phase: 2 },
  { label: "Zones", phase: 2 },
  { label: "Infrastructure", phase: 2 },
  { label: "Lake & Environment", phase: 3 },
  { label: "Projects", phase: 2 },
  { label: "Budget", phase: 2 },
  { label: "Council", phase: 6 },
] as const;

export function MapHud() {
  return (
    <div className="pointer-events-none absolute inset-0 font-sans text-stone-100">
      <header className="pointer-events-auto absolute left-4 right-4 top-4 flex items-center gap-6 rounded-xl border border-white/10 bg-stone-950/80 px-5 py-3 backdrop-blur">
        <div>
          <p className="text-lg font-black tracking-tight text-[#F4C430]">MAYOR OF THE LAKE</p>
          <p className="text-xs uppercase tracking-widest text-stone-400">Lake Elsinore, California</p>
        </div>
        <div className="ml-auto flex gap-8 text-right">
          <Stat label="Population (2025)" value={POPULATION_2025.toLocaleString("en-US")} />
          <Stat label="Year" value="—" hint="sim not built yet" />
          <Stat label="Phase" value="1 · real map" />
        </div>
      </header>

      <nav aria-label="Game menu" className="pointer-events-auto absolute left-4 top-28 flex w-56 flex-col gap-1 rounded-xl border border-white/10 bg-stone-950/80 p-2 backdrop-blur">
        {NAV.map((item) => (
          <button
            key={item.label}
            type="button"
            disabled
            title={`Arrives in Phase ${item.phase}`}
            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-stone-500 disabled:cursor-not-allowed"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <footer className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-stone-950/70 px-3 py-1 text-[11px] text-stone-300">
        Map data © OpenStreetMap contributors (ODbL) · Elevation USGS 3DEP · Population CA Dept. of Finance
      </footer>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div title={hint}>
      <p className="text-lg font-bold tabular-nums text-stone-100">{value}</p>
      <p className="text-[11px] uppercase tracking-wider text-stone-400">{label}</p>
    </div>
  );
}
