import React, { useState } from 'react';
import { SecureStorageService } from '../../services/secureStorageService';

interface ApiKeyModalProps {
  isOpen: boolean;
  initialKey?: string;
  onClose: () => void;
  onSaved?: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, initialKey = '', onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState(initialKey);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    await SecureStorageService.set('gemini_api_key', apiKey);
    try {
      localStorage.setItem('gemini_api_key', apiKey);
    } catch {
      // jsdom / Node may not expose localStorage
    }
    onSaved?.(apiKey);
    onClose();
    alert('API Key saved successfully!');
  };

  return (
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
          aria-label="Gemini API Key"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Save
          </button>
        </div>
        <a
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-400 mt-4 inline-block hover:underline text-center w-full"
        >
          Get a free API Key
        </a>
      </div>
    </div>
  );
};
