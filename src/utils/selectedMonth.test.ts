import { afterEach, describe, expect, it } from 'vitest';
import {
  currentMonthIso,
  isValidSelectedMonth,
  loadSelectedMonth,
  persistSelectedMonth,
  SELECTED_MONTH_STORAGE_KEY,
} from './selectedMonth';

describe('selectedMonth persistence', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('accepts YYYY-MM values only', () => {
    expect(isValidSelectedMonth('2026-08')).toBe(true);
    expect(isValidSelectedMonth('2026-13')).toBe(false);
    expect(isValidSelectedMonth('26-08')).toBe(false);
    expect(isValidSelectedMonth(null)).toBe(false);
  });

  it('loads a stored month and falls back to the current month', () => {
    expect(loadSelectedMonth()).toBe(currentMonthIso());
    localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, 'not-a-month');
    expect(loadSelectedMonth()).toBe(currentMonthIso());
    localStorage.setItem(SELECTED_MONTH_STORAGE_KEY, '2025-12');
    expect(loadSelectedMonth()).toBe('2025-12');
  });

  it('persists valid months and ignores invalid ones', () => {
    persistSelectedMonth('bogus');
    expect(localStorage.getItem(SELECTED_MONTH_STORAGE_KEY)).toBeNull();
    persistSelectedMonth('2026-01');
    expect(localStorage.getItem(SELECTED_MONTH_STORAGE_KEY)).toBe('2026-01');
  });

  it('falls back when storage throws', () => {
    const throwingGet = {
      getItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadSelectedMonth(throwingGet)).toBe(currentMonthIso());
    persistSelectedMonth('2026-02', {
      setItem: () => {
        throw new Error('quota');
      },
    });
  });
});
