import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Crane, CraneStatus } from '../types';

interface CraneMapProps {
  cranes: Crane[];
  onSelectCrane?: (crane: Crane) => void;
}

export const CraneMap: React.FC<CraneMapProps> = ({ cranes, onSelectCrane }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [statusFilter, setStatusFilter] = useState<'hepsi' | CraneStatus>('hepsi');

  const filteredCranes = cranes.filter((c) => {
    if (statusFilter === 'hepsi') return true;
    return c.status === statusFilter;
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center roughly over Istanbul/Marmara region where projects are located
      const map = L.map(mapContainerRef.current, {
        center: [40.75, 28.5],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersGroupRef.current = markersGroup;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Update markers when filteredCranes changes
  useEffect(() => {
    if (!markersGroupRef.current || !mapInstanceRef.current) return;

    markersGroupRef.current.clearLayers();

    const bounds = L.latLngBounds([]);

    filteredCranes.forEach((crane) => {
      const getMarkerColor = (status: CraneStatus) => {
        switch (status) {
          case 'sahada':
            return '#16a34a'; // green
          case 'musait':
            return '#2563eb'; // blue
          case 'bakimda':
            return '#d97706'; // amber
          case 'arizali':
            return '#dc2626'; // red
          default:
            return '#64748b';
        }
      };

      const color = getMarkerColor(crane.status);

      const customHtml = `
        <div style="
          background-color: ${color};
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: sans-serif;
          font-weight: bold;
          font-size: 11px;
        ">
          ${crane.code.replace('V-', '')}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-crane-pin',
        html: customHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -18],
      });

      const statusLabels: Record<CraneStatus, string> = {
        sahada: 'Sahada Çalışıyor',
        musait: 'Müsait (Depoda)',
        bakimda: 'Bakımda',
        arizali: 'Arızalı (Servis Bekliyor)',
      };

      const popupContent = `
        <div style="padding: 4px; font-family: system-ui, sans-serif; min-width: 180px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 15px; color: #14532d;">${crane.code}</strong>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${color}22; color: ${color}; font-weight: bold;">
              ${statusLabels[crane.status]}
            </span>
          </div>
          <div style="font-size: 12px; color: #374151; margin-bottom: 4px;">
            <strong>Tür:</strong> ${crane.type} (${crane.capacity})
          </div>
          ${crane.operator ? `<div style="font-size: 12px; color: #374151; margin-bottom: 4px;"><strong>Operatör:</strong> ${crane.operator}</div>` : ''}
          ${crane.site ? `<div style="font-size: 12px; color: #374151; margin-bottom: 4px;"><strong>Konum:</strong> ${crane.site}</div>` : ''}
          <div style="font-size: 11px; color: #6b7280; margin-top: 6px;">
            Son Servis: ${crane.lastService}
          </div>
        </div>
      `;

      const marker = L.marker([crane.lat, crane.lng], { icon: customIcon });
      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onSelectCrane) onSelectCrane(crane);
      });

      markersGroupRef.current?.addLayer(marker);
      bounds.extend([crane.lat, crane.lng]);
    });

    // Fit bounds if we have points
    if (filteredCranes.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [filteredCranes, onSelectCrane]);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Map Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-emerald-50/70 border-b border-emerald-100 text-xs">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-emerald-900 mr-1">Filtrele:</span>
          {(['hepsi', 'sahada', 'musait', 'bakimda', 'arizali'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2 py-1 rounded-md font-medium transition-all ${
                statusFilter === st
                  ? 'bg-emerald-700 text-white font-bold shadow-xs'
                  : 'bg-white text-gray-700 hover:bg-emerald-100/50 border border-emerald-200'
              }`}
            >
              {st === 'hepsi'
                ? 'Tümü'
                : st === 'sahada'
                ? 'Sahada'
                : st === 'musait'
                ? 'Müsait'
                : st === 'bakimda'
                ? 'Bakımda'
                : 'Arızalı'}
            </button>
          ))}
        </div>
        <div className="text-emerald-800 font-medium">
          {filteredCranes.length} vinç haritada gösteriliyor
        </div>
      </div>

      {/* Actual Map Container */}
      <div
        ref={mapContainerRef}
        data-testid="map-container"
        className="w-full flex-1 z-0 relative"
        style={{ minHeight: '380px' }}
      />
    </div>
  );
};
