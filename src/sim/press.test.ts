import { describe, expect, it } from "vitest";
import { answerInterview, openInterview } from "./press";
import { createSocial, publish } from "./social";

const withPost = () => publish(createSocial(), { day: 2, text: "Lake clean-up starts Monday", tone: "friendly", topic: "lake", reputation: 30 });

describe("press interviews", () => {
  it("no interview opens without a post to quote", () => {
    expect(openInterview(createSocial(), "lake", 5)).toBeNull();
  });

  it("the reporter quotes the player's post word for word", () => {
    const iv = openInterview(withPost(), "lake", 5);
    expect(iv?.question).toContain('"Lake clean-up starts Monday"');
  });

  it("standing by a post reinforces the groups that agree with it", () => {
    const s = withPost();
    const iv = openInterview(s, "lake", 5)!;
    const res = answerInterview(s, iv, "stand_by");
    expect(res.sentiment.environmental).toBeGreaterThan(s.sentiment.environmental);
    expect(res.reputationDelta).toBeGreaterThan(0);
  });

  it("changing position costs the groups that were won over, and deflecting costs reputation", () => {
    const s = withPost();
    const iv = openInterview(s, "lake", 5)!;
    const changed = answerInterview(s, iv, "changed_mind");
    expect(changed.sentiment.environmental).toBeLessThan(s.sentiment.environmental);
    const deflect = answerInterview(s, iv, "deflect");
    expect(deflect.reputationDelta).toBeLessThan(0);
  });

  it("every interview answer is logged", () => {
    const s = withPost();
    const iv = openInterview(s, "lake", 5)!;
    expect(answerInterview(s, iv, "stand_by").log[0].kind).toBe("interview");
  });
});
