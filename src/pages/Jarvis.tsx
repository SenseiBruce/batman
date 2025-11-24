import React, { useState, useRef, useEffect } from 'react';
import { queryJarvis } from '../services/geminiService';
import { Transaction } from '../types';
import { SecureStorageService } from '../services/secureStorageService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface JarvisProps {
  transactions: Transaction[];
}

const Jarvis: React.FC<JarvisProps> = ({ transactions }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', text: "Hello! I'm Jarvis. I can analyze your spending habits. Ask me anything, like 'How much did I spend on food?' or 'Did I overspend this month?'" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
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

  const handleSaveKey = async () => {
    if (apiKey.trim()) {
      await SecureStorageService.set('gemini_api_key', apiKey);
      // Also keep in localStorage for now as backup/compatibility
      localStorage.setItem('gemini_api_key', apiKey);
      setShowKeyInput(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !apiKey) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

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

  return (
    <div className="flex flex-col h-screen pb-20 bg-gray-900 text-gray-100 max-w-md mx-auto">
      <header className="p-4 border-b border-gray-800 bg-gray-900 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-400 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2v-4Z" /><path d="M12 16v6" /><path d="M19.07 4.93 17.66 6.34" /><path d="M22 12h-4" /><path d="M19.07 19.07l-1.41-1.41" /><path d="M4.93 19.07l1.41-1.41" /><path d="M2 12h4" /><path d="M4.93 4.93l1.41 1.41" /></svg>
          Jarvis AI
        </h1>
        <button
          onClick={() => setShowKeyInput(!showKeyInput)}
          className="text-xs text-gray-500 border border-gray-700 px-2 py-1 rounded hover:bg-gray-800"
        >
          {showKeyInput ? 'Close' : 'API Key'}
        </button>
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
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || !apiKey}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-full p-3 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Jarvis;