import { describe, expect, it } from 'vitest';
import { parseSms, generateId } from './parser';

describe('parseSms', () => {
  it('extracts a debit amount', () => {
    const parsed = parseSms('Rs. 450 spent at Swiggy on 15-08-2026');
    expect(parsed).not.toBeNull();
    expect(parsed!.amount).toBe(450);
    expect(parsed!.type).toBe('debit');
  });

  it('returns null when no amount is present', () => {
    expect(parseSms('hello from the bank')).toBeNull();
  });

  it('generateId returns a short string', () => {
    expect(generateId().length).toBeGreaterThan(3);
  });
});
