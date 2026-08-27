import { describe, expect, it } from 'vitest';
import { Transaction } from '../types';
import { formatFilteredSpend, summarizeFilteredSpend } from './filteredSpend';

const debit: Transaction = {
  id: '1',
  amount: 250,
  type: 'debit',
  category: 'Food',
  merchant: 'Cafe',
  date: '2026-08-01',
  isManual: true,
};

const credit: Transaction = {
  id: '2',
  amount: 1000,
  type: 'credit',
  category: 'Income',
  merchant: 'Payroll',
  date: '2026-08-02',
  isManual: true,
};

describe('summarizeFilteredSpend', () => {
  it('returns zeros for an empty list', () => {
    expect(summarizeFilteredSpend([])).toEqual({ debit: 0, credit: 0, count: 0 });
  });

  it('sums mixed debit and credit rows', () => {
    expect(summarizeFilteredSpend([debit, credit])).toEqual({
      debit: 250,
      credit: 1000,
      count: 2,
    });
  });
});

describe('formatFilteredSpend', () => {
  it('formats totals with the month label', () => {
    expect(formatFilteredSpend([debit, credit], 'August 2026', (n) => `₹${n}`)).toBe(
      'Filtered spend (August 2026): ₹250 debits · ₹1000 credits · 2 transactions',
    );
  });
});
