import React, { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  Layers,
  Sparkles,
  Download,
} from 'lucide-react';
import { downloadExcelReport, downloadHtmlReport, printReport } from '../lib/reporting';
import { getSupabase } from '../lib/supabase';
import { Invoice, InvoiceStatus } from '../types';

type DocTab = 'makbuz' | 'irsaliye' | 'fatura';
type InvoiceFilter = 'all' | 'paid' | 'pending' | 'overdue' | 'unprinted';
type DeliveryNote = { id: string; deliveryNo: string; customerName: string; siteName?: string; craneCode?: string; operatorName?: string; deliveryDate: string; fromLocation?: string; toLocation?: string; description?: string; status: string };

const COMPANY = {
  name: 'BİZİM VİNÇ',
  slogan: 'En derinden, en yükseklere',
  address: 'Saha Operasyon Merkezi — İstanbul / Kocaeli',
  taxLabel: 'Vergi Dairesi: Marmara Kurumsal | VKN: 1982746190 | Mersis: 019827461900001',
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
  const [invFilter, setInvFilter] = useState<InvoiceFilter>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<'standard_green' | 'compact_modern'>('standard_green');

  const [preview, setPreview] = useState<{
    type: DocTab;
    title: string;
    no: string;
    date: string;
    dueDate?: string;
    customer: string;
    taxNo?: string;
    taxOffice?: string;
    address?: string;
    lines: { label: string; qty?: string; unitPrice?: number; amount: number; kdvRate?: number; craneCode?: string }[];
    note?: string;
    kdvRate: number;
    withholdingRate?: number; // e.g. 5/10 = 0.5
    templateId?: 'standard_green' | 'compact_modern';
    eStatus?: 'taslak' | 'e-arsiv' | 'e-fatura';
    invoiceRef?: Invoice;
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
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);

  // Yeni doğrudan fatura modalı
  const [isDirectInvoiceOpen, setIsDirectInvoiceOpen] = useState(false);
  const [directInvCustomer, setDirectInvCustomer] = useState('');
  const [directInvDueDate, setDirectInvDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [directInvCategory, setDirectInvCategory] = useState('vinc_kiralama');
  const [directInvWithholding, setDirectInvWithholding] = useState<number>(0);
  const [directInvNotes, setDirectInvNotes] = useState('');
  const [directInvLines, setDirectInvLines] = useState<
    { description: string; quantity: number; unit: string; unitPrice: number; craneId?: string }[]
  >([{ description: 'Saatlik / Günlük Mobil Vinç Kiralama Hizmeti', quantity: 8, unit: 'saat', unitPrice: 2500 }]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from('delivery_notes')
      .select('*')
      .order('delivery_date', { ascending: false })
      .then(({ data }) =>
        setDeliveryNotes(
          (data || []).map((d: any) => ({
            id: d.id,
            deliveryNo: d.delivery_no,
            customerName: d.customer_name,
            siteName: d.site_name,
            craneCode: d.crane_code,
            operatorName: d.operator_name,
            deliveryDate: d.delivery_date,
            fromLocation: d.from_location,
            toLocation: d.to_location,
            description: d.description,
            status: d.status,
          }))
        )
      );
  }, []);

  const createCustomerForDocument = async () => {
    if (!newCustomerName.trim()) return showToast('Cari ünvanı zorunludur.');
    try {
      const customer = await addCustomer({
        title: newCustomerName.trim(),
        name: newCustomerName.trim(),
        vknTckn: newCustomerTaxNo.trim() || undefined,
        taxNo: newCustomerTaxNo.trim() || undefined,
        phone: '',
        type: 'musteri',
        balance: 0,
      });
      setWCustomer(customer.id);
      setNewCustomerName('');
      setNewCustomerTaxNo('');
      setNewCustomerOpen(false);
      showToast('✓ Cari oluşturuldu ve belgeye seçildi.');
    } catch (error) {
      showToast(`Cari oluşturulamadı: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    }
  };

  // İstatistik sayaçları (Paraşüt & p@ket)
  const invoiceStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const totalRev = invoices.reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const paidRev = invoices
      .filter((i) => i.status === 'paid' || (i.status as string) === 'tahsil_edildi')
      .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const pendingRev = invoices
      .filter((i) => i.status !== 'paid' && (i.status as string) !== 'tahsil_edildi')
      .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const overdueRev = invoices
      .filter(
        (i) =>
          i.status !== 'paid' &&
          (i.status as string) !== 'tahsil_edildi' &&
          i.dueDate &&
          i.dueDate < today
      )
      .reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
    const unprintedCount = invoices.filter((i) => !i.printedAt).length;

    return { totalRev, paidRev, pendingRev, overdueRev, unprintedCount };
  }, [invoices]);

  const filteredReceipts = useMemo(() => {
    let list = [...jobReceipts];
    if (filter === 'pending')
      list = list.filter(
        (r) => r.status === 'pending_approval' || (r.status as string) === 'beklemede' || r.status === 'pending'
      );
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
    const today = new Date().toISOString().slice(0, 10);

    if (invFilter === 'paid') {
      list = list.filter((i) => i.status === 'paid' || (i.status as string) === 'tahsil_edildi');
    } else if (invFilter === 'pending') {
      list = list.filter((i) => i.status !== 'paid' && (i.status as string) !== 'tahsil_edildi');
    } else if (invFilter === 'overdue') {
      list = list.filter(
        (i) =>
          i.status !== 'paid' &&
          (i.status as string) !== 'tahsil_edildi' &&
          i.dueDate &&
          i.dueDate < today
      );
    } else if (invFilter === 'unprinted') {
      list = list.filter((i) => !i.printedAt);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          (r.invoiceNo || '').toLowerCase().includes(q) ||
          (r.customerName || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, invFilter, search]);

  const openPreviewFromReceipt = (r: (typeof jobReceipts)[0], type: DocTab = 'makbuz') => {
    const cust = customers.find((c) => c.id === r.customerId);
    setPreview({
      type,
      title: type === 'makbuz' ? 'İŞ MAKBUZU' : type === 'irsaliye' ? 'İRSALİYE' : 'FATURA',
      no: r.receiptNo || r.id.slice(0, 8),
      date: r.date || new Date().toISOString().slice(0, 10),
      customer: r.customerName || 'Müşteri',
      taxNo: cust?.vknTckn || cust?.taxNo,
      taxOffice: cust?.taxOffice,
      address: cust?.address,
      lines: [
        {
          label: `${r.craneCode || 'Vinç'} — ${r.hoursWorked || 0} saat saha işi`,
          qty: `${r.hoursWorked || 0} sa`,
          unitPrice: (Number(r.amount) || 0) / Math.max(1, Number(r.hoursWorked) || 1),
          amount: Number(r.amount) || 0,
          craneCode: r.craneCode,
        },
      ],
      note: r.note,
      kdvRate: 20,
      templateId: selectedTemplate,
    });
  };

  const openPreviewFromInvoice = (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    const lines =
      inv.lines && inv.lines.length > 0
        ? inv.lines.map((l) => ({
            label: l.description,
            qty: `${l.quantity} ${l.unit}`,
            unitPrice: l.unitPrice,
            amount: l.quantity * l.unitPrice,
            kdvRate: l.taxRate,
            craneCode: l.craneId ? cranes.find((c) => c.id === l.craneId)?.code : undefined,
          }))
        : [
            {
              label: inv.notes || 'Hizmet bedeli (Mobil Vinç Operasyonu)',
              qty: '1 hizmet',
              unitPrice: Number(inv.subtotal || inv.totalAmount) || 0,
              amount: Number(inv.subtotal || inv.totalAmount) || 0,
              kdvRate: Number(inv.taxRate) || 20,
            },
          ];

    setPreview({
      type: 'fatura',
      title: 'FATURA',
      no: inv.invoiceNo || inv.id.slice(0, 8),
      date: inv.issueDate || inv.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      dueDate: inv.dueDate,
      customer: inv.customerName || 'Müşteri',
      taxNo: cust?.vknTckn || cust?.taxNo,
      taxOffice: cust?.taxOffice,
      address: cust?.address,
      lines,
      note: inv.notes,
      kdvRate: Number(inv.taxRate) || 20,
      withholdingRate: inv.withholdingRate || 0,
      templateId: (inv.templateId as any) || selectedTemplate,
      eStatus: inv.eStatus || (cust?.isEfaturaMukellefi ? 'e-fatura' : 'e-arsiv'),
      invoiceRef: inv,
    });
  };

  // Preview calculations
  const subtotal = preview ? preview.lines.reduce((s, l) => s + (l.amount || 0), 0) : 0;
  const rawKdv = preview ? subtotal * (preview.kdvRate / 100) : 0;
  const withholdingAmount = preview && preview.withholdingRate ? rawKdv * preview.withholdingRate : 0;
  const finalKdv = rawKdv - withholdingAmount;
  const total = subtotal + finalKdv;

  const handlePrintDocument = () => {
    if (preview?.invoiceRef) {
      preview.invoiceRef.printedAt = new Date().toISOString();
      const sb = getSupabase();
      if (sb) {
        sb.from('invoices')
          .update({ printed_at: new Date().toISOString(), template_id: selectedTemplate })
          .eq('id', preview.invoiceRef.id)
          .then();
      }
    }
    window.print();
  };

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
      const calculatedHours = Math.max(0, (endHour * 60 + endMinute - (startHour * 60 + startMinute)) / 60);
      if (!operator || !crane || calculatedHours <= 0) {
        showToast('Operatör, vinç ve geçerli saat aralığı seçilmelidir.');
        return;
      }
      if (tab === 'irsaliye') {
        const sb = getSupabase();
        if (!sb) throw new Error('Supabase bağlantısı yok.');
        const deliveryNo = `IRS-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const { data, error } = await sb
          .from('delivery_notes')
          .insert({
            delivery_no: deliveryNo,
            customer_id: wCustomer,
            customer_name: cust?.title || cust?.name || 'Müşteri',
            site_name: wSite.trim(),
            crane_code: crane.code,
            operator_name: operator.fullName,
            delivery_date: new Date().toISOString().slice(0, 10),
            from_location: wFrom || null,
            to_location: wTo || null,
            description: wNote || null,
            status: 'issued',
          })
          .select('*')
          .single();
        if (error) throw error;
        if (data)
          setDeliveryNotes((prev) => [
            {
              id: data.id,
              deliveryNo: data.delivery_no,
              customerName: data.customer_name,
              siteName: data.site_name,
              craneCode: data.crane_code,
              operatorName: data.operator_name,
              deliveryDate: data.delivery_date,
              fromLocation: data.from_location,
              toLocation: data.to_location,
              description: data.description,
              status: data.status,
            },
            ...prev,
          ]);
      } else
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
      showToast(tab === 'irsaliye' ? '✓ Bağımsız irsaliye oluşturuldu' : '✓ İş makbuzu oluşturuldu');
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
      const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      await createInvoiceFromReceipts(selectedIds, dueDate, 'Toplu onaylanan makbuzlar');
      showToast(`✓ ${selectedIds.length} makbuz faturalandı`);
      setSelectedIds([]);
      setTab('fatura');
    } catch (e) {
      showToast('Fatura oluşturma hatası');
    } finally {
      setBusy(false);
    }
  };

  // Toplu fatura aksiyonları
  const handleBatchMarkPaid = async () => {
    if (selectedInvoiceIds.length === 0) return;
    setBusy(true);
    try {
      for (const id of selectedInvoiceIds) {
        await updateInvoiceStatus(id, 'paid');
      }
      showToast(`✓ ${selectedInvoiceIds.length} fatura tahsil edildi olarak işaretlendi.`);
      setSelectedInvoiceIds([]);
    } catch (e) {
      showToast('Durum güncelleme hatası');
    } finally {
      setBusy(false);
    }
  };

  const handleBatchPrint = () => {
    if (selectedInvoiceIds.length === 0) return;
    const inv = invoices.find((i) => i.id === selectedInvoiceIds[0]);
    if (inv) {
      openPreviewFromInvoice(inv);
    }
    showToast(`Toplu yazdırma başlatılıyor (${selectedInvoiceIds.length} fatura)`);
  };

  const exportDocuments = (format: 'excel' | 'html' | 'print') => {
    const isInvoice = tab === 'fatura';
    const isDelivery = tab === 'irsaliye';
    const columns = isInvoice
      ? [
          { key: 'no', label: 'Fatura No' },
          { key: 'date', label: 'Tarih' },
          { key: 'dueDate', label: 'Vade' },
          { key: 'customer', label: 'Cari' },
          { key: 'amount', label: 'Tutar' },
          { key: 'status', label: 'Durum' },
          { key: 'printed', label: 'Yazdırıldı' },
        ]
      : [
          { key: 'no', label: isDelivery ? 'İrsaliye No' : 'Makbuz No' },
          { key: 'date', label: 'Tarih' },
          { key: 'customer', label: 'Cari' },
          { key: 'crane', label: 'Vinç' },
          { key: 'site', label: 'Şantiye' },
          { key: 'status', label: 'Durum' },
        ];

    const rows = isInvoice
      ? filteredInvoices.map((item) => ({
          no: item.invoiceNo,
          date: item.issueDate,
          dueDate: item.dueDate || '-',
          customer: item.customerName,
          amount: `${item.totalAmount.toLocaleString('tr-TR')} ₺`,
          status: item.status,
          printed: item.printedAt ? 'Evet' : 'Hayır',
        }))
      : isDelivery
      ? deliveryNotes.map((item) => ({
          no: item.deliveryNo,
          date: item.deliveryDate,
          customer: item.customerName,
          crane: item.craneCode || '-',
          site: item.siteName || '-',
          status: item.status,
        }))
      : filteredReceipts.map((item) => ({
          no: item.receiptNo,
          date: item.date,
          customer: item.customerName,
          crane: item.craneCode,
          site: item.siteName || '-',
          status: item.status,
        }));

    const title =
      tab === 'makbuz'
        ? 'Bizim Vinç İş Makbuzu Arşivi'
        : tab === 'irsaliye'
        ? 'Bizim Vinç İrsaliye Arşivi'
        : 'Bizim Vinç Fatura Arşivi (Paraşüt Standartı)';

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
          .print-document { position: absolute; left: 0; top: 0; width: 210mm; padding: 10mm; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
            Finansal Operasyon · Paraşüt & p@ket UX
          </div>
          <h1 className="text-xl font-black text-slate-800">Makbuz · İrsaliye · Fatura</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            İş makbuzu → onay → fatura akışı. A4 çift şablon, tevkifat ve toplu yazdırma desteklenir.
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
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} /> {tab === 'irsaliye' ? 'Yeni İrsaliye' : 'Yeni Makbuz'}
          </button>
          {tab === 'makbuz' && selectedIds.length > 0 && (
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

      {/* Paraşüt / p@ket Özet Sayaçları (Fatura Sekmesinde) */}
      {tab === 'fatura' && (
        <section className="no-print grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Toplam Kesilen Fatura</span>
            <span className="font-mono text-xl font-bold text-emerald-950">
              {invoiceStats.totalRev.toLocaleString('tr-TR')} ₺
            </span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">{invoices.length} adet fatura</span>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Vadesi Geçen Alacak</span>
            <span className="font-mono text-xl font-bold text-red-600">
              {invoiceStats.overdueRev.toLocaleString('tr-TR')} ₺
            </span>
            <span className="text-[10px] text-red-500 block mt-0.5">Kritik takip gereken</span>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Bekleyen Tahsilat</span>
            <span className="font-mono text-xl font-bold text-amber-700">
              {invoiceStats.pendingRev.toLocaleString('tr-TR')} ₺
            </span>
            <span className="text-[10px] text-amber-600 block mt-0.5">Vadesi henüz dolmamış</span>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-3.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Yazdırılmayı Bekleyen</span>
            <span className="font-mono text-xl font-bold text-blue-600">
              {invoiceStats.unprintedCount} adet
            </span>
            <span className="text-[10px] text-blue-500 block mt-0.5">A4 çıktısı alınmamış</span>
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="no-print flex flex-wrap gap-2">
        {tabBtn('makbuz', 'İş Makbuzları', <Receipt size={14} />)}
        {tabBtn('irsaliye', 'İrsaliye', <Truck size={14} />)}
        {tabBtn('fatura', 'Faturalar', <FileText size={14} />)}
      </div>

      {/* Filters and search */}
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

        {tab === 'fatura' && (
          <div className="flex flex-wrap gap-1">
            {([
              ['all', 'Tümü'],
              ['pending', 'Bekliyor'],
              ['overdue', 'Vadesi Geçen'],
              ['paid', 'Tahsil Edildi'],
              ['unprinted', 'Yazdırılmadı'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setInvFilter(val as InvoiceFilter)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  invFilter === val
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-emerald-100 hover:bg-emerald-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1 sm:ml-auto">
          <button
            type="button"
            onClick={() => exportDocuments('excel')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={() => exportDocuments('html')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => exportDocuments('print')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950 text-white text-[11px] font-bold"
          >
            <Printer size={12} className="inline mr-1" />
            PDF / Yazdır
          </button>
        </div>
      </div>

      {/* TAB: MAKBUZ */}
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
                      <td className="p-3 font-mono">
                        {r.startTime || '—'}–{r.endTime || '—'}
                        <br />
                        <span className="text-[10px] text-slate-500">
                          {r.workingHours || r.hoursWorked || 0} sa
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {r.invoiced ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100">Faturalı</span>
                        ) : r.status === 'approved' || (r.status as string) === 'onaylandi' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Onaylı
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                            Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button
                          type="button"
                          className="text-emerald-700 font-semibold"
                          onClick={() => openPreviewFromReceipt(r)}
                        >
                          Önizle
                        </button>
                        {(r.status === 'pending' ||
                          r.status === 'pending_approval' ||
                          (r.status as string) === 'beklemede') && (
                          <>
                            <button
                              type="button"
                              className="text-emerald-600"
                              onClick={() => handleApprove(r.id)}
                            >
                              Onay
                            </button>
                            <button
                              type="button"
                              className="text-slate-400"
                              onClick={() => handleReject(r.id)}
                            >
                              Red
                            </button>
                          </>
                        )}
                        {(r.status === 'approved' || (r.status as string) === 'onaylandi') && !r.invoiced && (
                          <button
                            type="button"
                            className="text-emerald-800 font-bold"
                            onClick={() =>
                              setSelectedIds((p) =>
                                p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p, r.id]
                              )
                            }
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
              <button
                type="button"
                disabled={busy}
                onClick={handleBatchInvoice}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                {selectedIds.length} makbuzu faturalandır
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: İRSALİYE */}
      {tab === 'irsaliye' && (
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 no-print">
          <p className="text-xs text-emerald-800/80 mb-4">
            İrsaliyeler makbuzdan bağımsız, sevk/iş sahası belgesi olarak arşivlenir ve A4 formatında gösterilir.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {deliveryNotes
              .filter(
                (d) =>
                  !search ||
                  `${d.deliveryNo} ${d.customerName} ${d.siteName || ''}`
                    .toLocaleLowerCase('tr-TR')
                    .includes(search.toLocaleLowerCase('tr-TR'))
              )
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    setPreview({
                      type: 'irsaliye',
                      title: 'İRSALİYE',
                      no: r.deliveryNo,
                      date: r.deliveryDate,
                      customer: r.customerName,
                      lines: [
                        {
                          label: `${r.fromLocation || '-'} → ${r.toLocation || '-'} · ${r.siteName || ''}`,
                          qty: r.craneCode || '',
                          amount: 0,
                        },
                      ],
                      note: r.description,
                      kdvRate: 0,
                      templateId: selectedTemplate,
                    })
                  }
                  className="text-left p-3 rounded-xl border border-emerald-100 hover:bg-emerald-50/50"
                >
                  <div className="font-bold text-sm text-slate-800">{r.customerName}</div>
                  <div className="text-[11px] text-slate-500">
                    {r.deliveryNo} · {r.craneCode || '-'} · {r.deliveryDate}
                  </div>
                  <div className="text-xs font-bold text-emerald-800 mt-1">
                    {r.fromLocation || '-'} → {r.toLocation || '-'}
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* TAB: FATURALAR (PARAŞÜT STANDARDI) */}
      {tab === 'fatura' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden no-print">
          {/* Toplu İşlem Barı */}
          {selectedInvoiceIds.length > 0 && (
            <div className="bg-emerald-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold">
                {selectedInvoiceIds.length} adet fatura seçildi
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBatchPrint}
                  className="px-3 py-1 bg-white text-emerald-900 rounded-lg font-bold flex items-center gap-1"
                >
                  <Printer size={13} /> Toplu Yazdır
                </button>
                <button
                  type="button"
                  onClick={handleBatchMarkPaid}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1"
                >
                  <CheckCircle2 size={13} /> Tahsil Edildi Yap
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceIds([])}
                  className="px-2 py-1 text-emerald-200 hover:text-white"
                >
                  Seçimi Temizle
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto table-wrap">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold text-[10px] uppercase">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded border-emerald-300 text-emerald-600"
                      checked={
                        filteredInvoices.length > 0 &&
                        selectedInvoiceIds.length === filteredInvoices.length
                      }
                      onChange={(e) =>
                        setSelectedInvoiceIds(
                          e.target.checked ? filteredInvoices.map((i) => i.id) : []
                        )
                      }
                    />
                  </th>
                  <th className="p-3">Fatura No</th>
                  <th className="p-3">Müşteri (Cari)</th>
                  <th className="p-3">Düzenleme</th>
                  <th className="p-3">Vade</th>
                  <th className="p-3 text-right">Tutar</th>
                  <th className="p-3 text-center">Durum</th>
                  <th className="p-3 text-center">Yazdırma</th>
                  <th className="p-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      Filtreye uygun fatura bulunamadı
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isSelected = selectedInvoiceIds.includes(inv.id);
                    const isOverdue =
                      inv.status !== 'paid' &&
                      (inv.status as string) !== 'tahsil_edildi' &&
                      inv.dueDate &&
                      inv.dueDate < new Date().toISOString().slice(0, 10);

                    return (
                      <tr
                        key={inv.id}
                        className={`hover:bg-emerald-50/40 transition-colors ${
                          isSelected ? 'bg-emerald-50/60' : ''
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            className="rounded border-emerald-300 text-emerald-600"
                            checked={isSelected}
                            onChange={(e) =>
                              setSelectedInvoiceIds((prev) =>
                                e.target.checked ? [...prev, inv.id] : prev.filter((x) => x !== inv.id)
                              )
                            }
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {inv.invoiceNo}
                          {inv.eStatus && (
                            <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded font-sans uppercase font-bold bg-slate-100 text-slate-600">
                              {inv.eStatus}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{inv.customerName}</div>
                          {inv.category && (
                            <div className="text-[10px] text-slate-400">{inv.category}</div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">
                          {inv.issueDate || inv.createdAt?.slice(0, 10)}
                        </td>
                        <td className="p-3 font-mono">
                          <span
                            className={
                              isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'
                            }
                          >
                            {inv.dueDate || '—'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {(inv.totalAmount || 0).toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3 text-center">
                          {inv.status === 'paid' || (inv.status as string) === 'tahsil_edildi' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                              Tahsil Edildi
                            </span>
                          ) : isOverdue ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold">
                              Gecikmiş
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                              Bekliyor
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {inv.printedAt ? (
                            <span className="text-[10px] text-emerald-700 flex items-center justify-center gap-1">
                              <CheckCircle2 size={12} /> Yazdırıldı
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Bekliyor</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto"
                            onClick={() => openPreviewFromInvoice(inv)}
                          >
                            <Printer size={12} /> Önizle / Yazdır
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A4 BELGE ÖNİZLEME & YAZDIRMA PENCERESİ (ÇİFT ŞABLON) */}
      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-2 sm:p-4 no-print overflow-y-auto"
          onClick={() => setPreview(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92dvh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Controls Bar */}
            <div className="p-3.5 border-b border-emerald-100 flex flex-wrap justify-between items-center bg-emerald-50/50 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <Printer size={14} /> Belge Önizleme (A4)
                </span>
                {preview.type === 'fatura' && (
                  <div className="flex bg-white rounded-lg p-0.5 border border-emerald-200 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate('standard_green')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        selectedTemplate === 'standard_green'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      Şablon 1 (Kurumsal Yeşil)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTemplate('compact_modern')}
                      className={`px-2.5 py-1 rounded-md transition ${
                        selectedTemplate === 'compact_modern'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-800'
                      }`}
                    >
                      Şablon 2 (Kompakt Muhasebe)
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintDocument}
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Printer size={14} /> Yazdır / PDF İndir
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-2.5 py-1.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  Kapat
                </button>
              </div>
            </div>

            {/* A4 Sayfa Görüntüsü */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-100 flex justify-center">
              {/* ŞABLON 1: KLASİK KURUMSAL YEŞİL */}
              {selectedTemplate === 'standard_green' ? (
                <div className="print-document bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-md text-slate-800 font-sans flex flex-col justify-between">
                  <div>
                    {/* Üst Antet */}
                    <div className="flex justify-between items-start border-b-4 border-emerald-600 pb-5 mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                            BV
                          </div>
                          <span className="text-2xl font-black text-emerald-950 tracking-tight">
                            {COMPANY.name}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-1 italic">
                          “{COMPANY.slogan}”
                        </div>
                        <div className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                          {COMPANY.address}
                          <br />
                          {COMPANY.taxLabel}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 rounded-md font-black text-xs uppercase tracking-wider mb-2">
                          {preview.eStatus ? `${preview.eStatus.toUpperCase()} ` : ''}
                          {preview.title}
                        </div>
                        <div className="text-sm font-mono font-bold text-slate-900">
                          Belge No: {preview.no}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Tarih: {preview.date}
                        </div>
                        {preview.dueDate && (
                          <div className="text-xs font-bold text-emerald-800 mt-0.5">
                            Vade: {preview.dueDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cari ve Alıcı Bilgileri (İki Sütun) */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                          Sayın / Müşteri Bilgileri
                        </div>
                        <div className="font-black text-sm text-slate-900">{preview.customer}</div>
                        {preview.taxNo && (
                          <div className="text-slate-600 mt-1 font-mono">
                            VKN / TCKN: <strong>{preview.taxNo}</strong>
                            {preview.taxOffice ? ` · V.D.: ${preview.taxOffice}` : ''}
                          </div>
                        )}
                        {preview.address && (
                          <div className="text-slate-500 mt-1 leading-snug">{preview.address}</div>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                          Hizmet & Operasyon Detayı
                        </div>
                        <div className="text-slate-700">
                          Operasyon Merkezi: İstanbul & Bölge Şantiyeleri
                        </div>
                        <div className="text-slate-700 mt-0.5">
                          Para Birimi: <strong>Türk Lirası (₺)</strong>
                        </div>
                        {preview.withholdingRate && preview.withholdingRate > 0 ? (
                          <div className="text-emerald-800 font-bold mt-1">
                            Tevkifat Oranı: {preview.withholdingRate * 10}/10
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Kalemler Tablosu */}
                    <table className="w-full text-xs mb-6 border-collapse">
                      <thead>
                        <tr className="bg-emerald-800 text-white font-bold text-[11px]">
                          <th className="py-2.5 px-3 text-left rounded-l-lg">Sıra</th>
                          <th className="py-2.5 px-3 text-left">Hizmet / Açıklama</th>
                          <th className="py-2.5 px-3 text-center">Miktar</th>
                          <th className="py-2.5 px-3 text-right">Birim Fiyat</th>
                          <th className="py-2.5 px-3 text-center">KDV</th>
                          <th className="py-2.5 px-3 text-right rounded-r-lg">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {preview.lines.map((l, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{i + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {l.label}
                              {l.craneCode && (
                                <span className="ml-1 text-[10px] text-emerald-700 font-bold">
                                  [{l.craneCode}]
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{l.qty || '1'}</td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {l.unitPrice ? `${l.unitPrice.toLocaleString('tr-TR')} ₺` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              %{l.kdvRate || preview.kdvRate}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {l.amount.toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Alt Toplam & Tevkifat Bloğu */}
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-emerald-100 pt-4">
                      <div className="text-xs text-slate-600 max-w-sm">
                        {preview.note && (
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                            <strong>Not:</strong> {preview.note}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500">
                          İşbu belge 213 sayılı VUK hükümlerine ve Türk Ticaret Kanununa uygun olarak düzenlenmiştir.
                        </div>
                      </div>

                      <div className="w-full sm:w-72 bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Matrah (Ara Toplam):</span>
                          <span className="font-mono font-bold">
                            {subtotal.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Hesaplanan KDV (%{preview.kdvRate}):</span>
                          <span className="font-mono font-bold">
                            {rawKdv.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                        {withholdingAmount > 0 && (
                          <div className="flex justify-between text-emerald-800">
                            <span>Tevkifat Kesintisi:</span>
                            <span className="font-mono font-bold">
                              -{withholdingAmount.toLocaleString('tr-TR')} ₺
                            </span>
                          </div>
                        )}
                        <div className="border-t border-emerald-200 pt-2 flex justify-between items-center text-sm">
                          <span className="font-black text-emerald-950">Ödenecek Tutar:</span>
                          <span className="font-mono text-base font-black text-emerald-900">
                            {total.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alt Damga & İmza Alanı */}
                  <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 text-center text-xs text-slate-600">
                    <div>
                      <div className="font-bold text-slate-800 mb-10">Düzenleyen (Bizim Vinç)</div>
                      <div className="border-t border-slate-300 w-36 mx-auto pt-1 text-[10px]">
                        Kaşe & Yetkili İmza
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 mb-10">Teslim Alan / Alıcı Onayı</div>
                      <div className="border-t border-slate-300 w-36 mx-auto pt-1 text-[10px]">
                        İmza & Tarih
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ŞABLON 2: MODERN / KOMPAKT MUHASEBE */
                <div className="print-document bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-10 shadow-md text-slate-900 font-sans border-l-8 border-emerald-600 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
                      <div>
                        <div className="text-xl font-black text-slate-900 tracking-tight">
                          {COMPANY.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{COMPANY.address}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {COMPANY.taxLabel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm uppercase text-emerald-800">
                          {preview.eStatus?.toUpperCase()} RESMİ {preview.title}
                        </div>
                        <div className="text-xs font-mono font-bold mt-0.5">No: {preview.no}</div>
                        <div className="text-[11px] text-slate-500">Tarih: {preview.date}</div>
                        {preview.dueDate && (
                          <div className="text-[11px] font-bold text-slate-800">
                            Vade: {preview.dueDate}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Müşteri Bilgisi Tek Satır */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Alıcı Ünvanı
                        </span>
                        <span className="font-bold text-slate-900">{preview.customer}</span>
                      </div>
                      {preview.taxNo && (
                        <div className="font-mono text-slate-700">
                          VKN: <strong>{preview.taxNo}</strong>
                        </div>
                      )}
                    </div>

                    {/* Kalemler */}
                    <table className="w-full text-xs mb-4">
                      <thead>
                        <tr className="border-b-2 border-slate-300 text-[10px] uppercase text-slate-600 font-bold">
                          <th className="py-2 text-left">Açıklama</th>
                          <th className="py-2 text-center">Miktar</th>
                          <th className="py-2 text-right">Birim Fiyat</th>
                          <th className="py-2 text-right">Tutar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {preview.lines.map((l, i) => (
                          <tr key={i}>
                            <td className="py-2 font-medium">{l.label}</td>
                            <td className="py-2 text-center font-mono">{l.qty || '1'}</td>
                            <td className="py-2 text-right font-mono">
                              {l.unitPrice ? `${l.unitPrice.toLocaleString('tr-TR')} ₺` : '—'}
                            </td>
                            <td className="py-2 text-right font-mono font-bold">
                              {l.amount.toLocaleString('tr-TR')} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Toplamlar */}
                    <div className="border-t-2 border-slate-300 pt-3 flex justify-end">
                      <div className="w-60 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span>Ara Toplam:</span>
                          <span className="font-mono">{subtotal.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        <div className="flex justify-between">
                          <span>KDV (%{preview.kdvRate}):</span>
                          <span className="font-mono">{rawKdv.toLocaleString('tr-TR')} ₺</span>
                        </div>
                        {withholdingAmount > 0 && (
                          <div className="flex justify-between text-emerald-800">
                            <span>Tevkifat:</span>
                            <span className="font-mono">-{withholdingAmount.toLocaleString('tr-TR')} ₺</span>
                          </div>
                        )}
                        <div className="border-t border-slate-300 pt-1.5 flex justify-between font-black text-sm">
                          <span>Genel Toplam:</span>
                          <span className="font-mono text-emerald-900">
                            {total.toLocaleString('tr-TR')} ₺
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Bizim Vinç ERP Muhasebe Modülü</span>
                    <span>Sayfa 1 / 1</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Makbuz & İrsaliye Sihirbazı */}
      {wizardOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 no-print">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Yeni belge — Adım {step}/3</h3>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="text-slate-400 text-sm"
              >
                Kapat
              </button>
            </div>
            {step === 1 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold">Müşteri</label>
                <select
                  value={wCustomer}
                  onChange={(e) => setWCustomer(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="">Seçin...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setNewCustomerOpen((value) => !value)}
                  className="text-xs font-bold text-emerald-700"
                >
                  + Yeni cari oluştur
                </button>
                {newCustomerOpen && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                    <input
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="Cari / firma ünvanı *"
                      className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <input
                      value={newCustomerTaxNo}
                      onChange={(e) => setNewCustomerTaxNo(e.target.value)}
                      placeholder="Vergi no (opsiyonel)"
                      className="w-full border border-emerald-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={createCustomerForDocument}
                      className="w-full rounded-lg bg-emerald-600 text-white py-2 text-xs font-bold"
                    >
                      Cariyi Kaydet ve Seç
                    </button>
                  </div>
                )}
                <label className="block text-xs font-semibold">Çalışma alanı / şantiye *</label>
                <input
                  required
                  value={wSite}
                  onChange={(e) => setWSite(e.target.value)}
                  placeholder="Şantiye veya çalışma alanı"
                  className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                />
                <label className="block text-xs font-semibold">Operatör *</label>
                <select
                  required
                  value={wOperator}
                  onChange={(e) => setWOperator(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="">Personel seçin...</option>
                  {personnel
                    .filter((p) => p.status !== 'pasif')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} · {p.title}
                      </option>
                    ))}
                </select>
                <label className="block text-xs font-semibold">Vinç *</label>
                <select
                  required
                  value={wCrane}
                  onChange={(e) => setWCrane(e.target.value)}
                  className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                >
                  <option value="">Vinç seçin...</option>
                  {cranes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!wCustomer}
                  className="w-full min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-40"
                  onClick={() => setStep(2)}
                >
                  İleri
                </button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold">Çalışma saatleri *</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    required
                    value={wStart}
                    onChange={(e) => setWStart(e.target.value)}
                    className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                  />
                  <input
                    type="time"
                    required
                    value={wEnd}
                    onChange={(e) => setWEnd(e.target.value)}
                    className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                {tab === 'irsaliye' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={wFrom}
                      onChange={(e) => setWFrom(e.target.value)}
                      placeholder="Nereden"
                      className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                    />
                    <input
                      value={wTo}
                      onChange={(e) => setWTo(e.target.value)}
                      placeholder="Nereye"
                      className="border border-emerald-200 rounded-xl px-3 py-2.5 text-sm"
                    />
                  </div>
                )}
                <textarea
                  value={wNote}
                  onChange={(e) => setWNote(e.target.value)}
                  placeholder="Not"
                  className="w-full border border-emerald-200 rounded-xl px-3 py-2.5 text-sm min-h-[72px]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 min-h-11 rounded-xl border border-emerald-200 text-sm font-semibold"
                    onClick={() => setStep(1)}
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    className="flex-1 min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold"
                    onClick={() => setStep(3)}
                  >
                    İleri
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  <strong>
                    {customers.find((c) => c.id === wCustomer)?.title ||
                      customers.find((c) => c.id === wCustomer)?.name}
                  </strong>
                  {' · '}
                  {wSite} · {personnel.find((p) => p.id === wOperator)?.fullName || 'Operatör'} ·{' '}
                  {wStart}–{wEnd}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 min-h-11 rounded-xl border border-emerald-200 text-sm font-semibold"
                    onClick={() => setStep(2)}
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    className="flex-1 min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-bold"
                    onClick={createMakbuz}
                  >
                    Kaydet
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              className="text-xs text-slate-500"
              onClick={() => setWizardOpen(false)}
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
