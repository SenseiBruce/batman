import { describe, expect, it } from 'vitest';
import { formatExpenseChange } from './expenseChangeCopy';

describe('formatExpenseChange', () => {
  it('formats an Insights month-over-month expense change', () => {
    expect(formatExpenseChange(8.21, true)).toBe('vs last month: ↑ 8.2%');
    expect(formatExpenseChange(-3.4, true)).toBe('vs last month: ↓ 3.4%');
    expect(formatExpenseChange(0, true)).toBe('vs last month: → 0.0%');
  });

  it('labels missing previous-month data', () => {
    expect(formatExpenseChange(12, false)).toBe('vs last month: n/a');
    expect(formatExpenseChange(Number.NaN, true)).toBe('vs last month: n/a');
  });
});
