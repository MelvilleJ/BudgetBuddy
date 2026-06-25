import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES, DEFAULT_INCOME, DEFAULT_SAVINGS_GOALS } from '@/constants/categories';
import { generateUUID } from '@/utils/uuid';
import { getCurrentYear } from '@/utils/date';

export function seedDatabase(db: SQLiteDatabase): void {
  const year = getCurrentYear();
  const categoryIds: Record<string, string> = {};

  for (const cat of DEFAULT_CATEGORIES) {
    const id = generateUUID();
    categoryIds[cat.name] = id;
    db.runSync(
      `INSERT INTO categories (id, name, group_name, sort_order, icon, is_default, sync_status)
       VALUES (?, ?, ?, ?, ?, 1, 'pending')`,
      [id, cat.name, cat.group_name, cat.sort_order, cat.icon]
    );

    for (let month = 1; month <= 12; month++) {
      db.runSync(
        `INSERT INTO budgets (id, category_id, month, year, budgeted_amount, sync_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [generateUUID(), id, month, year, cat.budget]
      );
    }
  }

  const accountId = generateUUID();
  db.runSync(
    `INSERT INTO accounts (id, name, institution, account_type, currency_code, initial_balance, is_default, sync_status)
     VALUES (?, 'Primary Account', NULL, 'checking', 'TTD', 0, 1, 'pending')`,
    [accountId]
  );

  for (const goal of DEFAULT_SAVINGS_GOALS) {
    db.runSync(
      `INSERT INTO savings_goals (id, name, target_amount, monthly_target, sort_order, is_default, sync_status)
       VALUES (?, ?, ?, ?, ?, 1, 'pending')`,
      [generateUUID(), goal.name, goal.target_amount, goal.monthly_target, goal.sort_order]
    );
  }

  for (let month = 1; month <= 12; month++) {
    db.runSync(
      `INSERT INTO monthly_income (id, month, year, amount, currency_code, sync_status)
       VALUES (?, ?, ?, ?, 'TTD', 'pending')`,
      [generateUUID(), month, year, DEFAULT_INCOME]
    );
  }
}
