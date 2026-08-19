import { describe, expect, it } from 'vitest';
import { SplitService } from './splitService';
import { Friend, SplitExpense } from '../types';

describe('SplitService', () => {
  it('splits equally and rounds to cents', () => {
    expect(SplitService.calculateEqualSplit(100, 3)).toBe(33.33);
    expect(SplitService.calculateEqualSplit(90, 0)).toBe(0);
  });

  it('validates custom splits within a cent', () => {
    expect(SplitService.validateCustomSplit(100, [40, 60])).toBe(true);
    expect(SplitService.validateCustomSplit(100, [40, 50])).toBe(false);
  });

  it('computes percentage splits and rejects totals other than 100', () => {
    expect(SplitService.calculatePercentageSplit(200, [25, 75])).toEqual([50, 150]);
    expect(() => SplitService.calculatePercentageSplit(200, [40, 40])).toThrow(/100/);
  });

  it('marks a split settled when every participant has paid', () => {
    const split: SplitExpense = {
      id: 's1',
      transactionId: 't1',
      totalAmount: 100,
      paidBy: 'me',
      splitType: 'equal',
      createdDate: '2026-08-01',
      isSettled: false,
      participants: [
        { id: 'a', name: 'Ada', amount: 50, paid: false },
        { id: 'b', name: 'Bob', amount: 50, paid: true },
      ],
    };
    const afterAda = SplitService.settleSplit(split, 'a');
    expect(afterAda.isSettled).toBe(true);
    expect(afterAda.participants[0].paid).toBe(true);
  });

  it('aggregates friend balances', () => {
    const friends: Friend[] = [
      { id: '1', name: 'Ada', totalOwed: 40, totalOwing: 10, addedDate: '2026-01-01' },
      { id: '2', name: 'Bob', totalOwed: 5, totalOwing: 20, addedDate: '2026-01-01' },
    ];
    expect(SplitService.getTotalOwed(friends)).toBe(45);
    expect(SplitService.getTotalOwing(friends)).toBe(30);
    expect(SplitService.getOutstandingBalance(friends[0])).toBe(30);
  });
});
