import { describe, expect, it } from 'vitest';
import { formatInsightsChartType } from './insightsChartTypeCopy';

describe('formatInsightsChartType', () => {
  it('labels the visible pie or bar selection', () => {
    expect(formatInsightsChartType('pie')).toBe('Insights chart: pie');
    expect(formatInsightsChartType('bar')).toBe('Insights chart: bar');
  });

  it('labels missing types as unknown', () => {
    expect(formatInsightsChartType(undefined)).toBe('Insights chart: unknown');
  });
});
