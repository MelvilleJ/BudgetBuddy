import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { seedDatabase } from '@/services/seed/seedData';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('budgettracker.db');
    db.execSync('PRAGMA journal_mode = WAL');
    db.execSync('PRAGMA foreign_keys = ON');
  }
  return db;
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const database = getDatabase();
  database.execSync(CREATE_TABLES_SQL);

  const seeded = database.getFirstSync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    ['seeded']
  );

  if (!seeded) {
    seedDatabase(database);
    database.runSync(
      "INSERT INTO settings (key, value, updated_at) VALUES ('seeded', 'true', datetime('now'))"
    );
  }

  return database;
}
