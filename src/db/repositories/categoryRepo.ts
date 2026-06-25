import type { SQLiteDatabase } from 'expo-sqlite';
import type { CategoryRow } from '@/types/database';
import type { Category } from '@/types/domain';
import { generateUUID } from '@/utils/uuid';
import { enqueueSync } from './syncQueueRepo';

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    groupName: row.group_name,
    sortOrder: row.sort_order,
    icon: row.icon ?? undefined,
    isDefault: row.is_default === 1,
  };
}

export function getAllCategories(db: SQLiteDatabase): Category[] {
  const rows = db.getAllSync<CategoryRow>(
    'SELECT * FROM categories WHERE is_deleted = 0 ORDER BY sort_order'
  );
  return rows.map(toCategory);
}

export function getCategoriesByGroup(db: SQLiteDatabase, groupName: string): Category[] {
  const rows = db.getAllSync<CategoryRow>(
    'SELECT * FROM categories WHERE is_deleted = 0 AND group_name = ? ORDER BY sort_order',
    [groupName]
  );
  return rows.map(toCategory);
}

export function getCategoryById(db: SQLiteDatabase, id: string): Category | null {
  const row = db.getFirstSync<CategoryRow>(
    'SELECT * FROM categories WHERE id = ? AND is_deleted = 0',
    [id]
  );
  return row ? toCategory(row) : null;
}

export function insertCategory(
  db: SQLiteDatabase,
  name: string,
  groupName: string,
  sortOrder: number,
  icon?: string
): string {
  const id = generateUUID();
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO categories (id, name, group_name, sort_order, icon, is_default, created_at, updated_at, sync_status)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'pending')`,
    [id, name, groupName, sortOrder, icon ?? null, now, now]
  );
  enqueueSync(db, 'categories', id, 'INSERT');
  return id;
}

export function updateCategory(db: SQLiteDatabase, id: string, updates: Partial<Pick<Category, 'name' | 'groupName' | 'sortOrder' | 'icon'>>): void {
  const now = new Date().toISOString();
  const fields: string[] = ["updated_at = ?", "sync_status = 'pending'"];
  const values: unknown[] = [now];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.groupName !== undefined) { fields.push('group_name = ?'); values.push(updates.groupName); }
  if (updates.sortOrder !== undefined) { fields.push('sort_order = ?'); values.push(updates.sortOrder); }
  if (updates.icon !== undefined) { fields.push('icon = ?'); values.push(updates.icon); }

  values.push(id);
  db.runSync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values as any[]);
  enqueueSync(db, 'categories', id, 'UPDATE');
}

export function deleteCategory(db: SQLiteDatabase, id: string): void {
  const now = new Date().toISOString();
  db.runSync(
    "UPDATE categories SET is_deleted = 1, updated_at = ?, sync_status = 'pending' WHERE id = ?",
    [now, id]
  );
  enqueueSync(db, 'categories', id, 'DELETE');
}
