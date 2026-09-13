import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Database, RefreshCw, CheckCircle, AlertTriangle, Table } from 'lucide-react';
import { testSupabaseConnection, isSupabaseConfigured, diagnoseSupabaseTables, TableDiagnostic } from '../lib/supabase';
import { useERP } from '../lib/store';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SQL_MIGRATION_SNIPPET = `-- BİZİM VİNÇ ERP - SUPABASE SQL SCHEMA (Tam Kurulum)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabloları Oluştur
CREATE TABLE IF NOT EXISTS public.personnel (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    employee_no TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    kind TEXT NOT NULL DEFAULT 'operator',
    status TEXT NOT NULL DEFAULT 'aktif',
    pool_status TEXT NOT NULL DEFAULT 'musait',
    title TEXT,
    initials TEXT,
    card_slug TEXT,
    documents_ok BOOLEAN DEFAULT TRUE,
    cert_expiring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cranes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'Mobil Vinç',
    status TEXT NOT NULL DEFAULT 'musait',
    capacity TEXT NOT NULL DEFAULT '50 ton',
    operator TEXT,
    site TEXT,
    last_service TEXT,
    lat DOUBLE PRECISION DEFAULT 41.0100,
    lng DOUBLE PRECISION DEFAULT 29.0000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.approvals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    kind TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    title TEXT NOT NULL,
    person_name TEXT NOT NULL,
    person_initials TEXT,
    related_label TEXT,
    note TEXT,
    decision_note TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.receipts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    receipt_no TEXT NOT NULL,
    company TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'kesildi',
    crane_code TEXT,
    site TEXT,
    days_pending INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    detail TEXT,
    amount NUMERIC NOT NULL,
    crane_code TEXT,
    person_name TEXT,
    station_or_supplier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Eksik Sütunları Tamamlama (Önceden oluşturulmuş tablolar için)
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS employee_no TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'operator';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'aktif';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS pool_status TEXT DEFAULT 'musait';
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS card_slug TEXT;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS documents_ok BOOLEAN DEFAULT TRUE;
ALTER TABLE public.personnel ADD COLUMN IF NOT EXISTS cert_expiring BOOLEAN DEFAULT FALSE;

ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Mobil Vinç';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'musait';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS capacity TEXT DEFAULT '50 ton';
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS operator TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS site TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS last_service TEXT;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION DEFAULT 41.0100;
ALTER TABLE public.cranes ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION DEFAULT 29.0000;

-- 3. Yetkiler ve RLS: service_role anahtarı frontend'e konulmaz.
-- RLS açık kalır; authenticated kullanıcılar yalnızca migration'larda tanımlanan
-- rol/personel politikaları kapsamında veri okuyup yazabilir.
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 4. PostgREST şema önbelleğini anında yenile
NOTIFY pgrst, 'reload schema';`;

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { isSupabaseOnline, showToast } = useERP();
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [tableStatus, setTableStatus] = useState<TableDiagnostic[]>([]);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_SNIPPET);
    setCopied(true);
    showToast('Supabase SQL şeması panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const [connRes, diagRes] = await Promise.all([
      testSupabaseConnection(),
      diagnoseSupabaseTables(),
    ]);
    setTestResult(connRes);
    setTableStatus(diagRes.tables);
    setTesting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">
                Supabase Veritabanı Entegrasyonu
              </h2>
              <p className="text-xs text-gray-500">
                Bulut PostgreSQL canlı durum, şema ve bağlantı ayarları
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isSupabaseOnline
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {isSupabaseOnline ? (
              <CheckCircle size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={22} className="text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-bold">
                {isSupabaseOnline
                  ? 'Supabase Canlı Bulut Bağlantısı Aktif'
                  : 'Yerel Güvenli Depolama Devrede (Supabase Bekleniyor)'}
              </h3>
              <p className="text-xs mt-1 leading-relaxed text-gray-700">
                {isSupabaseOnline
                  ? 'Tüm verileriniz doğrudan Supabase PostgreSQL tablolarınızla gerçek zamanlı senkronize ediliyor.'
                  : 'Sistem şu anda hiçbir veri kaybı olmadan tarayıcı yerel belleğinde çalışmaktadır. Supabase anahtarlarınızı girdiğinizde otomatik bulut senkronizasyonuna geçecektir.'}
              </p>
            </div>
          </div>

          {/* Test connection action */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <span className="text-xs font-bold text-gray-800 block">Canlı Bağlantıyı Sına</span>
              <span className="text-[11px] text-gray-500">
                Supabase URL ve Anon Key doğrulaması yapar
              </span>
            </div>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Sınanıyor...' : 'Bağlantıyı Test Et'}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs font-medium border ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.message}
            </div>
          )}

          {/* Table Breakdown Diagnostics */}
          {tableStatus.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Table size={14} className="text-emerald-700" />
                  Supabase Tablo Durumları ({tableStatus.filter((t) => t.exists).length}/5 Aktif)
                </span>
                <span className="text-[10px] text-gray-500">Canlı Denetim</span>
              </div>
              <div className="space-y-1.5">
                {tableStatus.map((t) => (
                  <div
                    key={t.table}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                      t.exists
                        ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {t.exists ? (
                        <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle size={14} className="text-emerald-600 shrink-0" />
                      )}
                      <span className="font-semibold">{t.nameTr}</span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        t.exists ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {t.exists ? 'Bağlı (200 OK)' : 'SQL Bekleniyor'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Setup Guide */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Supabase Kurulum Adımları
            </h4>
            <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside bg-gray-50 p-3 rounded-xl border border-gray-200">
              <li>
                <strong>app.supabase.com</strong> üzerinde yeni bir proje oluşturun.
              </li>
              <li>
                Project Settings &gt; API bölümünden <strong>Project URL</strong> ve <strong>anon key</strong> alın.
              </li>
              <li>
                Projeye ait <code className="bg-gray-200 px-1 py-0.5 rounded">.env</code> veya Settings &gt; Secrets içine ekleyin:
                <div className="font-mono text-[11px] bg-white p-2 rounded border border-gray-200 mt-1 select-all text-emerald-950">
                  VITE_SUPABASE_URL=https://xyz.supabase.co<br />
                  VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
                </div>
              </li>
              <li>
                Aşağıdaki SQL şemasını kopyalayıp Supabase SQL Editor'de bir defa çalıştırın:
              </li>
            </ol>
          </div>

          {/* SQL snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-gray-700">Supabase SQL Tablo Şeması:</span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 rounded-md transition flex items-center gap-1 shadow-xs"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Kopyalandı' : 'SQL Şemasını Kopyala'}
              </button>
            </div>
            <pre className="p-3 bg-gray-900 text-emerald-300 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40 border border-gray-800 select-all">
              {SQL_MIGRATION_SNIPPET}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
