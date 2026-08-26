import { describe, expect, it } from 'vitest';
import { formatDefaultCooldown } from './defaultCooldownCopy';

describe('formatDefaultCooldown', () => {
  it('labels a configured cooldown', () => {
    expect(formatDefaultCooldown(' 72 ')).toBe('Default cooldown: 72 hours');
  });

  it('labels missing or invalid values', () => {
    expect(formatDefaultCooldown('')).toBe('Default cooldown: unset');
    expect(formatDefaultCooldown('0')).toBe('Default cooldown: unset');
  });
});
