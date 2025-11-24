import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { SecureStorageService } from '../services/secureStorageService';
import { Lock, Fingerprint, AlertCircle } from 'lucide-react';

interface LockScreenProps {
    children: React.ReactNode;
}

const LockScreen: React.FC<LockScreenProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSetup, setIsSetup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [error, setError] = useState('');
    const [hasBiometric, setHasBiometric] = useState(false);

    useEffect(() => {
        checkAuthState();

        // Listen for app state changes (background/foreground)
        let lockTimeout: NodeJS.Timeout | null = null;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // App going to background - lock it after 3 seconds
                // This prevents file picker from immediately locking the app
                lockTimeout = setTimeout(() => {
                    handleLock();
                }, 3000);
            } else {
                // App came back to foreground - cancel pending lock
                if (lockTimeout) {
                    clearTimeout(lockTimeout);
                    lockTimeout = null;
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (lockTimeout) {
                clearTimeout(lockTimeout);
            }
        };
    }, []);

    const checkAuthState = async () => {
        try {
            const state = await AuthService.getAuthState();
            setIsSetup(state.isSetup);
            setIsAuthenticated(state.isAuthenticated);
            setHasBiometric(state.hasBiometric);

            if (!state.isSetup) {
                setIsSetupMode(true);
            }
        } catch (error) {
            console.error('Failed to check auth state:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSetupPin = async () => {
        setError('');

        if (pin.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        if (!confirmPin) {
            setError('Please confirm your PIN');
            return;
        }

        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }

        try {
            await AuthService.setupPin(pin);

            // Migrate existing data to encrypted storage
            await SecureStorageService.migrateMultiple(['transactions', 'categories']);

            setIsSetup(true);
            setIsAuthenticated(true);
            setIsSetupMode(false);
            setPin('');
            setConfirmPin('');
        } catch (error) {
            console.error('Failed to setup PIN:', error);
            setError('Failed to setup PIN. Please try again.');
        }
    };

    const handlePinLogin = async () => {
        setError('');

        if (pin.length < 4) {
            setError('Please enter your PIN');
            return;
        }

        try {
            const success = await AuthService.authenticateWithPin(pin);

            if (success) {
                setIsAuthenticated(true);
                setPin('');
            } else {
                setError('Incorrect PIN');
                setPin('');
            }
        } catch (error) {
            console.error('Failed to authenticate:', error);
            setError('Authentication failed. Please try again.');
            setPin('');
        }
    };

    const handleBiometricLogin = async () => {
        setError('');

        try {
            const success = await AuthService.authenticateWithBiometric();

            if (success) {
                // Biometric succeeded, but we still need PIN to initialize encryption
                // For now, just show a message that they need to use PIN
                setError('Please enter your PIN to unlock');
            } else {
                setError('Biometric authentication failed');
            }
        } catch (error) {
            console.error('Biometric auth failed:', error);
            setError('Biometric authentication failed. Please use PIN.');
        }
    };

    const handleLock = () => {
        AuthService.lock();
        setIsAuthenticated(false);
        setPin('');
        setError('');
    };

    const handlePinInput = (value: string) => {
        // Only allow digits
        const digits = value.replace(/\D/g, '');
        setPin(digits);
        setError('');
    };

    const handleConfirmPinInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        setConfirmPin(digits);
        setError('');
    };

    const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            action();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-4">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {isSetupMode ? 'Setup Security' : 'Welcome Back'}
                            </h1>
                            <p className="text-gray-400">
                                {isSetupMode
                                    ? 'Create a PIN to secure your financial data'
                                    : 'Enter your PIN to continue'}
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Setup Mode */}
                        {isSetupMode ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Create PIN
                                    </label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={pin}
                                        onChange={(e) => handlePinInput(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, handleSetupPin)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="••••"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Confirm PIN
                                    </label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={confirmPin}
                                        onChange={(e) => handleConfirmPinInput(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, handleSetupPin)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="••••"
                                    />
                                </div>

                                <button
                                    onClick={handleSetupPin}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    Setup PIN
                                </button>

                                <div className="text-xs text-gray-400 text-center space-y-1">
                                    <p>• Use at least 4 digits</p>
                                    <p>• Avoid common patterns (1234, 0000)</p>
                                    <p>• Your data will be encrypted with this PIN</p>
                                </div>
                            </div>
                        ) : (
                            /* Login Mode */
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Enter PIN
                                    </label>
                                    <input
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={pin}
                                        onChange={(e) => handlePinInput(e.target.value)}
                                        onKeyPress={(e) => handleKeyPress(e, handlePinLogin)}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="••••"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handlePinLogin}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                                >
                                    Unlock
                                </button>

                                {hasBiometric && (
                                    <>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-600"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-gray-800 text-gray-400">Or</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleBiometricLogin}
                                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Fingerprint className="w-5 h-5" />
                                            Use Biometric
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Security Info */}
                    <div className="mt-6 text-center text-sm text-gray-400">
                        <p>🔒 Your data is encrypted and secure</p>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated - show app
    return <>{children}</>;
};

export default LockScreen;
