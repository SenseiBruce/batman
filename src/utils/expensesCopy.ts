export function formatExpenses(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `Expenses: ₹${Math.round(n)}`;
}
