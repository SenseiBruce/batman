import { describe, expect, it } from 'vitest';
import { formatSubscriptionSummary, monthlyCost } from './subscriptionSummary';
import type { Subscription } from '../services/subscriptionService';

const netflix: Subscription = {
  id: '1',
  merchant: 'Netflix',
  amount: 199,
  lastPaymentDate: '2026-07-24',
  nextDueDate: '2026-08-24',
  frequencyDays: 30,
};

const weekly: Subscription = {
  id: '2',
  merchant: 'Gym',
  amount: 200,
  lastPaymentDate: '2026-08-17',
  nextDueDate: '2026-08-24',
  frequencyDays: 7,
};

describe('subscriptionSummary', () => {
  it('annualizes a weekly charge to a 30-day month', () => {
    expect(monthlyCost(weekly)).toBeCloseTo(857.14, 1);
  });

  it('formats merchants, cadence, next due, and estimated monthly total', () => {
    expect(formatSubscriptionSummary([netflix, weekly])).toBe(
      [
        'Jarvis subscriptions',
        'Netflix  ₹199 / 30d  next 2026-08-24',
        'Gym  ₹200 / 7d  next 2026-08-24',
        'Est. monthly: ₹1056',
      ].join('\n')
    );
  });
});
