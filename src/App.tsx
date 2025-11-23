import React, { useState, useEffect } from 'react';
import LockScreen from './components/LockScreen';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Preferences } from '@capacitor/preferences';
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

  // Load persisted data using Capacitor Preferences on mount
  useEffect(() => {
    const loadData = async () => {
      // Transactions
      const { value: txValue } = await Preferences.get({ key: 'transactions' });
      if (txValue) {
        try {
          setTransactions(JSON.parse(txValue));
        } catch (e) {
          console.error('Failed to parse transactions', e);
        }
      }
      // No dummy data - start fresh

      // Categories
      const { value: catValue } = await Preferences.get({ key: 'categories' });
      if (catValue) {
        try {
          let loadedCats: Category[] = JSON.parse(catValue);

          // Migration: Ensure 'Investments' exists
          if (!loadedCats.some(c => c.name === 'Investments')) {
            const investmentsCat = DEFAULT_CATEGORIES.find(c => c.name === 'Investments');
            if (investmentsCat) {
              loadedCats = [...loadedCats, investmentsCat];
              // Save immediately
              Preferences.set({ key: 'categories', value: JSON.stringify(loadedCats) });
            }
          }

          setCategories(loadedCats);
        } catch (e) {
          console.error('Failed to parse categories', e);
        }
      }
    };
    loadData();
  }, []);

  // Persist data to Capacitor Preferences on change
  useEffect(() => {
    Preferences.set({ key: 'transactions', value: JSON.stringify(transactions) });
  }, [transactions]);

  useEffect(() => {
    Preferences.set({ key: 'categories', value: JSON.stringify(categories) });
  }, [categories]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => {
      const updated = [t, ...prev];
      // Save immediately
      Preferences.set({ key: 'transactions', value: JSON.stringify(updated) });
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
        Preferences.set({ key: 'categories', value: JSON.stringify(updatedCats) });
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
      Preferences.set({ key: 'transactions', value: JSON.stringify(updated) });

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
      Preferences.set({ key: 'categories', value: JSON.stringify(updatedCats) });
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
      Preferences.set({ key: 'transactions', value: JSON.stringify(updated) });
      return updated;
    });
  };

  const clearTransactions = () => {
    setTransactions([]);
    Preferences.remove({ key: 'transactions' });

    // Reset spent amounts in categories
    setCategories(prev => {
      const resetCats = prev.map(c => ({ ...c, spent: 0 }));
      Preferences.set({ key: 'categories', value: JSON.stringify(resetCats) });
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
      Preferences.set({ key: 'categories', value: JSON.stringify(updated) });
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

      Preferences.set({ key: 'transactions', value: JSON.stringify(reparsed) });
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