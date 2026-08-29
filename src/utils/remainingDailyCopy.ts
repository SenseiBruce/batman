export function formatRemainingDaily(budgetLeft: number, daysLeft: number): string {
  if (!Number.isFinite(budgetLeft) || !Number.isFinite(daysLeft) || daysLeft <= 0) {
    return 'Remaining per day: n/a';
  }
  return `Remaining per day: ₹${Math.round(budgetLeft / daysLeft)}`;
}
