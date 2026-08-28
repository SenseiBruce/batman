import { describe, expect, it } from 'vitest';
import { WishlistItem } from '../types';
import { formatWishlistSummary } from './wishlistSummary';

const rupees = (n: number) => `₹${n}`;

const item = (overrides: Partial<WishlistItem>): WishlistItem => ({
  id: 'w1',
  name: 'Headphones',
  amount: 5000,
  dateAdded: '2026-08-01T00:00:00.000Z',
  cooldownHours: 72,
  status: 'locked',
  ...overrides,
});

describe('formatWishlistSummary', () => {
  it('reports an empty active list', () => {
    expect(formatWishlistSummary([item({ status: 'purchased' })], rupees)).toBe(
      'Wishlist: none active',
    );
  });

  it('lists active items with status', () => {
    const text = formatWishlistSummary(
      [
        item({ id: 'a', name: 'Headphones', amount: 5000, status: 'locked' }),
        item({ id: 'b', name: 'Book', amount: 400, status: 'unlocked' }),
        item({ id: 'c', name: 'Old', amount: 1, status: 'abandoned' }),
      ],
      rupees,
    );
    expect(text).toContain('Wishlist: 2 active (1 locked)');
    expect(text).toContain('Headphones: ₹5000 (locked)');
    expect(text).toContain('Book: ₹400 (unlocked)');
    expect(text).not.toContain('Old');
  });
});
