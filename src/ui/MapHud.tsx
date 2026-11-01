// HUD over the full map. One layout per screen size, so each control mounts once
// (the time controls run a clock, so a second copy would double-tick).
// Only sourced values are shown. Sim values (budget, year, jobs, ratings) appear in their phases.
import { useState } from "react";
import { POPULATION_2025 } from "../config/realworld";
import { CameraSwitcher } from "./CameraSwitcher";
import { CouncilTalk } from "./CouncilTalk";
import { TimeControls } from "./TimeControls";
import { useMediaQuery } from "./useMediaQuery";

const NAV = [
  { label: "Build", phase: 2 },
  { label: "Zones", phase: 2 },
  { label: "Infrastructure", phase: 2 },
  { label: "Lake & Environment", phase: 3 },
  { label: "Projects", phase: 2 },
  { label: "Budget", phase: 2 },
  { label: "Council", phase: 6 },
] as const;

const PANEL = "rounded-xl border border-white/10 bg-[#14161A]/90 backdrop-blur-md shadow-2xl";

export function MapHud() {
  const wide = useMediaQuery("(min-width: 640px)");
  return (
    <div className="pointer-events-none absolute inset-0 font-sans text-[#E8E6E1]">
      <TopBar compact={!wide} />
      {wide ? <DesktopLayout /> : <MobileLayout />}
      <Attribution />
    </div>
  );
}

function TopBar({ compact }: { compact: boolean }) {
  return (
    <header className={`pointer-events-auto absolute left-3 right-3 top-3 flex items-center gap-4 ${PANEL} px-4 py-2 sm:left-4 sm:right-4 sm:top-4 sm:px-5`}>
      <img src="/assets/brand/logo.png" alt="Mayor of the Lake" className={compact ? "h-11 w-auto" : "h-16 w-auto"} />
      {!compact && <p className="font-display text-xs uppercase tracking-[0.3em] text-stone-400">Lake Elsinore, California</p>}
      <div className="ml-auto text-right">
        <p className="font-display text-xl font-bold tabular-nums text-[#F4C430] sm:text-2xl">{POPULATION_2025.toLocaleString("en-US")}</p>
        <p className="font-display text-[10px] uppercase tracking-[0.25em] text-stone-400">Population · 2025 · CA DOF</p>
      </div>
    </header>
  );
}

function DesktopLayout() {
  return (
    <>
      <nav aria-label="Game menu" className={`pointer-events-auto absolute left-4 top-32 flex w-56 flex-col gap-1 p-2 ${PANEL}`}>
        {NAV.map((item) => (
          <NavButton key={item.label} label={item.label} phase={item.phase} />
        ))}
      </nav>
      <div className="pointer-events-auto absolute bottom-14 left-4 w-80 space-y-3">
        <CouncilTalk />
      </div>
      <div className={`pointer-events-auto absolute bottom-14 right-4 flex flex-col gap-3 ${PANEL} p-3`}>
        <CameraSwitcher />
        <TimeControls />
      </div>
    </>
  );
}

type Tab = "camera" | "time" | "council" | "menu";

function MobileLayout() {
  const [tab, setTab] = useState<Tab | null>(null);
  const toggle = (t: Tab) => setTab((cur) => (cur === t ? null : t));
  return (
    <>
      {tab && (
        <div className={`pointer-events-auto absolute inset-x-3 bottom-20 max-h-[55vh] overflow-y-auto p-4 ${PANEL}`} role="dialog" aria-label={tab}>
          {tab === "camera" && <CameraSwitcher />}
          {tab === "time" && <TimeControls />}
          {tab === "council" && <CouncilTalk />}
          {tab === "menu" && (
            <nav aria-label="Game menu" className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavButton key={item.label} label={item.label} phase={item.phase} />
              ))}
            </nav>
          )}
        </div>
      )}
      <div role="toolbar" aria-label="Map tools" className={`pointer-events-auto absolute inset-x-3 bottom-3 grid grid-cols-4 gap-1 p-1.5 ${PANEL}`}>
        <DockButton label="Camera" active={tab === "camera"} onClick={() => toggle("camera")} />
        <DockButton label="Time" active={tab === "time"} onClick={() => toggle("time")} />
        <DockButton label="Council" active={tab === "council"} onClick={() => toggle("council")} />
        <DockButton label="Menu" active={tab === "menu"} onClick={() => toggle("menu")} />
      </div>
    </>
  );
}

function DockButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-lg py-2.5 font-display text-sm uppercase tracking-wider ${active ? "bg-[#F4C430] text-[#14161A]" : "text-[#E8E6E1] hover:bg-white/5"}`}
    >
      {label}
    </button>
  );
}

function NavButton({ label, phase }: { label: string; phase: number }) {
  return (
    <button
      type="button"
      disabled
      title={`Arrives in Phase ${phase}`}
      className="rounded-md px-3 py-2 text-left font-display text-base uppercase tracking-wider text-stone-500 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
}

function Attribution() {
  return (
    <footer className="pointer-events-auto absolute left-1/2 top-20 max-w-[92vw] -translate-x-1/2 rounded-md bg-[#14161A]/80 px-2.5 py-1 text-center text-[10px] leading-tight text-stone-300 backdrop-blur sm:bottom-2 sm:top-auto sm:text-[11px]">
      Map © OpenStreetMap contributors (ODbL) · Elevation USGS 3DEP · Population CA Dept. of Finance
    </footer>
  );
}
