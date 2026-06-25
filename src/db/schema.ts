export const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS categories (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  group_name    TEXT NOT NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  icon          TEXT,
  is_default    INTEGER NOT NULL DEFAULT 0,
  is_deleted    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status   TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS accounts (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  institution     TEXT,
  account_type    TEXT NOT NULL DEFAULT 'checking',
  currency_code   TEXT NOT NULL DEFAULT 'TTD',
  initial_balance REAL NOT NULL DEFAULT 0,
  is_default      INTEGER NOT NULL DEFAULT 0,
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status     TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS transactions (
  id              TEXT PRIMARY KEY,
  date            TEXT NOT NULL,
  month           TEXT NOT NULL,
  year            INTEGER NOT NULL,
  category_id     TEXT NOT NULL REFERENCES categories(id),
  account_id      TEXT REFERENCES accounts(id),
  description     TEXT,
  amount          REAL NOT NULL,
  currency_code   TEXT NOT NULL DEFAULT 'TTD',
  type            TEXT NOT NULL DEFAULT 'expense',
  receipt_image   TEXT,
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status     TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_month_year ON transactions(month, year);
CREATE INDEX IF NOT EXISTS idx_transactions_sync ON transactions(sync_status);

CREATE TABLE IF NOT EXISTS budgets (
  id              TEXT PRIMARY KEY,
  category_id     TEXT NOT NULL REFERENCES categories(id),
  month           INTEGER NOT NULL,
  year            INTEGER NOT NULL,
  budgeted_amount REAL NOT NULL,
  currency_code   TEXT NOT NULL DEFAULT 'TTD',
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status     TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_month_year ON budgets(month, year);

CREATE TABLE IF NOT EXISTS savings_goals (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  target_amount   REAL,
  currency_code   TEXT NOT NULL DEFAULT 'TTD',
  monthly_target  REAL NOT NULL DEFAULT 0,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  is_default      INTEGER NOT NULL DEFAULT 0,
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status     TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS savings_contributions (
  id              TEXT PRIMARY KEY,
  savings_goal_id TEXT NOT NULL REFERENCES savings_goals(id),
  transaction_id  TEXT REFERENCES transactions(id),
  month           INTEGER NOT NULL,
  year            INTEGER NOT NULL,
  amount          REAL NOT NULL,
  currency_code   TEXT NOT NULL DEFAULT 'TTD',
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status     TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal ON savings_contributions(savings_goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_contributions_period ON savings_contributions(month, year);

CREATE TABLE IF NOT EXISTS sync_queue (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name      TEXT NOT NULL,
  record_id       TEXT NOT NULL,
  operation       TEXT NOT NULL,
  payload         TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  attempts        INTEGER NOT NULL DEFAULT 0,
  last_error      TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);

CREATE TABLE IF NOT EXISTS settings (
  key             TEXT PRIMARY KEY,
  value           TEXT NOT NULL,
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS monthly_income (
  id              TEXT PRIMARY KEY,
  month           INTEGER NOT NULL,
  year            INTEGER NOT NULL,
  amount          REAL NOT NULL,
  currency_code   TEXT NOT NULL DEFAULT 'TTD',
  is_deleted      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
  sync_status     TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(month, year)
);
`;
