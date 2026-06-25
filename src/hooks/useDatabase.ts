import { useState, useEffect } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { initializeDatabase } from '@/db/database';

export function useDatabase() {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const database = await initializeDatabase();
        setDb(database);
        setIsReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to initialize database');
      }
    })();
  }, []);

  return { db, isReady, error };
}
