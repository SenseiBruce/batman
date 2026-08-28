import { afterEach, describe, expect, it } from 'vitest';
import {
  CUSTOM_REPORTS_GROUP_BY_KEY,
  loadCustomReportsGroupBy,
  parseCustomReportsGroupBy,
  persistCustomReportsGroupBy,
} from './customReportsGroupBy';

describe('customReportsGroupBy', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('parses day, week, and month only', () => {
    expect(parseCustomReportsGroupBy('day')).toBe('day');
    expect(parseCustomReportsGroupBy('week')).toBe('week');
    expect(parseCustomReportsGroupBy('month')).toBe('month');
    expect(parseCustomReportsGroupBy('year')).toBeNull();
  });

  it('loads and persists', () => {
    expect(loadCustomReportsGroupBy()).toBe('day');
    persistCustomReportsGroupBy('week');
    expect(localStorage.getItem(CUSTOM_REPORTS_GROUP_BY_KEY)).toBe('week');
    expect(loadCustomReportsGroupBy()).toBe('week');
  });
});
