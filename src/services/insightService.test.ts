import { describe, expect, it } from 'vitest';
import { generateDailyInsight } from './insightService';
import { Category, Transaction } from '../types';

const month = new Date().toISOString().slice(0, 7);

const categories: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#F87171', icon: '🍔', budget: 10000, alertsEnabled: true },
];

function tx(amount: number, day = '05'): Transaction {
  return {
    id: `t-${amount}`,
    amount,
    type: 'debit',
    category: 'Food & Dining',
    merchant: 'Cafe',
    date: `${month}-${day}T10:00:00.000Z`,
    isManual: true,
  };
}

describe('generateDailyInsight', () => {
  it('returns a daily insight object with a title and message', () => {
    const insight = generateDailyInsight([tx(200), tx(150)], categories, month);
    expect(insight.title).toBeTruthy();
    expect(insight.message).toBeTruthy();
    expect(['success', 'warning', 'info', 'tip']).toContain(insight.type);
  });

  it('still returns an insight when there are no transactions', () => {
    const insight = generateDailyInsight([], categories, month);
    expect(insight).toBeDefined();
    expect(insight.message.length).toBeGreaterThan(0);
  });
});
