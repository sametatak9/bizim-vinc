import React, { useState } from 'react';
import { Camera, FileUp, KeyRound, Save, X } from 'lucide-react';
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

  const saveProfile = async () => {
    setSaving(true);
    try { await updateUserProfile(currentUser.id, { fullName, phone, email }); showToast('✓ Profil bilgileriniz güncellendi.'); }
    catch (error) { showToast(`Profil güncellenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
    finally { setSaving(false); }
  };
  const savePassword = async () => {
    try { await changePassword(password); setPassword(''); } catch (error) { showToast(`Şifre güncellenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
  };
  const uploadDocument = async () => {
    if (!person || !documentFile) return showToast('Bağlı personel ve belge seçimi gereklidir.');
    try { await uploadPersonnelDocument(person.id, documentType, documentFile, documentType === 'adli_sicil'); setDocumentFile(null); }
    catch (error) { showToast(`Belge yüklenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
  };

  return <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
    <aside className="h-full w-full max-w-xl overflow-y-auto bg-slate-950 text-slate-100 border-l border-amber-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-slate-950/95 border-b border-slate-800">
        <div><div className="text-[10px] uppercase tracking-[0.28em] text-amber-400 font-bold">Personel kimliği</div><h2 className="text-xl font-black mt-1">Hesap & Evrak Merkezi</h2></div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800"><X size={18} /></button>
      </header>
      <div className="p-6 space-y-5">
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5">
          <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center text-xl font-black">{currentUser.fullName.slice(0,2).toUpperCase()}</div><div><div className="font-bold">{currentUser.fullName}</div><div className="text-xs text-amber-400 uppercase tracking-widest">{currentUser.role}</div></div><label className="ml-auto cursor-pointer text-xs text-slate-300 hover:text-amber-300"><Camera size={18} /><input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; if (file) { try { await uploadProfileAvatar(file); } catch (error) { showToast(`Fotoğraf yüklenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); } } }} /></label></div>
        </section>
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3"><h3 className="font-bold flex items-center gap-2"><Save size={16} className="text-amber-400" /> Kişisel bilgiler</h3><input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad soyad" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Telefon" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-posta" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm" /><button onClick={saveProfile} disabled={saving} className="w-full rounded-xl bg-amber-500 text-slate-950 py-2.5 text-sm font-black">Bilgileri kaydet</button></section>
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3"><h3 className="font-bold flex items-center gap-2"><KeyRound size={16} className="text-amber-400" /> Şifre değiştir</h3><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Yeni şifre (en az 8 karakter)" className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm" /><button onClick={savePassword} disabled={!password} className="w-full rounded-xl border border-amber-500/60 text-amber-300 py-2.5 text-sm font-bold disabled:opacity-40">Şifreyi güncelle</button></section>
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3"><h3 className="font-bold flex items-center gap-2"><FileUp size={16} className="text-amber-400" /> Kişisel evraklar</h3><div className="grid grid-cols-2 gap-2"><select value={documentType} onChange={(e) => setDocumentType(e.target.value as PersonnelDocumentType)} className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm"><option value="myk">MYK</option><option value="isg">İSG</option><option value="adli_sicil">Adli sicil</option><option value="ehliyet">Ehliyet</option><option value="src">SRC</option><option value="saglik">Sağlık</option></select><label className="rounded-xl border border-dashed border-slate-600 px-3 py-2.5 text-xs text-slate-400 cursor-pointer truncate">{documentFile?.name || 'Dosya seç'}<input type="file" className="hidden" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} /></label></div><button onClick={uploadDocument} disabled={!documentFile || !person} className="w-full rounded-xl bg-cyan-400 text-slate-950 py-2.5 text-sm font-black disabled:opacity-40">Evrakı yükle</button><div className="space-y-1">{personnelDocuments.filter((d) => d.personnelId === person?.id).map((d) => <div key={d.id} className="text-xs text-slate-400 flex justify-between"><span>{d.fileName}</span><span className="text-amber-400">{d.documentType}</span></div>)}</div></section>
      </div>
    </aside>
  </div>;
};
