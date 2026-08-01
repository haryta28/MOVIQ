import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { MapPin, Layers, Calendar, Filter, Car, CheckCircle2 } from 'lucide-react';
import useParallelApi from '../../hooks/useParallelApi';

const createMarkerIcon = (status) => {
  const colorMap = {
    approved:  '#10b981',
    submitted: '#3b82f6',
    flagged:   '#f43f5e',
    pending:   '#f59e0b',
    default:   '#6366f1',
  };
  const color = colorMap[status] || colorMap.default;
  return L.divIcon({
    className: 'custom-gps-pin',
    html: `<div style="background-color:${color};width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
};

// Normalise a task or vehicle submission into one common pin shape
const normalise = (item, source) => {
  if (source === 'task') {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lng);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return {
      id: item.id, lat, lng, status: item.status,
      label: item.unitCode || item.taskCode || '—',
      sub: item.mediaType || item.city || '',
      time: item.submittedAt, source: 'task', raw: item,
    };
  }
  if (source === 'submission') {
    const lat = parseFloat(item.gps?.lat ?? item.lat ?? 0);
    const lng = parseFloat(item.gps?.lng ?? item.lng ?? 0);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
    return {
      id: item.id, lat, lng, status: item.status || 'submitted',
      label: item.vehicle || '—',
      sub: `Driver: ${item.driverName || '—'}`,
      time: item.submittedAt, photos: item.photos || [],
      source: 'submission', raw: item,
    };
  }
  return null;
};

export default function AgencyLiveMap() {
  const { results } = useParallelApi(['/tasks', '/vehicle-submissions', '/analytics/overview']);
  const [tasks = [], submissions = [], analyticsRaw = {}] = results;
  const cityStats = analyticsRaw?.cityStats || [];
  const [selected, setSelected] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef([]);

  // Merge both sources, filter out pins with zero/missing GPS
  const pins = [
    ...tasks.map(t => normalise(t, 'task')),
    ...submissions.map(s => normalise(s, 'submission')),
  ].filter(Boolean);

  const approved = pins.filter(p => p.status === 'approved').length;
  const flagged  = pins.filter(p => p.status === 'flagged').length;

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const first  = pins[0];
    const center = first ? [first.lat, first.lng] : [20.5937, 78.9629];
    const zoom   = first ? 10 : 5;

    const map = L.map(mapContainerRef.current).setView(center, zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.length]);

  // Update markers whenever pins change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    markersRef.current = pins.map(p => {
      const marker = L.marker([p.lat, p.lng], { icon: createMarkerIcon(p.status) });
      marker.on('click', () => setSelected(p));
      marker.bindPopup(`
        <div style="font-family:sans-serif;font-size:12px;line-height:1.5;min-width:130px;">
          <div style="font-weight:700;color:#0f172a">${p.label}</div>
          <div style="color:#64748b;font-size:11px">${p.sub}</div>
          <div style="color:#3b82f6;font-size:10px;font-family:monospace;margin-top:3px">
            📍 ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}
          </div>
        </div>
      `);
      marker.addTo(map);
      return marker;
    });
  }, [pins]);

  const flyTo = (p) => {
    setSelected(p);
    mapRef.current?.setView([p.lat, p.lng], 14, { animate: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Map"
        description="GPS-verified vehicle submissions and completed tasks in real time."
        actions={
          <div className="flex gap-2">
            <Button variant="outline"><Calendar className="h-4 w-4 mr-1" /> Today</Button>
            <Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Filters</Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Total pins</div>
          <div className="text-2xl font-bold">{pins.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Approved</div>
          <div className="text-2xl font-bold text-emerald-600">{approved}</div>
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
        {/* Map */}
        <Card className="lg:col-span-2 p-0 overflow-hidden relative shadow-sm border border-slate-200">
          <div ref={mapContainerRef} className="h-[520px] w-full z-10" />

          {/* Legend */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-xs z-[500] border border-slate-200">
            <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" /> Legend
            </div>
            <div className="space-y-1">
              {[['#10b981','Approved'],['#3b82f6','Submitted'],['#f59e0b','Pending'],['#f43f5e','Flagged']].map(([c,l]) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{backgroundColor: c}} /> {l}
                </div>
              ))}
            </div>
          </div>

          {/* Top-left count badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 text-xs z-[500] border border-slate-200">
            <div className="font-semibold text-slate-800">Live GPS view</div>
            <div className="text-slate-500 mt-0.5">{pins.length} pins · {flagged} flagged</div>
          </div>

          {pins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-[600] text-slate-500 text-sm pointer-events-none">
              No GPS data yet — submissions with valid location will appear here.
            </div>
          )}
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          <Card className="p-5 shadow-sm border border-slate-200">
            <div className="font-semibold text-slate-900 mb-3">Selected pin</div>
            {selected ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {selected.source === 'submission'
                    ? <Car className="h-4 w-4 text-blue-500" />
                    : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  <span className="text-xs text-slate-500">
                    {selected.source === 'submission' ? 'WhatsApp submission' : 'Task'}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Vehicle / Unit</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selected.label}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Details</div>
                  <div className="text-slate-700 mt-0.5">{selected.sub}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">GPS</div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-blue-600 mt-0.5 bg-blue-50 px-2 py-1 rounded w-fit">
                    <MapPin className="h-3.5 w-3.5" />
                    {selected.lat.toFixed(6)}, {selected.lng.toFixed(6)}
                  </div>
                </div>
                {selected.photos?.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Photos</div>
                    <div className="flex gap-1">
                      {selected.photos.slice(0, 3).map((ph, i) => (
                        <a key={i} href={ph.url} target="_blank" rel="noreferrer">
                          <img src={ph.url} alt={ph.label} className="h-14 w-14 object-cover rounded border" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {selected.time && (
                  <div className="text-xs text-slate-400">{new Date(selected.time).toLocaleString()}</div>
                )}
                <div><StatusBadge status={selected.status} /></div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-4 text-center">Click any pin on the map to see details.</div>
            )}
          </Card>

          <Card className="p-5 shadow-sm border border-slate-200">
            <div className="font-semibold text-slate-900 mb-3">Recent activity</div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {pins.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-4">No submissions with GPS yet</div>
              ) : (
                pins.slice(0, 8).map(p => (
                  <button
                    key={p.id}
                    onClick={() => flyTo(p)}
                    className={`w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-slate-50 transition border ${selected?.id === p.id ? 'bg-slate-50 border-slate-200' : 'border-transparent'}`}
                  >
                    <div className="h-8 w-8 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 truncate">{p.label}</div>
                      <div className="text-xs text-slate-500 truncate">
                        {p.sub} · {p.time ? new Date(p.time).toLocaleDateString() : 'live'}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
