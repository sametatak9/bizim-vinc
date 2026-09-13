import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const KNOWN_PROJECT_URL = 'https://jimywfjufmrpgnjynhkx.supabase.co';

function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl || rawUrl.startsWith('sb_secret_') || rawUrl.includes('placeholder')) {
    return KNOWN_PROJECT_URL;
  }
  let clean = rawUrl.trim();
  clean = clean.replace(/\.+$/, '').replace(/\/+$/, '');
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
}

// Check both window.localStorage, import.meta.env, and process.env
const getEnvOrStorage = (key: string, storageKey: string): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(storageKey);
    if (saved && saved.trim()) return saved.trim();
  }
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env?.[key] : '';
  if (metaEnv) return metaEnv;
  const procEnv = typeof process !== 'undefined' ? process.env?.[key] : '';
  return procEnv || '';
};

export const getActiveSupabaseUrl = (): string => {
  const raw = getEnvOrStorage('VITE_SUPABASE_URL', 'bv_custom_supabase_url');
  return normalizeSupabaseUrl(raw);
};

export const getActiveSupabaseKey = (): string => {
  return getEnvOrStorage('VITE_SUPABASE_ANON_KEY', 'bv_custom_supabase_key');
};

export const supabaseUrl = getActiveSupabaseUrl();
export const supabaseAnonKey = getActiveSupabaseKey();

export const isSupabaseConfigured = (): boolean => {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();
  return Boolean(
    url &&
      url.startsWith('https://') &&
      key &&
      key.trim() !== '' &&
      !key.includes('placeholder')
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseKey();

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        db: {
          schema: 'public',
        },
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

export function setCustomSupabaseCredentials(url: string, key: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('bv_custom_supabase_url', url);
    if (key) localStorage.setItem('bv_custom_supabase_key', key);
    clientInstance = null; // reset client to re-initialize
  }
}

export function clearCustomSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bv_custom_supabase_url');
    localStorage.removeItem('bv_custom_supabase_key');
    clientInstance = null;
  }
}

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
    { table: 'profiles', nameTr: 'Kullanıcı Profilleri (profiles)' },
    { table: 'personnel', nameTr: 'Personel (personnel)' },
    { table: 'cranes', nameTr: 'Vinç Filosu (cranes)' },
    { table: 'approvals', nameTr: 'Onay Talepleri (approvals)' },
    { table: 'attendance', nameTr: 'Günlük Yoklama (attendance)' },
    { table: 'leaves', nameTr: 'İzin Talepleri (leaves)' },
    { table: 'overtimes', nameTr: 'Mesai Kayıtları (overtimes)' },
    { table: 'advances', nameTr: 'Avans Talepleri (advances)' },
    { table: 'puantaj', nameTr: 'Aylık Puantaj (puantaj)' },
    { table: 'receipts', nameTr: 'Makbuzlar (receipts)' },
    { table: 'expenses', nameTr: 'Masraflar & Yakıt (expenses)' },
    { table: 'audit_logs', nameTr: 'Denetim Günlüğü (audit_logs)' },
    { table: 'notifications', nameTr: 'Bildirimler (notifications)' },
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
        results.push({
          table: t.table,
          nameTr: t.nameTr,
          exists: true,
          canRead: true,
          canWrite: true,
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
      message: 'Supabase Anon Key henüz tanımlanmamış. Supabase Ayarları penceresinden girebilirsiniz.',
    };
  }

  try {
    const sb = getSupabase();
    if (!sb) throw new Error('Supabase client başlatılamadı.');

    const { error } = await sb.from('personnel').select('*').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Supabase bağlantısı başarılı! Ancak tablolar henüz oluşturulmamış (SQL göç betiği çalıştırılmalı).',
        };
      }
      return { success: false, message: `Supabase yanıt hatası: ${error.message}` };
    }

    return {
      success: true,
      message: `Supabase PostgreSQL veritabanı başarıyla bağlandı (${getActiveSupabaseUrl()})!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Bağlantı hatası: ${msg}` };
  }
};
