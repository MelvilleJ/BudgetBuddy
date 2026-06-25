import type { SQLiteDatabase } from 'expo-sqlite';
import type { SavingsContributionRow } from '@/types/database';
import type { SavingsContribution, NewContribution } from '@/types/domain';
import { generateUUID } from '@/utils/uuid';
import { enqueueSync } from './syncQueueRepo';

function toContribution(row: SavingsContributionRow): SavingsContribution {
  return {
    id: row.id,
    savingsGoalId: row.savings_goal_id,
    transactionId: row.transaction_id ?? undefined,
    month: row.month,
    year: row.year,
    amount: row.amount,
    currencyCode: row.currency_code,
  };
}

export function getContributionsByGoal(db: SQLiteDatabase, goalId: string): SavingsContribution[] {
  const rows = db.getAllSync<SavingsContributionRow>(
    `SELECT * FROM savings_contributions
     WHERE savings_goal_id = ? AND is_deleted = 0
     ORDER BY year DESC, month DESC`,
    [goalId]
  );
  return rows.map(toContribution);
}

export function getContributionsByMonth(db: SQLiteDatabase, month: number, year: number): SavingsContribution[] {
  const rows = db.getAllSync<SavingsContributionRow>(
    `SELECT * FROM savings_contributions
     WHERE month = ? AND year = ? AND is_deleted = 0`,
    [month, year]
  );
  return rows.map(toContribution);
}

export function insertContribution(db: SQLiteDatabase, c: NewContribution): string {
  const id = generateUUID();
  const now = new Date().toISOString();

  db.runSync(
    `INSERT INTO savings_contributions (id, savings_goal_id, transaction_id, month, year, amount, currency_code, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [id, c.savingsGoalId, c.transactionId ?? null, c.month, c.year, c.amount, c.currencyCode, now, now]
  );

  enqueueSync(db, 'savings_contributions', id, 'INSERT');
  return id;
}

export function deleteContribution(db: SQLiteDatabase, id: string): void {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE savings_contributions SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?",
    [now, id]
  );
  enqueueSync(db, 'savings_contributions', id, 'DELETE');
}

export function getRunningBalance(db: SQLiteDatabase, goalId: string): number {
  const result = db.getFirstSync<{ total: number }>(
    `SELECT ROUND(COALESCE(SUM(amount), 0), 2) as total
     FROM savings_contributions WHERE savings_goal_id = ? AND is_deleted = 0`,
    [goalId]
  );
  return result?.total ?? 0;
}
