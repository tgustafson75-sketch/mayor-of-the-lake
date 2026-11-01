import { describe, expect, it } from "vitest";
import { COUNCIL_ELECTED_SEATS, COUNCIL_TERM_YEARS, MAYOR_DIRECT_ELECTION_IS_REAL, MAYOR_SELECTION } from "./governance";
import { POLITICS_SCENARIO } from "../scenarios/politics";

describe("governance config matches the scenario", () => {
  it("the scenario council has the sourced size (five members, the mayor among them)", () => {
    expect(POLITICS_SCENARIO.councilSeats + 1).toBe(COUNCIL_ELECTED_SEATS);
  });

  it("the scenario term matches the sourced council term", () => {
    expect(POLITICS_SCENARIO.termYears).toBe(COUNCIL_TERM_YEARS);
  });

  it("the real process is a council vote for mayor; direct election is only an alternate mode", () => {
    expect(MAYOR_SELECTION).toBe("council-vote-annual");
    expect(MAYOR_DIRECT_ELECTION_IS_REAL).toBe(false);
  });
});
