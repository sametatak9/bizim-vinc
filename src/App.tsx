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
import { CheckCircle2 } from 'lucide-react';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toastMessage } = useERP();

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
      <div className="bg-neutral-950 min-h-screen text-neutral-100">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="px-3.5 py-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 rounded-xl text-xs font-semibold backdrop-blur-sm transition border border-neutral-700 shadow-lg"
          >
            ← ERP Paneline Dön
          </button>
        </div>
        <TvBoardPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* Topbar navigation */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Dynamic Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentPath === '/' && <DashboardPage onNavigate={navigate} />}
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
          <div className="bg-neutral-900 border border-amber-500/40 text-neutral-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
            <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
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
