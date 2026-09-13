import { useMemo, useState, type CSSProperties } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  CircleAlert,
  Clock,
  FileText,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import {
  APPROVALS_DEMO,
  kindLabel,
  statusLabel,
  type ApprovalKind,
  type ApprovalRequest,
  type ApprovalStatus,
} from '@/data/approvals';

type StatusFilter = 'all' | ApprovalStatus;
type KindFilter = 'all' | ApprovalKind;

export default function OnayPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [items, setItems] = useState<ApprovalRequest[]>(APPROVALS_DEMO);
  const [selected, setSelected] = useState<ApprovalRequest | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return items.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (kindFilter !== 'all' && a.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        a.title.toLocaleLowerCase('tr-TR').includes(q) ||
        a.personName.toLocaleLowerCase('tr-TR').includes(q) ||
        (a.relatedLabel ?? '').toLocaleLowerCase('tr-TR').includes(q) ||
        kindLabel[a.kind].toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [items, search, statusFilter, kindFilter]);

  const counts = useMemo(() => {
    const pending = items.filter((a) => a.status === 'pending').length;
    const approved = items.filter((a) => a.status === 'approved').length;
    const rejected = items.filter((a) => a.status === 'rejected').length;
    return { pending, approved, rejected, total: items.length };
  }, [items]);

  const decide = (id: string, status: 'approved' | 'rejected', note?: string) => {
    setItems((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              decidedAt: new Date().toISOString(),
              decisionNote: note ?? (status === 'approved' ? 'Onaylandı' : 'Reddedildi'),
            }
          : a
      )
    );
    setSelected(null);
    showToast(status === 'approved' ? 'Talep onaylandı.' : 'Talep reddedildi.');
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('tr-TR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="dashboard-main">
      <section className="page-heading">
        <div>
          <div className="eyebrow">Operasyon · Demo verisi</div>
          <h1>Onay Merkezi</h1>
          <p>Yoklama, mesai, izin, makbuz ve masraf talepleri</p>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Onay özeti" style={{ marginBottom: 22 }}>
        <article className="kpi-card" data-testid="card-kpi-pending">
          <div className="kpi-top">
            <span>Bekleyen</span>
            <span className="kpi-icon"><Clock size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.pending}</div>
          <div className="kpi-foot">
            <span className={counts.pending > 0 ? 'trend warn' : 'trend'}>
              {counts.pending > 0 ? 'aksiyon gerekli' : 'temiz'}
            </span>
          </div>
        </article>
        <article className="kpi-card" data-testid="card-kpi-approved">
          <div className="kpi-top">
            <span>Onaylanan</span>
            <span className="kpi-icon"><CheckCircle2 size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.approved}</div>
          <div className="kpi-foot"><span className="trend">bu listede</span></div>
        </article>
        <article className="kpi-card" data-testid="card-kpi-rejected">
          <div className="kpi-top">
            <span>Reddedilen</span>
            <span className="kpi-icon"><XCircle size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.rejected}</div>
          <div className="kpi-foot"><span className="trend">bu listede</span></div>
        </article>
        <article className="kpi-card" data-testid="card-kpi-total-approvals">
          <div className="kpi-top">
            <span>Toplam kayıt</span>
            <span className="kpi-icon"><FileText size={16} strokeWidth={1.8} /></span>
          </div>
          <div className="kpi-value">{counts.total}</div>
          <div className="kpi-foot"><span className="trend">demo</span></div>
        </article>
      </section>

      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-head" style={{ paddingBottom: 12 }}>
          <div>
            <h2 className="panel-title">Talepler</h2>
            <p className="panel-subtitle">{filtered.length} kayıt gösteriliyor</p>
          </div>
        </div>

        <div style={{ padding: '0 20px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--muted-foreground))',
              }}
            />
            <input
              type="search"
              placeholder="Başlık, kişi veya referans ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-approvals"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            data-testid="select-status-filter"
            style={selectStyle}
          >
            <option value="all">Tüm durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="approved">Onaylandı</option>
            <option value="rejected">Reddedildi</option>
          </select>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as KindFilter)}
            data-testid="select-kind-filter"
            style={selectStyle}
          >
            <option value="all">Tüm türler</option>
            {(Object.keys(kindLabel) as ApprovalKind[]).map((k) => (
              <option key={k} value={k}>
                {kindLabel[k]}
              </option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="assignment-table" data-testid="table-approvals">
            <thead>
              <tr>
                <th>Talep</th>
                <th>Kişi</th>
                <th>Tür</th>
                <th>Durum</th>
                <th>Zaman</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'hsl(var(--muted-foreground))' }}>
                    Kriterlere uygun talep bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    data-testid={`row-approval-${a.id}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(a)}
                  >
                    <td>
                      <div>
                        <strong style={{ display: 'block' }}>{a.title}</strong>
                        {a.relatedLabel && (
                          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>
                            {a.relatedLabel}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="operator">
                        <span className="mini-avatar">{a.personInitials}</span>
                        {a.personName}
                      </div>
                    </td>
                    <td>{kindLabel[a.kind]}</td>
                    <td>
                      <span className={`status-pill ${statusClass(a.status)}`}>
                        {statusLabel[a.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      {formatTime(a.createdAt)}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label="Detay"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(a);
                        }}
                      >
                        <BadgeCheck size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Onay detayı"
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
            style={{ width: 'min(100%, 440px)', margin: 0, animation: 'rise-in .25s ease both' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="panel-head" style={{ alignItems: 'flex-start' }}>
              <div>
                <h2 className="panel-title">{selected.title}</h2>
                <p className="panel-subtitle">
                  {kindLabel[selected.kind]} · {statusLabel[selected.status]}
                </p>
              </div>
              <button className="icon-button" type="button" onClick={() => setSelected(null)} aria-label="Kapat">
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mini-avatar" style={{ width: 40, height: 40, fontSize: 14 }}>
                  {selected.personInitials}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>{selected.personName}</div>
                  {selected.relatedLabel && (
                    <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                      {selected.relatedLabel}
                    </div>
                  )}
                </div>
              </div>

              {selected.note && (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    background: 'hsl(var(--muted))',
                    fontSize: 13,
                  }}
                >
                  {selected.note}
                </div>
              )}

              <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
                Oluşturulma: {formatTime(selected.createdAt)}
                {selected.decidedAt && (
                  <>
                    <br />
                    Karar: {formatTime(selected.decidedAt)}
                    {selected.decisionNote ? ` · ${selected.decisionNote}` : ''}
                  </>
                )}
              </div>

              {selected.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button
                    className="date-control"
                    type="button"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: 'hsl(var(--primary))',
                      color: 'hsl(var(--primary-foreground))',
                      borderColor: 'transparent',
                    }}
                    data-testid="button-approve"
                    onClick={() => decide(selected.id, 'approved')}
                  >
                    <CheckCircle2 size={15} style={{ marginRight: 6 }} />
                    Onayla
                  </button>
                  <button
                    className="date-control"
                    type="button"
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      background: 'hsl(var(--destructive) / 0.12)',
                      color: 'hsl(var(--destructive))',
                      borderColor: 'hsl(var(--destructive) / 0.3)',
                    }}
                    data-testid="button-reject"
                    onClick={() => decide(selected.id, 'rejected')}
                  >
                    <XCircle size={15} style={{ marginRight: 6 }} />
                    Reddet
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 12,
                    borderRadius: 10,
                    background:
                      selected.status === 'approved'
                        ? 'hsl(var(--primary) / 0.1)'
                        : 'hsl(var(--destructive) / 0.1)',
                    color:
                      selected.status === 'approved'
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--destructive))',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {selected.status === 'approved' ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <CircleAlert size={16} />
                  )}
                  {statusLabel[selected.status]}
                  {selected.decisionNote ? ` — ${selected.decisionNote}` : ''}
                </div>
              )}
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

function statusClass(s: ApprovalStatus) {
  if (s === 'approved') return 'status-active';
  if (s === 'pending') return 'status-pending';
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
