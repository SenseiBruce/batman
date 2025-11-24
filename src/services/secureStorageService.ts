import { Preferences } from '@capacitor/preferences';

/**
 * Secure Storage Service
 * Wrapper around Capacitor Preferences.
 * NOTE: Encryption is currently disabled to ensure data persistence across app restarts
 * without requiring a complex Auth/PIN flow on startup.
 */
export class SecureStorageService {
    /**
     * Store data
     */
    static async set(key: string, value: any): Promise<void> {
        const jsonString = JSON.stringify(value);
        await Preferences.set({
            key: `secure_${key}`,
            value: jsonString
        });
    }

    /**
     * Retrieve data
     */
    static async get<T>(key: string): Promise<T | null> {
        const { value } = await Preferences.get({ key: `secure_${key}` });

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Failed to parse data for key: ${key}`, error);
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
}
