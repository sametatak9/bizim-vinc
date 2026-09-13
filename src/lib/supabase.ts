import { createClient, SupabaseClient } from '@supabase/supabase-js';

const KNOWN_PROJECT_URL = 'https://jimywfjufmrpgnjynhkx.supabase.co';

function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.startsWith('sb_secret_') || rawUrl.includes('placeholder')) {
    return KNOWN_PROJECT_URL;
  }
  let clean = rawUrl.trim();
  // Strip trailing dots and slashes
  clean = clean.replace(/\.+$/, '').replace(/\/+$/, '');
  // Strip /rest/v1 or similar path suffixes
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  // Ensure https://
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
}

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseUrl = normalizeSupabaseUrl(rawEnvUrl);
export const supabaseAnonKey = rawEnvKey || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseUrl.startsWith('https://') &&
      supabaseAnonKey &&
      supabaseAnonKey.trim() !== '' &&
      !supabaseAnonKey.includes('placeholder')
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.error('Supabase initialization error:', err);
      return null;
    }
  }
  return clientInstance;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase Anon Key henüz tanımlanmamış.',
    };
  }

  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase client başlatılamadı.');

    const { data, error } = await sb.from('personnel').select('*').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Supabase bağlantısı başarılı! Ancak tablolar henüz oluşturulmamış (SQL şeması çalıştırılmalı).',
        };
      }
      return { success: false, message: `Supabase hatası: ${error.message}` };
    }

    return {
      success: true,
      message: `Supabase PostgreSQL veritabanı başarıyla bağlandı (${supabaseUrl})!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Bağlantı hatası: ${msg}` };
  }
};
