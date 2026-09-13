import React, { useState } from 'react';
import { useERP } from '../lib/store';
import {
  Users,
  CheckSquare,
  Truck,
  Smartphone,
  LayoutDashboard,
  DollarSign,
  Database,
  Menu,
  X,
  Calendar,
  Shield,
  Bell,
  CheckCircle2,
  ChevronDown,
  FileText,
  Building2,
  Receipt as ReceiptIcon,
} from 'lucide-react';
import { isEmployeeSelfServiceRole } from '../types';
import { ProfilePanel } from './ProfilePanel';

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
  const {
    stats,
    isSupabaseOnline,
    currentUser,
    notifications,
    markNotificationAsRead,
  } = useERP();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { label: 'Komuta Merkezi', path: '/', icon: LayoutDashboard },
    {
      label: 'Makbuz & Fatura',
      path: '/faturalar',
      icon: FileText,
      badge: stats.unInvoicedReceiptsCount > 0 ? stats.unInvoicedReceiptsCount : undefined,
    },
    { label: 'Cari & Şantiyeler', path: '/cariler', icon: Building2 },
    { label: 'Personel & Maaş', path: '/personel', icon: Users },
    { label: 'Puantaj', path: '/puantaj', icon: Calendar },
    {
      label: 'Onay Merkezi',
      path: '/onay',
      icon: CheckSquare,
      badge: stats.pendingApprovalsCount > 0 ? stats.pendingApprovalsCount : undefined,
    },
    { label: 'Filo', path: '/filo', icon: Truck },
    { label: 'Personel Talepleri', path: '/operator', icon: Smartphone },
    { label: 'Finans', path: '/finans', icon: DollarSign },
    { label: 'Teklifler', path: '/teklifler', icon: FileText },
    { label: 'Yönetim', path: '/admin', icon: Shield },
  ];
  const visibleNavItems = isEmployeeSelfServiceRole(currentUser.role)
    ? navItems.filter((item) => item.path === '/operator')
    : navItems;

  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b-2 border-amber-500/70 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand with green tower crane + Slogan */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          onClick={() => onNavigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
            <svg viewBox="0 0 64 64" width="28" height="28" fill="none">
              <path
                d="M20 54h24M24 54l4-8h8l4 8M28 46h8"
                stroke="#15803D"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M32 46V12M28 16h8M28 24h8M28 32h8M28 40h8"
                stroke="#15803D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M28 16l8 8M36 16l-8 8M28 24l8 8M36 24l-8 8M28 32l8 8M36 32l-8 8"
                stroke="#22C55E"
                strokeWidth="1.6"
              />
              <path
                d="M12 14h42M12 14v4M48 14v10"
                stroke="#15803D"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M32 6l-20 8M32 6l16 8M32 6l22 8"
                stroke="#22C55E"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M48 24v12M48 36c-2 0-3.5 1.5-3.5 3.5 0 2 1.5 3.5 3.5 3.5s3.5-1.5 3.5-3.5"
                stroke="#15803D"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect x="33" y="15" width="5" height="6" rx="1" fill="#DCFCE7" stroke="#15803D" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-none">
              <span>BİZİM VİNÇ</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold rounded-md">
                ERP
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5 hidden sm:block">
              En derinden, en yükseklere
            </div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden 2xl:flex items-center gap-1" aria-label="Ana menü">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`relative px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70 border border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Navigation - Medium */}
        <nav className="hidden md:flex 2xl:hidden items-center gap-1" aria-label="Kompakt menü">
          {visibleNavItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`px-2 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition ${
                  isActive
                    ? 'bg-emerald-100/80 text-emerald-900 font-bold border border-emerald-200'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-600 text-white">
                    {item.badge}
                  </span>
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
                      onClick={() => {
                        onNavigate(item.path);
                        setMoreMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-600 hover:bg-emerald-50/60 hover:text-emerald-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-600 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-800 transition border border-emerald-200/60"
              title="Bildirimler"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-emerald-100 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100 mb-2">
                  <span className="text-xs font-bold text-emerald-950">Bildirimler ({notifications.length})</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-medium"
                  >
                    Kapat
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">Henüz bildirim yok.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          n.isRead
                            ? 'bg-slate-50 border-slate-200/70 text-slate-500'
                            : 'bg-emerald-50/80 border-emerald-200 text-emerald-950 font-medium shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenSupabaseModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isSupabaseOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Supabase Veritabanı ve Şema Durumu"
          >
            <Database size={13} />
            <span className="text-[11px]">{isSupabaseOnline ? 'Canlı DB' : 'Yerel / Supabase'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupabaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'
              }`}
            />
          </button>

          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-950 border border-emerald-200 transition"
            title="Hesap ve Rol Değiştir"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-slate-800">{currentUser.fullName}</div>
              <div className="text-[10px] text-emerald-700 uppercase font-mono font-semibold">{currentUser.role}</div>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200"
            aria-label="Menüyü aç/kapat"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100 px-4 py-4 space-y-2 shadow-lg">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-emerald-100">
            <button
              onClick={() => {
                onOpenSupabaseModal();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-center gap-1.5"
            >
              <Database size={14} className="text-emerald-600" />
              <span>Veritabanı</span>
            </button>
            <button
              onClick={() => {
                onOpenAuthModal();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-center gap-1.5"
            >
              <span>Hesap ({currentUser.role})</span>
            </button>
          </div>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  onNavigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-700 hover:bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
    </header>
  );
};
