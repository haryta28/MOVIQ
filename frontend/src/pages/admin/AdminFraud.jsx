import React from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader, StatusBadge } from '../../components/Shared';
import { ShieldAlert, CheckCircle2, X, MapPin, Image as ImageIcon, Clock } from 'lucide-react';
import { fraudAlerts } from '../../mock/mock';
import { toast } from '../../hooks/use-toast';

export default function AdminFraud() {
  const [alerts, setAlerts] = React.useState(fraudAlerts);

  const resolve = (id) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast({ title: 'Alert resolved', description: 'Alert marked as reviewed and closed.' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fraud & Anomaly Detection"
        description="AI-powered detection catches duplicate photos, GPS mismatches, and backdated uploads in real-time."
        actions={<Button variant="outline">Detection settings</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Open alerts</div>
          <div className="text-3xl font-bold text-rose-600 mt-1">{alerts.length}</div>
          <div className="text-xs text-slate-500 mt-1">Requires review</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Resolved (7d)</div>
          <div className="text-3xl font-bold text-emerald-600 mt-1">142</div>
          <div className="text-xs text-slate-500 mt-1">98% resolution rate</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Fraud attempts blocked</div>
          <div className="text-3xl font-bold text-slate-900 mt-1">1,284</div>
          <div className="text-xs text-slate-500 mt-1">All-time</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Savings (est.)</div>
          <div className="text-3xl font-bold text-indigo-600 mt-1">₹ 42L</div>
          <div className="text-xs text-slate-500 mt-1">Prevented losses</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4 px-2">
          <ShieldAlert className="h-4 w-4 text-slate-500" />
          <div className="font-semibold text-slate-900">Live alerts</div>
        </div>
        <div className="space-y-3">
          {alerts.map(a => (
            <div key={a.id} className="flex items-start gap-4 p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition">
              <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${a.severity === 'high' ? 'bg-rose-50 text-rose-600' : a.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
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
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => resolve(a.id)}><X className="h-3.5 w-3.5 mr-1" /> Dismiss</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => resolve(a.id)}><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve</Button>
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="py-10 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-emerald-500" />
              <div className="font-medium text-slate-700">All clear!</div>
              <div className="text-sm text-slate-500">No active fraud alerts.</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
