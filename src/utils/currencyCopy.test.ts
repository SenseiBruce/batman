import { describe, expect, it } from 'vitest';
import { formatSelectedCurrency } from './currencyCopy';

describe('formatSelectedCurrency', () => {
  it('labels a known currency', () => {
    expect(formatSelectedCurrency('USD')).toBe('Currency: $ US Dollar (USD)');
  });

  it('labels INR by default mapping', () => {
    expect(formatSelectedCurrency('INR')).toBe('Currency: ₹ Indian Rupee (INR)');
  });
});
