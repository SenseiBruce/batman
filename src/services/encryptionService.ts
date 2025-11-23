import { Preferences } from '@capacitor/preferences';

/**
 * Encryption Service using Web Crypto API (AES-GCM)
 * Provides secure encryption/decryption for sensitive data
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;

export class EncryptionService {
    private static encryptionKey: CryptoKey | null = null;

    /**
     * Initialize encryption with user's PIN
     */
    static async initialize(pin: string): Promise<void> {
        const salt = await this.getOrCreateSalt();
        this.encryptionKey = await this.deriveKey(pin, salt);
    }

    /**
     * Get or create a random salt for key derivation
     */
    private static async getOrCreateSalt(): Promise<Uint8Array> {
        const { value } = await Preferences.get({ key: 'encryption_salt' });

        if (value) {
            return this.base64ToUint8Array(value);
        }

        // Create new salt
        const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
        await Preferences.set({
            key: 'encryption_salt',
            value: this.uint8ArrayToBase64(salt)
        });
        return salt;
    }

    /**
     * Derive encryption key from PIN using PBKDF2
     */
    private static async deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
        const encoder = new TextEncoder();
        const pinBuffer = encoder.encode(pin);

        // Import PIN as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            pinBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive actual encryption key
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt as BufferSource,
                iterations: 100000, // High iteration count for security
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: ALGORITHM, length: KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt data
     */
    static async encrypt(data: string): Promise<string> {
        if (!this.encryptionKey) {
            throw new Error('Encryption not initialized. Call initialize() first.');
        }

        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Encrypt
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            this.encryptionKey,
            dataBuffer
        );

        // Combine IV + encrypted data
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);

        // Return as base64
        return this.uint8ArrayToBase64(combined);
    }

    /**
     * Decrypt data
     */
    static async decrypt(encryptedData: string): Promise<string> {
        if (!this.encryptionKey) {
            throw new Error('Encryption not initialized. Call initialize() first.');
        }

        // Decode from base64
        const combined = this.base64ToUint8Array(encryptedData);

        // Extract IV and encrypted data
        const iv = combined.slice(0, IV_LENGTH);
        const encryptedBuffer = combined.slice(IV_LENGTH);

        // Decrypt
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            this.encryptionKey,
            encryptedBuffer
        );

        // Convert to string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
    }

    /**
     * Encrypt file data (ArrayBuffer)
     */
    static async encryptFile(fileData: ArrayBuffer): Promise<string> {
        if (!this.encryptionKey) {
            throw new Error('Encryption not initialized. Call initialize() first.');
        }

        // Generate random IV
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        // Encrypt
        const encryptedBuffer = await crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            this.encryptionKey,
            fileData
        );

        // Combine IV + encrypted data
        const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
        combined.set(iv, 0);
        combined.set(new Uint8Array(encryptedBuffer), iv.length);

        // Return as base64
        return this.uint8ArrayToBase64(combined);
    }

    /**
     * Decrypt file data to ArrayBuffer
     */
    static async decryptFile(encryptedData: string): Promise<ArrayBuffer> {
        if (!this.encryptionKey) {
            throw new Error('Encryption not initialized. Call initialize() first.');
        }

        // Decode from base64
        const combined = this.base64ToUint8Array(encryptedData);

        // Extract IV and encrypted data
        const iv = combined.slice(0, IV_LENGTH);
        const encryptedBuffer = combined.slice(IV_LENGTH);

        // Decrypt
        return crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv
            },
            this.encryptionKey,
            encryptedBuffer
        );
    }

    /**
     * Clear encryption key from memory
     */
    static clearKey(): void {
        this.encryptionKey = null;
    }

    /**
     * Check if encryption is initialized
     */
    static isInitialized(): boolean {
        return this.encryptionKey !== null;
    }

    /**
     * Utility: Convert Uint8Array to base64
     */
    private static uint8ArrayToBase64(bytes: Uint8Array): string {
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
        return btoa(binString);
    }

    /**
     * Utility: Convert base64 to Uint8Array
     */
    private static base64ToUint8Array(base64: string): Uint8Array {
        const binString = atob(base64);
        return Uint8Array.from(binString, (char) => char.codePointAt(0)!);
    }
}
