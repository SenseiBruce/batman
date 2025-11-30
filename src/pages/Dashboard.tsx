import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Category } from '../types';
import { requestPushPermission, registerPushListeners, scheduleBudgetAlert } from '../utils/notify';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import html2canvas from 'html2canvas';
import { SmartInsightCard } from '../components/SmartInsightCard';
import { generateDailyInsight } from '../services/insightService';
import { AnimatedNumber, AnimatedProgressBar } from '../components/AnimatedNumber';
import { GoalsWidget } from '../components/GoalsWidget';
import { Goal } from '../types';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
  onUpdateCategory: (category: Category) => void;
  onAddCategory: (name: string, budget: number) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  onAddGoal: (goal: Goal) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  transactions,
  categories,
  goals,
  selectedMonth,
  onMonthChange,
  onUpdateCategory,
  onAddCategory,
  onUpdateTransaction,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editAlerts, setEditAlerts] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // Add Category State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBudget, setNewCatBudget] = useState('');

  // Modal state and handlers for showing transactions of a category
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const openCategoryModal = (cat: Category) => {
    setSelectedCategory(cat);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setSelectedCategory(null);
    setEditingTransactionId(null);
  };

  const categoryTransactions = selectedCategory
    ? transactions.filter(t => t.category === selectedCategory.name)
    : [];

  // State for editing transactions
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState('');
  const [editingAmount, setEditingAmount] = useState('');

  const contentRef = useRef<HTMLDivElement>(null);

  // Request push permission on mount and register listeners
  useEffect(() => {
    requestPushPermission();
    registerPushListeners();
  }, []);

  // Keep track of categories we already notified about (to avoid spam)
  const notifiedRef = useRef<Set<string>>(new Set());

  // Generate daily insight
  const dailyInsight = generateDailyInsight(transactions, categories, selectedMonth);

  const formatMonth = (isoMonth: string) => {
    const date = new Date(isoMonth + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const tMonth = d.toISOString().slice(0, 7);
    return tMonth === selectedMonth && t.type === 'debit';
  });

  const getSpent = (catName: string) => {
    return monthlyTransactions
      .filter(t => t.category === catName)
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditAmount(cat.budget.toString());
    setEditAlerts(cat.alertsEnabled ?? true);
  };

  const handleSave = (cat: Category) => {
    const newBudget = parseFloat(editAmount);
    if (!isNaN(newBudget) && newBudget >= 0) {
      onUpdateCategory({ ...cat, budget: newBudget, alertsEnabled: editAlerts });
    }
    setEditingId(null);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      alert('Please enter a category name');
      return;
    }
    const budget = parseFloat(newCatBudget);
    if (isNaN(budget) || budget <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }
    onAddCategory(newCatName, budget);
    setShowAddModal(false);
    setNewCatName('');
    setNewCatBudget('');
  };

  const handleShare = async () => {
    if (!contentRef.current || isSharing) return;
    setIsSharing(true);
    try {
      // Small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(contentRef.current, {
        backgroundColor: '#111827', // Match bg-gray-900
        scale: 2, // High quality
        ignoreElements: (element) => element.classList.contains('no-capture'), // Hide buttons during capture if needed
      });

      const base64 = canvas.toDataURL('image/png');
      const fileName = `budget-${selectedMonth}-${Date.now()}.png`;

      // Write to cache directory
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });

      // Share the file
      await Share.share({
        title: `Budget - ${formatMonth(selectedMonth)}`,
        text: `Here is my budget summary for ${formatMonth(selectedMonth)}`,
        url: result.uri,
        dialogTitle: 'Save or Share Budget',
      });

    } catch (e) {
      console.error('Error sharing budget:', e);
      alert('Failed to save/share budget image.');
    } finally {
      setIsSharing(false);
    }
  };

  const totalBudget = categories.reduce((acc, c) => acc + c.budget, 0);
  const totalSpent = monthlyTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div ref={contentRef} className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-gray-900 relative">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>

          <div className="flex items-center gap-3 no-capture">
            {/* Add Category Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>

            {/* Share/Save Button */}
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors shadow-lg"
            >
              {isSharing ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700">
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() - 1);
              onMonthChange(date.toISOString().slice(0, 7));
            }}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-medium text-white">
            {formatMonth(selectedMonth)}
          </span>
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() + 1);
              onMonthChange(date.toISOString().slice(0, 7));
            }}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </header>

      {/* Smart Insight Card */}
      <SmartInsightCard insight={dailyInsight} />

      {/* Goals Widget */}
      <GoalsWidget
        goals={goals}
        onAddGoal={onAddGoal}
        onUpdateGoal={onUpdateGoal}
        onDeleteGoal={onDeleteGoal}
      />

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 no-capture animate-in fade-in">
          <div className="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Add New Category</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Investments"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Monthly Budget</label>
                <input
                  type="number"
                  value={newCatBudget}
                  onChange={(e) => setNewCatBudget(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Transactions Modal */}
      {showCategoryModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 no-capture animate-in fade-in">
          <div className="bg-gray-800 rounded-2xl w-full max-w-lg p-6 border border-gray-700 shadow-2xl overflow-y-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{selectedCategory.name} Expenses</h2>
              <button onClick={closeCategoryModal} className="text-gray-400 hover:text-white text-2xl">✕</button>
            </div>
            {categoryTransactions.length === 0 ? (
              <p className="text-gray-400">No transactions for this category.</p>
            ) : (
              <ul className="space-y-3">
                {categoryTransactions.map(tx => {
                  const isEditing = editingTransactionId === tx.id;

                  const handleStartEdit = () => {
                    setEditingTransactionId(tx.id);
                    setEditingCategory(tx.category);
                    setEditingAmount(tx.amount.toString());
                  };

                  const handleSaveTransaction = () => {
                    const newAmount = parseFloat(editingAmount);
                    if (isNaN(newAmount) || newAmount < 0) {
                      alert('Please enter a valid amount');
                      return;
                    }

                    if (onUpdateTransaction) {
                      if (editingCategory !== tx.category || newAmount !== tx.amount) {
                        onUpdateTransaction({ ...tx, category: editingCategory, amount: newAmount });
                      }
                    }
                    setEditingTransactionId(null);
                  };

                  const handleCancelEdit = () => {
                    setEditingTransactionId(null);
                    setEditingCategory('');
                    setEditingAmount('');
                  };

                  return (
                    <li key={tx.id} className="bg-gray-700/30 p-3 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</span>
                            {!isEditing && <span className="font-medium text-white">₹{tx.amount.toLocaleString()}</span>}
                          </div>
                          <p className="text-sm text-gray-200">{tx.merchant}</p>

                          {isEditing && (
                            <div className="mt-2 space-y-2">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Amount</label>
                                <input
                                  type="number"
                                  value={editingAmount}
                                  onChange={(e) => setEditingAmount(e.target.value)}
                                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Category</label>
                                <select
                                  value={editingCategory}
                                  onChange={(e) => setEditingCategory(e.target.value)}
                                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
                                >
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={handleSaveTransaction}
                                  className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex-1 py-1 px-2 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <button
                            onClick={handleStartEdit}
                            className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Edit transaction"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Total Budget Summary */}
      <div className="bg-gray-800 p-5 rounded-2xl mb-6 border border-gray-700 shadow-lg">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-gray-400 text-sm">Total Budget</p>
            <p className="text-2xl font-bold text-white">
              <AnimatedNumber value={totalBudget} prefix="₹" duration={1200} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className={`text-xl font-semibold ${totalSpent > totalBudget ? 'text-red-400' : 'text-white'}`}>
              <AnimatedNumber value={totalSpent} prefix="₹" duration={1200} delay={100} />
            </p>
          </div>
        </div>
        <AnimatedProgressBar
          percentage={(totalSpent / totalBudget) * 100}
          duration={1000}
          delay={200}
          color={totalSpent > totalBudget ? 'bg-red-500' : totalSpent > totalBudget * 0.9 ? 'bg-orange-500' : totalSpent > totalBudget * 0.75 ? 'bg-yellow-500' : 'bg-green-500'}
        />
        {totalSpent > totalBudget && (
          <div className="mt-3 flex items-center text-red-400 text-xs bg-red-400/10 p-2 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            You have exceeded your total monthly budget.
          </div>
        )}
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {categories.map(cat => {
          const spent = getSpent(cat.name);
          const percentage = Math.min((spent / cat.budget) * 100, 100);
          const isOver = spent > cat.budget;
          const isCritical = spent >= cat.budget * 0.9;
          const isWarning = spent >= cat.budget * 0.75;
          const isEditing = editingId === cat.id;
          const alertsEnabled = cat.alertsEnabled ?? true;

          // Schedule notification if threshold crossed and not already notified
          if (alertsEnabled && !notifiedRef.current.has(cat.id)) {
            let title = '';
            let body = '';
            if (isOver) {
              title = `${cat.name} Budget Alert`;
              body = `You have exceeded the budget by ₹${(spent - cat.budget).toLocaleString()}`;
            } else if (isCritical) {
              title = `${cat.name} Budget Alert`;
              body = `Critical: ${Math.round(percentage)}% of budget used`;
            } else if (isWarning) {
              title = `${cat.name} Budget Alert`;
              body = `Warning: ${Math.round(percentage)}% of budget used`;
            }
            if (title && body) {
              scheduleBudgetAlert(title, body);
              notifiedRef.current.add(cat.id);
            }
          }

          let progressColor = 'bg-blue-500';
          if (isOver) progressColor = 'bg-red-500';
          else if (isCritical) progressColor = 'bg-orange-500';
          else if (isWarning) progressColor = 'bg-yellow-500';

          return (
            <div
              key={cat.id}
              className="bg-gray-800 p-4 rounded-xl border border-gray-700 transition-all cursor-pointer hover:border-gray-600"
              onClick={() => openCategoryModal(cat)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-700/50" style={{ color: cat.color }}>
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-white font-medium">{cat.name}</p>
                    <p className="text-xs text-gray-400">
                      Spent: <span className={isOver ? 'text-red-400' : 'text-gray-200'}>₹{spent.toLocaleString()}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right no-capture" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-20 bg-gray-900 border border-blue-500 rounded px-2 py-1 text-white text-sm focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSave(cat)} className="text-green-400 hover:text-green-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editAlerts}
                          onChange={(e) => setEditAlerts(e.target.checked)}
                          className="rounded bg-gray-900 border-gray-700 text-blue-500 focus:ring-0"
                        />
                        Alerts
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-semibold">₹{cat.budget.toLocaleString()}</p>
                        <button onClick={() => handleEdit(cat)} className="text-gray-500 hover:text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500">Limit</p>
                        {!alertsEnabled && <span className="text-[10px] text-gray-600">(Alerts Off)</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {/* Alerts Logic */}
              {alertsEnabled && (
                <>
                  {isOver && (
                    <p className="text-red-400 text-[10px] mt-1 flex items-center animate-pulse font-medium">
                      ⚠️ Budget exceeded by ₹{(spent - cat.budget).toLocaleString()}
                    </p>
                  )}
                  {!isOver && isCritical && (
                    <p className="text-orange-400 text-[10px] mt-1 font-medium">
                      ⚠️ Critical: Used {Math.round(percentage)}% of budget ( &gt;90% )
                    </p>
                  )}
                  {!isOver && !isCritical && isWarning && (
                    <p className="text-yellow-500 text-[10px] mt-1 font-medium">
                      ⚠️ Warning: Used {Math.round(percentage)}% of budget ( &gt;75% )
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;