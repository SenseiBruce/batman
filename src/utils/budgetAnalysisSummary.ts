export type BudgetAnalysisSnapshot = {
  month: string;
  statusText: string;
  progress: number;
  spent: number;
  budget: number;
  remaining: number;
  overBudgetCount: number;
};

export function formatBudgetAnalysisSummary(
  snapshot: BudgetAnalysisSnapshot,
  formatAmount: (n: number) => string
): string {
  const progress = Number.isFinite(snapshot.progress) ? Math.round(snapshot.progress) : 0;
  return [
    `Budget analysis (${snapshot.month})`,
    `Status: ${snapshot.statusText}`,
    `Spent: ${formatAmount(snapshot.spent)} of ${formatAmount(snapshot.budget)} (${progress}%)`,
    `Remaining: ${formatAmount(snapshot.remaining)}`,
    `Categories over budget: ${snapshot.overBudgetCount}`,
  ].join('\n');
}
