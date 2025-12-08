import { Preferences } from '@capacitor/preferences';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';

/**
 * Secure Storage Service
 * Uses hardware-backed encryption (Android Keystore / iOS Keychain) via @aparajita/capacitor-secure-storage.
 * Includes automatic migration from insecure Preferences storage.
 */
export class SecureStorageService {

    /**
     * Store data securely
     */
    static async set(key: string, value: any): Promise<void> {
        const jsonString = JSON.stringify(value);

        try {
            if (Capacitor.isNativePlatform()) {
                // Plugin API: set(key, value)
                await SecureStorage.set(key, jsonString);
            } else {
                // Fallback for web/dev
                await Preferences.set({ key: `secure_${key}`, value: jsonString });
            }
        } catch (error) {
            console.error('SecureStorage set error:', error);
            // Fallback to Preferences if SecureStorage fails (e.g. no lock screen set)
            await Preferences.set({ key: `secure_${key}`, value: jsonString });
        }
    }

    /**
     * Retrieve data with auto-migration from insecure storage
     */
    static async get<T>(key: string): Promise<T | null> {
        let value: string | null = null;
        let migrated = false;

        // 1. Try Secure Storage (Native only)
        if (Capacitor.isNativePlatform()) {
            try {
                // Plugin API: get(key) returns Promise<DataType | null>
                // Since we stored a string, it should return a string
                const result = await SecureStorage.get(key);
                if (result !== null) {
                    value = result as string;
                }
            } catch (error) {
                // Key not found or other error, proceed to check insecure storage
            }
        }

        // 2. If not found, check Insecure Preferences (Migration Path)
        if (!value) {
            const prefResult = await Preferences.get({ key: `secure_${key}` });
            value = prefResult.value;
            if (value && Capacitor.isNativePlatform()) {
                migrated = true;
            }
        }

        if (!value) {
            return null;
        }

        try {
            const parsed = JSON.parse(value) as T;

            // 3. If found in insecure storage and we are native, migrate it up!
            if (migrated) {
                try {
                    await SecureStorage.set(key, value);
                    await Preferences.remove({ key: `secure_${key}` });
                    console.log(`Migrated ${key} to SecureStorage`);
                } catch (e) {
                    console.warn('Migration to SecureStorage failed:', e);
                }
            }

            return parsed;
        } catch (error) {
            console.error(`Failed to parse data for key: ${key}`, error);
            return null;
        }
    }

    /**
     * Remove data
     */
    static async remove(key: string): Promise<void> {
        try {
            if (Capacitor.isNativePlatform()) {
                await SecureStorage.remove(key);
            }
        } catch (e) {
            // Ignore if not found
        }
        // Always try to remove from preferences too (cleanup)
        await Preferences.remove({ key: `secure_${key}` });
    }

    /**
     * Clear all secure data
     */
    static async clear(): Promise<void> {
        if (Capacitor.isNativePlatform()) {
            try {
                await SecureStorage.clear();
            } catch (e) {
                console.error('SecureStorage clear error:', e);
            }
        }

        // Clear legacy preferences
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
        const val = await this.get(key);
        return val !== null;
    }
}
