// Talk to a council member. The server parses the words, the sim decides the
// outcome, and the reply is written to match. The panel only shows what came back.
import { useState } from "react";

interface TalkResponse {
  intent?: { intent: string };
  outcome?: { kind: "agree" | "counter" | "refuse"; reason: string };
  reply?: string;
  consistent?: boolean;
  trust?: number;
  clarify?: string;
  error?: string;
}

const MEMBERS = ["member-1", "member-2", "member-3", "member-4", "member-5"];

export function CouncilTalk() {
  const [npcId, setNpcId] = useState(MEMBERS[0]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TalkResponse | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  async function send() {
    if (!text.trim()) return;
    setBusy(true);
    setFailure(null);
    try {
      const res = await fetch("/api/talk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ npcId, text }),
      });
      const body = (await res.json()) as TalkResponse;
      if (!res.ok) setFailure(body.error ?? `server returned ${res.status}`);
      setResult(body);
    } catch {
      setFailure("The game server is not running. Start it with npm run server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Talk to council" className="pointer-events-auto w-80 rounded-xl border border-white/10 bg-stone-950/85 p-3 text-sm text-stone-100 backdrop-blur">
      <h2 className="mb-2 font-bold uppercase tracking-wider text-[#F4C430]">Talk to council</h2>
      <select aria-label="Council member" className="mb-2 w-full rounded bg-stone-800 px-2 py-1" value={npcId} onChange={(e) => setNpcId(e.target.value)}>
        {MEMBERS.map((m, i) => (
          <option key={m} value={m}>Council Member {i + 1} (fictional)</option>
        ))}
      </select>
      <textarea
        aria-label="What you say"
        className="mb-2 w-full rounded bg-stone-800 px-2 py-1"
        rows={2}
        placeholder="Back the lakefront plan, I'll owe you a favour"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" disabled={busy || !text.trim()} onClick={send} className="w-full rounded bg-[#F4C430] px-3 py-1.5 font-bold text-stone-900 disabled:opacity-50">
        {busy ? "Talking…" : "Say it"}
      </button>

      {failure && <p role="alert" className="mt-2 text-red-300">{failure}</p>}
      {result?.clarify && <p className="mt-2 italic text-stone-300">{result.clarify}</p>}
      {result?.reply && (
        <div className="mt-2 space-y-1">
          <p className="italic">“{result.reply}”</p>
          <p className="text-xs text-stone-400">
            Outcome: <span className="font-semibold text-stone-200">{result.outcome?.kind}</span> ({result.outcome?.reason}) · trust {result.trust?.toFixed(2)}
            {result.consistent === false && <span className="text-red-300"> · reply flagged as inconsistent</span>}
          </p>
        </div>
      )}
    </section>
  );
}
