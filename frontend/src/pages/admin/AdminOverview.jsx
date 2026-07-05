import React from 'react';
import { Card } from '../../components/ui/card';
import { KpiCard, StatusBadge, PageHeader, MiniBarChart, ProgressBar } from '../../components/Shared';
import { Building2, Megaphone, ListChecks, IndianRupee, ShieldAlert, MapPin, ArrowUpRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';
import useParallelApi from '../../hooks/useParallelApi';

export default function AdminOverview() {
  const { results } = useParallelApi([
    '/agencies', '/campaigns', '/fraud-alerts', '/analytics/overview',
  ]);
  const [
    agencies = [],
    campaigns = [],
    fraudAlerts = [],
    analytics = { monthlyStats: [], cityStats: [], kpis: {} }
  ] = results;

  const kpis = analytics.kpis || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Real-time snapshot of all agencies, campaigns, and field activity."
        actions={<Button variant="outline">Export report</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Active Agencies" value={kpis.activeAgencies || 0} icon={Building2} delta={12} accent="blue" />
        <KpiCard label="Live Campaigns" value={kpis.liveCampaigns || 0} icon={Megaphone} delta={8} accent="indigo" />
        <KpiCard label="Tasks Executed" value={(kpis.tasksExecuted || 0).toLocaleString()} icon={ListChecks} delta={22} accent="emerald" />
        <KpiCard label="MRR (₹)" value={`₹ ${((kpis.totalRevenue || 0)/100000).toFixed(1)}L`} icon={IndianRupee} delta={16} accent="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Monthly performance</h3>
              <p className="text-sm text-slate-500">Campaigns × Tasks × Revenue</p>
            </div>
            <Button variant="ghost" size="sm" className="text-red-600">Last 6 months</Button>
          </div>
          {analytics.monthlyStats.length > 0 && (
            <MiniBarChart data={analytics.monthlyStats} valueKey="tasks" labelKey="month" color="bg-gradient-to-t from-red-600 to-red-400" />
          )}
          <div className="grid grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-100">
            <div><div className="text-xs text-slate-500">Avg Campaigns/mo</div><div className="font-bold text-slate-900">58</div></div>
            <div><div className="text-xs text-slate-500">Total Tasks (6mo)</div><div className="font-bold text-slate-900">40.3K</div></div>
            <div><div className="text-xs text-slate-500">Growth</div><div className="font-bold text-emerald-600">+112%</div></div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Fraud alerts</h3>
              <p className="text-sm text-slate-500">Latest anomalies detected</p>
            </div>
            <Link to="/admin/fraud"><Button size="sm" variant="ghost" className="text-red-600">View all</Button></Link>
          </div>
          <div className="space-y-3">
            {fraudAlerts.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition">
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${a.severity === 'high' ? 'bg-rose-50 text-rose-600' : a.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{a.type}</span>
                    <StatusBadge status={a.severity} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{a.agency} · {a.taskCode}</div>
                </div>
                <div className="text-xs text-slate-400 shrink-0">{a.detectedAt}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Top campaigns</h3>
              <p className="text-sm text-slate-500">By completion progress</p>
            </div>
            <Link to="/admin/campaigns"><Button size="sm" variant="ghost" className="text-red-600">All campaigns <ArrowUpRight className="h-3.5 w-3.5 ml-1" /></Button></Link>
          </div>
          <div className="space-y-4">
            {campaigns.slice(0, 4).map(c => (
              <div key={c.id} className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-red-500 text-white flex items-center justify-center font-bold text-xs">
                  {c.brand?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-900 truncate">{c.title}</div>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 mb-1.5">{c.agency} · {c.city} · {c.mediaType}</div>
                  <ProgressBar value={c.completed} max={c.totalTasks} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">City coverage</h3>
              <p className="text-sm text-slate-500">Tasks executed by city</p>
            </div>
            <Button size="sm" variant="ghost" className="text-red-600">This month</Button>
          </div>
          <div className="space-y-3">
            {(analytics.cityStats || []).map(c => (
              <div key={c.city} className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-slate-400" />
                <div className="text-sm font-medium w-28">{c.city}</div>
                <div className="flex-1">
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${c.completion}%` }} />
                  </div>
                </div>
                <div className="text-xs text-slate-500 w-16 text-right">{c.tasks.toLocaleString()}</div>
                <div className="text-xs font-semibold text-slate-700 w-10 text-right">{c.completion}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
