import React, { useEffect } from 'react';
import { AuthService } from '../services/authService';
import { motion } from 'framer-motion';

interface LockScreenProps {
    onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {

    useEffect(() => {
        // Auto-trigger authentication on mount
        handleUnlock();
    }, []);

    const handleUnlock = async () => {
        const success = await AuthService.authenticate();
        if (success) {
            onUnlock();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <div className="w-24 h-24 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Jarvis Locked</h1>
                <p className="text-gray-400 mb-8">Authentication required to access your finances</p>

                <button
                    onClick={handleUnlock}
                    className="w-full max-w-xs py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z"></path>
                        <path d="M16 16.24V19a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2.76"></path>
                        <path d="M12 12v9"></path>
                        <path d="M10 12h4"></path>
                    </svg>
                    Unlock with Biometrics
                </button>
            </motion.div>
        </div>
    );
};
