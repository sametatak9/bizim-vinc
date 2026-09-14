import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, LogOut, ArrowRight, IdCard, Briefcase } from 'lucide-react';
import { useERP } from '../lib/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, isAuthenticated, loginWithCredentials, registerUser, logout, showToast } = useERP();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [requestedRole, setRequestedRole] = useState<'personel' | 'operator'>('personel');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi giriniz.');
      return;
    }
    setLoading(true);
    const res = await loginWithCredentials(email, password);
    setLoading(false);
    if (res.success) {
      showToast(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !fullName) {
      setError('Lütfen ad, e-posta ve şifre alanlarını doldurunuz.');
      return;
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== passwordRepeat) {
      setError('Şifreler birbiriyle aynı değil.');
      return;
    }
    const tcDigits = tcNo.replace(/\D/g, '');
    if (tcDigits && tcDigits.length !== 11) {
      setError('TC kimlik numarası 11 haneli olmalıdır.');
      return;
    }
    setLoading(true);
    const res = await registerUser(email, password, fullName, phone, { tcNo: tcDigits, requestedRole });
    setLoading(false);
    if (res.success) {
      showToast(res.message);
      setMode('login');
      setPassword('');
      setPasswordRepeat('');
      setTcNo('');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-emerald-100 text-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Güvenli Giriş</h2>
              <p className="text-xs text-slate-500">Bizim Vinç ERP</p>
            </div>
          </div>
          {isAuthenticated && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-emerald-100/50 transition" aria-label="Kapat">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {isAuthenticated && (
          <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                <div className="text-[11px] text-emerald-800 font-mono capitalize">{currentUser.role} • {currentUser.email}</div>
              </div>
            </div>
            <button onClick={() => { logout(); onClose(); }} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-white transition">
              <LogOut className="w-3.5 h-3.5" />
              <span>Çıkış</span>
            </button>
          </div>
        )}

        <div className="flex border-b border-emerald-100 text-xs">
          <button onClick={() => { setMode('login'); setError(null); }} className={`flex-1 py-3 font-bold transition border-b-2 ${mode === 'login' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            Giriş Yap
          </button>
          <button onClick={() => { setMode('register'); setError(null); }} className={`flex-1 py-3 font-bold transition border-b-2 ${mode === 'register' ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            Yeni Üyelik
          </button>
        </div>

        <div className="p-5">
          {error && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</div>}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">E-posta Adresi</label>
                <div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ad@firma.com" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Şifre</label>
                <div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50">{loading ? 'Giriş Yapılıyor...' : 'Oturum Aç'}<ArrowRight className="w-4 h-4" /></button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Ad Soyad *</label><div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ad Soyad" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">E-posta *</label><div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ad@firma.com" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label><div className="relative"><Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">TC Kimlik No</label><div className="relative"><IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="text" inputMode="numeric" maxLength={11} value={tcNo} onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ''))} placeholder="11 haneli TC kimlik no" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div><p className="mt-1 text-[10px] text-slate-500">TC numarası girerseniz hesabınız mevcut personel kaydınızla otomatik eşleştirilir.</p></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Görev tipi *</label><div className="relative"><Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><select value={requestedRole} onChange={(e) => setRequestedRole(e.target.value as 'personel' | 'operator')} className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition"><option value="personel">Personel (saha / ofis çalışanı)</option><option value="operator">Operatör (vinç operatörü — makbuz yetkisi)</option></select></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Şifre *</label><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 8 karakter" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Şifre tekrar *</label><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" required value={passwordRepeat} onChange={(e) => setPasswordRepeat(e.target.value)} placeholder="Şifreyi yeniden yazın" className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition" /></div></div>
              <p className="text-[11px] text-slate-500">Yeni üyelikler kurucu onayına gönderilir. Onaylanmadan ERP ekranlarına erişilemez.</p>
              <button type="submit" disabled={loading} className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50">{loading ? 'Başvuru Gönderiliyor...' : 'Üyelik Başvurusu Gönder'}<ArrowRight className="w-4 h-4" /></button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
