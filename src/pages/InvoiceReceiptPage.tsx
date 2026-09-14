import React, { useMemo, useState } from 'react';
import { useERP } from '../lib/store';
import {
  FileText,
  Receipt,
  Truck,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from 'lucide-react';
import { downloadExcelReport, downloadHtmlReport, printReport } from '../lib/reporting';

type DocTab = 'makbuz' | 'irsaliye' | 'fatura';

const COMPANY = {
  name: 'BİZİM VİNÇ',
  slogan: 'En derinden, en yükseklere',
  address: 'Türkiye — Saha Operasyon Merkezi',
  taxLabel: 'Vergi / Ticaret bilgisi (yönetim panelinden güncellenir)',
};

export const InvoiceReceiptPage: React.FC = () => {
  const {
    jobReceipts,
    invoices,
    customers,
    cranes,
    personnel,
    currentUser,
    addJobReceipt,
    addCustomer,
    approveJobReceipt,
    rejectJobReceipt,
    createInvoiceFromReceipts,
    updateInvoiceStatus,
    stats,
    showToast,
  } = useERP();

  const [tab, setTab] = useState<DocTab>('makbuz');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'invoiced'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<{
    type: DocTab;
    title: string;
    no: string;
    date: string;
    customer: string;
    taxNo?: string;
    lines: { label: string; qty?: string; amount: number }[];
    note?: string;
    kdvRate: number;
  } | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [wCustomer, setWCustomer] = useState('');
  const [wCrane, setWCrane] = useState('');
  const [wOperator, setWOperator] = useState(currentUser.personnelId || '');
  const [wSite, setWSite] = useState('');
  const [wStart, setWStart] = useState('08:00');
  const [wEnd, setWEnd] = useState('17:00');
  const [wHours, setWHours] = useState(8);
  const [wNote, setWNote] = useState('');
  const [wFrom, setWFrom] = useState('');
  const [wTo, setWTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerTaxNo, setNewCustomerTaxNo] = useState('');

  const createCustomerForDocument = async () => {
    if (!newCustomerName.trim()) return showToast('Cari ünvanı zorunludur.');
    try {
      const customer = await addCustomer({ title: newCustomerName.trim(), name: newCustomerName.trim(), vknTckn: newCustomerTaxNo.trim() || undefined, taxNo: newCustomerTaxNo.trim() || undefined, phone: '', type: 'musteri', balance: 0 });
      setWCustomer(customer.id);
      setNewCustomerName(''); setNewCustomerTaxNo(''); setNewCustomerOpen(false);
      showToast('✓ Cari oluşturuldu ve belgeye seçildi.');
    } catch (error) { showToast(`Cari oluşturulamadı: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
  };

  const filteredReceipts = useMemo(() => {
    let list = [...jobReceipts];
    if (filter === 'pending') list = list.filter((r) => r.status === 'pending_approval' || (r.status as string) === 'beklemede' || r.status === 'pending');
    if (filter === 'approved') list = list.filter((r) => r.status === 'approved' || (r.status as string) === 'onaylandi');
    if (filter === 'invoiced') list = list.filter((r) => r.invoiced);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.receiptNo || '').toLowerCase().includes(q) ||
          (r.customerName || '').toLowerCase().includes(q) ||
          (r.craneCode || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobReceipts, filter, search]);

  const filteredInvoices = useMemo(() => {
    let list = [...invoices];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.invoiceNo || '').toLowerCase().includes(q) ||
          (r.customerName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, search]);

  const openPreviewFromReceipt = (r: (typeof jobReceipts)[0], type: DocTab = 'makbuz') => {
    setPreview({
      type,
      title: type === 'makbuz' ? 'İŞ MAKBUZU' : type === 'irsaliye' ? 'İRSALİYE' : 'FATURA',
      no: r.receiptNo || r.id.slice(0, 8),
      date: r.date || new Date().toISOString().slice(0, 10),
      customer: r.customerName || 'Müşteri',
      lines: [
        {
          label: `${r.craneCode || 'Vinç'} — ${r.hoursWorked || 0} saat saha işi`,
          qty: `${r.hoursWorked || 0} sa`,
          amount: Number(r.amount) || 0,
        },
      ],
      note: r.note,
      kdvRate: 20,
    });
  };

  const openPreviewFromInvoice = (inv: (typeof invoices)[0]) => {
    setPreview({
      type: 'fatura',
      title: 'FATURA',
      no: inv.invoiceNo || inv.id.slice(0, 8),
      date: inv.issueDate || inv.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      customer: inv.customerName || 'Müşteri',
      lines: [{ label: inv.notes || 'Hizmet bedeli', amount: Number(inv.subtotal || inv.totalAmount) || 0 }],
      note: inv.notes,
      kdvRate: Number(inv.taxRate) || 20,
    });
  };

  const subtotal = preview ? preview.lines.reduce((s, l) => s + (l.amount || 0), 0) : 0;
  const kdv = preview ? subtotal * (preview.kdvRate / 100) : 0;
  const total = subtotal + kdv;

  const createMakbuz = async () => {
    if (!wCustomer || !wCrane || !wOperator || !wSite.trim() || !wStart || !wEnd || busy) {
      showToast('Makbuz için cari, şantiye, başlangıç/bitiş saati, operatör ve vinç zorunludur.');
      return;
    }
    setBusy(true);
    try {
      const cust = customers.find((c) => c.id === wCustomer);
      const crane = cranes.find((c) => c.id === wCrane);
      const operator = personnel.find((p) => p.id === wOperator);
      const [startHour, startMinute] = wStart.split(':').map(Number);
      const [endHour, endMinute] = wEnd.split(':').map(Number);
      const calculatedHours = Math.max(0, ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60);
      if (!operator || !crane || calculatedHours <= 0) {
        showToast('Operatör, vinç ve geçerli saat aralığı seçilmelidir.');
        return;
      }
      await addJobReceipt({
        customerId: wCustomer,
        customerName: cust?.title || cust?.name || 'Müşteri',
        siteName: wSite.trim(),
        craneId: wCrane || undefined,
        craneCode: crane.code,
        operatorId: operator.id,
        operatorName: operator.fullName,
        date: new Date().toISOString().slice(0, 10),
        startTime: wStart,
        endTime: wEnd,
        workingHours: calculatedHours,
        hoursWorked: calculatedHours,
        amount: 0,
        status: 'pending',
        invoiced: false,
        note:
          tab === 'irsaliye'
            ? `İrsaliye: ${wFrom || '-'} → ${wTo || '-'} | ${wNote}`
            : wNote || 'Çalışma/puantaj evrakı',
      });
      showToast(tab === 'irsaliye' ? '✓ İrsaliye kaydı oluşturuldu' : '✓ İş makbuzu oluşturuldu');
      setWizardOpen(false);
      setStep(1);
      setWCustomer('');
      setWCrane('');
      setWOperator(currentUser.personnelId || '');
      setWSite('');
      setWStart('08:00');
      setWEnd('17:00');
      setWHours(8);
      setWNote('');
      setWFrom('');
      setWTo('');
    } catch (e) {
      showToast('Kayıt başarısız: ' + (e instanceof Error ? e.message : 'hata'));
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveJobReceipt(id);
      showToast('✓ Makbuz onaylandı');
    } catch (e) {
      showToast('Onay hatası');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const reason = window.prompt('Red gerekçesi:');
      if (!reason?.trim()) return;
      await rejectJobReceipt(id, reason.trim());
      showToast('Makbuz reddedildi');
    } catch (e) {
      showToast('Red hatası');
    }
  };

  const handleBatchInvoice = async () => {
    if (selectedIds.length === 0) return;
    setBusy(true);
    try {
      await createInvoiceFromReceipts(selectedIds, new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), '');
      showToast(`✓ ${selectedIds.length} makbuz faturalandı`);
      setSelectedIds([]);
      setTab('fatura');
    } catch (e) {
      showToast('Fatura oluşturma hatası');
    } finally {
      setBusy(false);
    }
  };

  const exportDocuments = (format: 'excel' | 'html' | 'print') => {
    const isInvoice = tab === 'fatura';
    const columns = isInvoice ? [{ key: 'no', label: 'Fatura No' }, { key: 'date', label: 'Tarih' }, { key: 'customer', label: 'Cari' }, { key: 'amount', label: 'Tutar' }, { key: 'status', label: 'Durum' }] : [{ key: 'no', label: 'Belge No' }, { key: 'date', label: 'Tarih' }, { key: 'customer', label: 'Cari' }, { key: 'crane', label: 'Vinç' }, { key: 'site', label: 'Şantiye' }, { key: 'status', label: 'Durum' }];
    const rows = isInvoice ? filteredInvoices.map((item) => ({ no: item.invoiceNo, date: item.issueDate, customer: item.customerName, amount: `${item.totalAmount.toLocaleString('tr-TR')} ₺`, status: item.status })) : filteredReceipts.map((item) => ({ no: item.receiptNo, date: item.date, customer: item.customerName, crane: item.craneCode, site: item.siteName || '-', status: item.status }));
    const title = tab === 'makbuz' ? 'Bizim Vinç İş Makbuzu Arşivi' : tab === 'irsaliye' ? 'Bizim Vinç İrsaliye Arşivi' : 'Bizim Vinç Fatura Arşivi';
    if (format === 'excel') downloadExcelReport(`belge-arsivi-${tab}`, title, columns, rows);
    else if (format === 'html') downloadHtmlReport(`belge-arsivi-${tab}`, title, columns, rows);
    else printReport(title, columns, rows);
  };

  const tabBtn = (id: DocTab, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
        tab === id
          ? 'bg-emerald-600 text-white shadow-xs'
          : 'bg-white text-slate-600 border border-emerald-100 hover:bg-emerald-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-document, .print-document * { visibility: visible !important; }
          .print-document { position: absolute; left: 0; top: 0; width: 210mm; padding: 12mm; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      <header className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Finansal Operasyon</div>
          <h1 className="text-xl font-black text-slate-800">Makbuz · İrsaliye · Fatura</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İş makbuzu → onay → fatura hattı. Belge önizleme ve A4 yazdırma desteklenir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setWizardOpen(true);
              setStep(1);
              setTab(tab === 'fatura' ? 'makbuz' : tab);
            }}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Plus size={14} /> Yeni Makbuz
          </button>
          {tab === 'fatura' && selectedIds.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={handleBatchInvoice}
              className="px-3 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
            >
              Seçilenleri Faturalandır ({selectedIds.length})
            </button>
          )}
        </div>
      </header>

      <div className="no-print flex flex-wrap gap-2">
        {tabBtn('makbuz', 'İş Makbuzları', <Receipt size={14} />)}
        {tabBtn('irsaliye', 'İrsaliye', <Truck size={14} />)}
        {tabBtn('fatura', 'Faturalar', <FileText size={14} />)}
      </div>

      <div className="no-print flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="No, müşteri, vinç ara..."
            className="w-full pl-8 pr-3 py-2 border border-emerald-100 rounded-xl text-xs bg-white"
          />
        </div>
        {tab === 'makbuz' && (
          <div className="flex gap-1">
            {(['all', 'pending', 'approved', 'invoiced'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${
                  filter === f ? 'bg-emerald-100 text-emerald-900' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'Hepsi' : f === 'pending' ? 'Bekleyen' : f === 'approved' ? 'Onaylı' : 'Faturalı'}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1 sm:ml-auto"><button type="button" onClick={() => exportDocuments('excel')} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">Excel</button><button type="button" onClick={() => exportDocuments('html')} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold">HTML</button><button type="button" onClick={() => exportDocuments('print')} className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-white text-[11px] font-bold"><Printer size={12} className="inline mr-1" />PDF / Yazdır</button></div>
      </div>

      {tab === 'makbuz' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden no-print">
          <div className="overflow-x-auto table-wrap">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">No</th>
                  <th className="p-3">Tarih</th>
                  <th className="p-3">Müşteri</th>
                  <th className="p-3">Şantiye</th>
                  <th className="p-3">Operatör</th>
                  <th className="p-3">Vinç</th>
                  <th className="p-3">Çalışma</th>
                  <th className="p-3 text-center">Durum</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Kayıt yok
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r) => (
                    <tr key={r.id} className="hover:bg-emerald-50/40">
                      <td className="p-3 font-mono font-bold text-emerald-900">{r.receiptNo}</td>
                      <td className="p-3">{r.date}</td>
                      <td className="p-3 font-medium">{r.customerName}</td>
                      <td className="p-3">{r.siteName || '—'}</td>
                      <td className="p-3">{r.operatorName || '—'}</td>
                      <td className="p-3">{r.craneCode}</td>
                      <td className="p-3 font-mono">{r.startTime || '—'}–{r.endTime || '—'}<br /><span className="text-[10px] text-slate-500">{r.workingHours || r.hoursWorked || 0} sa</span></td>
                      <td className="p-3 text-center">
                        {r.invoiced ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">Faturalı</span>
                        ) : r.status === 'approved' || (r.status as string) === 'onaylandi' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Onaylı</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">Bekliyor</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button type="button" className="text-emerald-700 font-semibold" onClick={() => openPreviewFromReceipt(r)}>
                          Önizle
                        </button>
                        {(r.status === 'pending' || r.status === 'pending_approval' || (r.status as string) === 'beklemede') && (
                          <>
                            <button type="button" className="text-emerald-600" onClick={() => handleApprove(r.id)}>
                              Onay
                            </button>
                            <button type="button" className="text-slate-400" onClick={() => handleReject(r.id)}>
                              Red
                            </button>
                          </>
                        )}
                        {(r.status === 'approved' || (r.status as string) === 'onaylandi') && !r.invoiced && (
                          <button
                            type="button"
                            className="text-emerald-800 font-bold"
                            onClick={() => setSelectedIds((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id]))}
                          >
                            {selectedIds.includes(r.id) ? 'Seçildi' : 'Seç'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {selectedIds.length > 0 && (
            <div className="p-3 border-t border-emerald-100 flex justify-end">
              <button type="button" disabled={busy} onClick={handleBatchInvoice} className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold">
                {selectedIds.length} makbuzu faturalandır
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'irsaliye' && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 no-print">
          <p className="text-xs text-emerald-800/80 mb-4">
            İrsaliye kayıtları makbuz hattı üzerinden takip edilir. Yeni belge için «Yeni Makbuz» kullanın; önizlemede A4 çıktı alınır.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredReceipts.slice(0, 6).map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openPreviewFromReceipt(r, 'irsaliye')}
                className="text-left p-3 rounded-xl border border-emerald-100 hover:bg-emerald-50/50"
              >
                <div className="font-bold text-sm text-slate-800">{r.customerName}</div>
                <div className="text-[11px] text-slate-500">{r.receiptNo} · {r.craneCode}</div>
                <div className="text-xs font-mono font-bold text-emerald-800 mt-1">{(r.amount || 0).toLocaleString('tr-TR')} ₺</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'fatura' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden no-print">
          <div className="overflow-x-auto table-wrap">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3">Fatura No</th>
                  <th className="p-3">Müşteri</th>
                  <th className="p-3 text-right">Tutar</th>
                  <th className="p-3 text-center">Durum</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">Henüz fatura yok</td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-emerald-50/40">
                      <td className="p-3 font-mono font-bold">{inv.invoiceNo}</td>
                      <td className="p-3">{inv.customerName}</td>
                      <td className="p-3 text-right font-mono font-bold">
                        {(inv.totalAmount || 0).toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">{inv.status}</span>
                      </td>
                      <td className="p-3 text-right">
                        <button type="button" className="text-emerald-700 font-semibold" onClick={() => openPreviewFromInvoice(inv)}>
                          Önizle / Yazdır
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-3 no-print" onClick={() => setPreview(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-emerald-100 flex justify-between items-center sticky top-0 bg-white">
              <span className="text-xs font-bold text-emerald-900">Belge önizleme (A4)</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.print()} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                  <Printer size={14} /> Yazdır
                </button>
                <button type="button" onClick={() => setPreview(null)} className="px-3 py-1.5 border rounded-lg text-xs">
                  Kapat
                </button>
              </div>
            </div>
            <div className="print-document p-6 sm:p-8 text-slate-800">
              <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-4 mb-4">
                <div>
                  <div className="text-lg font-black text-emerald-900">{COMPANY.name}</div>
                  <div className="text-[11px] text-emerald-700">{COMPANY.slogan}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{COMPANY.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black uppercase tracking-wide">{preview.title}</div>
                  <div className="text-xs font-mono mt-1">No: {preview.no}</div>
                  <div className="text-xs">Tarih: {preview.date}</div>
                </div>
              </div>
              <div className="mb-4 text-sm">
                <div className="font-bold">Sayın / Müşteri</div>
                <div>{preview.customer}</div>
                {preview.taxNo && <div className="text-xs text-slate-500">VKN: {preview.taxNo}</div>}
              </div>
              <table className="w-full text-xs mb-4">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-2">Açıklama</th>
                    <th className="py-2">Miktar</th>
                    {preview.type === 'fatura' && <th className="py-2 text-right">Tutar</th>}
                  </tr>
                </thead>
                <tbody>
                  {preview.lines.map((l, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2">{l.label}</td>
                      <td className="py-2">{l.qty || '—'}</td>
                      {preview.type === 'fatura' && <td className="py-2 text-right font-mono">{l.amount.toLocaleString('tr-TR')} ₺</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.type === 'fatura' && <div className="flex justify-end text-sm space-y-1 flex-col items-end">
                <div>Ara toplam: <strong className="font-mono">{subtotal.toLocaleString('tr-TR')} ₺</strong></div>
                <div>KDV %{preview.kdvRate}: <strong className="font-mono">{kdv.toLocaleString('tr-TR')} ₺</strong></div>
                <div className="text-base font-black text-emerald-900">Genel toplam: {total.toLocaleString('tr-TR')} ₺</div>
              </div>}
              {preview.note && <p className="mt-4 text-xs text-slate-500 border-t pt-2">Not: {preview.note}</p>}
              <p className="mt-6 text-[10px] text-slate-400 text-center">{COMPANY.taxLabel}</p>
            </div>
          </div>
        </div>
      )}

      {wizardOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Yeni belge — Adım {step}/3</h3>
              <button type="button" onClick={() => setWizardOpen(false)} className="text-slate-400 text-sm">Kapat</button>
            </div>
            {step === 1 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold">Müşteri</label>
                <select value={wCustomer} onChange={(e) => setWCustomer(e.target.value)} className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Seçin...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.title || c.name}</option>
                  ))}
                </select>
                <button type="button" onClick={() => setNewCustomerOpen((value) => !value)} className="text-xs font-bold text-emerald-700">+ Yeni cari oluştur</button>
                {newCustomerOpen && <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2"><input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Cari / firma ünvanı *" className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm" /><input value={newCustomerTaxNo} onChange={(e) => setNewCustomerTaxNo(e.target.value)} placeholder="Vergi no (opsiyonel)" className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm" /><button type="button" onClick={createCustomerForDocument} className="w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-bold">Cariyi Kaydet ve Seç</button></div>}
                <label className="block text-xs font-semibold">Çalışma alanı / şantiye *</label>
                <input required value={wSite} onChange={(e) => setWSite(e.target.value)} placeholder="Şantiye veya çalışma alanı" className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm" />
                <label className="block text-xs font-semibold">Operatör *</label>
                <select required value={wOperator} onChange={(e) => setWOperator(e.target.value)} className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Personel seçin...</option>
                  {personnel.filter((p) => p.status !== 'pasif').map((p) => <option key={p.id} value={p.id}>{p.fullName} · {p.title}</option>)}
                </select>
                <label className="block text-xs font-semibold">Vinç *</label>
                <select required value={wCrane} onChange={(e) => setWCrane(e.target.value)} className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Vinç seçin...</option>
                  {cranes.map((c) => (
                    <option key={c.id} value={c.id}>{c.code}</option>
                  ))}
                </select>
                <button type="button" disabled={!wCustomer} className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-40" onClick={() => setStep(2)}>
                  İleri
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold">Çalışma saatleri *</label>
                <div className="grid grid-cols-2 gap-2"><input type="time" required value={wStart} onChange={(e) => setWStart(e.target.value)} className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm" /><input type="time" required value={wEnd} onChange={(e) => setWEnd(e.target.value)} className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm" /></div>
                {tab === 'irsaliye' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={wFrom} onChange={(e) => setWFrom(e.target.value)} placeholder="Nereden" className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm" />
                    <input value={wTo} onChange={(e) => setWTo(e.target.value)} placeholder="Nereye" className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm" />
                  </div>
                )}
                <textarea value={wNote} onChange={(e) => setWNote(e.target.value)} placeholder="Not" className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm min-h-[72px]" />
                <div className="flex gap-2">
                  <button type="button" className="flex-1 min-h-11 rounded-xl border border-emerald-200 text-sm font-semibold" onClick={() => setStep(1)}>Geri</button>
                  <button type="button" className="flex-1 min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold" onClick={() => setStep(3)}>İleri</button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  <strong>{customers.find((c) => c.id === wCustomer)?.title || customers.find((c) => c.id === wCustomer)?.name}</strong>
                  {' · '}{wSite} · {personnel.find((p) => p.id === wOperator)?.fullName || 'Operatör'} · {wStart}–{wEnd}
                </p>
                <div className="flex gap-2">
                  <button type="button" className="flex-1 min-h-11 rounded-xl border border-emerald-200 text-sm font-semibold" onClick={() => setStep(2)}>Geri</button>
                  <button type="button" disabled={busy} className="flex-1 min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold" onClick={createMakbuz}>Kaydet</button>
                </div>
              </div>
            )}
            <button type="button" className="text-xs text-slate-500" onClick={() => setWizardOpen(false)}>İptal</button>
          </div>
        </div>
      )}
    </div>
  );
};
