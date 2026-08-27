export type MonthSummaryCategory = {
  name: string;
  value: number;
};

export type MonthSummaryInput = {
  monthLabel: string;
  categoryFilter?: string | null;
  expenses: number;
  budgetLeft: number;
  budgetProgress: number;
  avgDaily: number;
  expenseChange: number;
  hasPreviousMonth: boolean;
  topCategories: MonthSummaryCategory[];
  formatAmount?: (amount: number) => string;
};

function defaultFormatAmount(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatMonthSummary(input: MonthSummaryInput): string {
  const formatAmount = input.formatAmount ?? defaultFormatAmount;
  const filterNote = input.categoryFilter ? ` (${input.categoryFilter} only)` : '';
  const used = Number.isFinite(input.budgetProgress) ? Math.round(input.budgetProgress) : 0;
  const lines = [
    `${input.monthLabel} — Spending Summary${filterNote}`,
    `Expenses: ${formatAmount(input.expenses)}`,
    `Budget left: ${formatAmount(input.budgetLeft)} (${used}% used)`,
    `Avg/day: ${formatAmount(input.avgDaily)}`,
  ];

  if (input.hasPreviousMonth) {
    const arrow = input.expenseChange > 0 ? '↑' : input.expenseChange < 0 ? '↓' : '→';
    lines.push(`vs last month: ${arrow} ${Math.abs(input.expenseChange).toFixed(1)}%`);
  } else {
    lines.push('vs last month: n/a');
  }

  if (input.topCategories.length > 0) {
    const top = input.topCategories
      .slice(0, 3)
      .map((cat) => `${cat.name} ${formatAmount(cat.value)}`)
      .join(' · ');
    lines.push(`Top categories: ${top}`);
  }

  return lines.join('\n');
}
