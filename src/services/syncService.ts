import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { SecureStorageService } from './secureStorageService';
import { CloudAuthService } from './cloudAuthService';

const CHUNK_SIZE = 200; // Number of transactions per chunk

// Helper to execute Firestore operations with native authentication context
async function authenticatedFirestoreOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
        // Ensure Web SDK is authenticated
        if (!auth.currentUser) {
            console.warn('Web SDK is not authenticated. Firestore operations may fail. Ensure "CloudAuthService.signInWithGoogle" was called successfully.');
        }

        // We still call getIdToken purely to ensure the native session is alive/refreshing, 
        // effectively "poking" the native layer, though we don't use the token directly here.
        await FirebaseAuthentication.getIdToken();

        return await operation();
    } catch (error) {
        console.error('Firestore operation failed:', error);
        throw error;
    }
}

export const SyncService = {
    async backupToCloud() {
        try {
            const user = await CloudAuthService.getCurrentUser();
            if (!user) throw new Error("User not signed in");

            const uid = user.uid;

            return await authenticatedFirestoreOperation(async () => {
                // Handle transactions separately due to potentially large size
                const transactions = await SecureStorageService.get('transactions');
                if (transactions && Array.isArray(transactions)) {
                    // Split into chunks of CHUNK_SIZE transactions
                    const chunks = [];
                    for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
                        chunks.push(transactions.slice(i, i + CHUNK_SIZE));
                    }

                    // Save each chunk
                    for (let i = 0; i < chunks.length; i++) {
                        await setDoc(doc(db, "users", uid, "transactions", `chunk_${i}`), {
                            data: chunks[i],
                            lastUpdated: Timestamp.now()
                        });
                    }

                    // Save metadata about chunks
                    await setDoc(doc(db, "users", uid, "data", "transactions_meta"), {
                        totalChunks: chunks.length,
                        totalItems: transactions.length,
                        lastUpdated: Timestamp.now()
                    });
                }

                // Handle other data (small enough to fit in single documents)
                const otherKeys = ['categories', 'goals', 'wishlist', 'hourly_wage', 'default_cooldown', 'subscriptions'];
                for (const key of otherKeys) {
                    const data = await SecureStorageService.get(key);
                    if (data !== null) {
                        await setDoc(doc(db, "users", uid, "data", key), {
                            value: data,
                            lastUpdated: Timestamp.now()
                        });
                    }
                }

                // Store metadata
                await setDoc(doc(db, "users", uid), {
                    lastBackup: Timestamp.now()
                });

                return true;
            });
        } catch (error) {
            console.error("Backup failed:", error);
            throw error;
        }
    },

    async restoreFromCloud() {
        try {
            const user = await CloudAuthService.getCurrentUser();
            if (!user) throw new Error("User not signed in");

            const uid = user.uid;

            return await authenticatedFirestoreOperation(async () => {
                // Check if backup exists
                const userDoc = await getDoc(doc(db, "users", uid));
                if (!userDoc.exists()) {
                    console.log("No backup found!");
                    return false;
                }

                // Restore transactions from chunks
                const transactionsMeta = await getDoc(doc(db, "users", uid, "data", "transactions_meta"));
                if (transactionsMeta.exists()) {
                    const { totalChunks } = transactionsMeta.data();
                    const allTransactions = [];

                    for (let i = 0; i < totalChunks; i++) {
                        const chunkDoc = await getDoc(doc(db, "users", uid, "transactions", `chunk_${i}`));
                        if (chunkDoc.exists()) {
                            allTransactions.push(...chunkDoc.data().data);
                        }
                    }

                    await SecureStorageService.set('transactions', allTransactions);
                }

                // Restore other data
                const otherKeys = ['categories', 'goals', 'wishlist', 'hourly_wage', 'default_cooldown'];
                for (const key of otherKeys) {
                    const docRef = doc(db, "users", uid, "data", key);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        await SecureStorageService.set(key, data.value);
                    }
                }

                return true;
            });
        } catch (error) {
            console.error("Restore failed:", error);
            throw error;
        }
    }
};
