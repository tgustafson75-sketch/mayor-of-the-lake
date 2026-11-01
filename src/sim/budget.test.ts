import { describe, expect, it } from "vitest";
import { BUDGET_SCENARIO } from "../config/scenarios/budget";
import { createBudget, runBudgetYear, shareSum } from "./budget";

describe("budget scenario", () => {
  it("revenue and expense shares each sum to 1", () => {
    expect(shareSum(BUDGET_SCENARIO.revenueShare)).toBeCloseTo(1, 6);
    expect(shareSum(BUDGET_SCENARIO.expenseShare)).toBeCloseTo(1, 6);
  });

  it("runs 20 fiscal years with balanced years keeping reserve non-negative", () => {
    let b = createBudget();
    for (let i = 0; i < 20; i++) b = runBudgetYear(b);
    expect(b.history).toHaveLength(20);
    expect(b.reserveMUsd).toBeGreaterThanOrEqual(0);
    expect(b.history.every((r) => Number.isFinite(r.surplusMUsd))).toBe(true);
  });

  it("a revenue shock drains the reserve and a deep one can empty it", () => {
    let b = createBudget();
    const start = b.reserveMUsd;
    b = runBudgetYear(b, 0.8);
    expect(b.reserveMUsd).toBeLessThan(start);
    b = runBudgetYear(b, 0.5);
    expect(b.reserveMUsd).toBe(0);
  });

  it("a balanced year leaves the reserve unchanged", () => {
    const b = createBudget();
    expect(runBudgetYear(b).reserveMUsd).toBeCloseTo(b.reserveMUsd, 6);
  });
});
