import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';

interface SettingsProps {
  onClearTransactions?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClearTransactions }) => {
  const navigate = useNavigate();

  const handleClearData = async () => {
    if (confirm('Are you sure you want to clear all transaction and category data? This cannot be undone.')) {
      await Preferences.clear();
      window.location.href = '/';
    }
  };

  const handleClearTransactions = async () => {
    if (confirm('Are you sure you want to clear ONLY transaction history? Your budgets and categories will remain.')) {
      if (onClearTransactions) {
        onClearTransactions();
        alert('Transactions cleared. Please re-sync SMS.');
      }
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto min-h-screen">
      <header className="mb-6 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
      </header>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">Data Management</h3>


          <button
            className="w-full text-left py-3 px-2 text-yellow-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={handleClearTransactions}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
            Clear Transactions (Keep Budgets)
          </button>

          <div className="h-px bg-gray-700 my-1"></div>

          <button
            className="w-full text-left py-3 px-2 text-red-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={handleClearData}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            Reset App Data (Full Wipe)
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">About</h3>
          <p className="text-sm text-gray-400">Jarvis Expense Tracker v1.0</p>
          <p className="text-xs text-gray-500 mt-1">Privacy-focused, local-first expense tracking powered by Gemini.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;