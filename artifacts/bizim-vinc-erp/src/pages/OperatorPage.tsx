import React, { useState } from 'react';
import { useERP } from '../lib/store';
import {
  CheckCircle,
  Clock,
  CreditCard,
  Calendar,
  Send,
  QrCode,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  FileText,
} from 'lucide-react';
import { LeaveType, OvertimeType } from '../types';

export const OperatorPage: React.FC = () => {
  const {
    currentUser,
    personnel,
    approvals,
    recordAttendance,
    createAdvanceRequest,
    createLeaveRequest,
    createOvertimeRequest,
    showToast,
  } = useERP();

  // Aktif kullanıcıya ait personel kartı
  const myPerson =
    personnel.find((p) => p.userId === currentUser.id || p.fullName === currentUser.fullName) ||
    personnel[0];

  const [activeModal, setActiveModal] = useState<'none' | 'avans' | 'izin' | 'mesai'>('none');

  // Avans Form State
  const [advanceAmount, setAdvanceAmount] = useState<number>(3000);
  const [advanceNote, setAdvanceNote] = useState('');

  // İzin Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('yillik');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveDays, setLeaveDays] = useState<number>(1);
  const [leaveDesc, setLeaveDesc] = useState('');

  // Mesai Form State
  const [overtimeDate, setOvertimeDate] = useState(new Date().toISOString().split('T')[0]);
  const [overtimeStart, setOvertimeStart] = useState('18:00');
  const [overtimeEnd, setOvertimeEnd] = useState('21:30');
  const [overtimeHours, setOvertimeHours] = useState<number>(3.5);
  const [overtimeType, setOvertimeType] = useState<OvertimeType>('hafta_ici');
  const [overtimeDesc, setOvertimeDesc] = useState('');

  // Hızlı Yoklama
  const handleAttendance = async (status: 'geldi' | 'izinli') => {
    const time = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    await recordAttendance(myPerson.id, status, time);
  };

  // Avans Gönderme
  const handleSendAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advanceAmount || advanceAmount <= 0) {
      showToast('Lütfen geçerli bir avans tutarı giriniz.');
      return;
    }
    await createAdvanceRequest(myPerson.id, advanceAmount, new Date().toISOString().split('T')[0], advanceNote);
    setActiveModal('none');
    setAdvanceNote('');
  };

  // İzin Gönderme
  const handleSendLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd) {
      showToast('Lütfen başlangıç ve bitiş tarihlerini seçiniz.');
      return;
    }
    await createLeaveRequest(myPerson.id, leaveType, leaveStart, leaveEnd, leaveDays, leaveDesc);
    setActiveModal('none');
    setLeaveDesc('');
  };

  // Mesai Gönderme
  const handleSendOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    await createOvertimeRequest(
      myPerson.id,
      overtimeDate,
      overtimeStart,
      overtimeEnd,
      overtimeHours,
      overtimeType,
      overtimeDesc
    );
    setActiveModal('none');
    setOvertimeDesc('');
  };

  // Kullanıcının kendi onay talepleri
  const myApprovals = approvals.filter(
    (a) => a.personId === myPerson.id || a.personName === myPerson.fullName
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profil Karşılama Kartı */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-lg shadow-lg shadow-amber-500/20">
              {myPerson.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-neutral-100">{myPerson.fullName}</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
                  {myPerson.kind}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {myPerson.title} • Sicil No: <span className="font-mono text-neutral-200">{myPerson.employeeNo}</span> • Tel: {myPerson.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/kart/${myPerson.cardSlug || myPerson.employeeNo.toLowerCase()}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition flex items-center gap-2"
              title="Dijital Kimlik Kartım"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Dijital Kimlik Kartı</span>
            </a>
          </div>
        </div>
      </div>

      {/* Hızlı İşlem Düğmeleri */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => handleAttendance('geldi')}
          className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500/40 transition flex flex-col items-center justify-center text-center gap-2 group hover:bg-emerald-500/5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">Yoklama Ver</div>
            <div className="text-[11px] text-neutral-400">Şantiyeye Vardım</div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal('mesai')}
          className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 transition flex flex-col items-center justify-center text-center gap-2 group hover:bg-amber-500/5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">Mesai Bildir</div>
            <div className="text-[11px] text-neutral-400">Fazla Çalışma Talebi</div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal('avans')}
          className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-sky-500/40 transition flex flex-col items-center justify-center text-center gap-2 group hover:bg-sky-500/5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">Avans İste</div>
            <div className="text-[11px] text-neutral-400">Yol / Saha Harcırahı</div>
          </div>
        </button>

        <button
          onClick={() => setActiveModal('izin')}
          className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 transition flex flex-col items-center justify-center text-center gap-2 group hover:bg-purple-500/5 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-200">İzin Talebi</div>
            <div className="text-[11px] text-neutral-400">Yıllık / Mazeret İzni</div>
          </div>
        </button>
      </div>

      {/* Taleplerim ve Durumları */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-neutral-100">Son Bildirimlerim ve Onay Durumları</h2>
          </div>
          <span className="text-xs text-neutral-400">{myApprovals.length} Talep</span>
        </div>

        {myApprovals.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Henüz gönderilmiş bir onay talebiniz bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/80">
            {myApprovals.map((app) => {
              const isApproved = app.status === 'approved';
              const isRejected = app.status === 'rejected';
              return (
                <div key={app.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-neutral-100">{app.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-mono bg-neutral-800 text-neutral-400">
                        {app.kind}
                      </span>
                    </div>
                    {app.note && <div className="text-xs text-neutral-400">{app.note}</div>}
                    {app.rejectionReason && (
                      <div className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Red Gerekçesi: {app.rejectionReason}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-neutral-500">
                      {new Date(app.createdAt).toLocaleString('tr-TR')}
                    </div>
                  </div>

                  <div>
                    {isApproved ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Onaylandı
                      </span>
                    ) : isRejected ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Reddedildi
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Bekliyor
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AVANS MODAL */}
      {activeModal === 'avans' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">Avans Talebi Oluştur</h3>
            <form onSubmit={handleSendAdvance} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Talep Edilen Tutar (₺) *</label>
                <input
                  type="number"
                  required
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Talep Gerekçesi / Açıklama</label>
                <textarea
                  value={advanceNote}
                  onChange={(e) => setAdvanceNote(e.target.value)}
                  placeholder="Örn: Gece dökümü yol ve yemek masrafı için avans."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition"
                >
                  Talebi İlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* İZİN MODAL */}
      {activeModal === 'izin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">İzin Talebi Oluştur</h3>
            <form onSubmit={handleSendLeave} className="space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">İzin Türü *</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                >
                  <option value="yillik">Yıllık Ücretli İzin</option>
                  <option value="mazeret">Mazeret İzni</option>
                  <option value="rapor">Sağlık Raporu</option>
                  <option value="ucretsiz">Ücretsiz İzin</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Gün Sayısı</label>
                <input
                  type="number"
                  min={1}
                  value={leaveDays}
                  onChange={(e) => setLeaveDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Açıklama</label>
                <textarea
                  value={leaveDesc}
                  onChange={(e) => setLeaveDesc(e.target.value)}
                  placeholder="İzin gerekçesi..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition"
                >
                  İzin Talebini Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MESAİ MODAL */}
      {activeModal === 'mesai' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold">Fazla Mesai Bildirimi</h3>
            <form onSubmit={handleSendOvertime} className="space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-300 mb-1">Mesai Tarihi *</label>
                <input
                  type="date"
                  required
                  value={overtimeDate}
                  onChange={(e) => setOvertimeDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    value={overtimeStart}
                    onChange={(e) => setOvertimeStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    value={overtimeEnd}
                    onChange={(e) => setOvertimeEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Toplam Saat</label>
                  <input
                    type="number"
                    step="0.5"
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-bold text-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Mesai Türü</label>
                  <select
                    value={overtimeType}
                    onChange={(e) => setOvertimeType(e.target.value as OvertimeType)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                  >
                    <option value="hafta_ici">Hafta İçi (%50)</option>
                    <option value="hafta_sonu">Hafta Sonu (%100)</option>
                    <option value="resmi_tatil">Resmi Tatil (%100)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Yapılan İş / Şantiye Notu</label>
                <textarea
                  value={overtimeDesc}
                  onChange={(e) => setOvertimeDesc(e.target.value)}
                  placeholder="Örn: 24. kat beton santrali montajı tamamlandı."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-100 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal('none')}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition"
                >
                  Mesaiyi Onaya Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
