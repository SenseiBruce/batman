import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseSms, generateId } from '../utils/parser';
import { Transaction, Category } from '../types';
import { DEFAULT_CATEGORIES } from '../constants';

interface AddTransactionProps {
  onAdd: (t: Transaction) => void;
  categories: Category[];
}

const AddTransaction: React.FC<AddTransactionProps> = ({ onAdd, categories }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'manual' | 'sms'>('sms');
  const [smsText, setSmsText] = useState('');

  // Manual State
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [type, setType] = useState<'debit' | 'credit'>('debit');

  const handleSmsParse = () => {
    if (!smsText.trim()) return;

    const parsed = parseSms(smsText);
    if (parsed && parsed.amount) {
      const newTransaction: Transaction = {
        id: generateId(),
        amount: parsed.amount,
        merchant: parsed.merchant || 'Unknown',
        type: parsed.type || 'debit',
        category: parsed.category || 'Other',
        date: new Date().toISOString(),
        isManual: false,
        rawSms: smsText
      };
      onAdd(newTransaction);
      navigate('/');
    } else {
      alert("Could not parse transaction details from this text. Try manual entry.");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !merchant) return;

    const newTransaction: Transaction = {
      id: generateId(),
      amount: parseFloat(amount),
      merchant,
      type,
      category,
      date: new Date().toISOString(),
      isManual: true,
    };
    onAdd(newTransaction);
    navigate('/');
  };

  const sampleSms = "Rs 450 debited from A/c XX1234 at SWIGGY on 23-Nov-25. Avl Bal Rs 12000";

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Add Transaction</h1>
      </header>

      {/* Toggle */}
      <div className="bg-gray-800 p-1 rounded-lg flex mb-6">
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'sms' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
          onClick={() => setMode('sms')}
        >
          Parse SMS
        </button>
        <button
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'manual' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}
          onClick={() => setMode('manual')}
        >
          Manual Entry
        </button>
      </div>

      {mode === 'sms' ? (
        <div className="space-y-4">
          <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl text-sm text-blue-200">
            <p className="mb-2 font-bold">Privacy Note:</p>
            <p>Transactions are processed locally in your browser. No SMS data is sent to any server.</p>
          </div>

          <textarea
            className="w-full h-40 bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Paste a bank transaction SMS here..."
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
          />

          <button
            onClick={() => setSmsText(sampleSms)}
            className="text-xs text-blue-400 hover:underline"
          >
            Use sample SMS
          </button>

          <button
            onClick={handleSmsParse}
            disabled={!smsText.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Parse & Add</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
          </button>
        </div>
      ) : (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-gray-500">₹</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-8 pr-4 text-white focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Merchant / Description</label>
            <input
              type="text"
              required
              value={merchant}
              onChange={e => setMerchant(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="e.g. Starbucks, Uber"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500 appearance-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all"
          >
            Save Transaction
          </button>
        </form>
      )}
    </div>
  );
};

export default AddTransaction;