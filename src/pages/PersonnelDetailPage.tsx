import React, { useMemo, useState } from 'react';
import { useERP } from '../lib/store';
import { PersonnelLedgerEntryType } from '../types';
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Clock,
  CreditCard,
  Coffee,
  FileText,
} from 'lucide-react';
import { FINANCE_ROLES } from '../lib/permissions';

interface PersonnelDetailPageProps {
  personnelId: string;
  onNavigateBack: () => void;
}

const ENTRY_TYPE_LABELS: Record<PersonnelLedgerEntryType, string> = {
  yevmiye: 'Yevmiye',
  mesai: 'Mesai',
  odeme: 'Ödeme',
  avans: 'Avans',
  izin: 'İzin',
  diger: 'Diğer',
};

const ENTRY_TYPE_ICONS: Record<PersonnelLedgerEntryType, React.ReactNode> = {
  yevmiye: <Calendar size={14} />,
  mesai: <Clock size={14} />,
  odeme: <CreditCard size={14} />,
  avans: <Wallet size={14} />,
  izin: <Coffee size={14} />,
  diger: <FileText size={14} />,
};

export const PersonnelDetailPage: React.FC<PersonnelDetailPageProps> = ({ personnelId, onNavigateBack }) => {
  const { personnel, personnelLedgerEntries, addLedgerEntry, currentUser, attendance, overtimes, advances, leaves, showToast } = useERP();

  const person = personnel.find((p) => p.id === personnelId);
  const canManageLedger = FINANCE_ROLES.includes(currentUser.role);

  const [form, setForm] = useState({
    entryType: 'yevmiye' as PersonnelLedgerEntryType,
    entryDate: new Date().toISOString().slice(0, 10),
    amount: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const entries = useMemo(
    () => personnelLedgerEntries.filter((e) => e.personnelId === personnelId).sort((a, b) => (a.entryDate < b.entryDate ? -1 : a.entryDate > b.entryDate ? 1 : 0)),
    [personnelLedgerEntries, personnelId]
  );

  // Kronolojik sırayla kümülatif bakiye — cari ekstresi mantığı.
  const withBalance = useMemo(() => {
    let running = 0;
    return entries.map((e) => {
      running += e.amount;
      return { ...e, balanceAfter: running };
    });
  }, [entries]);

  const balance = withBalance.length ? withBalance[withBalance.length - 1].balanceAfter : 0;
  const totalAccrual = entries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = entries.filter((e) => e.amount < 0).reduce((sum, e) => sum + Math.abs(e.amount), 0);

  const feed = useMemo(() => {
    const items: { date: string; label: string }[] = [];
    attendance.filter((a) => a.personId === personnelId).forEach((a) => items.push({ date: a.date, label: `Yoklama: ${a.status}` }));
    overtimes.filter((o) => o.personId === personnelId).forEach((o) => items.push({ date: o.date, label: `Mesai talebi: ${o.totalHours} sa · ${o.status}` }));
    advances.filter((a) => a.personId === personnelId).forEach((a) => items.push({ date: a.requestDate, label: `Avans talebi: ₺${a.amount.toLocaleString('tr-TR')} · ${a.status}` }));
    leaves.filter((l) => l.personId === personnelId).forEach((l) => items.push({ date: l.startDate, label: `İzin: ${l.leaveType} (${l.days} gün) · ${l.status}` }));
    return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)).slice(0, 12);
  }, [attendance, overtimes, advances, leaves, personnelId]);

  if (!person) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <p className="text-slate-500">Personel bulunamadı.</p>
        <button onClick={onNavigateBack} className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-semibold text-sm">
          <ArrowLeft size={16} /> Personel listesine dön
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountValue = Number(form.amount.replace(',', '.'));
    if (!amountValue) {
      showToast('Geçerli bir tutar girin.');
      return;
    }
    // Ödeme ve avans, bakiyeyi azaltan (borç) kayıtlardır; kullanıcı pozitif tutar
    // girer ama defterde negatif işlenir.
    const signedAmount = form.entryType === 'odeme' || form.entryType === 'avans' ? -Math.abs(amountValue) : Math.abs(amountValue);
    setSubmitting(true);
    try {
      await addLedgerEntry({
        personnelId,
        entryType: form.entryType,
        entryDate: form.entryDate,
        amount: signedAmount,
        description: form.description || undefined,
      });
      setForm((prev) => ({ ...prev, amount: '', description: '' }));
    } catch (err) {
      showToast(err instanceof Error ? `Hata: ${err.message}` : 'Defter kaydı eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={onNavigateBack} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800">
        <ArrowLeft size={16} /> Personel listesine dön
      </button>

      {/* Kişi başlığı */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-900 font-black flex items-center justify-center text-lg shrink-0">
            {person.initials}
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">{person.fullName}</h1>
            <p className="text-sm text-slate-500">{person.title} · {person.employeeNo} · <a href={`tel:${person.phone}`} className="hover:text-emerald-700">{person.phone}</a></p>
          </div>
        </div>
        <span className={`self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${person.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : person.status === 'izinli' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
          {person.status === 'aktif' ? 'Aktif' : person.status === 'izinli' ? 'İzinli' : 'Pasif'}
        </span>
      </div>

      {/* Bakiye KPI şeridi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide"><Wallet size={14} /> Güncel Bakiye</div>
          <div className={`mt-2 text-2xl font-black ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>₺{balance.toLocaleString('tr-TR')}</div>
          <p className="mt-1 text-[11px] text-slate-400">{balance >= 0 ? 'Personele borçlu' : 'Personelden alacaklı'}</p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide"><TrendingUp size={14} /> Toplam Hak Ediş</div>
          <div className="mt-2 text-2xl font-black text-slate-900">₺{totalAccrual.toLocaleString('tr-TR')}</div>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide"><TrendingDown size={14} /> Toplam Ödenen</div>
          <div className="mt-2 text-2xl font-black text-slate-900">₺{totalPaid.toLocaleString('tr-TR')}</div>
        </div>
      </div>

      {/* Yeni kayıt formu */}
      {canManageLedger && (
        <form onSubmit={handleSubmit} className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-black text-emerald-950 mb-3">Defter Kaydı Ekle</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={form.entryType}
              onChange={(e) => setForm((prev) => ({ ...prev, entryType: e.target.value as PersonnelLedgerEntryType }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            >
              {(Object.keys(ENTRY_TYPE_LABELS) as PersonnelLedgerEntryType[]).map((type) => (
                <option key={type} value={type}>{ENTRY_TYPE_LABELS[type]}</option>
              ))}
            </select>
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm((prev) => ({ ...prev, entryDate: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Tutar (₺)"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
              required
            />
            <input
              type="text"
              placeholder="Açıklama (opsiyonel)"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition"
          >
            <Plus size={16} /> {submitting ? 'Ekleniyor…' : 'Kaydı Ekle'}
          </button>
          <p className="mt-2 text-[11px] text-slate-400">Ödeme ve avans tutarları otomatik olarak bakiyeden düşülür (negatif işlenir).</p>
        </form>
      )}

      {/* Defter tablosu */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-emerald-50">
          <h2 className="text-sm font-black text-emerald-950">Cari Defter</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="bg-emerald-50/60 text-[11px] font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-100">
                <th className="py-2.5 px-4">Tarih</th>
                <th className="py-2.5 px-4">Tür</th>
                <th className="py-2.5 px-4">Açıklama</th>
                <th className="py-2.5 px-4 text-right">Tutar</th>
                <th className="py-2.5 px-4 text-right">Bakiye</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {[...withBalance].reverse().map((entry) => (
                <tr key={entry.id} className="hover:bg-emerald-50/30">
                  <td className="py-2.5 px-4 font-mono">{entry.entryDate}</td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-700">
                      {ENTRY_TYPE_ICONS[entry.entryType]} {ENTRY_TYPE_LABELS[entry.entryType]}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">{entry.description || '—'}</td>
                  <td className={`py-2.5 px-4 text-right font-mono font-bold ${entry.amount >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {entry.amount >= 0 ? '+' : ''}₺{entry.amount.toLocaleString('tr-TR')}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">₺{entry.balanceAfter.toLocaleString('tr-TR')}</td>
                </tr>
              ))}
              {!withBalance.length && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Henüz defter kaydı yok.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* İş akışı özeti */}
      <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-5">
        <h2 className="text-sm font-black text-emerald-950 mb-3">Son İş Akışı</h2>
        {feed.length ? (
          <ul className="space-y-2">
            {feed.map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-slate-400 w-24 shrink-0">{item.date}</span>
                <span className="text-slate-700">{item.label}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">Kayıtlı puantaj, mesai, avans veya izin talebi yok.</p>
        )}
      </div>
    </div>
  );
};
