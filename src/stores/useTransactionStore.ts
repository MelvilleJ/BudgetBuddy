import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import * as transactionRepo from '@/db/repositories/transactionRepo';
import type { Transaction, NewTransaction } from '@/types/domain';
import { getMonthName } from '@/utils/date';

interface TransactionFilters {
  month?: number;
  year?: number;
  categoryId?: string;
  accountId?: string;
  search?: string;
}

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  filters: TransactionFilters;

  loadTransactions: () => void;
  addTransaction: (t: NewTransaction) => string;
  updateTransaction: (t: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setFilters: (f: Partial<TransactionFilters>) => void;
  getRecentTransactions: (limit?: number) => Transaction[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  filters: {},

  loadTransactions: () => {
    set({ isLoading: true });
    const db = getDatabase();
    const { filters } = get();

    let transactions: Transaction[];

    if (filters.search) {
      transactions = transactionRepo.searchTransactions(db, filters.search);
    } else if (filters.month && filters.year) {
      const monthName = getMonthName(filters.month);
      if (filters.categoryId) {
        transactions = transactionRepo.getTransactionsByCategory(db, filters.categoryId, monthName, filters.year);
      } else {
        transactions = transactionRepo.getTransactionsByMonth(db, monthName, filters.year);
      }
    } else if (filters.accountId) {
      transactions = transactionRepo.getTransactionsByAccount(db, filters.accountId);
    } else {
      transactions = transactionRepo.getAllTransactions(db);
    }

    set({ transactions, isLoading: false });
  },

  addTransaction: (t: NewTransaction) => {
    const db = getDatabase();
    const id = transactionRepo.insertTransaction(db, t);
    get().loadTransactions();
    return id;
  },

  updateTransaction: (t: Transaction) => {
    const db = getDatabase();
    transactionRepo.updateTransaction(db, t);
    get().loadTransactions();
  },

  deleteTransaction: (id: string) => {
    const db = getDatabase();
    transactionRepo.deleteTransaction(db, id);
    get().loadTransactions();
  },

  setFilters: (f: Partial<TransactionFilters>) => {
    set(state => ({ filters: { ...state.filters, ...f } }));
    get().loadTransactions();
  },

  getRecentTransactions: (limit = 5) => {
    const db = getDatabase();
    return transactionRepo.getRecentTransactions(db, limit);
  },
}));
