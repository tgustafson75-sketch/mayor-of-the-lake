// Per-session token counter for the dev panel. Prices are passed in by the
// caller, looked up from Anthropic's pricing page at build time. None are hard-coded here.
import type { Usage } from "./provider";

export interface Prices {
  /** USD per million input tokens. */
  inputPerMTok: number;
  /** USD per million output tokens. */
  outputPerMTok: number;
}

export class CostCounter {
  private input = 0;
  private output = 0;
  constructor(private readonly prices?: Prices) {}

  add(u: Usage): void {
    this.input += u.inputTokens;
    this.output += u.outputTokens;
  }

  totals(): { inputTokens: number; outputTokens: number; usd: number | null } {
    const usd = this.prices
      ? (this.input * this.prices.inputPerMTok + this.output * this.prices.outputPerMTok) / 1_000_000
      : null;
    return { inputTokens: this.input, outputTokens: this.output, usd };
  }
}
