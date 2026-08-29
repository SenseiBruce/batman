export function formatExpenseChange(change: number, hasPrevious: boolean): string {
  if (!hasPrevious || !Number.isFinite(change)) {
    return 'vs last month: n/a';
  }
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '→';
  return `vs last month: ${arrow} ${Math.abs(change).toFixed(1)}%`;
}
