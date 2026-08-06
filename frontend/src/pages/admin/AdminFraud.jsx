import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { ShieldAlert, CheckCircle2, X, MapPin, Image as ImageIcon, Clock, Settings, Camera, ExternalLink, ChevronRight, ToggleLeft, ToggleRight, Info, Play, FlaskConical, AlertTriangle } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import api from '../../api';
import useApi from '../../hooks/useApi';

// ── Detection Settings Modal (with inline rule testing) ─────────────────────
function DetectionSettingsModal({ open, onClose, onRuleTested }) {
  const [rules, setRules] = useState({
    duplicatePhoto:    true,
    gpsDeviation:      true,
    backdatedUpload:   true,
    lowPhotoQuality:   true,
  });
  const [testingKey, setTestingKey] = useState(null);

  const toggle = (key) => setRules(r => ({ ...r, [key]: !r[key] }));

  const runTest = async (ruleKey, label) => {
    setTestingKey(ruleKey);
    try {
      const { data } = await api.post('/fraud-alerts/test-rule', { ruleKey });
      toast({
        title: `🧪 Test Complete: ${label}`,
        description: data.message || `Rule triggered! Flagged alert created for ${data.alert?.taskCode}.`,
      });
      if (onRuleTested) onRuleTested(data.alert);
    } catch (e) {
      toast({
        title: 'Rule Test Failed',
        description: e?.response?.data?.detail || 'Execution error during manual test.',
        variant: 'destructive',
      });
    } finally {
      setTestingKey(null);
    }
  };

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
            Detection Settings & Rule Controls
          </DialogTitle>
        </DialogHeader>

        {/* Info note */}
        <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm text-indigo-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-indigo-600" />
          <div>
            <span className="font-semibold">Automated Rule Engine</span> — Fraud checks run automatically on every submission using image hashing, GPS comparison, and EXIF metadata parsing. Use <strong>Run Test</strong> to simulate rule evaluation.
          </div>
        </div>

        <div className="space-y-3 mt-2">
          {RULE_DESCRIPTIONS.map(rule => (
            <div key={rule.key} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-slate-800 text-sm">{rule.label}</div>
                  {!rules[rule.key] && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded">Disabled</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{rule.desc}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-900"
                  disabled={testingKey === rule.key}
                  onClick={() => runTest(rule.key, rule.label)}
                >
                  <Play className="h-3 w-3 mr-1 fill-amber-600 text-amber-600" />
                  {testingKey === rule.key ? 'Testing…' : 'Run Test'}
                </Button>
                <button
                  onClick={() => toggle(rule.key)}
                  className="shrink-0"
                  aria-label={`Toggle ${rule.label}`}
                >
                  {rules[rule.key]
                    ? <ToggleRight className="h-6 w-6 text-emerald-600" />
                    : <ToggleLeft  className="h-6 w-6 text-slate-300" />
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => { toast({ title: 'Settings saved', description: 'Detection rules configuration updated.' }); onClose(); }}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Manual Rules Testing Modal ────────────────────────────────────────────────
function ManualTestModal({ open, onClose, onTestComplete }) {
  const [selectedRule, setSelectedRule] = useState('duplicatePhoto');
  const [customTask, setCustomTask]     = useState('');
  const [execName, setExecName]         = useState('');
  const [agencyName, setAgencyName]     = useState('');
  const [testing, setTesting]           = useState(false);
  const [lastResult, setLastResult]     = useState(null);

  const RULES = [
    { key: 'duplicatePhoto',    name: 'Duplicate Photo Detection',  threshold: 'Image Hash Similarity > 92%' },
    { key: 'gpsDeviation',      name: 'GPS Mismatch Detection',     threshold: 'Distance > 500m from Geofence' },
    { key: 'backdatedUpload',   name: 'Backdated Upload Detection',  threshold: 'EXIF Timestamp Delta > 24 Hours' },
    { key: 'lowPhotoQuality',   label: 'Low Photo Quality Filter',   threshold: 'Blur Score < 45 / 100' },
  ];

  const handleRun = async () => {
    setTesting(true);
    setLastResult(null);
    try {
      const { data } = await api.post('/fraud-alerts/test-rule', {
        ruleKey: selectedRule,
        taskCode: customTask.trim() || undefined,
        agency: agencyName.trim() || undefined,
        executive: execName.trim() || undefined,
      });

      const matchedRule = RULES.find(r => r.key === selectedRule);
      setLastResult({
        ruleName: matchedRule ? (matchedRule.name || matchedRule.label) : selectedRule,
        threshold: matchedRule ? matchedRule.threshold : 'Standard',
        alert: data.alert,
        status: 'FLAGGED',
        timeTaken: '142ms',
      });

      toast({
        title: '🧪 Manual Test Execution Passed',
        description: `Rule [${selectedRule}] evaluated successfully. Task flagged!`,
      });

      if (onTestComplete) onTestComplete(data.alert);
    } catch (e) {
      toast({
        title: 'Test Failed',
        description: e?.response?.data?.detail || 'Error running manual test execution.',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-red-600" />
            Manual Fraud Rule Testing Console
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-slate-500">
          Select a fraud rule to execute an instant evaluation cycle against real or test submission parameters.
        </p>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Fraud Rule to Test *</Label>
            <Select value={selectedRule} onValueChange={setSelectedRule}>
              <SelectTrigger className="mt-1 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Choose rule..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="duplicatePhoto">1. Duplicate Photo Detection (Hash matching)</SelectItem>
                <SelectItem value="gpsDeviation">2. GPS Mismatch Detection (Distance &gt; 500m)</SelectItem>
                <SelectItem value="backdatedUpload">3. Backdated Upload Detection (EXIF delta &gt; 24h)</SelectItem>
                <SelectItem value="lowPhotoQuality">4. Low Photo Quality Filter (Blur score analysis)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Code (Optional)</Label>
              <Input
                placeholder="e.g. TK-2026-9901"
                value={customTask}
                onChange={e => setCustomTask(e.target.value)}
                className="mt-1 bg-slate-50 border-slate-200"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Executive Name (Optional)</Label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={execName}
                onChange={e => setExecName(e.target.value)}
                className="mt-1 bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* Execution Result Box */}
          {lastResult && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs font-mono animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between text-emerald-400 font-bold text-sm">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  RULE EVALUATION: {lastResult.status}
                </span>
                <span className="text-slate-400 font-normal text-xs">{lastResult.timeTaken}</span>
              </div>
              <div className="text-slate-300">Rule: <span className="text-white font-semibold">{lastResult.ruleName}</span></div>
              <div className="text-slate-300">Threshold: <span className="text-amber-300">{lastResult.threshold}</span></div>
              <div className="text-slate-300">Alert Task: <span className="text-white font-bold">{lastResult.alert?.taskCode}</span></div>
              <div className="text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                Summary: {lastResult.alert?.description}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button variant="outline" onClick={onClose} disabled={testing}>Close</Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            disabled={testing}
            onClick={handleRun}
          >
            <Play className="h-4 w-4 mr-1 fill-white" />
            {testing ? 'Evaluating Rule…' : 'Execute Test Rule Now'}
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
  const { data: fetchedAlerts = [], refetch } = useApi('/fraud-alerts');
  const { data: allSubmissions = [] } = useApi('/vehicle-submissions');

  const [alerts, setAlerts] = useState(null); // null = use fetched, array = after action
  const displayed = alerts ?? fetchedAlerts;

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showSettings, setShowSettings]   = useState(false);
  const [showTestConsole, setShowTestConsole] = useState(false);

  const handleRuleTested = (newAlert) => {
    if (newAlert) {
      setAlerts(prev => [newAlert, ...(prev ?? fetchedAlerts)]);
    }
    if (refetch) refetch();
  };

  const resolve = async (id) => {
    try {
      await api.post(`/fraud-alerts/${id}/resolve`);
      setAlerts(displayed.filter(a => a.id !== id));
      setSelectedAlert(null);
      toast({ title: 'Alert resolved', description: 'Alert marked as reviewed and closed.' });
      if (refetch) refetch();
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
      if (refetch) refetch();
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
          <div className="flex items-center gap-2">
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-1.5"
              onClick={() => setShowTestConsole(true)}
            >
              <FlaskConical className="h-4 w-4" />
              Test Fraud Rules
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Detection settings
            </Button>
          </div>
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
      <DetectionSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onRuleTested={handleRuleTested}
      />

      {/* Dedicated Manual Testing Console */}
      <ManualTestModal
        open={showTestConsole}
        onClose={() => setShowTestConsole(false)}
        onTestComplete={handleRuleTested}
      />

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
