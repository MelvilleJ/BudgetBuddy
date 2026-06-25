import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import * as budgetRepo from '@/db/repositories/budgetRepo';
import * as transactionRepo from '@/db/repositories/transactionRepo';
import type { Budget, CategorySummary } from '@/types/domain';
import { getCurrentMonth, getCurrentYear } from '@/utils/date';

interface BudgetStore {
  budgets: Budget[];
  selectedMonth: number;
  selectedYear: number;
  summary: CategorySummary[];
  totalBudgeted: number;
  totalSpent: number;

  loadBudgets: (month?: number, year?: number) => void;
  updateBudget: (categoryId: string, amount: number) => void;
  setMonth: (month: number, year: number) => void;
}

export const useBudgetStore = create<BudgetStore>((set, get) => ({
  budgets: [],
  selectedMonth: getCurrentMonth(),
  selectedYear: getCurrentYear(),
  summary: [],
  totalBudgeted: 0,
  totalSpent: 0,

  loadBudgets: (month?: number, year?: number) => {
    const db = getDatabase();
    const m = month ?? get().selectedMonth;
    const y = year ?? get().selectedYear;

    const budgets = budgetRepo.getBudgetsByMonth(db, m, y);
    const actuals = transactionRepo.getMonthlyTotalByCategory(db, m, y);
    const actualMap = new Map(actuals.map(a => [a.category_id, a.total]));

    const summary: CategorySummary[] = budgets.map(b => {
      const actual = actualMap.get(b.categoryId) ?? 0;
      return {
        categoryId: b.categoryId,
        categoryName: b.categoryName ?? '',
        groupName: b.groupName ?? '',
        budgetedAmount: b.budgetedAmount,
        actualAmount: actual,
        variance: b.budgetedAmount - actual,
        percentUsed: b.budgetedAmount > 0 ? (actual / b.budgetedAmount) * 100 : 0,
      };
    });

    const totalBudgeted = budgets.reduce((s, b) => s + b.budgetedAmount, 0);
    const totalSpent = summary.reduce((s, c) => s + c.actualAmount, 0);

    set({ budgets, summary, totalBudgeted, totalSpent, selectedMonth: m, selectedYear: y });
  },

  updateBudget: (categoryId: string, amount: number) => {
    const db = getDatabase();
    const { selectedMonth, selectedYear } = get();
    budgetRepo.upsertBudget(db, categoryId, selectedMonth, selectedYear, amount);
    get().loadBudgets();
  },

  setMonth: (month: number, year: number) => {
    set({ selectedMonth: month, selectedYear: year });
    get().loadBudgets(month, year);
  },
}));
