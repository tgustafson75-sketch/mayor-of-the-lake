// Per-NPC memory: structured summaries of past exchanges, stored in the save.
// Recall picks the most relevant lines (by tag overlap, then recency).
// Old entries are compacted so the prompt stays short.

export interface MemoryEntry {
  session: number;
  day: number;
  summary: string;
  tags: string[];
}

export interface NpcMemory {
  npcId: string;
  entries: MemoryEntry[];
}

export const MAX_RAW = 30;

export function remember(mem: NpcMemory, entry: MemoryEntry): NpcMemory {
  const entries = [...mem.entries, entry];
  return { ...mem, entries: entries.length > MAX_RAW ? compact(entries) : entries };
}

/** Keeps the newest MAX_RAW/2 entries and folds older ones into one summary line per session. */
function compact(entries: MemoryEntry[]): MemoryEntry[] {
  const keep = Math.floor(MAX_RAW / 2);
  const older = entries.slice(0, entries.length - keep);
  const recent = entries.slice(entries.length - keep);
  const bySession = new Map<number, string[]>();
  for (const e of older) bySession.set(e.session, [...(bySession.get(e.session) ?? []), e.summary]);
  const folded = [...bySession.entries()].map(([session, lines]) => ({
    session,
    day: older.find((e) => e.session === session)!.day,
    summary: `Earlier in session ${session}: ${lines.join("; ")}`,
    tags: [...new Set(older.filter((e) => e.session === session).flatMap((e) => e.tags))],
  }));
  return [...folded, ...recent];
}

export function recall(mem: NpcMemory, tags: string[], limit = 5): string[] {
  const want = new Set(tags);
  return mem.entries
    .map((e, i) => ({ e, i, score: e.tags.filter((t) => want.has(t)).length }))
    .filter((x) => x.score > 0 || tags.length === 0)
    .sort((a, b) => b.score - a.score || b.i - a.i)
    .slice(0, limit)
    .map((x) => x.e.summary);
}
