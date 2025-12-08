import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { queryJarvis } from '../services/geminiService';
import { Transaction } from '../types';
import { SecureStorageService } from '../services/secureStorageService';
import { HapticService } from '../services/hapticService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
}

interface Conversation {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
}

interface PendingResponse {
    conversationId: string;
    userMessage: string;
}

interface JarvisContextType {
    conversations: Conversation[];
    currentConversationId: string | null;
    isProcessing: boolean;
    pendingResponse: PendingResponse | null;
    hasUnreadResponse: boolean;
    setCurrentConversationId: (id: string) => void;
    createNewConversation: () => void;
    deleteConversation: (id: string) => void;
    sendMessage: (message: string, transactions: Transaction[], apiKey: string) => Promise<void>;
    markResponseAsRead: () => void;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

const RESPONSE_TIMEOUT = 30000; // 30 seconds timeout

export const JarvisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingResponse, setPendingResponse] = useState<PendingResponse | null>(null);
    const [hasUnreadResponse, setHasUnreadResponse] = useState(false);

    // Load conversations on mount
    useEffect(() => {
        const loadConversations = async () => {
            try {
                const savedConversations = await SecureStorageService.get<Conversation[]>('jarvis_conversations');
                if (savedConversations && savedConversations.length > 0) {
                    setConversations(savedConversations);
                    const mostRecent = savedConversations.sort((a, b) => b.updatedAt - a.updatedAt)[0];
                    setCurrentConversationId(mostRecent.id);
                } else {
                    createNewConversation();
                }
            } catch (e) {
                console.error('Failed to load conversations:', e);
                createNewConversation();
            }
        };
        loadConversations();
    }, []);

    // Save conversations whenever they change
    useEffect(() => {
        if (conversations.length > 0) {
            SecureStorageService.set('jarvis_conversations', conversations).catch(e =>
                console.error('Failed to save conversations:', e)
            );
        }
    }, [conversations]);

    const createNewConversation = useCallback(() => {
        const newConv: Conversation = {
            id: Date.now().toString(),
            title: 'New Conversation',
            messages: [
                { id: '1', role: 'assistant', text: "Hello! I'm Jarvis. I can analyze your spending habits. Ask me anything!" }
            ],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setConversations(prev => [...prev, newConv]);
        setCurrentConversationId(newConv.id);
        HapticService.success();
    }, []);

    const deleteConversation = useCallback((id: string) => {
        setConversations(prev => {
            const filtered = prev.filter(c => c.id !== id);
            if (currentConversationId === id && filtered.length > 0) {
                setCurrentConversationId(filtered[0].id);
            }
            return filtered;
        });
        HapticService.medium();
    }, [currentConversationId]);

    const updateConversationTitle = useCallback((id: string, firstUserMessage: string) => {
        const title = firstUserMessage.substring(0, 30) + (firstUserMessage.length > 30 ? '...' : '');
        setConversations(prev => prev.map(c =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
        ));
    }, []);

    const sendMessage = useCallback(async (message: string, transactions: Transaction[], apiKey: string) => {
        if (!currentConversationId || !message.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', text: message };

        // Add user message immediately
        setConversations(prev => prev.map(c => {
            if (c.id === currentConversationId) {
                const updatedMessages = [...c.messages, userMsg];
                if (c.title === 'New Conversation' && c.messages.length === 1) {
                    setTimeout(() => updateConversationTitle(c.id, message), 0);
                }
                return { ...c, messages: updatedMessages, updatedAt: Date.now() };
            }
            return c;
        }));

        setIsProcessing(true);
        setPendingResponse({ conversationId: currentConversationId, userMessage: message });

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), RESPONSE_TIMEOUT);
        });

        try {
            const currentConv = conversations.find(c => c.id === currentConversationId);
            const conversationHistory = currentConv
                ? [...currentConv.messages, userMsg].filter(m => m.id !== '1')
                : [];

            // Race between API call and timeout
            const responseText = await Promise.race([
                queryJarvis(message, transactions, apiKey, conversationHistory),
                timeoutPromise
            ]);

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                text: responseText || "I couldn't analyze that."
            };

            setConversations(prev => prev.map(c =>
                c.id === currentConversationId
                    ? { ...c, messages: [...c.messages, aiMsg], updatedAt: Date.now() }
                    : c
            ));

            // Set unread flag if user is not on Jarvis page
            if (window.location.hash !== '#/jarvis') {
                setHasUnreadResponse(true);
                HapticService.success();
            }
        } catch (e) {
            console.error('Jarvis error:', e);

            let errorMessage = "Error connecting to AI. Please check your API Key.";
            if (e instanceof Error && e.message === 'Request timed out') {
                errorMessage = "Response took too long and timed out. Please try a simpler question.";
            }

            const errorMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                text: errorMessage
            };

            setConversations(prev => prev.map(c =>
                c.id === currentConversationId
                    ? { ...c, messages: [...c.messages, errorMsg], updatedAt: Date.now() }
                    : c
            ));

            HapticService.error();
        } finally {
            setIsProcessing(false);
            setPendingResponse(null);
        }
    }, [currentConversationId, conversations, updateConversationTitle]);

    const markResponseAsRead = useCallback(() => {
        setHasUnreadResponse(false);
    }, []);

    const value: JarvisContextType = {
        conversations,
        currentConversationId,
        isProcessing,
        pendingResponse,
        hasUnreadResponse,
        setCurrentConversationId,
        createNewConversation,
        deleteConversation,
        sendMessage,
        markResponseAsRead,
    };

    return <JarvisContext.Provider value={value}>{children}</JarvisContext.Provider>;
};

export const useJarvis = () => {
    const context = useContext(JarvisContext);
    if (context === undefined) {
        throw new Error('useJarvis must be used within a JarvisProvider');
    }
    return context;
};
