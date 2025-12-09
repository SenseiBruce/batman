import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AuthService } from '../services/authService';
import { exportSmsDebugData } from '../services/smsService';
import { SecureStorageService } from '../services/secureStorageService';
import { CloudAuthService, User } from '../services/cloudAuthService';
import { SyncService } from '../services/syncService';
import { useCurrency, CURRENCIES, CurrencyCode } from '../contexts/CurrencyContext';
import { Lock, Shield, Key, Bot, Clock, BookOpen, Cloud, Upload, Download, LogOut, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [isAppLockEnabled, setIsAppLockEnabled] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { currencyCode, setCurrency } = useCurrency();

  // Behavioral Settings State
  const [hourlyWage, setHourlyWage] = useState('');
  const [defaultCooldown, setDefaultCooldown] = useState('72');

  useEffect(() => {
    checkBiometric();
    loadApiKey();
    loadAppLockState();
    loadBehavioralSettings();
    loadUser();
  }, []);

  const loadUser = async () => {
    const user = await CloudAuthService.getCurrentUser();
    setCurrentUser(user);
  };

  const checkBiometric = async () => {
    const available = await AuthService.isAvailable();
    setHasBiometric(available);
  };

  const loadAppLockState = async () => {
    const enabled = await AuthService.isEnabled();
    setIsAppLockEnabled(enabled);
  };

  const loadBehavioralSettings = async () => {
    const wage = await SecureStorageService.get<string>('hourly_wage');
    if (wage) setHourlyWage(wage);

    const cooldown = await SecureStorageService.get<string>('default_cooldown');
    if (cooldown) setDefaultCooldown(cooldown);
  };

  const toggleAppLock = async () => {
    // Authenticate before changing security settings
    const authenticated = await AuthService.authenticate();
    if (authenticated) {
      if (isAppLockEnabled) {
        await AuthService.disableBiometrics();
        setIsAppLockEnabled(false);
      } else {
        await AuthService.enableBiometrics();
        setIsAppLockEnabled(true);
      }
    }
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

  const handleSaveBehavioralSettings = async () => {
    if (hourlyWage) await SecureStorageService.set('hourly_wage', hourlyWage);
    if (defaultCooldown) await SecureStorageService.set('default_cooldown', defaultCooldown);
    alert('Behavioral settings saved!');
  };

  const handleSignIn = async () => {
    try {
      const user = await CloudAuthService.signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        alert(`Welcome back, ${user.displayName}!`);
      }
    } catch (error) {
      alert('Sign in failed. Check console.');
    }
  };

  const handleSignOut = async () => {
    await CloudAuthService.signOut();
    setCurrentUser(null);
  };

  const handleBackup = async () => {
    if (!confirm('This will overwrite any data currently in the cloud. Continue?')) return;
    setIsSyncing(true);

    const toastId = toast.loading('Backing up data...');
    try {
      await SyncService.backupToCloud();
      toast.success('Backup successful!', { id: toastId });
    } catch (error) {
      toast.error('Backup failed', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('WARNING: This will overwrite ALL your local data with cloud data. This cannot be undone. Continue?')) return;
    setIsSyncing(true);

    const toastId = toast.loading('Restoring from cloud...');
    try {
      const success = await SyncService.restoreFromCloud();
      if (success) {
        toast.success('Restored! Reloading...', { id: toastId });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("No backup found");
      }
    } catch (error: any) {
      toast.error(`Restore failed: ${error.message}`, { id: toastId });
    } finally {
      setIsSyncing(false);
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
        {/* Regional Settings Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Globe className="w-5 h-5 text-teal-400" />
            Regional Settings
          </h3>

          <div>
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
            <p className="text-xs text-gray-500 mt-2">
              Auto-detected based on your location: {CURRENCIES[currencyCode].locale}
            </p>
          </div>
        </div>

        {/* Behavioral Settings Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-400" />
            Behavioral Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Hourly Wage Estimate ($)
              </label>
              <p className="text-xs text-gray-500 mb-2">Used to calculate "Life Cost" of purchases</p>
              <input
                type="number"
                value={hourlyWage}
                onChange={(e) => setHourlyWage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Default Cooldown (Hours)
              </label>
              <p className="text-xs text-gray-500 mb-2">Wait time for impulse buys</p>
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

        {/* Cloud Backup Section */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            Cloud Backup (Beta)
          </h3>

          {!currentUser ? (
            <button
              onClick={handleSignIn}
              className="w-full py-3 bg-white text-gray-900 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
              Sign in with Google
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                {currentUser.photoURL && (
                  <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentUser.displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleBackup}
                  disabled={isSyncing}
                  className="flex flex-col items-center justify-center gap-1 p-3 bg-sky-600/20 text-sky-400 rounded-lg hover:bg-sky-600/30 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-xs font-medium">Backup</span>
                </button>
                <button
                  onClick={handleRestore}
                  disabled={isSyncing}
                  className="flex flex-col items-center justify-center gap-1 p-3 bg-orange-600/20 text-orange-400 rounded-lg hover:bg-orange-600/30 transition-colors disabled:opacity-50"
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs font-medium">Restore</span>
                </button>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-2 text-sm text-red-400 hover:text-red-300 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
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
                  <div>
                    <span className="text-sm text-gray-300 block">Biometric App Lock</span>
                    <span className="text-xs text-gray-500">Require authentication to open</span>
                  </div>
                </div>
                <button
                  onClick={toggleAppLock}
                  className={`w-12 h-7 rounded-full transition-colors relative ${isAppLockEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isAppLockEnabled ? 'left-6' : 'left-1'}`} />
                </button>
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

          {Capacitor.getPlatform() !== 'ios' && (
            <>
              <button
                className="w-full text-left py-3 px-2 text-blue-400 hover:bg-gray-700/50 rounded transition-colors flex items-center gap-2"
                onClick={handleExportDebugData}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                Export Debug Data (SMS + Parsed)
              </button>
              <div className="h-px bg-gray-700 my-1"></div>
            </>
          )}

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

        {/* Resources Section */}
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