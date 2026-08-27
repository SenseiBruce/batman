import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Transactions from './Transactions';
import { Category, Transaction } from '../types';

vi.mock('../contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatAmount: (n: number) => `₹${n}`,
    currencySymbol: '₹',
    currencyCode: 'INR',
    setCurrency: vi.fn(),
  }),
}));

vi.mock('../services/smsService', () => ({
  fetchAllSmsTransactions: vi.fn(),
  checkSmsPermissionsOnly: vi.fn(),
}));

vi.mock('../services/statementService', () => ({
  parseStatement: vi.fn(),
}));

vi.mock('../services/secureStorageService', () => ({
  SecureStorageService: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn(),
  },
}));

vi.mock('../utils/export', () => ({
  exportToCSV: vi.fn(),
}));

vi.mock('../services/hapticService', () => ({
  HapticService: {
    success: vi.fn(),
    light: vi.fn(),
    error: vi.fn(),
    medium: vi.fn(),
    heavy: vi.fn(),
    selectionChanged: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'web' },
}));

import { fetchAllSmsTransactions, checkSmsPermissionsOnly } from '../services/smsService';
import { exportToCSV } from '../utils/export';

const categories: Category[] = [
  { id: '1', name: 'Food & Dining', color: '#F87171', icon: '🍔', budget: 5000 },
];

const sampleTx: Transaction = {
  id: 't1',
  amount: 250,
  type: 'debit',
  category: 'Food & Dining',
  merchant: 'Swiggy',
  date: new Date().toISOString(),
  isManual: true,
};

describe('Transactions page', () => {
  const onBulkAdd = vi.fn();

  beforeEach(() => {
    onBulkAdd.mockReset();
    vi.mocked(checkSmsPermissionsOnly).mockResolvedValue(true);
    vi.mocked(fetchAllSmsTransactions).mockResolvedValue([sampleTx]);
    vi.mocked(exportToCSV).mockReset();
    vi.mocked(exportToCSV).mockResolvedValue(true);
  });

  it('shows a success toast after SMS sync', async () => {
    render(
      <Transactions
        transactions={[]}
        categories={categories}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        onBulkAdd={onBulkAdd}
      />
    );
    fireEvent.click(screen.getByText('Sync SMS'));
    expect(await screen.findByText('Synced 1 new transactions')).toBeTruthy();
    expect(onBulkAdd).toHaveBeenCalledWith([sampleTx]);
  });

  it('mentions skipped duplicates after SMS sync', async () => {
    onBulkAdd.mockReturnValue({ added: 1, skipped: 2 });
    render(
      <Transactions
        transactions={[]}
        categories={categories}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        onBulkAdd={onBulkAdd}
      />
    );
    fireEvent.click(screen.getByText('Sync SMS'));
    expect(await screen.findByText('Synced 1 new transactions (2 duplicates skipped)')).toBeTruthy();
  });

  it('shows an error toast when SMS sync fails', async () => {
    vi.mocked(fetchAllSmsTransactions).mockRejectedValue(new Error('permission denied'));
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    render(
      <Transactions
        transactions={[]}
        categories={categories}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        onBulkAdd={onBulkAdd}
      />
    );
    fireEvent.click(screen.getByText('Sync SMS'));
    expect(await screen.findByText('Sync failed. Check permissions.')).toBeTruthy();
  });

  it('shows a success toast after export', async () => {
    render(
      <Transactions
        transactions={[sampleTx]}
        categories={categories}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        onBulkAdd={onBulkAdd}
      />
    );
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => expect(exportToCSV).toHaveBeenCalledWith([sampleTx]));
    expect(await screen.findByText('Export successful')).toBeTruthy();
  });

  it('exports only the currently filtered transactions', async () => {
    const otherTx: Transaction = {
      ...sampleTx,
      id: 't2',
      merchant: 'Uber',
      category: 'Transport',
      amount: 120,
    };
    render(
      <Transactions
        transactions={[sampleTx, otherTx]}
        categories={categories}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        onBulkAdd={onBulkAdd}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search by merchant name...'), {
      target: { value: 'Swiggy' },
    });
    await waitFor(() => {
      expect(screen.queryByText('Uber')).toBeNull();
    });

    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => expect(exportToCSV).toHaveBeenCalledWith([sampleTx]));
  });

  it('copies the visible transaction count and filtered spend', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    render(
      <Transactions
        transactions={[sampleTx]}
        categories={categories}
        onDelete={vi.fn()}
        onAdd={vi.fn()}
        onBulkAdd={onBulkAdd}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy visible transaction count' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('Visible transactions: 1');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Copy filtered spend' }));
    const monthLabel = new Date(`${sampleTx.date.slice(0, 7)}-01`).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        `Filtered spend (${monthLabel}): ₹250 debits · ₹0 credits · 1 transactions`,
      );
    });
  });
});
