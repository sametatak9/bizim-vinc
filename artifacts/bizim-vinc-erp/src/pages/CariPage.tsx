import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Customer, Site, Collection, Payment } from '../types';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard,
  X,
  History,
} from 'lucide-react';

export const CariPage: React.FC = () => {
  const {
    customers,
    sites,
    collections,
    payments,
    invoices,
    jobReceipts,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSite,
    addCollection,
    markCollectionReceived,
    addPayment,
    markPaymentPaid,
  } = useERP();

  const [activeTab, setActiveTab] = useState<'customers' | 'sites' | 'collections' | 'payments'>('customers');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerForEkstre, setSelectedCustomerForEkstre] = useState<Customer | null>(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    taxNo: '',
    taxOffice: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
    type: 'musteri' as 'musteri' | 'taseron' | 'diger',
    initialBalance: 0,
  });

  const [siteForm, setSiteForm] = useState({
    customerId: '',
    name: '',
    location: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
  });

  const [collectionForm, setCollectionForm] = useState({
    customerId: '',
    amount: 10000,
    paymentMethod: 'havale' as 'havale' | 'nakit' | 'cek' | 'kredi_karti',
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    recipientType: 'tedarikci' as 'personel' | 'tedarikci' | 'diger',
    recipientName: '',
    category: 'yakit' as 'maas' | 'avans' | 'yakit' | 'bakim' | 'kira' | 'masraf' | 'diger',
    amount: 5000,
    dueDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'havale' as 'havale' | 'nakit' | 'kredi_karti',
    notes: '',
  });

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const custTitle = (c.title || c.name || '').toLowerCase();
    const contact = (c.authorizedPerson || c.contactName || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const tax = (c.vknTckn || c.taxNo || '').toLowerCase();
    return (
      custTitle.includes(term) ||
      contact.includes(term) ||
      phone.includes(term) ||
      tax.includes(term)
    );
  });

  // Filtered Sites
  const filteredSites = sites.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.customerName?.toLowerCase().includes(term) ||
      s.location?.toLowerCase().includes(term)
    );
  });

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCustomer({
      title: customerForm.name,
      name: customerForm.name,
      vknTckn: customerForm.taxNo || undefined,
      taxNo: customerForm.taxNo || undefined,
      taxOffice: customerForm.taxOffice || undefined,
      authorizedPerson: customerForm.contactName || undefined,
      contactName: customerForm.contactName || undefined,
      phone: customerForm.phone || '',
      email: customerForm.email || undefined,
      address: customerForm.address || undefined,
      type: customerForm.type,
      balance: Number(customerForm.initialBalance) || 0,
    });
    setIsCustomerModalOpen(false);
    setCustomerForm({
      name: '',
      taxNo: '',
      taxOffice: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      type: 'musteri',
      initialBalance: 0,
    });
  };

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === siteForm.customerId);
    await addSite({
      customerId: siteForm.customerId,
      customerName: cust?.title || cust?.name || '',
      name: siteForm.name,
      location: siteForm.location,
      address: siteForm.address || undefined,
      contactPerson: siteForm.contactPerson || undefined,
      contactPhone: siteForm.contactPhone || undefined,
      phone: siteForm.contactPhone || undefined,
      status: 'aktif',
    });
    setIsSiteModalOpen(false);
    setSiteForm({
      customerId: '',
      name: '',
      location: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
    });
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === collectionForm.customerId);
    if (!cust) return;

    await addCollection({
      customerId: collectionForm.customerId,
      customerName: cust.title || cust.name || 'Müşteri',
      amount: Number(collectionForm.amount),
      date: collectionForm.dueDate,
      dueDate: collectionForm.dueDate,
      paymentMethod: collectionForm.paymentMethod,
      status: 'bekliyor',
      notes: collectionForm.notes || undefined,
    });
    setIsCollectionModalOpen(false);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPayment({
      recipientType: paymentForm.recipientType,
      recipientName: paymentForm.recipientName,
      category: paymentForm.category,
      amount: Number(paymentForm.amount),
      dueDate: paymentForm.dueDate,
      paymentMethod: paymentForm.paymentMethod,
      status: 'bekliyor',
      notes: paymentForm.notes || undefined,
    });
    setIsPaymentModalOpen(false);
  };

  const totalReceivables = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const pendingCollectionsTotal = collections
    .filter((c) => c.status === 'bekliyor')
    .reduce((sum, c) => sum + c.amount, 0);
  const receivedTotal = collections.filter((c) => c.status === 'tahsil_edildi').reduce((sum, c) => sum + c.amount, 0);
  const paidTotal = payments.filter((p) => p.status === 'odendi').reduce((sum, p) => sum + p.amount, 0);
  const netCashBalance = receivedTotal - paidTotal;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Building2 size={16} />
              <span>Cari Hesap & Proje Yönetimi</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 mt-1">Cari & Şantiyeler</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Müşteri cari bakiyelerini, aktif şantiyeleri ve tahsilat akışlarını tek ekrandan yönetin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Yeni Cari Kart</span>
            </button>
            <button
              onClick={() => setIsSiteModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Yeni Şantiye</span>
            </button>
            <button
              onClick={() => setIsCollectionModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <ArrowDownLeft size={16} />
              <span>Tahsilat Ekle</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-50">
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Toplam Cari Alacak Bakiyesi
            </span>
            <div className="text-xl font-black text-emerald-950 mt-1">
              {totalReceivables.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-emerald-700">{customers.length} kayıtlı cari</div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
              Bekleyen Tahsilat
            </span>
            <div className="text-xl font-black text-emerald-950 mt-1">
              {pendingCollectionsTotal.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-emerald-700">Vadeli açık kayıtlar</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">
              Aktif Şantiyeler
            </span>
            <div className="text-xl font-black text-blue-950 mt-1">
              {sites.filter((s) => s.status === 'aktif').length} Şantiye
            </div>
            <div className="text-xs text-blue-700">Marmara & Ege Bölgesi</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
              Gerçekleşen Tahsilatlar
            </span>
            <div className="text-xl font-black text-slate-800 mt-1">
              {collections
                .filter((c) => c.status === 'tahsil_edildi')
                .reduce((sum, c) => sum + c.amount, 0)
                .toLocaleString('tr-TR')}{' '}
              ₺
            </div>
            <div className="text-xs text-slate-500">Kasaya giren</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide">Banka / Kasa Net</span>
            <div className={`text-xl font-black mt-1 ${netCashBalance >= 0 ? 'text-blue-950' : 'text-rose-700'}`}>{netCashBalance.toLocaleString('tr-TR')} ₺</div>
            <div className="text-xs text-blue-700">Tahsilat − gerçekleşen ödeme</div>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex items-center justify-between gap-4 border-b border-emerald-100 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>Cari Kartlar</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
              {customers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'sites'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>Şantiyeler</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {sites.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'collections'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>Tahsilatlar</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {collections.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-100'
            }`}
          >
            <span>Tedarikçi Ödemeleri</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
              {payments.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari adı, telefon, şantiye..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-emerald-100 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* TAB 1: CARİ KARTLAR */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Firma / Cari Ünvanı</th>
                  <th className="p-3.5">Tip</th>
                  <th className="p-3.5">Vergi No / Daire</th>
                  <th className="p-3.5">İletişim & Yetkili</th>
                  <th className="p-3.5">Bağlı Şantiyeler</th>
                  <th className="p-3.5 text-right">Güncel Bakiye (Alacak)</th>
                  <th className="p-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Kayıtlı cari hesap bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const custSites = sites.filter((s) => s.customerId === cust.id);
                    return (
                      <tr key={cust.id} className="hover:bg-emerald-50/40 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-sm">{cust.title || cust.name}</div>
                          <div className="text-[11px] text-slate-500">{cust.address || 'Adres belirtilmedi'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {cust.type === 'musteri' ? 'Müşteri' : cust.type === 'taseron' ? 'Taşeron' : 'Müşteri'}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {cust.vknTckn || cust.taxNo ? `${cust.vknTckn || cust.taxNo} / ${cust.taxOffice || 'VD'}` : '—'}
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-800">{cust.authorizedPerson || cust.contactName || '—'}</div>
                          <div className="text-[11px] text-slate-500">{cust.phone || cust.email || '—'}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {custSites.length} Şantiye
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-base text-emerald-950">
                          {(cust.balance || 0).toLocaleString('tr-TR')} ₺
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setSelectedCustomerForEkstre(cust)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <History size={13} />
                            <span>Cari Ekstre</span>
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

      {/* TAB 2: ŞANTİYELER */}
      {activeTab === 'sites' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Şantiye Adı</th>
                  <th className="p-3.5">Bağlı Cari (Müşteri)</th>
                  <th className="p-3.5">Lokasyon / Adres</th>
                  <th className="p-3.5">Şantiye Şefi / Telefon</th>
                  <th className="p-3.5 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {filteredSites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Kayıtlı şantiye bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-emerald-50/40 transition">
                      <td className="p-3.5 font-bold text-slate-900 text-sm">
                        {site.name}
                      </td>
                      <td className="p-3.5 font-semibold text-emerald-900">
                        {site.customerName || 'Müşteri'}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div className="font-medium text-slate-800">{site.location}</div>
                        <div className="text-[11px] text-slate-500">{site.address || '—'}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{site.contactPerson || '—'}</div>
                        <div className="text-[11px] text-slate-500">{site.contactPhone || '—'}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {site.status === 'aktif' ? 'Aktif Proje' : 'Tamamlandı'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: TAHSİLATLAR */}
      {activeTab === 'collections' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Müşteri</th>
                  <th className="p-3.5">Fatura No</th>
                  <th className="p-3.5">Vade / İşlem Tarihi</th>
                  <th className="p-3.5">Yöntem</th>
                  <th className="p-3.5">Açıklama</th>
                  <th className="p-3.5 text-right">Tutar</th>
                  <th className="p-3.5 text-center">Durum</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {collections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Henüz tahsilat kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  collections.map((col) => (
                    <tr key={col.id} className="hover:bg-emerald-50/40 transition">
                      <td className="p-3.5 font-bold text-slate-800">{col.customerName}</td>
                      <td className="p-3.5 font-mono text-slate-600">{col.invoiceNo || '—'}</td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">{col.dueDate || col.date}</td>
                      <td className="p-3.5 uppercase font-bold text-[10px] text-slate-600">{col.paymentMethod}</td>
                      <td className="p-3.5 text-slate-500">{col.notes || '—'}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-base text-slate-900">
                        {col.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-3.5 text-center">
                        {col.status === 'tahsil_edildi' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Tahsil Edildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Clock size={12} /> Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {col.status === 'bekliyor' && (
                          <button
                            onClick={() => markCollectionReceived(col.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                          >
                            Tahsil Al
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TEDARİKÇİ & HİZMET ÖDEMELERİ */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-emerald-50/60 text-emerald-950 font-bold border-b border-emerald-100 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Alıcı / Tedarikçi</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Vade Tarihi</th>
                  <th className="p-3.5">Ödeme Yolu</th>
                  <th className="p-3.5">Açıklama</th>
                  <th className="p-3.5 text-right">Tutar</th>
                  <th className="p-3.5 text-center">Durum</th>
                  <th className="p-3.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Henüz ödeme kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-emerald-50/40 transition">
                      <td className="p-3.5 font-bold text-slate-800">{p.recipientName}</td>
                      <td className="p-3.5 capitalize text-slate-600 font-semibold">{p.category}</td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">{p.dueDate}</td>
                      <td className="p-3.5 uppercase font-bold text-[10px] text-slate-600">{p.paymentMethod || 'Havale'}</td>
                      <td className="p-3.5 text-slate-500">{p.notes || '—'}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-base text-slate-900">
                        {p.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="p-3.5 text-center">
                        {p.status === 'odendi' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={12} /> Ödendi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <Clock size={12} /> Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {p.status === 'bekliyor' && (
                          <button
                            onClick={() => markPaymentPaid(p.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition"
                          >
                            Ödendi Yap
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: YENİ CARİ KART */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Yeni Cari Hesap Kartı Aç</h3>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cari / Firma Ünvanı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Yılmaz İnşaat A.Ş."
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vergi No / T.C.</label>
                  <input
                    type="text"
                    value={customerForm.taxNo}
                    onChange={(e) => setCustomerForm({ ...customerForm, taxNo: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vergi Dairesi</label>
                  <input
                    type="text"
                    value={customerForm.taxOffice}
                    onChange={(e) => setCustomerForm({ ...customerForm, taxOffice: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Yetkili Kişi</label>
                  <input
                    type="text"
                    value={customerForm.contactName}
                    onChange={(e) => setCustomerForm({ ...customerForm, contactName: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    placeholder="0532..."
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Adres</label>
                <textarea
                  rows={2}
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Cariyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: YENİ ŞANTİYE */}
      {isSiteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Yeni Şantiye Tanımla</h3>
              </div>
              <button onClick={() => setIsSiteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bağlı Cari / Müşteri *</label>
                <select
                  required
                  value={siteForm.customerId}
                  onChange={(e) => setSiteForm({ ...siteForm, customerId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Şantiye / Proje Adı *</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Vadistanbul Konutları Şantiyesi"
                  value={siteForm.name}
                  onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasyon / İlçe</label>
                  <input
                    type="text"
                    placeholder="Sarıyer / İstanbul"
                    value={siteForm.location}
                    onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Şantiye Şefi</label>
                  <input
                    type="text"
                    value={siteForm.contactPerson}
                    onChange={(e) => setSiteForm({ ...siteForm, contactPerson: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsSiteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Şantiyeyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAHSİLAT EKLE */}
      {isCollectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 mb-4">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="text-emerald-600" size={20} />
                <h3 className="text-base font-bold text-slate-900">Yeni Tahsilat Girişi</h3>
              </div>
              <button onClick={() => setIsCollectionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cari / Müşteri *</label>
                <select
                  required
                  value={collectionForm.customerId}
                  onChange={(e) => setCollectionForm({ ...collectionForm, customerId: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-semibold"
                >
                  <option value="">-- Müşteri Seçin --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.name} (Bakiye: {c.balance?.toLocaleString('tr-TR')} ₺)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tutar (₺) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={collectionForm.amount}
                    onChange={(e) => setCollectionForm({ ...collectionForm, amount: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ödeme Yöntemi</label>
                  <select
                    value={collectionForm.paymentMethod}
                    onChange={(e) => setCollectionForm({ ...collectionForm, paymentMethod: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="havale">Banka Havalesi / EFT</option>
                    <option value="nakit">Nakit</option>
                    <option value="cek">Çek</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Açıklama / Dekont No</label>
                <textarea
                  rows={2}
                  value={collectionForm.notes}
                  onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-emerald-100 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setIsCollectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  Tahsilatı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CARİ EKSTRE */}
      {selectedCustomerForEkstre && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-emerald-100 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-emerald-100 pb-3 mb-4">
              <div>
                <div className="text-lg font-bold text-slate-900">{selectedCustomerForEkstre.name}</div>
                <div className="text-xs text-slate-500">Cari Hesap Hareketleri & Ekstre</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Toplam Bakiye</div>
                <div className="text-xl font-black font-mono text-emerald-950">
                  {(selectedCustomerForEkstre.balance || 0).toLocaleString('tr-TR')} ₺
                </div>
              </div>
            </div>

            {/* Invoices and Collections history */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-emerald-900 uppercase tracking-wide">
                Faturalar ({invoices.filter((i) => i.customerId === selectedCustomerForEkstre.id).length})
              </h4>
              <div className="border border-emerald-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-50 text-emerald-950 font-bold">
                    <tr>
                      <th className="p-2.5">Fatura No</th>
                      <th className="p-2.5">Tarih</th>
                      <th className="p-2.5">Vade</th>
                      <th className="p-2.5 text-right">Tutar</th>
                      <th className="p-2.5 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50">
                    {invoices
                      .filter((i) => i.customerId === selectedCustomerForEkstre.id)
                      .map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-2.5 font-mono font-bold text-emerald-900">{inv.invoiceNo}</td>
                          <td className="p-2.5 text-slate-600">{inv.issueDate}</td>
                          <td className="p-2.5 text-slate-600">{inv.dueDate}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {inv.totalAmount.toLocaleString('tr-TR')} ₺
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-emerald-100 mt-6">
              <button
                onClick={() => setSelectedCustomerForEkstre(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
