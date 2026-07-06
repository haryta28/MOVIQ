import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { MapPin, Layers, Calendar, Filter } from 'lucide-react';
import useParallelApi from '../../hooks/useParallelApi';

// Custom colored divIcon pins to match task status
const createMarkerIcon = (status) => {
  const colorMap = {
    approved: '#10b981', // emerald
    submitted: '#ef4444', // red
    flagged: '#f43f5e', // rose
    default: '#f59e0b', // amber
  };
  const color = colorMap[status] || colorMap.default;
  return L.divIcon({
    className: 'custom-gps-pin',
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 5px rgba(0,0,0,0.3); transition: transform 0.15s ease;" class="hover:scale-125"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export default function AgencyLiveMap() {
  const { results } = useParallelApi(['/tasks', '/analytics/overview']);
  const [tasks = [], analyticsRaw = {}] = results;
  const cityStats = analyticsRaw?.cityStats || [];
  const [selected, setSelected] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const totalToday = tasks.filter(t => t.status !== 'pending').length;
  const flagged = tasks.filter(t => t.status === 'flagged').length;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center on India
    let center = [20.5937, 78.9629];
    let zoom = 5;

    // Center on the first task with valid coordinates
    const firstValid = tasks.find(t => t.lat && t.lng);
    if (firstValid) {
      const latVal = parseFloat(firstValid.lat);
      const lngVal = parseFloat(firstValid.lng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        center = [latVal, lngVal];
        zoom = 7;
      }
    }

    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapRef.current = map;

    // Add standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]); // Reinitialize if task count changes

  // Update Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const newMarkers = [];

    tasks.forEach(t => {
      const latVal = parseFloat(t.lat);
      const lngVal = parseFloat(t.lng);

      if (isNaN(latVal) || isNaN(lngVal)) return;

      const marker = L.marker([latVal, lngVal], {
        icon: createMarkerIcon(t.status),
      });

      marker.on('click', () => {
        setSelected(t);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 120px;">
          <div style="font-weight: bold; color: #0f172a;">${t.unitCode}</div>
          <div style="color: #64748b; font-size: 11px;">${t.mediaType}</div>
          <div style="color: #3b82f6; font-size: 10px; font-family: monospace; margin-top: 2px;">📍 ${latVal.toFixed(4)}, ${lngVal.toFixed(4)}</div>
        </div>
      `);

      marker.addTo(map);
      newMarkers.push(marker);
    });

    markersRef.current = newMarkers;
  }, [tasks]);

  const handleSelectTask = (t) => {
    setSelected(t);
    const map = mapRef.current;
    if (map) {
      const latVal = parseFloat(t.lat);
      const lngVal = parseFloat(t.lng);
      if (!isNaN(latVal) && !isNaN(lngVal)) {
        map.setView([latVal, lngVal], 13, { animate: true });
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Map"
        description="See every GPS-verified installation as it happens."
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><Calendar className="h-4 w-4 mr-1" /> Today</Button>
            <Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Live Tasks</div>
          <div className="text-2xl font-bold">{totalToday}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Approved today</div>
          <div className="text-2xl font-bold text-emerald-600">
            {tasks.filter(t => t.status === 'approved').length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Flagged</div>
          <div className="text-2xl font-bold text-rose-600">{flagged}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Cities live</div>
          <div className="text-2xl font-bold">{cityStats.length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden relative shadow-sm border border-slate-200">
          {/* Leaflet map container */}
          <div ref={mapContainerRef} className="h-[520px] w-full z-10" />

          {/* Floating overlays over map */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-xs z-[500] border border-slate-200">
            <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Legend
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white shadow-sm" /> Approved
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500 border border-white shadow-sm" /> Submitted
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 border border-white shadow-sm" /> In progress
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 border border-white shadow-sm" /> Flagged
              </div>
            </div>
          </div>

          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-xs z-[500] border border-slate-200">
            <div className="font-semibold text-slate-800">Live GPS view</div>
            <div className="text-slate-500 mt-0.5">{totalToday} pins · {flagged} flagged</div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5 shadow-sm border border-slate-200">
            <div className="font-semibold text-slate-900 mb-3">Selected pin</div>
            {selected ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Task Code</div>
                  <div className="font-medium text-slate-900 mt-0.5">{selected.taskCode}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Unit · Media Type</div>
                  <div className="font-medium text-slate-900 mt-0.5">{selected.unitCode} · {selected.mediaType}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Address</div>
                  <div className="font-medium text-slate-900 mt-0.5">{selected.address}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">GPS Coordinates</div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600 mt-0.5 bg-blue-50 px-2 py-1 rounded w-fit">
                    <MapPin className="h-3.5 w-3.5" />
                    {parseFloat(selected.lat).toFixed(6)}, {parseFloat(selected.lng).toFixed(6)}
                  </div>
                </div>
                <div className="pt-2">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">Click any pin on the map to see task details.</div>
            )}
          </Card>

          <Card className="p-5 shadow-sm border border-slate-200">
            <div className="font-semibold text-slate-900 mb-3">Recent activity</div>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {tasks.slice(0, 4).map(t => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTask(t)}
                  className={`w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-slate-50 transition border ${selected?.id === t.id ? 'bg-slate-50 border-slate-200' : 'border-transparent'}`}
                >
                  <div className="h-8 w-8 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{t.unitCode}</div>
                    <div className="text-xs text-slate-500 truncate">{t.city} · {t.submittedAt || 'live'}</div>
                  </div>
                  <StatusBadge status={t.status} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
