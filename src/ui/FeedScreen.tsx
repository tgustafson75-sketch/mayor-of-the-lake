// Social feed: write a post, see its reach, and watch each interest group's sentiment.
// The sim computes every number. The AI classifier labels tone and topic; when it is
// unavailable, the player's buttons are used, and each post says which one labelled it.
import { useState } from "react";
import { TONES, TOPICS, type Group, type LabelSource, type Tone, type Topic } from "../sim/social";
import { useGame } from "./gameStore";
import { Screen } from "./Screen";

const LABEL_SOURCE: Record<LabelSource, string> = { ai: "labelled by AI", player: "labelled by you" };

/** Asks the server to label the post. Null when the classifier is unavailable. */
async function classify(text: string): Promise<{ tone: Tone; topic: Topic } | null> {
  try {
    const base = import.meta.env.VITE_API_BASE ?? "";
    const res = await fetch(`${base}/api/classify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { tone?: string; topic?: string };
    const tone = TONES.find((t) => t === body.tone);
    const topic = TOPICS.find((t) => t === body.topic);
    return tone && topic ? { tone, topic } : null;
  } catch {
    return null;
  }
}
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
  const interview = useGame((s) => s.interview);
  const askReporter = useGame((s) => s.askReporter);
  const answerReporter = useGame((s) => s.answerReporter);
  const [text, setText] = useState("");
  const [tone, setTone] = useState<Tone>("friendly");
  const [topic, setTopic] = useState<Topic>("lake");
  const [busy, setBusy] = useState(false);
  const canPost = text.trim().length > 0 && !busy;

  return (
    <Screen title="Feed" subtitle="Posts reach the city; the sim sets reach and sentiment">
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canPost) return;
              setBusy(true);
              const label = await classify(text);
              if (label) post(text, label.tone, label.topic, "ai");
              else post(text, tone, topic, "player");
              setText("");
              setBusy(false);
            }}
            className="rounded-xl border border-white/10 bg-[#1b1e24] p-5 shadow-lg shadow-black/30"
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
            <p className="mt-2 text-xs text-stone-400">The AI labels tone and topic. Your picks are used if it is unavailable.</p>
            <button type="submit" disabled={!canPost} className="mt-4 rounded-md bg-[#F4C430] px-4 py-2 font-display uppercase tracking-wider text-[#14161A] disabled:opacity-40">{busy ? "Publishing…" : "Publish"}</button>
          </form>

          <section aria-label="Press" className="mt-6 rounded-xl border border-white/10 bg-[#1b1e24] p-5 shadow-lg shadow-black/30">
            <h2 className="font-display text-sm uppercase tracking-wider text-[#F4C430]">Press</h2>
            {interview ? (
              <div className="mt-2">
                <p className="text-sm">{interview.question}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => answerReporter("stand_by")} className="rounded-md bg-[#F4C430] px-3 py-1.5 text-sm font-semibold text-[#14161A]">I stand by it</button>
                  <button type="button" onClick={() => answerReporter("changed_mind")} className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">I've changed my mind</button>
                  <button type="button" onClick={() => answerReporter("deflect")} className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">No comment</button>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-3">
                <p className="text-sm text-stone-300">A reporter can ask about a topic you have posted on.</p>
                <button type="button" onClick={() => askReporter(topic)} className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">Take the reporter's question ({topic})</button>
              </div>
            )}
          </section>

          <ul className="mt-6 space-y-3">
            {[...social.posts].reverse().map((p) => (
              <li key={p.id} className="rounded-xl border border-white/10 bg-[#1b1e24] p-5 shadow-lg shadow-black/30">
                <p>{p.text}</p>
                <p className="mt-2 text-xs text-stone-400">Day {p.day + 1} · {p.topic} · {p.tone} · {LABEL_SOURCE[p.labelSource ?? "player"]} · reach {p.reach}</p>
              </li>
            ))}
          </ul>
          {social.posts.length === 0 && <p className="mt-6 text-sm text-stone-400">No posts yet.</p>}
        </div>

        <aside className="rounded-xl border border-white/10 bg-[#1b1e24] p-5 shadow-lg shadow-black/30">
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
