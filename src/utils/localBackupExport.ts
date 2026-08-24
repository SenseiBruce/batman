import { SecureStorageService } from '../services/secureStorageService';

export const LOCAL_BACKUP_KEYS = [
  'transactions',
  'categories',
  'goals',
  'wishlist',
  'hourly_wage',
  'default_cooldown',
  'subscriptions',
] as const;

export type LocalBackupPayload = {
  exportedAt: string;
  data: Record<string, unknown>;
};

export async function collectLocalBackup(
  get: <T>(key: string) => Promise<T | null> = SecureStorageService.get.bind(SecureStorageService),
  now: Date = new Date()
): Promise<LocalBackupPayload> {
  const data: Record<string, unknown> = {};
  for (const key of LOCAL_BACKUP_KEYS) {
    data[key] = await get(key);
  }
  return {
    exportedAt: now.toISOString(),
    data,
  };
}

export function backupFilename(now: Date = new Date()): string {
  return `jarvis-backup-${now.toISOString().slice(0, 10)}.json`;
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
