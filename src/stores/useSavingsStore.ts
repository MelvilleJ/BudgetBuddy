import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import * as savingsGoalRepo from '@/db/repositories/savingsGoalRepo';
import * as savingsContributionRepo from '@/db/repositories/savingsContributionRepo';
import type { SavingsGoal, SavingsContribution, NewSavingsGoal, NewContribution } from '@/types/domain';

interface SavingsStore {
  goals: SavingsGoal[];
  contributions: Record<string, SavingsContribution[]>;

  loadGoals: () => void;
  addGoal: (g: NewSavingsGoal) => string;
  updateGoal: (id: string, updates: Partial<Pick<SavingsGoal, 'name' | 'targetAmount' | 'monthlyTarget'>>) => void;
  deleteGoal: (id: string) => void;
  loadContributions: (goalId: string) => void;
  addContribution: (c: NewContribution) => string;
  deleteContribution: (id: string, goalId: string) => void;
  getTotalSaved: () => number;
}

export const useSavingsStore = create<SavingsStore>((set, get) => ({
  goals: [],
  contributions: {},

  loadGoals: () => {
    const db = getDatabase();
    const goals = savingsGoalRepo.getAllSavingsGoals(db);
    set({ goals });
  },

  addGoal: (g: NewSavingsGoal) => {
    const db = getDatabase();
    const id = savingsGoalRepo.insertSavingsGoal(db, g);
    get().loadGoals();
    return id;
  },

  updateGoal: (id, updates) => {
    const db = getDatabase();
    savingsGoalRepo.updateSavingsGoal(db, id, updates);
    get().loadGoals();
  },

  deleteGoal: (id: string) => {
    const db = getDatabase();
    savingsGoalRepo.deleteSavingsGoal(db, id);
    get().loadGoals();
  },

  loadContributions: (goalId: string) => {
    const db = getDatabase();
    const contribs = savingsContributionRepo.getContributionsByGoal(db, goalId);
    set(state => ({
      contributions: { ...state.contributions, [goalId]: contribs },
    }));
  },

  addContribution: (c: NewContribution) => {
    const db = getDatabase();
    const id = savingsContributionRepo.insertContribution(db, c);
    get().loadGoals();
    get().loadContributions(c.savingsGoalId);
    return id;
  },

  deleteContribution: (id: string, goalId: string) => {
    const db = getDatabase();
    savingsContributionRepo.deleteContribution(db, id);
    get().loadGoals();
    get().loadContributions(goalId);
  },

  getTotalSaved: () => {
    return get().goals.reduce((sum, g) => sum + g.currentBalance, 0);
  },
}));
