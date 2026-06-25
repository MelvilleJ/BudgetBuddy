export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface CategoryRow {
  id: string;
  name: string;
  group_name: string;
  sort_order: number;
  icon: string | null;
  is_default: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface AccountRow {
  id: string;
  name: string;
  institution: string | null;
  account_type: string;
  currency_code: string;
  initial_balance: number;
  is_default: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface TransactionRow {
  id: string;
  date: string;
  month: string;
  year: number;
  category_id: string;
  account_id: string | null;
  description: string | null;
  amount: number;
  currency_code: string;
  type: 'expense' | 'income' | 'transfer';
  receipt_image: string | null;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface BudgetRow {
  id: string;
  category_id: string;
  month: number;
  year: number;
  budgeted_amount: number;
  currency_code: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface SavingsGoalRow {
  id: string;
  name: string;
  target_amount: number | null;
  currency_code: string;
  monthly_target: number;
  sort_order: number;
  is_default: number;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface SavingsContributionRow {
  id: string;
  savings_goal_id: string;
  transaction_id: string | null;
  month: number;
  year: number;
  amount: number;
  currency_code: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}

export interface SyncQueueRow {
  id: number;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: string;
  created_at: string;
  attempts: number;
  last_error: string | null;
}

export interface SettingsRow {
  key: string;
  value: string;
  updated_at: string;
}

export interface MonthlyIncomeRow {
  id: string;
  month: number;
  year: number;
  amount: number;
  currency_code: string;
  is_deleted: number;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
}
