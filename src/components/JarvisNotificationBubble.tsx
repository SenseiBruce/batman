import React from 'react';
import { useJarvis } from '../contexts/JarvisContext';
import { useLocation, useNavigate } from 'react-router-dom';

export const JarvisNotificationBubble: React.FC = () => {
    const { hasUnreadResponse, isProcessing, markResponseAsRead } = useJarvis();
    const location = useLocation();
    const navigate = useNavigate();

    // Don't show on Jarvis page
    if (location.pathname === '/jarvis') {
        return null;
    }

    const handleClick = () => {
        markResponseAsRead();
        navigate('/jarvis');
    };

    if (!hasUnreadResponse && !isProcessing) {
        return null;
    }

    return (
        <div className="fixed bottom-24 right-4 z-50 animate-in fade-in slide-in-from-bottom-4">
            <button
                onClick={handleClick}
                className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full p-4 shadow-2xl shadow-pink-500/50 flex items-center gap-3 hover:scale-105 transition-transform relative"
            >
                {/* Pulsing ring animation */}
                {hasUnreadResponse && (
                    <span className="absolute inset-0 rounded-full bg-pink-500 animate-ping opacity-75"></span>
                )}

                <div className="relative flex items-center gap-3">
                    {isProcessing ? (
                        <>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-150"></div>
                            </div>
                            <span className="text-sm font-medium">Jarvis is thinking...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span className="text-sm font-medium">New message from Jarvis!</span>
                            {/* Notification dot */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"></div>
                        </>
                    )}
                </div>
            </button>
        </div>
    );
};
