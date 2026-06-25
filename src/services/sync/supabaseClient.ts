import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getDatabase } from '@/db/database';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;

  const db = getDatabase();
  const url = db.getFirstSync<{ value: string }>("SELECT value FROM settings WHERE key = 'supabase_url'");
  const key = db.getFirstSync<{ value: string }>("SELECT value FROM settings WHERE key = 'supabase_anon_key'");

  if (!url?.value || !key?.value) return null;

  client = createClient(url.value, key.value);
  return client;
}

export function resetSupabaseClient(): void {
  client = null;
}
