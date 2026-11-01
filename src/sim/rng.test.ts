import { describe, expect, it } from "vitest";
import { Rng } from "./rng";

function draw(rng: Rng, n: number): number[] {
  return Array.from({ length: n }, () => rng.next());
}

describe("Rng determinism", () => {
  it("same string seed produces the same sequence", () => {
    expect(draw(new Rng("lake-elsinore"), 50)).toEqual(draw(new Rng("lake-elsinore"), 50));
  });

  it("same numeric seed produces the same sequence", () => {
    expect(draw(new Rng(42), 50)).toEqual(draw(new Rng(42), 50));
  });

  it("different seeds produce different sequences", () => {
    expect(draw(new Rng("seed-a"), 20)).not.toEqual(draw(new Rng("seed-b"), 20));
  });

  it("restoring a snapshot resumes the exact sequence", () => {
    const rng = new Rng("save-game");
    draw(rng, 17);
    const snap = rng.snapshot();
    const expected = draw(rng, 30);

    const resumed = new Rng("unrelated");
    resumed.restore(snap);
    expect(draw(resumed, 30)).toEqual(expected);
  });

  it("snapshot survives a JSON round trip (saves are plain data)", () => {
    const rng = new Rng(7);
    draw(rng, 5);
    const snap = JSON.parse(JSON.stringify(rng.snapshot()));
    const expected = draw(rng, 10);

    const resumed = new Rng(0);
    resumed.restore(snap);
    expect(draw(resumed, 10)).toEqual(expected);
  });
});

describe("Rng helpers", () => {
  it("next() stays in [0, 1)", () => {
    const rng = new Rng("range");
    for (const v of draw(rng, 5000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("int() is inclusive on both ends and covers the range", () => {
    const rng = new Rng("int");
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(rng.int(1, 6));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("int() rejects bad bounds instead of guessing", () => {
    expect(() => new Rng(1).int(5, 1)).toThrow(RangeError);
    expect(() => new Rng(1).int(1.5, 3)).toThrow(RangeError);
  });

  it("pick() refuses an empty list", () => {
    expect(() => new Rng(1).pick([])).toThrow(RangeError);
  });

  it("chance(0) never fires and chance(1) always fires", () => {
    const rng = new Rng("chance");
    for (let i = 0; i < 500; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });
});
