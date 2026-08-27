import { describe, expect, it } from 'vitest';
import { APP_VERSION, formatAppVersion } from './appVersionCopy';

describe('formatAppVersion', () => {
  it('labels the shipped version', () => {
    expect(formatAppVersion()).toBe('Jarvis Expense Tracker v1.0');
    expect(formatAppVersion(APP_VERSION)).toBe('Jarvis Expense Tracker v1.0');
  });
});
