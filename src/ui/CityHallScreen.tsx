// City Hall: the 3D building, with ways into the council chamber and the home (Life).
import { lazy, Suspense } from "react";
import { hrefFor } from "./routes";

const CityHallScene = lazy(() => import("../render/CityHallScene"));

export function CityHallScreen() {
  return (
    <main className="fixed inset-0 bg-[#14161A] text-[#E8E6E1]">
      <Suspense fallback={<p className="p-6">Loading City Hall…</p>}>
        <CityHallScene />
      </Suspense>
      <header className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between gap-4 p-4">
        <a href={hrefFor("menu")} className="pointer-events-auto rounded-md border border-white/15 bg-[#14161A]/85 px-3 py-1.5 font-display text-xs uppercase tracking-wider backdrop-blur hover:bg-white/10">← Main menu</a>
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#14161A]/85 p-3 backdrop-blur">
          <p className="font-display text-lg uppercase tracking-wider text-[#F4C430]">City Hall</p>
          <nav aria-label="City Hall rooms" className="mt-2 flex gap-2">
            <a href={hrefFor("council")} className="rounded-md bg-[#F4C430] px-3 py-1.5 font-display text-sm uppercase tracking-wider text-[#14161A]">Council chamber</a>
            <a href="#life" className="rounded-md border border-white/15 px-3 py-1.5 font-display text-sm uppercase tracking-wider hover:bg-white/10">Home</a>
          </nav>
        </div>
      </header>
    </main>
  );
}
