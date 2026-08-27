import { describe, expect, it } from 'vitest';
import { backupFilename, collectLocalBackup, LOCAL_BACKUP_KEYS } from './localBackupExport';

describe('localBackupExport', () => {
  it('names the file with the UTC calendar day', () => {
    expect(backupFilename(new Date('2026-08-24T15:30:00.000Z'))).toBe(
      'jarvis-backup-2026-08-24.json'
    );
  });

  it('collects every backup key even when values are missing', async () => {
    const calls: string[] = [];
    const get = async <T>(key: string): Promise<T | null> => {
      calls.push(key);
      if (key === 'goals') {
        return [{ id: 'g1' }] as T;
      }
      return null;
    };
    const payload = await collectLocalBackup(get, new Date('2026-08-24T00:00:00.000Z'));
    expect(payload.exportedAt).toBe('2026-08-24T00:00:00.000Z');
    expect(Object.keys(payload.data)).toEqual([...LOCAL_BACKUP_KEYS]);
    expect(payload.data.goals).toEqual([{ id: 'g1' }]);
    expect(payload.data.transactions).toBeNull();
    expect(calls).toHaveLength(LOCAL_BACKUP_KEYS.length);
  });
});
