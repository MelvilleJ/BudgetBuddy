import { getDatabase } from '@/db/database';
import { getSupabaseClient } from './supabaseClient';
import { dequeueSyncBatch, markSyncComplete, markSyncFailed } from '@/db/repositories/syncQueueRepo';
import { useSyncStore } from '@/stores/useSyncStore';

const SYNC_TABLES = [
  'categories',
  'accounts',
  'savings_goals',
  'monthly_income',
  'budgets',
  'transactions',
  'savings_contributions',
];

const MAX_ATTEMPTS = 5;

let syncLock = false;

export async function triggerSync(): Promise<void> {
  if (syncLock) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  syncLock = true;
  const store = useSyncStore.getState();
  store.setSyncing(true);
  store.setError(null);

  try {
    await pushChanges(supabase);
    await pullChanges(supabase);
    store.setLastSync(new Date().toISOString());
  } catch (e) {
    store.setError(e instanceof Error ? e.message : 'Sync failed');
  } finally {
    syncLock = false;
    store.setSyncing(false);
    store.updatePendingCount();
  }
}

async function pushChanges(supabase: any): Promise<void> {
  const db = getDatabase();
  let batch = dequeueSyncBatch(db, 50);

  while (batch.length > 0) {
    for (const entry of batch) {
      if (entry.attempts >= MAX_ATTEMPTS) {
        markSyncComplete(db, entry.id);
        continue;
      }

      try {
        const payload = JSON.parse(entry.payload);
        const { sync_status, ...cleanPayload } = payload;

        if (entry.operation === 'DELETE') {
          const { error } = await supabase
            .from(entry.table_name)
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', entry.record_id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from(entry.table_name)
            .upsert(cleanPayload, { onConflict: 'id' });
          if (error) throw error;
        }

        markSyncComplete(db, entry.id);
        db.runSync(
          "UPDATE " + entry.table_name + " SET sync_status = 'synced' WHERE id = ?",
          [entry.record_id]
        );
      } catch (e) {
        markSyncFailed(db, entry.id, e instanceof Error ? e.message : 'Unknown error');
      }
    }

    batch = dequeueSyncBatch(db, 50);
  }
}

async function pullChanges(supabase: any): Promise<void> {
  const db = getDatabase();
  const lastSyncRow = db.getFirstSync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'last_sync_at'"
  );
  const lastSyncAt = lastSyncRow?.value ?? '1970-01-01T00:00:00Z';

  for (const tableName of SYNC_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .gt('updated_at', lastSyncAt);

      if (error) throw error;
      if (!data || data.length === 0) continue;

      for (const remoteRecord of data) {
        const localRecord = db.getFirstSync<{ id: string; sync_status: string; updated_at: string }>(
          `SELECT id, sync_status, updated_at FROM ${tableName} WHERE id = ?`,
          [remoteRecord.id]
        );

        if (!localRecord) {
          const columns = Object.keys(remoteRecord);
          const placeholders = columns.map(() => '?').join(', ');
          const values = columns.map(c => remoteRecord[c]);
          db.runSync(
            `INSERT OR IGNORE INTO ${tableName} (${columns.join(', ')}, sync_status) VALUES (${placeholders}, 'synced')`,
            values
          );
        } else if (localRecord.sync_status === 'synced') {
          const columns = Object.keys(remoteRecord).filter(c => c !== 'id');
          const setClause = columns.map(c => `${c} = ?`).join(', ');
          const values = columns.map(c => remoteRecord[c]);
          values.push(remoteRecord.id);
          db.runSync(
            `UPDATE ${tableName} SET ${setClause}, sync_status = 'synced' WHERE id = ?`,
            values
          );
        } else if (localRecord.sync_status === 'pending') {
          const remoteTime = new Date(remoteRecord.updated_at).getTime();
          const localTime = new Date(localRecord.updated_at).getTime();

          if (remoteTime > localTime) {
            const columns = Object.keys(remoteRecord).filter(c => c !== 'id');
            const setClause = columns.map(c => `${c} = ?`).join(', ');
            const values = columns.map(c => remoteRecord[c]);
            values.push(remoteRecord.id);
            db.runSync(
              `UPDATE ${tableName} SET ${setClause}, sync_status = 'synced' WHERE id = ?`,
              values
            );
            db.runSync(
              'DELETE FROM sync_queue WHERE table_name = ? AND record_id = ?',
              [tableName, remoteRecord.id]
            );
          }
        }
      }
    } catch (e) {
      console.warn(`Pull failed for ${tableName}:`, e);
    }
  }
}
