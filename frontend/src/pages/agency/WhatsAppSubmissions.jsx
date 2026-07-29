import React, { useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { MessageSquare, MapPin, Clock, Car, User, Phone, CheckCircle, AlertCircle, Camera, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import useApi from '../../hooks/useApi';
import api from '../../api';
import { toast } from '../../hooks/use-toast';

const statusColor = {
  submitted: 'bg-amber-100 text-amber-700 border-amber-200',
  approved:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  flagged:   'bg-red-100 text-red-700 border-red-200',
};

export default function WhatsAppSubmissions() {
  const { data: submissions = [], refetch } = useApi('/vehicle-submissions');
  const [selected, setSelected]   = useState(null);
  const [updating, setUpdating]   = useState(false);
  const [filter, setFilter]       = useState('all');

  const filtered = filter === 'all'
    ? submissions
    : submissions.filter(s => s.status === filter);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      await api.patch(`/vehicle-submissions/${id}`, { status });
      toast({ title: status === 'approved' ? '✅ Approved' : '🚩 Flagged', description: `Submission ${status}.` });
      setSelected(null);
      if (refetch) refetch();
    } catch {
      toast({ title: 'Error', description: 'Could not update status.' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Submissions"
        description="Vehicle branding proofs submitted by field executives via WhatsApp bot."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-sm text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {submissions.length} total
            </div>
          </div>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'submitted', 'approved', 'flagged'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
              filter === f
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <div className="text-slate-500 font-medium">No submissions yet</div>
          <div className="text-slate-400 text-sm mt-1">
            Submissions will appear here when field executives send proofs via WhatsApp.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card
              key={s.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow border hover:border-slate-300"
              onClick={() => setSelected(s)}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Car className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 font-mono">{s.vehicle}</div>
                    <div className="text-xs text-slate-400">{s.id}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColor[s.status] || statusColor.submitted}`}>
                  {s.status}
                </span>
              </div>

              {/* Driver info */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {s.driverName}
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  {s.driverPhone}
                </div>
                {s.gps && (s.gps.lat !== 0 || s.gps.lng !== 0) && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {Number(s.gps.lat).toFixed(4)}, {Number(s.gps.lng).toFixed(4)}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Camera className="h-3 w-3" />
                  {(s.photos || []).length} / 3 photos
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="font-mono text-xl">{selected.vehicle}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusColor[selected.status] || statusColor.submitted}`}>
                    {selected.status}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 mt-2">
                {/* Left: Details */}
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Driver</div>
                    <div className="font-semibold">{selected.driverName}</div>
                    <div className="text-sm text-slate-500">{selected.driverPhone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">GPS Location</div>
                    {selected.gps && (selected.gps.lat !== 0 || selected.gps.lng !== 0) ? (
                      <>
                        <div className="text-sm font-mono">
                          {Number(selected.gps.lat).toFixed(6)}, {Number(selected.gps.lng).toFixed(6)}
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${selected.gps.lat},${selected.gps.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" /> Open in Google Maps
                        </a>
                      </>
                    ) : <div className="text-sm text-slate-400">Not captured</div>}
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Submitted At</div>
                    <div className="text-sm">{selected.submittedAt ? new Date(selected.submittedAt).toLocaleString('en-IN') : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Fraud Check</div>
                    <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> {selected.fraudCheck || 'passed'}
                    </div>
                  </div>
                </div>

                {/* Right: Photos */}
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Photos ({(selected.photos || []).length}/3)</div>
                  {(selected.photos || []).length === 0 ? (
                    <div className="text-sm text-slate-400">No photos attached</div>
                  ) : (
                    <div className="space-y-2">
                      {(selected.photos || []).map((p, i) => (
                        <a
                          key={i}
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                          />
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <Camera className="h-3 w-3" /> {p.label}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selected.status !== 'approved' && (
                <div className="flex gap-3 mt-4 pt-4 border-t">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'approved')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    disabled={updating}
                    onClick={() => updateStatus(selected.id, 'flagged')}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" /> Flag
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
