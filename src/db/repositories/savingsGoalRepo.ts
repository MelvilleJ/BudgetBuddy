import type { SQLiteDatabase } from 'expo-sqlite';
import type { SavingsGoalRow } from '@/types/database';
import type { SavingsGoal, NewSavingsGoal } from '@/types/domain';
import { generateUUID } from '@/utils/uuid';
import { enqueueSync } from './syncQueueRepo';

function toSavingsGoal(row: SavingsGoalRow, balance: number): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: row.target_amount ?? undefined,
    currentBalance: balance,
    monthlyTarget: row.monthly_target,
    currencyCode: row.currency_code,
  };
}

function getBalance(db: SQLiteDatabase, goalId: string): number {
  const result = db.getFirstSync<{ total: number }>(
    `SELECT ROUND(COALESCE(SUM(amount), 0), 2) as total
     FROM savings_contributions WHERE savings_goal_id = ? AND is_deleted = 0`,
    [goalId]
  );
  return result?.total ?? 0;
}

export function getAllSavingsGoals(db: SQLiteDatabase): SavingsGoal[] {
  const rows = db.getAllSync<SavingsGoalRow>(
    'SELECT * FROM savings_goals WHERE is_deleted = 0 ORDER BY sort_order'
  );
  return rows.map(row => toSavingsGoal(row, getBalance(db, row.id)));
}

export function getSavingsGoalById(db: SQLiteDatabase, id: string): SavingsGoal | null {
  const row = db.getFirstSync<SavingsGoalRow>(
    'SELECT * FROM savings_goals WHERE id = ? AND is_deleted = 0',
    [id]
  );
  return row ? toSavingsGoal(row, getBalance(db, row.id)) : null;
}

export function insertSavingsGoal(db: SQLiteDatabase, g: NewSavingsGoal): string {
  const id = generateUUID();
  const now = new Date().toISOString();
  const maxOrder = db.getFirstSync<{ max_order: number }>(
    'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM savings_goals WHERE is_deleted = 0'
  );

  db.runSync(
    `INSERT INTO savings_goals (id, name, target_amount, currency_code, monthly_target, sort_order, is_default, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending')`,
    [id, g.name, g.targetAmount ?? null, g.currencyCode, g.monthlyTarget, (maxOrder?.max_order ?? 0) + 1, now, now]
  );
  enqueueSync(db, 'savings_goals', id, 'INSERT');
  return id;
}

export function updateSavingsGoal(db: SQLiteDatabase, id: string, updates: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'monthlyTarget'>>): void {
  const now = new Date().toISOString();
  const fields: string[] = ["updated_at = ?", "sync_status = 'pending'"];
  const values: unknown[] = [now];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.targetAmount !== undefined) { fields.push('target_amount = ?'); values.push(updates.targetAmount); }
  if (updates.monthlyTarget !== undefined) { fields.push('monthly_target = ?'); values.push(updates.monthlyTarget); }

  values.push(id);
  db.runSync(`UPDATE savings_goals SET ${fields.join(', ')} WHERE id = ?`, values as any[]);
  enqueueSync(db, 'savings_goals', id, 'UPDATE');
}

export function deleteSavingsGoal(db: SQLiteDatabase, id: string): void {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE savings_goals SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?",
    [now, id]
  );
  enqueueSync(db, 'savings_goals', id, 'DELETE');
}
