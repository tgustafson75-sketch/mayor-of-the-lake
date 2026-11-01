import { describe, expect, it } from "vitest";
import { addCommitment, brokenFor, createLedger, markKept, settleDay } from "./commitments";

describe("commitments ledger", () => {
  it("a promise stays open until the sim settles it", () => {
    let l = addCommitment(createLedger(), { npcId: "council-a", text: "I will bring the marina plan by spring", madeOnDay: 10, dueDay: 90 });
    expect(l.items[0].status).toBe("open");
    l = settleDay(l, 50);
    expect(l.items[0].status).toBe("open");
  });

  it("a kept promise stays kept after its due day", () => {
    let l = addCommitment(createLedger(), { npcId: "council-a", text: "x", madeOnDay: 0, dueDay: 10 });
    l = markKept(l, "c1");
    l = settleDay(l, 100);
    expect(l.items[0].status).toBe("kept");
  });

  it("an unkept promise is broken after its due day, and NPCs can recall it", () => {
    let l = addCommitment(createLedger(), { npcId: "council-a", text: "marina by spring", madeOnDay: 0, dueDay: 90 });
    l = settleDay(l, 91);
    expect(l.items[0].status).toBe("broken");
    expect(brokenFor(l, "council-a").map((c) => c.text)).toEqual(["marina by spring"]);
    expect(brokenFor(l, "someone-else")).toEqual([]);
  });

  it("marking an unknown commitment throws rather than guessing", () => {
    expect(() => markKept(createLedger(), "nope")).toThrow();
  });
});
