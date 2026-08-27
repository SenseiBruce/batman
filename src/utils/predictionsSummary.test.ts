import { describe, expect, it } from 'vitest';
import { formatPredictionsSummary } from './predictionsSummary';

describe('formatPredictionsSummary', () => {
  it('includes counts and top insight titles', () => {
    const text = formatPredictionsSummary({
      month: '2026-08',
      insights: [
        {
          type: 'warning',
          title: 'Dining spike',
          message: 'Up 20%',
          priority: 'high',
          icon: '!',
        },
      ],
      forecasts: [
        {
          categoryName: 'Food',
          currentSpend: 9,
          predictedMonthEnd: 12,
          budgetLimit: 10,
          willExceed: true,
        },
      ],
      anomalies: [],
      predictions: [
        {
          categoryName: 'Food',
          predictedSpend: 12,
          confidence: 80,
          trend: 'increasing',
          trendPercentage: 20,
        },
      ],
    });
    expect(text).toContain('AI predictions (2026-08)');
    expect(text).toContain('Insights: 1');
    expect(text).toContain('[high] Dining spike');
    expect(text).toContain('Forecasts over budget: 1');
    expect(text).toContain('Anomalies: 0');
    expect(text).toContain('Category forecasts: 1');
  });
});
