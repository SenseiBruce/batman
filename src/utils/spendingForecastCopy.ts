export function formatSpendingForecast(input: {
  monthLabel: string;
  projectedTotal: number;
  overBudget: boolean;
  totalBudget: number;
  dailyAvg: number;
  dayOfMonth: number;
  daysInMonth: number;
}): string {
  const rupee = (n: number) => `₹${Math.round(n)}`;
  const status = input.overBudget ? 'Projected Overspend' : 'On Track';
  return [
    `Spending forecast (${input.monthLabel}): ${rupee(input.projectedTotal)} projected — ${status}`,
    `Budget: ${rupee(input.totalBudget)} · Daily avg: ${rupee(input.dailyAvg)} · Day ${input.dayOfMonth} of ${input.daysInMonth}`,
  ].join('\n');
}
