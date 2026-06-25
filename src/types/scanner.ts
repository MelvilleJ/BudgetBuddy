export interface ScannedReceipt {
  date: string;
  vendor: string;
  items: { name: string; amount: number }[];
  total: number;
  currency: string;
  suggestedCategory?: string;
}

export interface LLMConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
}
