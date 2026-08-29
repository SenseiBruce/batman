export function formatBudgetLeft(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `Budget left: ₹${Math.round(n)}`;
}
