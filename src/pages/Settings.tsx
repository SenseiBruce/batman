import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AuthService } from '../services/authService';
import { exportSmsDebugData } from '../services/smsService';
import { SecureStorageService } from '../services/secureStorageService';
import { useCurrency, CURRENCIES, CurrencyCode } from '../contexts/CurrencyContext';
import { Lock, Shield, Key, Bot, Clock, BookOpen, Globe } from 'lucide-react';
import { log } from '../utils/logger';
import { ApiKeyModal } from '../components/settings/ApiKeyModal';
import { PinChangeModal } from '../components/settings/PinChangeModal';
import { BackupRestorePanel } from '../components/settings/BackupRestorePanel';

interface SettingsProps {
  onClearTransactions?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClearTransactions }) => {
  const navigate = useNavigate();
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const { currencyCode, setCurrency } = useCurrency();
  const [hourlyWage, setHourlyWage] = useState('');
  const [defaultCooldown, setDefaultCooldown] = useState('72');

  useEffect(() => {
    AuthService.isAvailable().then(setHasBiometric);
    AuthService.isEnabled().then(setIsAppLockEnabled);
    SecureStorageService.get<string>('gemini_api_key').then((key) => {
      if (key) setApiKey(key);
    });
    SecureStorageService.get<string>('hourly_wage').then((wage) => {
      if (wage) setHourlyWage(wage);
    });
    SecureStorageService.get<string>('default_cooldown').then((cooldown) => {
      if (cooldown) setDefaultCooldown(cooldown);
    });
  }, []);

  const toggleAppLock = async () => {
    const authenticated = await AuthService.authenticate();
    if (!authenticated) return;
    if (isAppLockEnabled) {
      await AuthService.disableBiometrics();
      setIsAppLockEnabled(false);
    } else {
      await AuthService.enableBiometrics();
      setIsAppLockEnabled(true);
    }
  };

  const handleSaveBehavioralSettings = async () => {
    if (hourlyWage) await SecureStorageService.set('hourly_wage', hourlyWage);
    if (defaultCooldown) await SecureStorageService.set('default_cooldown', defaultCooldown);
    alert('Behavioral settings saved!');
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

  const handleExportDebugData = async () => {
    try {
      const jsonData = await exportSmsDebugData();
      const fileName = `sms-debug-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const result = await Filesystem.writeFile({
        path: fileName,
        data: jsonData,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      log.info('Settings', 'Debug file saved', result.uri);
      await Share.share({
        title: 'SMS Debug Data',
        text: `SMS Debug Export\nTotal Messages: Check the file\nExported: ${new Date().toLocaleString()}`,
        url: result.uri,
        dialogTitle: 'Share SMS Debug Data',
      });
      alert(`Debug data exported successfully!\nFile: ${fileName}\nSaved to Documents folder`);
    } catch (error) {
      log.error('Settings', 'Export error', error);
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
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            Regional Settings
          </h3>
          <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
          <select
            value={currencyCode}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
          >
            {Object.entries(CURRENCIES).map(([code, { symbol, name }]) => (
              <option key={code} value={code}>
                {symbol} - {name} ({code})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Behavioral Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Hourly Wage Estimate ($)</label>
              <input
                type="number"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Default Cooldown (Hours)</label>
              <input
                type="number"
                value={defaultCooldown}
                onChange={(e) => setDefaultCooldown(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="72"
              />
            </div>
            <button
              onClick={handleSaveBehavioralSettings}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Save Behavioral Settings
            </button>
          </div>
        </div>

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

        <BackupRestorePanel />

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Security
          </h3>
          <div className="flex items-center justify-between py-2 mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">Data Encryption</span>
            </div>
            <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">Active</span>
          </div>
          {hasBiometric && (
            <div className="flex items-center justify-between py-2 mb-2">
              <span className="text-sm text-gray-300">Biometric App Lock</span>
              <button
                onClick={toggleAppLock}
                className={`w-12 h-7 rounded-full transition-colors relative ${isAppLockEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                aria-label="Toggle biometric lock"
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isAppLockEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          )}
          <button
            className="w-full text-left py-3 px-2 text-purple-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={() => setShowChangePinModal(true)}
          >
            <Key className="w-4 h-4" />
            Change PIN
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">Data Management</h3>
          {Capacitor.getPlatform() !== 'ios' && (
            <button
              className="w-full text-left py-3 px-2 text-blue-400 hover:bg-gray-700/50 rounded transition-colors"
              onClick={handleExportDebugData}
            >
              Export Debug Data (SMS + Parsed)
            </button>
          )}
          <button
            className="w-full text-left py-3 px-2 text-yellow-400 hover:bg-gray-700/50 rounded transition-colors"
            onClick={handleClearTransactions}
          >
            Clear Transactions (Keep Budgets)
          </button>
          <button
            className="w-full text-left py-3 px-2 text-red-400 hover:bg-gray-700/50 rounded transition-colors"
            onClick={handleClearData}
          >
            Reset App Data (Full Wipe)
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">Resources</h3>
          <button
            className="w-full text-left py-3 px-2 text-blue-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
            onClick={() => navigate('/instructions')}
          >
            <BookOpen className="w-5 h-5" />
            How to Use Jarvis
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-2">About</h3>
          <p className="text-sm text-gray-400">Jarvis Expense Tracker v1.0</p>
          <p className="text-xs text-gray-500 mt-1">Privacy-focused, local-first expense tracking powered by Gemini.</p>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showApiKeyModal}
        initialKey={apiKey}
        onClose={() => setShowApiKeyModal(false)}
        onSaved={setApiKey}
      />
      <PinChangeModal isOpen={showChangePinModal} onClose={() => setShowChangePinModal(false)} />
    </div>
  );
};

export default Settings;
