import { useState } from 'react';
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
import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type IconType = typeof LayoutDashboard;

const navItems: { label: string; icon: IconType; active?: boolean }[] = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Personel', icon: UsersRound },
  { label: 'Onay', icon: BadgeCheck },
  { label: 'Filo', icon: Truck },
  { label: 'Finans', icon: CircleDollarSign },
  { label: 'TV', icon: MonitorPlay },
  { label: 'Admin', icon: UserCog },
  { label: 'Ayarlar', icon: Settings2 },
];

const activities = [
  { icon: ClipboardCheck, title: 'Saha görevlendirmesi onaylandı', detail: 'Mehmet Kaya · Vinç V-204', time: '08:42' },
  { icon: UserRound, title: 'Yeni personel girişi yapıldı', detail: 'Zeynep Arslan · Operatör', time: '08:17' },
  { icon: Wrench, title: 'Bakım kaydı tamamlandı', detail: 'Vinç V-118 · Periyodik bakım', time: '07:56' },
  { icon: ShieldCheck, title: 'İSG belgesi yenilendi', detail: 'Ali Demir · 31.12.2025 tarihine kadar', time: '07:31' },
];

const approvals = [
  { icon: FileText, title: 'Fazla mesai talebi', person: 'Mehmet Kaya · 3 saat', status: 'Bekliyor', statusClass: 'status-pending' },
  { icon: Truck, title: 'Filo bakım talebi', person: 'Vinç V-302 · Hidrolik kontrol', status: 'Bekliyor', statusClass: 'status-pending' },
  { icon: CircleAlert, title: 'Eksik evrak bildirimi', person: 'Burak Şen · SRC belgesi', status: 'İnceleniyor', statusClass: 'status-active' },
];

const assignments = [
  { id: 'V-204', type: 'Mobil Vinç', operator: 'Mehmet Kaya', initials: 'MK', customer: 'Yapı Kredi Genel Müdürlük', site: 'Ataşehir, İstanbul', status: 'Sahada', statusClass: 'status-active' },
  { id: 'V-118', type: 'Teleskopik Vinç', operator: 'Ali Demir', initials: 'AD', customer: 'Marmara Rüzgar Enerji', site: 'Bandırma, Balıkesir', status: 'Sahada', statusClass: 'status-active' },
  { id: 'V-302', type: 'Sepetli Platform', operator: 'Elif Yılmaz', initials: 'EY', customer: 'Kuzey Yapı Proje', site: 'Çekmeköy, İstanbul', status: 'Yola çıkıyor', statusClass: 'status-pending' },
  { id: 'V-087', type: 'Mobil Vinç', operator: 'Can Özkan', initials: 'CÖ', customer: 'Ege Liman İşletmeleri', site: 'Aliağa, İzmir', status: 'Sahada', statusClass: 'status-active' },
];

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  };

  const handleNav = (label: string) => {
    if (label !== 'Dashboard') {
      showToast(`${label} modülü yakında kullanıma açılacak.`);
      setMenuOpen(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-mark" aria-label="Bizim Vinç logosu">
            <BuildingMark />
          </div>
          <div>
            <div className="brand-name">Bizim Vinç</div>
            <div className="brand-tagline">En derinden, en yükseklere</div>
          </div>

          <nav className={`nav-scroll${menuOpen ? ' open' : ''}`} aria-label="Ana menü">
            {navItems.map(({ label, icon: Icon, active }) => (
              <button
                className={`nav-link${active ? ' active' : ''}`}
                data-testid={`button-nav-${label.toLocaleLowerCase('tr-TR')}`}
                key={label}
                onClick={() => handleNav(label)}
                type="button"
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </button>
            ))}
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
              <span className="user-label"><strong>Esra Y.</strong><span>Operasyon yöneticisi</span></span>
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="page-heading">
          <div>
            <div className="eyebrow">Operasyon merkezi · Demo verisi</div>
            <h1>Günaydın, Bizim Vinç.</h1>
            <p>Yakında...</p>
          </div>
          <button className="date-control" data-testid="button-date-selector" onClick={() => showToast('Takvim görünümü yakında eklenecek.')} type="button">
            <CalendarDays size={16} strokeWidth={1.8} />
            Salı, 14 Mayıs 2024
          </button>
        </section>

        <section className="kpi-grid" aria-label="Günlük özet">
          <KpiCard icon={UsersRound} label="Toplam personel" value="48" foot={<><span className="trend">+2</span> bu ay</>} testId="personel" />
          <KpiCard icon={Activity} label="Şu an çalışan" value="31" foot={<><span className="trend">%64,5</span> aktiflik</>} testId="calisan" />
          <KpiCard icon={Truck} label="Aktif vinç" value="24" foot={<><span className="trend">19 sahada</span> bugün</>} testId="vinc" />
          <KpiCard icon={ClipboardCheck} label="Bekleyen onay" value="07" foot={<><span className="trend warn">3 acil</span> işlem var</>} testId="onay" />
        </section>

        <div className="content-grid">
          <section className="panel" data-testid="panel-recent-activity">
            <PanelHeader title="Son hareketler" subtitle="Operasyon ekibinin son güncellemeleri" action="Tümünü gör" onAction={() => showToast('Son hareketlerin tamamı yakında listelenecek.')} />
            <div className="activity-list">
              {activities.map(({ icon: Icon, title, detail, time }, index) => (
                <div className="activity-item" data-testid={`activity-item-${index}`} key={title}>
                  <div className="activity-icon"><Icon size={15} strokeWidth={1.8} /></div>
                  <div><strong>{title}</strong><p>{detail}</p></div>
                  <span className="activity-time">{time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel" data-testid="panel-approvals">
            <PanelHeader title="Bekleyen onaylar" subtitle="İşlem bekleyen talepler" action="Onay merkezine git" onAction={() => showToast('Onay modülü yakında kullanıma açılacak.')} />
            <div className="approval-list">
              {approvals.map(({ icon: Icon, title, person, status, statusClass }, index) => (
                <button className="approval-item" data-testid={`button-approval-${index}`} key={title} onClick={() => showToast(`${title} detayları açılacak.`)} type="button">
                  <div className="approval-kind"><Icon size={16} strokeWidth={1.8} /></div>
                  <div className="approval-info"><strong>{title}</strong><span>{person}</span></div>
                  <span className={`status-pill ${statusClass}`}>{status}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="panel wide-panel" data-testid="panel-assignments">
          <PanelHeader title="Aktif saha görevlendirmeleri" subtitle="Bugün sahada olan ekipler ve ekipmanlar" action="Planlama görünümü" onAction={() => showToast('Planlama görünümü yakında açılacak.')} />
          <table className="assignment-table">
            <thead><tr><th>Vinç</th><th>Operatör</th><th>Müşteri / saha</th><th>Durum</th><th /></tr></thead>
            <tbody>
              {assignments.map((assignment) => (
                <tr data-testid={`row-assignment-${assignment.id}`} key={assignment.id}>
                  <td><div className="crane-cell"><span className="crane-number">{assignment.id}</span><span><span className="crane-name">{assignment.id}</span><span className="crane-type">{assignment.type}</span></span></div></td>
                  <td><div className="operator"><span className="mini-avatar">{assignment.initials}</span>{assignment.operator}</div></td>
                  <td><div className="site-cell"><strong>{assignment.customer}</strong><span>{assignment.site}</span></div></td>
                  <td><span className={`status-pill ${assignment.statusClass}`}>{assignment.status}</span></td>
                  <td><button aria-label={`${assignment.id} detayını aç`} className="icon-button" data-testid={`button-assignment-detail-${assignment.id}`} onClick={() => showToast(`${assignment.id} görevlendirme detayı açılacak.`)} type="button"><ChevronRight size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="bottom-grid">
          <section className="panel" data-testid="panel-fleet">
            <PanelHeader title="Filo durumu" subtitle="24 aktif vinç · Anlık görünüm" action="Filo detayları" onAction={() => showToast('Filo modülü yakında kullanıma açılacak.')} />
            <div className="fleet-body">
              <div className="fleet-ring" aria-label="Filo toplamı 24"><div className="fleet-total"><strong>24</strong><span>toplam vinç</span></div></div>
              <div className="legend">
                <LegendItem color="hsl(157 47% 36%)" label="Sahada" value="19" />
                <LegendItem color="hsl(36 77% 56%)" label="Bakımda" value="3" />
                <LegendItem color="hsl(4 68% 50%)" label="Arızalı" value="1" />
                <LegendItem color="hsl(163 11% 77%)" label="Müsait" value="1" />
              </div>
            </div>
          </section>

          <section className="panel" data-testid="panel-attendance">
            <PanelHeader title="Bugünün devam durumu" subtitle="Vardiya başlangıcı · 08:00" action="Personel listesi" onAction={() => showToast('Personel modülü yakında kullanıma açılacak.')} />
            <div className="attendance-body">
              <div className="attendance-main"><div className="attendance-rate">86<span>% katılım</span></div><div className="attendance-copy">41 kişi zamanında<br />vardiya başlangıcı yaptı</div></div>
              <div className="progress-track"><div className="progress-fill" /></div>
              <div className="attendance-stats"><div className="attendance-stat"><strong>41</strong><span>Geldi</span></div><div className="attendance-stat"><strong>4</strong><span>İzinli</span></div><div className="attendance-stat"><strong>3</strong><span>Eksik</span></div></div>
            </div>
          </section>
        </div>
      </main>
      {toast && <div className="toast" data-testid="status-toast"><CheckCircle2 size={16} />{toast}</div>}
    </div>
  );
}

function BuildingMark() {
  return <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22"><path d="M5 20V7.5L12 4l7 3.5V20M8.5 20v-3.5h7V20M9 9h.01M15 9h.01M9 12h.01M15 12h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M3 20h18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></svg>;
}

function KpiCard({ icon: Icon, label, value, foot, testId }: { icon: IconType; label: string; value: string; foot: ReactNode; testId: string }) {
  return <article className="kpi-card" data-testid={`card-kpi-${testId}`}><div className="kpi-top"><span>{label}</span><span className="kpi-icon"><Icon size={16} strokeWidth={1.8} /></span></div><div className="kpi-value" data-testid={`value-kpi-${testId}`}>{value}</div><div className="kpi-foot">{foot}</div></article>;
}

function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction: () => void }) {
  return <div className="panel-head"><div><h2 className="panel-title">{title}</h2><p className="panel-subtitle">{subtitle}</p></div><button className="panel-action" data-testid={`button-panel-${title.replaceAll(' ', '-').toLocaleLowerCase('tr-TR')}`} onClick={onAction} type="button">{action}<ArrowUpRight size={13} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></button></div>;
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return <div className="legend-item"><span className="legend-name"><span className="legend-dot" style={{ background: color }} />{label}</span><span className="legend-value">{value}</span></div>;
}

function Router() {
  return <RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route component={NotFound} /></Switch></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
