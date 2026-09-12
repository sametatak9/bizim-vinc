import { useState, type ReactNode } from 'react';
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Menu,
  MonitorPlay,
  Settings2,
  ShieldCheck,
  Truck,
  UserCog,
  UserRound,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import PersonelPage from '@/pages/personel';
import OnayPage from '@/pages/onay';
import FiloPage from '@/pages/filo';
import CraneMap from '@/components/dashboard/crane-map';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type IconType = typeof LayoutDashboard;

const navItems: { label: string; icon: IconType; href: string }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Personel', icon: UsersRound, href: '/personel' },
  { label: 'Onay', icon: BadgeCheck, href: '/onay' },
  { label: 'Filo', icon: Truck, href: '/filo' },
  { label: 'Finans', icon: CircleDollarSign, href: '/finans' },
  { label: 'TV', icon: MonitorPlay, href: '/tv' },
  { label: 'Admin', icon: UserCog, href: '/admin' },
  { label: 'Ayarlar', icon: Settings2, href: '/ayarlar' },
];

function BuildingMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" width="40" height="40" fill="none">
      <path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" />
      <path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M26 48h8M28 18l-4 6h12" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="48" cy="24" r="2.4" fill="#16A34A" />
    </svg>
  );
}

function AppLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    return location.startsWith(href);
  };

  const handleComingSoon = (label: string) => {
    showToast(`${label} modülü yakında kullanıma açılacak.`);
    setMenuOpen(false);
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark brand-mark-logo" aria-label="Bizim Vinç logosu">
            <BuildingMark />
          </div>
          <div>
            <div className="brand-name">BİZİM VİNÇ</div>
            <div className="brand-tagline">En derinden, en yükseklere</div>
          </div>

          <nav className={`nav-scroll${menuOpen ? ' open' : ''}`} aria-label="Ana menü">
            {navItems.map(({ label, icon: Icon, href }) => {
              const ready = href === '/' || href === '/personel' || href === '/onay' || href === '/filo';
              if (ready) {
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`nav-link${isActive(href) ? ' active' : ''}`}
                    data-testid={`button-nav-${label.toLocaleLowerCase('tr-TR')}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                    {label}
                  </Link>
                );
              }
              return (
                <button
                  key={label}
                  className="nav-link"
                  data-testid={`button-nav-${label.toLocaleLowerCase('tr-TR')}`}
                  onClick={() => handleComingSoon(label)}
                  type="button"
                >
                  <Icon size={15} strokeWidth={1.8} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="header-actions">
            <button
              aria-label="Bildirimler"
              className="icon-button"
              data-testid="button-notifications"
              onClick={() => showToast('Yeni bildiriminiz bulunmuyor.')}
              type="button"
            >
              <Bell size={17} strokeWidth={1.8} />
            </button>
            <button
              aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              className="icon-button mobile-menu-button"
              data-testid="button-mobile-menu"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <button
              className="user-chip"
              data-testid="button-user-profile"
              onClick={() => showToast('Profil menüsü yakında hazır olacak.')}
              type="button"
            >
              <span className="avatar">EY</span>
              <span className="user-label">
                <strong>Esra Y.</strong>
                <span>Operasyon yöneticisi</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {toast && (
        <div className="toast" data-testid="status-toast">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function DashboardHome() {
  return (
    <div className="cmd-page">
      <section className="cmd-kpis" aria-label="Günlük KPI">
        <div className="cmd-kpi"><span className="cmd-kpi-label">Bugünkü ciro</span><strong>186.450 ₺</strong></div>
        <div className="cmd-kpi"><span className="cmd-kpi-label">Kesilen makbuz</span><strong>14</strong></div>
        <div className="cmd-kpi"><span className="cmd-kpi-label">Biriken makbuz</span><strong className="warn">7</strong></div>
        <div className="cmd-kpi"><span className="cmd-kpi-label">Bugün yakıt</span><strong>12.840 ₺</strong></div>
        <div className="cmd-kpi"><span className="cmd-kpi-label">Bugün masraf</span><strong>4.320 ₺</strong></div>
        <div className="cmd-kpi"><span className="cmd-kpi-label">Aktif vinç</span><strong>9 / 12</strong></div>
      </section>

      <div className="cmd-split">
        <div className="cmd-map-col">
          <CraneMap height={620} />
        </div>

        <aside className="cmd-side" aria-label="Operasyon kartları">
          <article className="cmd-card">
            <header><h3>Kesilen makbuzlar</h3><span className="cmd-badge ok">14</span></header>
            <ul className="cmd-list">
              <li><strong>MK-2026-0148</strong><span>Yapı Kredi · 42.000 ₺</span></li>
              <li><strong>MK-2026-0147</strong><span>Kuzey Yapı · 18.500 ₺</span></li>
              <li><strong>MK-2026-0146</strong><span>Ege Liman · 27.200 ₺</span></li>
              <li><strong>MK-2026-0145</strong><span>Marmara Rüzgar · 31.000 ₺</span></li>
            </ul>
          </article>

          <article className="cmd-card">
            <header><h3>Biriken makbuzlar</h3><span className="cmd-badge warn">7</span></header>
            <ul className="cmd-list">
              <li><strong>Bekleyen · V-204</strong><span>Ataşehir · 3 gün</span></li>
              <li><strong>Bekleyen · V-118</strong><span>Bandırma · 1 gün</span></li>
              <li><strong>Bekleyen · V-087</strong><span>Aliağa · 5 gün</span></li>
              <li><strong>Bekleyen · V-221</strong><span>Beşiktaş · 2 gün</span></li>
            </ul>
          </article>

          <article className="cmd-card">
            <header><h3>Bugün yakıt fişleri</h3></header>
            <ul className="cmd-list">
              <li><strong>V-204 · Shell Ataşehir</strong><span>2.450 ₺ · Mehmet Kaya</span></li>
              <li><strong>V-087 · Opet Aliağa</strong><span>3.120 ₺ · Can Özkan</span></li>
              <li><strong>V-133 · BP Kadıköy</strong><span>1.890 ₺ · Zeynep Arslan</span></li>
              <li><strong>V-198 · Total Maltepe</strong><span>2.180 ₺ · Serkan Aydın</span></li>
            </ul>
          </article>

          <article className="cmd-card">
            <header><h3>Bugün masraf fişleri</h3></header>
            <ul className="cmd-list">
              <li><strong>Hidrolik hortum</strong><span>V-155 · 1.250 ₺</span></li>
              <li><strong>Yağ değişimi</strong><span>V-210 · 980 ₺</span></li>
              <li><strong>Otoyol geçiş</strong><span>V-204 · 245 ₺</span></li>
              <li><strong>Otopark</strong><span>V-302 · 180 ₺</span></li>
            </ul>
          </article>

          <article className="cmd-card">
            <header><h3>Vinç hareket geçmişi</h3></header>
            <ul className="cmd-list">
              <li><strong>V-204 → Ataşehir</strong><span>07:40 · sahaya çıkış</span></li>
              <li><strong>V-118 → Bandırma</strong><span>06:55 · saha aktif</span></li>
              <li><strong>V-302 depo</strong><span>09:10 · müsait</span></li>
              <li><strong>V-155 bakım</strong><span>08:20 · merkeze giriş</span></li>
            </ul>
          </article>

          <article className="cmd-card">
            <header><h3>Operatör hareket geçmişi</h3></header>
            <ul className="cmd-list">
              <li><strong>Mehmet Kaya</strong><span>İşe geldim · 07:55 · onaylandı</span></li>
              <li><strong>Ali Demir</strong><span>Yoklama · 08:05 · Bandırma</span></li>
              <li><strong>Elif Yılmaz</strong><span>Havuzda · müsait</span></li>
              <li><strong>Can Özkan</strong><span>Mesai talebi · 3 saat · bekliyor</span></li>
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  foot,
  testId,
}: {
  icon: IconType;
  label: string;
  value: string;
  foot: ReactNode;
  testId: string;
}) {
  return (
    <article className="kpi-card" data-testid={`card-kpi-${testId}`}>
      <div className="kpi-top">
        <span>{label}</span>
        <span className="kpi-icon">
          <Icon size={16} strokeWidth={1.8} />
        </span>
      </div>
      <div className="kpi-value" data-testid={`value-kpi-${testId}`}>
        {value}
      </div>
      <div className="kpi-foot">{foot}</div>
    </article>
  );
}

function PanelHeader({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string;
  subtitle: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="panel-head">
      <div>
        <h2 className="panel-title">{title}</h2>
        <p className="panel-subtitle">{subtitle}</p>
      </div>
      <button
        className="panel-action"
        data-testid={`button-panel-${title.replaceAll(' ', '-').toLocaleLowerCase('tr-TR')}`}
        onClick={onAction}
        type="button"
      >
        {action}
        <ArrowUpRight size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
      </button>
    </div>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="legend-item">
      <span className="legend-name">
        <span className="legend-dot" style={{ background: color }} />
        {label}
      </span>
      <span className="legend-value">{value}</span>
    </div>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="dashboard-main">
      <section className="page-heading">
        <div>
          <div className="eyebrow">Yakında</div>
          <h1>{title}</h1>
          <p>Bu modül sıradaki fazlarda geliştirilecek.</p>
        </div>
      </section>
      <section className="panel" style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: 'hsl(var(--muted-foreground))' }}>
          {title} modülü FAZ planına göre sonraki adımlarda eklenecek.
        </p>
      </section>
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <AppLayout>
        <Switch>
          <Route path="/" component={DashboardHome} />
          <Route path="/personel" component={PersonelPage} />
          <Route path="/onay" component={OnayPage} />
          <Route path="/filo" component={FiloPage} />
          <Route path="/finans">{() => <ComingSoon title="Finans" />}</Route>
          <Route path="/tv">{() => <ComingSoon title="TV" />}</Route>
          <Route path="/admin">{() => <ComingSoon title="Admin" />}</Route>
          <Route path="/ayarlar">{() => <ComingSoon title="Ayarlar" />}</Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
