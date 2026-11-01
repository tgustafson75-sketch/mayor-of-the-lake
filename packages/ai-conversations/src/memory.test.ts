import { describe, expect, it } from "vitest";
import { MAX_RAW, recall, remember, type NpcMemory } from "./memory";

const empty = (): NpcMemory => ({ npcId: "council-a", entries: [] });

describe("NPC memory", () => {
  it("an NPC references a fact from three sessions earlier", () => {
    let mem = remember(empty(), { session: 1, day: 10, summary: "Tim promised a marina by spring", tags: ["promise", "marina"] });
    mem = remember(mem, { session: 2, day: 200, summary: "Tim asked about parking", tags: ["parking"] });
    mem = remember(mem, { session: 3, day: 300, summary: "Tim praised the library", tags: ["library"] });
    mem = remember(mem, { session: 4, day: 400, summary: "Tim asked for a vote", tags: ["vote"] });
    expect(recall(mem, ["promise"])).toEqual(["Tim promised a marina by spring"]);
  });

  it("ranks entries by tag overlap before recency", () => {
    let mem = remember(empty(), { session: 1, day: 1, summary: "old marina talk", tags: ["marina"] });
    mem = remember(mem, { session: 2, day: 2, summary: "recent parking talk", tags: ["parking"] });
    expect(recall(mem, ["marina"])[0]).toBe("old marina talk");
  });

  it("compacts old entries and keeps the newest raw", () => {
    let mem = empty();
    for (let i = 0; i < MAX_RAW + 10; i++) mem = remember(mem, { session: Math.floor(i / 5), day: i, summary: `s${i}`, tags: ["x"] });
    expect(mem.entries.length).toBeLessThanOrEqual(MAX_RAW);
    expect(mem.entries.at(-1)!.summary).toBe(`s${MAX_RAW + 9}`);
    expect(mem.entries.some((e) => e.summary.startsWith("Earlier in session"))).toBe(true);
  });

  it("survives a JSON save unchanged", () => {
    const mem = remember(empty(), { session: 1, day: 1, summary: "a", tags: ["t"] });
    expect(JSON.parse(JSON.stringify(mem))).toEqual(mem);
  });
});
