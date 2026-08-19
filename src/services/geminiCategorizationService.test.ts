import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent }),
  })),
}));

import { GeminiCategorizationService } from './geminiCategorizationService';

const categories = ['Food & Dining', 'Transport', 'Shopping', 'Other'];

describe('GeminiCategorizationService', () => {
  let service: GeminiCategorizationService;

  beforeEach(() => {
    generateContent.mockReset();
    service = new GeminiCategorizationService('test-key');
  });

  it('returns the model category when it matches a known merchant mapping', async () => {
    generateContent.mockResolvedValue({
      response: { text: () => 'Food & Dining' },
    });
    const result = await service.categorizeTransaction({
      merchant: 'Swiggy',
      amount: 420,
      smsBody: 'Rs. 420 spent at Swiggy',
      availableCategories: categories,
    });
    expect(result).toBe('Food & Dining');
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('falls back to Other when the model invents a category', async () => {
    generateContent.mockResolvedValue({
      response: { text: () => '  Mystery Box  ' },
    });
    const result = await service.categorizeTransaction({
      merchant: 'Unknown Mart',
      amount: 50,
      smsBody: 'Rs. 50 spent at Unknown Mart',
      availableCategories: categories,
    });
    expect(result).toBe('Other');
  });

  it('returns null when the Gemini client throws', async () => {
    generateContent.mockRejectedValue(new Error('network'));
    const result = await service.categorizeTransaction({
      merchant: 'Uber',
      amount: 180,
      smsBody: 'Rs. 180 spent at Uber',
      availableCategories: categories,
    });
    expect(result).toBeNull();
  });

  it('parses a batch JSON map of merchant categories', async () => {
    generateContent.mockResolvedValue({
      response: {
        text: () => '```json\n{"t1":"Transport","t2":"Food & Dining"}\n```',
      },
    });
    const result = await service.categorizeBatch(
      [
        { id: 't1', merchant: 'Uber', amount: 200, smsBody: 'Rs. 200 spent at Uber' },
        { id: 't2', merchant: 'Zomato', amount: 350, smsBody: 'Rs. 350 spent at Zomato' },
      ],
      categories
    );
    expect(result).toEqual({ t1: 'Transport', t2: 'Food & Dining' });
  });

  it('returns an empty map when batch parsing fails', async () => {
    generateContent.mockResolvedValue({
      response: { text: () => 'not-json' },
    });
    const result = await service.categorizeBatch(
      [{ id: 't1', merchant: 'Uber', amount: 200, smsBody: 'spent' }],
      categories
    );
    expect(result).toEqual({});
  });
});
