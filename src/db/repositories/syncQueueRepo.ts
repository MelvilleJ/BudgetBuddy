import type { SQLiteDatabase } from 'expo-sqlite';
import type { SyncQueueRow } from '@/types/database';

export function enqueueSync(
  db: SQLiteDatabase,
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
): void {
  const row = db.getFirstSync(
    `SELECT * FROM ${tableName} WHERE id = ?`,
    [recordId]
  );
  const payload = row ? JSON.stringify(row) : '{}';
  db.runSync(
    `INSERT INTO sync_queue (table_name, record_id, operation, payload, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [tableName, recordId, operation, payload]
  );
}

export function dequeueSyncBatch(db: SQLiteDatabase, batchSize: number = 50): SyncQueueRow[] {
  return db.getAllSync<SyncQueueRow>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT ?',
    [batchSize]
  );
}

export function markSyncComplete(db: SQLiteDatabase, id: number): void {
  db.runSync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export function markSyncFailed(db: SQLiteDatabase, id: number, error: string): void {
  db.runSync(
    'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
    [error, id]
  );
}

export function getPendingCount(db: SQLiteDatabase): number {
  const result = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM sync_queue');
  return result?.count ?? 0;
}

export function clearCompletedForRecord(db: SQLiteDatabase, tableName: string, recordId: string): void {
  db.runSync(
    'DELETE FROM sync_queue WHERE table_name = ? AND record_id = ?',
    [tableName, recordId]
  );
}
