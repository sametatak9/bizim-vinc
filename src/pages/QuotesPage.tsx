import React, { useState } from 'react';
import { FileText, Plus, Printer, CheckCircle2 } from 'lucide-react';
import { useERP } from '../lib/store';

export const QuotesPage: React.FC = () => {
  const { quotes, contracts, customers, addQuote, createContractFromQuote, showToast } = useERP();
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [description, setDescription] = useState('Vinç kiralama ve saha operasyon hizmeti');
  const [amount, setAmount] = useState(0);
  const [taxRate, setTaxRate] = useState(20);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const customer = customers.find((item) => item.id === customerId);
    if (!customer || amount <= 0) return showToast('Müşteri ve geçerli tutar giriniz.');
    const subtotal = Number(amount);
    await addQuote({ customerId, customerName: customer.title || customer.name || 'Müşteri', siteName, lines: [{ description, quantity: 1, unitPrice: subtotal, total: subtotal }], subtotal, taxRate, taxAmount: subtotal * taxRate / 100, totalAmount: subtotal * (1 + taxRate / 100), status: 'draft', validUntil: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10), notes: description });
    setOpen(false); setAmount(0); setDescription('Vinç kiralama ve saha operasyon hizmeti'); showToast('Teklif kaydedildi.');
  };
  return <main className="space-y-5">
    <header className="bg-white border border-emerald-100 rounded-2xl p-5 flex items-center justify-between"><div><div className="text-xs font-bold text-emerald-700 uppercase">Satış Belgeleri</div><h1 className="text-xl font-black text-slate-900">Teklifler & Sözleşmeler</h1><p className="text-xs text-slate-500 mt-1">Gerçek cari kayıtlarından teklif oluşturun ve onaylı teklifi sözleşmeye dönüştürün.</p></div><button onClick={() => setOpen(true)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold flex gap-1.5 items-center"><Plus size={14}/> Yeni Teklif</button></header>
    <div className="bg-white rounded-2xl border border-emerald-100 overflow-hidden"><table className="w-full text-left text-xs"><thead className="bg-emerald-50 text-emerald-950 font-bold"><tr><th className="p-3">Teklif No</th><th className="p-3">Cari / Şantiye</th><th className="p-3">Tutar</th><th className="p-3">Durum</th><th className="p-3">İşlem</th></tr></thead><tbody className="divide-y divide-emerald-50">{quotes.map((quote) => <tr key={quote.id}><td className="p-3 font-mono font-bold">{quote.quoteNo}</td><td className="p-3">{quote.customerName}<div className="text-[10px] text-slate-500">{quote.siteName || '-'}</div></td><td className="p-3 font-mono">{quote.totalAmount.toLocaleString('tr-TR')} ₺</td><td className="p-3">{quote.status}</td><td className="p-3 flex gap-2"><button onClick={() => window.print()} className="text-slate-600"><Printer size={14}/></button>{quote.status === 'accepted' && !contracts.some((item) => item.quoteId === quote.id) && <button onClick={async () => { await createContractFromQuote(quote.id); showToast('Sözleşme oluşturuldu.'); }} className="text-emerald-700 font-bold flex gap-1 items-center"><CheckCircle2 size={14}/> Sözleşme</button>}</td></tr>)}</tbody></table>{quotes.length === 0 && <div className="p-10 text-center text-xs text-slate-500">Henüz teklif bulunmuyor.</div>}</div>
    {open && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"><form onSubmit={save} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3"><h2 className="font-bold text-slate-900">Yeni Teklif</h2><select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full border rounded-xl p-2 text-sm"><option value="">Cari seçin</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.title || customer.name}</option>)}</select><input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Şantiye" className="w-full border rounded-xl p-2 text-sm"/><input required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-xl p-2 text-sm"/><div className="grid grid-cols-2 gap-2"><input required type="number" min="0.01" value={amount || ''} onChange={(e) => setAmount(Number(e.target.value))} placeholder="Ara toplam" className="border rounded-xl p-2 text-sm"/><input type="number" min="0" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} placeholder="KDV %" className="border rounded-xl p-2 text-sm"/></div><div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-xs">Vazgeç</button><button className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold">Kaydet</button></div></form></div>}
  </main>;
};
