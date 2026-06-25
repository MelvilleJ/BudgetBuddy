import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import { getPendingCount } from '@/db/repositories/syncQueueRepo';

interface SyncStore {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  lastError: string | null;
  isConfigured: boolean;

  updatePendingCount: () => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (time: string) => void;
  setError: (error: string | null) => void;
  checkConfiguration: () => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingCount: 0,
  lastError: null,
  isConfigured: false,

  updatePendingCount: () => {
    const db = getDatabase();
    const count = getPendingCount(db);
    set({ pendingCount: count });
  },

  setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),

  setLastSync: (time: string) => {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO settings (key, value, updated_at) VALUES ('last_sync_at', ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      [time, time]
    );
    set({ lastSyncAt: time });
  },

  setError: (error: string | null) => set({ lastError: error }),

  checkConfiguration: () => {
    const db = getDatabase();
    const url = db.getFirstSync<{ value: string }>(
      "SELECT value FROM settings WHERE key = 'supabase_url'"
    );
    set({ isConfigured: !!url?.value });
  },
}));
