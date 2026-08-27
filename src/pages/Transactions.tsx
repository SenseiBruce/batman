import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { fetchAllSmsTransactions, checkSmsPermissionsOnly } from '../services/smsService';
import { parseStatement } from '../services/statementService';
import SearchFilter, { FilterState } from '../components/SearchFilter';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Toast } from '../components/Toast';
import { NoTransactionsEmpty, NoSearchResultsEmpty } from '../components/EmptyState';
import { SwipeableItem } from '../components/SwipeableItem';
import { PullToRefresh } from '../components/PullToRefresh';
import { HapticService } from '../services/hapticService';
import { CalendarView } from '../components/CalendarView';
import { exportToCSV } from '../utils/export';
import { BulkAddResult, coalesceBulkAddResult } from '../utils/transactionDedup';
import { Capacitor } from '@capacitor/core';
import { SecureStorageService } from '../services/secureStorageService';
import { TimeCostDisplay } from '../components/TimeCostDisplay';
import { useCurrency } from '../contexts/CurrencyContext';
import { loadTxSelectedMonth, persistTxSelectedMonth } from '../utils/txSelectedMonth';
import { loadTxViewMode, persistTxViewMode } from '../utils/txViewMode';
import { loadTxDateRange, saveTxDateRange } from '../utils/transactionDateRangeStorage';
import { loadTxAmountRange, saveTxAmountRange } from '../utils/transactionAmountRangeStorage';
import { formatVisibleTxCount } from '../utils/visibleTxCount';
import { formatFilteredSpend } from '../utils/filteredSpend';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onAdd: (t: Transaction) => void;
  onBulkAdd: (txs: Transaction[]) => BulkAddResult | void;
  onUpdate?: (tx: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onDelete, onAdd, onBulkAdd, onUpdate }) => {
  const { formatAmount } = useCurrency();
  const [isSyncing, setIsSyncing] = useState(false);
  const [, setSyncStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(loadTxSelectedMonth);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(loadTxViewMode);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hourlyWage, setHourlyWage] = useState(0);

  // Category editing state
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [showSmsDisclosure, setShowSmsDisclosure] = useState(false);

  useEffect(() => {
    persistTxSelectedMonth(selectedMonth);
  }, [selectedMonth]);
    persistTxViewMode(viewMode);
  }, [viewMode]);

  useEffect(() => {
    SecureStorageService.get<string>('hourly_wage').then(wage => {
      if (wage) setHourlyWage(parseFloat(wage));
    });
  }, []);

  const [filters, setFilters] = useState<FilterState>(() => {
    const range = loadTxDateRange();
    return {
      category: '',
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      amountMin: '',
      amountMax: '',
    const range = loadTxAmountRange();
    return {
      category: '',
      dateFrom: '',
      dateTo: '',
      amountMin: range.amountMin,
      amountMax: range.amountMax,
    };
  });

  useEffect(() => {
    saveTxDateRange({ dateFrom: filters.dateFrom, dateTo: filters.dateTo });
  }, [filters.dateFrom, filters.dateTo]);
    saveTxAmountRange({ amountMin: filters.amountMin, amountMax: filters.amountMax });
  }, [filters.amountMin, filters.amountMax]);

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [deletedTransaction, setDeletedTransaction] = useState<Transaction | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncClick = async () => {
    // Check if permission already granted
    const granted = await checkSmsPermissionsOnly();
    if (granted) {
      executeSync();
    } else {
      setShowSmsDisclosure(true);
    }
  };

  const executeSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Reading SMS...');
    try {
      const newTxs = await fetchAllSmsTransactions();
      if (newTxs.length > 0) {
        const result = coalesceBulkAddResult(onBulkAdd(newTxs), newTxs.length);
        if (result.added === 0) {
          const skippedNote = result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : '';
          setSyncStatus('No new transactions found');
          setToastMessage(`No new transactions found${skippedNote}`);
          setToastType('info');
          setToastVisible(true);
          HapticService.light();
        } else {
          const skippedNote = result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : '';
          setSyncStatus(`Synced ${result.added} new transactions`);
          setToastMessage(`Synced ${result.added} new transactions${skippedNote}`);
          setToastType('success');
          setToastVisible(true);
          HapticService.success();
        }
      } else {
        setSyncStatus('No new transactions found');
        HapticService.light();
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      if (error.message?.includes('permission')) {
        alert("SMS Access Required: Please enable SMS permissions in your Phone Settings -> Apps -> Jarvis Expense Tracker -> Permissions.");
      }
      setSyncStatus('Sync failed');
      setToastMessage('Sync failed. Check permissions.');
      setToastType('error');
      setToastVisible(true);
      HapticService.error();
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus('');
      }, 2000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncStatus('Parsing file...');

    try {
      const newTxs = await parseStatement(file);

      if (newTxs.length > 0) {
        const result = coalesceBulkAddResult(onBulkAdd(newTxs), newTxs.length);
        if (result.added === 0) {
          const skippedNote = result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : '';
          setSyncStatus('No transactions found in file');
          setToastMessage(`No new transactions found${skippedNote}`);
          setToastType('info');
          setToastVisible(true);
          HapticService.light();
        } else {
          const skippedNote = result.skipped > 0 ? ` (${result.skipped} duplicates skipped)` : '';
          setSyncStatus(`Imported ${result.added} transactions`);
          setToastMessage(`Imported ${result.added} transactions${skippedNote}`);
          setToastType('success');
          setToastVisible(true);
          HapticService.success();
        }
      } else {
        setSyncStatus('No transactions found in file');
        HapticService.light();
      }
    } catch (error) {
      console.error('File parse failed:', error);
      setSyncStatus('Failed to parse file');
      setToastMessage('Failed to parse file.');
      setToastType('error');
      setToastVisible(true);
      HapticService.error();
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    }
  };

  const handleCategoryChange = (transactionId: string, newCategory: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction && onUpdate) {
      const updatedTransaction = { ...transaction, category: newCategory };
      onUpdate(updatedTransaction);
      setEditingTransaction(null);
      setToastMessage('Category updated');
      setToastType('success');
      setToastVisible(true);
      HapticService.success();
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Exclude pending transactions (they are in the review queue)
      if (t.isPending) return false;

      // Month filter - handle both ISO strings and date-only formats
      const txDate = new Date(t.date);
      const txMonth = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, '0')}`;
      if (txMonth !== selectedMonth) return false;

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          t.merchant.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.amount.toString().includes(query);
        if (!matchesSearch) return false;
      }

      // Advanced filters
      if (filters.category && t.category !== filters.category) return false;
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;
      if (filters.amountMin && t.amount < parseFloat(filters.amountMin)) return false;
      if (filters.amountMax && t.amount > parseFloat(filters.amountMax)) return false;

      // Calendar Date Filter
      if (viewMode === 'calendar' && selectedDate) {
        if (!t.date.startsWith(selectedDate)) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, searchQuery, filters, viewMode, selectedDate]);

  // Group transactions by date for list view
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    filteredTransactions.forEach(t => {
      const date = t.date.split('T')[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const handleExport = async () => {
    const success = await exportToCSV(filteredTransactions);
    if (success) {
      setToastMessage('Export successful');
      setToastType('success');
      setToastVisible(true);
      HapticService.success();
    } else {
      setToastMessage('Export failed');
      setToastType('error');
      setToastVisible(true);
      HapticService.error();
    }
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteConfirmOpen(true);
    HapticService.medium();
  };

  const confirmDelete = () => {
    if (transactionToDelete) {
      const tx = transactions.find(t => t.id === transactionToDelete);
      setDeletedTransaction(tx || null);
      onDelete(transactionToDelete);
      setDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      setToastMessage('Transaction deleted');
      setToastType('success');
      setToastVisible(true);
      HapticService.heavy();
    }
  };

  const handleUndoDelete = () => {
    if (deletedTransaction) {
      onAdd(deletedTransaction);
      setDeletedTransaction(null);
      setToastVisible(false);
      HapticService.success();
    }
  };

  const handleRefresh = async () => {
    await handleSyncClick();
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => {
              setViewMode('list');
              HapticService.light();
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'}`}
          >
            List
          </button>
          <button
            onClick={() => {
              setViewMode('calendar');
              HapticService.light();
            }}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'}`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700 mb-4">
        <button
          onClick={() => {
            const date = new Date(selectedMonth + '-01');
            date.setMonth(date.getMonth() - 1);
            setSelectedMonth(date.toISOString().slice(0, 7));
            HapticService.selectionChanged();
          }}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-medium text-white">
          {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(formatVisibleTxCount(filteredTransactions.length));
              setToastMessage('Copied visible transaction count');
            const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            });
            try {
              await navigator.clipboard.writeText(
                formatFilteredSpend(filteredTransactions, monthLabel, formatAmount),
              );
              setToastMessage('Copied filtered spend');
              setToastType('success');
              setToastVisible(true);
            } catch {
              setToastMessage('Copy failed');
              setToastType('error');
              setToastVisible(true);
            }
          }}
          className="text-xs text-blue-400 hover:text-blue-300 px-2"
          aria-label="Copy visible transaction count"
        >
          Copy count
          aria-label="Copy filtered spend"
        >
          Copy spend
        </button>
        <button
          onClick={() => {
            const date = new Date(selectedMonth + '-01');
            date.setMonth(date.getMonth() + 1);
            setSelectedMonth(date.toISOString().slice(0, 7));
            HapticService.selectionChanged();
          }}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {viewMode === 'calendar' && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-4">
          <CalendarView
            transactions={transactions}
            selectedMonth={selectedMonth}
            onSelectDate={setSelectedDate}
          />
          {selectedDate && (
            <div className="mt-4 flex justify-between items-center">
              <h3 className="text-white font-medium">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-xs text-blue-400"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {Capacitor.getPlatform() !== 'ios' && (
          <button onClick={handleSyncClick} disabled={isSyncing} className="flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium text-xs disabled:opacity-50">
            <span>{isSyncing ? 'Syncing…' : 'Sync SMS'}</span>
          </button>
        )}
        <button onClick={() => fileInputRef.current?.click()} disabled={isSyncing} className="flex flex-col items-center justify-center gap-1 bg-gray-800 text-white py-3 rounded-xl font-medium border border-gray-700 text-xs">
          <span>Import</span>
        </button>
        <button onClick={handleExport} className="flex flex-col items-center justify-center gap-1 bg-gray-800 text-white py-3 rounded-xl font-medium border border-gray-700 text-xs">
          <span>Export</span>
        </button>
      </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv,.txt"
          className="hidden"
        />

      <SearchFilter
        onSearchChange={setSearchQuery}
        onFilterChange={setFilters}
        categories={categories}
        currentFilters={filters}
      />

      <div className="mt-6">
        <PullToRefresh onRefresh={handleRefresh}>
          {filteredTransactions.length === 0 ? (
            searchQuery || filters.category || filters.dateFrom || filters.amountMin ? (
              <NoSearchResultsEmpty onClear={() => {
                setSearchQuery('');
                setFilters({ category: '', dateFrom: '', dateTo: '', amountMin: '', amountMax: '' });
                setSelectedDate(null);
              }} />
            ) : (
              <NoTransactionsEmpty />
            )
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([date, txs]) => (
                <div key={date}>
                  <h3 className="text-gray-400 text-sm font-medium mb-3 sticky top-0 bg-gray-900/95 backdrop-blur py-2 z-10">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <div className="space-y-3">
                    {txs.map(tx => (
                      <SwipeableItem
                        key={tx.id}
                        onDelete={() => handleDeleteClick(tx.id)}
                        threshold={80}
                      >
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                                {categories.find(c => c.name === tx.category)?.icon || '💰'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{tx.merchant}</h4>
                                {editingTransaction === tx.id ? (
                                  <select
                                    value={tx.category}
                                    onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                                    onBlur={() => setEditingTransaction(null)}
                                    autoFocus
                                    className="text-sm bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {categories.map(cat => (
                                      <option key={cat.id} value={cat.name}>
                                        {cat.icon} {cat.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setEditingTransaction(tx.id);
                                      HapticService.light();
                                    }}
                                    className="text-sm text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1"
                                  >
                                    {tx.category}
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                                {tx.type === 'credit' ? '+' : '-'}{formatAmount(tx.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(tx.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              {hourlyWage > 0 && tx.type === 'debit' && (
                                <TimeCostDisplay amount={tx.amount} hourlyWage={hourlyWage} className="mt-1 justify-end" />
                              )}
                            </div>
                          </div>
                        </div>
                      </SwipeableItem>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </PullToRefresh>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Prominent Disclosure for SMS Permissions */}
      <ConfirmDialog
        isOpen={showSmsDisclosure}
        title="Enable Automatic Expense Tracking?"
        message="Jarvis Expense Tracker needs access to your SMS messages to automatically detect and categorize transaction alerts from your bank. 
        
        This data is processed securely on your device and is never shared with third parties.
        
        Click 'Continue' to grant permission."
        onConfirm={() => {
          setShowSmsDisclosure(false);
          executeSync();
        }}
        onCancel={() => setShowSmsDisclosure(false)}
        confirmText="Continue"
      />

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        actionLabel={deletedTransaction ? 'Undo' : undefined}
        onAction={deletedTransaction ? handleUndoDelete : undefined}
      />
    </div>
  );
};

export default Transactions;