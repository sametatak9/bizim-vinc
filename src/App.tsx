import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './lib/store';
import { Header } from './components/Header';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { PuantajPage } from './pages/PuantajPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { FleetPage } from './pages/FleetPage';
import { OperatorPage } from './pages/OperatorPage';
import { DigitalCardPage } from './pages/DigitalCardPage';
import { FinancePage } from './pages/FinancePage';
import { AdminPage } from './pages/AdminPage';
import { TvBoardPage } from './pages/TvBoardPage';
import { InvoiceReceiptPage } from './pages/InvoiceReceiptPage';
import { CariPage } from './pages/CariPage';
import { CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toastMessage, dbError, refreshFromDb, isAuthenticated } = useERP();

  // Listen to browser popstate (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (path !== currentPath) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Route: /kart/:token
  if (currentPath.startsWith('/kart/')) {
    const token = currentPath.replace('/kart/', '');
    return (
      <DigitalCardPage
        token={token}
        onNavigateHome={() => navigate('/')}
      />
    );
  }

  // Route: /tv (Full-screen kiosk mode)
  if (currentPath === '/tv') {
    return (
      <div className="bg-slate-900 min-h-screen text-slate-100">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold backdrop-blur-xs transition border border-slate-600 shadow-lg"
          >
            ← ERP Paneline Dön
          </button>
        </div>
        <TvBoardPage />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F0FDF4] text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <div className="text-2xl font-black tracking-tight text-emerald-950">BİZİM VİNÇ <span className="text-sm px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md">ERP</span></div>
            <p className="text-sm text-emerald-700 mt-2">En derinden, en yükseklere</p>
          </div>
          <AuthModal isOpen onClose={() => undefined} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0FDF4] text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Topbar navigation */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Database Error Banner (Requirement: No silent fallback to localStorage for DB errors; must show net error/retry) */}
      {dbError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-900 px-4 py-2.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-rose-600 shrink-0" size={16} />
              <span>
                <strong>Veritabanı Uyarısı:</strong> {dbError}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => refreshFromDb()}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition"
              >
                <RefreshCw size={12} />
                <span>Yeniden Dene</span>
              </button>
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="underline hover:text-rose-950 font-semibold"
              >
                Bağlantı Ayarları
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentPath === '/' && <DashboardPage onNavigate={navigate} />}
        {(currentPath === '/faturalar' || currentPath === '/makbuz-fatura') && <InvoiceReceiptPage />}
        {(currentPath === '/cariler' || currentPath === '/cari') && <CariPage />}
        {currentPath === '/personel' && <PersonnelPage />}
        {currentPath === '/puantaj' && <PuantajPage />}
        {currentPath === '/onay' && <ApprovalPage />}
        {currentPath === '/filo' && <FleetPage />}
        {currentPath === '/operator' && <OperatorPage />}
        {currentPath === '/finans' && <FinancePage />}
        {currentPath === '/admin' && <AdminPage />}
      </main>

      {/* Supabase Connection & Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ERPProvider>
      <AppContent />
    </ERPProvider>
  );
}
