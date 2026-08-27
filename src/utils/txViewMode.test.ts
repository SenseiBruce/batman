import { afterEach, describe, expect, it } from 'vitest';
import {
  loadTxViewMode,
  parseTxViewMode,
  persistTxViewMode,
  TX_VIEW_MODE_KEY,
} from './txViewMode';

describe('txViewMode', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('parses list and calendar only', () => {
    expect(parseTxViewMode('list')).toBe('list');
    expect(parseTxViewMode('calendar')).toBe('calendar');
    expect(parseTxViewMode('grid')).toBeNull();
  });

  it('loads and persists', () => {
    expect(loadTxViewMode()).toBe('list');
    persistTxViewMode('calendar');
    expect(localStorage.getItem(TX_VIEW_MODE_KEY)).toBe('calendar');
    expect(loadTxViewMode()).toBe('calendar');
  });
});
