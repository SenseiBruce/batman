import { afterEach, describe, expect, it } from 'vitest';
import {
  CUSTOM_REPORTS_DATE_RANGE_KEY,
  defaultCustomReportsRange,
  isValidReportDate,
  loadCustomReportsDateRange,
  persistCustomReportsDateRange,
} from './customReportsDateRange';

describe('customReportsDateRange', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('accepts ISO dates only', () => {
    expect(isValidReportDate('2026-01-15')).toBe(true);
    expect(isValidReportDate('2026-1-15')).toBe(false);
    expect(isValidReportDate('')).toBe(false);
  });

  it('loads defaults then persists a range', () => {
    const now = new Date('2026-08-28T12:00:00.000Z');
    expect(loadCustomReportsDateRange(localStorage, now)).toEqual(defaultCustomReportsRange(now));
    persistCustomReportsDateRange({ startDate: '2026-07-01', endDate: '2026-07-31' });
    expect(JSON.parse(localStorage.getItem(CUSTOM_REPORTS_DATE_RANGE_KEY) || '{}')).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
    expect(loadCustomReportsDateRange()).toEqual({
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    });
  });

  it('ignores malformed JSON', () => {
    const now = new Date('2026-08-28T12:00:00.000Z');
    localStorage.setItem(CUSTOM_REPORTS_DATE_RANGE_KEY, '{nope');
    expect(loadCustomReportsDateRange(localStorage, now)).toEqual(defaultCustomReportsRange(now));
  });
});
