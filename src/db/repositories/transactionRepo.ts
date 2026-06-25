import type { SQLiteDatabase } from 'expo-sqlite';
import type { TransactionRow } from '@/types/database';
import type { Transaction, NewTransaction } from '@/types/domain';
import { generateUUID } from '@/utils/uuid';
import { deriveMonth, deriveYear } from '@/utils/date';
import { enqueueSync } from './syncQueueRepo';

function toTransaction(row: TransactionRow & { category_name?: string; account_name?: string }): Transaction {
  return {
    id: row.id,
    date: row.date,
    month: row.month,
    year: row.year,
    categoryId: row.category_id,
    categoryName: row.category_name,
    accountId: row.account_id ?? undefined,
    accountName: row.account_name,
    description: row.description ?? undefined,
    amount: row.amount,
    currencyCode: row.currency_code,
    type: row.type,
    receiptImage: row.receipt_image ?? undefined,
  };
}

const JOIN_QUERY = `
  SELECT t.*, c.name as category_name, a.name as account_name
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  LEFT JOIN accounts a ON t.account_id = a.id
  WHERE t.is_deleted = 0
`;

export function getAllTransactions(db: SQLiteDatabase): Transaction[] {
  const rows = db.getAllSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} ORDER BY t.date DESC, t.created_at DESC`
  );
  return rows.map(toTransaction);
}

export function getTransactionsByMonth(db: SQLiteDatabase, month: string, year: number): Transaction[] {
  const rows = db.getAllSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} AND t.month = ? AND t.year = ? ORDER BY t.date DESC`,
    [month, year]
  );
  return rows.map(toTransaction);
}

export function getTransactionsByCategory(db: SQLiteDatabase, categoryId: string, month: string, year: number): Transaction[] {
  const rows = db.getAllSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} AND t.category_id = ? AND t.month = ? AND t.year = ? ORDER BY t.date DESC`,
    [categoryId, month, year]
  );
  return rows.map(toTransaction);
}

export function getTransactionsByAccount(db: SQLiteDatabase, accountId: string): Transaction[] {
  const rows = db.getAllSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} AND t.account_id = ? ORDER BY t.date DESC`,
    [accountId]
  );
  return rows.map(toTransaction);
}

export function getRecentTransactions(db: SQLiteDatabase, limit: number = 5): Transaction[] {
  const rows = db.getAllSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
    [limit]
  );
  return rows.map(toTransaction);
}

export function getTransactionById(db: SQLiteDatabase, id: string): Transaction | null {
  const row = db.getFirstSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} AND t.id = ?`,
    [id]
  );
  return row ? toTransaction(row) : null;
}

export function insertTransaction(db: SQLiteDatabase, t: NewTransaction): string {
  const id = generateUUID();
  const now = new Date().toISOString();
  const month = deriveMonth(t.date);
  const year = deriveYear(t.date);

  db.runSync(
    `INSERT INTO transactions (id, date, month, year, category_id, account_id, description, amount, currency_code, type, receipt_image, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [id, t.date, month, year, t.categoryId, t.accountId ?? null, t.description ?? null, t.amount, t.currencyCode, t.type, t.receiptImage ?? null, now, now]
  );

  enqueueSync(db, 'transactions', id, 'INSERT');
  return id;
}

export function updateTransaction(db: SQLiteDatabase, t: Transaction): void {
  const now = new Date().toISOString();
  const month = deriveMonth(t.date);
  const year = deriveYear(t.date);

  db.runSync(
    `UPDATE transactions SET date = ?, month = ?, year = ?, category_id = ?, account_id = ?,
     description = ?, amount = ?, currency_code = ?, type = ?, receipt_image = ?,
     updated_at = ?, sync_status = 'pending'
     WHERE id = ?`,
    [t.date, month, year, t.categoryId, t.accountId ?? null, t.description ?? null, t.amount, t.currencyCode, t.type, t.receiptImage ?? null, now, t.id]
  );

  enqueueSync(db, 'transactions', t.id, 'UPDATE');
}

export function deleteTransaction(db: SQLiteDatabase, id: string): void {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE transactions SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?",
    [now, id]
  );
  enqueueSync(db, 'transactions', id, 'DELETE');
}

export function getMonthlyTotalByCategory(db: SQLiteDatabase, month: number, year: number): { category_id: string; total: number }[] {
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
  return db.getAllSync<{ category_id: string; total: number }>(
    `SELECT category_id, ROUND(SUM(amount), 2) as total
     FROM transactions
     WHERE is_deleted = 0 AND month = ? AND year = ? AND type = 'expense'
     GROUP BY category_id`,
    [monthName, year]
  );
}

export function getMonthlyTotal(db: SQLiteDatabase, month: string, year: number): number {
  const result = db.getFirstSync<{ total: number }>(
    `SELECT ROUND(COALESCE(SUM(amount), 0), 2) as total
     FROM transactions
     WHERE is_deleted = 0 AND month = ? AND year = ? AND type = 'expense'`,
    [month, year]
  );
  return result?.total ?? 0;
}

export function searchTransactions(db: SQLiteDatabase, query: string): Transaction[] {
  const rows = db.getAllSync<TransactionRow & { category_name?: string; account_name?: string }>(
    `${JOIN_QUERY} AND (t.description LIKE ? OR c.name LIKE ?) ORDER BY t.date DESC LIMIT 50`,
    [`%${query}%`, `%${query}%`]
  );
  return rows.map(toTransaction);
}
