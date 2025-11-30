import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { SecureStorageService } from './services/secureStorageService';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Jarvis from './pages/Jarvis';
import Settings from './pages/Settings';
import Subscriptions from './pages/Subscriptions';
import Onboarding from './pages/Onboarding';
import { Transaction, Category, Goal } from './types';
import { DEFAULT_CATEGORIES, CATEGORY_KEYWORDS } from './constants';
import { fetchAllSmsTransactions } from './services/smsService';
import { PageTransition } from './components/PageTransition';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Load persisted data using Secure Storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check Onboarding
        const onboardingCompleted = await SecureStorageService.get('onboarding_completed');
        if (!onboardingCompleted) {
          navigate('/onboarding', { replace: true });
        }

        // Transactions
        const txData = await SecureStorageService.get<Transaction[]>('transactions');
        if (txData) {
          setTransactions(txData);
        }

        // Goals
        const goalsData = await SecureStorageService.get<Goal[]>('goals');
        if (goalsData) {
          setGoals(goalsData);
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

          setCategories(loadedCats);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setIsDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Auto-sync SMS transactions on app startup
  useEffect(() => {
    const autoSync = async () => {
      try {
        console.log('🔄 Auto-syncing SMS on app startup...');
        const newTxs = await fetchAllSmsTransactions();
        if (newTxs.length > 0) {
          // Use addBulkTransactions to prevent duplicates
          setTransactions(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const uniqueNewTxs = newTxs.filter(newTx => !existingIds.has(newTx.id));

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

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === updatedTx.id ? updatedTx : t);
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      return updated;
    });
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => {
      const updated = [tx, ...prev];
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      return updated;
    });
  };

  const addBulkTransactions = (txs: Transaction[]) => {
    setTransactions(prev => {
      // Filter out duplicates based on id
      const existingIds = new Set(prev.map(t => t.id));
      const newUniqueTxs = txs.filter(t => !existingIds.has(t.id));

      const updated = [...newUniqueTxs, ...prev];
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      return updated;
    });
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === updatedCategory.id ? updatedCategory : c);
      SecureStorageService.set('categories', updated).catch(e =>
        console.error('Failed to save categories:', e)
      );
      return updated;
    });
  };

  const clearTransactions = () => {
    setTransactions([]);
    SecureStorageService.remove('transactions').catch(e =>
      console.error('Failed to remove transactions:', e)
    );
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

  const addGoal = (goal: Goal) => {
    setGoals(prev => {
      const updated = [...prev, goal];
      SecureStorageService.set('goals', updated).catch(e =>
        console.error('Failed to save goals:', e)
      );
      return updated;
    });
  };

  const updateGoal = (updatedGoal: Goal) => {
    setGoals(prev => {
      const updated = prev.map(g => g.id === updatedGoal.id ? updatedGoal : g);
      SecureStorageService.set('goals', updated).catch(e =>
        console.error('Failed to save goals:', e)
      );
      return updated;
    });
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== id);
      SecureStorageService.set('goals', updated).catch(e =>
        console.error('Failed to save goals:', e)
      );
      return updated;
    });
  };

  const showBottomNav = !['/add', '/onboarding'].includes(location.pathname);

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans">
      <PageTransition>
        <Routes location={location}>
          <Route path="/" element={
            <Dashboard
              transactions={transactions}
              categories={categories}
              goals={goals}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
              onUpdateCategory={updateCategory}
              onAddCategory={addCategory}
              onUpdateTransaction={updateTransaction}
              onAddGoal={addGoal}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
            />
          } />
          <Route path="/transactions" element={
            <Transactions transactions={transactions} categories={categories} onDelete={deleteTransaction} onAdd={addTransaction} onBulkAdd={addBulkTransactions} />
          } />
          <Route path="/add" element={<AddTransaction onAdd={addTransaction} categories={categories} />} />
          <Route path="/jarvis" element={
            <Jarvis transactions={transactions} />
          } />
          <Route path="/insights" element={
            <Insights transactions={transactions} categories={categories} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
          } />
          <Route path="/subscriptions" element={
            <Subscriptions transactions={transactions} />
          } />
          <Route path="/settings" element={
            <Settings onClearTransactions={clearTransactions} />
          } />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
      </PageTransition>
      {showBottomNav && <BottomNav />}
    </div>
  );
};

export default App;