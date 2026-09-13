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

const rawEnvUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';
const rawEnvKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

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

export function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface TableDiagnostic {
  table: string;
  nameTr: string;
  exists: boolean;
  canRead: boolean;
  canWrite: boolean;
  rowCount: number;
  message?: string;
}

export const diagnoseSupabaseTables = async (): Promise<{
  connected: boolean;
  tables: TableDiagnostic[];
  allReady: boolean;
}> => {
  if (!isSupabaseConfigured()) {
    return { connected: false, tables: [], allReady: false };
  }

  const sb = getSupabase();
  if (!sb) {
    return { connected: false, tables: [], allReady: false };
  }

  const targetTables = [
    { table: 'personnel', nameTr: 'Personel (personnel)' },
    { table: 'cranes', nameTr: 'Vinç Filosu (cranes)' },
    { table: 'approvals', nameTr: 'Onay Talepleri (approvals)' },
    { table: 'receipts', nameTr: 'Makbuzlar (receipts)' },
    { table: 'expenses', nameTr: 'Masraflar & Yakıt (expenses)' },
  ];

  const results: TableDiagnostic[] = [];

  for (const t of targetTables) {
    try {
      const { data, error, status } = await sb.from(t.table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01' || status === 404) {
          results.push({
            table: t.table,
            nameTr: t.nameTr,
            exists: false,
            canRead: false,
            canWrite: false,
            rowCount: 0,
            message: 'Tablo henüz oluşturulmamış (SQL çalıştırılmalı)',
          });
        } else {
          results.push({
            table: t.table,
            nameTr: t.nameTr,
            exists: true,
            canRead: false,
            canWrite: false,
            rowCount: 0,
            message: `Yetki/Okuma hatası: ${error.message}`,
          });
        }
      } else {
        // Table exists and can read
        results.push({
          table: t.table,
          nameTr: t.nameTr,
          exists: true,
          canRead: true,
          canWrite: true, // will be confirmed when migration is run
          rowCount: data ? data.length : 0,
          message: 'Aktif ve bağlı',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        table: t.table,
        nameTr: t.nameTr,
        exists: false,
        canRead: false,
        canWrite: false,
        rowCount: 0,
        message: msg,
      });
    }
  }

  const allReady = results.length > 0 && results.every((r) => r.exists && r.canRead);

  return {
    connected: true,
    tables: results,
    allReady,
  };
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
