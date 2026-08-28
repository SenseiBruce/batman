import { afterEach, describe, expect, it } from 'vitest';
import {
  CUSTOM_REPORTS_CHART_TYPE_KEY,
  loadCustomReportsChartType,
  parseCustomReportsChartType,
  persistCustomReportsChartType,
} from './customReportsChartType';

describe('customReportsChartType', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('parses line, bar, and pie only', () => {
    expect(parseCustomReportsChartType('line')).toBe('line');
    expect(parseCustomReportsChartType('bar')).toBe('bar');
    expect(parseCustomReportsChartType('pie')).toBe('pie');
    expect(parseCustomReportsChartType('area')).toBeNull();
  });

  it('loads and persists', () => {
    expect(loadCustomReportsChartType()).toBe('bar');
    persistCustomReportsChartType('pie');
    expect(localStorage.getItem(CUSTOM_REPORTS_CHART_TYPE_KEY)).toBe('pie');
    expect(loadCustomReportsChartType()).toBe('pie');
  });
});
