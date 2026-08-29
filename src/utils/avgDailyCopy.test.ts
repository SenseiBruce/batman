import { describe, expect, it } from 'vitest';
import { formatAvgDaily } from './avgDailyCopy';

describe('formatAvgDaily', () => {
  it('rounds rupees for the Insights avg/day card', () => {
    expect(formatAvgDaily(412.4)).toBe('Avg/day: ₹412');
  });

  it('treats non-finite values as zero', () => {
    expect(formatAvgDaily(Number.NaN)).toBe('Avg/day: ₹0');
  });
});
