import React, { useState, useEffect } from 'react';
import { ERPProvider, useERP } from './lib/store';
import { Header } from './components/Header';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { DashboardPage } from './pages/DashboardPage';
import { PersonnelPage } from './pages/PersonnelPage';
import { PuantajPage } from './pages/PuantajPage';
import { FleetPage } from './pages/FleetPage';
import { OperatorPage } from './pages/OperatorPage';
import { DigitalCardPage } from './pages/DigitalCardPage';
import { FinancePage } from './pages/FinancePage';
import { PaymentPlanningPage } from './pages/PaymentPlanningPage';
import { AdminPage } from './pages/AdminPage';
import { TvBoardPage } from './pages/TvBoardPage';
import { InvoiceReceiptPage } from './pages/InvoiceReceiptPage';
import { CariPage } from './pages/CariPage';
import { QuotesPage } from './pages/QuotesPage';
import { CheckCircle2 } from 'lucide-react';
import { isEmployeeSelfServiceRole } from './types';
import { ROLE_ROUTES, ROUTE_LABELS, canAccessRoute, roleLabel } from './lib/permissions';

function AppContent() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { toastMessage, isAuthenticated, isAuthReady, currentUser, memberships, logout } = useERP();

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

  // /onay artık ayrı bir rota değil — Admin panelinin "Onay Merkezi" sekmesiyle
  // aynı işi yapıyordu ve hiçbir UI'dan linklenmiyordu. Kim URL'i yazarsa
  // /admin'e yönlendirilir ve Onay Merkezi sekmesi otomatik açılır.
  useEffect(() => {
    if (currentPath === '/onay') {
      sessionStorage.setItem('bv_admin_initial_tab', 'approvals');
      window.history.replaceState({}, '', '/admin');
      setCurrentPath('/admin');
    }
  }, [currentPath]);

  // Route: /tv (Full-screen kiosk mode)
  if (currentPath === '/tv') {
    return (
      <div className="bg-emerald-950 min-h-screen text-emerald-50">
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

  if (!isAuthReady) {
    return <div className="min-h-screen bg-emerald-50 flex items-center justify-center text-emerald-800 font-semibold">Oturum doğrulanıyor…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-emerald-50 text-slate-800 flex items-center justify-center p-4">
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

  const myMembership = memberships.find((item) => item.userId === currentUser.id);
  if (myMembership && myMembership.status !== 'approved') {
    const rejected = myMembership.status === 'rejected';
    return (
      <div className="min-h-screen bg-emerald-50 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-2xl shadow-xl p-8 text-center">
          <div className={`mx-auto mb-4 w-12 h-12 rounded-2xl flex items-center justify-center font-black ${rejected ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>BV</div>
          <h1 className="text-lg font-black text-slate-900">{rejected ? 'Üyelik başvurunuz reddedildi' : 'Üyeliğiniz onay bekliyor'}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {rejected
              ? myMembership.rejectionReason || 'Yöneticiniz başvurunuzu onaylamadı. Bilgilerinizi kontrol edip tekrar başvurabilirsiniz.'
              : 'Hesabınız oluşturuldu ancak yönetici onayı verilmeden ERP ekranlarına erişemezsiniz. Onaylandığında bu ekran otomatik açılır.'}
          </p>
          <div className="mt-4 rounded-xl bg-emerald-50/70 px-3 py-2 text-left text-[11px] text-slate-600">
            <div><b>Ad soyad:</b> {myMembership.userFullName || currentUser.fullName}</div>
            <div><b>E-posta:</b> {myMembership.userEmail || currentUser.email}</div>
            <div><b>Talep edilen rol:</b> {roleLabel(myMembership.requestedRole)}</div>
            {myMembership.matchedPersonnelName && <div><b>Eşleşen personel:</b> {myMembership.matchedPersonnelName}</div>}
          </div>
          <button onClick={logout} className="mt-6 w-full py-2.5 rounded-xl border border-emerald-200 text-emerald-800 text-sm font-bold transition hover:bg-emerald-50">Oturumu kapat</button>
        </div>
      </div>
    );
  }

  const employeeSelfServiceOnly = isEmployeeSelfServiceRole(currentUser.role);
  if (employeeSelfServiceOnly && currentPath !== '/operator') {
    return (
      <div className="min-h-screen bg-emerald-50 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">BV</div>
          <h1 className="text-lg font-black text-slate-900">Personel talepleri</h1>
          <p className="mt-2 text-sm text-slate-500">Bu hesap yalnızca kendi yoklama, izin, avans, mesai, makbuz ve masraf taleplerine erişebilir.</p>
          <button onClick={() => navigate('/operator')} className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition">Personel taleplerine git</button>
        </div>
      </div>
    );
  }

  if (!employeeSelfServiceOnly && !canAccessRoute(currentUser.role, currentPath)) {
    const allowedRoutes = (ROLE_ROUTES[currentUser.role] || ['/']).filter((item) => item !== '*');
    const fallback = allowedRoutes[0] || '/';
    return (
      <div className="min-h-screen bg-emerald-50 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-emerald-100 rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">BV</div>
          <h1 className="text-lg font-black text-slate-900">Bu ekrana yetkiniz yok</h1>
          <p className="mt-2 text-sm text-slate-500">
            {roleLabel(currentUser.role)} rolü “{ROUTE_LABELS[currentPath] || currentPath}” ekranını görüntüleyemez. Ek yetki için kurucu veya sistem yöneticisine başvurun.
          </p>
          <button onClick={() => navigate(fallback)} className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition">Yetkili ekrana dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
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
        {(currentPath === '/faturalar' || currentPath === '/makbuz-fatura') && <InvoiceReceiptPage />}
        {(currentPath === '/cariler' || currentPath === '/cari') && <CariPage />}
        {currentPath === '/personel' && <PersonnelPage />}
        {currentPath === '/puantaj' && <PuantajPage />}
        {currentPath === '/filo' && <FleetPage />}
        {currentPath === '/operator' && <OperatorPage />}
        {currentPath === '/finans' && <FinancePage />}
        {currentPath === '/finans-planlama' && <PaymentPlanningPage />}
        {currentPath === '/teklifler' && <QuotesPage />}
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
          <div className="bg-emerald-950 border border-emerald-300/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
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
