import { create } from 'zustand';
import { getDatabase } from '@/db/database';
import type { SettingsRow } from '@/types/database';

interface SettingsStore {
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  defaultCurrency: string;
  monthlyIncome: number;
  loaded: boolean;

  loadSettings: () => void;
  updateSetting: (key: string, value: string) => void;
  getLLMConfig: () => { baseUrl: string; model: string; apiKey: string };
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  llmBaseUrl: '',
  llmModel: '',
  llmApiKey: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  defaultCurrency: 'TTD',
  monthlyIncome: 7862.36,
  loaded: false,

  loadSettings: () => {
    const db = getDatabase();
    const rows = db.getAllSync<SettingsRow>('SELECT * FROM settings');
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    set({
      llmBaseUrl: settings['llm_base_url'] ?? '',
      llmModel: settings['llm_model'] ?? '',
      llmApiKey: settings['llm_api_key'] ?? '',
      supabaseUrl: settings['supabase_url'] ?? '',
      supabaseAnonKey: settings['supabase_anon_key'] ?? '',
      defaultCurrency: settings['default_currency'] ?? 'TTD',
      monthlyIncome: parseFloat(settings['monthly_income'] ?? '7862.36'),
      loaded: true,
    });
  },

  updateSetting: (key: string, value: string) => {
    const db = getDatabase();
    db.runSync(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
      [key, value, value]
    );

    const keyMap: Record<string, string> = {
      llm_base_url: 'llmBaseUrl',
      llm_model: 'llmModel',
      llm_api_key: 'llmApiKey',
      supabase_url: 'supabaseUrl',
      supabase_anon_key: 'supabaseAnonKey',
      default_currency: 'defaultCurrency',
      monthly_income: 'monthlyIncome',
    };

    const stateKey = keyMap[key];
    if (stateKey) {
      set({ [stateKey]: stateKey === 'monthlyIncome' ? parseFloat(value) : value } as any);
    }
  },

  getLLMConfig: () => {
    const state = get();
    return { baseUrl: state.llmBaseUrl, model: state.llmModel, apiKey: state.llmApiKey };
  },
}));
