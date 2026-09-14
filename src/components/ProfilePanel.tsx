import React, { useEffect, useState } from 'react';
import { Camera, FileUp, KeyRound, Save, X, ShieldCheck, UserRound } from 'lucide-react';
import { useERP } from '../lib/store';
import { PersonnelDocumentType } from '../types';

interface Props { onClose: () => void; }

export const ProfilePanel: React.FC<Props> = ({ onClose }) => {
  const { currentUser, personnel, personnelDocuments, updateUserProfile, changePassword, uploadProfileAvatar, uploadPersonnelDocument, showToast } = useERP();
  const person = personnel.find((item) => item.id === currentUser.personnelId || item.userId === currentUser.id);
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [documentType, setDocumentType] = useState<PersonnelDocumentType>('myk');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setFullName(currentUser.fullName); setPhone(currentUser.phone || ''); setEmail(currentUser.email); }, [currentUser.id, currentUser.fullName, currentUser.phone, currentUser.email]);

  const saveProfile = async () => {
    const cleanName = fullName.trim(); const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) return showToast('Ad soyad ve e-posta zorunludur.');
    setSaving(true);
    try {
      await updateUserProfile(currentUser.id, { fullName: cleanName, phone: phone.trim(), email: cleanEmail });
      showToast('✓ Profil bilgileri Supabase’e kaydedildi.');
    } catch (error) { showToast(`Profil güncellenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
    finally { setSaving(false); }
  };
  const savePassword = async () => {
    try { await changePassword(password); setPassword(''); } catch (error) { showToast(`Şifre güncellenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
  };
  const uploadDocument = async () => {
    if (!person || !documentFile) return showToast('Bağlı personel ve belge seçimi gereklidir.');
    try { await uploadPersonnelDocument(person.id, documentType, documentFile, documentType === 'adli_sicil'); setDocumentFile(null); showToast('✓ Evrak güvenli depoya yüklendi.'); }
    catch (error) { showToast(`Belge yüklenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
  };
  const avatar = currentUser.avatarUrl;
  const initials = currentUser.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return <div className="fixed inset-0 z-[70] bg-emerald-950/45 backdrop-blur-sm flex justify-end" onClick={onClose}>
    <aside className="h-full w-full max-w-xl overflow-y-auto bg-[#f7fffb] text-emerald-950 border-l border-emerald-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 sm:px-6 py-4 bg-white/95 backdrop-blur border-b border-emerald-100"><div><div className="text-[10px] uppercase tracking-[0.24em] text-emerald-600 font-black">Bizim Vinç · Profil</div><h2 className="text-xl font-black mt-1">Hesap ve Evrak Merkezi</h2></div><button onClick={onClose} className="p-2 rounded-xl hover:bg-emerald-50"><X size={18} /></button></header>
      <div className="p-4 sm:p-6 space-y-5">
        <section className="overflow-hidden rounded-3xl bg-white border border-emerald-100 shadow-sm"><div className="h-24 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500" /><div className="px-5 pb-5"><div className="-mt-10 flex items-end justify-between gap-3"><div className="relative w-20 h-20 rounded-3xl border-4 border-white bg-emerald-100 text-emerald-900 flex items-center justify-center text-2xl font-black overflow-hidden">{avatar ? <img src={avatar} alt="Profil" className="w-full h-full object-cover" /> : initials}<label className="absolute inset-0 bg-emerald-950/55 text-white opacity-0 hover:opacity-100 transition flex items-center justify-center cursor-pointer"><Camera size={20} /><input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { await uploadProfileAvatar(file); } catch (error) { showToast(`Fotoğraf yüklenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); } } }} /></label></div><span className="mb-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">{currentUser.role}</span></div><h3 className="mt-3 text-lg font-black">{currentUser.fullName}</h3><p className="text-xs text-slate-500">{currentUser.email} · {person?.title || 'Bizim Vinç çalışanı'}</p><div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold"><span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"><ShieldCheck size={12} className="inline mr-1" />Güvenli profil</span><span className="rounded-full bg-lime-50 px-3 py-1 text-lime-700">Dijital personel kartı aktif</span></div></div></section>
        <section className="rounded-2xl bg-white border border-emerald-100 p-5 space-y-3 shadow-sm"><h3 className="font-black flex items-center gap-2"><UserRound size={16} className="text-emerald-600" /> Kişisel bilgiler</h3><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad soyad" className="w-full rounded-xl bg-emerald-50/40 border border-emerald-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon" className="w-full rounded-xl bg-emerald-50/40 border border-emerald-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" className="w-full rounded-xl bg-emerald-50/40 border border-emerald-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" /><button onClick={saveProfile} disabled={saving} className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-black disabled:opacity-50"><Save size={15} className="inline mr-2" />{saving ? 'Kaydediliyor…' : 'Bilgileri kaydet'}</button></section>
        <section className="rounded-2xl bg-white border border-emerald-100 p-5 shadow-sm"><h3 className="font-black flex items-center gap-2"><UserRound size={16} className="text-emerald-600" /> Özlük ve çalışma bilgileri</h3><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">Görev</span><b className="block mt-1 text-emerald-950">{person?.title || currentUser.title || 'Belirtilmedi'}</b></div><div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">Departman</span><b className="block mt-1 text-emerald-950">{person?.department || currentUser.department || 'Operasyon'}</b></div><div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">Personel no</span><b className="block mt-1 text-emerald-950">{person?.employeeNo || '—'}</b></div><div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">İşe giriş</span><b className="block mt-1 text-emerald-950">{person?.startDate ? new Date(person.startDate).toLocaleDateString('tr-TR') : '—'}</b></div></div><p className="mt-3 text-[11px] text-slate-500">Hassas maaş, IBAN ve kimlik bilgileri çalışan profilinde gösterilmez.</p></section>
        <section className="rounded-2xl bg-white border border-emerald-100 p-5 space-y-3 shadow-sm"><h3 className="font-black flex items-center gap-2"><KeyRound size={16} className="text-emerald-600" /> Şifre değiştir</h3><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Yeni şifre (en az 8 karakter)" className="w-full rounded-xl bg-emerald-50/40 border border-emerald-100 px-3 py-2.5 text-sm" /><button onClick={savePassword} disabled={!password} className="w-full rounded-xl border border-emerald-300 text-emerald-800 py-2.5 text-sm font-bold disabled:opacity-40">Şifreyi güncelle</button></section>
        <section className="rounded-2xl bg-white border border-emerald-100 p-5 space-y-3 shadow-sm"><h3 className="font-black flex items-center gap-2"><FileUp size={16} className="text-emerald-600" /> Kişisel evraklar</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><select value={documentType} onChange={(e) => setDocumentType(e.target.value as PersonnelDocumentType)} className="rounded-xl bg-emerald-50/40 border border-emerald-100 px-3 py-2.5 text-sm"><option value="myk">MYK / Operatör</option><option value="isg">İSG</option><option value="adli_sicil">Adli sicil</option><option value="ehliyet">Ehliyet</option><option value="src">SRC</option><option value="saglik">Sağlık</option></select><label className="rounded-xl border border-dashed border-emerald-300 px-3 py-2.5 text-xs text-slate-500 cursor-pointer truncate">{documentFile?.name || 'Dosya seç'}<input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} /></label></div><button onClick={uploadDocument} disabled={!documentFile || !person} className="w-full rounded-xl bg-emerald-950 text-white py-2.5 text-sm font-black disabled:opacity-40">Evrakı güvenli depoya yükle</button><div className="space-y-1">{personnelDocuments.filter((d) => d.personnelId === person?.id).map((d) => <div key={d.id} className="text-xs text-slate-500 flex justify-between"><span>{d.fileName}</span><span className="text-emerald-700 font-bold">{d.documentType}</span></div>)}</div></section>
      </div>
    </aside>
  </div>;
};
