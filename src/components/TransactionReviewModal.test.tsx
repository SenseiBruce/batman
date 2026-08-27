import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionReviewModal } from './TransactionReviewModal';
import { Category, Transaction } from '../types';

vi.mock('../services/hapticService', () => ({
  HapticService: {
    success: vi.fn(),
    selectionChanged: vi.fn(),
    light: vi.fn(),
    error: vi.fn(),
    medium: vi.fn(),
  },
}));

const categories: Category[] = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', budget: 5000, color: '#fff' },
  { id: 'shop', name: 'Shopping', icon: '🛍️', budget: 3000, color: '#fff' },
];

const pending: Transaction = {
  id: 'sms-1',
  amount: 450,
  type: 'debit',
  category: 'Food & Dining',
  merchant: 'Swiggy',
  date: '2026-08-15T10:00:00.000Z',
  isManual: false,
  isPending: true,
};

describe('TransactionReviewModal', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('approves a pending transaction', () => {
    const onApprove = vi.fn();
    render(
      <TransactionReviewModal
        isOpen
        onClose={vi.fn()}
        pendingTransactions={[pending]}
        categories={categories}
        onApprove={onApprove}
        onApproveAll={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
    expect(onApprove).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'sms-1', isPending: false, category: 'Food & Dining' })
    );
  });

  it('skips a pending transaction without approving it', () => {
    const onApprove = vi.fn();
    const onDiscard = vi.fn();
    render(
      <TransactionReviewModal
        isOpen
        onClose={vi.fn()}
        pendingTransactions={[pending]}
        categories={categories}
        onApprove={onApprove}
        onApproveAll={vi.fn()}
        onDiscard={onDiscard}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Skip transaction' }));
    expect(onDiscard).toHaveBeenCalledWith(pending);
    expect(onApprove).not.toHaveBeenCalled();
  });
});
