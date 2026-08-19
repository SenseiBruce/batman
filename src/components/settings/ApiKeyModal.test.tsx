import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiKeyModal } from './ApiKeyModal';

vi.mock('../../services/secureStorageService', () => ({
  SecureStorageService: {
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn(),
  },
}));

import { SecureStorageService } from '../../services/secureStorageService';

describe('ApiKeyModal', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('does not render when closed', () => {
    render(<ApiKeyModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Gemini API Key')).toBeNull();
  });

  it('saves a trimmed key to secure storage', async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<ApiKeyModal isOpen initialKey="" onClose={onClose} onSaved={onSaved} />);
    fireEvent.change(screen.getByLabelText('Gemini API Key'), { target: { value: 'AIza-test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => {
      expect(SecureStorageService.set).toHaveBeenCalledWith('gemini_api_key', 'AIza-test');
    });
    expect(onSaved).toHaveBeenCalledWith('AIza-test');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose from Cancel', () => {
    const onClose = vi.fn();
    render(<ApiKeyModal isOpen onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
