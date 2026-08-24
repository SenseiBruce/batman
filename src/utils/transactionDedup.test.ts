import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import { dedupeTransactions, transactionFingerprint } from './transactionDedup';

const base: Transaction = {
  id: 'a',
  amount: 250,
  type: 'debit',
  category: 'Food & Dining',
  merchant: 'Swiggy',
  date: '2026-08-24T10:00:00.000Z',
  isManual: false,
};

describe('transactionDedup', () => {
  it('fingerprints by calendar day, merchant, amount, and type', () => {
    expect(transactionFingerprint(base)).toBe('2026-08-24|swiggy|250|debit');
    expect(
      transactionFingerprint({ ...base, merchant: '  SWIGGY ', date: '2026-08-24T23:59:59.000Z' })
    ).toBe('2026-08-24|swiggy|250|debit');
  });

  it('skips incoming rows that match existing fingerprints even with new ids', () => {
    const incoming: Transaction[] = [
      { ...base, id: 'new-1' },
      { ...base, id: 'new-2', merchant: 'Uber', amount: 80 },
    ];
    const { unique, skipped } = dedupeTransactions([base], incoming);
    expect(skipped).toBe(1);
    expect(unique).toEqual([{ ...base, id: 'new-2', merchant: 'Uber', amount: 80 }]);
  });

  it('also dedupes duplicates within the incoming batch', () => {
    const incoming: Transaction[] = [
      { ...base, id: 'n1' },
      { ...base, id: 'n2' },
    ];
    const { unique, skipped } = dedupeTransactions([], incoming);
    expect(unique).toHaveLength(1);
    expect(skipped).toBe(1);
  });
});
