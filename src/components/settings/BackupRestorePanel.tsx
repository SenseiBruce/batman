import React, { useEffect, useState } from 'react';
import { Cloud, Download, FileJson, LogOut, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { CloudAuthService, User } from '../../services/cloudAuthService';
import { SyncService } from '../../services/syncService';
import { backupFilename, collectLocalBackup, downloadJson } from '../../utils/localBackupExport';

export const BackupRestorePanel: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    CloudAuthService.getCurrentUser().then(setCurrentUser);
  }, []);

  const handleSignIn = async () => {
    try {
      const user = await CloudAuthService.signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        alert(`Welcome back, ${user.displayName}!`);
      }
    } catch {
      alert('Sign in failed. Check console.');
    }
  };

  const handleSignOut = async () => {
    await CloudAuthService.signOut();
    setCurrentUser(null);
  };

  const handleBackup = async () => {
    if (!confirm('This will overwrite any data currently in the cloud. Continue?')) return;
    setIsSyncing(true);
    const toastId = toast.loading('Backing up data...');
    try {
      await SyncService.backupToCloud();
      toast.success('Backup successful!', { id: toastId });
    } catch {
      toast.error('Backup failed', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (
      !confirm(
        'WARNING: This will overwrite ALL your local data with cloud data. This cannot be undone. Continue?'
      )
    ) {
      return;
    }
    setIsSyncing(true);
    const toastId = toast.loading('Restoring from cloud...');
    try {
      const success = await SyncService.restoreFromCloud();
      if (success) {
        toast.success('Restored! Reloading...', { id: toastId });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error('No backup found');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Restore failed';
      toast.error(`Restore failed: ${message}`, { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLocalDownload = async () => {
    try {
      const payload = await collectLocalBackup();
      downloadJson(backupFilename(), payload);
      toast.success('Local backup downloaded');
    } catch {
      toast.error('Could not download backup');
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <Cloud className="w-5 h-5 text-sky-400" />
        Cloud Backup (Beta)
      </h3>
      {!currentUser ? (
        <button
          onClick={handleSignIn}
          className="w-full py-3 bg-white text-gray-900 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Sign in with Google
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
            {currentUser.photoURL && (
              <img src={currentUser.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.displayName}</p>
              <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBackup}
              disabled={isSyncing}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-sky-600/20 text-sky-400 rounded-lg hover:bg-sky-600/30 transition-colors disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs font-medium">Backup</span>
            </button>
            <button
              onClick={handleRestore}
              disabled={isSyncing}
              className="flex flex-col items-center justify-center gap-1 p-3 bg-orange-600/20 text-orange-400 rounded-lg hover:bg-orange-600/30 transition-colors disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span className="text-xs font-medium">Restore</span>
            </button>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full py-2 text-sm text-red-400 hover:text-red-300 flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={handleLocalDownload}
        className="mt-3 w-full py-2 text-sm text-gray-300 hover:text-white flex items-center justify-center gap-2 border border-gray-700 rounded-lg hover:bg-gray-700/40"
      >
        <FileJson className="w-4 h-4" />
        Download local backup
      </button>
    </div>
  );
};
