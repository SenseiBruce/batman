import { WishlistItem } from '../types';

export function formatWishlistSummary(
  items: WishlistItem[],
  formatAmount: (n: number) => string,
): string {
  const active = items.filter((i) => i.status !== 'purchased' && i.status !== 'abandoned');
  if (active.length === 0) {
    return 'Wishlist: none active';
  }

  const locked = active.filter((i) => i.status === 'locked').length;
  const lines = [
    `Wishlist: ${active.length} active (${locked} locked)`,
    ...active.map((item) => `- ${item.name}: ${formatAmount(item.amount)} (${item.status})`),
  ];
  return lines.join('\n');
}
