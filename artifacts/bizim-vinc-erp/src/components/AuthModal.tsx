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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100">Kullanıcı & Kimlik Yönetimi</h2>
              <p className="text-xs text-neutral-400">Bizim Vinç ERP Güvenli Giriş</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="p-4 bg-amber-500/5 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-medium text-neutral-200">{currentUser.fullName}</div>
              <div className="text-[11px] text-amber-400 font-mono capitalize">
                {currentUser.role} • {currentUser.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-400 px-2.5 py-1 rounded-md hover:bg-neutral-800 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Çıkış</span>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-neutral-800 text-xs">
          <button
            onClick={() => {
              setMode('switch');
              setError(null);
            }}
            className={`flex-1 py-3 font-medium transition border-b-2 ${
              mode === 'switch'
                ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Hızlı Profil Değiştir
          </button>
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-3 font-medium transition border-b-2 ${
              mode === 'login'
                ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-3 font-medium transition border-b-2 ${
              mode === 'register'
                ? 'border-amber-500 text-amber-400 bg-neutral-800/40'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Yeni Kullanıcı
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Quick Switch Profiles */}
          {mode === 'switch' && (
            <div className="space-y-2">
              <p className="text-xs text-neutral-400 mb-3">
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
                        ? 'border-amber-500 bg-amber-500/10 text-neutral-100'
                        : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800/50 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isActive ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {u.fullName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {u.fullName}
                          {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <div className="text-xs text-neutral-400">{u.title || u.department || u.email}</div>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full uppercase font-mono font-bold bg-neutral-800 text-amber-400 border border-amber-500/20">
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
                <label className="block text-xs text-neutral-300 mb-1.5">E-Posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@bizimvinc.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1.5">Şifre</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
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
                <label className="block text-xs text-neutral-300 mb-1">Ad Soyad *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ahmet Kaya"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">E-Posta *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ahmet@bizimvinc.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-300 mb-1">Telefon</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+90 532 000 00 00"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">Sistem Rolü *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AppRole)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 focus:outline-none focus:border-amber-500 transition"
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
                  <label className="block text-xs text-neutral-300 mb-1">Şifre *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50"
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
