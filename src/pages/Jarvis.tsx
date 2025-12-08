import React, { useState, useRef, useEffect } from 'react';
import { queryJarvis } from '../services/geminiService';
import { Transaction } from '../types';
import { SecureStorageService } from '../services/secureStorageService';
import { HapticService } from '../services/hapticService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface JarvisProps {
  transactions: Transaction[];
}

interface SavedQuery {
  id: string;
  text: string;
  icon: string;
}

const PREDEFINED_QUERIES = [
  { id: 'spend-food', text: 'How much did I spend on food this month?', icon: '🍔' },
  { id: 'overspend', text: 'Did I overspend this month?', icon: '💸' },
  { id: 'top-categories', text: 'What are my top spending categories?', icon: '📊' },
  { id: 'compare-month', text: 'Compare my spending this month vs last month', icon: '📈' },
  { id: 'savings-tips', text: 'Give me tips to save money based on my spending', icon: '💡' },
  { id: 'largest-expense', text: 'What was my largest expense this month?', icon: '🔝' },
];

const Jarvis: React.FC<JarvisProps> = ({ transactions }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: "Hello! I'm Jarvis. I can analyze your spending habits. Tap a quick query below or ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showQuickQueries, setShowQuickQueries] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [queryToSave, setQueryToSave] = useState('');
  const [queryIcon, setQueryIcon] = useState('⭐');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load persisted data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load API Key
        const key = await SecureStorageService.get<string>('gemini_api_key');
        if (key) {
          setApiKey(key);
        } else {
          // Fallback to localStorage for migration or if not found
          const localKey = localStorage.getItem('gemini_api_key');
          if (localKey) {
            setApiKey(localKey);
            await SecureStorageService.set('gemini_api_key', localKey);
          } else {
            setShowKeyInput(true);
          }
        }

        // Load Chat History
        const history = await SecureStorageService.get<Message[]>('chat_history');
        if (history && history.length > 0) {
          setMessages(history);
        }

        // Load Saved Queries
        const saved = await SecureStorageService.get<SavedQuery[]>('saved_queries');
        if (saved) {
          setSavedQueries(saved);
        }
      } catch (e) {
        console.error('Failed to load Jarvis data:', e);
      }
    };
    loadData();
  }, []);

  // Save messages to storage whenever they change
  useEffect(() => {
    if (messages.length > 1) { // Don't save if only default message
      SecureStorageService.set('chat_history', messages).catch(e =>
        console.error('Failed to save chat history:', e)
      );
    }
    scrollToBottom();
  }, [messages]);

  // Save queries whenever they change
  useEffect(() => {
    if (savedQueries.length > 0) {
      SecureStorageService.set('saved_queries', savedQueries).catch(e =>
        console.error('Failed to save queries:', e)
      );
    }
  }, [savedQueries]);

  const handleSaveKey = async () => {
    if (apiKey.trim()) {
      await SecureStorageService.set('gemini_api_key', apiKey);
      // Also keep in localStorage for now as backup/compatibility
      localStorage.setItem('gemini_api_key', apiKey);
      setShowKeyInput(false);
    }
  };

  const handleSend = async (message?: string) => {
    const queryText = message || input;
    if (!queryText.trim() || !apiKey) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: queryText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setShowQuickQueries(false);

    try {
      const responseText = await queryJarvis(userMsg.text, transactions, apiKey);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: responseText || "I couldn't analyze that." };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', text: "Error connecting to AI. Please check your API Key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = (queryText: string) => {
    HapticService.light();
    handleSend(queryText);
  };

  const handleSaveCurrentInput = () => {
    if (!input.trim()) return;
    setQueryToSave(input);
    setShowSaveDialog(true);
    HapticService.light();
  };

  const handleSaveQuery = () => {
    if (!queryToSave.trim()) return;

    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      text: queryToSave,
      icon: queryIcon
    };

    setSavedQueries(prev => [...prev, newQuery]);
    setShowSaveDialog(false);
    setQueryToSave('');
    setQueryIcon('⭐');
    HapticService.success();
  };

  const handleDeleteSavedQuery = (id: string) => {
    setSavedQueries(prev => prev.filter(q => q.id !== id));
    HapticService.medium();
  };

  return (
    <div className="flex flex-col h-screen pb-20 bg-gray-900 text-gray-100 max-w-md mx-auto">
      <header className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v-4Z" /><path d="M12 16v6" /><path d="M19.07 4.93 17.66 6.34" /><path d="M22 12h-4" /><path d="M19.07 19.07l-1.41-1.41" /><path d="M4.93 19.07l1.41-1.41" /><path d="M2 12h4" /><path d="M4.93 4.93l1.41 1.41" /></svg>
          Jarvis AI
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowQuickQueries(!showQuickQueries);
              HapticService.light();
            }}
            className="text-xs text-gray-400 border border-gray-700 px-2 py-1 rounded hover:bg-gray-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick
          </button>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded hover:bg-gray-800"
          >
            {showKeyInput ? 'Close' : 'API Key'}
          </button>
        </div>
      </header>

      {showKeyInput && (
        <div className="p-4 bg-gray-800 border-b border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Enter Gemini API Key to enable AI features.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
              placeholder="AIzaSy..."
            />
            <button
              onClick={handleSaveKey}
              className="bg-blue-600 px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700"
            >
              Save
            </button>
          </div>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-blue-400 mt-2 inline-block hover:underline">Get API Key</a>
        </div>
      )}

      {/* Quick Queries Drawer */}
      {showQuickQueries && (
        <div className="p-4 border-b border-gray-800 bg-gray-900 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400">Quick Queries</h3>
            <button
              onClick={() => {
                setShowSaveDialog(true);
                HapticService.light();
              }}
              className="text-xs text-blue-400 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
          </div>
          <div className="space-y-2">
            {PREDEFINED_QUERIES.map((query) => (
              <button
                key={query.id}
                onClick={() => handleQuickQuery(query.text)}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-2 text-sm transition-colors flex items-center gap-2"
              >
                <span className="text-lg">{query.icon}</span>
                <span className="text-gray-300">{query.text}</span>
              </button>
            ))}
            {savedQueries.map((query) => (
              <div key={query.id} className="flex gap-2">
                <button
                  onClick={() => handleQuickQuery(query.text)}
                  className="flex-1 text-left bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/50 rounded-lg px-3 py-2 text-sm transition-colors flex items-center gap-2"
                >
                  <span className="text-lg">{query.icon}</span>
                  <span className="text-gray-300">{query.text}</span>
                </button>
                <button
                  onClick={() => handleDeleteSavedQuery(query.id)}
                  className="px-3 bg-red-900/20 hover:bg-red-900/30 border border-red-700/50 rounded-lg text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-gray-800 text-gray-200 rounded-bl-none border border-gray-700'
                }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl rounded-bl-none px-4 py-3 border border-gray-700 flex gap-1 items-center">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your expenses..."
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-700"
          />
          {input.trim() && (
            <button
              onClick={handleSaveCurrentInput}
              className="bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-700 rounded-full p-3 transition-colors"
              title="Save as quick query"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || !apiKey}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-full p-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </div>

      {/* Save Query Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Save Query</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Query Text</label>
                <input
                  type="text"
                  value={queryToSave}
                  onChange={(e) => setQueryToSave(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Show me my monthly food expenses"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {['⭐', '💰', '📊', '💡', '🎯', '🔍', '📈', '💸', '🍔', '🚗', '🏠', '🎮'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setQueryIcon(emoji)}
                      className={`text-2xl p-2 rounded-lg transition-colors ${queryIcon === emoji ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setQueryToSave('');
                    setQueryIcon('⭐');
                  }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuery}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jarvis;