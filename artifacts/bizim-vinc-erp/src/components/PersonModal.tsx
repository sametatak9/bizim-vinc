import React, { useState, useEffect } from 'react';
import { Person, PersonKind, PersonStatus, PersonnelDocumentType } from '../types';
import { X, Check, Copy, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useERP } from '../lib/store';

interface PersonModalProps {
  person: Person | null; // if null, creating new
  isOpen: boolean;
  onClose: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({ person, isOpen, onClose }) => {
  const { addPerson, updatePerson, deletePerson, showToast, personnelDocuments, uploadPersonnelDocument, currentUser, personnelTypes, addPersonnelType } = useERP();

  const [fullName, setFullName] = useState('');
  const [employeeNo, setEmployeeNo] = useState('');
  const [phone, setPhone] = useState('');
  const [kind, setKind] = useState<PersonKind>('operator');
  const [status, setStatus] = useState<PersonStatus>('aktif');
  const [personnelTypeId, setPersonnelTypeId] = useState('');
  const [title, setTitle] = useState('');
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [documentsOk, setDocumentsOk] = useState(true);
  const [certExpiring, setCertExpiring] = useState(false);
  const [copied, setCopied] = useState(false);
  const [documentType, setDocumentType] = useState<PersonnelDocumentType>('isg');
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  useEffect(() => {
    if (person) {
      setFullName(person.fullName);
      setEmployeeNo(person.employeeNo);
      setPhone(person.phone);
      setKind(person.kind);
      setStatus(person.status);
      setPersonnelTypeId(person.personnelTypeId || '');
      setTitle(person.title);
      setSalary(person.salary === undefined ? '' : String(person.salary));
      setStartDate(person.startDate || '');
      setEndDate(person.endDate || '');
      setDocumentsOk(person.documentsOk);
      setCertExpiring(person.certExpiring);
    } else {
      setFullName('');
      setEmployeeNo(`OP-${Math.floor(100 + Math.random() * 900)}`);
      setPhone('+90 5');
      setKind('operator');
      setStatus('aktif');
      setPersonnelTypeId('');
      setTitle('Mobil Vinç Operatörü');
      setSalary('');
      setStartDate('');
      setEndDate('');
      setDocumentsOk(true);
      setCertExpiring(false);
    }
  }, [person, isOpen]);

  if (!isOpen) return null;

  const cardSlug = person ? person.cardSlug || person.employeeNo.toLowerCase() : '';
  const cardUrl = `${window.location.origin}/kart/${cardSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    showToast('Dijital kimlik kartı linki panoya kopyalandı.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !employeeNo.trim() || !salary || !startDate) {
      showToast('Ad Soyad, Sicil No, Maaş ve İşe Giriş Tarihi zorunludur.');
      return;
    }
    if (status === 'pasif' && !endDate) {
      showToast('Pasif personel için İşten Çıkış Tarihi zorunludur.');
      return;
    }
    if (status === 'pasif' && (!person || !personnelDocuments.some((document) => document.personnelId === person.id && document.documentType === 'isten_cikis'))) {
      showToast('Pasif personel için önce İşten Çıkış Evrakı yüklenmelidir. Mevcut kaydı düzenleyip belgeyi ekleyin.');
      return;
    }
    if (status !== 'pasif' && endDate) {
      showToast('Aktif personel için İşten Çıkış Tarihi boş bırakılmalıdır.');
      return;
    }

    if (person) {
      updatePerson(person.id, {
        fullName,
        employeeNo,
        phone,
        kind,
        status,
        personnelTypeId: personnelTypeId || undefined,
        title,
        salary: Number(salary),
        startDate,
        endDate: status === 'pasif' ? endDate : undefined,
        documentsOk,
        certExpiring,
      });
    } else {
      const initials = fullName
        .trim()
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 3)
        .toUpperCase() || 'P';

      addPerson({
        fullName,
        employeeNo,
        phone,
        kind,
        status,
        poolStatus: 'musait',
        personnelTypeId: personnelTypeId || undefined,
        title,
        salary: Number(salary),
        startDate,
        endDate: status === 'pasif' ? endDate : undefined,
        initials,
        documentsOk,
        certExpiring,
      });
    }

    onClose();
  };

  const handleDocumentUpload = async () => {
    if (!person || !documentFile) return;
    try {
      await uploadPersonnelDocument(person.id, documentType, documentFile, documentType === 'adli_sicil');
      setDocumentFile(null);
    } catch (error: any) {
      showToast(`Belge yüklenemedi: ${error.message || 'bilinmeyen hata'}`);
    }
  };

  const handleDelete = () => {
    if (person && confirm(`${person.fullName} isimli personeli silmek istediğinize emin misiniz?`)) {
      deletePerson(person.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-600 text-white border-b border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 text-white font-bold flex items-center justify-center text-sm shadow-sm border border-white/20">
              {person ? person.initials : 'Y'}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {person ? `${person.fullName} Düzenle` : 'Yeni Personel Ekle'}
              </h2>
              <p className="text-xs text-emerald-100/80">
                {person ? `Sicil: ${person.employeeNo}` : 'Sisteme yeni operatör/yardımcı kaydet'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Ad Soyad</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Ad Soyad"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Sicil No</label>
              <input
                type="text"
                value={employeeNo}
                onChange={(e) => setEmployeeNo(e.target.value)}
                required
                placeholder="OP-204"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Telefon</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 532 000 00 00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Görev / Unvan</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mobil Vinç Operatörü"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Personel Türü</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as PersonKind)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="operator">Operatör</option>
                <option value="yardimci">Yardımcı / Yağcı</option>
                <option value="idari">İdari / Şef</option>
              </select>
              <div className="mt-2 flex gap-1"><select value={personnelTypeId} onChange={(e) => setPersonnelTypeId(e.target.value)} className="min-w-0 flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-[11px]"><option value="">Tanımlı tür seç</option>{personnelTypes.filter((type) => type.isActive).map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select><button type="button" onClick={async () => { const name = window.prompt('Yeni personel türü'); if (name?.trim()) { await addPersonnelType(name.trim()); showToast('Personel türü eklendi.'); } }} className="shrink-0 px-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black">+</button></div>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Personel Durumu</label>
              <button type="button" onClick={() => setStatus(status === 'pasif' ? 'aktif' : 'pasif')} className={`w-full px-3 py-2 rounded-lg text-sm font-bold border transition ${status === 'pasif' ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>
                {status === 'pasif' ? 'Pasif' : 'Aktif'}
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Aylık Maaş (₺) *</label>
              <input type="number" min="0" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} required placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">İşe Giriş Tarihi *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">İşten Çıkış Tarihi {status === 'pasif' ? '*' : ''}</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required={status === 'pasif'} disabled={status !== 'pasif'} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100" />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={documentsOk}
                onChange={(e) => setDocumentsOk(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Evrakları Tam (G10/SRC/Sağlık)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={certExpiring}
                onChange={(e) => setCertExpiring(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <AlertCircle size={16} className="text-emerald-600" />
              <span>Sertifika Süresi Yaklaşıyor (Uyarı)</span>
            </label>
          </div>

          {person && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div>
                <div className="text-xs font-bold text-emerald-950">Personel Evrakları</div>
                <div className="text-[11px] text-slate-500">Belgeler özel depoda saklanır. Adli sicil yalnız Founder/HR yetkisiyle görünür.</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <select value={documentType} onChange={(e) => setDocumentType(e.target.value as PersonnelDocumentType)} className="px-2.5 py-2 border border-slate-300 rounded-lg text-xs">
                  <option value="isg">İSG Belgesi</option>
                  {kind === 'operator' && <option value="myk">MYK Operatör Belgesi</option>}
                  <option value="ehliyet">Sürücü Belgesi</option>
                  <option value="saglik">Sağlık Raporu</option>
                  <option value="adli_sicil">Adli Sicil Kaydı</option>
                  <option value="isten_cikis">İşten Çıkış Evrakı</option>
                  <option value="diger">Diğer</option>
                </select>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} className="text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-2 file:py-1.5 file:text-xs" />
                <button type="button" disabled={!documentFile || (documentType === 'adli_sicil' && !['founder', 'admin', 'yonetici'].includes(currentUser.role))} onClick={handleDocumentUpload} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-40">Yükle</button>
              </div>
              <div className="space-y-1">
                {personnelDocuments.filter((document) => document.personnelId === person.id && (!document.isSensitive || ['founder', 'admin', 'yonetici'].includes(currentUser.role))).map((document) => (
                  <div key={document.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs"><span>{document.fileName}</span><span className="text-slate-400">{document.documentType}</span></div>
                ))}
              </div>
            </div>
          )}

          {/* Digital QR Card Link for existing personnel */}
          {person && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  📱 Dijital Operatör QR Kimlik Kartı
                </span>
                <a
                  href={`/kart/${cardSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  Görüntüle <ExternalLink size={12} />
                </a>
              </div>
              <p className="text-[11px] text-gray-600">
                Şantiye girişlerinde güvenliğe ve iş güvenliği uzmanına gösterilebilen kurumsal kart.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={cardUrl}
                  className="flex-1 text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1.5 text-gray-700 font-mono select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {person ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Personeli Sil
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                {person ? 'Değişiklikleri Kaydet' : 'Personeli Ekle'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
