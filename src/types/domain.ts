export interface Category {
  id: string;
  name: string;
  groupName: string;
  sortOrder: number;
  icon?: string;
  isDefault: boolean;
}

export interface Account {
  id: string;
  name: string;
  institution?: string;
  accountType: 'checking' | 'savings' | 'credit' | 'cash' | 'other';
  currencyCode: string;
  initialBalance: number;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  month: string;
  year: number;
  categoryId: string;
  categoryName?: string;
  accountId?: string;
  accountName?: string;
  description?: string;
  amount: number;
  currencyCode: string;
  type: 'expense' | 'income' | 'transfer';
  receiptImage?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName?: string;
  groupName?: string;
  month: number;
  year: number;
  budgetedAmount: number;
  currencyCode: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount?: number;
  currentBalance: number;
  monthlyTarget: number;
  currencyCode: string;
}

export interface SavingsContribution {
  id: string;
  savingsGoalId: string;
  transactionId?: string;
  month: number;
  year: number;
  amount: number;
  currencyCode: string;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  groupName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  percentUsed: number;
}

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  remaining: number;
  categories: CategorySummary[];
}

export type NewTransaction = Omit<Transaction, 'id' | 'categoryName' | 'accountName'>;
export type NewAccount = Omit<Account, 'id'>;
export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'currentBalance'>;
export type NewContribution = Omit<SavingsContribution, 'id'>;
