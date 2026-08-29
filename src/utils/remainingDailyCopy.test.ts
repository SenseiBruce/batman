import { describe, expect, it } from 'vitest';
import { formatRemainingDaily } from './remainingDailyCopy';

describe('formatRemainingDaily', () => {
  it('formats Insights remaining daily budget', () => {
    expect(formatRemainingDaily(3100, 10)).toBe('Remaining per day: ₹310');
  });

  it('labels missing remaining days as n/a', () => {
    expect(formatRemainingDaily(1000, 0)).toBe('Remaining per day: n/a');
    expect(formatRemainingDaily(1000, Number.NaN)).toBe('Remaining per day: n/a');
  });
});
