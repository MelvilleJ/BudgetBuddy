import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import * as accountRepo from '@/db/repositories/accountRepo';
import type { Account, NewAccount } from '@/types/domain';

interface AccountWithBalance extends Account {
  balance: number;
}

interface AccountStore {
  accounts: AccountWithBalance[];

  loadAccounts: () => void;
  addAccount: (a: NewAccount) => string;
  updateAccount: (a: Account) => void;
  deleteAccount: (id: string) => void;
  getBalance: (id: string) => number;
  getTotalBalance: () => number;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],

  loadAccounts: () => {
    const db = getDatabase();
    const accounts = accountRepo.getAllAccounts(db);
    const withBalances: AccountWithBalance[] = accounts.map(a => ({
      ...a,
      balance: accountRepo.getAccountBalance(db, a.id),
    }));
    set({ accounts: withBalances });
  },

  addAccount: (a: NewAccount) => {
    const db = getDatabase();
    const id = accountRepo.insertAccount(db, a);
    get().loadAccounts();
    return id;
  },

  updateAccount: (a: Account) => {
    const db = getDatabase();
    accountRepo.updateAccount(db, a);
    get().loadAccounts();
  },

  deleteAccount: (id: string) => {
    const db = getDatabase();
    accountRepo.deleteAccount(db, id);
    get().loadAccounts();
  },

  getBalance: (id: string) => {
    const db = getDatabase();
    return accountRepo.getAccountBalance(db, id);
  },

  getTotalBalance: () => {
    const db = getDatabase();
    return accountRepo.getTotalBalance(db);
  },
}));
