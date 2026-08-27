import { afterEach, describe, expect, it } from 'vitest';
import { loadTxAmountRange, saveTxAmountRange } from './transactionAmountRangeStorage';

describe('transactionAmountRangeStorage', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns empty strings when nothing is stored', () => {
    expect(loadTxAmountRange()).toEqual({ amountMin: '', amountMax: '' });
  });

  it('round-trips an amount range', () => {
    saveTxAmountRange({ amountMin: '10', amountMax: '500' });
    expect(loadTxAmountRange()).toEqual({ amountMin: '10', amountMax: '500' });
  });

  it('ignores malformed JSON', () => {
    localStorage.setItem('jarvis_tx_amount_range', '{not-json');
    expect(loadTxAmountRange()).toEqual({ amountMin: '', amountMax: '' });
  });
});
