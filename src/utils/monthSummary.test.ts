import { describe, expect, it } from 'vitest';
import { formatMonthSummary } from './monthSummary';

describe('formatMonthSummary', () => {
  it('formats expenses, budget, average, MoM, and top categories', () => {
    const text = formatMonthSummary({
      monthLabel: 'August 2025',
      expenses: 12345,
      budgetLeft: 5000,
      budgetProgress: 71.2,
      avgDaily: 412.4,
      expenseChange: 8.2,
      hasPreviousMonth: true,
      topCategories: [
        { name: 'Food', value: 4000 },
        { name: 'Transport', value: 2100 },
        { name: 'Shopping', value: 1800 },
        { name: 'Other', value: 100 },
      ],
    });

    expect(text).toBe(
      [
        'August 2025 — Spending Summary',
        'Expenses: ₹12,345',
        'Budget left: ₹5,000 (71% used)',
        'Avg/day: ₹412',
        'vs last month: ↑ 8.2%',
        'Top categories: Food ₹4,000 · Transport ₹2,100 · Shopping ₹1,800',
      ].join('\n')
    );
  });

  it('notes an active category filter and missing previous month', () => {
    const text = formatMonthSummary({
      monthLabel: 'January 2026',
      categoryFilter: 'Food & Dining',
      expenses: 10,
      budgetLeft: 90,
      budgetProgress: 10,
      avgDaily: 10,
      expenseChange: 0,
      hasPreviousMonth: false,
      topCategories: [],
      formatAmount: (n) => `$${n}`,
    });

    expect(text).toContain('January 2026 — Spending Summary (Food & Dining only)');
    expect(text).toContain('vs last month: n/a');
    expect(text).not.toContain('Top categories:');
  });
});
