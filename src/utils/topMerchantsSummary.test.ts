import { describe, expect, it } from 'vitest';
import { formatTopMerchantsSummary } from './topMerchantsSummary';

const rupees = (n: number) => `₹${n}`;

describe('formatTopMerchantsSummary', () => {
  it('formats ranked merchants for a month', () => {
    const text = formatTopMerchantsSummary(
      '2026-08',
      [
        { name: 'Swiggy', amount: 2400 },
        { name: 'Amazon', amount: 1200 },
      ],
      rupees
    );
    expect(text).toContain('Top merchants (2026-08)');
    expect(text).toContain('1. Swiggy — ₹2400');
    expect(text).toContain('2. Amazon — ₹1200');
  });

  it('handles an empty list', () => {
    expect(formatTopMerchantsSummary('2026-08', [], rupees)).toBe('Top merchants (2026-08): none');
  });
});
