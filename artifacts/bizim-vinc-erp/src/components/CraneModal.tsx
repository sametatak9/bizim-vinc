import React, { useState, useEffect } from 'react';
import { Crane, CraneStatus } from '../types';
import { X } from 'lucide-react';
import { useERP } from '../lib/store';

interface CraneModalProps {
  crane: Crane | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CraneModal: React.FC<CraneModalProps> = ({ crane, isOpen, onClose }) => {
  const { addCrane, updateCrane, deleteCrane, personnel, showToast } = useERP();

  const [code, setCode] = useState('');
  const [type, setType] = useState('Mobil Vinç');
  const [capacity, setCapacity] = useState('50 ton');
  const [status, setStatus] = useState<CraneStatus>('musait');
  const [operator, setOperator] = useState('');
  const [site, setSite] = useState('');
  const [lastService, setLastService] = useState('');
  const [lat, setLat] = useState(41.01);
  const [lng, setLng] = useState(29.00);

  useEffect(() => {
    if (crane) {
      setCode(crane.code);
      setType(crane.type);
      setCapacity(crane.capacity);
      setStatus(crane.status);
      setOperator(crane.operator || '');
      setSite(crane.site || '');
      setLastService(crane.lastService);
      setLat(crane.lat);
      setLng(crane.lng);
    } else {
      setCode(`V-${Math.floor(100 + Math.random() * 900)}`);
      setType('Mobil Vinç');
      setCapacity('60 ton');
      setStatus('musait');
      setOperator('');
      setSite('Tuzla Ana Garaj');
      setLastService(new Date().toISOString().slice(0, 10));
      setLat(40.98);
      setLng(29.11);
    }
  }, [crane, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      showToast('Lütfen Vinç Kodunu girin.');
      return;
    }

    if (crane) {
      updateCrane(crane.id, {
        code,
        type,
        capacity,
        status,
        operator: operator.trim() ? operator : undefined,
        site: site.trim() ? site : undefined,
        lastService,
        lat: Number(lat),
        lng: Number(lng),
      });
    } else {
      addCrane({
        code,
        type,
        capacity,
        status,
        operator: operator.trim() ? operator : undefined,
        site: site.trim() ? site : undefined,
        lastService,
        lat: Number(lat),
        lng: Number(lng),
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (crane && confirm(`${crane.code} kodlu vinci filodan çıkarmak istediğinize emin misiniz?`)) {
      deleteCrane(crane.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-emerald-950">
              {crane ? `${crane.code} Vinç Düzenle` : 'Yeni Vinç Ekle'}
            </h2>
            <p className="text-xs text-gray-500">
              {crane ? `Kapasite: ${crane.capacity}` : 'Filo envanterine yeni iş makinesi ekle'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Vinç Kodu</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="V-204"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Vinç Türü</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Mobil Vinç">Mobil Vinç</option>
                <option value="Teleskopik">Teleskopik</option>
                <option value="Paletli Vinç">Paletli Vinç</option>
                <option value="Sepetli">Sepetli</option>
                <option value="Hiyap Vinç">Hiyap Vinç</option>
                <option value="Kule Vinç">Kule Vinç</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Kapasite</label>
              <input
                type="text"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                placeholder="50 ton"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Çalışma Durumu</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CraneStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="sahada">Sahada (Aktif Görevde)</option>
                <option value="musait">Müsait (Garajda Hazır)</option>
                <option value="bakimda">Bakımda</option>
                <option value="arizali">Arızalı (Servis Bekliyor)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Atanan Operatör</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">Atanmadı</option>
                {personnel
                  .filter((p) => p.kind === 'operator')
                  .map((p) => (
                    <option key={p.id} value={p.fullName}>
                      {p.fullName} ({p.employeeNo})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Şantiye / Görev Konumu</label>
              <input
                type="text"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                placeholder="Ataşehir Metro Şantiyesi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Son Periyodik Bakım</label>
              <input
                type="date"
                value={lastService}
                onChange={(e) => setLastService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Harita Enlem (Lat)</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-emerald-950 mb-1">Harita Boylam (Lng)</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {crane ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Vinci Sil
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
                {crane ? 'Değişiklikleri Kaydet' : 'Vinci Kaydet'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
