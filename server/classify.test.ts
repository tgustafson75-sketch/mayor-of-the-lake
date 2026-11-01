import { describe, expect, it } from "vitest";
import { createApp, createSessionStore } from "./app";
import { createLimiter } from "./rate-limit";
import { createStubProvider } from "../packages/ai-conversations/src/stub-provider";

const post = (app: ReturnType<typeof createApp>, body: unknown) =>
  app.request("/api/classify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function appReplying(reply: string, limiter = undefined as ReturnType<typeof createLimiter> | undefined) {
  const tasks: string[] = [];
  const provider = createStubProvider((req) => {
    tasks.push(req.task);
    return reply;
  });
  return { app: createApp({ provider, store: createSessionStore("test"), limiter }), tasks };
}

describe("/api/classify", () => {
  it("returns the validated tone and topic", async () => {
    const { app, tasks } = appReplying('```json\n{"tone": "firm", "topic": "taxes"}\n```');
    const res = await post(app, { text: "No new taxes this year." });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tone: "firm", topic: "taxes" });
    expect(tasks).toEqual(["classify:post"]);
  });

  it("rejects a label outside the sim's tones and topics", async () => {
    const { app } = appReplying('{"tone": "sarcastic", "topic": "lake"}');
    expect((await post(app, { text: "Sure, great lake." })).status).toBe(502);
  });

  it("rejects non-JSON model output", async () => {
    const { app } = appReplying("This post sounds friendly.");
    expect((await post(app, { text: "Hi all" })).status).toBe(502);
  });

  it("requires text", async () => {
    const { app } = appReplying("{}");
    expect((await post(app, { text: "  " })).status).toBe(400);
  });

  it("shares the /api/talk limiter", async () => {
    const limiter = createLimiter({ perIpPerMinute: 1, perIpPerDay: 10, globalPerDay: 10 });
    const { app } = appReplying('{"tone": "neutral", "topic": "jobs"}', limiter);
    expect((await post(app, { text: "Jobs fair Friday" })).status).toBe(200);
    const second = await post(app, { text: "Jobs fair Friday" });
    expect(second.status).toBe(429);
    const talk = await app.request("/api/talk", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ npcId: "member-1", text: "vote yes" }) });
    expect(talk.status).toBe(429);
  });
});
