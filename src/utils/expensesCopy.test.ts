import { describe, expect, it } from 'vitest';
import { formatExpenses } from './expensesCopy';

describe('formatExpenses', () => {
  it('rounds rupees for the Insights expenses card', () => {
    expect(formatExpenses(1842.6)).toBe('Expenses: ₹1843');
  });

  it('treats non-finite values as zero', () => {
    expect(formatExpenses(Number.NaN)).toBe('Expenses: ₹0');
  });
});
