import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';
import { EncryptionService } from './encryptionService';

export interface AuthState {
    isAuthenticated: boolean;
    isSetup: boolean;
    hasBiometric: boolean;
    biometricType?: BiometryType;
}

/**
 * Authentication Service
 * Handles biometric and PIN authentication
 */
export class AuthService {
    private static isAuthenticated = false;
    private static sessionTimeout: NodeJS.Timeout | null = null;
    private static readonly SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

    /**
     * Check if app is set up (has PIN)
     */
    static async isSetup(): Promise<boolean> {
        const { value } = await Preferences.get({ key: 'pin_hash' });
        return value !== null;
    }

    /**
     * Check if biometric authentication is available
     */
    static async checkBiometricAvailability(): Promise<{ available: boolean; type?: BiometryType }> {
        try {
            const result = await BiometricAuth.checkBiometry();
            return {
                available: result.isAvailable,
                type: result.biometryType
            };
        } catch (error) {
            console.error('Biometric check failed:', error);
            return { available: false };
        }
    }

    /**
     * Setup PIN for first time
     */
    static async setupPin(pin: string): Promise<void> {
        // Hash the PIN using Web Crypto API
        const pinHash = await this.hashPin(pin);

        // Store PIN hash
        await Preferences.set({ key: 'pin_hash', value: pinHash });

        // Initialize encryption with PIN
        await EncryptionService.initialize(pin);

        this.isAuthenticated = true;
        this.startSessionTimer();
    }

    /**
     * Authenticate with PIN
     */
    static async authenticateWithPin(pin: string): Promise<boolean> {
        const { value: storedHash } = await Preferences.get({ key: 'pin_hash' });

        if (!storedHash) {
            throw new Error('PIN not set up');
        }

        const pinHash = await this.hashPin(pin);

        if (pinHash === storedHash) {
            // Initialize encryption with PIN
            await EncryptionService.initialize(pin);
            this.isAuthenticated = true;
            this.startSessionTimer();
            return true;
        }

        return false;
    }

    /**
     * Authenticate with biometric
     * Note: For now, biometric auth will prompt for PIN on first success to initialize encryption
     */
    static async authenticateWithBiometric(): Promise<boolean> {
        try {
            await BiometricAuth.authenticate({
                reason: 'Authenticate to access your expense tracker',
                cancelTitle: 'Cancel',
                allowDeviceCredential: false,
                iosFallbackTitle: 'Use PIN',
                androidTitle: 'Biometric Authentication',
                androidSubtitle: 'Verify your identity',
                androidConfirmationRequired: false
            });

            // Biometric authentication succeeded
            // In a production app, you would retrieve the PIN from secure keychain
            // For now, we'll return true to indicate biometric success
            // The app will need to prompt for PIN to initialize encryption
            return true;
        } catch (error) {
            console.error('Biometric authentication failed:', error);
            return false;
        }
    }

    /**
     * Get current authentication state
     */
    static async getAuthState(): Promise<AuthState> {
        const isSetup = await this.isSetup();
        const biometric = await this.checkBiometricAvailability();

        return {
            isAuthenticated: this.isAuthenticated,
            isSetup,
            hasBiometric: biometric.available,
            biometricType: biometric.type
        };
    }

    /**
     * Lock the app
     */
    static lock(): void {
        this.isAuthenticated = false;
        EncryptionService.clearKey();
        this.clearSessionTimer();
    }

    /**
     * Check if currently authenticated
     */
    static isAuth(): boolean {
        return this.isAuthenticated;
    }

    /**
     * Start session timeout timer
     */
    private static startSessionTimer(): void {
        this.clearSessionTimer();

        this.sessionTimeout = setTimeout(() => {
            this.lock();
        }, this.SESSION_DURATION);
    }

    /**
     * Clear session timeout timer
     */
    private static clearSessionTimer(): void {
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
    }

    /**
     * Reset session timer (call on user activity)
     */
    static resetSessionTimer(): void {
        if (this.isAuthenticated) {
            this.startSessionTimer();
        }
    }

    /**
     * Hash PIN using SHA-256
     */
    private static async hashPin(pin: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Change PIN
     */
    static async changePin(oldPin: string, newPin: string): Promise<boolean> {
        // Verify old PIN
        const isValid = await this.authenticateWithPin(oldPin);
        if (!isValid) {
            return false;
        }

        // Set new PIN
        await this.setupPin(newPin);
        return true;
    }
}
