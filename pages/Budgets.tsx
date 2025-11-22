import React, { useState } from 'react';
import { Transaction, Category } from '../types';

interface BudgetsProps {
  transactions: Transaction[];
  categories: Category[];
  onUpdateCategory: (category: Category) => void;
}

const Budgets: React.FC<BudgetsProps> = ({ transactions, categories, onUpdateCategory }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editAlerts, setEditAlerts] = useState(true);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === 'debit';
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

  const totalBudget = categories.reduce((acc, c) => acc + c.budget, 0);
  const totalSpent = monthlyTransactions.reduce((acc, t) => acc + t.amount, 0);

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Budgets</h1>
        <p className="text-gray-400 text-sm">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* Total Budget Summary */}
      <div className="bg-gray-800 p-5 rounded-2xl mb-6 border border-gray-700 shadow-lg">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-gray-400 text-sm">Total Budget</p>
            <p className="text-2xl font-bold text-white">₹{totalBudget.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className={`text-xl font-semibold ${totalSpent > totalBudget ? 'text-red-400' : 'text-white'}`}>
              ₹{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
              totalSpent > totalBudget ? 'bg-red-500' : totalSpent > totalBudget * 0.9 ? 'bg-orange-500' : totalSpent > totalBudget * 0.75 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
          ></div>
        </div>
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

          let progressColor = 'bg-blue-500';
          if (isOver) progressColor = 'bg-red-500';
          else if (isCritical) progressColor = 'bg-orange-500';
          else if (isWarning) progressColor = 'bg-yellow-500';

          return (
            <div key={cat.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 transition-all">
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
                <div className="text-right">
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
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
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
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
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

export default Budgets;