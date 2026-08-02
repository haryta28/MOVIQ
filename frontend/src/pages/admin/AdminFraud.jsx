import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { ShieldAlert, CheckCircle2, X, MapPin, Image as ImageIcon, Clock, Settings, Camera, ExternalLink, ChevronRight, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import api from '../../api';
import useApi from '../../hooks/useApi';

// ── Detection Settings Modal ─────────────────────────────────────────────────
function DetectionSettingsModal({ open, onClose }) {
  const [rules, setRules] = useState({
    duplicatePhoto:    true,
    gpsDeviation:      true,
    backdatedUpload:   true,
    lowPhotoQuality:   true,
  });

  const toggle = (key) => setRules(r => ({ ...r, [key]: !r[key] }));

  const RULE_DESCRIPTIONS = [
    { key: 'duplicatePhoto',    label: 'Duplicate Photo Detection',  desc: 'Flags when the same image hash is submitted across multiple locations or entries.' },
    { key: 'gpsDeviation',      label: 'GPS Mismatch Detection',     desc: 'Alerts when the submitted GPS location deviates more than 500m from the assigned area.' },
    { key: 'backdatedUpload',   label: 'Backdated Upload Detection',  desc: 'Checks photo EXIF timestamp against the submission time. Flags if more than 24h apart.' },
    { key: 'lowPhotoQuality',   label: 'Low Photo Quality Filter',   desc: 'Uses blur and brightness analysis to flag unverifiable installation photos.' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-slate-600" />
            Detection Settings
          </DialogTitle>
        </DialogHeader>

        {/* Info note */}
        <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600" />
          <div>
            <span className="font-semibold">Automated Rule Engine</span> — Fraud checks run automatically on every WhatsApp submission using image hashing, GPS comparison, and EXIF metadata parsing.
          </div>
        </div>

        <div className="space-y-3 mt-2">
          {RULE_DESCRIPTIONS.map(rule => (
            <div key={rule.key} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
              <div className="flex-1">
                <div className="font-medium text-slate-800 text-sm">{rule.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{rule.desc}</div>
              </div>
              <button
                onClick={() => toggle(rule.key)}
                className="shrink-0 mt-0.5"
                aria-label={`Toggle ${rule.label}`}
              >
                {rules[rule.key]
                  ? <ToggleRight className="h-6 w-6 text-emerald-600" />
                  : <ToggleLeft  className="h-6 w-6 text-slate-300" />
                }
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => { toast({ title: 'Settings saved', description: 'Detection rules updated.' }); onClose(); }}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Alert Detail Modal (shows related media submissions) ──────────────────────
function AlertDetailModal({ alert, allSubmissions, onResolve, onDismiss, onClose }) {
  const [updating, setUpdating] = useState(false);

  if (!alert) return null;

  // Match submissions by executive name or phone
  const execName = (alert.executive || '').toLowerCase();
  const related = allSubmissions.filter(s =>
    (s.driverName || '').toLowerCase() === execName ||
    (s.vehicle || '').toLowerCase().includes(execName)
  ).slice(0, 6);

  const handleAction = async (action) => {
    setUpdating(true);
    await action();
    setUpdating(false);
  };

  return (
    <Dialog open={!!alert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className={`h-2.5 w-2.5 rounded-full ${alert.severity === 'high' ? 'bg-rose-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'}`} />
            {alert.type}
            <StatusBadge status={alert.severity} />
            <span className="text-xs font-normal text-slate-500">· {alert.taskCode}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Alert details */}
        <div className="grid grid-cols-2 gap-4 text-sm mt-1">
          <div className="col-span-2 p-3 bg-rose-50 rounded-lg border border-rose-100 text-rose-800">
            {alert.description}
          </div>
          <div><div className="text-xs text-slate-400 uppercase tracking-wide">Agency</div><div className="font-medium mt-0.5">{alert.agency}</div></div>
          <div><div className="text-xs text-slate-400 uppercase tracking-wide">Executive</div><div className="font-medium mt-0.5">{alert.executive}</div></div>
          <div><div className="text-xs text-slate-400 uppercase tracking-wide">Detected</div><div className="font-medium mt-0.5">{alert.detectedAt}</div></div>
          <div><div className="text-xs text-slate-400 uppercase tracking-wide">Task Code</div><div className="font-mono font-medium mt-0.5">{alert.taskCode}</div></div>
        </div>

        {/* Related submissions */}
        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Related Media Submissions
            {related.length === 0 && <span className="text-xs font-normal text-slate-400">(none found)</span>}
          </div>
          {related.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm border border-dashed border-slate-200 rounded-lg">
              No matching WhatsApp submissions found for this executive.
              <br />
              <span className="text-xs">Submissions are matched by driver name.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {related.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                  {(s.photos || []).length > 0 ? (
                    <img src={s.photos[0].url} alt="proof" className="h-14 w-14 rounded-lg object-cover border shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                      <Camera className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-slate-900">{s.vehicle}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Driver: {s.driverName} · {s.driverPhone}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.submittedAt ? new Date(s.submittedAt).toLocaleString('en-IN') : '—'}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-slate-500">{(s.photos||[]).length}/3 photos</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 border-slate-200 text-slate-600"
            disabled={updating}
            onClick={() => handleAction(() => onDismiss(alert.id))}
          >
            <X className="h-4 w-4 mr-2" /> Dismiss
          </Button>
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={updating}
            onClick={() => handleAction(() => onResolve(alert.id))}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" /> Mark as Resolved
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminFraud() {
  const location = useLocation();
  const { data: fetchedAlerts = [] } = useApi('/fraud-alerts');
  const { data: allSubmissions = [] } = useApi('/vehicle-submissions');

  const [alerts, setAlerts] = useState(null); // null = use fetched, array = after action
  const displayed = alerts ?? fetchedAlerts;

  const [selectedAlert, setSelectedAlert]     = useState(null);
  const [showSettings, setShowSettings]       = useState(false);

  const resolve = async (id) => {
    try {
      await api.post(`/fraud-alerts/${id}/resolve`);
      setAlerts(displayed.filter(a => a.id !== id));
      setSelectedAlert(null);
      toast({ title: 'Alert resolved', description: 'Alert marked as reviewed and closed.' });
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  const dismiss = async (id) => {
    try {
      await api.post(`/fraud-alerts/${id}/resolve`);
      setAlerts(displayed.filter(a => a.id !== id));
      setSelectedAlert(null);
      toast({ title: 'Alert dismissed', description: 'Alert has been dismissed.' });
    } catch (e) {
      toast({ title: 'Failed', description: e?.response?.data?.detail || 'Try again.' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud & Anomaly Detection"
        description="Automated checks catch duplicate photos, GPS mismatches, and backdated uploads on every submission."
        actions={
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Detection settings
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Open alerts</div>
          <div className="text-3xl font-bold text-rose-600 mt-1">{displayed.length}</div>
          <div className="text-xs text-slate-500 mt-1">Requires review</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Resolved (7d)</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">
            {fetchedAlerts.filter(a => a.status === 'resolved').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Reviewed and closed</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Fraud attempts blocked</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">
            {fetchedAlerts.filter(a => a.status === 'resolved').length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Realtime protection</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Savings (est.)</div>
          <div className="text-3xl font-bold text-red-600 mt-1">
            ₹ {((fetchedAlerts.filter(a => a.status === 'resolved').length * 45000) / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-slate-500 mt-1">Prevented losses</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4 px-2">
          <ShieldAlert className="h-4 w-4 text-slate-500" />
          <div className="font-semibold text-slate-900">Live alerts</div>
          <span className="text-xs text-slate-400 ml-1">— click an alert to review its media submissions</span>
        </div>
        <div className="space-y-3">
          {displayed.map(a => (
            <div
              key={a.id}
              onClick={() => setSelectedAlert(a)}
              className={`flex items-start gap-4 p-4 rounded-lg border transition cursor-pointer ${
                location.state?.highlightAlertId === a.id
                  ? 'border-rose-400 bg-rose-50/30 ring-2 ring-rose-500/20 shadow-md scale-[1.01]'
                  : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${a.severity === 'high' ? 'bg-rose-50 text-rose-600' : a.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                {a.type.includes('GPS') ? <MapPin className="h-5 w-5" /> : a.type.includes('Photo') ? <ImageIcon className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-900">{a.type}</span>
                  <StatusBadge status={a.severity} />
                  <span className="text-xs text-slate-500">· {a.taskCode}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{a.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>Agency: <span className="font-medium text-slate-700">{a.agency}</span></span>
                  <span>Executive: <span className="font-medium text-slate-700">{a.executive}</span></span>
                  <span>Detected: <span className="font-medium text-slate-700">{a.detectedAt}</span></span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="outline" onClick={() => dismiss(a.id)}><X className="h-3.5 w-3.5 mr-1" /> Dismiss</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resolve(a.id)}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve</Button>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 self-center" />
            </div>
          ))}
          {displayed.length === 0 && (
            <div className="py-10 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              <div className="font-medium text-slate-700">All clear!</div>
              <div className="text-sm text-slate-500">No active fraud alerts.</div>
            </div>
          )}
        </div>
      </Card>

      {/* Detection Settings Modal */}
      <DetectionSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />

      {/* Alert Detail + Media Review Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        allSubmissions={allSubmissions}
        onResolve={resolve}
        onDismiss={dismiss}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}
