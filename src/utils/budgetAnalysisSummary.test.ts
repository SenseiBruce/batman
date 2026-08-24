import { describe, expect, it } from 'vitest';
import { formatBudgetAnalysisSummary } from './budgetAnalysisSummary';

const rupees = (n: number) => `₹${n}`;

describe('formatBudgetAnalysisSummary', () => {
  it('includes month, status, spend, and over-budget count', () => {
    const text = formatBudgetAnalysisSummary(
      {
        month: '2026-08',
        statusText: 'Warning',
        progress: 81.4,
        spent: 81400,
        budget: 100000,
        remaining: 18600,
        overBudgetCount: 2,
      },
      rupees
    );
    expect(text).toContain('Budget analysis (2026-08)');
    expect(text).toContain('Status: Warning');
    expect(text).toContain('Spent: ₹81400 of ₹100000 (81%)');
    expect(text).toContain('Remaining: ₹18600');
    expect(text).toContain('Categories over budget: 2');
  });
});
