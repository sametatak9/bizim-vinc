import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, ShieldCheck, LogOut, CheckCircle2, ArrowRight } from 'lucide-react';
import { useERP } from '../lib/store';
import { AppRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    userProfiles,
    switchUser,
    loginWithCredentials,
    registerUser,
    logout,
    showToast,
  } = useERP();

  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('switch');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('operator');
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
      setError('Lütfen tüm zorunlu alanları doldurunuz.');
      return;
    }
    setLoading(true);
    const res = await registerUser(email, password, fullName, role, phone);
    setLoading(false);
    if (res.success) {
      showToast(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-emerald-100 text-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kullanıcı & Kimlik Yönetimi</h2>
              <p className="text-xs text-slate-500">Bizim Vinç ERP Güvenli Giriş</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-emerald-100/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
              <div className="text-[11px] text-emerald-800 font-mono capitalize">
                {currentUser.role} • {currentUser.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-white transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-emerald-100 text-xs">
          <button
            onClick={() => {
              setMode('switch');
              setError(null);
            }}
            className={`flex-1 py-3 font-bold transition border-b-2 ${
              mode === 'switch'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Hızlı Profil Değiştir
          </button>
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 font-bold transition border-b-2 ${
              mode === 'login'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 font-bold transition border-b-2 ${
              mode === 'register'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Yeni Kullanıcı
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* Quick Switch Profiles */}
          {mode === 'switch' && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 mb-3">
                Operasyon testleri ve rol yetkilerini incelemek için kayıtlı hesaplardan birine anında geçiş yapabilirsiniz:
              </p>
              {userProfiles.map((u) => {
                const isActive = currentUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 font-medium'
                        : 'border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {u.fullName}
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <div className="text-xs text-slate-500">{u.title || u.department || u.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Direct Sign In Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">E-Posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@bizimvinc.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Oturum Aç'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Register New User Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ad Soyad *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ahmet Kaya"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-Posta *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ahmet@bizimvinc.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefon</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 532 000 00 00"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sistem Rolü *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 transition font-medium"
                  >
                    <option value="operator">Operatör</option>
                    <option value="puantor">Puantör</option>
                    <option value="muhasebe">Muhasebe</option>
                    <option value="operasyon">Operasyon Yön.</option>
                    <option value="yonetici">Yönetici</option>
                    <option value="admin">Sistem Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Şifre *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-emerald-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loading ? 'Kayıt Yapılıyor...' : 'Kullanıcıyı Kaydet'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
