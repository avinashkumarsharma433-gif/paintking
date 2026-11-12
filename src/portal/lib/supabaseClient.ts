import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL) || 'https://iklgqagswphcuwhqgvwd.supabase.co';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY) || 'sb_publishable_G0jPc8zm51IKh__dU5rk9A_YdgONIK7';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Universal Sync Helper: Loads state from Supabase with fallback to localStorage
 */
export async function fetchRemoteState<T>(key: string, localFallback: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('pk_portal_state')
      .select('data')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn(`[SupabaseSync] fetch error for ${key}:`, error.message);
      return localFallback;
    }

    if (data && data.data) {
      return data.data as T;
    }
  } catch (err) {
    console.warn(`[SupabaseSync] network exception for ${key}:`, err);
  }
  return localFallback;
}

/**
 * Universal Sync Helper: Persists state to Supabase in background
 */
export async function persistRemoteState(key: string, data: unknown, updatedBy?: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('pk_portal_state')
      .upsert({
        key,
        data,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy || 'factory-terminal',
      });

    if (error) {
      console.warn(`[SupabaseSync] persist error for ${key}:`, error.message);
    }
  } catch (err) {
    console.warn(`[SupabaseSync] network exception for ${key}:`, err);
  }
}
