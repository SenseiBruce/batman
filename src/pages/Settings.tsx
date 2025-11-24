import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AuthService } from '../services/authService';
import { exportSmsDebugData } from '../services/smsService';
import { SecureStorageService } from '../services/secureStorageService';
import { Lock, Shield, Key, Bot } from 'lucide-react';

interface SettingsProps {
  onClearTransactions?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClearTransactions }) => {
  const navigate = useNavigate();
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);

  useEffect(() => {
    checkBiometric();
    loadApiKey();
  }, []);

  const checkBiometric = async () => {
    const state = await AuthService.getAuthState();
    setHasBiometric(state.hasBiometric);
  };

  const loadApiKey = async () => {
    const key = await SecureStorageService.get<string>('gemini_api_key');
    if (key) setApiKey(key);
  };

  const handleSaveApiKey = async () => {
    if (apiKey.trim()) {
      await SecureStorageService.set('gemini_api_key', apiKey);
      // Keep in localStorage for compatibility
      localStorage.setItem('gemini_api_key', apiKey);
      setShowApiKeyModal(false);
      alert('API Key saved successfully!');
    }
  };

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

  const handleChangePin = async () => {
    setError('');

    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('New PINs do not match');
      return;
    }

    try {
      const success = await AuthService.changePin(oldPin, newPin);
      if (success) {
        alert('PIN changed successfully!');
        setShowChangePinModal(false);
        setOldPin('');
        setNewPin('');
        setConfirmNewPin('');
      } else {
        setError('Current PIN is incorrect');
      }
    } catch (err) {
      setError('Failed to change PIN');
    }
  };

  const handleExportDebugData = async () => {
    try {
      const jsonData = await exportSmsDebugData();

      const fileName = `sms-debug-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      // Save to Downloads folder
      const result = await Filesystem.writeFile({
        path: fileName,
        data: jsonData,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });

      console.log('✅ Debug file saved:', result.uri);

      // Share the file
      await Share.share({
        title: 'SMS Debug Data',
        text: `SMS Debug Export\nTotal Messages: Check the file\nExported: ${new Date().toLocaleString()}`,
        url: result.uri,
        dialogTitle: 'Share SMS Debug Data'
      });

      alert(`Debug data exported successfully!\nFile: ${fileName}\nSaved to Documents folder`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export debug data. Check console for details.');
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
        {/* AI Settings Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-400" />
            AI Settings
          </h3>
          <button
            className="w-full text-left py-3 px-2 text-blue-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={() => setShowApiKeyModal(true)}
          >
            <Key className="w-4 h-4" />
            {apiKey ? 'Update Gemini API Key' : 'Set Gemini API Key'}
          </button>
        </div>

        {/* Security Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Security
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Data Encryption</span>
              </div>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Active</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-300">PIN Protection</span>
              </div>
              <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Enabled</span>
            </div>

            {hasBiometric && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" /><path d="M14 13.12c0 2.38 0 6.38-1 8.88" /><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" /><path d="M2 12a10 10 0 0 1 18-6" /><path d="M2 16h.01" /><path d="M21.8 16c.2-2 .131-5.354 0-6" /><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" /><path d="M8.65 22c.21-.66.45-1.32.57-2" /><path d="M9 6.8a6 6 0 0 1 9 5.2v2" /></svg>
                  <span className="text-sm text-gray-300">Biometric Auth</span>
                </div>
                <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Available</span>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-700 my-3"></div>

          <button
            className="w-full text-left py-3 px-2 text-purple-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={() => setShowChangePinModal(true)}
          >
            <Key className="w-4 h-4" />
            Change PIN
          </button>
        </div>

        {/* Data Management Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">Data Management</h3>

          <button
            className="w-full text-left py-3 px-2 text-blue-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={handleExportDebugData}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export Debug Data (SMS + Parsed)
          </button>

          <div className="h-px bg-gray-700 my-1"></div>

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

        {/* About Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">About</h3>
          <p className="text-sm text-gray-400">Jarvis Expense Tracker v1.0</p>
          <p className="text-xs text-gray-500 mt-1">Privacy-focused, local-first expense tracking powered by Gemini.</p>
          <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            All data is encrypted and stored locally on your device
          </p>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Gemini API Key</h2>
            <p className="text-sm text-gray-400 mb-4">
              Enter your Google Gemini API key to enable AI categorization and Jarvis chat features.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="AIzaSy..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveApiKey}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-4 inline-block hover:underline text-center w-full">
              Get a free API Key
            </a>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Change PIN</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="••••"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowChangePinModal(false);
                    setOldPin('');
                    setNewPin('');
                    setConfirmNewPin('');
                    setError('');
                  }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePin}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Change PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;