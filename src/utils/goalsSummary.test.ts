import { describe, expect, it } from 'vitest';
import { Goal } from '../types';
import { formatGoalsSummary } from './goalsSummary';

const rupees = (n: number) => `₹${n}`;

const sample: Goal = {
  id: 'g1',
  name: 'Emergency fund',
  targetAmount: 100000,
  savedAmount: 25000,
  icon: '🎯',
  color: 'bg-blue-500',
  isCompleted: false,
};

describe('formatGoalsSummary', () => {
  it('reports an empty list', () => {
    expect(formatGoalsSummary([], rupees)).toBe('Savings goals: none set');
  });

  it('lists progress and completed status', () => {
    const text = formatGoalsSummary(
      [
        sample,
        {
          ...sample,
          id: 'g2',
          name: 'Phone',
          savedAmount: 20000,
          targetAmount: 20000,
          isCompleted: true,
        },
      ],
      rupees
    );
    expect(text).toContain('Savings goals: 2 (1 completed)');
    expect(text).toContain('Emergency fund: ₹25000 / ₹100000 (25%, in progress)');
    expect(text).toContain('Phone: ₹20000 / ₹20000 (100%, completed)');
  });
});
