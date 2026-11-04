import { describe, expect, it } from "vitest";
import { callModel, type FetchLike } from "./index";

const base = { apiKey: "test-key", prompt: "hello", maxTokens: 64, timeoutMs: 1000, model: "m" } as const;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("callModel: request shape", () => {
  it("sends Anthropic's headers and body", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const f = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return json({ content: [{ type: "text", text: "hi" }], usage: { input_tokens: 7, output_tokens: 3 } });
    }) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "anthropic", system: "be brief", fetch: f });
    expect(r).toEqual({ ok: true, text: "hi", usage: { inputTokens: 7, outputTokens: 3 } });
    expect(seen!.url).toBe("https://api.anthropic.com/v1/messages");
    const h = seen!.init.headers as Record<string, string>;
    expect(h["x-api-key"]).toBe("test-key");
    expect(h["anthropic-version"]).toBe("2023-06-01");
    const body = JSON.parse(seen!.init.body as string);
    expect(body).toMatchObject({ model: "m", max_tokens: 64, system: "be brief", messages: [{ role: "user", content: "hello" }] });
  });

  it("sends Gemini's key in a header and reads the first candidate", async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const g = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return json({ candidates: [{ content: { parts: [{ text: "gem" }, { text: "ini" }] } }], usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2 } });
    }) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", model: "gemini-x", fetch: g });
    expect(r).toEqual({ ok: true, text: "gemini", usage: { inputTokens: 5, outputTokens: 2 } });
    expect(seen!.url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent");
    expect((seen!.init.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
  });
});

describe("callModel: retries", () => {
  it("retries a 503 once and then succeeds", async () => {
    let n = 0;
    const f = (async () => (++n === 1 ? new Response("busy", { status: 503 }) : json({ content: [{ type: "text", text: "ok" }] }))) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "anthropic", fetch: f });
    expect(r).toMatchObject({ ok: true, text: "ok" });
    expect(n).toBe(2);
  });

  it("passes temperature through when given", async () => {
    let body: Record<string, unknown> = {};
    const f = (async (_u: string, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return json({ candidates: [{ content: { parts: [{ text: "t" }] }, finishReason: "STOP" }] });
    }) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", temperature: 0.7, fetch: f });
    expect(JSON.stringify(body)).toContain('"temperature":0.7');
    expect(r).toMatchObject({ ok: true, finishReason: "STOP" });
  });

  it("does not retry a 400: it fails at once with the status", async () => {
    let n = 0;
    const f = (async () => (++n, new Response("bad request", { status: 400 }))) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "anthropic", fetch: f, retries: 3 });
    expect(r).toMatchObject({ ok: false, status: 400, attempts: 1 });
    expect(n).toBe(1);
  });

  it("gives up after the retry budget on repeated 500s", async () => {
    let n = 0;
    const f = (async () => (++n, new Response("down", { status: 500 }))) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", fetch: f, retries: 2 });
    expect(r).toMatchObject({ ok: false, status: 500, attempts: 3 });
    expect(n).toBe(3);
  });
});

describe("callModel: timeouts and network errors", () => {
  it("aborts a request that never answers and reports status 0", async () => {
    const f = ((_url: string, init: RequestInit) =>
      new Promise((_, reject) => {
        (init.signal as AbortSignal).addEventListener("abort", () => reject(new DOMException("aborted", "TimeoutError")));
      })) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "anthropic", fetch: f, timeoutMs: 20, retries: 1 });
    expect(r).toMatchObject({ ok: false, status: 0, attempts: 2 });
  });

  it("treats a network error as status 0 and never throws", async () => {
    const f = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", fetch: f, retries: 0 });
    expect(r).toMatchObject({ ok: false, status: 0, attempts: 1 });
  });
});

describe("callModel: Gemini extras", () => {
  it("sends images before the prompt text", async () => {
    let body: { contents: { parts: Record<string, unknown>[] }[] } | undefined;
    const f = (async (_u: string, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return json({ candidates: [{ content: { parts: [{ text: "seen" }] } }] });
    }) as unknown as FetchLike;
    await callModel({ ...base, provider: "gemini", images: [{ mimeType: "image/jpeg", data: "AAAA" }], fetch: f });
    expect(body!.contents[0]!.parts[0]).toEqual({ inlineData: { mimeType: "image/jpeg", data: "AAAA" } });
    expect(body!.contents[0]!.parts[1]).toEqual({ text: "hello" });
  });

  it("merges generationConfig (schema, thinking) into the request", async () => {
    let body: { generationConfig: Record<string, unknown> } | undefined;
    const f = (async (_u: string, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return json({ candidates: [{ content: { parts: [{ text: "{}" }] } }] });
    }) as unknown as FetchLike;
    await callModel({
      ...base,
      provider: "gemini",
      temperature: 0,
      generationConfig: { responseMimeType: "application/json", thinkingConfig: { thinkingLevel: "minimal" } },
      fetch: f,
    });
    expect(body!.generationConfig).toMatchObject({
      maxOutputTokens: 64,
      temperature: 0,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: "minimal" },
    });
  });

  it("drops thought parts from the text", async () => {
    const f = (async () =>
      json({ candidates: [{ content: { parts: [{ text: "thinking...", thought: true }, { text: "answer" }] } }] })) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", fetch: f });
    expect(r).toMatchObject({ ok: true, text: "answer" });
  });

  it("with retries 0, a 503 fails at once (the caller's model chain is the fallback)", async () => {
    let n = 0;
    const f = (async () => (++n, new Response("busy", { status: 503 }))) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", fetch: f, retries: 0 });
    expect(r).toMatchObject({ ok: false, status: 503, attempts: 1 });
    expect(n).toBe(1);
  });
});

describe("callModel: grounding", () => {
  it("passes tools through and returns the grounding metadata", async () => {
    let body: { tools?: unknown } = {};
    const f = (async (_u: string, init: RequestInit) => {
      body = JSON.parse(init.body as string);
      return json({
        candidates: [{ content: { parts: [{ text: "{}" }] }, groundingMetadata: { groundingChunks: [{ web: { uri: "https://x.test", title: "X" } }] } }],
      });
    }) as unknown as FetchLike;
    const r = await callModel({ ...base, provider: "gemini", tools: [{ google_search: {} }], fetch: f });
    expect(body.tools).toEqual([{ google_search: {} }]);
    expect(r).toMatchObject({ ok: true, groundingMetadata: { groundingChunks: [{ web: { uri: "https://x.test", title: "X" } }] } });
  });
});
