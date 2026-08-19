import { beforeEach, describe, expect, it, vi } from 'vitest';

const getIdToken = vi.fn();
const getCurrentUser = vi.fn();
const storageGet = vi.fn();
const storageSet = vi.fn();
const setDoc = vi.fn();
const getDoc = vi.fn();

vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: { getIdToken: (...args: unknown[]) => getIdToken(...args) },
}));

vi.mock('../config/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'user-1' } },
}));

vi.mock('firebase/firestore', () => ({
  doc: (...segments: unknown[]) => segments.slice(1).join('/'),
  setDoc: (...args: unknown[]) => setDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  Timestamp: { now: () => ({ seconds: 1, nanoseconds: 0 }) },
}));

vi.mock('./secureStorageService', () => ({
  SecureStorageService: {
    get: (...args: unknown[]) => storageGet(...args),
    set: (...args: unknown[]) => storageSet(...args),
  },
}));

vi.mock('./cloudAuthService', () => ({
  CloudAuthService: {
    getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
  },
}));

import { SyncService } from './syncService';

describe('SyncService', () => {
  beforeEach(() => {
    getIdToken.mockReset().mockResolvedValue({ token: 'id-token' });
    getCurrentUser.mockReset();
    storageGet.mockReset();
    storageSet.mockReset();
    setDoc.mockReset().mockResolvedValue(undefined);
    getDoc.mockReset();
  });

  it('throws when no user is signed in', async () => {
    getCurrentUser.mockResolvedValue(null);
    await expect(SyncService.backupToCloud()).rejects.toThrow('User not signed in');
  });

  it('chunks transactions and writes backup documents', async () => {
    getCurrentUser.mockResolvedValue({ uid: 'user-1' });
    const transactions = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, amount: i }));
    storageGet.mockImplementation(async (key: string) => {
      if (key === 'transactions') return transactions;
      if (key === 'categories') return [{ name: 'Food' }];
      return null;
    });

    await expect(SyncService.backupToCloud()).resolves.toBe(true);
    expect(setDoc).toHaveBeenCalled();
    expect(getIdToken).toHaveBeenCalled();
  });

  it('restores chunked transactions into secure storage', async () => {
    getCurrentUser.mockResolvedValue({ uid: 'user-1' });
    getDoc.mockImplementation(async (path: string) => {
      if (path === 'users/user-1') return { exists: () => true };
      if (path === 'users/user-1/data/transactions_meta') {
        return { exists: () => true, data: () => ({ totalChunks: 1 }) };
      }
      if (path === 'users/user-1/transactions/chunk_0') {
        return { exists: () => true, data: () => ({ data: [{ id: 't1', amount: 10 }] }) };
      }
      return { exists: () => false };
    });

    await expect(SyncService.restoreFromCloud()).resolves.toBe(true);
    expect(storageSet).toHaveBeenCalledWith('transactions', [{ id: 't1', amount: 10 }]);
  });

  it('returns false when no cloud backup exists', async () => {
    getCurrentUser.mockResolvedValue({ uid: 'user-1' });
    getDoc.mockResolvedValue({ exists: () => false });
    await expect(SyncService.restoreFromCloud()).resolves.toBe(false);
  });
});
