import React, { useState } from 'react';
import { useERP } from '../lib/store';
import {
  Users,
  CheckSquare,
  Calendar,
  Truck,
  LayoutDashboard,
  Smartphone,
  DollarSign,
  Shield,
  Menu,
  X,
  ChevronDown,
  Bell,
  Settings,
  LogOut,
  Building2,
  FileText,
  Database,
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSupabaseModal: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPath,
  onNavigate,
  onOpenSupabaseModal,
  onOpenAuthModal,
}) => {
  const { currentUser, logout, isSupabaseOnline, pendingApprovalsCount, notifications } = useERP();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = [
    { label: 'Komuta Merkezi', path: '/', icon: LayoutDashboard },
    { label: 'Makbuz & Fatura', path: '/faturalar', icon: FileText },
    { label: 'Cari & Şantiyeler', path: '/cariler', icon: Building2 },
    { label: 'Personel & Maaş', path: '/personel', icon: Users },
    { label: 'Puantaj', path: '/puantaj', icon: Calendar },
    { label: 'Onay Merkezi', path: '/onay', icon: CheckSquare, badge: pendingApprovalsCount || undefined },
    { label: 'Filo', path: '/filo', icon: Truck },
    { label: 'Operatör Paneli', path: '/operator', icon: Smartphone },
    { label: 'Finans', path: '/finans', icon: DollarSign },
    { label: 'Yönetim', path: '/admin', icon: Shield },
  ];

  const visibleNavItems =
    currentUser.role === 'operator'
      ? navItems.filter((item) => item.path === '/operator')
      : navItems;

  return (
    <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b-2 border-emerald-300 text-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          onClick={() => onNavigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
            <svg viewBox="0 0 64 64" width="28" height="28" fill="none">
              <path d="M20 54h24M24 54l4-8h8l4 8M28 46h8" stroke="#15803D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 46V12M28 16h8M28 24h8M28 32h8M28 40h8" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M28 16l8 8M36 16l-8 8M28 24l8 8M36 24l-8 8M28 32l8 8M36 32l-8 8" stroke="#22C55E" strokeWidth="1.6" />
              <path d="M12 14h42M12 14v4M48 14v10" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
              <path d="M32 6l-20 8M32 6l16 8M32 6l22 8" stroke="#22C55E" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M48 24v12M48 36c-2 0-3.5 1.5-3.5 3.5 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
              <rect x="33" y="15" width="5" height="6" rx="1" fill="#DCFCE7" stroke="#15803D" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-emerald-950 flex items-center gap-1.5 leading-none">
              <span>BİZİM VİNÇ</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded-md">ERP</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium tracking-tight mt-0.5 hidden sm:block">En derinden, en yükseklere</div>
          </div>
        </div>

        <nav className="hidden 2xl:flex items-center gap-1" aria-label="Ana menü">
          {visibleNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`relative px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-600 text-white">{item.badge}</span>
                )}
              </button>
            );
          })}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 transition border border-transparent hover:border-emerald-100"
            >
              <span>Diğer</span>
              <ChevronDown size={12} className={`transition-transform ${moreMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreMenuOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white border border-emerald-100 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in">
                {visibleNavItems.slice(5).map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => { onNavigate(item.path); setMoreMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-600 text-white">{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenSupabaseModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
          >
            <Database size={14} />
            <span className="text-[11px]">{isSupabaseOnline ? 'Canlı DB' : 'Yerel / Supabase'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 transition"
            >
              <Bell size={18} />
              {(notifications?.length ?? 0) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-emerald-100 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-slate-800 mb-2">Bildirimler</div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {(notifications ?? []).slice(0, 8).map((n: any, i: number) => (
                    <div key={i} className="text-xs p-2 rounded-lg bg-emerald-50/50 text-slate-700">{n.message || n.title || String(n)}</div>
                  ))}
                  {(notifications ?? []).length === 0 && (
                    <div className="text-xs text-slate-400 py-4 text-center">Bildirim yok</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenAuthModal}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">
              {(currentUser?.name || currentUser?.email || 'U').slice(0, 2).toUpperCase()}
            </div>
            <span className="max-w-[80px] truncate">{currentUser?.name || 'Hesap'}</span>
          </button>

          <button
            onClick={() => logout?.()}
            className="p-2 rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition"
            title="Çıkış"
          >
            <LogOut size={16} />
          </button>

          <button
            className="2xl:hidden p-2 rounded-xl text-slate-600 hover:bg-emerald-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menü"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="2xl:hidden border-t border-emerald-100 bg-white px-4 py-3 space-y-1 max-h-[70vh] overflow-y-auto shadow-inner">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { onNavigate(item.path); setMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive ? 'bg-emerald-100 text-emerald-900' : 'text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
