import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupRestorePanel } from './BackupRestorePanel';

vi.mock('../../services/cloudAuthService', () => ({
  CloudAuthService: {
    getCurrentUser: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  },
}));

vi.mock('../../services/syncService', () => ({
  SyncService: {
    backupToCloud: vi.fn(),
    restoreFromCloud: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(() => 'toast-1'),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../utils/localBackupExport', () => ({
  collectLocalBackup: vi.fn(async () => ({ exportedAt: '2026-08-24T00:00:00.000Z', data: {} })),
  backupFilename: () => 'jarvis-backup-2026-08-24.json',
  downloadJson: vi.fn(),
}));

import { CloudAuthService } from '../../services/cloudAuthService';
import { SyncService } from '../../services/syncService';
import toast from 'react-hot-toast';
import { collectLocalBackup, downloadJson } from '../../utils/localBackupExport';
import { CloudAuthService } from '../../services/cloudAuthService';
import { SyncService } from '../../services/syncService';
import toast from 'react-hot-toast';

const signedInUser = {
  uid: 'u1',
  email: 'ada@example.com',
  displayName: 'Ada Lovelace',
  photoURL: '',
};

describe('BackupRestorePanel', () => {
  beforeEach(() => {
    vi.mocked(CloudAuthService.getCurrentUser).mockResolvedValue(signedInUser);
    vi.mocked(SyncService.backupToCloud).mockReset().mockResolvedValue(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('backs up after confirm and shows a success toast', async () => {
    render(<BackupRestorePanel />);
    fireEvent.click(await screen.findByRole('button', { name: /^Backup$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Backup/i }));
    await waitFor(() => expect(SyncService.backupToCloud).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
  });

  it('does not backup when the user cancels', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<BackupRestorePanel />);
    fireEvent.click(await screen.findByRole('button', { name: /^Backup$/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /^Backup$/i })).toBeTruthy());
    expect(SyncService.backupToCloud).not.toHaveBeenCalled();
  });

  it('downloads a local JSON backup without requiring cloud sign-in', async () => {
    vi.mocked(CloudAuthService.getCurrentUser).mockResolvedValue(null);
    render(<BackupRestorePanel />);
    fireEvent.click(await screen.findByRole('button', { name: /download local backup/i }));
    await waitFor(() => expect(collectLocalBackup).toHaveBeenCalled());
    expect(downloadJson).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
    fireEvent.click(await screen.findByRole('button', { name: /Backup/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Backup/i })).toBeTruthy());
    expect(SyncService.backupToCloud).not.toHaveBeenCalled();
  });
});
