export type GpsProvider = 'manual' | 'nav_api' | 'vakif_telematics';

export interface GpsPosition {
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  recordedAt: string;
  provider: GpsProvider;
  externalVehicleId?: string;
}

export interface GpsProxyConfig {
  proxyUrl?: string;
  provider: GpsProvider;
}

/**
 * Browser-safe GPS client. Provider credentials must stay in a Supabase Edge
 * Function/server secret; only the proxy URL is exposed to the browser.
 */
export function createGpsClient(config: GpsProxyConfig) {
  const request = async <T>(path: string): Promise<T> => {
    if (!config.proxyUrl) throw new Error('GPS proxy adresi henüz tanımlanmadı.');
    const response = await fetch(`${config.proxyUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`GPS proxy ${response.status} döndürdü.`);
    return response.json() as Promise<T>;
  };
  return {
    getPositions: (vehicleIds?: string[]) => request<GpsPosition[]>(`positions${vehicleIds?.length ? `?vehicleIds=${encodeURIComponent(vehicleIds.join(','))}` : ''}`),
    getPosition: (vehicleId: string) => request<GpsPosition>(`vehicles/${encodeURIComponent(vehicleId)}/position`),
  };
}

export const GPS_ENV_KEYS = { provider: 'VITE_GPS_PROVIDER', proxyUrl: 'VITE_GPS_PROXY_URL' } as const;
