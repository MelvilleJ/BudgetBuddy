import type { SQLiteDatabase } from 'expo-sqlite';
import type { AccountRow } from '@/types/database';
import type { Account, NewAccount } from '@/types/domain';
import { generateUUID } from '@/utils/uuid';
import { enqueueSync } from './syncQueueRepo';

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution ?? undefined,
    accountType: row.account_type as Account['accountType'],
    currencyCode: row.currency_code,
    initialBalance: row.initial_balance,
    isDefault: row.is_default === 1,
  };
}

export function getAllAccounts(db: SQLiteDatabase): Account[] {
  const rows = db.getAllSync<AccountRow>(
    'SELECT * FROM accounts WHERE is_deleted = 0 ORDER BY is_default DESC, name'
  );
  return rows.map(toAccount);
}

export function getAccountById(db: SQLiteDatabase, id: string): Account | null {
  const row = db.getFirstSync<AccountRow>(
    'SELECT * FROM accounts WHERE id = ? AND is_deleted = 0',
    [id]
  );
  return row ? toAccount(row) : null;
}

export function getAccountBalance(db: SQLiteDatabase, id: string): number {
  const result = db.getFirstSync<{ balance: number }>(
    `SELECT a.initial_balance + COALESCE(
       (SELECT SUM(CASE
         WHEN t.type = 'income' THEN t.amount
         WHEN t.type = 'expense' THEN -t.amount
         ELSE 0
       END)
       FROM transactions t WHERE t.account_id = a.id AND t.is_deleted = 0), 0
     ) as balance
     FROM accounts a WHERE a.id = ? AND a.is_deleted = 0`,
    [id]
  );
  return Math.round((result?.balance ?? 0) * 100) / 100;
}

export function insertAccount(db: SQLiteDatabase, a: NewAccount): string {
  const id = generateUUID();
  const now = new Date().toISOString();

  if (a.isDefault) {
    db.runSync("UPDATE accounts SET is_default = 0, updated_at = ?, sync_status = 'pending' WHERE is_default = 1", [now]);
  }

  db.runSync(
    `INSERT INTO accounts (id, name, institution, account_type, currency_code, initial_balance, is_default, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [id, a.name, a.institution ?? null, a.accountType, a.currencyCode, a.initialBalance, a.isDefault ? 1 : 0, now, now]
  );

  enqueueSync(db, 'accounts', id, 'INSERT');
  return id;
}

export function updateAccount(db: SQLiteDatabase, a: Account): void {
  const now = new Date().toISOString();

  if (a.isDefault) {
    db.runSync("UPDATE accounts SET is_default = 0, updated_at = ?, sync_status = 'pending' WHERE is_default = 1 AND id != ?", [now, a.id]);
  }

  db.runSync(
    `UPDATE accounts SET name = ?, institution = ?, account_type = ?, currency_code = ?,
     initial_balance = ?, is_default = ?, updated_at = ?, sync_status = 'pending'
     WHERE id = ?`,
    [a.name, a.institution ?? null, a.accountType, a.currencyCode, a.initialBalance, a.isDefault ? 1 : 0, now, a.id]
  );

  enqueueSync(db, 'accounts', a.id, 'UPDATE');
}

export function deleteAccount(db: SQLiteDatabase, id: string): void {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE accounts SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?",
    [now, id]
  );
  enqueueSync(db, 'accounts', id, 'DELETE');
}

export function getTotalBalance(db: SQLiteDatabase): number {
  const accounts = getAllAccounts(db);
  return accounts.reduce((sum, a) => sum + getAccountBalance(db, a.id), 0);
}
