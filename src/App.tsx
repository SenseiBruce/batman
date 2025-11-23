import React, { useState, useEffect } from 'react';
import LockScreen from './components/LockScreen';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Preferences } from '@capacitor/preferences';
import { SecureStorageService } from './services/secureStorageService';
import { AuthService } from './services/authService';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Jarvis from './pages/Jarvis';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';
import { Transaction, Category } from './types';
import { DEFAULT_CATEGORIES, CATEGORY_KEYWORDS } from './constants';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  // Load persisted data using Secure Storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if user is authenticated before loading encrypted data
        if (!AuthService.isAuth()) {
          return; // Data will be loaded after authentication
        }

        // Transactions
        const txData = await SecureStorageService.get<Transaction[]>('transactions');
        if (txData) {
          setTransactions(txData);
        }

        // Categories
        const catData = await SecureStorageService.get<Category[]>('categories');
        if (catData) {
          let loadedCats = catData;

          // Migration: Ensure 'Investments' exists
          if (!loadedCats.some(c => c.name === 'Investments')) {
            const investmentsCat = DEFAULT_CATEGORIES.find(c => c.name === 'Investments');
            if (investmentsCat) {
              loadedCats = [...loadedCats, investmentsCat];
              // Save immediately
              await SecureStorageService.set('categories', loadedCats);
            }
          }

          setCategories(loadedCats);
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    };
    loadData();
  }, []);

  // Persist data to Secure Storage on change
  useEffect(() => {
    const saveData = async () => {
      try {
        if (AuthService.isAuth()) {
          await SecureStorageService.set('transactions', transactions);
        }
      } catch (e) {
        console.error('Failed to save transactions:', e);
      }
    };
    saveData();
  }, [transactions]);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (AuthService.isAuth()) {
          await SecureStorageService.set('categories', categories);
        }
      } catch (e) {
        console.error('Failed to save categories:', e);
      }
    };
    saveData();
  }, [categories]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => {
      const updated = [t, ...prev];
      // Save immediately
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transaction:', e)
      );
      return updated;
    });

    // Update category spent
    const cat = categories.find(c => c.name === t.category);
    if (cat) {
      setCategories(prev => {
        const updatedCats = prev.map(c => {
          if (c.id === cat.id) {
            return { ...c, spent: c.spent + t.amount };
          }
          return c;
        });
        SecureStorageService.set('categories', updatedCats).catch(e =>
          console.error('Failed to save categories:', e)
        );
        return updatedCats;
      });
    }
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

      // Update categories only for NEW transactions
      updateCategoriesFromTransactions(uniqueNewTxs);

      return updated;
    });
  };

  const updateCategoriesFromTransactions = (txs: Transaction[]) => {
    const catUpdates: Record<string, number> = {};
    txs.forEach(t => {
      if (!catUpdates[t.category]) catUpdates[t.category] = 0;
      catUpdates[t.category] += t.amount;
    });

    setCategories(prev => {
      const updatedCats = prev.map(c => {
        if (catUpdates[c.name]) {
          return { ...c, spent: c.spent + catUpdates[c.name] };
        }
        return c;
      });
      SecureStorageService.set('categories', updatedCats).catch(e =>
        console.error('Failed to save categories:', e)
      );
      return updatedCats;
    });
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

    // Reset spent amounts in categories
    setCategories(prev => {
      const resetCats = prev.map(c => ({ ...c, spent: 0 }));
      SecureStorageService.set('categories', resetCats).catch(e =>
        console.error('Failed to save categories:', e)
      );
      return resetCats;
    });
  };

  const addCategory = (name: string, budget: number) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      budget,
      spent: 0,
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
    <LockScreen>
      <Router>
        <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
          <Routes>
            <Route path="/" element={
              <>
                <Home transactions={transactions} categories={categories} />
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
            <Route path="/budgets" element={
              <>
                <Budgets transactions={transactions} categories={categories} onUpdateCategory={updateCategory} onAddCategory={addCategory} onUpdateTransaction={updateTransaction} />
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
    </LockScreen>
  );
};

export default App;