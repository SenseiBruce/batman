import { describe, expect, it } from 'vitest';
import { formatBudgetAlerts } from './budgetAlertsCopy';

describe('formatBudgetAlerts', () => {
  it('reports when there are no alerts', () => {
    expect(formatBudgetAlerts([])).toBe('Budget alerts: none');
  });

  it('lists category usage percents', () => {
    expect(
      formatBudgetAlerts([
        { name: 'Food', percentage: 120.4 },
        { name: 'Travel', percentage: 80 },
      ]),
    ).toBe('Budget alerts (2):\n- Food: 120% used\n- Travel: 80% used');
  });
});
