import { useMemo, useState, type CSSProperties } from 'react';
import { Search, Truck, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';

type CraneStatus = 'sahada' | 'musait' | 'bakimda' | 'arizali';

interface Crane {
  id: string;
  code: string;
  type: string;
  status: CraneStatus;
  capacity: string;
  operator?: string;
  site?: string;
  lastService: string;
}

const STATUS_LABEL: Record<CraneStatus, string> = {
  sahada: 'Sahada',
  musait: 'Müsait',
  bakimda: 'Bakımda',
  arizali: 'Arızalı',
};

const FLEET: Crane[] = [
  { id: '1', code: 'V-204', type: 'Mobil Vinç', status: 'sahada', capacity: '50 ton', operator: 'Mehmet Kaya', site: 'Ataşehir', lastService: '2026-08-12' },
  { id: '2', code: 'V-118', type: 'Teleskopik', status: 'sahada', capacity: '80 ton', operator: 'Ali Demir', site: 'Bandırma', lastService: '2026-07-28' },
  { id: '3', code: 'V-302', type: 'Sepetli', status: 'musait', capacity: '22 m', operator: 'Elif Yılmaz', site: 'Çekmeköy', lastService: '2026-09-01' },
  { id: '4', code: 'V-087', type: 'Mobil Vinç', status: 'sahada', capacity: '40 ton', operator: 'Can Özkan', site: 'Aliağa', lastService: '2026-08-20' },
  { id: '5', code: 'V-155', type: 'Mobil Vinç', status: 'bakimda', capacity: '60 ton', site: 'Merkez depo', lastService: '2026-09-10' },
  { id: '6', code: 'V-210', type: 'Teleskopik', status: 'arizali', capacity: '100 ton', site: 'Kartal', lastService: '2026-06-15' },
  { id: '7', code: 'V-221', type: 'Mobil Vinç', status: 'sahada', capacity: '45 ton', operator: 'Burak Şen', site: 'Beşiktaş', lastService: '2026-08-05' },
  { id: '8', code: 'V-133', type: 'Sepetli', status: 'sahada', capacity: '18 m', operator: 'Zeynep Arslan', site: 'Kadıköy', lastService: '2026-07-22' },
  { id: '9', code: 'V-176', type: 'Teleskopik', status: 'musait', capacity: '70 ton', operator: 'Hakan Çelik', site: 'Başakşehir', lastService: '2026-09-05' },
  { id: '10', code: 'V-198', type: 'Mobil Vinç', status: 'sahada', capacity: '55 ton', operator: 'Serkan Aydın', site: 'Maltepe', lastService: '2026-08-30' },
];

export default function FiloPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CraneStatus>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr-TR');
    return FLEET.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!q) return true;
      return (
        c.code.toLocaleLowerCase('tr-TR').includes(q) ||
        c.type.toLocaleLowerCase('tr-TR').includes(q) ||
        (c.operator ?? '').toLocaleLowerCase('tr-TR').includes(q) ||
        (c.site ?? '').toLocaleLowerCase('tr-TR').includes(q)
      );
    });
  }, [search, status]);

  const counts = useMemo(() => ({
    total: FLEET.length,
    sahada: FLEET.filter((c) => c.status === 'sahada').length,
    musait: FLEET.filter((c) => c.status === 'musait').length,
    bakimda: FLEET.filter((c) => c.status === 'bakimda').length,
    arizali: FLEET.filter((c) => c.status === 'arizali').length,
  }), []);

  return (
    <div className="dashboard-main">
      <section className="page-heading">
        <div>
          <div className="eyebrow">Filo yönetimi · Demo</div>
          <h1>Filo</h1>
          <p>Vinç envanteri · durum · saha ataması</p>
        </div>
      </section>

      <section className="kpi-grid" style={{ marginBottom: 22 }}>
        <article className="kpi-card">
          <div className="kpi-top"><span>Toplam</span><span className="kpi-icon"><Truck size={16} /></span></div>
          <div className="kpi-value">{counts.total}</div>
          <div className="kpi-foot"><span className="trend">kayıtlı vinç</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span>Sahada</span><span className="kpi-icon"><CheckCircle2 size={16} /></span></div>
          <div className="kpi-value">{counts.sahada}</div>
          <div className="kpi-foot"><span className="trend">aktif görev</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span>Bakımda</span><span className="kpi-icon"><Wrench size={16} /></span></div>
          <div className="kpi-value">{counts.bakimda}</div>
          <div className="kpi-foot"><span className="trend warn">planlı</span></div>
        </article>
        <article className="kpi-card">
          <div className="kpi-top"><span>Arızalı</span><span className="kpi-icon"><AlertTriangle size={16} /></span></div>
          <div className="kpi-value">{counts.arizali}</div>
          <div className="kpi-foot"><span className="trend warn">aksiyon</span></div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head" style={{ paddingBottom: 12 }}>
          <div>
            <h2 className="panel-title">Envanter</h2>
            <p className="panel-subtitle">{filtered.length} kayıt</p>
          </div>
        </div>
        <div style={{ padding: '0 20px 18px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-foreground))' }} />
            <input
              type="search"
              placeholder="Kod, tip, operatör, saha…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={selectStyle}>
            <option value="all">Tüm durumlar</option>
            <option value="sahada">Sahada</option>
            <option value="musait">Müsait</option>
            <option value="bakimda">Bakımda</option>
            <option value="arizali">Arızalı</option>
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="assignment-table">
            <thead>
              <tr>
                <th>Vinç</th>
                <th>Tip</th>
                <th>Kapasite</th>
                <th>Durum</th>
                <th>Operatör</th>
                <th>Saha</th>
                <th>Son bakım</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="crane-cell">
                      <span className="crane-number">{c.code.replace('V-', '')}</span>
                      <strong>{c.code}</strong>
                    </div>
                  </td>
                  <td>{c.type}</td>
                  <td>{c.capacity}</td>
                  <td>
                    <span className={`status-pill ${c.status === 'sahada' || c.status === 'musait' ? 'status-active' : 'status-pending'}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td>{c.operator ?? '—'}</td>
                  <td>{c.site ?? '—'}</td>
                  <td style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>{c.lastService}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px 10px 36px',
  borderRadius: 9,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

const selectStyle: CSSProperties = {
  padding: '10px 12px',
  borderRadius: 9,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--card))',
  fontSize: 13,
  fontFamily: 'inherit',
  minWidth: 140,
};
