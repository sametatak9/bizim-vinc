import React, { useMemo, useRef, useState } from 'react';
import { useERP } from '../lib/store';
import { CraneDocumentType } from '../types';
import { ArrowLeft, Truck, Upload, FileText, Copy, Check, ExternalLink, ShieldAlert, CalendarClock } from 'lucide-react';
import { OFFICE_ROLES } from '../lib/permissions';

interface FleetDetailPageProps {
  craneId: string;
  onNavigateBack: () => void;
  onNavigate?: (path: string) => void;
}

const DOC_TYPE_LABELS: Record<CraneDocumentType, string> = {
  ruhsat: 'Ruhsat',
  trafik_sigorta: 'Trafik Sigortası',
  kasko: 'Kasko / All Risk',
  muayene: 'Periyodik Muayene',
  tum_evraklar: 'Tüm Evraklar (birleşik)',
  diger: 'Diğer',
};

const COUNTERS: { key: 'trafikSigortaBitis' | 'kaskoBitis' | 'muayeneBitis' | 'periyodikKontrolBitis' | 'bakimSonraki'; label: string }[] = [
  { key: 'trafikSigortaBitis', label: 'Trafik Sigortası Bitiş' },
  { key: 'kaskoBitis', label: 'Kasko / All Risk Bitiş' },
  { key: 'muayeneBitis', label: 'Muayene Bitiş' },
  { key: 'periyodikKontrolBitis', label: 'Periyodik Kontrol Bitiş' },
  { key: 'bakimSonraki', label: 'Sonraki Bakım' },
];

function counterState(dateStr?: string | null) {
  if (!dateStr) return { label: 'Tarih girilmemiş', className: 'bg-slate-100 text-slate-500', urgent: false };
  const days = Math.ceil((new Date(`${dateStr}T23:59:59`).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: `${Math.abs(days)} gün önce geçti`, className: 'bg-rose-100 text-rose-700', urgent: true };
  if (days <= 30) return { label: `${days} gün kaldı`, className: 'bg-amber-100 text-amber-800', urgent: true };
  return { label: `${days} gün kaldı`, className: 'bg-emerald-100 text-emerald-700', urgent: false };
}

export const FleetDetailPage: React.FC<FleetDetailPageProps> = ({ craneId, onNavigateBack, onNavigate }) => {
  const { cranes, craneDocuments, uploadCraneDocument, currentUser, showToast, jobReceipts, expenses } = useERP();
  const crane = cranes.find((c) => c.id === craneId);
  const canManage = OFFICE_ROLES.includes(currentUser.role);
  const [uploadType, setUploadType] = useState<CraneDocumentType>('ruhsat');
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documents = useMemo(
    () => craneDocuments.filter((d) => d.craneId === craneId).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')),
    [craneDocuments, craneId]
  );

  const recentJobs = useMemo(
    () => jobReceipts.filter((r) => r.craneId === craneId || r.craneCode === crane?.code).slice(0, 8),
    [jobReceipts, craneId, crane?.code]
  );
  const recentExpenses = useMemo(
    () => expenses.filter((e) => e.craneCode === crane?.code).slice(0, 8),
    [expenses, crane?.code]
  );

  if (!crane) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-slate-500">Araç bulunamadı.</p>
        <button onClick={onNavigateBack} className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-semibold text-sm">
          <ArrowLeft size={16} /> Filo listesine dön
        </button>
      </div>
    );
  }

  const cardUrl = crane.cardSlug ? `${window.location.origin}/filo-kart/${crane.cardSlug}` : null;
  const handleCopyLink = () => {
    if (!cardUrl) return;
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadCraneDocument(craneId, uploadType, file);
    } catch (err) {
      showToast(err instanceof Error ? `Hata: ${err.message}` : 'Belge yüklenemedi.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={onNavigateBack} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
        <ArrowLeft size={16} /> Filo listesine dön
      </button>

      {/* Araç başlığı */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
            <Truck size={26} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 font-mono">{crane.plate || crane.code}</h1>
            <p className="text-sm text-slate-500">{crane.type} · {crane.capacity} · {crane.brand}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cardUrl && (
            <>
              <button onClick={handleCopyLink} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Kopyalandı' : 'Kartvizit linkini kopyala'}
              </button>
              <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold">
                <ExternalLink size={14} /> Kartviziti gör
              </a>
            </>
          )}
        </div>
      </div>

      {/* Sayaçlar */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-black text-emerald-950 mb-3 flex items-center gap-2"><CalendarClock size={16} className="text-emerald-600" /> Bakım & Belge Sayaçları</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {COUNTERS.map(({ key, label }) => {
            const state = counterState(crane[key]);
            return (
              <div key={key} className="rounded-xl border border-slate-100 p-3">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{label}</div>
                <div className="mt-1 text-sm font-mono text-slate-800">{crane[key] ? new Date(crane[key] as string).toLocaleDateString('tr-TR') : '—'}</div>
                <span className={`inline-flex items-center gap-1 mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${state.className}`}>
                  {state.urgent && <ShieldAlert size={10} />} {state.label}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-slate-400">Bitiş tarihi girilmemiş sayaçlar, gerçek poliçe/muayene belgesi elle incelenip tarih girilene kadar "bilinmiyor" gösterir — tahmini tarih yazılmaz.</p>
      </div>

      {/* Belge yükleme */}
      {canManage && (
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-black text-emerald-950 mb-3">Belge Yükle</h2>
          <div className="flex flex-wrap items-center gap-2">
            <select value={uploadType} onChange={(e) => setUploadType(e.target.value as CraneDocumentType)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm">
              {(Object.keys(DOC_TYPE_LABELS) as CraneDocumentType[]).map((t) => (
                <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
              ))}
            </select>
            <input ref={fileInputRef} type="file" accept="application/pdf" onChange={handleFileSelected} disabled={uploading} className="text-xs" />
            {uploading && <span className="text-xs text-slate-500">Yükleniyor…</span>}
          </div>
        </div>
      )}

      {/* Belge listesi */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-emerald-50 flex items-center justify-between">
          <h2 className="text-sm font-black text-emerald-950">Araç Özlüğü — Belgeler</h2>
          <span className="text-[11px] text-slate-400">{documents.length} belge</span>
        </div>
        {documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Bu araç için henüz belge yüklenmedi.</div>
        ) : (
          <ul className="divide-y divide-emerald-50">
            {documents.map((doc) => (
              <li key={doc.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText size={15} className="text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800">{DOC_TYPE_LABELS[doc.documentType]}</div>
                    <div className="text-[11px] text-slate-400 truncate">{doc.fileName}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono text-slate-500">{doc.documentDate ? new Date(doc.documentDate).toLocaleDateString('tr-TR') : '—'}</div>
                  <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${doc.isSensitive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                    {doc.isSensitive ? 'Gizli' : 'Kartvizitte görünür'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Operasyon özeti */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-black text-emerald-950 mb-3 flex items-center justify-between">
          <span>Son İş Kayıtları</span>
          {onNavigate && <button onClick={() => onNavigate('/filo')} className="text-[11px] font-bold text-emerald-700">Filoya dön</button>}
        </h2>
        {recentJobs.length === 0 && recentExpenses.length === 0 ? (
          <p className="text-xs text-slate-400">Bu araca ait iş makbuzu veya masraf kaydı yok.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {recentJobs.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="font-mono text-slate-400 w-24 shrink-0">{r.date}</span>
                <span className="text-slate-700">İş makbuzu: {r.customerName} · {r.workingHours || r.hoursWorked || 0} saat · {r.status}</span>
              </li>
            ))}
            {recentExpenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3">
                <span className="font-mono text-slate-400 w-24 shrink-0">{e.createdAt?.slice(0, 10)}</span>
                <span className="text-slate-700">{e.category === 'yakit' ? 'Yakıt' : 'Masraf'}: ₺{e.amount.toLocaleString('tr-TR')} · {e.detail || e.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
