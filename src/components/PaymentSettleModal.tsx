import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, FileUp, Landmark, Loader2, Receipt, X } from 'lucide-react';
import { useERP } from '../lib/store';
import { PAYMENT_CATEGORY_LABELS, PAYMENT_CHANNEL_LABELS, Payment, PaymentChannel, PaymentReceiptDoc } from '../types';

const money = (value: number) => `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
const DOC_TYPES: { value: PaymentReceiptDoc['docType']; label: string }[] = [
  { value: 'dekont', label: 'Banka dekontu' },
  { value: 'fatura', label: 'Fatura' },
  { value: 'makbuz', label: 'Makbuz / tahsilat belgesi' },
  { value: 'ekstre', label: 'Hesap ekstresi' },
  { value: 'diger', label: 'Diğer belge' },
];

interface Props {
  payment: Payment;
  onClose: () => void;
}

/** Dekont yüklenmeden kapatılamayan ödeme kaydı penceresi. */
export const PaymentSettleModal: React.FC<Props> = ({ payment, onClose }) => {
  const { settlePayment } = useERP();
  const [paidAmount, setPaidAmount] = useState(String(payment.amount));
  const [channel, setChannel] = useState<PaymentChannel>('havale_eft');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccount, setBankAccount] = useState(payment.bankAccount || '');
  const [referenceNo, setReferenceNo] = useState('');
  const [institutionName, setInstitutionName] = useState(payment.institutionName || '');
  const [invoiceNo, setInvoiceNo] = useState(payment.invoiceNo || '');
  const [docType, setDocType] = useState<PaymentReceiptDoc['docType']>('dekont');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const amountValue = Number(paidAmount.replace(',', '.')) || 0;
  const diff = useMemo(() => Math.round((amountValue - payment.amount) * 100) / 100, [amountValue, payment.amount]);
  const canSubmit = Boolean(file) && amountValue > 0 && Boolean(paymentDate) && !busy;

  const pickFile = (selected: File | null) => {
    setError('');
    if (!selected) { setFile(null); return; }
    const okType = selected.type.startsWith('image/') || selected.type === 'application/pdf';
    if (!okType) { setError('Yalnızca PDF veya görsel (JPG, PNG, WEBP) yükleyebilirsiniz.'); return; }
    if (selected.size > 20 * 1024 * 1024) { setError('Belge boyutu en fazla 20 MB olabilir.'); return; }
    setFile(selected);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) { setError('Dekont veya ödeme belgesi yüklemeden ödeme kapatılamaz.'); return; }
    setBusy(true); setError('');
    try {
      await settlePayment(payment.id, {
        paidAmount: amountValue,
        paymentChannel: channel,
        paymentDate,
        bankAccount: bankAccount.trim() || undefined,
        referenceNo: referenceNo.trim() || undefined,
        institutionName: institutionName.trim() || undefined,
        invoiceNo: invoiceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        docType,
        file,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödeme kaydedilemedi.');
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[4000] flex items-start justify-center overflow-y-auto bg-emerald-950/60 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-8 w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 rounded-t-3xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-5 text-white">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-200">Ödeme kaydı</p>
            <h2 className="mt-1 text-xl font-black leading-tight break-words">{payment.recipientName}</h2>
            <p className="mt-1 text-xs text-emerald-50/85">
              {PAYMENT_CATEGORY_LABELS[payment.category]} · Vade {payment.dueDate}
              {payment.installmentCount ? ` · Taksit ${payment.installmentNo || 1}/${payment.installmentCount}` : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/25 bg-white/10 p-2 hover:bg-white/20" aria-label="Kapat">
            <X size={16} />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-900">
            <AlertTriangle size={14} className="mr-1 inline" />
            Ödeme yalnızca dekont / ödeme belgesi yüklendiğinde kapatılabilir. Belge muhasebe arşivine kaydedilir.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Plan tutarı</span>
              <div className="mt-1 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 text-sm font-black text-emerald-900">{money(payment.amount)}</div>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Ödenen tutar *</span>
              <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} inputMode="decimal" required
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            </label>
          </div>

          {amountValue > 0 && diff !== 0 && (
            <p className={`rounded-xl px-3 py-2 text-[11px] font-bold ${diff < 0 ? 'bg-amber-50 text-amber-900' : 'bg-sky-50 text-sky-900'}`}>
              {diff < 0
                ? `Kısmi ödeme: plan tutarından ${money(Math.abs(diff))} eksik. Kalan için yeni taksit satırı planlamanız gerekir.`
                : `Plan tutarından ${money(diff)} fazla ödeme kaydediyorsunuz.`}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Ödeme kanalı *</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value as PaymentChannel)}
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200">
                {(Object.keys(PAYMENT_CHANNEL_LABELS) as PaymentChannel[]).map((key) => (
                  <option key={key} value={key}>{PAYMENT_CHANNEL_LABELS[key]}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Ödeme tarihi *</span>
              <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Banka / hesap</span>
              <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="Vakıf Katılım - Ana hesap"
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Dekont / referans no</span>
              <input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Kurum / firma</span>
              <input value={institutionName} onChange={(e) => setInstitutionName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Fatura no</span>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Belge türü</span>
              <select value={docType} onChange={(e) => setDocType(e.target.value as PaymentReceiptDoc['docType'])}
                className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200">
                {DOC_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Dekont / belge dosyası *</span>
              <div className={`mt-1 flex items-center gap-3 rounded-xl border-2 border-dashed px-3 py-2.5 ${file ? 'border-emerald-300 bg-emerald-50/60' : 'border-rose-200 bg-rose-50/40'}`}>
                <FileUp size={16} className={file ? 'text-emerald-600' : 'text-rose-500'} />
                <input type="file" accept="image/*,application/pdf" onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  className="w-full text-[11px] file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-[11px] file:font-bold file:text-white" />
              </div>
              <span className="mt-1 block text-[10px] text-slate-500 break-words">
                {file ? `${file.name} · ${(file.size / 1024).toFixed(0)} KB` : 'PDF veya görsel, en fazla 20 MB. Zorunlu alan.'}
              </span>
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold text-slate-600">Açıklama</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
          </label>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800 break-words">{error}</p>}
        </div>

        <footer className="flex flex-col gap-2 rounded-b-3xl border-t border-emerald-100 bg-emerald-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <Landmark size={13} className="text-emerald-600" />
            Kayıt sonrası ödeme, dekontu ile birlikte raporlarda görünür.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-black text-emerald-800">Vazgeç</button>
            <button type="submit" disabled={!canSubmit}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
              {busy ? 'Kaydediliyor' : 'Dekontu yükle ve ödemeyi kapat'}
            </button>
          </div>
        </footer>
      </form>
    </div>,
    document.body
  );
};
