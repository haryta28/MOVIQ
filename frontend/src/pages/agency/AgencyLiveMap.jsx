import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { MapPin, Layers, Calendar, Filter } from 'lucide-react';
import useParallelApi from '../../hooks/useParallelApi';

export default function AgencyLiveMap() {
  const { results } = useParallelApi(['/tasks', '/analytics/overview']);
  const [tasks = [], analyticsRaw = {}] = results;
  const cityStats = analyticsRaw?.cityStats || [];
  const [selected, setSelected] = useState(null);

  const totalToday = tasks.filter(t => t.status !== 'pending').length;
  const flagged = tasks.filter(t => t.status === 'flagged').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Map"
        description="See every GPS-verified installation as it happens."
        actions={<div className="flex gap-2"><Button variant="outline"><Calendar className="h-4 w-4 mr-1" /> Today</Button><Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Filters</Button></div>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4"><div className="text-xs text-slate-500">Live Tasks</div><div className="text-2xl font-bold">{totalToday}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Approved today</div><div className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'approved').length}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Flagged</div><div className="text-2xl font-bold text-rose-600">{flagged}</div></Card>
        <Card className="p-4"><div className="text-xs text-slate-500">Cities live</div><div className="text-2xl font-bold">{cityStats.length}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="h-[520px] relative bg-gradient-to-br from-red-50 to-red-100">
            <div className="absolute inset-0 bg-grid opacity-40" />
            <div className="absolute inset-0">
              {tasks.slice(0, 22).map((t, i) => {
                const left = 5 + (i * 37) % 90;
                const top = 8 + ((i * 53) % 82);
                const color = t.status === 'approved' ? 'bg-emerald-500' : t.status === 'flagged' ? 'bg-rose-500' : t.status === 'submitted' ? 'bg-red-500' : 'bg-amber-500';
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <div className={`h-3 w-3 rounded-full ${color} ring-4 ring-white shadow-md group-hover:scale-150 transition`} />
                  </button>
                );
              })}
              <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 text-xs">
                <div className="font-semibold text-slate-800 mb-2 flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Legend</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Approved</div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-red-500" /> Submitted</div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> In progress</div>
                  <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-rose-500" /> Flagged</div>
                </div>
              </div>
              <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 text-xs">
                <div className="font-semibold text-slate-800">Live GPS view</div>
                <div className="text-slate-500 mt-0.5">{totalToday} pins · {flagged} flagged</div>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="font-semibold text-slate-900 mb-3">Selected pin</div>
            {selected ? (
              <div className="space-y-2 text-sm">
                <div><div className="text-xs text-slate-500">Task</div><div className="font-medium">{selected.taskCode}</div></div>
                <div><div className="text-xs text-slate-500">Unit · Media</div><div className="font-medium">{selected.unitCode} · {selected.mediaType}</div></div>
                <div><div className="text-xs text-slate-500">Address</div><div className="font-medium">{selected.address}</div></div>
                <div className="flex items-center gap-1 text-xs font-mono text-slate-500"><MapPin className="h-3 w-3" />{selected.lat}, {selected.lng}</div>
                <div><StatusBadge status={selected.status} /></div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-4">Click any pin to see task details.</div>
            )}
          </Card>

          <Card className="p-5">
            <div className="font-semibold text-slate-900 mb-3">Recent activity</div>
            <div className="space-y-3">
              {tasks.slice(0, 4).map(t => (
                <button key={t.id} onClick={() => setSelected(t)} className="w-full flex items-center gap-3 text-left p-2 rounded-md hover:bg-slate-50">
                  <div className="h-8 w-8 rounded-md bg-slate-100 flex items-center justify-center"><MapPin className="h-4 w-4 text-slate-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.unitCode}</div>
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
