import { describe, expect, it } from "vitest";
import { DEFAULT_MODE, MODES, MODE_ORDER } from "./modes";

describe("game modes", () => {
  it("defines the four modes from the addendum, in order, with Life as default", () => {
    expect(MODE_ORDER).toEqual(["life", "builder", "politics", "spectator"]);
    expect(DEFAULT_MODE).toBe("life");
    for (const id of MODE_ORDER) expect(MODES[id].id).toBe(id);
  });

  it("Life is the full resident-to-mayor career", () => {
    expect(MODES.life.startsAsMayor).toBe(false);
    expect(MODES.life.playerPolitics).toBe(true);
    expect(MODES.life.playerBuilds).toBe(false);
  });

  it("Builder starts as mayor, with lower political pressure, and the player builds", () => {
    expect(MODES.builder.startsAsMayor).toBe(true);
    expect(MODES.builder.politicalPressure).toBeLessThan(MODES.life.politicalPressure);
    expect(MODES.builder.playerBuilds).toBe(true);
  });

  it("Politics has the city building itself while the player runs politics", () => {
    expect(MODES.politics.playerBuilds).toBe(false);
    expect(MODES.politics.playerPolitics).toBe(true);
  });

  it("Spectator hands the city to AI mayors and the player only watches", () => {
    expect(MODES.spectator.aiRuns).toBe(true);
    expect(MODES.spectator.playerBuilds).toBe(false);
    expect(MODES.spectator.playerPolitics).toBe(false);
  });

  it("no mode lets the player both build and run politics unless it is the full career", () => {
    for (const id of MODE_ORDER) {
      const m = MODES[id];
      if (m.playerBuilds && m.playerPolitics) expect(m.id).toBe("life");
    }
  });
});
