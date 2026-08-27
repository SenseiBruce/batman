import { describe, expect, it } from 'vitest';
import { ABOUT_TAGLINE, formatAboutTagline } from './aboutTaglineCopy';

describe('formatAboutTagline', () => {
  it('returns the About privacy tagline', () => {
    expect(formatAboutTagline()).toBe(
      'Privacy-focused, local-first expense tracking powered by Gemini.',
    );
    expect(formatAboutTagline(ABOUT_TAGLINE)).toBe(ABOUT_TAGLINE);
  });
});
