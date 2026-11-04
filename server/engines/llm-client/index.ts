/**
 * LLM client: one call to Anthropic or Gemini, with the same timeout and retry rules everywhere.
 *
 * - Every attempt has its own timeout (AbortSignal.timeout) and really aborts the request.
 * - Retries only network errors, timeouts, 429 and 5xx. Other 4xx fail at once (a bad key or bad request won't fix itself).
 * - Backoff: 500 ms times the attempt number.
 * - Never throws. Callers get { ok, text, usage } or { ok: false, status, detail, attempts }; status 0 means no HTTP answer.
 * - Gemini only: `images` (inline, base64) and `generationConfig` (JSON schema, thinking level, ...) are passed through.
 *   Gemini thought parts are dropped from the text.
 *
 * Source of truth: ~/SmartPlay-Engines/llm-client. Vendored copies live in each project (see each project's
 * docs/ENGINE-TESTS.md); copy this file over them when it changes, then rerun each project's tests.
 */

export type Provider = "anthropic" | "gemini";

export interface Image {
  mimeType: string;
  /** Base64 without the data: prefix. */
  data: string;
}

/** The parts of the runtime this engine uses, typed here so the package needs no DOM or Node types. */
export interface FetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}
export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: unknown }) => Promise<FetchResponse>;
interface Runtime {
  fetch: FetchLike;
  AbortSignal: { timeout(ms: number): unknown };
  setTimeout(fn: () => void, ms: number): unknown;
}
const runtime = globalThis as unknown as Runtime;

export interface CallOptions {
  provider: Provider;
  model: string;
  apiKey: string;
  prompt: string;
  system?: string;
  /** Gemini only: images sent before the prompt text. */
  images?: Image[];
  maxTokens: number;
  temperature?: number;
  /** Gemini only: extra generationConfig fields (responseMimeType, responseSchema, thinkingConfig, ...). */
  generationConfig?: Record<string, unknown>;
  /** Gemini only: tools, e.g. [{ google_search: {} }]. */
  tools?: unknown[];
  timeoutMs: number;
  /** Extra attempts after the first (default 1). Use 0 when the caller has a latency budget and its own fallback chain. */
  retries?: number;
  /** Injected for tests. */
  fetch?: FetchLike;
}

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export type CallResult =
  | { ok: true; text: string; usage: Usage; finishReason?: string | undefined; groundingMetadata?: unknown }
  | { ok: false; status: number; detail: string; attempts: number };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface RequestParts {
  url: string;
  init: { method: string; headers: Record<string, string>; body: string };
}

function request(o: CallOptions): RequestParts {
  if (o.provider === "anthropic") {
    return {
      url: ANTHROPIC_URL,
      init: {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": o.apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: o.model,
          max_tokens: o.maxTokens,
          ...(o.temperature !== undefined ? { temperature: o.temperature } : {}),
          ...(o.system ? { system: o.system } : {}),
          messages: [{ role: "user", content: o.prompt }],
        }),
      },
    };
  }
  const parts = [
    ...(o.images ?? []).map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
    { text: o.prompt },
  ];
  return {
    url: `${GEMINI_URL}/${o.model}:generateContent`,
    init: {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": o.apiKey },
      body: JSON.stringify({
        ...(o.system ? { systemInstruction: { parts: [{ text: o.system }] } } : {}),
        contents: [{ role: "user", parts }],
        ...(o.tools ? { tools: o.tools } : {}),
        generationConfig: {
          maxOutputTokens: o.maxTokens,
          ...(o.temperature !== undefined ? { temperature: o.temperature } : {}),
          ...(o.generationConfig ?? {}),
        },
      }),
    },
  };
}

function parse(provider: Provider, data: unknown): { text: string; usage: Usage; finishReason?: string | undefined; groundingMetadata?: unknown } {
  const d = data as Record<string, unknown>;
  if (provider === "anthropic") {
    const content = (d.content as { type?: string; text?: string }[] | undefined) ?? [];
    const u = (d.usage as { input_tokens?: number; output_tokens?: number } | undefined) ?? {};
    return {
      text: content.filter((c) => c.type === "text").map((c) => c.text ?? "").join(""),
      usage: { inputTokens: u.input_tokens ?? 0, outputTokens: u.output_tokens ?? 0 },
    };
  }
  const cands =
    (d.candidates as { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string; groundingMetadata?: unknown }[] | undefined) ?? [];
  const u = (d.usageMetadata as { promptTokenCount?: number; candidatesTokenCount?: number } | undefined) ?? {};
  return {
    text: (cands[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join(""),
    usage: { inputTokens: u.promptTokenCount ?? 0, outputTokens: u.candidatesTokenCount ?? 0 },
    finishReason: cands[0]?.finishReason,
    groundingMetadata: (cands[0] as { groundingMetadata?: unknown } | undefined)?.groundingMetadata,
  };
}

const retryable = (status: number) => status === 0 || status === 429 || status >= 500;

export async function callModel(o: CallOptions): Promise<CallResult> {
  const doFetch = o.fetch ?? runtime.fetch;
  const retries = o.retries ?? 1;
  const { url, init } = request(o);
  let last: { status: number; detail: string } = { status: 0, detail: "no attempt" };
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const res = await doFetch(url, { ...init, signal: runtime.AbortSignal.timeout(o.timeoutMs) });
      if (res.ok) {
        return { ok: true, ...parse(o.provider, await res.json()) };
      }
      last = { status: res.status, detail: (await res.text()).slice(0, 300) };
    } catch (e) {
      last = { status: 0, detail: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
    }
    if (!retryable(last.status) || attempt > retries) return { ok: false, status: last.status, detail: last.detail, attempts: attempt };
    await new Promise<void>((resolve) => runtime.setTimeout(() => resolve(), 500 * attempt));
  }
  return { ok: false, status: last.status, detail: last.detail, attempts: retries + 1 };
}
