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
  X
} from 'lucide-react';

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenSupabaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate, onOpenSupabaseModal }) => {
  const { stats, isSupabaseOnline, personnel, currentOperator, setCurrentOperatorId } = useERP();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Komuta Merkezi', path: '/', icon: LayoutDashboard },
    { label: 'Personel', path: '/personel', icon: Users },
    { 
      label: 'Onay Merkezi', 
      path: '/onay', 
      icon: CheckSquare,
      badge: stats.pendingApprovalsCount > 0 ? stats.pendingApprovalsCount : undefined
    },
    { label: 'Filo', path: '/filo', icon: Truck },
    { label: 'Operatör Paneli', path: '/operator', icon: Smartphone },
    { label: 'Finans', path: '/finans', icon: DollarSign },
    { label: 'Canlı TV', path: '/tv', icon: Tv },
  ];

  return (
    <header className="topbar" id="app-header">
      <div className="topbar-inner">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('/')}>
          <div className="brand-mark-logo" aria-label="Bizim Vinç logosu">
            <svg aria-hidden="true" viewBox="0 0 64 64" width="40" height="40" fill="none">
              <path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" />
              <path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M26 48h8M28 18l-4 6h12" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="48" cy="24" r="2.4" fill="#16A34A" />
            </svg>
          </div>
          <div>
            <div className="brand-name">BİZİM VİNÇ</div>
            <div className="brand-tagline">En derinden, en yükseklere</div>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="nav-scroll hidden md:flex" aria-label="Ana menü">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`nav-link ${isActive ? 'active' : ''}`}
                id={`nav-link-${item.path.replace('/', '') || 'root'}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-orange-600 text-white leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions / Status */}
        <div className="flex items-center gap-2">
          {/* Supabase connection indicator button */}
          <button
            onClick={onOpenSupabaseModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSupabaseOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title="Supabase Veritabanı Durumu"
            id="supabase-status-btn"
          >
            <Database size={14} className={isSupabaseOnline ? 'text-emerald-600' : 'text-amber-600'} />
            <span className="hidden sm:inline">
              {isSupabaseOnline ? 'Supabase Bağlı' : 'Supabase (Yerel Yedek)'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
          </button>

          {/* Operator Switcher */}
          <div className="relative hidden sm:flex items-center">
            <select
              value={currentOperator.id}
              onChange={(e) => setCurrentOperatorId(e.target.value)}
              className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-lg px-2 py-1.5 pr-6 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
              title="Aktif Saha Operatörünü Seç"
              id="operator-selector-dropdown"
            >
              {personnel.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.employeeNo})
                </option>
              ))}
            </select>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-emerald-900 hover:bg-emerald-50"
            aria-label="Menüyü aç/kapat"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-emerald-100 px-4 py-3 shadow-lg">
          <div className="flex flex-col gap-1">
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
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive ? 'bg-emerald-100 text-emerald-950 font-bold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-orange-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="mt-2 pt-2 border-t border-gray-100">
              <label className="text-xs text-gray-500 font-medium block mb-1">
                Aktif Operatör:
              </label>
              <select
                value={currentOperator.id}
                onChange={(e) => setCurrentOperatorId(e.target.value)}
                className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-lg px-2 py-2"
              >
                {personnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.employeeNo})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
