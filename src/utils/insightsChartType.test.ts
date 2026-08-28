import { afterEach, describe, expect, it } from 'vitest';
import {
  INSIGHTS_CHART_TYPE_KEY,
  loadInsightsChartType,
  parseInsightsChartType,
  persistInsightsChartType,
} from './insightsChartType';

describe('insightsChartType', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('parses pie and bar only', () => {
    expect(parseInsightsChartType('pie')).toBe('pie');
    expect(parseInsightsChartType('bar')).toBe('bar');
    expect(parseInsightsChartType('line')).toBeNull();
  });

  it('loads and persists', () => {
    expect(loadInsightsChartType()).toBe('pie');
    persistInsightsChartType('bar');
    expect(localStorage.getItem(INSIGHTS_CHART_TYPE_KEY)).toBe('bar');
    expect(loadInsightsChartType()).toBe('bar');
  });
});
