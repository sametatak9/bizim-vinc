import React, { useState, useEffect } from 'react';
import { Person, PersonKind, PersonStatus, PoolStatus } from '../types';
import { X, Check, Copy, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { useERP } from '../lib/store';

interface PersonModalProps {
  person: Person | null; // if null, creating new
  isOpen: boolean;
  onClose: () => void;
}

export const PersonModal: React.FC<PersonModalProps> = ({ person, isOpen, onClose }) => {
  const { addPerson, updatePerson, deletePerson, showToast } = useERP();

  const [fullName, setFullName] = useState('');
  const [employeeNo, setEmployeeNo] = useState('');
  const [phone, setPhone] = useState('');
  const [kind, setKind] = useState<PersonKind>('operator');
  const [status, setStatus] = useState<PersonStatus>('aktif');
  const [poolStatus, setPoolStatus] = useState<PoolStatus>('musait');
  const [title, setTitle] = useState('');
  const [salary, setSalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [documentsOk, setDocumentsOk] = useState(true);
  const [certExpiring, setCertExpiring] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (person) {
      setFullName(person.fullName);
      setEmployeeNo(person.employeeNo);
      setPhone(person.phone);
      setKind(person.kind);
      setStatus(person.status);
      setPoolStatus(person.poolStatus);
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
      setPoolStatus('musait');
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
        poolStatus,
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
        poolStatus,
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
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
              {person ? person.initials : 'Y'}
            </div>
            <div>
              <h2 className="text-base font-bold text-emerald-950">
                {person ? `${person.fullName} Düzenle` : 'Yeni Personel Ekle'}
              </h2>
              <p className="text-xs text-gray-500">
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
