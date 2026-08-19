import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { JarvisProvider, useJarvis } from './JarvisContext';
import { Transaction } from '../types';

vi.mock('../services/geminiService', () => ({
  queryJarvis: vi.fn(),
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn(),
}));

vi.mock('../services/secureStorageService', () => ({
  SecureStorageService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../services/hapticService', () => ({
  HapticService: {
    success: vi.fn(),
    medium: vi.fn(),
    error: vi.fn(),
  },
}));

import { queryJarvis } from '../services/geminiService';

function Probe() {
  const { conversations, isProcessing, sendMessage, currentConversationId } = useJarvis();
  return (
    <div>
      <p data-testid="conv-count">{conversations.length}</p>
      <p data-testid="processing">{String(isProcessing)}</p>
      <p data-testid="last">{conversations[0]?.messages.at(-1)?.text ?? ''}</p>
      <button
        type="button"
        onClick={() =>
          sendMessage('How much did I spend on food?', [] as Transaction[], 'test-key')
        }
      >
        Send
      </button>
      <span data-testid="cid">{currentConversationId}</span>
    </div>
  );
}

describe('JarvisContext', () => {
  beforeEach(() => {
    vi.mocked(queryJarvis).mockReset();
  });

  it('creates a starter conversation on mount', async () => {
    render(
      <JarvisProvider>
        <Probe />
      </JarvisProvider>
    );
    await waitFor(() => expect(screen.getByTestId('conv-count').textContent).toBe('1'));
    expect(screen.getByTestId('last').textContent).toMatch(/Hello! I'm Jarvis/);
  });

  it('appends the mocked Gemini reply after sendMessage', async () => {
    vi.mocked(queryJarvis).mockResolvedValue('You spent ₹800 on Food & Dining.');
    render(
      <JarvisProvider>
        <Probe />
      </JarvisProvider>
    );
    await waitFor(() => expect(screen.getByTestId('cid').textContent).toBeTruthy());
    await act(async () => {
      screen.getByText('Send').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('last').textContent).toBe('You spent ₹800 on Food & Dining.')
    );
    expect(queryJarvis).toHaveBeenCalled();
  });

  it('throws outside of the provider', () => {
    function Broken() {
      useJarvis();
      return null;
    }
    expect(() => render(<Broken />)).toThrow('useJarvis must be used within a JarvisProvider');
  });
});
