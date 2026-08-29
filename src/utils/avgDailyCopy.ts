export function formatAvgDaily(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `Avg/day: ₹${Math.round(n)}`;
}
