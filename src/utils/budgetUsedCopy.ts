export function formatBudgetUsed(percent: number): string {
  const n = Number.isFinite(percent) ? percent : 0;
  return `Budget used: ${Math.round(n)}%`;
}
