import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Search, MapPin, Filter, ChevronRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import api from '../../api';

export default function AgencyTasks() {
  const [tasks, setTasks] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [city, setCity] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => { try { const r = await api.get('/tasks'); setTasks(r.data); } catch (_) {} })();
  }, []);

  const cities = ['all', ...Array.from(new Set(tasks.map(t => t.city)))];

  const filtered = tasks.filter(t =>
    (status === 'all' || t.status === status) &&
    (city === 'all' || t.city === city) &&
    (t.taskCode.toLowerCase().includes(q.toLowerCase()) || (t.address||'').toLowerCase().includes(q.toLowerCase()) || (t.assignedTo||'').toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Track every unit-level task assigned to your field team."
        actions={<Button variant="outline"><Filter className="h-4 w-4 mr-1" /> Bulk assign</Button>}
      />

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search task code, address, executive..." value={q} onChange={e => setQ(e.target.value)} className="pl-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {cities.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All cities' : c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-slate-500">{filtered.length} tasks</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="py-3 px-3 font-medium">Task</th>
                <th className="py-3 px-3 font-medium">Unit</th>
                <th className="py-3 px-3 font-medium">City</th>
                <th className="py-3 px-3 font-medium">Media</th>
                <th className="py-3 px-3 font-medium">Executive</th>
                <th className="py-3 px-3 font-medium">Submitted</th>
                <th className="py-3 px-3 font-medium">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 30).map(t => (
                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(t)}>
                  <td className="py-3 px-3 font-mono text-xs text-slate-700">{t.taskCode}</td>
                  <td className="py-3 px-3 font-medium text-slate-900">{t.unitCode}</td>
                  <td className="py-3 px-3"><span className="inline-flex items-center gap-1 text-slate-700"><MapPin className="h-3 w-3 text-slate-400" />{t.city}</span></td>
                  <td className="py-3 px-3 text-slate-700">{t.mediaType}</td>
                  <td className="py-3 px-3 text-slate-700">{t.assignedTo}</td>
                  <td className="py-3 px-3 text-xs text-slate-500">{t.submittedAt || '—'}</td>
                  <td className="py-3 px-3"><StatusBadge status={t.status} /></td>
                  <td className="py-3 px-3"><ChevronRight className="h-4 w-4 text-slate-400" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Task {selected?.taskCode}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><div className="text-xs text-slate-500">Unit</div><div className="font-medium">{selected.unitCode}</div></div>
                <div><div className="text-xs text-slate-500">Media</div><div className="font-medium">{selected.mediaType}</div></div>
                <div><div className="text-xs text-slate-500">City</div><div className="font-medium">{selected.city}</div></div>
                <div><div className="text-xs text-slate-500">Status</div><StatusBadge status={selected.status} /></div>
                <div className="col-span-2"><div className="text-xs text-slate-500">Address</div><div className="font-medium">{selected.address}</div></div>
                <div><div className="text-xs text-slate-500">GPS</div><div className="font-mono text-xs">{selected.lat}, {selected.lng}</div></div>
                <div><div className="text-xs text-slate-500">Executive</div><div className="font-medium">{selected.assignedTo}</div></div>
              </div>
              {selected.photos > 0 && (
                <div>
                  <div className="text-xs text-slate-500 mb-2">Media proofs ({selected.photos})</div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: selected.photos }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 text-xs">Photo {i+1}</div>
                    ))}
                  </div>
                </div>
              )}
              {selected.flagReason && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-sm text-rose-700"><span className="font-semibold">Flagged:</span> {selected.flagReason}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
