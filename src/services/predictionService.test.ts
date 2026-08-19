import { describe, it, expect } from 'vitest';
import { PredictionService } from './predictionService';
import { Category, Transaction } from '../types';

const currentMonth = new Date().toISOString().slice(0, 7);
const previous = new Date();
previous.setMonth(previous.getMonth() - 1);
const previousMonth = previous.toISOString().slice(0, 7);

const categories: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#F87171', icon: '🍔', budget: 1_000_000_000, alertsEnabled: true },
  { id: '2', name: 'Transport', color: '#60A5FA', icon: '🚗', budget: 200, alertsEnabled: true },
  { id: '3', name: 'Shopping', color: '#A78BFA', icon: '🛍️', budget: 5000, alertsEnabled: true },
];

function tx(
  id: string,
  amount: number,
  category: string,
  date: string,
  type: Transaction['type'] = 'debit'
): Transaction {
  return {
    id,
    amount,
    type,
    category,
    merchant: `Merchant ${id}`,
    date,
    isManual: true,
  };
}

const fixtures: Transaction[] = [
  tx('f1', 400, 'Food & Dining', `${currentMonth}-01T10:00:00.000Z`),
  tx('f2', 350, 'Food & Dining', `${currentMonth}-03T10:00:00.000Z`),
  tx('f3', 500, 'Food & Dining', `${currentMonth}-05T10:00:00.000Z`),
  tx('t1', 800, 'Transport', `${currentMonth}-02T10:00:00.000Z`),
  tx('t2', 900, 'Transport', `${currentMonth}-04T10:00:00.000Z`),
  tx('c1', 200, 'Food & Dining', `${currentMonth}-02T10:00:00.000Z`, 'credit'),
  tx('p1', 1000, 'Food & Dining', `${previousMonth}-10T10:00:00.000Z`),
];

describe('PredictionService.predictMonthlySpending', () => {
  it('returns no predictions for a month that is not the current month', () => {
    const result = PredictionService.predictMonthlySpending(fixtures, categories, '2020-01');
    expect(result).toEqual([]);
  });

  it('returns one prediction per category for the current month', () => {
    const result = PredictionService.predictMonthlySpending(fixtures, categories, currentMonth);
    expect(result).toHaveLength(categories.length);
    expect(result.map((p) => p.categoryName).sort()).toEqual(
      categories.map((c) => c.name).sort()
    );
  });

  it('predicts zero spend and stable trend when a category has no debit transactions', () => {
    const result = PredictionService.predictMonthlySpending(fixtures, categories, currentMonth);
    const shopping = result.find((p) => p.categoryName === 'Shopping');
    expect(shopping).toEqual({
      categoryName: 'Shopping',
      predictedSpend: 0,
      confidence: 50,
      trend: 'stable',
      trendPercentage: 0,
    });
  });

  it('extrapolates Food & Dining spend from debit fixtures and ignores credits', () => {
    const result = PredictionService.predictMonthlySpending(fixtures, categories, currentMonth);
    const food = result.find((p) => p.categoryName === 'Food & Dining');
    expect(food).toBeDefined();
    expect(food!.predictedSpend).toBeGreaterThanOrEqual(400 + 350 + 500);
    expect(food!.confidence).toBeGreaterThan(0);
    expect(food!.confidence).toBeLessThanOrEqual(100);
    expect(['increasing', 'decreasing', 'stable']).toContain(food!.trend);
  });
});

describe('PredictionService.forecastBudgetExceedance', () => {
  it('flags Transport as over budget given the low limit and high spend fixtures', () => {
    const forecasts = PredictionService.forecastBudgetExceedance(
      fixtures,
      categories,
      currentMonth
    );
    const transport = forecasts.find((f) => f.categoryName === 'Transport');
    expect(transport).toBeDefined();
    expect(transport!.willExceed).toBe(true);
    expect(transport!.currentSpend).toBe(1700);
    expect(transport!.budgetLimit).toBe(200);
    expect(transport!.exceedAmount).toBeGreaterThan(0);
    expect(transport!.predictedMonthEnd).toBeGreaterThan(transport!.budgetLimit);
  });

  it('omits categories that are predicted to stay within budget', () => {
    const forecasts = PredictionService.forecastBudgetExceedance(
      fixtures,
      categories,
      currentMonth
    );
    expect(forecasts.every((f) => f.willExceed)).toBe(true);
    expect(forecasts.find((f) => f.categoryName === 'Food & Dining')).toBeUndefined();
    expect(forecasts.find((f) => f.categoryName === 'Shopping')).toBeUndefined();
  });

  it('returns no forecasts for a non-current month because predictions are empty', () => {
    const forecasts = PredictionService.forecastBudgetExceedance(
      fixtures,
      categories,
      '2020-01'
    );
    expect(forecasts).toEqual([]);
  });
});
