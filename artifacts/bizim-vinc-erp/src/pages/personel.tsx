import { useMemo, useState, type CSSProperties } from 'react';
import {
  BadgeCheck,
  CreditCard,
  FileWarning,
  Plus,
  Search,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import {
  PERSONNEL_DEMO,
  kindLabel,
  statusLabel,
  poolLabel,
  type Personnel,
  type PersonnelKind,
  type EmploymentStatus,
} from '@/data/personnel';

type KindFilter = 'all' | PersonnelKind;
type StatusFilter = 'all' | EmploymentStatus;

export default function PersonelPage() {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Personnel | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return PERSONNEL_DEMO.filter((p) => {
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.fullName.toLocaleLowerCase('tr-TR').includes(q) ||
        p.employeeNo.toLocaleLowerCase('tr-TR').includes(q) ||
        (p.phone ?? '').includes(q) ||
        (p.title ?? '').toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [search, kindFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = PERSONNEL_DEMO.length;
    const aktif = PERSONNEL_DEMO.filter((p) => p.status === 'aktif').length;
    const gorevli = PERSONNEL_DEMO.filter((p) => p.poolStatus === 'gorevli').length;
    const eksikEvrak = PERSONNEL_DEMO.filter((p) => !p.documentsOk).length;
    return { total, aktif, gorevli, eksikEvrak };
  }, []);

  return (
    <div className="dashboard-main">
      <section className="page-heading">
        <div>
          <div className="eyebrow">Personel yönetimi · Demo verisi</div>
          <h1>Personel</h1>
          <p>Operatör, yardımcı ve idari kadro listesi · Dijital kartlar</p>
        </div>
        <button
          className="date-control"
          type="button"
          onClick={() => showToast('Yeni personel formu yakında eklenecek.')}
          data-testid="button-add-personnel"
        >
          <Plus size={16} strokeWidth={1.8} />
          Yeni personel
        </button>
      </section>

      {/* KPI strip */}
      <section className="kpi-grid" aria-label="Personel özeti" style={{ marginBottom: 22 }}>
        <article className="kpi-card" data-testid="card-kpi-total">
          <div className="kpi-top">
            <span>Toplam personel</span>
            <span className="kpi-icon"><UsersRound size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.total}</div>
          <div className="kpi-foot"><span className="trend">{counts.aktif} aktif</span></div>
        </article>
        <article className="kpi-card" data-testid="card-kpi-gorevli">
          <div className="kpi-top">
            <span>Şu an görevli</span>
            <span className="kpi-icon"><UserRound size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.gorevli}</div>
          <div className="kpi-foot"><span className="trend">sahada / atamada</span></div>
        </article>
        <article className="kpi-card" data-testid="card-kpi-evrak">
          <div className="kpi-top">
            <span>Eksik evrak</span>
            <span className="kpi-icon"><FileWarning size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.eksikEvrak}</div>
          <div className="kpi-foot">
            <span className={counts.eksikEvrak > 0 ? 'trend warn' : 'trend'}>
              {counts.eksikEvrak > 0 ? 'aksiyon gerekli' : 'hepsi tamam'}
            </span>
          </div>
        </article>
        <article className="kpi-card" data-testid="card-kpi-kart">
          <div className="kpi-top">
            <span>Dijital kart</span>
            <span className="kpi-icon"><CreditCard size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{PERSONNEL_DEMO.filter((p) => p.cardSlug).length}</div>
          <div className="kpi-foot"><span className="trend">yayında</span></div>
        </article>
      </section>

      {/* Filters */}
      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head" style={{ paddingBottom: 12 }}>
          <div>
            <h2 className="panel-title">Liste</h2>
            <p className="panel-subtitle">{filtered.length} kayıt gösteriliyor</p>
          </div>
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="search"
              placeholder="İsim, sicil no veya telefon ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-personnel"
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: 9,
                border: '1px solid hsl(var(--border))',
                background: 'hsl(var(--card))',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as KindFilter)}
            data-testid="select-kind-filter"
            style={selectStyle}
          >
            <option value="all">Tüm türler</option>
            <option value="operator">Operatör</option>
            <option value="yardimci">Yardımcı</option>
            <option value="idari">İdari</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            data-testid="select-status-filter"
            style={selectStyle}
          >
            <option value="all">Tüm durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="izinli">İzinli</option>
            <option value="pasif">Pasif</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="assignment-table" data-testid="table-personnel">
            <thead>
              <tr>
                <th>Personel</th>
                <th>Sicil</th>
                <th>Tür</th>
                <th>Durum</th>
                <th>Havuz</th>
                <th>Evrak</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'hsl(var(--muted-foreground))' }}>
                    Arama kriterlerine uygun personel bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    data-testid={`row-personnel-${p.id}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(p)}
                  >
                    <td>
                      <div className="operator">
                        <span className="mini-avatar">{p.initials}</span>
                        <div>
                          <strong style={{ display: 'block' }}>{p.fullName}</strong>
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{p.title}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="crane-number">{p.employeeNo}</span>
                    </td>
                    <td>{kindLabel[p.kind]}</td>
                    <td>
                      <span className={`status-pill ${statusClass(p.status)}`}>
                        {statusLabel[p.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${poolClass(p.poolStatus)}`}>
                        {poolLabel[p.poolStatus]}
                      </span>
                    </td>
                    <td>
                      {p.documentsOk ? (
                        <span className="status-pill status-active" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <BadgeCheck size={12} /> Tamam
                        </span>
                      ) : (
                        <span className="status-pill status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FileWarning size={12} /> Eksik
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`${p.fullName} detay`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(p);
                        }}
                      >
                        <CreditCard size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Digital card drawer / modal */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Personel detay ve dijital kart"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'hsl(163 27% 10% / 0.45)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            className="panel"
            style={{ width: 'min(100%, 420px)', margin: 0, animation: 'rise-in .25s ease both' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-head" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 className="panel-title">Dijital kart</h2>
                <p className="panel-subtitle">{selected.employeeNo}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Kapat">
                <X size={16} />
              </button>
            </div>

            {/* Card visual */}
            <div
              style={{
                margin: '0 20px 18px',
                borderRadius: 16,
                padding: 22,
                background: 'linear-gradient(145deg, hsl(157 39% 25%), hsl(157 45% 18%))',
                color: 'hsl(45 33% 97%)',
                boxShadow: '0 12px 32px hsl(157 39% 20% / 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'hsl(147 41% 48% / 0.25)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'hsl(0 0% 100% / 0.15)',
                    display: 'grid',
                    placeItems: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {selected.initials}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{selected.fullName}</div>
                  <div style={{ fontSize: 12, opacity: 0.85 }}>{selected.title}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
                <div>
                  <div style={{ opacity: 0.7, marginBottom: 2 }}>Sicil</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selected.employeeNo}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.7, marginBottom: 2 }}>Tür</div>
                  <div style={{ fontWeight: 600 }}>{kindLabel[selected.kind]}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.7, marginBottom: 2 }}>Durum</div>
                  <div style={{ fontWeight: 600 }}>{statusLabel[selected.status]}</div>
                </div>
                <div>
                  <div style={{ opacity: 0.7, marginBottom: 2 }}>Havuz</div>
                  <div style={{ fontWeight: 600 }}>{poolLabel[selected.poolStatus]}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, fontSize: 11, opacity: 0.75 }}>
                Bizim Vinç · En derinden, en yükseklere
              </div>
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selected.phone && (
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: 'hsl(var(--muted-foreground))' }}>Telefon: </span>
                  {selected.phone}
                </div>
              )}
              <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                Evrak durumu:{' '}
                {selected.documentsOk ? (
                  <span className="status-pill status-active"><BadgeCheck size={12} style={{ marginRight: 4 }} />Tamam</span>
                ) : (
                  <span className="status-pill status-pending"><FileWarning size={12} style={{ marginRight: 4 }} />Eksik</span>
                )}
              </div>
              {selected.certExpiring && (
                <div style={{ fontSize: 12, color: 'hsl(var(--accent))' }}>
                  ⚠ Bazı belgeler yakında sona eriyor
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  className="date-control"
                  type="button"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => showToast('Kart linki kopyalandı (demo).')}
                >
                  Kart linkini kopyala
                </button>
                <button
                  className="date-control"
                  type="button"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => showToast('Düzenleme formu yakında eklenecek.')}
                >
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" data-testid="status-toast">
          <BadgeCheck size={16} />
          {toast}
        </div>
      )}
    </div>
  );
}

function statusClass(s: EmploymentStatus) {
  if (s === 'aktif') return 'status-active';
  if (s === 'izinli') return 'status-pending';
  return 'status-pending';
}

function poolClass(s: string) {
  if (s === 'gorevli') return 'status-active';
  if (s === 'havuzda') return 'status-pending';
  return 'status-pending';
}

const selectStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 9,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  fontSize: 13,
  fontFamily: 'inherit',
  cursor: 'pointer',
  minWidth: 130,
};
