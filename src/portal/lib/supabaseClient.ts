import { createClient } from '@supabase/supabase-js';
import { PortalUserAccount, UserProfile } from '../types/portalTypes';
import { mapAccountToUserProfile, mapDbRowToPortalAccount } from '../utils/portalAuth';

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
 * Universal Sync Helper: Loads all persisted portal state keys in a single query
 */
export async function fetchAllRemoteState(): Promise<Record<string, unknown> | null> {
  try {
    const { data, error } = await supabase
      .from('pk_portal_state')
      .select('key, data');

    if (error) {
      console.warn('[SupabaseSync] fetchAll error:', error.message);
      return null;
    }

    if (data && Array.isArray(data)) {
      const result: Record<string, unknown> = {};
      for (const row of data) {
        if (row && typeof row.key === 'string') {
          result[row.key] = row.data;
        }
      }
      return result;
    }
  } catch (err) {
    console.warn('[SupabaseSync] fetchAll network exception:', err);
  }
  return null;
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

export async function fetchMyPortalProfile(userId: string): Promise<{
  profile: UserProfile | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('pk_portal_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return { profile: null, error: error.message };
    }
    if (!data) {
      return { profile: null, error: 'Account profile not provisioned in pk_portal_users. Contact Super Admin.' };
    }

    const account = mapDbRowToPortalAccount(data as Record<string, unknown>);
    return { profile: mapAccountToUserProfile(account) };
  } catch (err) {
    return { profile: null, error: err instanceof Error ? err.message : 'Failed to load profile' };
  }
}

export async function fetchAllPortalUsers(): Promise<{
  users: PortalUserAccount[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('pk_portal_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { users: [], error: error.message };
    }

    const users = Array.isArray(data)
      ? data.map(row => mapDbRowToPortalAccount(row as Record<string, unknown>))
      : [];
    return { users };
  } catch (err) {
    return { users: [], error: err instanceof Error ? err.message : 'Failed to load users' };
  }
}

export interface AdminUserMutationPayload {
  action: 'create_user' | 'update_user' | 'delete_user';
  userId?: string;
  email?: string;
  password?: string;
  fullName?: string;
  role?: string;
  roleTitle?: string;
  plant?: string;
  allowedModules?: string[];
  isActive?: boolean;
}

export async function invokeAdminUsersFunction(payload: AdminUserMutationPayload): Promise<{
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  edgeFunctionMissing?: boolean;
}> {
  try {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: payload,
    });

    if (error) {
      const msg = error.message || 'Edge function call failed';
      const isMissing = msg.includes('Failed to send a request') || msg.includes('404') || msg.includes('NOT_FOUND');
      return { success: false, error: msg, edgeFunctionMissing: isMissing };
    }

    if (data && typeof data === 'object' && 'error' in data && data.error) {
      return { success: false, error: String(data.error) };
    }

    return { success: true, data: (data as Record<string, unknown>) || {} };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error calling admin-users';
    return {
      success: false,
      error: msg,
      edgeFunctionMissing: msg.includes('Failed to fetch') || msg.includes('Failed to send'),
    };
  }
}
