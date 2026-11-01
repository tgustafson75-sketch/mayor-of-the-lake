// Annual budget model over the SCENARIO shares. Pure. No real figures.
import { BUDGET_SCENARIO } from "../config/scenarios/budget";

export interface BudgetYear {
  year: number;
  revenueMUsd: number;
  expenseMUsd: number;
  surplusMUsd: number;
  reserveMUsd: number;
}

export interface BudgetState {
  year: number;
  baseMUsd: number; // total budget this year, USD millions
  reserveMUsd: number;
  history: BudgetYear[];
}

export function createBudget(): BudgetState {
  const base = BUDGET_SCENARIO.totalMUsd;
  return { year: 0, baseMUsd: base, reserveMUsd: base * (BUDGET_SCENARIO.reserveTargetMonths / 12), history: [] };
}

/** One fiscal year. Revenue grows with the tax base; spend stays at the scenario share. */
export function runBudgetYear(b: BudgetState, revenueShock = 1): BudgetState {
  const revenue = b.baseMUsd * revenueShock;
  const expense = b.baseMUsd;
  const surplus = revenue - expense;
  const reserve = Math.max(0, b.reserveMUsd + surplus);
  const row: BudgetYear = { year: b.year, revenueMUsd: round2(revenue), expenseMUsd: round2(expense), surplusMUsd: round2(surplus), reserveMUsd: round2(reserve) };
  return {
    year: b.year + 1,
    baseMUsd: b.baseMUsd * (1 + BUDGET_SCENARIO.taxBaseGrowth),
    reserveMUsd: reserve,
    history: [...b.history, row],
  };
}

export function shareSum(shares: Record<string, number>): number {
  return Object.values(shares).reduce((a, b) => a + b, 0);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
