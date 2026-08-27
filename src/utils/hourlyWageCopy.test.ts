import { describe, expect, it } from 'vitest';
import { formatHourlyWage } from './hourlyWageCopy';

describe('formatHourlyWage', () => {
  it('labels a configured wage', () => {
    expect(formatHourlyWage(' 20 ')).toBe('Hourly wage: 20');
  });

  it('labels missing or invalid wages', () => {
    expect(formatHourlyWage('')).toBe('Hourly wage: unset');
    expect(formatHourlyWage('0')).toBe('Hourly wage: unset');
    expect(formatHourlyWage('abc')).toBe('Hourly wage: unset');
  });
});
