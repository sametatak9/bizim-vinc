import { useEffect, useRef, useState } from 'react';

export interface CranePin {
  id: string;
  code: string;
  name: string;
  status: 'sahada' | 'musait' | 'bakimda' | 'arizali';
  lat: number;
  lng: number;
  operator?: string;
  site?: string;
}

const DEMO_CRANES: CranePin[] = [
  { id: 'c1', code: 'V-204', name: 'Mobil Vinç', status: 'sahada', lat: 40.9923, lng: 29.1244, operator: 'Mehmet Kaya', site: 'Ataşehir' },
  { id: 'c2', code: 'V-118', name: 'Teleskopik', status: 'sahada', lat: 40.3522, lng: 27.9767, operator: 'Ali Demir', site: 'Bandırma' },
  { id: 'c3', code: 'V-302', name: 'Sepetli', status: 'musait', lat: 41.0255, lng: 29.1695, operator: 'Elif Yılmaz', site: 'Çekmeköy' },
  { id: 'c4', code: 'V-087', name: 'Mobil Vinç', status: 'sahada', lat: 38.7995, lng: 26.9700, operator: 'Can Özkan', site: 'Aliağa' },
  { id: 'c5', code: 'V-155', name: 'Mobil Vinç', status: 'bakimda', lat: 41.0082, lng: 28.9784, operator: '—', site: 'Merkez depo' },
  { id: 'c6', code: 'V-210', name: 'Teleskopik', status: 'arizali', lat: 40.9900, lng: 29.0500, operator: '—', site: 'Kartal' },
  { id: 'c7', code: 'V-221', name: 'Mobil Vinç', status: 'sahada', lat: 41.015, lng: 28.965, operator: 'Burak Şen', site: 'Beşiktaş' },
  { id: 'c8', code: 'V-133', name: 'Sepetli', status: 'sahada', lat: 40.978, lng: 29.08, operator: 'Zeynep Arslan', site: 'Kadıköy' },
  { id: 'c9', code: 'V-176', name: 'Teleskopik', status: 'musait', lat: 41.06, lng: 28.85, operator: 'Hakan Çelik', site: 'Başakşehir' },
  { id: 'c10', code: 'V-198', name: 'Mobil Vinç', status: 'sahada', lat: 40.92, lng: 29.15, operator: 'Serkan Aydın', site: 'Maltepe' },
  { id: 'c11', code: 'V-240', name: 'Mobil Vinç', status: 'bakimda', lat: 41.04, lng: 29.02, operator: '—', site: 'Sarıyer' },
  { id: 'c12', code: 'V-101', name: 'Sepetli', status: 'sahada', lat: 40.88, lng: 29.22, operator: 'Ayşe Demir', site: 'Pendik' },
];

const STATUS_COLOR: Record<CranePin['status'], string> = {
  sahada: '#15803d',
  musait: '#64748b',
  bakimda: '#d97706',
  arizali: '#dc2626',
};

const STATUS_LABEL: Record<CranePin['status'], string> = {
  sahada: 'Sahada',
  musait: 'Müsait',
  bakimda: 'Bakımda',
  arizali: 'Arızalı',
};

declare global {
  interface Window {
    L?: any;
  }
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      return;
    }
    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Leaflet yüklenemedi'));
    document.body.appendChild(script);
  });
}

export default function CraneMap({ height = 440 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<CranePin | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const L = await loadLeaflet();
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          center: [40.95, 29.0],
          zoom: 9,
          scrollWheelZoom: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        DEMO_CRANES.forEach((crane) => {
          const color = STATUS_COLOR[crane.status];
          const icon = L.divIcon({
            className: '',
            html: `<div style="
              width:28px;height:28px;border-radius:50%;
              background:${color};border:3px solid #fff;
              box-shadow:0 2px 8px rgba(0,0,0,.35);
              display:flex;align-items:center;justify-content:center;
              color:#fff;font-size:10px;font-weight:700;
            ">${crane.code.replace('V-', '')}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          const marker = L.marker([crane.lat, crane.lng], { icon }).addTo(map);
          marker.bindPopup(
            `<strong>${crane.code}</strong><br/>${crane.name}<br/>${STATUS_LABEL[crane.status]}<br/>${crane.operator ?? ''} · ${crane.site ?? ''}`
          );
          marker.on('click', () => setSelected(crane));
        });

        mapRef.current = map;
        setReady(true);
        setTimeout(() => map.invalidateSize(), 100);
      } catch (e) {
        setError('Harita yüklenemedi. İnternet bağlantısını kontrol edin.');
      }
    }

    init();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="panel" data-testid="panel-crane-map" style={{ overflow: 'hidden' }}>
      <div className="panel-head">
        <div>
          <h2 className="panel-title">Saha haritası</h2>
          <p className="panel-subtitle">Komuta haritası · 12 canlı nokta · OpenStreetMap</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11 }}>
          {(Object.keys(STATUS_COLOR) as CranePin['status'][]).map((s) => (
            <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: STATUS_COLOR[s],
                }}
              />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div
          ref={containerRef}
          style={{ height, width: '100%', background: 'hsl(var(--muted))' }}
          data-testid="map-container"
        />
        {!ready && !error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'hsl(var(--muted) / 0.7)',
              fontSize: 13,
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            Harita hazırlanıyor…
          </div>
        )}
        {error && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'hsl(var(--muted))',
              fontSize: 13,
              color: 'hsl(var(--destructive))',
              padding: 20,
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}
      </div>

      {selected && (
        <div
          style={{
            padding: '12px 20px 16px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong>{selected.code}</strong> · {selected.name}
            <div style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
              {STATUS_LABEL[selected.status]} · {selected.operator} · {selected.site}
            </div>
          </div>
          <button className="date-control" type="button" onClick={() => setSelected(null)}>
            Kapat
          </button>
        </div>
      )}
    </div>
  );
}
