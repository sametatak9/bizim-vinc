import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, Loader2, Save, Sparkles } from 'lucide-react';
import { useERP } from '../lib/store';
import { PAYMENT_CATEGORY_LABELS, PaymentCategory, PaymentObligation } from '../types';
import { CATEGORY_DEFAULTS, OBLIGATION_FIELDS, ObligationField } from '../lib/paymentFieldSchema';

const money = (value: number) => `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
const inputClass = 'mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200';
const labelClass = 'text-[11px] font-bold text-slate-600';

interface ScheduleRow { installmentNo: number; dueDate: string; amount: number }

/** Vade tarihini ay ekleyerek, ayın son gününü aşmayacak şekilde üretir. */
const addMonths = (isoDate: string, months: number, paymentDay?: number) => {
  const base = new Date(`${isoDate}T12:00:00`);
  const target = new Date(base.getFullYear(), base.getMonth() + months, 1, 12, 0, 0);
  const wantedDay = paymentDay || base.getDate();
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(wantedDay, lastDay));
  return target.toISOString().slice(0, 10);
};

export const PaymentPlanWizard: React.FC<{ onCreated?: (obligation: PaymentObligation) => void }> = ({ onCreated }) => {
  const { createPaymentPlan, customers, personnel, cranes } = useERP();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<PaymentCategory>('leasing');
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [extra, setExtra] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<'installment' | 'recurring'>('installment');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [installments, setInstallments] = useState('12');
  const [firstDueDate, setFirstDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [reminderDays, setReminderDays] = useState('2');
  const [currency, setCurrency] = useState('TRY');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [okMessage, setOkMessage] = useState('');

  const fields = OBLIGATION_FIELDS[category];

  useEffect(() => {
    const preset = CATEGORY_DEFAULTS[category];
    setMode(preset.recurring ? 'recurring' : 'installment');
    setInstallments(String(preset.installments));
    setExtra({});
    setRecipientId('');
  }, [category]);

  const count = Math.max(1, Number(installments) || 1);
  const monthly = Number(monthlyAmount.replace(',', '.')) || 0;
  const total = mode === 'recurring' ? monthly * count : Number(totalAmount.replace(',', '.')) || 0;

  const schedule = useMemo<ScheduleRow[]>(() => {
    if (!firstDueDate || (mode === 'recurring' ? monthly <= 0 : total <= 0)) return [];
    const paymentDay = Number(firstDueDate.slice(-2));
    if (mode === 'recurring') {
      return Array.from({ length: count }, (_, index) => ({
        installmentNo: index + 1,
        dueDate: addMonths(firstDueDate, index, paymentDay),
        amount: Math.round(monthly * 100) / 100,
      }));
    }
    const per = Math.floor((total / count) * 100) / 100;
    const rows = Array.from({ length: count }, (_, index) => ({
      installmentNo: index + 1,
      dueDate: addMonths(firstDueDate, index, paymentDay),
      amount: per,
    }));
    const diff = Math.round((total - per * count) * 100) / 100;
    if (diff !== 0 && rows.length) rows[rows.length - 1].amount = Math.round((per + diff) * 100) / 100;
    return rows;
  }, [firstDueDate, mode, monthly, total, count]);

  const missingRequired = fields.filter((f) => f.required && !(f.key === 'recipientId' ? recipientId : extra[f.key]));
  const canSave = Boolean(recipientName.trim() || recipientId) && schedule.length > 0 && missingRequired.length === 0;

  const renderField = (field: ObligationField) => {
    const value = field.key === 'recipientId' ? recipientId : extra[field.key] || '';
    const setValue = (next: string) => {
      if (field.key === 'recipientId') {
        setRecipientId(next);
        const person = personnel.find((p) => p.id === next);
        if (person) setRecipientName(person.fullName);
        return;
      }
      setExtra((prev) => ({ ...prev, [field.key]: next }));
    };
    return (
      <label key={field.key} className="block">
        <span className={labelClass}>{field.label}{field.required ? ' *' : ''}</span>
        {field.type === 'crane' ? (
          <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
            <option value="">Seçilmedi</option>
            {cranes.map((crane) => <option key={crane.id} value={crane.id}>{crane.code} · {crane.type}</option>)}
          </select>
        ) : field.type === 'personnel' ? (
          <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
            <option value="">Personel seçin</option>
            {personnel.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
          </select>
        ) : field.type === 'customer' ? (
          <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
            <option value="">Cari seçin</option>
            {customers.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        ) : field.type === 'select' ? (
          <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
            <option value="">Seçilmedi</option>
            {(field.options || []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <input type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
            value={value} onChange={(e) => setValue(e.target.value)} placeholder={field.placeholder}
            className={inputClass} />
        )}
        {field.hint && <span className="mt-1 block text-[10px] text-slate-500">{field.hint}</span>}
      </label>
    );
  };

  const save = async () => {
    setBusy(true); setError(''); setOkMessage('');
    try {
      const metaFields = fields.filter((f) => f.meta);
      const meta: Record<string, unknown> = {};
      metaFields.forEach((f) => { if (extra[f.key]) meta[f.key] = extra[f.key]; });
      const numberOrUndefined = (raw?: string) => {
        const parsed = Number((raw || '').replace(',', '.'));
        return Number.isFinite(parsed) && raw ? parsed : undefined;
      };
      const created = await createPaymentPlan({
        title: title.trim() || `${PAYMENT_CATEGORY_LABELS[category]} planı`,
        category,
        recipientName: recipientName.trim() || 'Belirtilmedi',
        recipientId: recipientId || undefined,
        institutionName: extra.institutionName || undefined,
        contractNo: extra.contractNo || undefined,
        subscriberNo: extra.subscriberNo || undefined,
        invoiceNo: extra.invoiceNo || undefined,
        invoiceDate: extra.invoiceDate || undefined,
        plate: extra.plate || undefined,
        craneId: extra.craneId || undefined,
        iban: extra.iban || undefined,
        startDate: extra.startDate || firstDueDate,
        endDate: extra.endDate || schedule[schedule.length - 1]?.dueDate,
        interestRate: numberOrUndefined(extra.interestRate),
        totalAmount: Math.round(schedule.reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
        installmentCount: schedule.length,
        paymentDay: Number(firstDueDate.slice(-2)),
        startMonth: `${firstDueDate.slice(0, 7)}-01`,
        currency,
        reminderDaysBefore: Math.max(0, Number(reminderDays) || 2),
        recurring: mode === 'recurring',
        source: 'manuel',
        notes: notes.trim() || undefined,
        meta,
      }, schedule);
      setOkMessage(`${schedule.length} taksitli plan oluşturuldu.`);
      setStep(0); setTitle(''); setRecipientName(''); setRecipientId(''); setExtra({});
      setTotalAmount(''); setMonthlyAmount(''); setNotes('');
      onCreated?.(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Plan oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  const steps = ['Tür ve alıcı', 'Kurum bilgileri', 'Tutar ve taksit', 'Özet'];

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 p-4">
          {steps.map((label, index) => (
            <button key={label} type="button" onClick={() => setStep(index)}
              className={`rounded-xl px-3 py-2 text-[11px] font-black ${step === index ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-white text-emerald-800'}`}>
              {index + 1}. {label}
            </button>
          ))}
        </div>

        <div className="space-y-4 p-4">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={labelClass}>Ödeme türü *</span>
                <select value={category} onChange={(e) => setCategory(e.target.value as PaymentCategory)} className={inputClass}>
                  {(Object.keys(PAYMENT_CATEGORY_LABELS) as PaymentCategory[]).map((key) => (
                    <option key={key} value={key}>{PAYMENT_CATEGORY_LABELS[key]}</option>
                  ))}
                </select>
                <span className="mt-1 block text-[10px] text-slate-500">{CATEGORY_DEFAULTS[category].hint}</span>
              </label>
              <label className="block">
                <span className={labelClass}>Plan başlığı</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${PAYMENT_CATEGORY_LABELS[category]} planı`} className={inputClass} />
              </label>
              <label className="block">
                <span className={labelClass}>Alıcı / ödeme yapılacak taraf *</span>
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Firma, banka veya kişi" className={inputClass} />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map(renderField)}
              <label className="block sm:col-span-2">
                <span className={labelClass}>Not</span>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setMode('installment')}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black ${mode === 'installment' ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-white text-emerald-800'}`}>
                  Taksitli sözleşme (toplam tutar)
                </button>
                <button type="button" onClick={() => setMode('recurring')}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black ${mode === 'recurring' ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-white text-emerald-800'}`}>
                  Aylık tekrar eden ödeme
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {mode === 'installment' ? (
                  <label className="block">
                    <span className={labelClass}>Toplam tutar *</span>
                    <input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} inputMode="decimal" className={inputClass} />
                  </label>
                ) : (
                  <label className="block">
                    <span className={labelClass}>Aylık tutar *</span>
                    <input value={monthlyAmount} onChange={(e) => setMonthlyAmount(e.target.value)} inputMode="decimal" className={inputClass} />
                  </label>
                )}
                <label className="block">
                  <span className={labelClass}>{mode === 'recurring' ? 'Kaç ay planlanacak' : 'Taksit sayısı'} *</span>
                  <input value={installments} onChange={(e) => setInstallments(e.target.value)} inputMode="numeric" className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>İlk vade tarihi *</span>
                  <input type="date" value={firstDueDate} onChange={(e) => setFirstDueDate(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Hatırlatma (gün önce)</span>
                  <input value={reminderDays} onChange={(e) => setReminderDays(e.target.value)} inputMode="numeric" className={inputClass} />
                </label>
                <label className="block">
                  <span className={labelClass}>Para birimi</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass}>
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>

              {schedule.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-emerald-100">
                  <div className="flex items-center justify-between bg-emerald-50 px-3 py-2">
                    <b className="text-[11px] font-black text-emerald-900">Taksit önizlemesi</b>
                    <span className="text-[11px] font-bold text-emerald-800">{schedule.length} taksit · {money(schedule.reduce((s, r) => s + r.amount, 0))}</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-white text-slate-500">
                        <tr><th className="p-2 text-left font-bold">Taksit</th><th className="p-2 text-left font-bold">Vade</th><th className="p-2 text-right font-bold">Tutar</th></tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {schedule.map((row) => (
                          <tr key={row.installmentNo}>
                            <td className="p-2">{row.installmentNo}/{schedule.length}</td>
                            <td className="p-2">{row.dueDate}</td>
                            <td className="p-2 text-right font-bold text-emerald-900">{money(row.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-xs">
              <div className="grid gap-2 sm:grid-cols-2">
                <SummaryRow label="Tür" value={PAYMENT_CATEGORY_LABELS[category]} />
                <SummaryRow label="Başlık" value={title || `${PAYMENT_CATEGORY_LABELS[category]} planı`} />
                <SummaryRow label="Alıcı" value={recipientName || 'Belirtilmedi'} />
                <SummaryRow label="Kurum" value={extra.institutionName || '—'} />
                <SummaryRow label="Sözleşme / abone no" value={extra.contractNo || extra.subscriberNo || '—'} />
                <SummaryRow label="Plan" value={mode === 'recurring' ? `${count} ay tekrar` : `${count} taksit`} />
                <SummaryRow label="İlk vade" value={firstDueDate} />
                <SummaryRow label="Toplam" value={money(schedule.reduce((s, r) => s + r.amount, 0))} />
              </div>
              {missingRequired.length > 0 && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800">
                  Zorunlu alanlar eksik: {missingRequired.map((f) => f.label).join(', ')}
                </p>
              )}
            </div>
          )}

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-bold text-rose-800 break-words">{error}</p>}
          {okMessage && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-800">{okMessage}</p>}

          <div className="flex items-center justify-between gap-2 border-t border-emerald-100 pt-3">
            <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="flex items-center gap-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-800 disabled:opacity-40">
              <ChevronLeft size={13} /> Geri
            </button>
            {step < 3 ? (
              <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black text-white">
                Devam <ChevronRight size={13} />
              </button>
            ) : (
              <button type="button" onClick={save} disabled={!canSave || busy}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black text-white disabled:bg-slate-300">
                {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Planı oluştur
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="h-fit space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-emerald-600" />
          <h3 className="text-sm font-black text-emerald-950">Plan özeti</h3>
        </div>
        <div className="rounded-2xl bg-emerald-50/70 p-3">
          <span className="text-[10px] font-black uppercase text-emerald-700">Toplam yükümlülük</span>
          <b className="mt-1 block text-xl text-emerald-900">{money(schedule.reduce((s, r) => s + r.amount, 0))}</b>
          <span className="text-[10px] text-emerald-800">{schedule.length || 0} taksit · {currency}</span>
        </div>
        <ul className="space-y-2 text-[11px] text-slate-600">
          <li className="flex items-start gap-2"><CalendarClock size={13} className="mt-0.5 shrink-0 text-emerald-600" /> İlk vade {firstDueDate}, son vade {schedule[schedule.length - 1]?.dueDate || '—'}.</li>
          <li>Vadeden {Math.max(0, Number(reminderDays) || 2)} gün önce hatırlatma bildirimi oluşur.</li>
          <li>Onaylanan plan, taksitler tek tek dekontla kapatılana kadar bekleyen ödeme olarak kalır.</li>
        </ul>
      </aside>
    </section>
  );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2">
    <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
    <b className="block break-words text-[12px] text-emerald-950">{value}</b>
  </div>
);
