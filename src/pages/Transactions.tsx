import React, { useState, useMemo, useRef } from 'react';
import { Transaction, Category } from '../types';
import { fetchAllSmsTransactions } from '../services/smsService';
import { parseStatement } from '../services/statementService';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onAdd: (t: Transaction) => void;
  onBulkAdd: (txs: Transaction[]) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onDelete, onAdd, onBulkAdd }) => {
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [merchantSearch, setMerchantSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus('Reading SMS...');
    try {
      const newTxs = await fetchAllSmsTransactions();
      if (newTxs.length > 0) {
        onBulkAdd(newTxs);
        setSyncStatus(`Added ${newTxs.length} new transactions!`);
      } else {
        setSyncStatus('No new transactions found.');
      }
    } catch (error) {
      console.error(error);
      setSyncStatus('Failed to sync SMS. Check permissions.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 3000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncStatus('Parsing Statement...');
    try {
      const newTxs = await parseStatement(file);
      if (newTxs.length > 0) {
        onBulkAdd(newTxs);
        setSyncStatus(`Imported ${newTxs.length} transactions!`);
      } else {
        setSyncStatus('No transactions found in file.');
      }
    } catch (error) {
      console.error(error);
      setSyncStatus('Failed to parse file.');
      alert('Error parsing file. Please ensure it is a valid HDFC Statement XLS.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(''), 3000);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  const changeMonth = (delta: number) => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + delta);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const formatMonth = (isoMonth: string) => {
    const date = new Date(isoMonth + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filter === 'all' || t.type === filter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesMerchant = t.merchant.toLowerCase().includes(merchantSearch.toLowerCase());

      // Month Filter
      const tDate = new Date(t.date);
      const tMonth = tDate.toISOString().slice(0, 7);
      const matchesMonth = tMonth === selectedMonth;

      return matchesType && matchesCategory && matchesMerchant && matchesMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filter, categoryFilter, merchantSearch, selectedMonth]);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'credit')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);

  // Calculate Budget Summary for the selected month
  const totalBudget = categories.reduce((acc, c) => acc + c.budget, 0);
  // Total spent for the WHOLE month (regardless of filters) to show accurate budget status
  const monthlyTotalSpent = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.toISOString().slice(0, 7) === selectedMonth && t.type === 'debit';
    })
    .reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">History</h1>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xls,.xlsx"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSyncing}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isSyncing ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            )}
            Upload
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync SMS'}
          </button>
        </div>
      </header>

      {/* Budget Summary Card */}
      <div className="bg-gray-800 p-4 rounded-xl mb-6 border border-gray-700 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
        </div>
        <div className="flex justify-between items-end mb-2 relative z-10">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Spent ({formatMonth(selectedMonth)})</p>
            <p className="text-2xl font-bold text-white mt-1">₹{monthlyTotalSpent.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Budget Left</p>
            <p className={`text-lg font-semibold ${(totalBudget - monthlyTotalSpent) < 0 ? 'text-red-400' : 'text-green-400'}`}>
              ₹{(totalBudget - monthlyTotalSpent).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${monthlyTotalSpent > totalBudget ? 'bg-red-500' : monthlyTotalSpent > totalBudget * 0.9 ? 'bg-orange-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.min((monthlyTotalSpent / totalBudget) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg mb-4 border border-gray-700">
        <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="font-medium text-white">{formatMonth(selectedMonth)}</span>
        <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* Filters Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>

        {showFilters && (
          <div className="mt-3 p-3 bg-gray-800 rounded-xl border border-gray-700 space-y-3 animate-in fade-in slide-in-from-top-2">
            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search merchant..."
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {/* Type Filter */}
              <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                {(['all', 'debit', 'credit'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${filter === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-300'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Sync Status Message */}
      {syncStatus && (
        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${syncStatus.includes('Error') || syncStatus.includes('Failed') ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-blue-900/50 text-blue-200 border border-blue-800'}`}>
          {syncStatus.includes('Error') || syncStatus.includes('Failed') ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          )}
          {syncStatus}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Income</p>
          <p className="text-green-400 text-lg font-bold">+₹{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Expense</p>
          <p className="text-red-400 text-lg font-bold">-₹{totalExpense.toLocaleString()}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((t) => {
            const category = categories.find(c => c.name === t.category);
            return (
              <div key={t.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-700" style={{ color: category?.color }}>
                    {category?.icon || '💸'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{t.merchant}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{t.category}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${t.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                    {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="text-gray-600 hover:text-red-400 text-xs mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <p className="text-gray-400">No transactions found for this month.</p>
            <p className="text-gray-600 text-sm mt-1">Try syncing SMS or adding one manually.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;