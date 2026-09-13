import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './lib/store';
import { Header } from './components/Header';
import { SupabaseModal } from './components/SupabaseModal';
import { DashboardPage } from './pages/DashboardPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { FleetPage } from './pages/FleetPage';
import { OperatorPage } from './pages/OperatorPage';
import { DigitalCardPage } from './pages/DigitalCardPage';
import { FinancePage } from './pages/FinancePage';
import { TvBoardPage } from './pages/TvBoardPage';
import { CheckCircle } from 'lucide-react';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
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
      <div className="bg-emerald-950 min-h-screen">
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold backdrop-blur-xs transition"
          >
            ← ERP Paneline Dön
          </button>
        </div>
        <TvBoardPage />
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {/* Topbar navigation */}
      <Header
        currentPath={currentPath}
        onNavigate={navigate}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Dynamic Views */}
      <div className="flex-1">
        {currentPath === '/' && <DashboardPage />}
        {currentPath === '/personel' && <PersonnelPage />}
        {currentPath === '/onay' && <ApprovalPage />}
        {currentPath === '/filo' && <FleetPage />}
        {currentPath === '/operator' && <OperatorPage />}
        {currentPath === '/finans' && <FinancePage />}
      </div>

      {/* Supabase Connection & Schema Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast-item animate-in slide-in-from-bottom-5">
            <CheckCircle size={16} className="text-emerald-400" />
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
