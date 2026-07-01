import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { Camera, MapPin, Clock, Download, X } from 'lucide-react';
import { tasks } from '../../mock/mock';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent } from '../../components/ui/dialog';

const gradients = [
  'from-orange-400 to-rose-500',
  'from-red-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-red-500 to-blue-500',
];

export default function AgencyProofs() {
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  const proofs = tasks.filter(t => t.photos > 0 && (status === 'all' || t.status === status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Proofs Gallery"
        description="Every photo is GPS-tagged, timestamped, and fraud-checked."
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-1" /> Download all</Button>}
      />

      <Card className="p-4">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All proofs</SelectItem>
              <SelectItem value="submitted">Pending review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto text-sm text-slate-500">{proofs.length} media proofs</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {proofs.slice(0, 20).map((t, i) => (
            <div key={t.id} className="group cursor-pointer" onClick={() => setSelected(t)}>
              <div className={`aspect-square rounded-lg bg-gradient-to-br ${gradients[i % gradients.length]} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
                <div className="absolute top-2 left-2"><StatusBadge status={t.status} /></div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-xs">
                  <div className="flex items-center gap-1 opacity-90"><MapPin className="h-3 w-3" />{t.city}</div>
                  <div className="font-semibold mt-0.5">{t.unitCode}</div>
                </div>
                <div className="absolute top-2 right-2 flex items-center gap-1 text-white text-xs bg-black/30 rounded px-1.5 py-0.5">
                  <Camera className="h-3 w-3" />{t.photos}
                </div>
              </div>
              <div className="mt-2">
                <div className="text-sm font-medium text-slate-900 truncate">{t.taskCode}</div>
                <div className="text-xs text-slate-500 truncate">{t.address}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{t.submittedAt}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-3xl">
          {selected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`aspect-square rounded-lg bg-gradient-to-br ${gradients[0]} relative`}>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs opacity-80">{selected.city}</div>
                  <div className="text-xl font-bold">{selected.unitCode}</div>
                </div>
              </div>
              <div>
                <div className="font-mono text-xs text-slate-500">{selected.taskCode}</div>
                <div className="font-bold text-lg text-slate-900">{selected.mediaType} · {selected.unitCode}</div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-slate-400 mt-0.5" /><div><div className="font-medium">{selected.address}</div><div className="text-xs font-mono text-slate-500">Lat: {selected.lat}, Long: {selected.lng}</div></div></div>
                  <div className="flex items-start gap-2"><Clock className="h-4 w-4 text-slate-400 mt-0.5" /><div><div className="font-medium">{selected.submittedAt}</div><div className="text-xs text-slate-500">Verified via EXIF timestamp</div></div></div>
                  <div><div className="text-xs text-slate-500">Executive</div><div className="font-medium">{selected.assignedTo}</div></div>
                  <div><div className="text-xs text-slate-500">Status</div><StatusBadge status={selected.status} /></div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Approve</Button>
                  <Button variant="outline" className="flex-1">Request re-shoot</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
