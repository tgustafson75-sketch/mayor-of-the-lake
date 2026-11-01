import { describe, expect, it } from "vitest";
import { createLimiter } from "./rate-limit";

const small = { perIpPerMinute: 2, perIpPerDay: 3, globalPerDay: 4 };

describe("rate limiter", () => {
  it("allows a burst up to the per-minute limit, then refuses", () => {
    const l = createLimiter(small);
    expect(l.check("a", 0)).toBeNull();
    expect(l.check("a", 1)).toBeNull();
    expect(l.check("a", 2)).toMatch(/minute/);
  });

  it("frees the minute window after a minute", () => {
    const l = createLimiter(small);
    l.check("a", 0);
    l.check("a", 1);
    expect(l.check("a", 61_000)).toBeNull();
  });

  it("caps one visitor per day", () => {
    const l = createLimiter({ ...small, perIpPerMinute: 99 });
    l.check("a", 0);
    l.check("a", 1);
    l.check("a", 2);
    expect(l.check("a", 3)).toMatch(/today/);
  });

  it("caps the whole demo per day, whoever is asking", () => {
    const l = createLimiter({ ...small, perIpPerMinute: 99, perIpPerDay: 99 });
    for (let i = 0; i < 4; i++) expect(l.check(`ip-${i}`, i)).toBeNull();
    expect(l.check("ip-new", 5)).toMatch(/demo/);
  });
});
