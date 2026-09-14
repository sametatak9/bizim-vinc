import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, CheckCircle2, FileUp, KeyRound, Save, ShieldCheck, UserRound, X } from 'lucide-react';
import { useERP } from '../lib/store';
import { PersonnelDocumentType } from '../types';
import { describeRoleAccess, roleLabel } from '../lib/permissions';

interface Props { onClose: () => void; }

export const ProfilePanel: React.FC<Props> = ({ onClose }) => {
  const {
    currentUser, personnel, personnelDocuments, memberships, approvals, jobReceipts,
    updateUserProfile, changePassword, uploadProfileAvatar, uploadPersonnelDocument, showToast, logout,
  } = useERP();

  const person = personnel.find((item) => item.id === currentUser.personnelId || item.userId === currentUser.id);
  const membership = memberships.find((item) => item.userId === currentUser.id);
  const myApprovals = approvals.filter((item) => item.personName === currentUser.fullName);
  const myReceipts = jobReceipts.filter((item) => item.operatorId === person?.id);

  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [documentType, setDocumentType] = useState<PersonnelDocumentType>('myk');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(currentUser.fullName);
    setPhone(currentUser.phone || '');
    setEmail(currentUser.email);
  }, [currentUser.id, currentUser.fullName, currentUser.phone, currentUser.email]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; };
  }, [onClose]);

  const saveProfile = async () => {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    if (!cleanName || !cleanEmail) return showToast('Ad soyad ve e-posta zorunludur.');
    setSaving(true);
    try {
      await updateUserProfile(currentUser.id, { fullName: cleanName, phone: phone.trim(), email: cleanEmail });
      showToast('✓ Profil bilgileri kaydedildi.');
    } catch (error) {
      showToast(`Profil güncellenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 8) return showToast('Şifre en az 8 karakter olmalıdır.');
    if (password !== passwordRepeat) return showToast('Şifreler birbiriyle aynı değil.');
    setPasswordBusy(true);
    try {
      await changePassword(password);
      setPassword(''); setPasswordRepeat('');
    } catch (error) {
      showToast(`Şifre güncellenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    } finally {
      setPasswordBusy(false);
    }
  };

  const uploadDocument = async () => {
    if (!person || !documentFile) return showToast('Bağlı personel kaydı ve belge seçimi gereklidir.');
    try {
      await uploadPersonnelDocument(person.id, documentType, documentFile, documentType === 'adli_sicil');
      setDocumentFile(null);
      showToast('✓ Evrak güvenli depoya yüklendi.');
    } catch (error) {
      showToast(`Belge yüklenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`);
    }
  };

  const avatar = currentUser.avatarUrl;
  const initials = currentUser.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const accessList = describeRoleAccess(currentUser.role);
  const inputClass = 'w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200';

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex justify-end bg-emerald-950/45 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-emerald-200 bg-[#f7fffb] text-emerald-950 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-emerald-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">Bizim Vinç · Hesabım</div>
            <h2 className="mt-1 text-xl font-black">Hesap, Yetki ve Evrak Merkezi</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 hover:bg-emerald-50" aria-label="Kapat"><X size={18} /></button>
        </header>

        <div className="space-y-5 p-4 sm:p-6">
          <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
            <div className="h-24 bg-gradient-to-r from-emerald-950 via-emerald-700 to-lime-500" />
            <div className="px-5 pb-5">
              <div className="-mt-10 flex items-end justify-between gap-3">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-emerald-100 text-2xl font-black text-emerald-900">
                  {avatar ? <img src={avatar} alt="Profil" className="h-full w-full object-cover" /> : initials}
                  <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-emerald-950/55 text-white opacity-0 transition hover:opacity-100">
                    <Camera size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try { await uploadProfileAvatar(file); } catch (error) { showToast(`Fotoğraf yüklenemedi: ${error instanceof Error ? error.message : 'Supabase hatası'}`); }
                    }} />
                  </label>
                </div>
                <span className="mb-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">{roleLabel(currentUser.role)}</span>
              </div>
              <h3 className="mt-3 text-lg font-black break-words">{currentUser.fullName}</h3>
              <p className="text-xs text-slate-500 break-words">{currentUser.email} · {person?.title || 'Bizim Vinç çalışanı'}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
                <span className={`rounded-full px-3 py-1 ${currentUser.status === 'aktif' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  <ShieldCheck size={12} className="mr-1 inline" />{currentUser.status === 'aktif' ? 'Hesap aktif' : 'Hesap pasif'}
                </span>
                {membership && (
                  <span className={`rounded-full px-3 py-1 ${membership.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : membership.status === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}`}>
                    Üyelik: {membership.status === 'approved' ? 'onaylı' : membership.status === 'rejected' ? 'reddedildi' : 'onay bekliyor'}
                  </span>
                )}
                {person && <span className="rounded-full bg-lime-50 px-3 py-1 text-lime-700">Personel kaydı bağlı</span>}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-black"><ShieldCheck size={16} className="text-emerald-600" /> Yetkilerim</h3>
            <p className="mt-1 text-[11px] text-slate-500">
              {roleLabel(currentUser.role)} rolüyle erişebildiğiniz ekranlar. Ek yetki için yöneticinize başvurun.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {accessList.length ? accessList.map((label) => (
                <span key={label} className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                  <CheckCircle2 size={11} className="mr-1 inline" />{label}
                </span>
              )) : <span className="text-[11px] text-slate-500">Tanımlı ekran yetkiniz yok.</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-50/70 p-3">
                <span className="block text-[10px] text-slate-500">Taleplerim</span>
                <b className="mt-1 block text-emerald-950">{myApprovals.length} kayıt · {myApprovals.filter((item) => item.status === 'pending').length} bekliyor</b>
              </div>
              <div className="rounded-xl bg-emerald-50/70 p-3">
                <span className="block text-[10px] text-slate-500">İş makbuzlarım</span>
                <b className="mt-1 block text-emerald-950">{myReceipts.length} kayıt</b>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-black"><UserRound size={16} className="text-emerald-600" /> Kişisel bilgiler</h3>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ad soyad" className={inputClass} />
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefon" className={inputClass} />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-posta" className={inputClass} />
            <button type="button" onClick={saveProfile} disabled={saving} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-black text-white disabled:opacity-50">
              <Save size={15} className="mr-2 inline" />{saving ? 'Kaydediliyor…' : 'Bilgileri kaydet'}
            </button>
            <p className="text-[10px] text-slate-500">Rol ve yetki bilgilerinizi kendiniz değiştiremezsiniz; bu alanlar yönetici onayıyla güncellenir.</p>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-black"><UserRound size={16} className="text-emerald-600" /> Özlük ve çalışma bilgileri</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">Görev</span><b className="mt-1 block text-emerald-950">{person?.title || currentUser.title || 'Belirtilmedi'}</b></div>
              <div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">Departman</span><b className="mt-1 block text-emerald-950">{person?.department || currentUser.department || 'Operasyon'}</b></div>
              <div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">Personel no</span><b className="mt-1 block text-emerald-950">{person?.employeeNo || '—'}</b></div>
              <div className="rounded-xl bg-emerald-50/70 p-3"><span className="block text-[10px] text-slate-500">İşe giriş</span><b className="mt-1 block text-emerald-950">{person?.startDate ? new Date(person.startDate).toLocaleDateString('tr-TR') : '—'}</b></div>
            </div>
            <p className="mt-3 text-[11px] text-slate-500">Hassas maaş, IBAN ve kimlik bilgileri çalışan profilinde gösterilmez.</p>
          </section>

          <section className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-black"><KeyRound size={16} className="text-emerald-600" /> Şifre değiştir</h3>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Yeni şifre (en az 8 karakter)" className={inputClass} autoComplete="new-password" />
            <input type="password" value={passwordRepeat} onChange={(event) => setPasswordRepeat(event.target.value)} placeholder="Yeni şifreyi yeniden yazın" className={inputClass} autoComplete="new-password" />
            {password && password.length < 8 && <p className="text-[11px] font-bold text-amber-700">Şifre en az 8 karakter olmalıdır.</p>}
            {passwordRepeat && password !== passwordRepeat && <p className="text-[11px] font-bold text-rose-700">Şifreler aynı değil.</p>}
            <button type="button" onClick={savePassword} disabled={passwordBusy || password.length < 8 || password !== passwordRepeat}
              className="w-full rounded-xl border border-emerald-300 py-2.5 text-sm font-bold text-emerald-800 disabled:opacity-40">
              {passwordBusy ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
            </button>
          </section>

          <section className="space-y-3 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-black"><FileUp size={16} className="text-emerald-600" /> Kişisel evraklar</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select value={documentType} onChange={(event) => setDocumentType(event.target.value as PersonnelDocumentType)} className={inputClass}>
                <option value="myk">MYK / Operatör</option>
                <option value="isg">İSG</option>
                <option value="adli_sicil">Adli sicil</option>
                <option value="ehliyet">Ehliyet</option>
                <option value="src">SRC</option>
                <option value="saglik">Sağlık</option>
              </select>
              <label className="cursor-pointer truncate rounded-xl border border-dashed border-emerald-300 px-3 py-2.5 text-xs text-slate-500">
                {documentFile?.name || 'Dosya seç'}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(event) => setDocumentFile(event.target.files?.[0] || null)} />
              </label>
            </div>
            <button type="button" onClick={uploadDocument} disabled={!documentFile || !person} className="w-full rounded-xl bg-emerald-950 py-2.5 text-sm font-black text-white disabled:opacity-40">
              Evrakı güvenli depoya yükle
            </button>
            {!person && <p className="text-[11px] text-amber-700">Hesabınız henüz bir personel kaydına bağlanmadığı için evrak yükleyemezsiniz.</p>}
            <div className="space-y-1">
              {personnelDocuments.filter((doc) => doc.personnelId === person?.id).map((doc) => (
                <div key={doc.id} className="flex justify-between gap-2 text-xs text-slate-500">
                  <span className="break-words">{doc.fileName}</span>
                  <span className="shrink-0 font-bold text-emerald-700">{doc.documentType}</span>
                </div>
              ))}
            </div>
          </section>

          <button type="button" onClick={() => { onClose(); logout(); }} className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-black text-rose-700">
            Oturumu kapat
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
};
