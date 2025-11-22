import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Jarvis from './pages/Jarvis';
import Budgets from './pages/Budgets';
import Settings from './pages/Settings';
import { Transaction, Category } from './types';
import { DEFAULT_CATEGORIES } from './constants';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  // Load from local storage on mount
  useEffect(() => {
    const savedTx = localStorage.getItem('transactions');
    if (savedTx) {
      try {
        setTransactions(JSON.parse(savedTx));
      } catch (e) {
        console.error("Failed to parse transactions", e);
      }
    } else {
        // Add dummy data for demo if empty
        const dummyData: Transaction[] = [
            { id: 'd1', amount: 450, type: 'debit', category: 'Food & Dining', merchant: 'Swiggy', date: new Date().toISOString(), isManual: false },
            { id: 'd2', amount: 120, type: 'debit', category: 'Transport', merchant: 'Uber', date: new Date(Date.now() - 86400000).toISOString(), isManual: false },
            { id: 'd3', amount: 1500, type: 'debit', category: 'Groceries', merchant: 'BigBasket', date: new Date(Date.now() - 172800000).toISOString(), isManual: false },
        ];
        setTransactions(dummyData);
    }

    const savedCats = localStorage.getItem('categories');
    if (savedCats) {
       try {
        setCategories(JSON.parse(savedCats));
       } catch (e) { console.error(e) }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('categories', JSON.stringify(categories));
  }, [categories]);

  const addTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const updateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  return (
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
              <Transactions transactions={transactions} categories={categories} onDelete={deleteTransaction} />
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
               <Budgets transactions={transactions} categories={categories} onUpdateCategory={updateCategory} />
               <BottomNav />
             </>
          } />
          <Route path="/settings" element={
            <>
              <Settings />
              <BottomNav />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;