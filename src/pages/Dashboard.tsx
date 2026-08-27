import React, { useState, useEffect, useRef } from 'react';
import { Transaction, Category, Goal } from '../types';
import {
  requestPushPermission,
  registerPushListeners,
  scheduleBudgetAlert,
  schedulePendingTransactionsAlert,
} from '../utils/notify';
import { shareBudgetImage } from '../utils/shareBudget';
import { SmartInsightCard } from '../components/SmartInsightCard';
import { generateDailyInsight } from '../services/insightService';
import { AnimatedNumber, AnimatedProgressBar } from '../components/AnimatedNumber';
import { useCurrency } from '../contexts/CurrencyContext';
import { GoalsWidget } from '../components/GoalsWidget';
import { BudgetAnalysisCard } from '../components/BudgetAnalysisCard';
import { TransactionReviewModal } from '../components/TransactionReviewModal';
import { PredictionsCard } from '../components/PredictionsCard';
import { AddCategoryModal } from '../components/AddCategoryModal';
import { CategoryTransactionsModal } from '../components/CategoryTransactionsModal';
import { DashboardQuickActions } from '../components/DashboardQuickActions';
import { MerchantLearningService } from '../services/merchantLearningService';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onUpdateCategory: (category: Category) => void;
  onAddCategory: (name: string, budget: number) => void;
  onUpdateTransaction?: (transaction: Transaction) => void;
  onUpdateBulkTransactions?: (transactions: Transaction[]) => void;
  onDeleteTransaction?: (id: string) => void;
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
  onUpdateBulkTransactions,
  onDeleteTransaction,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
}) => {
  const { currencySymbol, formatAmount } = useCurrency();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editAlerts, setEditAlerts] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const pendingTransactions = transactions.filter((t) => t.isPending);
  const notifiedRef = useRef<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestPushPermission();
    registerPushListeners();
    const handleOpenPendingReview = () => setShowReviewModal(true);
    window.addEventListener('openPendingTransactionsReview', handleOpenPendingReview);
    return () =>
      window.removeEventListener('openPendingTransactionsReview', handleOpenPendingReview);
  }, []);

  useEffect(() => {
    if (pendingTransactions.length > 0) {
      schedulePendingTransactionsAlert(pendingTransactions.length);
    }
  }, [pendingTransactions.length]);

  const dailyInsight = generateDailyInsight(transactions, categories, selectedMonth);

  const formatMonth = (isoMonth: string) => {
    const date = new Date(isoMonth + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const monthlyTransactions = transactions.filter((t) => {
    const d = new Date(t.date);
    const tMonth = d.toISOString().slice(0, 7);
    return tMonth === selectedMonth && t.type === 'debit';
  });

  const getSpent = (catName: string) =>
    monthlyTransactions.filter((t) => t.category === catName).reduce((acc, t) => acc + t.amount, 0);

  const handleSave = (cat: Category) => {
    const newBudget = parseFloat(editAmount);
    if (!isNaN(newBudget) && newBudget >= 0) {
      onUpdateCategory({ ...cat, budget: newBudget, alertsEnabled: editAlerts });
    }
    setEditingId(null);
  };

  const handleShare = async () => {
    if (!contentRef.current || isSharing) return;
    setIsSharing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await shareBudgetImage(contentRef.current, selectedMonth, formatMonth(selectedMonth));
    } catch (e) {
      console.error('Error sharing budget:', e);
      alert('Failed to save/share budget image.');
    } finally {
      setIsSharing(false);
    }
  };

  const totalBudget = categories.reduce((acc, c) => acc + c.budget, 0);
  const totalSpent = monthlyTransactions.reduce((acc, t) => acc + t.amount, 0);
  const categoryTransactions = selectedCategory
    ? transactions.filter((t) => t.category === selectedCategory.name)
    : [];

  return (
    <div
      ref={contentRef}
      className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen bg-gray-900 relative"
    >
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-2 no-capture">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-all shadow-lg"
              title="Save/Share Budget"
            >
              {isSharing ? (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <DashboardQuickActions
          onOpenBudgetSettings={() => {
            window.location.hash = '#/budget-settings';
          }}
        />

        {pendingTransactions.length > 0 && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white p-4 rounded-xl mb-4 flex items-center justify-between shadow-lg shadow-blue-900/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md">
                {pendingTransactions.length}
              </div>
              <div className="text-left">
                <p className="font-semibold">New Transactions</p>
                <p className="text-xs text-blue-100">Review & Categorize</p>
              </div>
            </div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700 shadow-md">
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() - 1);
              onMonthChange(date.toISOString().slice(0, 7));
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="font-semibold text-white">{formatMonth(selectedMonth)}</span>
          <button
            onClick={() => {
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() + 1);
              onMonthChange(date.toISOString().slice(0, 7));
            }}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      <BudgetAnalysisCard
        categories={categories}
        transactions={monthlyTransactions}
        selectedMonth={selectedMonth}
      />
      <PredictionsCard
        transactions={transactions}
        categories={categories}
        selectedMonth={selectedMonth}
      />
      <SmartInsightCard insight={dailyInsight} />
      <GoalsWidget
        goals={goals}
        onAddGoal={onAddGoal}
        onUpdateGoal={onUpdateGoal}
        onDeleteGoal={onDeleteGoal}
      />

      <AddCategoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddCategory}
      />

      <CategoryTransactionsModal
        isOpen={showCategoryModal}
        category={selectedCategory}
        transactions={categoryTransactions}
        categories={categories}
        formatAmount={formatAmount}
        onClose={() => {
          setShowCategoryModal(false);
          setSelectedCategory(null);
        }}
        onUpdateTransaction={onUpdateTransaction}
        onDeleteTransaction={onDeleteTransaction}
      />

      <div className="bg-gradient-to-br from-gray-800 to-gray-800/80 p-6 rounded-2xl mb-6 border border-gray-700 shadow-xl">
        <div className="flex justify-between items-end mb-3">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Budget</p>
            <p className="text-3xl font-bold text-white">
              <AnimatedNumber value={totalBudget} prefix={currencySymbol} duration={1200} />
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm mb-1">Total Spent</p>
            <p
              className={`text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-400' : 'text-white'}`}
            >
              <AnimatedNumber
                value={totalSpent}
                prefix={currencySymbol}
                duration={1200}
                delay={100}
              />
            </p>
          </div>
        </div>
        <AnimatedProgressBar
          percentage={(totalSpent / totalBudget) * 100}
          duration={1000}
          delay={200}
          color={
            totalSpent > totalBudget
              ? 'bg-red-500'
              : totalSpent > totalBudget * 0.9
                ? 'bg-orange-500'
                : totalSpent > totalBudget * 0.75
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
          }
        />
        {totalSpent > totalBudget && (
          <div className="mt-3 flex items-center text-red-400 text-xs bg-red-400/10 p-2 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            You have exceeded your total monthly budget.
          </div>
        )}
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const spent = getSpent(cat.name);
          const percentage = Math.min((spent / cat.budget) * 100, 100);
          const isOver = spent > cat.budget;
          const isCritical = spent >= cat.budget * 0.9;
          const isWarning = spent >= cat.budget * 0.75;
          const isEditing = editingId === cat.id;
          const alertsEnabled = cat.alertsEnabled ?? true;

          if (alertsEnabled && !notifiedRef.current.has(cat.id)) {
            let title = '';
            let body = '';
            if (isOver) {
              title = `${cat.name} Budget Alert`;
              body = `You have exceeded the budget by ${formatAmount(spent - cat.budget)}`;
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
              className="bg-gray-800 p-4 rounded-xl border border-gray-700 transition-all cursor-pointer hover:border-gray-600 hover:shadow-lg"
              onClick={() => {
                setSelectedCategory(cat);
                setShowCategoryModal(true);
              }}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gray-700/50 shadow-md"
                    style={{ color: cat.color }}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{cat.name}</p>
                    <p className="text-xs text-gray-400">
                      Spent:{' '}
                      <span className={isOver ? 'text-red-400 font-medium' : 'text-gray-200'}>
                        {formatAmount(spent)}
                      </span>
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
                          className="w-24 bg-gray-900 border border-blue-500 rounded-lg px-3 py-1 text-white text-sm focus:outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(cat)}
                          className="text-green-400 hover:text-green-300"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
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
                        <p className="text-white font-bold text-lg">{formatAmount(cat.budget)}</p>
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditAmount(cat.budget.toString());
                            setEditAlerts(cat.alertsEnabled ?? true);
                          }}
                          className="text-gray-500 hover:text-blue-400"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-gray-500">Limit</p>
                        {!alertsEnabled && (
                          <span className="text-[10px] text-gray-600">(Alerts Off)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              {alertsEnabled && (
                <>
                  {isOver && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium">
                      <span>⚠️</span> Budget exceeded by {formatAmount(spent - cat.budget)}
                    </p>
                  )}
                  {!isOver && isCritical && (
                    <p className="text-orange-400 text-xs mt-2 font-medium flex items-center gap-1">
                      <span>⚠️</span> Critical: {Math.round(percentage)}% used
                    </p>
                  )}
                  {!isOver && !isCritical && isWarning && (
                    <p className="text-yellow-500 text-xs mt-2 font-medium flex items-center gap-1">
                      <span>⚠️</span> Warning: {Math.round(percentage)}% used
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <TransactionReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        pendingTransactions={pendingTransactions}
        categories={categories}
        onApprove={(tx) => {
          if (onUpdateTransaction) onUpdateTransaction(tx);
          void MerchantLearningService.learnMapping(tx.merchant, tx.category);
        }}
        onApproveAll={(txs) => {
          if (onUpdateBulkTransactions) onUpdateBulkTransactions(txs);
          txs.forEach((tx) => {
            void MerchantLearningService.learnMapping(tx.merchant, tx.category);
          });
        }}
        onDiscard={(tx) => {
          if (onDeleteTransaction) onDeleteTransaction(tx.id);
        }}
      />
    </div>
  );
};

export default Dashboard;
