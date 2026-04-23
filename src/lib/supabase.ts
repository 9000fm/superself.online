import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!url || !publishableKey) {
    throw new Error('Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)');
  }
  if (!browserClient) {
    browserClient = createClient(url, publishableKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return browserClient;
}

export function getSupabaseServer(): SupabaseClient {
  if (!url || !publishableKey) {
    throw new Error('Supabase env vars missing');
  }
  return createClient(url, publishableKey, {
    auth: { persistSession: false },
  });
}

export type ShoutboxMessage = {
  id: number;
  created_at: string;
  nickname: string;
  body: string;
  country_code: string | null;
  lang: string;
};
