import { downloadExcelReport, downloadHtmlReport } from '../lib/reporting';
import React, { useMemo, useState } from 'react';
import { useERP } from '../lib/store';
import { PAYMENT_CATEGORY_LABELS, PAYMENT_CHANNEL_LABELS, Payment, PaymentCategory, CommercialPaper, CommercialPaperType, CommercialPaperStatus } from '../types';
import {
  AlertTriangle, BarChart3, Building2, CalendarClock, ChevronLeft, ChevronRight, CircleDollarSign,
  Download, FileText, FileWarning, Landmark, Lock, Paperclip, Phone, Printer, Search, ShieldCheck,
  Sparkles, WalletCards, XCircle,
} from 'lucide-react';
import { PaymentSettleModal } from '../components/PaymentSettleModal';
import { PaymentPlanWizard } from '../components/PaymentPlanWizard';

const money = (value: number) => `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
const daysSince = (date?: string) => (date ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)) : 0);
const today = () => new Date().toISOString().slice(0, 10);
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, (month || 1) - 1, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
};
const FINANCE_ROLES = ['founder', 'admin', 'yonetici', 'muhasebe'];

/** Aylık plan, dekontlu kapatma ve rapor üreten muhasebe ekranı. */
export const PaymentPlanningPage: React.FC = () => {
  const {
    customers, invoices, collections, payments, jobReceipts, obligations, paymentReceipts, commercialPapers, addCommercialPaper, updateCommercialPaperStatus, deleteCommercialPaper,
    addCollection, markCollectionReceived, cancelPayment, getPaymentDocumentUrl, currentUser,
  } = useERP();

  const [tab, setTab] = useState<'month' | 'obligations' | 'report' | 'new' | 'collections' | 'receipts' | 'checks' | 'custom_lists'>('month');
  // Özel Ödeme ve Tahsilat Listeleri Yönetimi (localStorage)
  interface CustomListItem {
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    party: string; // Cari / Kişi
    note?: string;
  }
  interface CustomList {
    id: string;
    name: string;
    kind: 'odeme' | 'tahsilat';
    createdAt: string;
    items: CustomListItem[];
  }
  const [customLists, setCustomLists] = useState<CustomList[]>(() => {
    try {
      const saved = localStorage.getItem('bv_custom_payment_lists');
      return saved ? JSON.parse(saved) : [
        {
          id: 'list-1',
          name: 'Haftalık Acil Şantiye Ödemeleri',
          kind: 'odeme',
          createdAt: new Date().toISOString(),
          items: [
            { id: 'item-1', title: 'Vinç-04 Mazot ve Yakıt Bedeli', amount: 34500, dueDate: new Date().toISOString().slice(0, 10), party: 'Petrol Ofisi A.Ş.' },
            { id: 'item-2', title: 'Operatör Harcırah Avansları', amount: 12000, dueDate: new Date().toISOString().slice(0, 10), party: 'Saha Ekibi' }
          ]
        },
        {
          id: 'list-2',
          name: 'Bu Ay Kesinleşen Tahsilatlar',
          kind: 'tahsilat',
          createdAt: new Date().toISOString(),
          items: [
            { id: 'item-3', title: 'Kalyon İnşaat Hakediş Tahsilatı', amount: 185000, dueDate: new Date().toISOString().slice(0, 10), party: 'Kalyon Holding' }
          ]
        }
      ];
    } catch {
      return [];
    }
  });
  const [activeCustomListId, setActiveCustomListId] = useState<string>(() => customLists[0]?.id || '');
  const [newListName, setNewListName] = useState('');
  const [newListKind, setNewListKind] = useState<'odeme' | 'tahsilat'>('odeme');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemParty, setNewItemParty] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState(() => new Date().toISOString().slice(0, 10));

  const saveCustomLists = (lists: CustomList[]) => {
    setCustomLists(lists);
    localStorage.setItem('bv_custom_payment_lists', JSON.stringify(lists));
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newList: CustomList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      kind: newListKind,
      createdAt: new Date().toISOString(),
      items: [],
    };
    const updated = [newList, ...customLists];
    saveCustomLists(updated);
    setActiveCustomListId(newList.id);
    setNewListName('');
  };

  const handleDeleteList = (id: string) => {
    const updated = customLists.filter((l) => l.id !== id);
    saveCustomLists(updated);
    if (activeCustomListId === id) {
      setActiveCustomListId(updated[0]?.id || '');
    }
  };

  const handleAddItemToList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !newItemAmount) return;
    const num = parseFloat(newItemAmount) || 0;
    const updated = customLists.map((l) => {
      if (l.id === activeCustomListId) {
        return {
          ...l,
          items: [
            ...l.items,
            {
              id: `item-${Date.now()}`,
              title: newItemTitle.trim(),
              party: newItemParty.trim() || 'Genel Cari',
              amount: num,
              dueDate: newItemDueDate,
            },
          ],
        };
      }
      return l;
    });
    saveCustomLists(updated);
    setNewItemTitle('');
    setNewItemParty('');
    setNewItemAmount('');
  };

  const handleRemoveItemFromList = (listId: string, itemId: string) => {
    const updated = customLists.map((l) => {
      if (l.id === listId) {
        return {
          ...l,
          items: l.items.filter((i) => i.id !== itemId),
        };
      }
      return l;
    });
    saveCustomLists(updated);
  };

  const [month, setMonth] = useState(monthKey(new Date()));
  const [search, setSearch] = useState('');
  const [settleTarget, setSettleTarget] = useState<Payment | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | PaymentCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'bekliyor' | 'odendi' | 'iptal'>('all');
  const [planCustomer, setPlanCustomer] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planDate, setPlanDate] = useState(today());
  const [planNote, setPlanNote] = useState('');
  const [manualCustomer, setManualCustomer] = useState('');
  const [docBusy, setDocBusy] = useState('');
  const [notice, setNotice] = useState('');

  const canView = FINANCE_ROLES.includes(currentUser?.role || '');
  const normalizedSearch = search.toLocaleLowerCase('tr-TR');

  const inMonth = useMemo(
    () => payments.filter((item) => (item.periodMonth ? item.periodMonth.slice(0, 7) : item.dueDate.slice(0, 7)) === month),
    [payments, month]
  );

  const monthRows = useMemo(() => inMonth
    .filter((item) => (categoryFilter === 'all' ? true : item.category === categoryFilter))
    .filter((item) => (statusFilter === 'all' ? true : item.status === statusFilter))
    .filter((item) => !normalizedSearch || `${item.recipientName} ${item.institutionName || ''} ${item.invoiceNo || ''}`.toLocaleLowerCase('tr-TR').includes(normalizedSearch))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  [inMonth, categoryFilter, statusFilter, normalizedSearch]);

  const monthTotals = useMemo(() => {
    const planned = inMonth.reduce((sum, item) => sum + (item.status === 'iptal' ? 0 : item.amount), 0);
    const paid = inMonth.filter((item) => item.status === 'odendi').reduce((sum, item) => sum + (item.paidAmount ?? item.amount), 0);
    const pending = inMonth.filter((item) => item.status === 'bekliyor').reduce((sum, item) => sum + item.amount, 0);
    const overdue = inMonth.filter((item) => item.status === 'bekliyor' && item.dueDate < today());
    return { planned, paid, pending, overdueCount: overdue.length, overdueTotal: overdue.reduce((s, i) => s + i.amount, 0) };
  }, [inMonth]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<PaymentCategory, { planned: number; paid: number; count: number }>();
    inMonth.forEach((item) => {
      if (item.status === 'iptal') return;
      const current = map.get(item.category) || { planned: 0, paid: 0, count: 0 };
      current.planned += item.amount;
      if (item.status === 'odendi') current.paid += item.paidAmount ?? item.amount;
      current.count += 1;
      map.set(item.category, current);
    });
    return [...map.entries()].sort((a, b) => b[1].planned - a[1].planned);
  }, [inMonth]);

  const obligationProgress = useMemo(() => obligations.map((obligation) => {
    const rows = payments.filter((item) => item.obligationId === obligation.id);
    const paidRows = rows.filter((item) => item.status === 'odendi');
    const pendingRows = rows.filter((item) => item.status === 'bekliyor');
    const paidTotal = paidRows.reduce((sum, item) => sum + (item.paidAmount ?? item.amount), 0);
    const nextDue = pendingRows.map((item) => item.dueDate).sort()[0];
    return {
      obligation, rows, paidCount: paidRows.length, totalCount: rows.length, paidTotal,
      remaining: Math.max(0, Math.round((obligation.totalAmount - paidTotal) * 100) / 100),
      nextDue, overdue: pendingRows.some((item) => item.dueDate < today()),
    };
  }).filter((item) => !normalizedSearch || `${item.obligation.title} ${item.obligation.recipientName} ${item.obligation.institutionName || ''}`.toLocaleLowerCase('tr-TR').includes(normalizedSearch))
    .sort((a, b) => (a.nextDue || '9999').localeCompare(b.nextDue || '9999')),
  [obligations, payments, normalizedSearch]);

  const customerDebt = useMemo(() => customers.map((customer) => {
    const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id && !['paid', 'odendi', 'cancelled'].includes(invoice.status));
    const pending = collections.filter((item) => item.customerId === customer.id && item.status === 'bekliyor');
    const lastDue = customerInvoices.map((invoice) => invoice.dueDate).sort()[0];
    return {
      customer,
      invoiceTotal: customerInvoices.reduce((sum, invoice) => sum + Math.max(0, invoice.totalAmount - invoice.paidAmount), 0),
      pendingTotal: pending.reduce((sum, item) => sum + item.amount, 0),
      oldestDays: daysSince(lastDue),
    };
  }).filter((item) => item.customer.balance > 0 || item.invoiceTotal > 0 || item.pendingTotal > 0)
    .sort((a, b) => b.oldestDays - a.oldestDays), [customers, invoices, collections]);

  const filteredDebts = customerDebt.filter((item) => !normalizedSearch || `${item.customer.title} ${item.customer.phone} ${item.customer.authorizedPerson || ''}`.toLocaleLowerCase('tr-TR').includes(normalizedSearch));
  const uninvoiced = jobReceipts.filter((receipt) => ['approved', 'onaylandi'].includes(receipt.status) && !receipt.invoiced);
  const pendingCollections = collections.filter((item) => item.status === 'bekliyor');

  const openDocument = async (path?: string) => {
    if (!path) return;
    setDocBusy(path); setNotice('');
    try {
      const url = await getPaymentDocumentUrl(path);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Belge açılamadı.');
    } finally {
      setDocBusy('');
    }
  };

  const cancel = async (payment: Payment) => {
    const reason = window.prompt('İptal gerekçesi:');
    if (!reason) return;
    try { await cancelPayment(payment.id, reason); } catch (err) { setNotice(err instanceof Error ? err.message : 'İptal edilemedi.'); }
  };

  const exportCsv = (rows: Payment[], fileName: string) => {
    const header = ['Vade', 'Dönem', 'Alıcı', 'Kurum', 'Kategori', 'Taksit', 'Plan tutarı', 'Ödenen', 'Durum', 'Ödeme kanalı', 'Ödeme tarihi', 'Banka/hesap', 'Dekont no', 'Fatura no', 'Belge'];
    const lines = rows.map((item) => [
      item.dueDate, (item.periodMonth || item.dueDate).slice(0, 7), item.recipientName, item.institutionName || '',
      PAYMENT_CATEGORY_LABELS[item.category], item.installmentCount ? `${item.installmentNo || 1}/${item.installmentCount}` : '',
      String(item.amount).replace('.', ','), String(item.paidAmount ?? '').replace('.', ','),
      item.status, item.paymentChannel ? PAYMENT_CHANNEL_LABELS[item.paymentChannel] : '',
      item.paymentDate || item.paidDate || '', item.bankAccount || '', item.referenceNo || '', item.invoiceNo || '',
      item.documentPath ? 'Var' : 'Yok',
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'));
    const blob = new Blob([`\uFEFF${[header.join(';'), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };


  // ==================== ÇEK & SENET TAKİBİ STATE & MANTIK ====================
  const [paperFilter, setPaperFilter] = useState<'all' | CommercialPaperType>('all');
  const [paperStatusFilter, setPaperStatusFilter] = useState<'all' | CommercialPaperStatus>('all');
  const [isAddPaperOpen, setIsAddPaperOpen] = useState(false);
  const [newPaper, setNewPaper] = useState<Partial<CommercialPaper>>({
    type: 'alinan_cek',
    status: 'portfoyde',
    issueDate: today(),
    dueDate: today(),
    amount: 0,
    documentNo: '',
    debtor: '',
    beneficiary: 'Bizim Vinç',
    bankName: '',
    bankBranch: '',
    accountNo: '',
    city: 'İstanbul',
    notes: ''
  });

  const getDaysLeft = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - new Date(today()).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // 10 Günlük Periyodik Takip ve Vade Segmentleri
  const paperStats = useMemo(() => {
    const papers = commercialPapers || [];
    const overdue = papers.filter((p) => p.status === 'portfoyde' && getDaysLeft(p.dueDate) < 0);
    const critical10Days = papers.filter((p) => p.status === 'portfoyde' && getDaysLeft(p.dueDate) >= 0 && getDaysLeft(p.dueDate) <= 10);
    const upcoming30Days = papers.filter((p) => p.status === 'portfoyde' && getDaysLeft(p.dueDate) > 10 && getDaysLeft(p.dueDate) <= 30);
    const totalPortfolio = papers.filter((p) => p.status === 'portfoyde').reduce((s, p) => s + p.amount, 0);

    return {
      overdue,
      critical10Days,
      upcoming30Days,
      totalPortfolio,
      count: papers.length
    };
  }, [commercialPapers]);

  const filteredPapers = useMemo(() => {
    return (commercialPapers || []).filter((p) => {
      if (paperFilter !== 'all' && p.type !== paperFilter) return false;
      if (paperStatusFilter !== 'all' && p.status !== paperStatusFilter) return false;
      if (normalizedSearch) {
        const text = `${p.documentNo} ${p.debtor} ${p.bankName || ''} ${p.beneficiary} ${p.notes || ''}`.toLocaleLowerCase('tr-TR');
        if (!text.includes(normalizedSearch)) return false;
      }
      return true;
    }).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [commercialPapers, paperFilter, paperStatusFilter, normalizedSearch]);

  const exportCommercialPapers = (format: 'excel' | 'html') => {
    const columns = [
      { key: 'tur', label: 'Evrak Türü' },
      { key: 'no', label: 'Çek/Senet No' },
      { key: 'vade', label: 'Vade Tarihi' },
      { key: 'kalan', label: 'Kalan Gün' },
      { key: 'borclu', label: 'Keşideci / Borçlu' },
      { key: 'lehtar', label: 'Lehtar' },
      { key: 'tutar', label: 'Tutar' },
      { key: 'banka', label: 'Banka / Şube' },
      { key: 'durum', label: 'Durum' },
      { key: 'notlar', label: 'Açıklama' }
    ];
    const rows = filteredPapers.map((p) => {
      const days = getDaysLeft(p.dueDate);
      return {
        tur: p.type === 'alinan_cek' ? 'Alınan Çek' : p.type === 'verilen_cek' ? 'Verilen Çek' : p.type === 'alinan_senet' ? 'Alınan Senet' : 'Verilen Senet',
        no: p.documentNo,
        vade: p.dueDate,
        kalan: days < 0 ? `Vadesi Geçti (${Math.abs(days)} gün)` : `${days} gün kaldı`,
        borclu: p.debtor,
        lehtar: p.beneficiary,
        tutar: `${p.amount.toLocaleString('tr-TR')} ₺`,
        banka: p.bankName ? `${p.bankName} (${p.bankBranch || 'Merkez'})` : '—',
        durum: p.status === 'portfoyde' ? 'Portföyde' : p.status === 'tahsile_verildi' ? 'Bankada Tahsilde' : p.status === 'ciro_edildi' ? 'Ciro Edildi' : p.status === 'odendi_tahsil' ? 'Ödendi / Tahsil' : 'Karşılıksız / Protesto',
        notlar: p.notes || ''
      };
    });
    const summary = [
      { label: 'Portföy Toplam Tutarı', value: `${paperStats.totalPortfolio.toLocaleString('tr-TR')} ₺` },
      { label: '10 Gün İçinde Vadesi Dolan', value: `${paperStats.critical10Days.length} Adet` },
      { label: 'Vadesi Geçen / Riskli', value: `${paperStats.overdue.length} Adet` }
    ];
    const title = 'BİZİM VİNÇ Çek & Senet Portföy ve Vade Takip Raporu';
    if (format === 'excel') downloadExcelReport('cek-senet-raporu', title, columns, rows, summary);
    else downloadHtmlReport('cek-senet-raporu', title, columns, rows, summary);
  };

  const exportPaymentPlanReport = (format: 'excel' | 'html') => {
    const columns = [
      { key: 'tarih', label: 'Vade Tarihi' },
      { key: 'tip', label: 'Kategori' },
      { key: 'alici', label: 'Alıcı / Kurum' },
      { key: 'tutar', label: 'Plan Tutarı' },
      { key: 'odenen', label: 'Ödenen' },
      { key: 'kanal', label: 'Ödeme Kanalı' },
      { key: 'durum', label: 'Durum' },
      { key: 'aciklama', label: 'Açıklama' }
    ];
    const rows = inMonth.map((p) => ({
      tarih: p.dueDate,
      tip: PAYMENT_CATEGORY_LABELS[p.category] || p.category,
      alici: p.recipientName || p.institutionName || '—',
      tutar: `${p.amount.toLocaleString('tr-TR')} ₺`,
      odenen: `${(p.paidAmount ?? 0).toLocaleString('tr-TR')} ₺`,
      kanal: p.paymentChannel ? (PAYMENT_CHANNEL_LABELS[p.paymentChannel] || p.paymentChannel) : '—',
      durum: p.status === 'odendi' ? 'Ödendi' : p.status === 'iptal' ? 'İptal' : p.dueDate < today() ? 'Vadesi Geçti' : 'Bekliyor',
      aciklama: p.description || ''
    }));
    const summaryStats = [
      { label: 'Planlanan Toplam', value: money(monthTotals.planned) },
      { label: 'Ödenen Tutar', value: money(monthTotals.paid) },
      { label: 'Bekleyen Tutar', value: money(monthTotals.pending) },
      { label: 'Vadesi Geçen Adet', value: `${monthTotals.overdueCount} Adet` }
    ];
    const title = `BİZİM VİNÇ Ödeme Planlama ve Nakit Akış Raporu (${month})`;
    if (format === 'excel') downloadExcelReport('odeme-planlama-raporu', title, columns, rows, summaryStats);
    else downloadHtmlReport('odeme-planlama-raporu', title, columns, rows, summaryStats);
  };

  const createCollectionPlan = async (event: React.FormEvent) => {
    event.preventDefault();
    const customer = customers.find((item) => item.id === planCustomer);
    const customerName = customer?.title || manualCustomer.trim();
    if (!customerName || !planAmount) return;
    await addCollection({
      customerId: customer?.id || '', customerName, amount: Number(planAmount), date: planDate,
      dueDate: planDate, paymentMethod: 'havale', status: 'bekliyor', notes: planNote || 'Tahsilat planı',
    });
    setPlanAmount(''); setPlanNote(''); setManualCustomer('');
  };

  const shiftMonth = (delta: number) => {
    const [year, monthNumber] = month.split('-').map(Number);
    setMonth(monthKey(new Date(year, (monthNumber || 1) - 1 + delta, 1)));
  };

  if (!canView) {
    
  

return (
      <main className="animate-in fade-in duration-150">
        <section className="mx-auto max-w-lg rounded-[26px] border border-emerald-100 bg-white p-8 text-center shadow-sm">
          <Lock size={30} className="mx-auto text-emerald-600" />
          <h1 className="mt-3 text-lg font-black text-emerald-950">Bu ekran finans ekibine özeldir</h1>
          <p className="mt-2 text-xs text-slate-600">
            Ödeme planlama ve dekont arşivi yalnızca kurucu, yönetici ve muhasebe rolleri tarafından görüntülenebilir.
            Erişim gerekiyorsa yöneticinizden rol güncellemesi talep edin.
          </p>
        </section>
      </main>
    );
  }

  const tabs: { key: typeof tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'month', label: 'Bu Ay', icon: <CalendarClock size={14} /> },
    { key: 'obligations', label: 'Yükümlülükler', icon: <Landmark size={14} />, badge: obligations.length },
    { key: 'report', label: 'Rapor & Dekont Arşivi', icon: <BarChart3 size={14} /> },
    { key: 'new', label: 'Yeni Plan', icon: <Sparkles size={14} /> },
    { key: 'collections', label: 'Tahsilat', icon: <CircleDollarSign size={14} />, badge: pendingCollections.length },
    { key: 'receipts', label: 'Fatura Bekleyen', icon: <FileWarning size={14} />, badge: uninvoiced.length },
  ];

  return (
    <main className="space-y-6 animate-in fade-in duration-150">
      <section className="rounded-[26px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-emerald-600 p-6 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-lime-200">Muhasebe karar ekranı</p>
            <h1 className="mt-2 text-3xl font-black">Ödeme Planlama & Dekont Takibi</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50/80">
              Aylık ödeme takvimi, banka benzeri yükümlülük kartları ve dekontsuz kapatılamayan ödeme kayıtları.
              Her ödeme belgesiyle birlikte raporlanabilir.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => shiftMonth(-1)} className="rounded-xl border border-white/25 bg-white/15 p-2 hover:bg-white/25" aria-label="Önceki ay">
                <ChevronLeft size={15} />
              </button>
              <span className="rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-sm font-black capitalize">{monthLabel(month)}</span>
              <button type="button" onClick={() => shiftMonth(1)} className="rounded-xl border border-white/25 bg-white/15 p-2 hover:bg-white/25" aria-label="Sonraki ay">
                <ChevronRight size={15} />
              </button>
              <button type="button" onClick={() => setMonth(monthKey(new Date()))} className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-[11px] font-black hover:bg-white/25">
                Bu aya dön
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <span className="text-emerald-100">Ayın planı</span>
              <b className="mt-1 block text-xl">{money(monthTotals.planned)}</b>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <span className="text-emerald-100">Ödenen</span>
              <b className="mt-1 block text-xl">{money(monthTotals.paid)}</b>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <span className="text-emerald-100">Bekleyen</span>
              <b className="mt-1 block text-xl">{money(monthTotals.pending)}</b>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
              <span className="text-emerald-100">Vadesi geçen</span>
              <b className="mt-1 block text-xl">{monthTotals.overdueCount}</b>
            </div>
          </div>
        </div>
      </section>

      {monthTotals.overdueCount > 0 && (
        <section className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-950 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <b className="text-sm"><AlertTriangle size={15} className="mr-1 inline" />VADESİ GEÇEN ÖDEME</b>
              <p className="mt-1 text-xs">{monthTotals.overdueCount} ödeme vadesini geçti. Ödeme kaydı için dekont yüklemeniz gerekir.</p>
            </div>
            <b className="text-lg">{money(monthTotals.overdueTotal)}</b>
          </div>
        </section>
      )}

      {notice && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">{notice}</p>}

      <div className="flex flex-col justify-between gap-3 lg:flex-row">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button key={item.key} type="button" onClick={() => setTab(item.key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black ${tab === item.key ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-white text-emerald-800'}`}>
              {item.icon} {item.label}{item.badge ? ` (${item.badge})` : ''}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Alıcı, kurum, fatura no ara"
            className="w-full rounded-xl border border-emerald-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
      </div>

      {tab === 'month' && (
        <section className="space-y-4">
          {categoryBreakdown.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {categoryBreakdown.map(([category, value]) => (
                <button key={category} type="button" onClick={() => setCategoryFilter(categoryFilter === category ? 'all' : category)}
                  className={`rounded-2xl border p-3 text-left shadow-sm ${categoryFilter === category ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-100 bg-white'}`}>
                  <span className="text-[10px] font-black uppercase text-slate-500">{PAYMENT_CATEGORY_LABELS[category]}</span>
                  <b className="mt-1 block text-base text-emerald-900">{money(value.planned)}</b>
                  <span className="text-[10px] text-slate-500">{value.count} kayıt · {money(value.paid)} ödendi</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'bekliyor', 'odendi', 'iptal'] as const).map((key) => (
              <button key={key} type="button" onClick={() => setStatusFilter(key)}
                className={`rounded-xl px-3 py-2 text-[11px] font-black ${statusFilter === key ? 'bg-emerald-900 text-white' : 'border border-emerald-200 bg-white text-emerald-800'}`}>
                {key === 'all' ? 'Tümü' : key === 'bekliyor' ? 'Bekleyen' : key === 'odendi' ? 'Ödenen' : 'İptal'}
              </button>
            ))}
            {categoryFilter !== 'all' && (
              <button type="button" onClick={() => setCategoryFilter('all')} className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-800">
                Kategori filtresini temizle
              </button>
            )}
            <button type="button" onClick={() => exportCsv(monthRows, `odeme-plani-${month}.csv`)}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-800">
              <Download size={13} /> CSV indir
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-100 p-4">
              <h2 className="font-black text-emerald-950 capitalize">{monthLabel(month)} ödeme takvimi</h2>
              <p className="mt-1 text-xs text-slate-500">Ödeme yalnızca dekont / belge yüklenerek kapatılabilir; aksi halde bekleyen olarak kalır.</p>
            </div>
            <div className="divide-y divide-emerald-50">
              {monthRows.length ? monthRows.map((item) => {
                const isOverdue = item.status === 'bekliyor' && item.dueDate < today();
                const receipts = paymentReceipts.filter((doc) => doc.paymentId === item.id);
                return (
                  <div key={item.id} className={`p-4 ${isOverdue ? 'bg-rose-50/60' : item.status === 'odendi' ? 'bg-emerald-50/40' : ''}`}>
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <b className="text-sm text-emerald-950 break-words">{item.recipientName}</b>
                          <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">{PAYMENT_CATEGORY_LABELS[item.category]}</span>
                          {item.status === 'odendi' && <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">Ödendi</span>}
                          {item.status === 'iptal' && <span className="rounded-lg bg-slate-400 px-2 py-0.5 text-[10px] font-black text-white">İptal</span>}
                          {isOverdue && <span className="rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">Vadesi geçti</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span>Vade: {item.dueDate}</span>
                          {item.institutionName && <span><Building2 size={11} className="mr-1 inline" />{item.institutionName}</span>}
                          {item.installmentCount ? <span>Taksit {item.installmentNo || 1}/{item.installmentCount}</span> : null}
                          {item.invoiceNo && <span>Fatura {item.invoiceNo}</span>}
                          {item.status === 'odendi' && item.paymentChannel && <span>{PAYMENT_CHANNEL_LABELS[item.paymentChannel]}</span>}
                          {item.status === 'odendi' && (item.paymentDate || item.paidDate) && <span>Ödeme: {item.paymentDate || item.paidDate}</span>}
                          {item.referenceNo && <span>Dekont no: {item.referenceNo}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <b className={`block text-base ${item.status === 'odendi' ? 'text-emerald-700' : 'text-rose-700'}`}>{money(item.paidAmount ?? item.amount)}</b>
                        {item.status === 'odendi' && item.paidAmount != null && item.paidAmount !== item.amount && (
                          <span className="text-[10px] text-slate-500">Plan: {money(item.amount)}</span>
                        )}
                        <div className="mt-1 flex flex-wrap justify-end gap-2">
                          {item.status === 'bekliyor' && (
                            <>
                              <button type="button" onClick={() => setSettleTarget(item)} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-black text-white">
                                Dekont yükle & öde
                              </button>
                              <button type="button" onClick={() => cancel(item)} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-black text-rose-700">
                                <XCircle size={12} className="mr-1 inline" />İptal
                              </button>
                            </>
                          )}
                          {(item.documentPath || receipts.length > 0) && (
                            <button type="button" disabled={docBusy !== ''} onClick={() => openDocument(item.documentPath || receipts[0]?.filePath)}
                              className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-black text-emerald-800 disabled:opacity-50">
                              <Paperclip size={12} className="mr-1 inline" />Dekontu gör{receipts.length > 1 ? ` (${receipts.length})` : ''}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {item.notes && <p className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600 break-words">{item.notes}</p>}
                  </div>
                );
              }) : (
                <div className="p-10 text-center text-xs text-slate-500">Bu ay için planlanmış ödeme bulunmuyor. “Yeni Plan” sekmesinden ekleyebilirsiniz.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'obligations' && (
        <section className="space-y-3">
          {obligationProgress.length ? obligationProgress.map((entry) => {
            const percent = entry.obligation.totalAmount > 0 ? Math.min(100, Math.round((entry.paidTotal / entry.obligation.totalAmount) * 100)) : 0;
            const isOpen = expanded === entry.obligation.id;
            return (
              <article key={entry.obligation.id} className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
                <button type="button" onClick={() => setExpanded(isOpen ? null : entry.obligation.id)} className="w-full p-4 text-left">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="text-sm text-emerald-950 break-words">{entry.obligation.title}</b>
                        <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800">{PAYMENT_CATEGORY_LABELS[entry.obligation.category]}</span>
                        {entry.obligation.recurring && <span className="rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">Aylık tekrar</span>}
                        {entry.overdue && <span className="rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white">Gecikme</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>{entry.obligation.institutionName || entry.obligation.recipientName}</span>
                        {entry.obligation.contractNo && <span>Sözleşme: {entry.obligation.contractNo}</span>}
                        {entry.obligation.subscriberNo && <span>Abone no: {entry.obligation.subscriberNo}</span>}
                        {entry.obligation.plate && <span>Plaka: {entry.obligation.plate}</span>}
                        {entry.obligation.startDate && <span>Başlangıç: {entry.obligation.startDate}</span>}
                        {entry.obligation.endDate && <span>Vade sonu: {entry.obligation.endDate}</span>}
                        {entry.obligation.interestRate ? <span>Faiz: %{entry.obligation.interestRate}</span> : null}
                        {entry.obligation.iban && <span>IBAN: {entry.obligation.iban}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <b className="block text-base text-emerald-900">{money(entry.obligation.totalAmount)}</b>
                      <span className="text-[11px] text-slate-500">Kalan {money(entry.remaining)}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500">Sıradaki vade: {entry.nextDue || 'tamamlandı'}</span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-50">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="mt-1 block text-[10px] font-bold text-slate-500">
                      {entry.paidCount}/{entry.totalCount} taksit ödendi · %{percent} tamamlandı · detay için tıklayın
                    </span>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-emerald-100 bg-emerald-50/40 p-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead className="text-slate-500">
                          <tr>
                            <th className="p-2 text-left font-bold">Taksit</th>
                            <th className="p-2 text-left font-bold">Vade</th>
                            <th className="p-2 text-right font-bold">Tutar</th>
                            <th className="p-2 text-left font-bold">Durum</th>
                            <th className="p-2 text-left font-bold">Kanal / dekont</th>
                            <th className="p-2 text-right font-bold">İşlem</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-emerald-100 bg-white">
                          {entry.rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((row) => (
                            <tr key={row.id}>
                              <td className="p-2">{row.installmentNo || 1}/{row.installmentCount || entry.totalCount}</td>
                              <td className="p-2">{row.dueDate}</td>
                              <td className="p-2 text-right font-bold">{money(row.paidAmount ?? row.amount)}</td>
                              <td className="p-2">{row.status === 'odendi' ? 'Ödendi' : row.status === 'iptal' ? 'İptal' : row.dueDate < today() ? 'Gecikti' : 'Bekliyor'}</td>
                              <td className="p-2">
                                {row.paymentChannel ? PAYMENT_CHANNEL_LABELS[row.paymentChannel] : '—'}
                                {row.referenceNo ? ` · ${row.referenceNo}` : ''}
                              </td>
                              <td className="p-2 text-right">
                                {row.status === 'bekliyor' ? (
                                  <button type="button" onClick={() => setSettleTarget(row)} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[10px] font-black text-white">Dekontla öde</button>
                                ) : row.documentPath ? (
                                  <button type="button" onClick={() => openDocument(row.documentPath)} className="rounded-lg border border-emerald-200 px-2.5 py-1 text-[10px] font-black text-emerald-800">Belge</button>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {entry.obligation.notes && <p className="mt-2 text-[11px] text-slate-600 break-words">Not: {entry.obligation.notes}</p>}
                  </div>
                )}
              </article>
            );
          }) : (
            <div className="rounded-2xl border border-emerald-100 bg-white p-10 text-center text-xs text-slate-500 shadow-sm">
              Kayıtlı yükümlülük yok. Leasing, kredi, DBS veya abonelik planlarını “Yeni Plan” sekmesinden oluşturun.
            </div>
          )}
        </section>
      )}

      {tab === 'report' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => exportCsv(payments.filter((item) => item.status === 'odendi'), 'odeme-raporu-tum.csv')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-[11px] font-black text-white">
              <Download size={13} /> Tüm ödemeler (CSV)
            </button>
            <button type="button" onClick={() => exportCsv(inMonth, `odeme-raporu-${month}.csv`)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-800">
              <Download size={13} /> {monthLabel(month)} (CSV)
            </button>
            <button type="button" onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-[11px] font-black text-emerald-800">
              <Printer size={13} /> Yazdır / PDF
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-500">Dekontlu ödeme sayısı</span>
              <b className="mt-1 block text-2xl text-emerald-900">{payments.filter((item) => item.status === 'odendi' && (item.documentPath || item.receiptCount)).length}</b>
              <span className="text-[10px] text-slate-500">Toplam {payments.filter((item) => item.status === 'odendi').length} kapatılmış ödeme</span>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-500">Arşivdeki belge</span>
              <b className="mt-1 block text-2xl text-emerald-900">{paymentReceipts.length}</b>
              <span className="text-[10px] text-slate-500">Dekont, fatura, makbuz ve ekstre</span>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <span className="text-[10px] font-black uppercase text-slate-500">Kanal dağılımı</span>
              <div className="mt-1 space-y-1">
                {Object.entries(payments.filter((item) => item.status === 'odendi').reduce<Record<string, number>>((acc, item) => {
                  const key = item.paymentChannel ? PAYMENT_CHANNEL_LABELS[item.paymentChannel] : 'Belirtilmedi';
                  acc[key] = (acc[key] || 0) + (item.paidAmount ?? item.amount);
                  return acc;
                }, {})).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{label}</span>
                    <b className="text-emerald-900">{money(value)}</b>
                  </div>
                ))}
                {payments.filter((item) => item.status === 'odendi').length === 0 && <span className="text-[11px] text-slate-500">Henüz kapatılmış ödeme yok.</span>}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-100 p-4">
              <h2 className="font-black text-emerald-950">Dekont arşivi</h2>
              <p className="mt-1 text-xs text-slate-500">Her ödeme belgesi 300 saniyelik güvenli bağlantı ile açılır.</p>
            </div>
            <div className="divide-y divide-emerald-50">
              {paymentReceipts.length ? paymentReceipts
                .filter((doc) => !normalizedSearch || `${doc.fileName} ${doc.bankName || ''} ${doc.referenceNo || ''}`.toLocaleLowerCase('tr-TR').includes(normalizedSearch))
                .slice(0, 100)
                .map((doc) => {
                  const related = payments.find((item) => item.id === doc.paymentId);
                  return (
                    <div key={doc.id} className="flex flex-col justify-between gap-2 p-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <b className="block text-xs text-emerald-950 break-words">{related?.recipientName || doc.fileName}</b>
                        <span className="text-[11px] text-slate-500 break-words">
                          {doc.docType} · {doc.paidAt || doc.createdAt.slice(0, 10)}
                          {doc.referenceNo ? ` · ${doc.referenceNo}` : ''}
                          {doc.amount ? ` · ${money(doc.amount)}` : ''}
                        </span>
                      </div>
                      <button type="button" onClick={() => openDocument(doc.filePath)} disabled={docBusy !== ''}
                        className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-[11px] font-black text-emerald-800 disabled:opacity-50">
                        <FileText size={12} className="mr-1 inline" />Belgeyi aç
                      </button>
                    </div>
                  );
                }) : <div className="p-10 text-center text-xs text-slate-500">Arşivde belge yok.</div>}
            </div>
          </div>
        </section>
      )}

      {tab === 'new' && <PaymentPlanWizard onCreated={() => setTab('obligations')} />}

      {tab === 'collections' && (
        <section className="grid gap-5 xl:grid-cols-[1fr_330px]">
          <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-100 p-4">
              <h2 className="font-black text-emerald-950">Tahsilat öncelik sırası</h2>
              <p className="mt-1 text-xs text-slate-500">En uzun süredir borçlu olan cari üstte gösterilir.</p>
            </div>
            <div className="divide-y divide-emerald-50">
              {filteredDebts.length ? filteredDebts.map((item, index) => (
                <div key={item.customer.id} className="flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
                  <div className="flex gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${index < 3 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{index + 1}</div>
                    <div className="min-w-0">
                      <b className="text-sm text-emerald-950 break-words">{item.customer.title}</b>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                        <span><Phone size={11} className="mr-1 inline" />{item.customer.phone || 'Telefon yok'}</span>
                        <span>{item.customer.authorizedPerson || 'Yetkili belirtilmemiş'}</span>
                        <span>{item.oldestDays ? `${item.oldestDays} gündür vadesi geçmiş` : 'Güncel takip'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <b className="block text-base text-rose-700">{money(Math.max(item.customer.balance, item.invoiceTotal))}</b>
                    <button type="button" onClick={() => { setPlanCustomer(item.customer.id); setPlanAmount(String(Math.max(item.customer.balance, item.invoiceTotal))); }}
                      className="mt-1 text-[11px] font-bold text-emerald-700 hover:underline">Tahsilat planı oluştur</button>
                  </div>
                </div>
              )) : <div className="p-10 text-center text-xs text-slate-500">Takip gerektiren cari bulunmuyor.</div>}
            </div>
          </div>

          <div className="h-fit space-y-4">
            <form onSubmit={createCollectionPlan} className="h-fit space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarClock size={17} className="text-emerald-600" />
                <h3 className="font-black text-emerald-950">Tahsilat planı oluştur</h3>
              </div>
              <select value={planCustomer} onChange={(event) => setPlanCustomer(event.target.value)} className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-xs">
                <option value="">Cari / firma seçin</option>
                {customers.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
              <input value={manualCustomer} onChange={(event) => setManualCustomer(event.target.value)} placeholder="veya cari/firma adını yazın"
                className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-xs" />
              <input required type="number" min="0" step="0.01" value={planAmount} onChange={(event) => setPlanAmount(event.target.value)} placeholder="Tutar"
                className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-xs" />
              <input required type="date" value={planDate} onChange={(event) => setPlanDate(event.target.value)}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-xs" />
              <textarea value={planNote} onChange={(event) => setPlanNote(event.target.value)} placeholder="Not / takip aksiyonu" rows={3}
                className="w-full rounded-xl border border-emerald-200 px-3 py-2.5 text-xs" />
              <button type="submit" className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white hover:bg-emerald-700">Planı kaydet</button>
            </form>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-black text-emerald-950">Bekleyen tahsilatlar ({pendingCollections.length})</h3>
              <div className="mt-2 space-y-2">
                {pendingCollections.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50/60 px-3 py-2">
                    <div className="min-w-0">
                      <b className="block text-[11px] text-emerald-950 break-words">{item.customerName}</b>
                      <span className="text-[10px] text-slate-500">Vade {item.dueDate || item.date}</span>
                    </div>
                    <div className="text-right">
                      <b className="block text-[11px] text-emerald-800">{money(item.amount)}</b>
                      <button type="button" onClick={() => markCollectionReceived(item.id)} className="text-[10px] font-bold text-emerald-700 hover:underline">Tahsil edildi</button>
                    </div>
                  </div>
                ))}
                {pendingCollections.length === 0 && <p className="text-[11px] text-slate-500">Bekleyen tahsilat yok.</p>}
              </div>
            </div>
          </div>
        </section>
      )}

      
      {tab === 'checks' && (
        <div className="space-y-6">
          {/* 10 GÜNDE BİR PERİYODİK UYARI VE VADE TAKİP BİLDİRİM PANELİ */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border ${paperStats.critical10Days.length > 0 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800">⚠️ 10 Günlük Vade Alarmı</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white animate-pulse">10 Günde Bir</span>
              </div>
              <div className="text-2xl font-black mt-2 text-amber-900">{paperStats.critical10Days.length} Evrak</div>
              <div className="text-xs text-amber-700 mt-1">Önümüzdeki 10 gün içinde tahsilatı/ödemesi gelen çek ve senetler.</div>
            </div>

            <div className={`p-4 rounded-2xl border ${paperStats.overdue.length > 0 ? 'bg-red-50 border-red-300 text-red-950' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-800">🚨 Vadesi Geçmiş Evraklar</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-600 text-white">Acil Takip</span>
              </div>
              <div className="text-2xl font-black mt-2 text-red-900">{paperStats.overdue.length} Evrak</div>
              <div className="text-xs text-red-700 mt-1">Günü dolup henüz tahsilatı veya ödemesi kaydedilmemiş kayıtlar.</div>
            </div>

            <div className="p-4 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-950">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">💼 Aktif Portföy Hacmi</span>
              <div className="text-2xl font-black mt-2 text-emerald-900">{paperStats.totalPortfolio.toLocaleString('tr-TR')} ₺</div>
              <div className="text-xs text-emerald-700 mt-1">Portföyde tahsil veya ödeme bekleyen net tutar.</div>
            </div>

            <div className="p-4 rounded-2xl border bg-blue-50 border-blue-200 text-blue-950">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">📅 11 - 30 Gün Kalanlar</span>
              <div className="text-2xl font-black mt-2 text-blue-900">{paperStats.upcoming30Days.length} Evrak</div>
              <div className="text-xs text-blue-700 mt-1">Ay sonu ve gelecek nakit akışını etkileyecek evraklar.</div>
            </div>
          </div>

          {/* ARAÇ ÇUBUĞU: FİLTRELER, YENİ EVRAK VE RAPOR BUTONLARI */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={paperFilter}
                onChange={(e) => setPaperFilter(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="all">Tüm Evrak Türleri</option>
                <option value="alinan_cek">Alınan Çekler</option>
                <option value="verilen_cek">Verilen Çekler</option>
                <option value="alinan_senet">Alınan Senetler</option>
                <option value="verilen_senet">Verilen Senetler</option>
              </select>

              <select
                value={paperStatusFilter}
                onChange={(e) => setPaperStatusFilter(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="portfoyde">Portföyde</option>
                <option value="tahsile_verildi">Bankada Tahsilde</option>
                <option value="ciro_edildi">Ciro Edildi</option>
                <option value="odendi_tahsil">Ödendi / Tahsil Edildi</option>
                <option value="karsiliksiz_protesto">Karşılıksız / Protestolu</option>
                <option value="iade_edildi">İade Edildi</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportCommercialPapers('excel')}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                📊 Excel Raporu
              </button>
              <button
                type="button"
                onClick={() => exportCommercialPapers('html')}
                className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-900 transition flex items-center gap-1.5"
              >
                🏛️ Kurumsal HTML Rapor
              </button>
              <button
                type="button"
                onClick={() => setIsAddPaperOpen(true)}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-black text-white shadow-md hover:bg-emerald-800 transition flex items-center gap-1.5"
              >
                + Yeni Çek / Senet Girişi
              </button>
            </div>
          </div>

          {/* ÇEK & SENET LİSTESİ TABLOSU */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Evrak Türü / No</th>
                  <th className="p-3.5">Keşideci (Borçlu) / Lehtar</th>
                  <th className="p-3.5">Banka & Şube</th>
                  <th className="p-3.5">Vade / 10 Gün Uyarısı</th>
                  <th className="p-3.5">Tutar</th>
                  <th className="p-3.5">Durum</th>
                  <th className="p-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPapers.map((paper) => {
                  const days = getDaysLeft(paper.dueDate);
                  const is10Days = days >= 0 && days <= 10;
                  const isOverdue = days < 0 && paper.status === 'portfoyde';

                  return (
                    <tr key={paper.id} className={`hover:bg-slate-50 transition ${isOverdue ? 'bg-red-50/30' : is10Days ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-3.5 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            paper.type.includes('cek') ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {paper.type === 'alinan_cek' ? 'Alınan Çek' : paper.type === 'verilen_cek' ? 'Verilen Çek' : paper.type === 'alinan_senet' ? 'Alınan Senet' : 'Verilen Senet'}
                          </span>
                        </div>
                        <div className="text-slate-900 font-mono font-bold text-sm mt-1">{paper.documentNo}</div>
                        {paper.serialNo && <div className="text-[10px] text-slate-500">Seri: {paper.serialNo}</div>}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{paper.debtor}</div>
                        {paper.debtorTaxId && <div className="text-[10px] text-slate-500 font-mono">VKN/TCKN: {paper.debtorTaxId}</div>}
                        <div className="text-[11px] text-slate-600 mt-0.5">Lehtar: {paper.beneficiary}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-medium text-slate-900">{paper.bankName || 'Banka Belirtilmedi'}</div>
                        <div className="text-[11px] text-slate-500">{paper.bankBranch || '—'} {paper.city ? `(${paper.city})` : ''}</div>
                        {paper.accountNo && <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">{paper.accountNo}</div>}
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{paper.dueDate}</div>
                        {isOverdue ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                            Vadesi Geçti ({Math.abs(days)} gün)
                          </span>
                        ) : is10Days ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">
                            ⚠️ {days} Gün Kaldı (10 Gün Uyarısı)
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">{days} gün sonra</span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">Keşide: {paper.issueDate}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-sm font-black text-slate-900">{paper.amount.toLocaleString('tr-TR')} ₺</div>
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          paper.status === 'portfoyde' ? 'bg-emerald-100 text-emerald-800' :
                          paper.status === 'tahsile_verildi' ? 'bg-blue-100 text-blue-800' :
                          paper.status === 'ciro_edildi' ? 'bg-indigo-100 text-indigo-800' :
                          paper.status === 'odendi_tahsil' ? 'bg-teal-100 text-teal-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {paper.status === 'portfoyde' ? 'Portföyde' :
                           paper.status === 'tahsile_verildi' ? 'Tahsilde' :
                           paper.status === 'ciro_edildi' ? 'Ciro Edildi' :
                           paper.status === 'odendi_tahsil' ? 'Tahsil/Ödendi' :
                           paper.status === 'karsiliksiz_protesto' ? 'Protestolu' : 'İade Edildi'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right space-x-1">
                        <select
                          value={paper.status}
                          onChange={(e) => updateCommercialPaperStatus(paper.id, e.target.value as any)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700"
                        >
                          <option value="portfoyde">Portföyde</option>
                          <option value="tahsile_verildi">Tahsile Ver</option>
                          <option value="ciro_edildi">Ciro Et</option>
                          <option value="odendi_tahsil">Tahsil / Ödendi Yap</option>
                          <option value="karsiliksiz_protesto">Karşılıksız / Protesto</option>
                          <option value="iade_edildi">İade Et</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Bu evrak kaydını silmek istediğinize emin misiniz?')) {
                              deleteCommercialPaper(paper.id);
                            }
                          }}
                          className="rounded-lg px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50"
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* YENİ ÇEK / SENET MODALI */}
          {isAddPaperOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-black text-slate-900">Yeni Çek / Senet Evrak Kaydı</h3>
                  <button type="button" onClick={() => setIsAddPaperOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">✕</button>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newPaper.documentNo || !newPaper.debtor || !newPaper.amount) {
                      alert('Lütfen Evrak No, Keşideci/Borçlu ve Tutar alanlarını doldurun.');
                      return;
                    }
                    await addCommercialPaper(newPaper as any);
                    setIsAddPaperOpen(false);
                    setNotice('Çek/Senet evrakı başarıyla portföye kaydedildi.');
                  }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Evrak Türü</label>
                      <select
                        value={newPaper.type}
                        onChange={(e) => setNewPaper({ ...newPaper, type: e.target.value as any })}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold"
                      >
                        <option value="alinan_cek">Alınan Çek (Müşteriden)</option>
                        <option value="verilen_cek">Verilen Çek (Tedarikçiye)</option>
                        <option value="alinan_senet">Alınan Senet (Bono)</option>
                        <option value="verilen_senet">Verilen Senet (Bono)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700">Çek / Senet No *</label>
                      <input
                        type="text"
                        placeholder="Örn: CK-884920"
                        value={newPaper.documentNo}
                        onChange={(e) => setNewPaper({ ...newPaper, documentNo: e.target.value })}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Tutar (₺) *</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={newPaper.amount || ''}
                        onChange={(e) => setNewPaper({ ...newPaper, amount: Number(e.target.value) })}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Düzenleme Tarihi</label>
                      <input
                        type="date"
                        value={newPaper.issueDate}
                        onChange={(e) => setNewPaper({ ...newPaper, issueDate: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Vade Tarihi *</label>
                      <input
                        type="date"
                        value={newPaper.dueDate}
                        onChange={(e) => setNewPaper({ ...newPaper, dueDate: e.target.value })}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-bold text-emerald-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Keşideci (Borçlu) *</label>
                      <input
                        type="text"
                        placeholder="Borçlu Firma veya Şahıs Adı"
                        value={newPaper.debtor}
                        onChange={(e) => setNewPaper({ ...newPaper, debtor: e.target.value })}
                        required
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Borçlu VKN / TCKN</label>
                      <input
                        type="text"
                        placeholder="10 veya 11 haneli vergi/TC no"
                        value={newPaper.debtorTaxId || ''}
                        onChange={(e) => setNewPaper({ ...newPaper, debtorTaxId: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700">Lehtar (Kime Düzenlendiği)</label>
                      <input
                        type="text"
                        value={newPaper.beneficiary}
                        onChange={(e) => setNewPaper({ ...newPaper, beneficiary: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700">Ödeme / Keşide Yeri (Şehir)</label>
                      <input
                        type="text"
                        placeholder="İstanbul"
                        value={newPaper.city || ''}
                        onChange={(e) => setNewPaper({ ...newPaper, city: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                      />
                    </div>
                  </div>

                  {newPaper.type?.includes('cek') && (
                    <div className="grid grid-cols-3 gap-4 rounded-2xl bg-slate-50 p-3 border border-slate-200">
                      <div>
                        <label className="text-xs font-bold text-slate-700">Banka Adı</label>
                        <input
                          type="text"
                          placeholder="Örn: Vakıf Katılım"
                          value={newPaper.bankName || ''}
                          onChange={(e) => setNewPaper({ ...newPaper, bankName: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700">Şube Adı/Kodu</label>
                        <input
                          type="text"
                          placeholder="Pendik Şb. (0421)"
                          value={newPaper.bankBranch || ''}
                          onChange={(e) => setNewPaper({ ...newPaper, bankBranch: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700">Hesap No / IBAN</label>
                        <input
                          type="text"
                          placeholder="TR..."
                          value={newPaper.accountNo || ''}
                          onChange={(e) => setNewPaper({ ...newPaper, accountNo: e.target.value })}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700">Açıklama & Notlar</label>
                    <textarea
                      rows={2}
                      placeholder="Hakediş, fatura veya sözleşme referansı..."
                      value={newPaper.notes || ''}
                      onChange={(e) => setNewPaper({ ...newPaper, notes: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddPaperOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-black text-white hover:bg-emerald-800 shadow"
                    >
                      Portföye Kaydet
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'receipts' && (
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
          <div className="border-b border-amber-100 bg-amber-50 p-4">
            <h2 className="font-black text-amber-950">Fatura kesilmesi gereken iş makbuzları</h2>
            <p className="mt-1 text-xs text-amber-800">Onaylanmış ancak faturaya dönüştürülmemiş işler burada tutulur.</p>
          </div>
          <div className="divide-y divide-amber-50">
            {uninvoiced.length ? uninvoiced.map((receipt) => (
              <div key={receipt.id} className="flex flex-col justify-between gap-3 p-4 md:flex-row md:items-center">
                <div className="min-w-0">
                  <b className="text-sm text-emerald-950 break-words">{receipt.customerName}</b>
                  <div className="mt-1 text-xs text-slate-500">{receipt.receiptNo} · {receipt.date} · {receipt.craneCode} · {receipt.workingHours || 0} saat</div>
                </div>
                <button type="button" onClick={() => setTab('collections')} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white">Cari takibe yönlendir</button>
              </div>
            )) : <div className="p-10 text-center text-xs text-slate-500">Fatura bekleyen onaylı iş makbuzu yok.</div>}
          </div>
        </section>
      )}

      <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck size={13} className="text-emerald-600" />
        Ödeme kapatma işlemleri veritabanı tarafında da denetlenir: dekont, ödeme kanalı ve tarih olmadan kayıt kapatılamaz.
      </p>

      {settleTarget && <PaymentSettleModal payment={settleTarget} onClose={() => setSettleTarget(null)} />}
    </main>
  );
};
