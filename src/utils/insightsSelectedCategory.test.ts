import { afterEach, describe, expect, it } from 'vitest';
import {
  INSIGHTS_SELECTED_CATEGORY_KEY,
  loadInsightsSelectedCategory,
  persistInsightsSelectedCategory,
} from './insightsSelectedCategory';

describe('insightsSelectedCategory', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('loads null when nothing is stored', () => {
    expect(loadInsightsSelectedCategory()).toBeNull();
  });

  it('round-trips a category name', () => {
    persistInsightsSelectedCategory('Food & Dining');
    expect(localStorage.getItem(INSIGHTS_SELECTED_CATEGORY_KEY)).toBe('Food & Dining');
    expect(loadInsightsSelectedCategory()).toBe('Food & Dining');
  });

  it('treats empty persist as no filter', () => {
    persistInsightsSelectedCategory(null);
    expect(localStorage.getItem(INSIGHTS_SELECTED_CATEGORY_KEY)).toBe('');
    expect(loadInsightsSelectedCategory()).toBeNull();
  });
});
