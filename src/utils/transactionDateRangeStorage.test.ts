import { afterEach, describe, expect, it } from 'vitest';
import { loadTxDateRange, saveTxDateRange } from './transactionDateRangeStorage';

describe('transactionDateRangeStorage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns empty strings when nothing is stored', () => {
    expect(loadTxDateRange()).toEqual({ dateFrom: '', dateTo: '' });
  });

  it('round-trips a date range', () => {
    saveTxDateRange({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });
    expect(loadTxDateRange()).toEqual({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });
  });

  it('ignores malformed JSON', () => {
    localStorage.setItem('jarvis_tx_date_range', '{not-json');
    expect(loadTxDateRange()).toEqual({ dateFrom: '', dateTo: '' });
  });
});
