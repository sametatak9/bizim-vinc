import React, { useState } from 'react';
import { useERP } from '../lib/store';
import {
  Users,
  CheckSquare,
  Truck,
  Smartphone,
  LayoutDashboard,
  DollarSign,
  Tv,
  Database,
  Menu,
  X,
  Calendar,
  Shield,
  Bell,
  CheckCircle2,
  ChevronDown,
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
  const {
    stats,
    isSupabaseOnline,
    currentUser,
    notifications,
    markNotificationAsRead,
  } = useERP();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { label: 'Komuta Merkezi', path: '/', icon: LayoutDashboard },
    { label: 'Personel', path: '/personel', icon: Users },
    { label: 'Puantaj & Devam', path: '/puantaj', icon: Calendar },
    {
      label: 'Onay Merkezi',
      path: '/onay',
      icon: CheckSquare,
      badge: stats.pendingApprovalsCount > 0 ? stats.pendingApprovalsCount : undefined,
    },
    { label: 'Filo', path: '/filo', icon: Truck },
    { label: 'Operatör Paneli', path: '/operator', icon: Smartphone },
    { label: 'Finans', path: '/finans', icon: DollarSign },
    { label: 'Yönetim', path: '/admin', icon: Shield },
    { label: 'Canlı TV', path: '/tv', icon: Tv },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-900/90 backdrop-blur-md border-b border-neutral-800 text-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => onNavigate('/')}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-sm">
            <svg viewBox="0 0 64 64" width="26" height="26" fill="none">
              <path
                d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z"
                fill="#f59e0b"
              />
              <path
                d="M30 48V18M30 18h18M48 18v4M30 28h12"
                stroke="#d97706"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M26 48h8M28 18l-4 6h12"
                stroke="#d97706"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="48" cy="24" r="2.6" fill="#d97706" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-neutral-100 flex items-center gap-1.5">
              <span>BİZİM VİNÇ</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 font-mono rounded">
                ERP
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 hidden sm:block">
              Vinç & Operasyon Yönetim Sistemi
            </div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden xl:flex items-center gap-1" aria-label="Ana menü">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-amber-400' : 'text-neutral-400'} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-neutral-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Navigation - Tablet (More compact) */}
        <nav className="hidden md:flex xl:hidden items-center gap-1" aria-label="Tablet menü">
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-neutral-950">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions / Right Controls */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-neutral-850 hover:bg-neutral-800 text-neutral-300 hover:text-white transition border border-neutral-800"
              title="Bildirimler"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-2">
                  <span className="text-xs font-bold text-neutral-100">Bildirimler ({notifications.length})</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-neutral-500 hover:text-neutral-300 text-xs"
                  >
                    Kapat
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-4 text-xs text-neutral-500">Henüz bildirim yok.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                          n.isRead
                            ? 'bg-neutral-950 border-neutral-850 text-neutral-400'
                            : 'bg-amber-500/5 border-amber-500/20 text-neutral-200 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-neutral-100">{n.title}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isSupabaseOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
            }`}
            title="Supabase Veritabanı ve Şema Durumu"
          >
            <Database size={13} />
            <span className="text-[11px]">{isSupabaseOnline ? 'PostgreSQL' : 'Yerel / Supabase'}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSupabaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Current User & Role Pill -> Opens AuthModal */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 transition"
            title="Hesap ve Rol Değiştir"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-neutral-950 font-bold flex items-center justify-center text-xs">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-bold text-neutral-100">{currentUser.fullName}</div>
              <div className="text-[10px] text-amber-400 uppercase font-mono">{currentUser.role}</div>
            </div>
            <ChevronDown size={14} className="text-neutral-500 hidden sm:block" />
          </button>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700"
            aria-label="Menüyü aç/kapat"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-950 border-t border-neutral-800 px-4 py-4 space-y-2">
          {/* Quick Database & User buttons */}
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-800">
            <button
              onClick={() => {
                onOpenSupabaseModal();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5"
            >
              <Database size={14} className="text-amber-500" />
              <span>Veritabanı</span>
            </button>
            <button
              onClick={() => {
                onOpenAuthModal();
                setMobileMenuOpen(false);
              }}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 flex items-center justify-center gap-1.5"
            >
              <span>Hesap ({currentUser.role})</span>
            </button>
          </div>

          {navItems.map((item) => {
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
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'text-neutral-300 hover:bg-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-neutral-900 text-amber-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
