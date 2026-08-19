import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BudgetService } from './budgetService';
import { Category, Transaction } from '../types';

const food: Category = {
  id: '1',
  name: 'Food & Dining',
  color: '#F87171',
  icon: '🍔',
  budget: 5000,
  rolloverAmount: 200,
  budgetConfig: {
    period: 'monthly',
    rollover: true,
    alerts: { enabled: true, threshold: 80 },
  },
};

function debit(id: string, amount: number, date: string, category = 'Food & Dining'): Transaction {
  return { id, amount, type: 'debit', category, merchant: id, date, isManual: true };
}

describe('BudgetService.getEffectiveBudget', () => {
  it('adds rollover to the base budget', () => {
    expect(BudgetService.getEffectiveBudget(food)).toBe(5200);
  });

  it('treats missing rollover as zero', () => {
    expect(BudgetService.getEffectiveBudget({ ...food, rolloverAmount: undefined })).toBe(5000);
  });
});

describe('BudgetService.calculateSpent', () => {
  const start = new Date('2026-08-01T00:00:00.000Z');
  const end = new Date('2026-08-31T23:59:59.999Z');

  it('sums debit transactions in the category and window', () => {
    const txs = [
      debit('a', 100, '2026-08-10T12:00:00.000Z'),
      debit('b', 250, '2026-08-20T12:00:00.000Z'),
      debit('c', 50, '2026-07-31T12:00:00.000Z'),
      { ...debit('d', 80, '2026-08-15T12:00:00.000Z'), type: 'credit' as const },
      debit('e', 40, '2026-08-12T12:00:00.000Z', 'Transport'),
    ];
    expect(BudgetService.calculateSpent(food, txs, start, end)).toBe(350);
  });
});

describe('BudgetService.calculateRollover', () => {
  it('returns remaining budget when rollover is enabled', () => {
    expect(BudgetService.calculateRollover(food, 1200)).toBe(4000);
  });

  it('returns 0 when rollover is disabled', () => {
    expect(
      BudgetService.calculateRollover({ ...food, budgetConfig: { ...food.budgetConfig!, rollover: false } }, 100)
    ).toBe(0);
  });

  it('carries a negative remainder when overspent', () => {
    expect(BudgetService.calculateRollover(food, 6000)).toBe(-800);
  });
});

describe('BudgetService.getBudgetPeriod', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-19T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the calendar month by default', () => {
    const { start, end } = BudgetService.getBudgetPeriod();
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(start.getMonth());
  });

  it('returns Monday–Sunday for weekly period', () => {
    const { start, end } = BudgetService.getBudgetPeriod({
      period: 'weekly',
      rollover: false,
      alerts: { enabled: false, threshold: 80 },
    });
    expect(start.getDay()).toBe(1);
    expect(end.getDay()).toBe(0);
  });

  it('returns Jan 1–Dec 31 for yearly period', () => {
    const { start, end } = BudgetService.getBudgetPeriod({
      period: 'yearly',
      rollover: false,
      alerts: { enabled: false, threshold: 80 },
    });
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(11);
    expect(end.getDate()).toBe(31);
  });
});

describe('BudgetService.shouldTriggerAlert', () => {
  it('is false when alerts are disabled', () => {
    const cat = { ...food, budgetConfig: { ...food.budgetConfig!, alerts: { enabled: false, threshold: 80 } } };
    expect(BudgetService.shouldTriggerAlert(cat, 5000)).toBe(false);
  });

  it('is true once spend crosses the threshold of effective budget', () => {
    expect(BudgetService.shouldTriggerAlert(food, 4160)).toBe(true);
    expect(BudgetService.shouldTriggerAlert(food, 1000)).toBe(false);
  });
});

describe('BudgetService.getDefaultConfig', () => {
  it('defaults to monthly with 80% alerts', () => {
    expect(BudgetService.getDefaultConfig()).toEqual({
      period: 'monthly',
      rollover: false,
      alerts: { enabled: true, threshold: 80 },
    });
  });
});
