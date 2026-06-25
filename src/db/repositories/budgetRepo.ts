import type { SQLiteDatabase } from 'expo-sqlite';
import type { BudgetRow } from '@/types/database';
import type { Budget } from '@/types/domain';
import { generateUUID } from '@/utils/uuid';
import { enqueueSync } from './syncQueueRepo';

function toBudget(row: BudgetRow & { category_name?: string; group_name?: string }): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    groupName: row.group_name,
    month: row.month,
    year: row.year,
    budgetedAmount: row.budgeted_amount,
    currencyCode: row.currency_code,
  };
}

export function getBudgetsByMonth(db: SQLiteDatabase, month: number, year: number): Budget[] {
  const rows = db.getAllSync<BudgetRow & { category_name: string; group_name: string }>(
    `SELECT b.*, c.name as category_name, c.group_name
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.month = ? AND b.year = ? AND b.is_deleted = 0 AND c.is_deleted = 0
     ORDER BY c.sort_order`,
    [month, year]
  );
  return rows.map(toBudget);
}

export function getBudgetForCategory(db: SQLiteDatabase, categoryId: string, month: number, year: number): Budget | null {
  const row = db.getFirstSync<BudgetRow & { category_name: string; group_name: string }>(
    `SELECT b.*, c.name as category_name, c.group_name
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.category_id = ? AND b.month = ? AND b.year = ? AND b.is_deleted = 0`,
    [categoryId, month, year]
  );
  return row ? toBudget(row) : null;
}

export function upsertBudget(db: SQLiteDatabase, categoryId: string, month: number, year: number, amount: number, currencyCode: string = 'TTD'): string {
  const existing = db.getFirstSync<BudgetRow>(
    'SELECT * FROM budgets WHERE category_id = ? AND month = ? AND year = ? AND is_deleted = 0',
    [categoryId, month, year]
  );

  const now = new Date().toISOString();

  if (existing) {
    db.runSync(
      `UPDATE budgets SET budgeted_amount = ?, currency_code = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
      [amount, currencyCode, now, existing.id]
    );
    enqueueSync(db, 'budgets', existing.id, 'UPDATE');
    return existing.id;
  }

  const id = generateUUID();
  db.runSync(
    `INSERT INTO budgets (id, category_id, month, year, budgeted_amount, currency_code, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [id, categoryId, month, year, amount, currencyCode, now, now]
  );
  enqueueSync(db, 'budgets', id, 'INSERT');
  return id;
}

export function getTotalBudgetForMonth(db: SQLiteDatabase, month: number, year: number): number {
  const result = db.getFirstSync<{ total: number }>(
    `SELECT ROUND(COALESCE(SUM(budgeted_amount), 0), 2) as total
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.month = ? AND b.year = ? AND b.is_deleted = 0 AND c.is_deleted = 0`,
    [month, year]
  );
  return result?.total ?? 0;
}

export function getAnnualBudget(db: SQLiteDatabase, year: number): Budget[] {
  const rows = db.getAllSync<BudgetRow & { category_name: string; group_name: string }>(
    `SELECT b.*, c.name as category_name, c.group_name
     FROM budgets b
     JOIN categories c ON b.category_id = c.id
     WHERE b.year = ? AND b.is_deleted = 0 AND c.is_deleted = 0
     ORDER BY c.sort_order, b.month`,
    [year]
  );
  return rows.map(toBudget);
}
