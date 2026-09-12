import { useMemo } from 'react';
import { useRoute } from 'wouter';
import {
  PERSONNEL_DEMO,
  kindLabel,
  statusLabel,
  type Personnel,
} from '@/data/personnel';

/** Kurumsal dijital kart — firmalara gönderilen paylaşılan link */
export default function DigitalCardPage() {
  const [, params] = useRoute('/kart/:token');
  const token = params?.token ?? '';

  const person = useMemo(() => {
    const t = token.toLocaleLowerCase('tr-TR');
    return (
      PERSONNEL_DEMO.find(
        (p) =>
          p.employeeNo.toLocaleLowerCase('tr-TR') === t ||
          p.id === token ||
          p.fullName.toLocaleLowerCase('tr-TR').replace(/\s+/g, '-') === t
      ) ?? PERSONNEL_DEMO[0]
    );
  }, [token]);

  if (!person) {
    return (
      <div className="card-public-shell">
        <p>Kart bulunamadı.</p>
      </div>
    );
  }

  return <CorporateCard person={person} token={token || person.employeeNo} />;
}

function CorporateCard({ person, token }: { person: Personnel; token: string }) {
  const docs = [
    { key: 'myk', label: 'MYK Mesleki Yeterlilik', status: person.documentsOk ? 'Geçerli' : 'Eksik' },
    { key: 'isg', label: 'İSG Eğitimi', status: person.documentsOk ? 'Geçerli' : 'Eksik' },
    { key: 'adli', label: 'Adli Sicil Kaydı', status: 'Geçerli' },
    { key: 'ehliyet', label: 'Ehliyet', status: 'Geçerli' },
    { key: 'src', label: 'SRC Belgesi', status: person.kind === 'operator' ? 'Geçerli' : '—' },
  ];

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${import.meta.env.BASE_URL}kart/${person.employeeNo}`.replace(/\/+/g, '/').replace(':/', '://')
      : `/kart/${person.employeeNo}`;

  return (
    <div className="card-public-shell">
      <article className="card-public">
        <header className="card-public-head">
          <div className="card-public-logo" aria-hidden>
            <svg viewBox="0 0 64 64" width="48" height="48" fill="none">
              <path d="M32 56c8 0 14-2 14-2s-2-6-6-10c-2-2-4-3-8-3s-6 1-8 3c-4 4-6 10-6 10s6 2 14 2z" fill="#22C55E" />
              <path d="M30 48V18M30 18h18M48 18v4M30 28h12" stroke="#16A34A" strokeWidth="2.6" strokeLinecap="round" />
              <path d="M26 48h8M28 18l-4 6h12" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="48" cy="24" r="2.4" fill="#16A34A" />
            </svg>
          </div>
          <div>
            <div className="card-public-brand">BİZİM VİNÇ</div>
            <div className="card-public-tag">En derinden, en yükseklere</div>
          </div>
        </header>

        <div className="card-public-body">
          <div className="card-public-avatar">{initials(person.fullName)}</div>
          <h1>{person.fullName}</h1>
          <p className="card-public-title">{person.title || kindLabel(person.kind)}</p>
          <p className="card-public-meta">
            Sicil: <strong>{person.employeeNo}</strong> · {statusLabel(person.status)}
          </p>
          {person.phone && (
            <p className="card-public-phone">
              <a href={`tel:${person.phone.replace(/\s/g, '')}`}>{person.phone}</a>
            </p>
          )}
        </div>

        <section className="card-public-docs">
          <h2>Belgeler</h2>
          <ul>
            {docs.map((d) => (
              <li key={d.key}>
                <span>{d.label}</span>
                <span className={d.status === 'Geçerli' ? 'ok' : d.status === '—' ? 'muted' : 'warn'}>
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
          <p className="card-public-note">
            Bu kart kurumsal doğrulama içindir. Orijinal belgeler talep üzerine iletilir.
          </p>
        </section>

        <footer className="card-public-foot">
          <span>Paylaşım kodu: {token || person.employeeNo}</span>
          <button
            type="button"
            className="card-copy-btn"
            onClick={() => {
              void navigator.clipboard?.writeText(shareUrl);
            }}
          >
            Linki kopyala
          </button>
        </footer>
      </article>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase('tr-TR');
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase('tr-TR');
}
