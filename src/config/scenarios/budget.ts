// SCENARIO budget. Near-world placeholder, not sourced, not a fact about the
// real city. Replace with exact values from docs/research/budget.md later.

export const BUDGET_SCENARIO = {
  label: "scenario",
  /** Total annual budget, USD millions. SCENARIO placeholder. */
  totalMUsd: 60,
  /** Revenue shares. SCENARIO placeholder, sum to 1. */
  revenueShare: {
    salesTax: 0.3,
    propertyTax: 0.28,
    tourismTot: 0.12,
    fees: 0.1,
    grantsStateFed: 0.1,
    other: 0.1,
  },
  /** Expense shares. SCENARIO placeholder, sum to 1. */
  expenseShare: {
    publicSafety: 0.28,
    infrastructure: 0.18,
    parksRecreation: 0.1,
    lakeEnvironment: 0.12,
    communityServices: 0.09,
    administration: 0.07,
    debtService: 0.06,
    capitalProjects: 0.1,
  },
  /** Reserve target in months of operating spend. SCENARIO placeholder. */
  reserveTargetMonths: 3,
  /** Growth of tax base per year, fraction. SCENARIO placeholder. */
  taxBaseGrowth: 0.03,
} as const;
