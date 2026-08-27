import { afterEach, describe, expect, it } from 'vitest';
import {
  currentMonthIso,
  isValidMonth,
  loadTxSelectedMonth,
  persistTxSelectedMonth,
  TX_SELECTED_MONTH_KEY,
} from './txSelectedMonth';

describe('txSelectedMonth', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('validates YYYY-MM', () => {
    expect(isValidMonth('2026-08')).toBe(true);
    expect(isValidMonth('2026-00')).toBe(false);
  });

  it('loads stored months and falls back', () => {
    expect(loadTxSelectedMonth()).toBe(currentMonthIso());
    localStorage.setItem(TX_SELECTED_MONTH_KEY, '2024-11');
    expect(loadTxSelectedMonth()).toBe('2024-11');
  });

  it('persists valid months only', () => {
    persistTxSelectedMonth('nope');
    expect(localStorage.getItem(TX_SELECTED_MONTH_KEY)).toBeNull();
    persistTxSelectedMonth('2026-03');
    expect(localStorage.getItem(TX_SELECTED_MONTH_KEY)).toBe('2026-03');
  });
});
