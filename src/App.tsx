import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BottomNav } from './components/BottomNav';
import { SecureStorageService } from './services/secureStorageService';
import { WidgetService } from './services/widgetService';
import Dashboard from './pages/Dashboard';
import Insights from './pages/Insights';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Jarvis from './pages/Jarvis';
import Settings from './pages/Settings';
import WishlistPage from './pages/WishlistPage';
import Instructions from './pages/Instructions';
import Subscriptions from './pages/Subscriptions';
import SplitBillPage from './pages/SplitBillPage';
import BudgetSettingsPage from './pages/BudgetSettingsPage';
import AccountsPage from './pages/AccountsPage';
import Onboarding from './pages/Onboarding';
import { Transaction, Category, Goal, WishlistItem } from './types';
import { DEFAULT_CATEGORIES, CATEGORY_KEYWORDS } from './constants';
import { fetchAllSmsTransactions } from './services/smsService';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PageTransition } from './components/PageTransition';
import { CreateSplitModal } from './components/CreateSplitModal';
import { BudgetService } from './services/budgetService';
import { AccountService } from './services/accountService';
import { AuthService } from './services/authService';
import { LockScreen } from './components/LockScreen';
import { InteractiveBackground } from './components/InteractiveBackground';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isCreateSplitModalOpen, setIsCreateSplitModalOpen] = useState(false);
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
        let loadedTxs = txData || [];

        // Accounts Migration
        const accounts = await AccountService.getAccounts();
        if (accounts.length === 0) {
          console.log('📦 Migrating: Creating default Cash account...');
          const defaultAcc = await AccountService.createAccount('Cash', 'cash', 0);

          // Assign existing transactions to default account
          if (loadedTxs.length > 0) {
            loadedTxs = loadedTxs.map(t => ({ ...t, accountId: defaultAcc.id }));
            await SecureStorageService.set('transactions', loadedTxs);

            // Recalculate balance
            const balance = loadedTxs.reduce((sum, t) => {
              return t.type === 'credit' ? sum + t.amount : sum - t.amount;
            }, 0);
            await AccountService.updateAccountBalance(defaultAcc.id, balance, true); // Set initial balance
          }
        }

        setTransactions(loadedTxs);

        // Goals
        const goalsData = await SecureStorageService.get<Goal[]>('goals');
        if (goalsData) {
          setGoals(goalsData);
        }

        // Wishlist
        const wishlistData = await SecureStorageService.get<WishlistItem[]>('wishlist');
        if (wishlistData) setWishlist(wishlistData);

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
      if (Capacitor.getPlatform() === 'ios') return;

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
            WidgetService.updateWidgets(); // Update widgets
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

  const [isLocked, setIsLocked] = useState(false);

  // Initialize App Lock and Listen for Background State
  useEffect(() => {
    const initLock = async () => {
      const enabled = await AuthService.isEnabled();
      if (enabled) {
        setIsLocked(true);
      }
    };
    initLock();

    const listener = CapacitorApp.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) {
        // App went to background
        const enabled = await AuthService.isEnabled();
        if (enabled) {
          setIsLocked(true);
        }
      }
    });

    return () => {
      listener.then(handle => handle.remove());
    };
  }, []);

  // Handle Budget Rollover on Month Change
  useEffect(() => {
    const checkRollover = async () => {
      if (!isDataLoaded || categories.length === 0) return;

      const lastRolloverMonth = await SecureStorageService.get<string>('last_rollover_month');
      const currentMonth = new Date().toISOString().slice(0, 7);

      if (lastRolloverMonth !== currentMonth) {
        console.log('📅 New month detected, checking for rollovers...');

        // Calculate previous month date range
        const now = new Date();
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        let hasUpdates = false;
        const updatedCategories = categories.map(cat => {
          if (cat.budgetConfig?.rollover) {
            const spent = BudgetService.calculateSpent(cat, transactions, prevMonthStart, prevMonthEnd);
            const rolloverAmount = BudgetService.calculateRollover(cat, spent);

            if (rolloverAmount !== (cat.rolloverAmount || 0)) {
              hasUpdates = true;
              return { ...cat, rolloverAmount };
            }
          }
          return cat;
        });

        if (hasUpdates) {
          setCategories(updatedCategories);
          await SecureStorageService.set('categories', updatedCategories);
          console.log('✅ Rollover amounts updated');
        }

        await SecureStorageService.set('last_rollover_month', currentMonth);
      }
    };

    checkRollover();
  }, [isDataLoaded, selectedMonth]);

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => {
      const updated = prev.map(t => t.id === updatedTx.id ? updatedTx : t);
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      WidgetService.updateWidgets(); // Update widgets
      return updated;
    });
  };

  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => {
      const updated = [tx, ...prev];
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      WidgetService.updateWidgets(); // Update widgets
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
      WidgetService.updateWidgets(); // Update widgets
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      SecureStorageService.set('transactions', updated).catch(e =>
        console.error('Failed to save transactions:', e)
      );
      WidgetService.updateWidgets(); // Update widgets
      return updated;
    });
  };

  const updateCategory = (updatedCategory: Category) => {
    setCategories(prev => {
      const updated = prev.map(c => c.id === updatedCategory.id ? updatedCategory : c);
      SecureStorageService.set('categories', updated).catch(e =>
        console.error('Failed to save categories:', e)
      );
      WidgetService.updateWidgets(); // Update widgets
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

  const addWishlistItem = (item: WishlistItem) => {
    setWishlist(prev => {
      const updated = [item, ...prev];
      SecureStorageService.set('wishlist', updated).catch(e => console.error('Failed to save wishlist:', e));
      return updated;
    });
  };

  const updateWishlistItem = (item: WishlistItem) => {
    setWishlist(prev => {
      const updated = prev.map(i => i.id === item.id ? item : i);
      SecureStorageService.set('wishlist', updated).catch(e => console.error('Failed to save wishlist:', e));
      return updated;
    });
  };

  const deleteWishlistItem = (id: string) => {
    setWishlist(prev => {
      const updated = prev.filter(i => i.id !== id);
      SecureStorageService.set('wishlist', updated).catch(e => console.error('Failed to save wishlist:', e));
      return updated;
    });
  };

  const handleWishlistBuy = (item: WishlistItem) => {
    // 1. Mark as purchased
    updateWishlistItem({ ...item, status: 'purchased' });
    // 2. Navigate to Add Transaction with pre-filled data
    navigate('/add', {
      state: {
        initialAmount: item.amount,
        initialMerchant: item.name,
        initialCategory: 'Shopping'
      }
    });
  };

  const showBottomNav = !['/add', '/onboarding'].includes(location.pathname);

  return (
    <div className="app-container">
      <InteractiveBackground />
      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}

      <AnimatePresence mode="wait">
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
              <Transactions transactions={transactions} categories={categories} onDelete={deleteTransaction} onAdd={addTransaction} onBulkAdd={addBulkTransactions} onUpdate={updateTransaction} />
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
            <Route path="/split-bills" element={
              <SplitBillPage onCreateSplit={() => setIsCreateSplitModalOpen(true)} />
            } />
            <Route path="/budget-settings" element={
              <BudgetSettingsPage
                categories={categories}
                onUpdateCategory={updateCategory}
                onBack={() => navigate('/')}
              />
            } />
            <Route path="/accounts" element={
              <AccountsPage onBack={() => navigate('/')} />
            } />
            <Route path="/settings" element={
              <Settings onClearTransactions={clearTransactions} />
            } />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/wishlist" element={
              <WishlistPage
                wishlist={wishlist}
                onAdd={addWishlistItem}
                onUpdate={updateWishlistItem}
                onDelete={deleteWishlistItem}
                onBuy={handleWishlistBuy}
              />
            } />
            <Route path="/instructions" element={<Instructions />} />
          </Routes>
        </PageTransition>
      </AnimatePresence>
      {showBottomNav && <BottomNav />}
      <CreateSplitModal
        isOpen={isCreateSplitModalOpen}
        onClose={() => setIsCreateSplitModalOpen(false)}
        transactions={transactions}
      />
    </div>
  );
};

export default App;