import { describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

import { queryJarvis } from './geminiService';

describe('queryJarvis', () => {
  it('throws when the API key is missing', async () => {
    await expect(queryJarvis('hi', [], '')).rejects.toThrow('API Key is missing');
  });

  it('returns model text for a spending question', async () => {
    generateContent.mockResolvedValue({ text: 'You spent ₹500 on food.' });
    const result = await queryJarvis('How much on food?', [], 'test-key');
    expect(result).toBe('You spent ₹500 on food.');
  });

  it('returns a fallback string when the client fails', async () => {
    generateContent.mockRejectedValue(new Error('offline'));
    const result = await queryJarvis('How much on food?', [], 'test-key');
    expect(result).toMatch(/trouble connecting/i);
  });
});
