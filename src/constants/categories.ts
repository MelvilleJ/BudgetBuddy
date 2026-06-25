export const DEFAULT_CATEGORIES = [
  { name: 'House Contribution', group_name: 'Fixed Commitments', sort_order: 1, icon: 'home', budget: 1000 },
  { name: 'Credit Union', group_name: 'Fixed Commitments', sort_order: 2, icon: 'bank', budget: 2000 },
  { name: 'Gym', group_name: 'Fixed Commitments', sort_order: 3, icon: 'dumbbell', budget: 400 },
  { name: 'Travel', group_name: 'Fixed Commitments', sort_order: 4, icon: 'bus', budget: 500 },
  { name: 'Food & Dining', group_name: 'Essential Needs', sort_order: 5, icon: 'food', budget: 750 },
  { name: 'Phone & Data', group_name: 'Essential Needs', sort_order: 6, icon: 'cellphone', budget: 200 },
  { name: 'Personal Care', group_name: 'Essential Needs', sort_order: 7, icon: 'heart-pulse', budget: 250 },
  { name: 'Entertainment', group_name: 'Lifestyle', sort_order: 8, icon: 'gamepad-variant', budget: 400 },
  { name: 'Clothing & Shopping', group_name: 'Lifestyle', sort_order: 9, icon: 'shopping', budget: 300 },
  { name: 'Emergency Fund', group_name: 'Wealth Building', sort_order: 10, icon: 'shield-check', budget: 600 },
  { name: 'Goals Fund', group_name: 'Wealth Building', sort_order: 11, icon: 'flag-checkered', budget: 1462.36 },
] as const;

export const CATEGORY_GROUPS = [
  'Fixed Commitments',
  'Essential Needs',
  'Lifestyle',
  'Wealth Building',
] as const;

export const DEFAULT_INCOME = 7862.36;

export const DEFAULT_SAVINGS_GOALS = [
  { name: 'Credit Union', monthly_target: 2000, target_amount: null, sort_order: 1 },
  { name: 'Emergency Fund', monthly_target: 600, target_amount: 15000, sort_order: 2 },
  { name: 'Goals Fund', monthly_target: 1462.36, target_amount: null, sort_order: 3 },
] as const;
