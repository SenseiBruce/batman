import { describe, expect, it } from 'vitest';
import { formatBudgetUsed } from './budgetUsedCopy';

describe('formatBudgetUsed', () => {
  it('rounds the Insights budget-used percentage', () => {
    expect(formatBudgetUsed(71.2)).toBe('Budget used: 71%');
  });

  it('treats non-finite values as zero', () => {
    expect(formatBudgetUsed(Number.NaN)).toBe('Budget used: 0%');
  });
});
