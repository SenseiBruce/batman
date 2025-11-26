import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Preferences } from '@capacitor/preferences';
import { SecureStorageService } from './services/secureStorageService';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Jarvis from './pages/Jarvis';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';
import Subscriptions from './pages/Subscriptions';
import { Transaction, Category } from './types';
import { DEFAULT_CATEGORIES, CATEGORY_KEYWORDS } from './constants';
import { fetchAllSmsTransactions } from './services/smsService';


const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load persisted data using Secure Storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Transactions
        const txData = await SecureStorageService.get<Transaction[]>('transactions');
        if (txData) {
          setTransactions(txData);
        }


        // Categories
        const catData = await SecureStorageService.get<any[]>('categories');
        if (catData && catData.length > 0) {
          let loadedCats = catData;

          // Migration: Remove 'spent' field from old data (we now calculate dynamically)
          loadedCats = loadedCats.map(({ spent, ...cat }) => cat);

          // Migration: Ensure 'Investments' exists
          if (!loadedCats.some(c => c.name === 'Investments')) {
            const investmentsCat = DEFAULT_CATEGORIES.find(c => c.name === 'Investments');
            if (investmentsCat) {
              loadedCats = [...loadedCats, investmentsCat];
              // Save immediately
              await SecureStorageService.set('categories', loadedCats);
            }
          }

          setCategories(loadedCats as Category[]);
        } else {
          // No saved categories, use defaults
          setCategories(DEFAULT_CATEGORIES);
          await SecureStorageService.set('categories', DEFAULT_CATEGORIES);
        }

        setIsDataLoaded(true);
      } catch (e) {
        console.error('Failed to load data:', e);
        // On error, use defaults
        setCategories(DEFAULT_CATEGORIES);
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Persist data to Secure Storage on change
  useEffect(() => {
    if (!isDataLoaded) return; // Don't save until initial data is loaded

    const saveData = async () => {
      try {
        await SecureStorageService.set('transactions', transactions);
      } catch (e) {
        console.error('Failed to save transactions:', e);
      }
    };
    saveData();
  }, [transactions, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return; // Don't save until initial data is loaded

    const saveData = async () => {
      try {
        await SecureStorageService.set('categories', categories);
      } catch (e) {
        console.error('Failed to save categories:', e);
      }
    };
    saveData();
  }, [categories, isDataLoaded]);

  // Auto-sync SMS transactions on app startup
  useEffect(() => {
    const autoSync = async () => {
      try {
        console.log('🔄 Auto-syncing SMS on app startup...');
        const newTxs = await fetchAllSmsTransactions();
        if (newTxs.length > 0) {
          // Use addBulkTransactions to prevent duplicates
          setTransactions(prev => {
            const uniqueNewTxs = newTxs.filter(newTx => !prev.some(existing => existing.id === newTx.id));
            if (uniqueNewTxs.length === 0) return prev;

            const updated = [...uniqueNewTxs, ...prev];
            SecureStorageService.set('transactions', updated).catch(e =>
              console.error('Failed to save transactions:', e)
            );
            console.log(`✅ Auto-sync: Added ${uniqueNewTxs.length} new transactions`);
            return updated;
          });
        } else {
          console.log('ℹ️ Auto-sync: No new SMS transactions found');
        }
      } catch (error) {
        console.error('❌ Auto-sync failed:', error);
        // Silently fail - don't interrupt app startup
      }
    };

    // Run auto-sync after a short delay to let the app load first
    const timeoutId = setTimeout(autoSync, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => {
      const updated = [t, ...prev];
      // Save immediately
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transaction:', e)
      );
      return updated;
    });
    // Note: We no longer update category.spent here since it's calculated dynamically per month
  };

  const addBulkTransactions = (newTxs: Transaction[]) => {
    setTransactions(prev => {
      // Filter out transactions that already exist
      const uniqueNewTxs = newTxs.filter(newTx => !prev.some(existing => existing.id === newTx.id));

      if (uniqueNewTxs.length === 0) return prev;

      const updated = [...uniqueNewTxs, ...prev];
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );

      return updated;
    });
    // Note: We no longer update category.spent here since it's calculated dynamically per month
  };

  // This function is no longer needed since we calculate spent dynamically
  // Keeping it as a no-op for now in case it's referenced elsewhere
  const updateCategoriesFromTransactions = (txs: Transaction[]) => {
    // No-op: spent is now calculated dynamically per month
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === updatedTx.id ? updatedTx : t);
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      return updated;
    });
  };

  const clearTransactions = () => {
    setTransactions([]);
    SecureStorageService.remove('transactions').catch(e =>
      console.error('Failed to remove transactions:', e)
    );
    // Note: No need to reset category.spent since it's calculated dynamically
  };

  const addCategory = (name: string, budget: number) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      budget,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
      icon: '💰' // Default icon
    };
    setCategories(prev => {
      const updated = [...prev, newCategory];
      SecureStorageService.set('categories', updated).catch(e =>
        console.error('Failed to save categories:', e)
      );
      return updated;
    });
  };

  const reparseTransactions = () => {
    setTransactions(prev => {
      const reparsed = prev.map(tx => {
        // Recategorize based on merchant name (same logic as SMS/statement parsing)
        const lowerMerchant = tx.merchant.toLowerCase();
        let newCategory = 'Other';

        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (keywords.some(k => lowerMerchant.includes(k))) {
            newCategory = category;
            break;
          }
        }

        return { ...tx, category: newCategory };
      });

      SecureStorageService.set('transactions', reparsed).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      return reparsed;
    });

    alert('Transactions have been recategorized based on current keywords!');
  };

  return (
    <Router>
      <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
        <Routes>
          <Route path="/" element={
            <>
              <Budgets transactions={transactions} categories={categories} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} onUpdateCategory={updateCategory} onAddCategory={addCategory} onUpdateTransaction={updateTransaction} />
              <BottomNav />
            </>
          } />
          <Route path="/transactions" element={
            <>
              <Transactions transactions={transactions} categories={categories} onDelete={deleteTransaction} onAdd={addTransaction} onBulkAdd={addBulkTransactions} />
              <BottomNav />
            </>
          } />
          <Route path="/add" element={<AddTransaction onAdd={addTransaction} categories={categories} />} />
          <Route path="/jarvis" element={
            <>
              <Jarvis transactions={transactions} />
              <BottomNav />
            </>
          } />
          <Route path="/overview" element={
            <>
              <Home transactions={transactions} categories={categories} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
              <BottomNav />
            </>
          } />
          <Route path="/subscriptions" element={
            <>
              <Subscriptions transactions={transactions} />
              <BottomNav />
            </>
          } />
          <Route path="/settings" element={
            <>
              <Settings onClearTransactions={clearTransactions} />
              <BottomNav />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;