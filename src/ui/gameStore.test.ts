import { describe, expect, it } from "vitest";
import { useGame, COUNCIL_IDS } from "./gameStore";


describe("game store (actions go through the sim)", () => {
  it("spending a block changes needs; the fifth block in a day is refused quietly", () => {
    const before = useGame.getState().life.needs.energy;
    useGame.getState().doBlock("work");
    expect(useGame.getState().life.needs.energy).toBeLessThan(before);
    for (let i = 0; i < 10; i++) useGame.getState().doBlock("rest");
    expect(useGame.getState().life.blocksToday.length).toBeLessThanOrEqual(4);
  });

  it("sleeping ends the day and settles promises by day", () => {

    useGame.getState().promise(COUNCIL_IDS[0], "test promise", 0);
    const day = useGame.getState().life.day;
    useGame.getState().sleep();
    useGame.getState().sleep();
    expect(useGame.getState().life.day).toBe(day + 2);
    expect(useGame.getState().ledger.items.at(-1)!.status).toBe("broken");
  });

  it("calling the vote records a result, and the record is deterministic for the same state", () => {
    const start = useGame.getState().votes.length;
    useGame.getState().callVote();
    const v = useGame.getState().votes.at(-1)!;
    expect(useGame.getState().votes.length).toBe(start + 1);
    expect(v.yes + v.no).toBe(COUNCIL_IDS.length);
    expect(typeof v.passed).toBe("boolean");
  });

  it("whipping a member changes that member's trust, and no one else's", () => {
    const before = { ...useGame.getState().trust };
    useGame.getState().whipMember(COUNCIL_IDS[1]);
    const after = useGame.getState().trust;
    expect(after[COUNCIL_IDS[1]]).not.toBe(before[COUNCIL_IDS[1]]);
    expect(after[COUNCIL_IDS[0]]).toBe(before[COUNCIL_IDS[0]]);
  });
});
