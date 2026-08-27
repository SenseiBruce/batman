import { describe, expect, it } from 'vitest';
import { formatAccountsSummary } from './accountsSummary';
import type { Account } from '../types';

const savings: Account = {
  id: 'a1',
  name: 'HDFC',
  type: 'bank',
  balance: 12000,
  color: '#000',
  icon: '🏦',
};

const card: Account = {
  id: 'a2',
  name: 'Amex',
  type: 'credit_card',
  balance: -2500,
  color: '#000',
  icon: '💳',
};

describe('formatAccountsSummary', () => {
  it('lists empty accounts', () => {
    expect(formatAccountsSummary([], 0)).toBe('Accounts — Net worth: ₹0\n(none)');
  });

  it('includes net worth and each account', () => {
    const text = formatAccountsSummary([savings, card], 9500);
    expect(text).toContain('Net worth: ₹9,500');
    expect(text).toContain('HDFC (bank): ₹12,000');
    expect(text).toContain('Amex (credit card): ₹-2,500');
  });
});
