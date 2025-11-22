import React from 'react';
import { Transaction, Category } from '../types';

interface TransactionsProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
}

const Transactions: React.FC<TransactionsProps> = ({ transactions, categories, onDelete }) => {
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">History</h1>
      </header>

      <div className="space-y-4">
        {sortedTransactions.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <p className="text-4xl mb-2">🧾</p>
            <p>No transactions yet.</p>
            <p className="text-sm text-gray-600">Add some manually or simulate an SMS.</p>
          </div>
        ) : (
          sortedTransactions.map((t) => {
            const cat = categories.find(c => c.name === t.category);
            return (
              <div key={t.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-gray-700/50" style={{ color: cat?.color }}>
                    {cat?.icon || '💸'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{t.merchant}</p>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      {new Date(t.date).toLocaleDateString()} • {t.category}
                      {t.isManual && <span className="bg-gray-700 px-1 rounded text-[10px]">Manual</span>}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <div className={`font-bold text-lg ${t.type === 'credit' ? 'text-green-400' : 'text-white'}`}>
                    {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                  </div>
                  <button 
                    onClick={() => onDelete(t.id)}
                    className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Transactions;