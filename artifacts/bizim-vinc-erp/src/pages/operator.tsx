import { useState, type CSSProperties } from 'react';
import {
  Banknote,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  HandCoins,
  UserRound,
} from 'lucide-react';

type ReqKind = 'yoklama' | 'mesai' | 'avans' | 'makbuz' | 'izin' | 'genel';

interface ReqItem {
  id: string;
  kind: ReqKind;
  title: string;
  detail: string;
  status: 'pending' | 'approved' | 'rejected';
  time: string;
}

const KIND_LABEL: Record<ReqKind, string> = {
  yoklama: 'Yoklama',
  mesai: 'Mesai',
  avans: 'Avans',
  makbuz: 'Makbuz',
  izin: 'İzin',
  genel: 'Talep',
};

const DEMO: ReqItem[] = [
  { id: '1', kind: 'yoklama', title: 'İşe geldim', detail: 'Saha: Ataşehir · V-204', status: 'approved', time: '07:55' },
  { id: '2', kind: 'mesai', title: 'Mesai bildirimi · 3 saat', detail: 'Yükleme gecikmesi', status: 'pending', time: '18:10' },
  { id: '3', kind: 'avans', title: 'Avans talebi · 5.000 ₺', detail: 'Acil ihtiyaç', status: 'pending', time: '12:40' },
];

export default function OperatorPage() {
  const [items, setItems] = useState<ReqItem[]>(DEMO);
  const [note, setNote] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(''), 2500);
  };

  const push = (kind: ReqKind, title: string, detail: string) => {
    const row: ReqItem = {
      id: String(Date.now()),
      kind,
      title,
      detail: detail || note || '—',
      status: 'pending',
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };
    setItems((prev) => [row, ...prev]);
    setNote('');
    showToast(`${KIND_LABEL[kind]} gönderildi`);
  };

  return (
    <div className="op-shell">
      <header className="op-head">
        <div className="op-avatar"><UserRound size={22} /></div>
        <div>
          <div className="op-name">Mehmet Kaya</div>
          <div className="op-meta">Operatör · V-204 · Ataşehir</div>
        </div>
      </header>

      <section className="op-actions">
        <button type="button" className="op-btn primary" onClick={() => push('yoklama', 'İşe geldim', 'Yoklama kaydı')}>
          <ClipboardCheck size={20} />
          <span>Yoklama</span>
        </button>
        <button type="button" className="op-btn" onClick={() => push('mesai', 'Mesai bildirimi', note || 'Fazla mesai')}>
          <Clock3 size={20} />
          <span>Mesai</span>
        </button>
        <button type="button" className="op-btn" onClick={() => push('avans', 'Avans talebi', note || 'Avans')}>
          <HandCoins size={20} />
          <span>Avans</span>
        </button>
        <button type="button" className="op-btn" onClick={() => push('makbuz', 'Makbuz üretimi talebi', note || 'Saha makbuzu')}>
          <FileText size={20} />
          <span>Makbuz</span>
        </button>
        <button type="button" className="op-btn" onClick={() => push('izin', 'İzin talebi', note || 'İzin')}>
          <Banknote size={20} />
          <span>İzin</span>
        </button>
        <button type="button" className="op-btn" onClick={() => push('genel', 'Genel talep', note || 'Yönetime mesaj')}>
          <CheckCircle2 size={20} />
          <span>Diğer</span>
        </button>
      </section>

      <label className="op-note">
        <span>Not (opsiyonel)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Örn. 3 saat mesai, sebep: beton dökümü gecikti"
          rows={2}
          style={taStyle}
        />
      </label>

      <section className="op-list-wrap">
        <h2>Gönderilenler</h2>
        <ul className="op-list">
          {items.map((it) => (
            <li key={it.id}>
              <div>
                <strong>{it.title}</strong>
                <span>{KIND_LABEL[it.kind]} · {it.detail}</span>
              </div>
              <div className="op-right">
                <span className={`op-status ${it.status}`}>{it.status === 'pending' ? 'Bekliyor' : it.status === 'approved' ? 'Onay' : 'Red'}</span>
                <span className="op-time">{it.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

const taStyle: CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: 10,
  borderRadius: 10,
  border: '1px solid #DCFCE7',
  fontFamily: 'inherit',
  fontSize: 14,
  resize: 'vertical',
};
