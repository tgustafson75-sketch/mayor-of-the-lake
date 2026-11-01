// Life screen: needs, the day's four blocks, the election, and sleep. Every change goes through the sim.
import { BLOCKS, type Block } from "../sim/life";
import { winChance } from "../sim/election";
import { MODES } from "../config/modes";
import { useGame } from "./gameStore";
import { useMode } from "./modeStore";
import { Button, Meter, Panel, SectionTitle } from "./primitives";
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
  const doBlock = useGame((s) => s.doBlock);
  const sleep = useGame((s) => s.sleep);
  const campaign = useGame((s) => s.campaign);
  const sentiment = useGame((s) => s.social.sentiment);
  const lastElection = useGame((s) => s.lastElection);
  const mode = useMode((s) => s.mode);

  const blocksLeft = 4 - life.blocksToday.length;
  const politics = MODES[mode].playerPolitics;
  const odds = Math.round(winChance(sentiment, campaign.strength) * 100);
  const blocks = BLOCKS.filter((b) => politics || b !== "campaign");

  return (
    <Screen title="Your life" subtitle={`${MODES[mode].label} · day ${life.day + 1} · ${blocksLeft} ${blocksLeft === 1 ? "block" : "blocks"} left`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <div className="grid gap-5">
            <Meter label="Energy" value={life.needs.energy} />
            <Meter label="Social" value={life.needs.social} />
            <Meter label="Stress" value={life.needs.stress} tone={life.needs.stress > 60 ? "bad" : "good"} />
          </div>
        </Panel>
        <Panel className="flex flex-col justify-between">
          <SectionTitle>Reputation</SectionTitle>
          <p className="mt-3 font-display text-6xl text-[#F4C430] tabular-nums">{life.reputation}</p>
          <p className="text-sm text-stone-400">Earned through meetings, events and campaigning.</p>
        </Panel>
      </div>

      {politics && (
        <Panel className="mt-4" label="Election">
          <SectionTitle>Council election</SectionTitle>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p>Election in <strong className="tabular-nums">{campaign.daysToElection}</strong> days</p>
            <p>Campaign strength <strong className="tabular-nums">{campaign.strength}</strong></p>
            <p>Estimated chance to win <strong className="tabular-nums">{odds}%</strong></p>
          </div>
          {lastElection && (
            <p className="mt-3 text-sm text-stone-300">
              Last election, day {lastElection.day + 1}:{" "}
              <strong className={lastElection.won ? "text-emerald-300" : "text-red-300"}>{lastElection.won ? "won" : "lost"}</strong> with {Math.round(lastElection.share * 100)}%.
            </p>
          )}
        </Panel>
      )}

      <Panel className="mt-4">
        <SectionTitle>Today</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {blocks.map((b) => (
            <Button key={b} onClick={() => doBlock(b)} disabled={blocksLeft === 0} className="py-3 text-left">
              {LABEL[b]}
            </Button>
          ))}
        </div>
        <Button variant="primary" onClick={sleep} className="mt-4 w-full py-3 text-base">
          Sleep and end the day
        </Button>
      </Panel>

      <p className="mt-4 text-xs text-stone-500">Figures are scenario estimates until the research is complete.</p>
    </Screen>
  );
}
