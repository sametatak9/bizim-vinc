import React, { useState } from 'react';
import { useERP } from '../lib/store';
import { Person, PersonKind } from '../types';
import { PersonModal } from '../components/PersonModal';
import { 
  Plus, 
  Search, 
  Phone, 
  QrCode, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';

export const PersonnelPage: React.FC = () => {
  const { personnel, deletePerson } = useERP();
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<'hepsi' | PersonKind>('hepsi');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = personnel.filter((p) => {
    const matchesSearch =
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
      (p.title && p.title.toLowerCase().includes(search.toLowerCase()));

    const matchesKind = kindFilter === 'hepsi' || p.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const totalPersonnel = personnel.length;
  const activeCount = personnel.filter((p) => p.status === 'aktif').length;
  const inDutyCount = personnel.filter((p) => p.poolStatus === 'gorevli').length;
  const certAlertCount = personnel.filter((p) => p.certExpiring).length;

  const handleEdit = (p: Person) => {
    setSelectedPerson(p);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedPerson(null);
    setIsModalOpen(true);
  };

  return (
    <main className="cmd-page" id="personnel-page">
      {/* Top summary cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Toplam Personel</span>
          <span className="font-mono text-2xl font-bold text-emerald-950">{totalPersonnel}</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Aktif Çalışan</span>
          <span className="font-mono text-2xl font-bold text-emerald-700">{activeCount}</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Şu Anda Görevde</span>
          <span className="font-mono text-2xl font-bold text-blue-700">{inDutyCount}</span>
        </div>
        <div className="bg-white border border-emerald-100 rounded-xl p-3.5 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 block mb-1">Sertifika Uyarısı</span>
          <span className={`font-mono text-2xl font-bold ${certAlertCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {certAlertCount}
          </span>
        </div>
      </section>

      {/* Main Panel */}
      <div className="panel bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls & Search */}
        <div className="p-4 border-b border-emerald-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md relative">
            <Search size={16} className="text-gray-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, sicil no veya unvan ile ara..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            <div className="flex bg-gray-100 p-1 rounded-lg text-xs">
              {(['hepsi', 'operator', 'yardimci', 'idari'] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() => setKindFilter(kind)}
                  className={`px-3 py-1 rounded-md font-semibold transition ${
                    kindFilter === kind
                      ? 'bg-white text-emerald-950 shadow-xs'
                      : 'text-gray-600 hover:text-emerald-900'
                  }`}
                >
                  {kind === 'hepsi'
                    ? 'Tümü'
                    : kind === 'operator'
                    ? 'Operatör'
                    : kind === 'yardimci'
                    ? 'Yardımcı'
                    : 'İdari'}
                </button>
              ))}
            </div>

            <button
              onClick={handleCreate}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Plus size={14} /> Yeni Personel
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 text-[11px] font-bold text-emerald-950 uppercase tracking-wider border-b border-emerald-100">
                <th className="py-3 px-4">Personel</th>
                <th className="py-3 px-4">Sicil / Görev</th>
                <th className="py-3 px-4">İletişim</th>
                <th className="py-3 px-4">Durum</th>
                <th className="py-3 px-4">Havuz</th>
                <th className="py-3 px-4">Evrak & İSG</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filtered.map((person) => (
                <tr key={person.id} className="hover:bg-emerald-50/30 transition-colors">
                  {/* Person Details */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-xs shrink-0">
                        {person.initials}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          {person.fullName}
                        </div>
                        <span className="text-[11px] text-gray-500 capitalize">
                          {person.kind === 'operator'
                            ? 'Vinç Operatörü'
                            : person.kind === 'yardimci'
                            ? 'Saha Yardımcısı'
                            : 'Yönetim / İdari'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Sicil & Title */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-emerald-900">{person.employeeNo}</div>
                    <div className="text-[11px] text-gray-500">{person.title}</div>
                  </td>

                  {/* Phone */}
                  <td className="py-3 px-4 font-mono">
                    <a
                      href={`tel:${person.phone}`}
                      className="text-gray-700 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Phone size={12} className="text-gray-400" />
                      {person.phone}
                    </a>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        person.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-800'
                          : person.status === 'izinli'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {person.status === 'aktif'
                        ? 'Aktif'
                        : person.status === 'izinli'
                        ? 'İzinli'
                        : 'Pasif'}
                    </span>
                  </td>

                  {/* Pool Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        person.poolStatus === 'gorevli'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : person.poolStatus === 'musait'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {person.poolStatus === 'gorevli'
                        ? 'Görevli'
                        : person.poolStatus === 'musait'
                        ? 'Müsait'
                        : 'Havuzda'}
                    </span>
                  </td>

                  {/* Documents & ISG */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {person.documentsOk ? (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold" title="Evrakları tam">
                          <ShieldCheck size={14} /> Tam
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] text-red-600 font-semibold" title="Eksik evrak var">
                          <AlertTriangle size={14} /> Eksik
                        </span>
                      )}

                      {person.certExpiring && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">
                          Yenileme!
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/kart/${person.cardSlug || person.employeeNo.toLowerCase()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                        title="Dijital Kimlik Kartını Aç"
                      >
                        <QrCode size={16} />
                      </a>
                      <button
                        onClick={() => handleEdit(person)}
                        className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        title="Düzenle"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${person.fullName} silinsin mi?`)) {
                            deletePerson(person.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    Aramanızla eşleşen personel kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PersonModal
        person={selectedPerson}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </main>
  );
};
