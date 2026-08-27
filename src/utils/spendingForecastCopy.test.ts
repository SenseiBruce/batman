import { describe, expect, it } from 'vitest';
import { formatSpendingForecast } from './spendingForecastCopy';

describe('formatSpendingForecast', () => {
  it('formats an on-track projection', () => {
    expect(
      formatSpendingForecast({
        monthLabel: 'August 2026',
        projectedTotal: 12345.6,
        overBudget: false,
        totalBudget: 15000,
        dailyAvg: 823.4,
        dayOfMonth: 15,
        daysInMonth: 31,
      }),
    ).toBe(
      'Spending forecast (August 2026): ₹12346 projected — On Track\nBudget: ₹15000 · Daily avg: ₹823 · Day 15 of 31',
    );
  });

  it('formats a projected overspend', () => {
    expect(
      formatSpendingForecast({
        monthLabel: 'January 2026',
        projectedTotal: 20000,
        overBudget: true,
        totalBudget: 10000,
        dailyAvg: 1000,
        dayOfMonth: 10,
        daysInMonth: 31,
      }),
    ).toContain('Projected Overspend');
  });
});
