import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { SecureStorageService } from './secureStorageService';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export class AuthService {

    /**
     * Check if biometrics are available on the device
     */
    static async isAvailable(): Promise<boolean> {
        try {
            const info = await BiometricAuth.checkBiometry();
            return info.isAvailable;
        } catch (error) {
            console.error('Biometric check failed:', error);
            return false;
        }
    }

    /**
     * Authenticate the user
     */
    static async authenticate(): Promise<boolean> {
        try {
            // Check if available first
            const available = await this.isAvailable();
            if (!available) {
                console.warn('Biometrics not available');
                return true; // Fallback to allowing access if hardware not present
            }

            await BiometricAuth.authenticate({
                reason: 'Unlock Jarvis Expense Tracker',
                cancelTitle: 'Cancel',
                allowDeviceCredential: true, // Allow PIN/Pattern fallback
                iosFallbackTitle: 'Use Passcode',
            });

            return true;
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }

    /**
     * Enable biometrics preference
     */
    static async enableBiometrics(): Promise<void> {
        await SecureStorageService.set(BIOMETRIC_ENABLED_KEY, true);
    }

    /**
     * Disable biometrics preference
     */
    static async disableBiometrics(): Promise<void> {
        await SecureStorageService.remove(BIOMETRIC_ENABLED_KEY);
    }

    /**
     * Check if biometrics is enabled by user
     */
    static async isEnabled(): Promise<boolean> {
        const enabled = await SecureStorageService.get<boolean>(BIOMETRIC_ENABLED_KEY);
        return !!enabled;
    }

    /**
     * Change PIN (Placeholder for now, as we don't have a dedicated PIN service yet)
     * In a real app, this would verify the old PIN and save the new one.
     */
    static async changePin(oldPin: string, newPin: string): Promise<boolean> {
        // For now, just return true to simulate success
        // TODO: Implement actual PIN management
        console.log('Changing PIN from', oldPin, 'to', newPin);
        return true;
    }
}
