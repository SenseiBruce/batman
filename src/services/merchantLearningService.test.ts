import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MerchantLearningService } from './merchantLearningService';
import { SecureStorageService } from './secureStorageService';

vi.mock('./secureStorageService', () => ({
  SecureStorageService: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('MerchantLearningService', () => {
  beforeEach(() => {
    vi.mocked(SecureStorageService.get).mockReset();
    vi.mocked(SecureStorageService.set).mockReset();
    vi.mocked(SecureStorageService.remove).mockReset();
    vi.mocked(SecureStorageService.get).mockResolvedValue([]);
    vi.mocked(SecureStorageService.set).mockResolvedValue(undefined);
  });

  it('stores a new merchant-to-category mapping', async () => {
    await MerchantLearningService.learnMapping('Swiggy', 'Food & Dining');

    expect(SecureStorageService.set).toHaveBeenCalledWith('merchant_learnings', [
      expect.objectContaining({
        merchantName: 'Swiggy',
        category: 'Food & Dining',
        usageCount: 1,
      }),
    ]);
  });

  it('updates an existing mapping case-insensitively and bumps usage', async () => {
    vi.mocked(SecureStorageService.get).mockResolvedValue([
      {
        merchantName: 'swiggy',
        category: 'Shopping',
        learnedAt: '2026-01-01T00:00:00.000Z',
        usageCount: 2,
      },
    ]);

    await MerchantLearningService.learnMapping('Swiggy', 'Food & Dining');

    const saved = vi.mocked(SecureStorageService.set).mock.calls[0][1] as Array<{
      category: string;
      usageCount: number;
    }>;
    expect(saved).toHaveLength(1);
    expect(saved[0].category).toBe('Food & Dining');
    expect(saved[0].usageCount).toBe(3);
  });

  it('returns a learned category by exact then partial match', async () => {
    vi.mocked(SecureStorageService.get).mockResolvedValue([
      {
        merchantName: 'Swiggy',
        category: 'Food & Dining',
        learnedAt: '2026-01-01T00:00:00.000Z',
        usageCount: 1,
      },
    ]);

    expect(await MerchantLearningService.getLearnedCategory('swiggy')).toBe('Food & Dining');
    expect(await MerchantLearningService.getLearnedCategory('Swiggy Bangalore')).toBe(
      'Food & Dining'
    );
    expect(await MerchantLearningService.getLearnedCategory('Zomato')).toBeNull();
  });
});
