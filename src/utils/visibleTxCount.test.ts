import { describe, expect, it } from 'vitest';
import { formatVisibleTxCount } from './visibleTxCount';

describe('formatVisibleTxCount', () => {
  it('labels the filtered count', () => {
    expect(formatVisibleTxCount(0)).toBe('Visible transactions: 0');
    expect(formatVisibleTxCount(3)).toBe('Visible transactions: 3');
  });
});
