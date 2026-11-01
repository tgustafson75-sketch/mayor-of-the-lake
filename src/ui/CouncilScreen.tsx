// Council chamber: the agenda, the vote, each member's trust, and the Promises ledger.
// Outcomes come from the sim. Scenario roster and fit are placeholders (D-019).
import { COUNCIL_IDS, PROPOSAL, useGame } from "./gameStore";
import { ADVISOR_NAME, briefAll, type Briefing } from "../sim/advisors";
import { publicComment } from "../sim/public-comment";
import { Rng } from "../sim/rng";
import { useMemo } from "react";
import { Screen } from "./Screen";

export function CouncilScreen() {
  const trust = useGame((s) => s.trust);
  const votes = useGame((s) => s.votes);
  const callVote = useGame((s) => s.callVote);
  const whipMember = useGame((s) => s.whipMember);
  const ledger = useGame((s) => s.ledger);
  const promise = useGame((s) => s.promise);
  const day = useGame((s) => s.life.day);
  const last = votes.at(-1);
  const sentiment = useGame((s) => s.social.sentiment);
  const campaign = useGame((s) => s.campaign);
  const briefings: Briefing[] = useMemo(() => briefAll({ sentiment, campaignStrength: campaign.strength, trust: Object.values(trust).reduce((a, b) => a + b, 0) / COUNCIL_IDS.length }, new Rng(`brief:${day}`)), [sentiment, campaign.strength, trust, day]);
  const comment = useMemo(() => publicComment(sentiment, new Rng(`comment:${day}`)), [sentiment, day]);

  return (
    <Screen title="Council chamber" subtitle={`Agenda · ${PROPOSAL.title}`}>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="font-display text-lg uppercase tracking-wider">{PROPOSAL.title}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={callVote} className="rounded-md bg-[#F4C430] px-4 py-2 font-display uppercase tracking-wider text-[#14161A] hover:bg-[#e0b020]">Call the vote</button>
          {last && (
            <span className="self-center text-sm">
              Vote {last.vote}: <strong className={last.passed ? "text-emerald-300" : "text-red-300"}>{last.passed ? "passed" : "failed"}</strong> · {last.yes} yes, {last.no} no
            </span>
          )}
        </div>
      </div>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wider text-[#F4C430]">Public comment</h2>
      <p className="mt-2 text-sm" aria-label="Public comment">{comment.supporters} speakers for, {comment.opponents} against, from the interest groups.</p>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wider text-[#F4C430]">Advisors</h2>
      <ul className="mt-2 space-y-2">
        {briefings.map((b) => (
          <li key={b.advisor} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm">
            <div className="flex justify-between"><span className="font-semibold">{ADVISOR_NAME[b.advisor]}</span><span className={b.recommendation === "push" ? "text-emerald-300" : "text-stone-300"}>{b.recommendation}</span></div>
            <p className="mt-1 text-stone-300">{b.numbers}</p>
            <p className="mt-1 text-stone-400">{b.tradeoff}{!b.reliable && <span className="text-red-300"> · this read was off</span>}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wider text-[#F4C430]">Members</h2>
      <ul className="mt-2 divide-y divide-white/10 rounded-xl border border-white/10">
        {COUNCIL_IDS.map((id, i) => (
          <li key={id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex-1">Council Member {i + 1} <span className="text-stone-400">(fictional)</span></span>
            <span className="w-20 text-right tabular-nums text-sm">trust {(trust[id] ?? 0).toFixed(2)}</span>
            <button type="button" onClick={() => whipMember(id)} className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">Whip</button>
          </li>
        ))}
      </ul>

      <h2 className="mt-6 font-display text-lg uppercase tracking-wider text-[#F4C430]">Promises</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => promise(COUNCIL_IDS[0], "Bring the marina plan to the council by spring", 90)} className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">Promise a marina plan (90 days)</button>
      </div>
      {ledger.items.length === 0 ? (
        <p className="mt-3 text-sm text-stone-400">No promises yet. Promises you make are tracked here and settled by the sim.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {ledger.items.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2 text-sm">
              <span>{c.text}</span>
              <span className={`font-display uppercase tracking-wider ${c.status === "kept" ? "text-emerald-300" : c.status === "broken" ? "text-red-300" : "text-stone-300"}`}>
                {c.status} · due day {c.dueDay + 1}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-stone-400">Day {day + 1}. Scenario values are placeholders until the research step.</p>
    </Screen>
  );
}
