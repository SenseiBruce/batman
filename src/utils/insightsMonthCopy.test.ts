import { describe, expect, it } from 'vitest';
import { formatInsightsMonth } from './insightsMonthCopy';

describe('formatInsightsMonth', () => {
  it('formats the Insights month selector label', () => {
    expect(formatInsightsMonth('2026-08')).toBe('Insights month: August 2026');
  });

  it('labels invalid months as unknown', () => {
    expect(formatInsightsMonth('')).toBe('Insights month: unknown');
    expect(formatInsightsMonth('not-a-month')).toBe('Insights month: unknown');
    expect(formatInsightsMonth(undefined)).toBe('Insights month: unknown');
  });
});
