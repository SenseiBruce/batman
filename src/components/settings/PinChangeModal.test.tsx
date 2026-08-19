import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PinChangeModal } from './PinChangeModal';

vi.mock('../../services/authService', () => ({
  AuthService: {
    changePin: vi.fn(),
  },
}));

import { AuthService } from '../../services/authService';

describe('PinChangeModal', () => {
  beforeEach(() => {
    vi.mocked(AuthService.changePin).mockReset();
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  it('rejects PINs shorter than 4 digits', async () => {
    render(<PinChangeModal isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('New PIN'), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText('Confirm New PIN'), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change PIN' }));
    expect(await screen.findByText('PIN must be at least 4 digits')).toBeTruthy();
    expect(AuthService.changePin).not.toHaveBeenCalled();
  });

  it('rejects mismatched PINs', async () => {
    render(<PinChangeModal isOpen onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('New PIN'), { target: { value: '1234' } });
    fireEvent.change(screen.getByLabelText('Confirm New PIN'), { target: { value: '9999' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change PIN' }));
    expect(await screen.findByText('New PINs do not match')).toBeTruthy();
  });

  it('closes after a successful PIN change', async () => {
    vi.mocked(AuthService.changePin).mockResolvedValue(true);
    const onClose = vi.fn();
    render(<PinChangeModal isOpen onClose={onClose} />);
    fireEvent.change(screen.getByLabelText('Current PIN'), { target: { value: '1111' } });
    fireEvent.change(screen.getByLabelText('New PIN'), { target: { value: '2222' } });
    fireEvent.change(screen.getByLabelText('Confirm New PIN'), { target: { value: '2222' } });
    fireEvent.click(screen.getByRole('button', { name: 'Change PIN' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(AuthService.changePin).toHaveBeenCalledWith('1111', '2222');
  });
});
