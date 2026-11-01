// Life screen: needs, the day's four blocks, and sleep. Every change goes through the sim.
import { BLOCKS, type Block } from "../sim/life";
import { useGame } from "./gameStore";
import { winChance } from "../sim/election";
import { MODES } from "../config/modes";
import { useMode } from "./modeStore";
import { Screen } from "./Screen";

const LABEL: Record<Block, string> = {
  work: "Work",
  family: "Family",
  meeting: "Council meeting",
  event: "Community event",
  campaign: "Campaign",
  social_media: "Social media",
  rest: "Rest",
};

export function LifeScreen() {
  const life = useGame((s) => s.life);
  const mode = useMode((s) => s.mode);
  const doBlock = useGame((s) => s.doBlock);
  const sleep = useGame((s) => s.sleep);
  const full = life.blocksToday.length >= 4;
  const campaign = useGame((s) => s.campaign);
  const sentiment = useGame((s) => s.social.sentiment);
  const lastElection = useGame((s) => s.lastElection);
  const odds = Math.round(winChance(sentiment, campaign.strength) * 100);

  return (
    <Screen title="Your life" subtitle={`${MODES[mode].label} mode · day ${life.day + 1} · blocks left ${4 - life.blocksToday.length}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Meter label="Energy" value={life.needs.energy} />
        <Meter label="Social" value={life.needs.social} />
        <Meter label="Stress" value={life.needs.stress} invert />
        <Stat label="Reputation" value={`${life.reputation}`} />
      </div>
      <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4" aria-label="Election">
        <h2 className="font-display text-sm uppercase tracking-wider text-[#F4C430]">Council election</h2>
        <p className="mt-2 text-sm">Election in {campaign.daysToElection} days · campaign strength {campaign.strength} · estimated chance to win <strong className="tabular-nums">{odds}%</strong></p>
        {lastElection && (
          <p className="mt-2 text-sm">Last election (day {lastElection.day + 1}): <strong className={lastElection.won ? "text-emerald-300" : "text-red-300"}>{lastElection.won ? "won" : "lost"}</strong> with {Math.round(lastElection.share * 100)}%</p>
        )}
      </section>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wider text-[#F4C430]">Today's blocks</h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {BLOCKS.map((b) => (
          <button key={b} type="button" disabled={full} onClick={() => doBlock(b)} className="rounded-md border border-white/10 bg-white/5 px-3 py-3 text-left font-display uppercase tracking-wider text-[#E8E6E1] hover:bg-white/10 disabled:opacity-40">
            {LABEL[b]}
          </button>
        ))}
      </div>
      <button type="button" onClick={sleep} className="mt-4 w-full rounded-md bg-[#F4C430] px-4 py-3 font-display text-lg uppercase tracking-wider text-[#14161A] hover:bg-[#e0b020]">
        Sleep · end the day
      </button>
      <p className="mt-3 text-xs text-stone-400">Needs change only when you spend a block or sleep. Numbers are TUNABLE placeholders.</p>
    </Screen>
  );
}

function Meter({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? 100 - value : value;
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="flex justify-between font-display text-sm uppercase tracking-wider text-stone-300">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(value)}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-[#F4C430]" style={{ width: `${Math.max(0, Math.min(100, good))}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 p-3">
      <div className="font-display text-sm uppercase tracking-wider text-stone-300">{label}</div>
      <div className="font-display text-2xl tabular-nums text-[#F4C430]">{value}</div>
    </div>
  );
}
