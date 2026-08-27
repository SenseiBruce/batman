import { describe, expect, it } from 'vitest';
import { formatDaysLeft } from './daysLeftCopy';

describe('formatDaysLeft', () => {
  it('labels remaining days in the current month', () => {
    expect(formatDaysLeft(10, 31)).toBe('Days left: 10');
  });

  it('falls back to days in month when none remain', () => {
    expect(formatDaysLeft(0, 31)).toBe('Days left: 31');
    expect(formatDaysLeft(-1, 28)).toBe('Days left: 28');
  });
});
