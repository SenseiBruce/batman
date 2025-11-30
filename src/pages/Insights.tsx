import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { Transaction, Category } from '../types';
import { Link } from 'react-router-dom';
import TopMerchants from '../components/TopMerchants';
import CategoryTrends from '../components/CategoryTrends';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { HapticService } from '../services/hapticService';

interface InsightsProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string; // YYYY-MM
  onMonthChange: (month: string) => void;
}

const Insights: React.FC<InsightsProps> = ({ transactions, categories, selectedMonth, onMonthChange }) => {
  // Interactive chart state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  // Parse selected month
  const [year, month] = selectedMonth.split('-').map(Number);

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    const matchesMonth = d.toISOString().slice(0, 7) === selectedMonth;
    const matchesCategory = !selectedCategory || t.category === selectedCategory;
    return matchesMonth && matchesCategory;
  });

  // Calculate previous month
  const prevMonthDate = new Date(selectedMonth + '-01');
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const previousMonth = prevMonthDate.toISOString().slice(0, 7);

  const prevMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.toISOString().slice(0, 7) === previousMonth;
  });

  // Quick Stats Calculations
  const totalExpenses = monthlyTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);

  const daysInMonth = new Date(year, month, 0).getDate();
  const currentDay = new Date().getMonth() === month - 1 && new Date().getFullYear() === year
    ? new Date().getDate()
    : daysInMonth;
  const avgDailySpending = currentDay > 0 ? totalExpenses / currentDay : 0;

  // Days remaining in month
  const daysLeft = new Date().getMonth() === month - 1 && new Date().getFullYear() === year
    ? daysInMonth - currentDay
    : 0;

  // Previous month stats for comparison
  const prevTotalExpenses = prevMonthTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseChange = prevTotalExpenses > 0
    ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100
    : 0;

  // Month-over-Month Comparison Data
  const monthComparisonData = [
    {
      month: new Date(previousMonth + '-01').toLocaleDateString('en-US', { month: 'short' }),
      expenses: prevTotalExpenses
    },
    {
      month: new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'short' }),
      expenses: totalExpenses
    }
  ];

  const totalBudget = categories.reduce((acc, c) => acc + c.budget, 0);
  const budgetLeft = totalBudget - totalExpenses;
  const budgetProgress = Math.min((totalExpenses / totalBudget) * 100, 100);

  // Calculate Alerts for selected month
  const activeAlerts = categories
    .filter(c => c.alertsEnabled !== false)
    .map(c => {
      const spent = transactions
        .filter(t => t.category === c.name && t.type === 'debit' && new Date(t.date).toISOString().slice(0, 7) === selectedMonth)
        .reduce((acc, t) => acc + t.amount, 0);
      const percentage = (spent / c.budget) * 100;
      return { ...c, spent, percentage };
    })
    .filter(c => c.percentage >= 75)
    .sort((a, b) => b.percentage - a.percentage);

  // Prepare Pie Data
  const categoryData = categories.map(cat => {
    const amount = transactions
      .filter(t => t.category === cat.name && t.type === 'debit' && new Date(t.date).toISOString().slice(0, 7) === selectedMonth)
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value: amount, color: cat.color };
  }).filter(d => d.value > 0);

  // Prepare Line Data (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const trendData = last7Days.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTotal = transactions
      .filter(t => t.date.startsWith(dateStr) && t.type === 'debit')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      amount: dayTotal
    };
  });

  const recentTransactions = [...monthlyTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // Handle chart interactions
  const handlePieClick = (data: any) => {
    HapticService.medium(); // Haptic for chart interaction
    if (selectedCategory === data.name) {
      setSelectedCategory(null); // Deselect if clicking same category
    } else {
      setSelectedCategory(data.name);
    }
  };

  const handleBarClick = (data: any) => {
    HapticService.medium(); // Haptic for chart interaction
    if (selectedCategory === data.name) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(data.name);
    }
  };

  const clearFilter = () => {
    HapticService.light(); // Light haptic for clear
    setSelectedCategory(null);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Insights</h1>
            <Link to="/subscriptions" className="mt-2 inline-block px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm">Go to Subscriptions</Link>
          </div>
          <Link to="/settings" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition-colors text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
          </Link>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700">
          <button
            onClick={() => {
              HapticService.selectionChanged(); // Haptic for month change
              const date = new Date(selectedMonth + '-01');
              date.setMonth(date.getMonth() - 1);
              onMonthChange(date.toISOString().slice(0, 7));
            }}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-medium text-white">
            {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              HapticService.selectionChanged(); // Haptic for month change
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

      {/* Active Filter Badge */}
      {selectedCategory && (
        <div className="mb-4 flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
          <div className="flex-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span className="text-sm text-blue-300">Filtered by: <span className="font-bold text-white">{selectedCategory}</span></span>
          </div>
          <button
            onClick={clearFilter}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Notifications Area */}
      {activeAlerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeAlerts.map(c => (
            <Link to="/" key={c.id} className="block">
              <div className={`rounded-xl p-3 border flex items-start gap-3 shadow-sm transition-transform active:scale-95 ${c.percentage >= 100
                ? 'bg-red-900/20 border-red-500/30 text-red-200'
                : c.percentage >= 90
                  ? 'bg-orange-900/20 border-orange-500/30 text-orange-200'
                  : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200'
                }`}>
                <div className="mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">
                    {c.percentage >= 100 ? 'Budget Exceeded' : c.percentage >= 90 ? 'Critical Alert' : 'Spending Alert'}
                  </h4>
                  <p className="text-sm">
                    You've used <span className="font-bold">{Math.round(c.percentage)}%</span> of your {c.name} budget.
                  </p>
                </div>
                <div className="self-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Total Expenses */}
        <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-xl p-4 border border-red-700/30">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
            <span className="text-xs text-red-300 font-medium">Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber value={totalExpenses} prefix="₹" duration={1200} />
          </p>
          {!selectedCategory && prevTotalExpenses > 0 && (
            <p className={`text-xs mt-1 ${expenseChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {expenseChange > 0 ? '↑' : '↓'} <AnimatedNumber value={Math.abs(expenseChange)} decimals={1} duration={1000} />% vs last month
            </p>
          )}
          {selectedCategory && (
            <p className="text-xs mt-1 text-gray-400">
              {selectedCategory} only
            </p>
          )}
        </div>

        {/* Budget Remaining */}
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 border border-blue-700/30">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            <span className="text-xs text-blue-300 font-medium">Budget Left</span>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber value={budgetLeft} prefix="₹" duration={1200} delay={100} />
          </p>
          <p className="text-xs mt-1 text-gray-400">
            <AnimatedNumber value={budgetProgress} decimals={0} duration={1000} delay={100} />% used
          </p>
        </div>

        {/* Average Daily Spending */}
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-4 border border-purple-700/30">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span className="text-xs text-purple-300 font-medium">Avg/Day</span>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber value={avgDailySpending} prefix="₹" duration={1200} delay={200} />
          </p>
        </div>

        {/* Days Left in Month */}
        <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-xl p-4 border border-orange-700/30">
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span className="text-xs text-orange-300 font-medium">Days Left</span>
          </div>
          <p className="text-2xl font-bold text-white">
            <AnimatedNumber value={daysLeft > 0 ? daysLeft : daysInMonth} duration={800} delay={300} />
          </p>
          {daysLeft > 0 && budgetLeft > 0 && (
            <p className="text-xs mt-1 text-gray-400">
              <AnimatedNumber value={budgetLeft / daysLeft} prefix="₹" duration={1000} delay={300} />/day left
            </p>
          )}
        </div>
      </div>

      {/* Spending Forecast (Only for current month) */}
      {(() => {
        const today = new Date();
        const currentMonthStr = today.toISOString().slice(0, 7);
        const isCurrentMonth = selectedMonth === currentMonthStr;

        if (isCurrentMonth && !selectedCategory) {
          const daysInMonthTotal = new Date(year, month, 0).getDate();
          const dayOfMonth = today.getDate();

          if (dayOfMonth > 1) {
            const dailyAvg = totalExpenses / dayOfMonth;
            const projectedTotal = dailyAvg * daysInMonthTotal;
            const isOverBudget = projectedTotal > totalBudget;

            return (
              <div className={`p-4 rounded-xl border ${isOverBudget ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'} mb-6`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wider ${isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                      {isOverBudget ? '⚠️ Projected Overspend' : '✅ On Track'}
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">
                      <AnimatedNumber value={projectedTotal} prefix="₹" duration={1500} />
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Forecast based on current spending trend
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${isOverBudget ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {isOverBudget ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                    )}
                  </div>
                </div>
              </div>
            );
          }
        }
        return null;
      })()}

      {/* Top Merchants Widget */}
      <TopMerchants transactions={monthlyTransactions} selectedMonth={selectedMonth} />

      {/* Month-over-Month Comparison */}
      {!selectedCategory && (
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
          <h3 className="text-white font-semibold mb-4">Month Comparison</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthComparisonData}>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Bar dataKey="expenses" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Spending by Category */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Spending by Category</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  HapticService.light(); // Light haptic for toggle
                  setChartType('pie');
                }}
                className={`p-1.5 rounded ${chartType === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'} transition-colors`}
                title="Pie Chart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              </button>
              <button
                onClick={() => {
                  HapticService.light(); // Light haptic for toggle
                  setChartType('bar');
                }}
                className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'} transition-colors`}
                title="Bar Chart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-3">💡 Tap a slice/bar to filter transactions</p>
          <div className="h-48 w-full cursor-pointer">
            {categoryData.length > 0 ? (
              chartType === 'pie' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={handlePieClick}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={selectedCategory === entry.name ? '#fff' : 'none'}
                          strokeWidth={selectedCategory === entry.name ? 3 : 0}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      labelStyle={{ color: '#9ca3af' }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 0, 0]}
                      onClick={handleBarClick}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          opacity={selectedCategory && selectedCategory !== entry.name ? 0.3 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No data yet</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {categoryData.slice(0, 4).map((cat) => (
              <button
                key={cat.name}
                onClick={() => handlePieClick(cat)}
                className={`flex items-center text-xs transition-all ${selectedCategory === cat.name
                  ? 'text-white font-bold'
                  : selectedCategory
                    ? 'text-gray-500'
                    : 'text-gray-300'
                  }`}
              >
                <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cat.color }}></div>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Weekly Trend</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="amount" stroke="#60A5FA" strokeWidth={3} dot={{ r: 3, fill: '#60A5FA' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Trends Chart */}
      <CategoryTrends transactions={transactions} categories={categories} />

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">
            Recent {selectedCategory && `(${selectedCategory})`}
          </h3>
          <Link to="/transactions" className="text-blue-400 text-sm">View All</Link>
        </div>
        <div className="space-y-3">
          {recentTransactions.length > 0 ? recentTransactions.map(t => {
            const cat = categories.find(c => c.name === t.category);
            return (
              <div key={t.id} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-700" style={{ color: cat?.color }}>
                    {cat?.icon || '💸'}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{t.merchant}</p>
                    <p className="text-gray-400 text-xs">{new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className={`font-semibold ${t.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                  {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                </div>
              </div>
            );
          }) : (
            <div className="text-center text-gray-500 py-4">No transactions found</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Insights;