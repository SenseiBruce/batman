import { describe, expect, it } from 'vitest';
import { formatDailyInsight } from './dailyInsightSummary';

describe('formatDailyInsight', () => {
  it('includes type, title, and message', () => {
    const text = formatDailyInsight({
      type: 'warning',
      title: 'Over budget',
      message: 'Food is 20% over.',
      icon: '!',
      gradient: 'from-red-500',
    });
    expect(text).toContain('Jarvis insight (warning)');
    expect(text).toContain('Over budget');
    expect(text).toContain('Food is 20% over.');
  });
});
