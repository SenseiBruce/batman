import { Preferences } from '@capacitor/preferences';
import { EncryptionService } from './encryptionService';

/**
 * Secure Storage Service
 * Wrapper around Capacitor Preferences with automatic encryption/decryption
 */
export class SecureStorageService {
    /**
     * Store encrypted data
     */
    static async set(key: string, value: any): Promise<void> {
        if (!EncryptionService.isInitialized()) {
            throw new Error('Encryption not initialized. User must authenticate first.');
        }

        const jsonString = JSON.stringify(value);
        const encrypted = await EncryptionService.encrypt(jsonString);

        await Preferences.set({
            key: `secure_${key}`,
            value: encrypted
        });
    }

    /**
     * Retrieve and decrypt data
     */
    static async get<T>(key: string): Promise<T | null> {
        if (!EncryptionService.isInitialized()) {
            throw new Error('Encryption not initialized. User must authenticate first.');
        }

        const { value } = await Preferences.get({ key: `secure_${key}` });

        if (!value) {
            return null;
        }

        try {
            const decrypted = await EncryptionService.decrypt(value);
            return JSON.parse(decrypted) as T;
        } catch (error) {
            console.error(`Failed to decrypt data for key: ${key}`, error);
            return null;
        }
    }

    /**
     * Remove data
     */
    static async remove(key: string): Promise<void> {
        await Preferences.remove({ key: `secure_${key}` });
    }

    /**
     * Clear all secure data
     */
    static async clear(): Promise<void> {
        const { keys } = await Preferences.keys();
        const secureKeys = keys.filter(k => k.startsWith('secure_'));

        for (const key of secureKeys) {
            await Preferences.remove({ key });
        }
    }

    /**
     * Check if key exists
     */
    static async has(key: string): Promise<boolean> {
        const { value } = await Preferences.get({ key: `secure_${key}` });
        return value !== null;
    }

    /**
     * Migrate unencrypted data to encrypted storage
     */
    static async migrateData(key: string): Promise<boolean> {
        try {
            // Check if unencrypted data exists
            const { value } = await Preferences.get({ key });

            if (!value) {
                return false;
            }

            // Parse the data
            const data = JSON.parse(value);

            // Store as encrypted
            await this.set(key, data);

            // Remove unencrypted version
            await Preferences.remove({ key });

            console.log(`Successfully migrated ${key} to encrypted storage`);
            return true;
        } catch (error) {
            console.error(`Failed to migrate ${key}:`, error);
            return false;
        }
    }

    /**
     * Batch migrate multiple keys
     */
    static async migrateMultiple(keys: string[]): Promise<void> {
        for (const key of keys) {
            await this.migrateData(key);
        }
    }
}
