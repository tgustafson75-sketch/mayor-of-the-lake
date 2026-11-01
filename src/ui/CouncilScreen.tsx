// Council chamber: the agenda, public comment, advisors, the vote, members, and the Promises ledger.
// Outcomes come from the sim. Scenario roster and fit are placeholders until the research is complete.
import { useMemo } from "react";
import { ADVISOR_NAME, briefAll, type Briefing } from "../sim/advisors";
import { publicComment } from "../sim/public-comment";
import { Rng } from "../sim/rng";
import { COUNCIL_IDS, PROPOSAL, useGame } from "./gameStore";
import { Button, Panel, SectionTitle } from "./primitives";
import { Screen } from "./Screen";

export function CouncilScreen() {
  const trust = useGame((s) => s.trust);
  const votes = useGame((s) => s.votes);
  const callVote = useGame((s) => s.callVote);
  const whipMember = useGame((s) => s.whipMember);
  const ledger = useGame((s) => s.ledger);
  const promise = useGame((s) => s.promise);
  const day = useGame((s) => s.life.day);
  const sentiment = useGame((s) => s.social.sentiment);
  const campaign = useGame((s) => s.campaign);
  const last = votes.at(-1);

  const meanTrust = Object.values(trust).reduce((a, b) => a + b, 0) / COUNCIL_IDS.length;
  const briefings: Briefing[] = useMemo(
    () => briefAll({ sentiment, campaignStrength: campaign.strength, trust: meanTrust }, new Rng(`brief:${day}`)),
    [sentiment, campaign.strength, meanTrust, day],
  );
  const comment = useMemo(() => publicComment(sentiment, new Rng(`comment:${day}`)), [sentiment, day]);

  return (
    <Screen title="Council chamber" subtitle={`Agenda · ${PROPOSAL.title}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Panel label="Agenda">
          <SectionTitle>Agenda</SectionTitle>
          <p className="mt-3 text-lg">{PROPOSAL.title}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" onClick={callVote}>Call the vote</Button>
            {last && (
              <span className="text-sm">
                Vote {last.vote}:{" "}
                <strong className={last.passed ? "text-emerald-300" : "text-red-300"}>{last.passed ? "passed" : "failed"}</strong>{" "}
                · {last.yes} yes, {last.no} no
              </span>
            )}
          </div>
        </Panel>

        <Panel label="Public comment">
          <SectionTitle>Public comment</SectionTitle>
          <p className="mt-3 text-sm">
            {comment.supporters} speakers for, {comment.opponents} against.
          </p>
          <p className="mt-2 text-xs text-stone-500">Comments reflect the interest groups. They do not change the vote.</p>
        </Panel>
      </div>

      <div className="mt-6">
        <SectionTitle>Advisors</SectionTitle>
        <ul className="mt-3 grid gap-3 md:grid-cols-2">
          {briefings.map((b) => (
            <li key={b.advisor} className="rounded-xl border border-white/10 bg-[#1b1e24] p-4 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{ADVISOR_NAME[b.advisor]}</span>
                <span className={`font-display text-xs uppercase tracking-wider ${b.recommendation === "push" ? "text-emerald-300" : "text-stone-300"}`}>
                  {b.recommendation === "push" ? "Push" : "Hold"}
                </span>
              </div>
              <p className="mt-2 text-stone-300">{b.tradeoff}</p>
              <p className="mt-2 text-xs text-stone-500">
                {b.numbers}
                {!b.reliable && <span className="text-red-300"> · this read was off</span>}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <SectionTitle>Members</SectionTitle>
        <ul className="mt-3 divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-[#1b1e24]">
          {COUNCIL_IDS.map((id, i) => (
            <li key={id} className="flex items-center gap-4 px-4 py-3">
              <span className="flex-1">
                Council Member {i + 1} <span className="text-stone-500">(fictional)</span>
              </span>
              <span className="w-24 text-right text-sm tabular-nums text-stone-300">Trust {(trust[id] ?? 0).toFixed(2)}</span>
              <Button onClick={() => whipMember(id)}>Whip</Button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <SectionTitle>Promises</SectionTitle>
        <div className="mt-3">
          <Button onClick={() => promise(COUNCIL_IDS[0], "Bring the marina plan to the council by spring", 90)}>
            Promise a marina plan (90 days)
          </Button>
        </div>
        {ledger.items.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No promises yet. Promises you make are tracked here and settled by the sim.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {ledger.items.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#1b1e24] px-4 py-3 text-sm">
                <span>{c.text}</span>
                <span
                  className={`shrink-0 font-display text-xs uppercase tracking-wider ${
                    c.status === "kept" ? "text-emerald-300" : c.status === "broken" ? "text-red-300" : "text-stone-300"
                  }`}
                >
                  {c.status} · due day {c.dueDay + 1}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 text-xs text-stone-500">Day {day + 1}. Figures are scenario estimates until the research is complete.</p>
    </Screen>
  );
}
