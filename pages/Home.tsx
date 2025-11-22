import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';
import { Transaction, Category } from '../types';
import { Link } from 'react-router-dom';

interface HomeProps {
  transactions: Transaction[];
  categories: Category[];
}

const Home: React.FC<HomeProps> = ({ transactions, categories }) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = monthlyTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalBudget = categories.reduce((acc, c) => acc + c.budget, 0);
  const budgetLeft = totalBudget - totalSpent;
  const budgetProgress = Math.min((totalSpent / totalBudget) * 100, 100);

  // Calculate Alerts
  const activeAlerts = categories
    .filter(c => c.alertsEnabled !== false)
    .map(c => {
      const spent = monthlyTransactions
        .filter(t => t.category === c.name && t.type === 'debit')
        .reduce((acc, t) => acc + t.amount, 0);
      const percentage = (spent / c.budget) * 100;
      return { ...c, spent, percentage };
    })
    .filter(c => c.percentage >= 75)
    .sort((a, b) => b.percentage - a.percentage);

  // Prepare Pie Data
  const categoryData = categories.map(cat => {
    const amount = monthlyTransactions
      .filter(t => t.category === cat.name && t.type === 'debit')
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

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        </div>
        <Link to="/settings" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 hover:bg-gray-700 transition-colors text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </Link>
      </header>

      {/* Notifications Area */}
      {activeAlerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeAlerts.map(c => (
            <Link to="/budgets" key={c.id} className="block">
              <div className={`rounded-xl p-3 border flex items-start gap-3 shadow-sm transition-transform active:scale-95 ${
                c.percentage >= 100 
                  ? 'bg-red-900/20 border-red-500/30 text-red-200' 
                  : c.percentage >= 90 
                    ? 'bg-orange-900/20 border-orange-500/30 text-orange-200'
                    : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200'
              }`}>
                <div className="mt-0.5">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary Card */}
      <Link to="/budgets">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-5 mb-6 shadow-lg transform transition-transform hover:scale-[1.02]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Spent</p>
              <h2 className="text-3xl font-bold text-white mt-1">₹{totalSpent.toLocaleString()}</h2>
            </div>
            <div className="text-right">
               <p className="text-indigo-100 text-sm font-medium">Budget Left</p>
               <p className="text-xl font-semibold text-white mt-1">₹{budgetLeft.toLocaleString()}</p>
            </div>
          </div>
          <div className="relative w-full h-2 bg-indigo-900/50 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full ${budgetProgress > 90 ? 'bg-red-400' : 'bg-green-400'}`} 
              style={{ width: `${budgetProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-indigo-200 text-right flex justify-between">
            <span>Tap to manage budgets</span>
            <span>{Math.round(budgetProgress)}% used</span>
          </div>
        </div>
      </Link>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Spending by Category */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
          <div className="h-48 w-full">
            {categoryData.length > 0 ? (
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
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">No data yet</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {categoryData.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center text-xs text-gray-300">
                <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: cat.color }}></div>
                {cat.name}
              </div>
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

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">Recent</h3>
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

export default Home;