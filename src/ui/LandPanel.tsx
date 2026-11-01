// The selected parcel: whether it is the city's, for sale, or yours, and what you can do with it.
import { DESIGNATIONS, type Designation } from "../sim/land";
import { Button, Panel, SectionTitle } from "./primitives";
import { useLand } from "./landStore";
import { useGame } from "./gameStore";

const LABEL: Record<Designation, string> = {
  unset: "Not designated",
  open_space: "Open space",
  future_town: "Future town site",
  commercial: "Commercial",
  industrial: "Industrial",
  residential: "Residential",
};

export function LandPanel() {
  const land = useLand((s) => s.land);
  const selected = useLand((s) => s.selected);
  const select = useLand((s) => s.select);
  const buy = useLand((s) => s.buy);
  const designate = useLand((s) => s.designate);
  const day = useGame((s) => s.life.day);
  if (!land || selected === null) return null;
  const p = land.parcels[selected];
  if (!p) return null;

  const ownerText = p.owner === "city" ? "Inside the city" : p.owner === "player" ? "Yours" : "For sale";
  return (
    <Panel className="pointer-events-auto w-72 shadow-2xl" label="Selected parcel">
      <div className="flex items-start justify-between gap-3">
        <SectionTitle>Parcel {p.col + 1}-{p.row + 1}</SectionTitle>
        <button type="button" aria-label="Close parcel" onClick={() => select(null)} className="text-stone-400 hover:text-white">✕</button>
      </div>
      <p className="mt-2 text-sm">{ownerText} · {LABEL[p.designation]}</p>
      {p.owner === "none" && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-stone-300">Price ${p.price}k · funds ${Math.round(land.funds)}k <span className="text-xs text-stone-500">(scenario)</span></span>
          <Button variant="primary" onClick={() => buy(selected, day)}>Buy</Button>
        </div>
      )}
      {p.owner === "player" && (
        <label className="mt-3 block text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-stone-300">Designation</span>
          <select aria-label="Designation" value={p.designation} onChange={(e) => designate(selected, e.target.value as Designation, day)} className="mt-1 w-full rounded-md bg-[#14161A] px-3 py-2 text-[#E8E6E1]">
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>{LABEL[d]}</option>
            ))}
          </select>
        </label>
      )}
      {p.owner === "city" && <p className="mt-3 text-xs text-stone-500">City land is managed through the city's own planning.</p>}
    </Panel>
  );
}
