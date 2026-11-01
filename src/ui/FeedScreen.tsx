// Social feed: write a post, see its reach, and watch each interest group's sentiment.
// The sim computes every number. The tone is the player's choice until the AI classifier lands.
import { useState } from "react";
import { AFFINITY, type Group, type Tone, type Topic } from "../sim/social";
import { useGame } from "./gameStore";
import { Screen } from "./Screen";

const TONES: Tone[] = ["friendly", "neutral", "firm", "hostile"];
const TOPICS = Object.keys(AFFINITY) as Topic[];
const GROUP_LABEL: Record<Group, string> = {
  homeowners: "Homeowners",
  renters: "Renters",
  smallBusiness: "Small business",
  developers: "Developers",
  environmental: "Environmental",
  publicSafety: "Public safety",
};

export function FeedScreen() {
  const social = useGame((s) => s.social);
  const post = useGame((s) => s.post);
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [topic, setTopic] = useState<Topic>("lake");
  const canPost = text.trim().length > 0;

  return (
    <Screen title="Feed" subtitle="Posts reach the city; the sim sets reach and sentiment">
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!canPost) return;
              post(text, tone, topic);
              setText("");
            }}
            className="rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <label className="font-display text-sm uppercase tracking-wider text-stone-300" htmlFor="post-text">Your post</label>
            <textarea id="post-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-2 w-full rounded-md bg-[#14161A] px-3 py-2 text-[#E8E6E1]" placeholder="Say something to the city" />
            <div className="mt-3 flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <Chip key={t} active={topic === t} onClick={() => setTopic(t)}>{t}</Chip>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {TONES.map((t) => (
                <Chip key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Chip>
              ))}
            </div>
            <button type="submit" disabled={!canPost} className="mt-4 rounded-md bg-[#F4C430] px-4 py-2 font-display uppercase tracking-wider text-[#14161A] disabled:opacity-40">Publish</button>
          </form>

          <ul className="mt-6 space-y-3">
            {[...social.posts].reverse().map((p) => (
              <li key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p>{p.text}</p>
                <p className="mt-2 text-xs text-stone-400">Day {p.day + 1} · {p.topic} · {p.tone} · reach {p.reach}</p>
              </li>
            ))}
          </ul>
          {social.posts.length === 0 && <p className="mt-6 text-sm text-stone-400">No posts yet.</p>}
        </div>

        <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-display text-sm uppercase tracking-wider text-[#F4C430]">Sentiment by group</h2>
          <ul className="mt-3 space-y-3">
            {(Object.keys(social.sentiment) as Group[]).map((g) => (
              <li key={g}>
                <div className="flex justify-between text-sm"><span>{GROUP_LABEL[g]}</span><span className="tabular-nums">{Math.round(social.sentiment[g] * 100)}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-white/10"><div className="h-1.5 rounded-full bg-[#F4C430]" style={{ width: `${Math.round(social.sentiment[g] * 100)}%` }} /></div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </Screen>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`rounded-full px-3 py-1 text-sm capitalize ${active ? "bg-[#F4C430] text-[#14161A]" : "border border-white/15 text-[#E8E6E1] hover:bg-white/10"}`}>
      {children}
    </button>
  );
}
