import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Category } from '../types';
import { fetchAllSmsTransactions } from '../services/smsService';
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
import { Capacitor } from '@capacitor/core';
import { SecureStorageService } from '../services/secureStorageService';
import { TimeCostDisplay } from '../components/TimeCostDisplay';
import { useCurrency } from '../contexts/CurrencyContext';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onAdd: (t: Transaction) => void;
  onBulkAdd: (txs: Transaction[]) => void;
  onUpdate?: (tx: Transaction) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onDelete, onAdd, onBulkAdd, onUpdate }) => {
  const { formatAmount } = useCurrency();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hourlyWage, setHourlyWage] = useState(0);

  // Category editing state
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);

  useEffect(() => {
    SecureStorageService.get<string>('hourly_wage').then(wage => {
      if (wage) setHourlyWage(parseFloat(wage));
    });
  }, []);

  const [filters, setFilters] = useState<FilterState>({
    category: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: ''
  });

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [deletedTransaction, setDeletedTransaction] = useState<Transaction | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Reading SMS...');
    try {
      const newTxs = await fetchAllSmsTransactions();
      if (newTxs.length > 0) {
        onBulkAdd(newTxs);
        setSyncStatus(`Synced ${newTxs.length} new transactions`);
        setToastMessage(`Synced ${newTxs.length} new transactions`);
        setToastType('success');
        setToastVisible(true);
        HapticService.success();
      } else {
        setSyncStatus('No new transactions found');
        HapticService.light();
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      if (error.message?.includes('permission')) {
        alert("SMS Access Required: Please enable SMS permissions in your Phone Settings -> Apps -> Batman -> Permissions.");
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
        onBulkAdd(newTxs);
        setSyncStatus(`Imported ${newTxs.length} transactions`);
        setToastMessage(`Imported ${newTxs.length} transactions`);
        setToastType('success');
        setToastVisible(true);
        HapticService.success();
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

  const handleExport = async () => {
    const success = await exportToCSV(transactions);
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
    await handleSync();
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
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex flex-col items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 text-xs"
          >
            {isSyncing ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
            <span>Sync SMS</span>
          </button>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSyncing}
          className="flex flex-col items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white py-3 rounded-xl font-medium transition-all border border-gray-700 shadow-lg text-xs"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Import</span>
        </button>
        <button
          onClick={handleExport}
          className="flex flex-col items-center justify-center gap-1 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white py-3 rounded-xl font-medium transition-all border border-gray-700 shadow-lg text-xs"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span>Export</span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv,.txt"
          className="hidden"
        />
      </div>

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