import { describe, expect, it } from 'vitest';
import {
  loadTxCategoryFilter,
  persistTxCategoryFilter,
  TX_CATEGORY_FILTER_KEY,
} from './txCategoryFilter';

describe('txCategoryFilter', () => {
  it('loads empty when nothing is stored', () => {
    expect(loadTxCategoryFilter({ getItem: () => null })).toBe('');
  });

  it('round-trips a category name', () => {
    const store: Record<string, string> = {};
    persistTxCategoryFilter('Food & Dining', {
      setItem: (key, value) => {
        store[key] = value;
      },
    });
    expect(store[TX_CATEGORY_FILTER_KEY]).toBe('Food & Dining');
    expect(loadTxCategoryFilter({ getItem: (key) => store[key] ?? null })).toBe('Food & Dining');
  });
});
