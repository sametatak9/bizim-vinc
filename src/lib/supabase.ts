import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
      supabaseUrl.trim() !== '' &&
      !supabaseUrl.includes('placeholder') &&
      supabaseAnonKey &&
      supabaseAnonKey.trim() !== ''
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase URL veya Anon Key henüz .env veya Settings panelinde tanımlanmamış.',
    };
  }

  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase client başlatılamadı.');

    const { error } = await sb.from('personnel').select('id').limit(1);
    if (error) {
      // If table does not exist, connection is alive but migration needed
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Supabase bağlantısı aktif! Ancak tablolar henüz oluşturulmamış (SQL migration çalıştırılmalı).',
        };
      }
      return { success: false, message: `Supabase hatası: ${error.message}` };
    }

    return {
      success: true,
      message: 'Supabase PostgreSQL veritabanı başarıyla bağlandı ve sorgulandı!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Bağlantı hatası: ${msg}` };
  }
};
