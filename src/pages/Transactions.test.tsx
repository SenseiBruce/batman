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
});
