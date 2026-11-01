// Limits on the public talk endpoint. This protects the paid Gemini key.
// Counters live in memory, per function instance. Serverless instances start
// and stop, so these are best-effort brakes, not a billing guarantee. The hard
// spending cap is set in Google Cloud billing (see docs/APP-STATUS.md).

export interface Limits {
  perIpPerMinute: number;
  perIpPerDay: number;
  globalPerDay: number;
}

export const PUBLIC_LIMITS: Limits = { perIpPerMinute: 6, perIpPerDay: 60, globalPerDay: 500 }; // TUNABLE

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export interface Limiter {
  /** Returns null if the request may proceed, or a reason to refuse it. */
  check(ip: string, now?: number): string | null;
}

export function createLimiter(limits: Limits = PUBLIC_LIMITS): Limiter {
  const minute = new Map<string, number[]>();
  const day = new Map<string, number[]>();
  let globalDay: number[] = [];

  const recent = (hits: number[], now: number, windowMs: number) => hits.filter((t) => now - t < windowMs);

  return {
    check(ip, now = Date.now()) {
      globalDay = recent(globalDay, now, DAY_MS);
      if (globalDay.length >= limits.globalPerDay) return "The daily limit for this demo has been reached. Try again tomorrow.";

      const m = recent(minute.get(ip) ?? [], now, MINUTE_MS);
      const d = recent(day.get(ip) ?? [], now, DAY_MS);
      if (m.length >= limits.perIpPerMinute) return "Too many messages in a minute. Wait a moment.";
      if (d.length >= limits.perIpPerDay) return "You have reached today's limit. Try again tomorrow.";

      m.push(now);
      d.push(now);
      globalDay.push(now);
      minute.set(ip, m);
      day.set(ip, d);
      return null;
    },
  };
}
