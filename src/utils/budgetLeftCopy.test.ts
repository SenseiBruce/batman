import { describe, expect, it } from 'vitest';
import { formatBudgetLeft } from './budgetLeftCopy';

describe('formatBudgetLeft', () => {
  it('rounds rupees for the Insights budget-left card', () => {
    expect(formatBudgetLeft(412.4)).toBe('Budget left: ₹412');
  });

  it('treats non-finite values as zero', () => {
    expect(formatBudgetLeft(Number.NaN)).toBe('Budget left: ₹0');
  });
});
