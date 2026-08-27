import { describe, expect, it } from 'vitest';
import { loadTxSearchQuery, persistTxSearchQuery, TX_SEARCH_QUERY_KEY } from './txSearchQuery';

describe('txSearchQuery', () => {
  it('loads an empty string when nothing is stored', () => {
    expect(loadTxSearchQuery({ getItem: () => null })).toBe('');
  });

  it('round-trips a merchant search string', () => {
    const store: Record<string, string> = {};
    persistTxSearchQuery('Swiggy', {
      setItem: (key, value) => {
        store[key] = value;
      },
    });
    expect(store[TX_SEARCH_QUERY_KEY]).toBe('Swiggy');
    expect(loadTxSearchQuery({ getItem: (key) => store[key] ?? null })).toBe('Swiggy');
  });
});
